---
title: "Domino 14.5 Changes Where NotesHTTPRequest Loads Trusted CAs From — Read Before You Upgrade"
description: "Starting with Domino 14.5, server-side LotusScript NotesHTTPRequest loads trusted root CAs from the Domino Directory by default, no longer from cacerts.pem in the data directory. The Notes client is unaffected, and a notes.ini fallback (NotesHTTPRequest_Use_CACerts=1) reverts to the old behavior — but long term, you should migrate self-signed CAs into the Domino Directory. This piece walks the change, scope, pre-upgrade checklist, and ties back to the 5/7 deep-dive on the NotesHTTPRequest toolchain."
pubDate: 2026-05-10T07:30:00+08:00
lang: en
slug: notes-httprequest-14-5-trust-store
tags:
  - "LotusScript"
  - "Security"
  - "Release Notes"
sources:
  - title: "A LotusScript NotesHTTPRequest Change in Domino 14.5 You Should Know — Daniel Nashed (blog.nashcom.de, 2025-08-26)"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/a-lotusscript-noteshttprequest-change-in-domino-14.5-you-should-know.htm"
  - title: "What's new in Domino 14.5 — Security features (HCL admin docs)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html"
  - title: "NotesHTTPRequest class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-httprequest-14-5-trust-store.png"
coverStyle: "low-poly-3d"
---

## TL;DR

In Domino 14.5, **server-side LotusScript [`NotesHTTPRequest`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html) calls load trusted root CAs from the Domino Directory by default**, no longer from `cacerts.pem` in the data directory. The Notes client is not affected. If your environment relies on self-signed CAs that haven't been imported into the Domino Directory yet, your LS HTTPS calls will start failing certificate verification on upgrade day.

Quick fallback — drop this line into `notes.ini`:

```
NotesHTTPRequest_Use_CACerts=1
```

It reverts to the old behavior (read from `cacerts.pem`).

## A bit of background: what is a trust store?

LS developers rarely touch certificates directly, so a quick refresher — skip this section if you're already comfortable with PKI basics.

When you make an HTTPS call, the client and server perform a **TLS handshake**:

1. The server presents its certificate to the client
2. The cert carries two pieces of info: "who I am" (domain) and "who signed me" (the issuer / CA)
3. The client looks at **its own list of trusted CAs** — that list *is* the trust store — and checks whether this cert was issued by any CA on the list
4. Chain verifies → connection proceeds; chain breaks → cert verify failed → connection refused

**Which CAs live on that list is the entire point of the 14.5 change.**

Why are public APIs (OpenAI, Slack, banks, government) never a problem? Their certs are issued by **DigiCert / Let's Encrypt / GlobalSign** and other publicly recognized CAs, and Domino's default trust store has carried those for years. Your LS code just connects.

The pain is **self-signed CAs** — your IT team uses their own CA to sign certs for internal services (self-hosted Jenkins, Jira, staging APIs, ERP integration endpoints). These CAs aren't on any public list, so **LS NotesHTTPRequest doesn't trust them by default** — somebody has to **add the self-signed CA to the Domino server's trust store** before HTTPS calls work.

> **What 14.5 actually changes**: the trust store moves from "a `cacerts.pem` file on each server" to "documents in the Domino Directory." It is **not a bug fix** — self-signed CAs that weren't trusted before still aren't trusted after — it's a **management-surface swap**: from "ssh into every server and append to a file" to "add a document in Domino Administrator, let directory replication propagate it."

The concrete upgrade-day risk: any self-signed CA you previously appended to `cacerts.pem` **does not migrate to the Directory automatically** — you have to re-add it, or "previously working" turns into "fails immediately after upgrade."

## What changed

[Daniel Nashed's August 2025 blog post](https://blog.nashcom.de/nashcomblog.nsf/dx/a-lotusscript-noteshttprequest-change-in-domino-14.5-you-should-know.htm) is the clearest writeup of this 14.5 change. The shape:

| Aspect | Pre-14.5 | 14.5+ (default) |
| --- | --- | --- |
| Default root CA source | data dir's `cacerts.pem` | Domino Directory (server-side) |
| Notes client behavior | Unaffected | Unaffected |
| Revert option | n/a | `notes.ini`: `NotesHTTPRequest_Use_CACerts=1` |
| Scope | LotusScript NotesHTTPRequest | LotusScript NotesHTTPRequest |

According to the [HCL 14.5 security features release note](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html), 14.5 consolidates trusted CAs into the directory — aligning with `certstore.nsf` / TLS internet site documents that already live there.

## Why the change

`cacerts.pem` is a local file on each Domino server. In a multi-server environment, syncing it across the cluster is an operational pain. Moving it to the Domino Directory:

- Changes propagate via directory replication automatically — no per-server file edits
- Same management surface as `certstore.nsf` / TLS internet site docs
- No more ssh'ing into each server to swap files and verify hashes

It's the right direction (the original blog's words) — consistent with HCL's broader pattern of consolidating ID files, TLS, credentials, and trusted CAs into directory-managed surfaces.

