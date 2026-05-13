---
title: "Domino 14.5 Mandated Port Encryption Hands-On — CheckPortEncryption Agent, portenc Commands, and Recovery Paths"
description: "Following yesterday's concept piece, this article walks through the official 10-step enablement procedure: upgrade the server address book design, sign the CheckPortEncryption scheduled agent, key Directory Profile fields, server ini values (DEBUG_MANDATED_ENCRYPTION, MANDATEDENC_ACTIVE_REFRESH_TIME), Desktop policy entries (DISABLE_MANDATED_ENCRYPTION), the portenc refresh / show console commands, and how to back out if enforcement breaks something. Pre-14.5 servers get their own behavior section."
pubDate: 2026-05-12T07:30:00+08:00
lang: en
slug: mandated-port-encryption-enabling
tags:
  - "Security"
  - "Release Notes"
sources:
  - title: "Enabling mandated NRPC port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/mandated_port_encryption_enabling.html"
  - title: "Mandating level of port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/mandated_port_encryption.html"
  - title: "Domino 14.5: A `?` icon appears in the Domino Directory server view (KB0127764, in Japanese) — HCL Software Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764"
relatedJava: []
relatedSsjs: []
cover: "/covers/mandated-port-encryption-enabling.png"
coverStyle: "pencil-sketch"
---

## Recap

[Yesterday's concept piece](/domino-news/en/posts/mandated-port-encryption) covered what the `?` icon means after a 14.5 upgrade, why Mandated NRPC Port Encryption exists, and the three enablement modes (off / logging-monitor / mandate-enforce). This post walks the [HCL "Enabling mandated NRPC port encryption" guide](https://help.hcl-software.com/domino/14.5.1/admin/mandated_port_encryption_enabling.html) step by step with ini names, commands, and the gotchas to watch for.

## Prerequisites

- **Primary administration server must run 14.5 or later** — other servers in the domain can still be pre-14.5 (the `CheckPortEncryption` agent handles those, more on that below)
- A plan to upgrade the server address book design to 14.5 (step 1)
- Agreement on the two-stage adoption (logging first, then enforce — never skip straight to enforce)

## The 10-step procedure

### 1. Upgrade the server address book design to 14.5

Foundational — the new "Mandated Port Encryption" section in the Directory Profile only shows up on the 14.5 design.

### 2. Sign and enable the `CheckPortEncryption` scheduled agent

The 14.5 server address book ships a new scheduled agent called `CheckPortEncryption`. The admin must:

- Sign it with an ID that's allowed to run unrestricted agents
- Enable the agent
- Confirm the server document's Agents section permits unrestricted runs by that signer

The agent **runs daily** across every server in the domain, with **different behavior depending on server version**:

| Server version | What `CheckPortEncryption` does |
|---|---|
| **Pre-14.5** | Reads the mandate setting from the Directory Profile, dynamically adjusts that server's NRPC port encryption level, updates `PORT_ENC_ADV` in notes.ini (no restart needed) |
| **14.5+** | **Nothing** — 14.5 has built-in code that handles mandate logic locally |

Put differently, this agent is a **transition-period helper** — it lets pre-14.5 servers participate in the directory-profile mandate setting. Once every server is on 14.5+, the agent retires.

### 3. Build an exclusion group (optional)

Servers that shouldn't be subject to the mandate can be grouped and added to the Directory Profile's exclusion list. **Passthru servers and the ADPWSync utility server are auto-excluded** — no manual step needed for those.

### 4. Build a 14.5+ server group (optional)

Either create a server group of 14.5+ servers or use `* - [All Servers]`. Skip this if you're managing per-server ini files manually.

### 5. Set server ini values (one-time restart needed)

Via a server configuration document's Notes.ini section:

| Ini key | Value | Purpose |
|---|---|---|
| `DEBUG_MANDATED_ENCRYPTION` | `1` | Enable mandated-encryption debug logging |
| `MANDATEDENC_ACTIVE_REFRESH_TIME` | seconds (default 24 hours) | How often to re-read the directory profile mandate setting; default polls every 60 minutes |
| `DEBUG_PORT_ENC_ADV` | `1` | Enable detailed port-encryption debug |

These changes **require a server restart**.

### 6. Set Desktop policy (for clients)

On the client side, use desktop policy → Custom Settings → Notes.ini tab:

| Ini key | Set to |
|---|---|
| `DISABLE_MANDATED_ENCRYPTION` | `0` |
| `DISABLE_OUTBOUND_MANDATED_ENCRYPTION` | `0` |

These are the "opt out of the mandate" knobs — set to `0` means "stay opted in, comply with the mandate." **Keeping these two entries in desktop policy matters** — if a client breaks badly after enforcement, flipping the policy to `1` remotely lets that client opt out without anyone visiting the workstation.

### 7. Enable logging (enter the monitor window)

Edit the Directory Profile → Security tab → enable **logging** for mandated port encryption, but **do not enforce yet**.

The server-view icon for affected servers transitions from `?` to a "status evaluating" icon at this point.

### 8. Run `portenc refresh`

On the primary admin server console:

```
portenc refresh
```

That refreshes every server's mandate-setting cache and runs a compliance pass. To verify:

```
portenc show
```

Shows the current state for each server.

### 9. Observe for several days

During the logging window, watch the debug log entries (from the ini settings in step 5) for connections that *would* be dropped under enforcement. Typical things you'll catch:

- A legacy server with R9 clients that don't accept encryption → logged, but the connection still goes through (because enforcement isn't on yet)
- A misconfigured partition → unexpected plaintext connections appear in the log

