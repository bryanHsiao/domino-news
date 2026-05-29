---
title: "Containerizing HCL Domino 9.0.1 Outside HCL's Official Scope — A Community PoC and 5 Pitfalls You'll Hit"
description: "HCL only ships container images for Domino 10.0.1 FP3 and newer — if you're still on 9.0.x and want to containerize for dev/test, migration rehearsal, or legacy preservation, the official path doesn't exist. This article walks through a community feasibility study: RHEL UBI 7.9 base, two-stage build, ~1.48 GB image that runs Domino 9.0.1 FP10, joins an existing Domino domain, and brings HTTP/NRPC/LDAP/IMAP/POP3/SMTP up cleanly. The PoC also documents 5 critical pitfalls HCL docs don't cover (Perl namespace bug / FP installer rejects -silent / J9 JVM heap too small / setup-complete marker uses the wrong variable / password-protected server.id stdin block), each with the actual error message and workaround. Full Dockerfile and troubleshooting live in the bryanHsiao/build-hcl-domino9-container repo."
pubDate: 2026-05-22T07:30:00+08:00
lang: en
slug: build-hcl-domino-9-container
tags:
  - "Domino Server"
  - "Container"
  - "Community"
sources:
  - title: "bryanHsiao/build-hcl-domino9-container — GitHub repo"
    url: "https://github.com/bryanHsiao/build-hcl-domino9-container"
  - title: "HCL FlexNet Operations Portal — installer download"
    url: "https://hclsoftware.flexnetoperations.com/"
  - title: "HCL-TECH-SOFTWARE/domino-container — official V10+ build tooling"
    url: "https://github.com/HCL-TECH-SOFTWARE/domino-container"
  - title: "shillem/domino-docker — earlier community reference"
    url: "https://github.com/shillem/domino-docker"
relatedJava: []
relatedSsjs: []
cover: "/covers/build-hcl-domino-9-container.webp"
coverStyle: "risograph"
---

## TL;DR

- **HCL only ships container images for Domino 10.0.1 FP3 and up** ([the previous post covered the two official paths](/en/posts/build-your-own-domino-container/)) — anyone still on 9.0.x is outside the official support scope
- A community PoC proves it's doable: **RHEL UBI 7.9 base, two-stage build, ~1.48 GB image** running Domino 9.0.1 FP10, joining an existing Domino domain, with HTTP / NRPC / LDAP / IMAP / POP3 / SMTP all coming up normally
- The PoC hit **5 pitfalls HCL docs don't mention**: Perl namespace bug / FP installer rejects `-silent` / J9 JVM heap too small / setup-complete marker uses the wrong variable / password-protected `server.id` stdin block
- Full Dockerfile + entrypoint + troubleshooting in the public [`bryanHsiao/build-hcl-domino9-container`](https://github.com/bryanHsiao/build-hcl-domino9-container) repo
- ⚠️ **Suitable for dev/test, migration rehearsal, legacy server preservation** — **not** a replacement for production bare-metal/VM; self-built images sit outside HCL's support scope

---

## Why would anyone containerize Domino 9?

"Who's still running Domino 9 in 2026?" — more people than you'd think.

The realistic scenarios:

- **App compatibility lockdown** — an internal XPages app or an ISV product is certified only against 9.0.x, and the customer hasn't finished the V10/V14 upgrade regression test
- **Migration rehearsal** — before going from 9 to 14, run a dry run in dev: real data, a containerized 9 server, verify NSF compat / template upgrade / Notes client behavior all hold up
- **Legacy server preservation** — historical workloads (compliance, audit, archived data from departed staff) need an environment that can still open old NSFs, without paying to keep a VM alive

The traditional answer is "keep a Domino 9 VM around" — but VM maintenance isn't cheap (OS patching, backups, host resources, IP planning). If you can move it into a container, you get the modern container workflow (image goes to a private registry, starts fast, stops fast, doesn't squat on host resources).

The catch: HCL doesn't give you an official V9 container image.

---

## Where HCL's line actually is

[The previous post](/en/posts/build-your-own-domino-container/) covered HCL's official container story from V10 onwards:

