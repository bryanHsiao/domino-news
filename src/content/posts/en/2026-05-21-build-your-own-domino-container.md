---
title: "HCL Domino Runs in Containers Too — Build Your Own Custom Image with HCL's Open-Source Tooling"
description: "HCL Domino has officially supported container deployment since V12, but HCL doesn't distribute pre-built images directly — it open-sources the build script on GitHub and asks you to use the interactive build.sh menu to pick which modules you want (Domino / Traveler / Verse / Nomad / REST-API / Leap / Domino IQ / OnTime / C-API SDK / LP) to build your own container image. This article walks through the design philosophy of the official domino-container project, how customizable build.sh really is, typical deployment scenarios, and how to get started."
pubDate: 2026-05-21T07:30:00+08:00
lang: en
slug: build-your-own-domino-container
tags:
  - "Domino Server"
  - "DevOps"
  - "Container"
  - "News"
sources:
  - title: "HCL-TECH-SOFTWARE/domino-container — GitHub"
    url: "https://github.com/HCL-TECH-SOFTWARE/domino-container"
  - title: "Domino Container project documentation"
    url: "https://opensource.hcltechsw.com/domino-container/"
  - title: "My HCLSoftware Portal — installer download"
    url: "https://my.hcltechsw.com/"
relatedJava: []
relatedSsjs: []
cover: "/covers/build-your-own-domino-container.png"
coverStyle: "low-poly-3d"
---

## TL;DR