## What a cert-verify failure looks like on upgrade day

Most LS developers don't see cert errors often, so here's what to watch for.

**Agent side**, the LS code typically looks like this:

```lotusscript
Dim req As New NotesHTTPRequest
Set ret = req.Get("https://internal-api.company.local/...")
Print req.Responsecode
```

When cert verification passes, `Responsecode` prints 200. When it fails:

- `Get()` raises an LS runtime error, and the agent stops on that line
- With `On Error Goto handle`, `Err` / `Error$` produce a message that mentions SSL / TLS / certificate
- With `On Error Resume Next` (swallowing the error), `Responsecode` often comes back as `0` or some non-HTTP value — there's no connection, so there's no real status code

**Server console / log.nsf side**, the SSL failure lines after a 14.5 upgrade usually contain phrases like:

- `Unable to verify the certificate chain`
- `SSL handshake failed`
- references to `certstore.nsf` or trusted-CA document names

If the day after a 14.5 upgrade you see a single agent suddenly failing with SSL-related log lines, this change is the cause 99% of the time. SSH onto the server, look at the old `cacerts.pem`, identify any self-signed CAs in it, and decide whether to migrate them to Directory properly or set the `.ini` fallback as a temporary patch.

## Pre-upgrade checklist

In order:

1. **Audit existing `cacerts.pem`** — find self-signed or private corporate CAs that aren't in Domino's default CA bundle
2. **Import into Domino Directory** — via the Domino Administrator client's Trusted Roots interface, or by creating the corresponding trusted-CA documents per the 14.5 admin docs
3. **Verify** — run an agent that does an HTTPS NotesHTTPRequest call, confirm cert verification passes
4. **If you're not ready to migrate** — set `NotesHTTPRequest_Use_CACerts=1` as a temporary workaround and add the proper migration to your next server-upgrade window

## Tie-in with the 5/7 deep-dive

The [5/7 piece on the NotesHTTPRequest + NotesJSONNavigator toolchain](/domino-news/en/posts/lotusscript-http-json) covers the full built-in LS workflow. Every example there still works in 14.5 — until you hit an endpoint with a self-signed CA. In practice, two camps:

- **Internal company APIs, staging, self-hosted services** typically use self-signed CAs → **import the root cert into the Domino Directory before upgrading to 14.5**, or your agents will silently fail
- **Public APIs** (OpenAI, banking APIs, government APIs) use well-known CAs → unaffected, since those are in Domino's default CA bundle

## What about Java and SSJS?

Java agents and XPages SSJS use the **JVM's own trust store** (the `cacerts` keystore at `$JAVA_HOME/jre/lib/security/`), which is a completely separate trust path from LotusScript NotesHTTPRequest — Java is **not affected** by this 14.5 change at all.

| Context | Trust store location |
| --- | --- |
| LotusScript NotesHTTPRequest (≤ 14.0, server) | data dir's `cacerts.pem` |
| LotusScript NotesHTTPRequest (14.5+ default, server) | Domino Directory |
| LotusScript NotesHTTPRequest (Notes client, any version) | Client-side keystore (unaffected by 14.5 change) |
| Java agent / SSJS | JVM `cacerts` KeyStore |

So on the same Domino server, LS HTTPRequest and Java see different trusted-CA sets — they're **two independent configurations**. To trust a self-signed CA platform-wide, you have to set it in both places.

## Closing

Moving NotesHTTPRequest's server-side trust store from file-based to directory-based is a good change — multi-server environments no longer have to sync `cacerts.pem` per node. But **import your self-signed CAs into the Domino Directory before upgrading to 14.5**, or the agents that lean on [`NotesHTTPRequest`](/domino-news/en/posts/lotusscript-http-json) will break at the worst possible moment. `NotesHTTPRequest_Use_CACerts=1` is a serviceable rescue lever, but plan the proper migration regardless.