- **Path A** — download an official pre-built container image TAR from [My HCLSoftware Portal](https://my.hcltechsw.com/downloads/domino/domino) and `docker load` it
- **Path B** — use the open-source [`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container) build tooling to build your own

Both paths start at **Domino 10.0.1 FP3**. The entire **9.0.x line** is officially "unsupported but works" — no images, no build scripts, no docs.

If you want to containerize 9.x, the only remaining route is full self-build: write your own Dockerfile, handle Domino 9's silent installer, navigate the setup wizard, and troubleshoot corner cases that aren't documented anywhere.

The PoC below is a trace of walking that route end-to-end.

---

## PoC outcome

**Environment**:

- Host: Windows 11 + WSL2 (Ubuntu 24.04 isolated distro) + Docker Engine 29.5.2
- Base image: `registry.access.redhat.com/ubi7/ubi:7.9` (Red Hat ELS through 2028)
- Domino version: 9.0.1 base + Fix Pack 10
- Build: two-stage (builder → runtime) silent install + FP10 patch

**Output**:

```
REPOSITORY    TAG          IMAGE ID       SIZE
domino9       9.0.1fp10    a8b4c5d2e9f1   1.48GB
```

**Runtime validation** (via Notes Admin client running the remote setup wizard):

- ✅ Container went from first-run listen mode through the wizard, server registration complete
- ✅ Restart launched the daemon cleanly, HTTP responds 200 OK
- ✅ Joined an existing Domino domain (existing `cert.id` + pre-registered `server.id`)
- ✅ Tasks: HTTP / NRPC / LDAP / IMAP / POP3 / SMTP / Router / Replica all started normally
- ✅ Replicated databases from an existing production server successfully

**Verdict per 9.0.x sub-version** (excerpt — full table in the repo's feasibility report):

| Version | Verdict |
|---|---|
| 9.0 Social Edition (2013) | inferred-risky (forces RHEL 6 / 32-bit libraries) |
| 9.0.1 base | verified-buildable |
| 9.0.1 FP1 ~ FP9 | inferred-buildable |
| **9.0.1 FP10 (2018)** | **verified-buildable** — verified by this study on real hardware |

→ **Recommended baseline: 9.0.1 FP10 + Server IF7 or higher + RHEL UBI 7.9**

---

## 5 pitfalls you'll hit

For each: the symptom (terminal output), root cause, and the fix.

### Pitfall #1: UBI 7 doesn't ship `hostname`, install.pl crashes with a Perl namespace bug

`docker build` runs through to the silent install step, then suddenly dies with:

```
Undefined subroutine &DingDong::out called at install.pl line 65
```

**Why**: Domino 9's `install.pl` line 65 needs to call `hostname` and `clear`; UBI 7 minimal images don't ship the `hostname` package by default. `InitCmds()` detects the missing command and tries to call `out()` to report the error — but `out()` is defined in `package main::` while the call site is in `package DingDong;`, so Perl can't resolve it and dies with the cryptic message above.

**Fix**: add a `yum install` step to the Dockerfile:

```dockerfile
RUN yum install -y hostname ncurses procps-ng tar unzip
```

`hostname` solves the immediate line-65 problem; `ncurses` provides `clear` / `tput`; `procps-ng` / `tar` / `unzip` are common follow-on omissions the silent install also relies on.

---

### Pitfall #2: The FP installer **rejects** the `-silent` flag

Base 9.0.1 install runs ~7 minutes and finishes cleanly, then the FP10 install dies immediately:

```
Usage: install [-script <scriptfile>]
ERROR: unknown argument '-silent'
```

**Why**: the base installer accepts `-silent -options <file>`; the FP installer accepts only `-script <file>` and doesn't recognize `-silent`. Two different binaries with different argument specs — HCL never documented this in the same place.

**Fix**: for the FP install step, use `-script` without `-silent`, and set the environment variable that points at the base install:

```dockerfile
ENV NUI_NOTESDIR=/opt/ibm/domino
RUN cd /tmp/fp10 && ./install -script script.dat
```

---

### Pitfall #3: The bundled J9 JVM runs out of heap during the setup wizard

The container starts, you point Notes Admin client at `serversetup -remote <host>:8585` to run the wizard, and the Admin client returns a network error. Container log:

```
java/lang/OutOfMemoryError
```

**Why**: the 2013-era Domino 9 bundles IBM's J9 JVM, and the `serversetup` script launches it with only stack flags (`-ss512k -Xmso5M`) — **no heap upper bound** (`-Xmx`) at all. J9's default heap is ~64 MB, which isn't enough to load the wizard's Swing GUI classes. `JAVA_TOOL_OPTIONS` is ineffective with this J9 build (it doesn't honor it).

**Fix**: `sed`-patch the `serversetup` script line 168 in the Dockerfile to inject heap arguments:

```dockerfile
RUN sed -i 's|"$JAVA" |"$JAVA" -Xmx512m -Xms128m |' \
    /opt/ibm/domino/notes/latest/linux/serversetup
```

---

### Pitfall #4: The setup-complete marker is `Setup=`, not `ServerName=`

The setup wizard finishes, the container restarts, the entrypoint should just start the server — but it runs the wizard again.

**Why**: a lot of containerized Domino templates (including HCL's V10+ path) check `grep ServerName= notes.ini` to decide whether setup is done. **Domino 9 doesn't write `ServerName=` to `notes.ini` at all** — it writes `Setup=900100`, a version-code marker. An entrypoint looking for `ServerName=` will never find it, will always assume setup is incomplete, and will always drop back into listen mode.

**Fix**: change the detection to match `Setup=<digits>` instead:

```bash
if grep -qE "^Setup=[0-9]" "$NOTES_INI"; then
    exec "${DOMINO_HOME}/bin/server"
else
    exec "${DOMINO_HOME}/bin/server" -listen
fi
```

---

### Pitfall #5: A password-protected `server.id` blocks on stdin at startup

Setup wizard done, `docker restart` into normal mode, the container looks like it's up — but HTTP doesn't respond and CPU is at 0%. `docker logs`:

```
Enter password (press the Esc key to abort):
```

**Why**: the `server.id` was registered with a password, and Domino reads that password from stdin at startup. In `docker run -d` mode there's no interactive stdin, so the prompt blocks indefinitely.

**Fix**: have the entrypoint read the password from an environment variable and pipe it into the server's stdin:

```bash
printf '%s\n' "${DOMINO_ID_PASSWORD}" | "${DOMINO_HOME}/bin/server" &
```

At runtime:

```bash
docker run -d -e DOMINO_ID_PASSWORD='your-passphrase' ...
```

---

Full troubleshooting (including 4 other secondary pitfalls, complete log dumps, and the patch details) lives in the [repo's TROUBLESHOOTING.md](https://github.com/bryanHsiao/build-hcl-domino9-container/blob/main/TROUBLESHOOTING.md).

---

## Want to give it a spin?

What you need:

1. **HCL Domino 9 entitlement** + a **FlexNet Portal account** — download installers from [hclsoftware.flexnetoperations.com](https://hclsoftware.flexnetoperations.com/): `DOMINO_9.0.1_64_BIT_LIN_XS_EN.tar` (~834 MB) + `domino901FP10_linux64_x86.tar` (~441 MB)
2. **Linux host or WSL2** — Ubuntu 22.04/24.04, Debian 12, RHEL 9 all work
3. **Docker Engine 20.10+** (tested up to 29.x)
4. **~5 GB of disk space** + at least 2 GB RAM available to the container

Rough flow:

```bash
git clone https://github.com/bryanHsiao/build-hcl-domino9-container.git
cd build-hcl-domino9-container/dockerfiles/domino9.0.1-fp10-ubi7

# Drop the downloaded installers in
cp /path/to/DOMINO_9.0.1_64_BIT_LIN_XS_EN.tar .
cp /path/to/domino901FP10_linux64_x86.tar .

# Build (~10-12 min)
docker build -t domino9:9.0.1fp10 .

# Run (first-run listen mode, waiting for Notes Admin to connect)
docker volume create domino9-data
docker run -d --name domino9 --hostname domino9 \
  -p 1352:1352 -p 80:80 -p 8585:8585 \
  -v domino9-data:/local/notesdata domino9:9.0.1fp10
```

Detailed setup-wizard walkthrough and the "joining an existing domain" path are in [repo BUILD.md](https://github.com/bryanHsiao/build-hcl-domino9-container/blob/main/BUILD.md) and [ADDITIONAL-SERVER.md](https://github.com/bryanHsiao/build-hcl-domino9-container/blob/main/ADDITIONAL-SERVER.md).

---

## ⚠️ Boundaries to know before you go

This PoC is **not** a production replacement and is **not** inside HCL's official support scope. Explicit envelope:

- ✅ **Suitable for**: internal dev/test, dry-run rehearsal before a V14 migration, legacy data preservation (reading old NSFs)
- ❌ **Not suitable for**: replacing an existing production bare-metal/VM Domino 9 server (HCL 9.x EOM 2024-06, EOS 2026-06, and self-built images sit outside the support scope)
- ⚠️ **License**: the HCL Domino EULA doesn't explicitly prohibit container deployment, but doesn't explicitly endorse 9.x either; check your entitlement's PVU / Authorized User accounting with HCL Support
- ⚠️ **Distribution**: the built image contains Domino binaries — **do not push to public registries or share with anyone who doesn't already hold an entitlement**; private internal registry only
- ⚠️ **Issue reproduction**: if a self-built container hits a real bug, HCL Support requires reproduction on a certified bare-metal/VM platform before they'll take the case; keep a comparison environment handy

→ **The long-term direction is still to upgrade to [Domino 14.5.1 (Domino 2026)](/en/posts/hcl-domino-2026-release-highlights/) and switch to the official container path**; this PoC just gives a dev/test container option to "stuck on 9 for now" scenarios.

---

## Wrap-up

| Your scenario | Which path |
|---|---|
| Running Domino V10+ | [HCL's official V10+ container](/en/posts/build-your-own-domino-container/) (Path A pull / Path B build with HCL build script) |
| Still on 9.0.x, need dev/test or migration rehearsal | **This PoC** — [`bryanHsiao/build-hcl-domino9-container`](https://github.com/bryanHsiao/build-hcl-domino9-container) |
| 9.x and thinking about production containers | **Not recommended** — upgrade to V14 first, then follow the official path |

The 5 pitfalls (Perl namespace / FP installer flag / J9 heap / setup marker / `server.id` stdin) are all "docs don't mention it, you only know after you hit it" territory. This PoC bundles the trip hazards into a reproducible Dockerfile so the next person still stuck on V9 doesn't have to walk into them blind.

Full build scripts, Dockerfiles, troubleshooting, and operations docs all live in [`bryanHsiao/build-hcl-domino9-container`](https://github.com/bryanHsiao/build-hcl-domino9-container) — MIT license, PRs welcome, no SLA.