- **HCL Domino has officially supported container deployment since V12** — the current flagship is Domino 14.5
- But [HCL doesn't distribute container images directly](https://github.com/HCL-TECH-SOFTWARE/domino-container) — it open-sources the build script and asks you to **build your own** (the reasoning blends licensing with customization)
- The official `build.sh` is an **interactive menu**: tick the modules you want (Domino / Traveler / Verse / Nomad / REST-API / Leap / Domino IQ / OnTime / C-API SDK / Language Pack) plus add-ons (Prometheus, Borg Backup, nshmailx) → 5-8 minutes to a custom image
- Base OS defaults to Red Hat Enterprise Linux 10 UBI; supports Docker / Podman / Rancher Desktop / Kubernetes / OpenShift
- Typical scenarios: dev / lab, CI testing, production (with K8s)
- Want to try: grab installers from [My HCLSoftware Portal](https://my.hcltechsw.com/) (you already have an account if you're on maintenance) + Docker/Podman + ~10GB disk

---

## Is "Domino on Container" really a thing?

The "Domino only runs on bare-metal servers" image is out of date.

Since **Domino V12** (under HCL's stewardship), Domino server has been officially supported as a container deployment. By today's **Domino 14.5** that path is well-trodden — community members run containers for dev environments, CI, even production (with Kubernetes or OpenShift).

But there's an interesting design choice baked in: **HCL doesn't publish a `docker pull hclcom/domino` on Docker Hub for you**.

The [Domino Container project docs](https://opensource.hcltechsw.com/domino-container/) put it plainly: the project uses HCL's official web-kit installers, downloaded from the My HCLSoftware Portal. In other words, HCL ships **"how to build"** rather than **"the built artifact"**. Why?

---

## Why a build script instead of pre-built images?

A few angles:

**1. License compliance + installer provenance —** Domino web-kit installers come from [My HCLSoftware Portal](https://my.hcltechsw.com/), gated by maintenance. Redistributing a built image gets messy on the compliance side. If you build your own, you use your own licensed installer — the legal line stays clean.

**2. Customization varies wildly —** different customers need very different combos:

- Mail / app server only → plain Domino
- Web client → Domino + Verse
- Mobile push → Domino + Traveler + Nomad
- Modern app dev → Domino + REST-API + Leap
- AI → Domino + Domino IQ

A single "everything" image would be huge (each module is hundreds of MB) and have a wide attack surface. Building your own means you ship only what you need.

**3. Patch flow stays fresh —** build today, today's fixpack is inside. Pre-built images always trail the latest hotfix; self-build keeps the supply chain in your hands.

---

## How customizable is build.sh?

`build.sh` looks like this when you launch it:

![HCL Domino Container build.sh main menu](/domino-news/post-images/domino-container-buildsh-menu.png)

The **products** on the main menu:

| Code | Module | What it does |
|---|---|---|
| (D) | HCL Domino | The server itself |
| (O) | OnTime | Group calendar |
| (V) | Verse | Modern mail web client |
| (T) | Traveler | Mobile sync (iOS / Android) |
| (N) | Nomad Server | Notes client in the browser / on mobile |
| (L) | Language Pack | LP (built-in: DE / ES / FR / IT / NL / JA) |
| (R) | REST-API | Domino REST API |
| (A) | C-API SDK | For native add-in developers |
| (P) | Domino Leap | Low-code app builder |
| (J) | Domino IQ | Built-in LLM + RAG (Domino 14.5+) |

**Add-ons**: (M) Prometheus, (G) Borg Backup, (X) nshmailx — common companions for containerized monitoring / backup / outbound SMTP.

**Base OS**: defaults to Red Hat Enterprise Linux 10 UBI (the no-license-cost universal base image). You can switch to other UBI / Ubuntu / Rocky bases by editing `build.cfg`.

**Versions**: pick "latest" or pin a specific version + Fixpack + Hotfix.

Tick what you want, hit `B` (Build), wait 5-8 minutes:

![docker images output showing hclcom/domino:14.5.1 image](/domino-news/post-images/domino-container-docker-images.png)

`hclcom/domino:14.5.1` — about a 3GB image, containing everything you ticked.

`docker run` it, point a browser at `localhost`, and you're at the Domino login page:

![Domino login page accessed via browser at localhost](/domino-news/post-images/domino-container-login-page.png)

---

## Typical deployment scenarios

**Dev / Lab —** personal learning, ODP development, DQL practice, cross-version compatibility testing. WSL2 + Docker is a popular combo (Windows users can run it too). Build a clean environment for each experiment, blow it away if you break it.

**CI / automated testing —** spin up a fresh Domino container per push, run unit / integration tests, tear it down. Much cleaner than maintaining a shared test server.

**Production —** HCL has official [K8s and OpenShift deployment guides](https://opensource.hcltechsw.com/domino-container/). Production setups typically pair this with persistent volumes, external NSF storage, and Helm charts.

Worth noting: [Daniel Nashed](https://blog.nashcom.de/) — one of the main community maintainers of this project — has extensive blog posts about production-grade container deployments. Search "nashcom domino container" to find them.

---

## Want to give it a spin?

What you need:

1. **A My HCLSoftware Portal account** — you have one if you have a Domino maintenance contract; otherwise apply for a 90-day trial. Download the Domino 14.5.x Linux installer (`Domino_14.5.x_Linux_English.tar`).
2. **Docker / Podman** — Docker Desktop (macOS / Windows), Docker Engine (Linux), or Podman all work.
3. **~10GB of disk space** — installer + base image + final image
4. **About an hour** — first run goes into figuring out the directory layout and downloading installers; second run takes < 10 minutes once you're familiar

Rough flow:

```bash
git clone https://github.com/HCL-TECH-SOFTWARE/domino-container.git
cd domino-container
# Put the downloaded installer in software/ (path matters)
./build.sh menu
# → interactive menu, tick what you want → B → build
docker images   # hclcom/domino:14.5.x means success
```

Full quickstart is in [the official repo README](https://github.com/HCL-TECH-SOFTWARE/domino-container).

---

## ⚠️ A few things to know before you go (short version)

- **The installer path** `build.sh` only recognizes a specific folder (not anywhere you fancy)
- **Bind mounts** once running, the host and container UIDs need to align — otherwise Domino won't start (you'll see piles of `permission denied`)
- **OneTouch Setup** second run needs the mount cleared, otherwise the setup script skips it and drops into vi
- **build.sh pulls an `nginx` image** as an internal helper (the 240MB one in the `docker images` screenshot above isn't your production reverse proxy)

These aren't loudly called out in the HCL docs, so first-timers can trip on them. The community has written end-to-end SOPs (including WSL2-specific ones) — search "HCL domino container WSL2" if you want a walkthrough.

---

## Want a Traditional Chinese (or other Asian) Language Pack?

The (L) Language Pack option on the `build.sh` menu ships with six locales built in: DE / ES / FR / IT / NL / JA — Traditional Chinese, Simplified Chinese, and Korean aren't there.

To add Traditional Chinese, see the previous article on [`domino-container-lp-recipe`](/en/posts/domino-container-lp-recipe/) — a community tool that uses "dynamic patching of the upstream clone" (not a maintained fork) so a single script makes `build.sh` recognize `-domlp=TC`. It also includes SC / KO templates as starting points for community members with those needs.

---

## Wrap-up

Containerization is one of the main paths for modern Domino deployment. HCL's choice to open-source the build script rather than ship pre-built images is a reasonable design — balancing license compliance, modular customization, and patch-flow freshness.

For Domino admins / devs, this means:

- Your image can be **trimmed to exactly the modules you need**
- The supply chain is transparent — which fixpack, which hotfix, all visible
- The same tooling carries you from dev / lab to production — no mental shift required

10GB of disk, an HCL account, an hour — that's all it takes to hand-build a Domino container that's yours.