Resolve those before stepping into enforcement.

### 10. Enable enforcement

Once the logging window passes without surprises, edit the Directory Profile setting to **Enforce port encryption mandate** and run `portenc refresh` again.

The server-view icon switches to the "enforced" state. From this moment on, NRPC connections that won't accept encryption get refused.

## Recovery paths

If enforcement breaks something (a critical client can't connect, a partner server suddenly fails clustering):

| Urgency | Path |
|---|---|
| **Domain-wide quick rollback** | Edit Directory Profile, switch back to logging-only (keep the records), run `portenc refresh` |
| **Single server / client** | Add the server to the exclusion group from step 3, or flip the client's desktop policy to `DISABLE_MANDATED_ENCRYPTION=1` |
| **Full rollback** | Disable the entire mandate in Directory Profile — server-view icons revert to `?` |

Prepare the recovery path before the upgrade and write it into your runbook. Looking up docs the day enforcement breaks is not a fun place to be.

## Frequently overlooked details

- **If the `CheckPortEncryption` agent isn't signed, the whole mechanism silently does nothing** — there's no error. Admin enables logging, runs refresh, but the server-view icons don't move. The first debug step for "I followed the steps but nothing happened" is to check this agent's signing
- **`MANDATEDENC_ACTIVE_REFRESH_TIME` defaults to 24 hours, which is long** — drop it to ~300 seconds during the monitor window if you want faster iteration
- **For pre-14.5 servers, the change vector is ini, not the server configuration doc** — the agent writes `PORT_ENC_ADV` directly into notes.ini

## Closing

The actual setup isn't complicated, but **there are a lot of steps** — miss any one of the 10 (especially the agent signing in step 2) and you end up with "looks enabled, doesn't work" for ambiguous reasons. Recommendations:

1. **Write a runbook** that captures all 10 steps, every ini name, every command, and the recovery paths
2. **Plan a logging window of at least one week** so weekly cron jobs and monthly batch processes all run before enforcement
3. **Pre-stage the recovery levers** — `DISABLE_MANDATED_ENCRYPTION=1` over desktop policy is the fastest emergency valve on the client side

Read this alongside the [5/10 NotesHTTPRequest trust-store change](/domino-news/en/posts/notes-httprequest-14-5-trust-store) — that piece covers the trust store moving for outbound HTTPS, this one covers internal NRPC encryption being enforced. Both ship in 14.5 and both want attention.
