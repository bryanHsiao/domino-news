---
title: "eMudhra Certificates on the Notes Client: The Hard Part Isn't Which Cert — It's Thousands of Desktops"
description: "On the server you pull the affected eMudhra / emSign / Comodo roots out of the trust store one box at a time, as the admin, by hand. On the Notes client the same certificates sit on every desktop in your company — and you can't SSH into five thousand workstations. This follows the Domino Server piece and focuses on the client side: where the certificates hide in a different set of trust stores (the local names.nsf under Advanced > Certificates, the bundled Java cacerts in the program directory, the per-workstation cacert.pem, the macOS keychain), why there's no built-in way to clean them all at once, how to push a fix to every machine with MarvelClient or your own software-deployment tool, and one corner the official bulletin doesn't list but you'd better check yourself: the EOL 9.x."
pubDate: 2026-11-05T07:32:00+08:00
lang: en
slug: notes-client-emudhra-ca-cve
tags:
  - "Notes Client"
  - "Security"
  - "Admin"
  - "News"
sources:
  - title: "CVE-2026-108015 — official CVE record (cve.org, HCL Notes Client outbound certificate trust)"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-108015"
  - title: "CVE-2026-91403 — official CVE record (cve.org, upstream Java / bundled Semeru JVM)"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-91403"
  - title: "Removing compromised eMudhra certificates from HCL Notes clients with MarvelClient — panagenda (client deployment, Christoph Adler)"
    url: "https://www.panagenda.com/de/blog/remove-emudhra-certificates-hcl-notes/"
  - title: "eMudhra CA Key Compromise — How to remove the affected certs — Daniel Nashed's Blog"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm"
  - title: "CVE-2026-91403 — Red Hat Customer Portal (the CVSS 6.8 reading)"
    url: "https://access.redhat.com/security/cve/cve-2026-91403"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-client-emudhra-ca-cve.webp"
coverStyle: "low-poly-3d"
---

The server side is the simpler one: a handful of Domino boxes, you log into each, and you pull the affected eMudhra / emSign / Comodo roots out of the trust store by fingerprint ([how to tell whether you're exposed and which ones to remove is in the Domino Server piece](/domino-news/posts/domino-emudhra-ca-cve/)).

The hard one is the desktop. The same certificates sit on **every Notes client in your company** — the sales laptop, the accountant's desktop, that kiosk nobody remembers is still running. The vulnerability is identical, but you can't SSH into five thousand workstations and edit a file. The difficulty here isn't "which certificate" — it's **scale**: making sure every machine actually gets cleaned, that you cleaned the right stores, and that you didn't disrupt the user doing it.

This piece is about the client side: where the certificates hide in a set of trust stores that differ from the server's, why there's no single button to clean them all at once, how to push a fix to every machine with a deployment tool, and one corner the official bulletin doesn't list but you'd do well to check — the 9.x still out there.

---

## TL;DR

- **Same certificates, same root cause** (recoverable eMudhra intermediate-CA keys → MITM can forge a trusted site), just on the client this time. The matching CVE is the Notes client's CVE-2026-108015, plus the upstream Java [CVE-2026-91403 / 114820](https://www.cve.org/CVERecord?id=CVE-2026-91403) that the bundled Semeru JVM inherits. CVSS still reads 9.1 (Red Hat's [alternate reading of the upstream one is 6.8](https://access.redhat.com/security/cve/cve-2026-91403)).
- **The client's trust stores differ from the server's**: `cacert.pem` (one copy in each data directory), the bundled Java `cacerts` (program directory, `jvm\lib\security`, writing needs admin), the local `names.nsf` under **Advanced > Certificates**, and on macOS the **keychain**.
- **There's no built-in way to clean many clients at once.** The practical answer is a deployment tool: MarvelClient, or your existing software distribution (SCCM / Intune and the like).
- **Affected versions**: 12.0.2 FP8 and earlier, 14.0 FP5 and earlier, 14.5 up to 14.5.1 FP1.
- **Don't skip the EOL 9.x**: the bulletin lists only supported versions, but these roots predate 12.x — a 9.x install very likely carries the same certificates, and you have to check it yourself.

## Where the certificates hide on a client

The Domino Server piece lists the roots to remove and their SHA-256 fingerprints, so I won't repeat them ([the full list is there](/domino-news/posts/domino-emudhra-ca-cve/)). What differs on the client is **location** — the same certificates, in a slightly different set of stores, and every desktop has its own copy:

| Trust store | Where | Note |
|---|---|---|
| `cacert.pem` | each Notes `data` directory | one per workstation; no built-in way to mass-clean |
| `cert8.db` (the embedded browser's NSS store) | `…\Notes\Data\workspace\BrowserProfile\` (Mac: Expeditor/BrowserProfile) | Comodo AAA lives here; HCL provides a clean copy to download and swap in |
| bundled Java `cacerts` | program directory `jvm\lib\security` | writing needs admin rights |
| local `names.nsf` | the Notes client: Advanced > Certificates | KB0134844 lists AAA Certificate Services (Comodo) as removable here |
| macOS keychain | Notes on Mac | the Mac client relies on the keychain, not `cacert.pem` |

The rule is the same as on the server: **match by fingerprint, not by name**, and remove all of the related roots (pull just one and the chain can rebuild through another path). The difference is only that you now have to do it on **every single machine**.

## The real problem: scale

[panagenda (Christoph Adler)](https://www.panagenda.com/de/blog/remove-emudhra-certificates-hcl-notes/) has the most grounded write-up of the client remediation, and the core of it is one sentence: **there's no built-in mechanism to clean these certificates off a large fleet at once** — you need **some way to push files or config to every machine**, whether that's enterprise software distribution (SCCM, Intune, a GPO logon script), your own deployment scripts, or a dedicated Notes client-management tool. That breaks into a few jobs:

1. **`cacert.pem` (and `cert8.db`) — overwrite with clean copies.** Push a cleaned `cacert.pem` into each `data` directory, overwriting the existing one; HCL also provides a clean `cert8.db` (used by the embedded browser) to push into each `workspace\BrowserProfile\`. Both are plain file distribution — any deployment tool can do it.
2. **local `names.nsf` — run a cleanup.** This store lives in each user's personal address book and it's an NSF (not a flat file), so walking into Advanced > Certificates on each machine by hand isn't realistic. The approach is to **ship a Notes agent/script to each client that checks the local `names.nsf` for the affected certifiers and removes them** (ideally with no user interaction). Some client-management tools (panagenda's MarvelClient, for one) ship a ready-made agent for this; without one, you write the equivalent and push it through your own pipeline.
3. **bundled Java `cacerts` — replace or delete entries.** It sits in the program directory and needs admin: either swap in a cleaned copy, or use the same `keytool` commands as the server to **find by fingerprint and delete by alias** (syntax is in [the Domino Server piece's steps](/domino-news/posts/domino-emudhra-ca-cve/)). Either way, push it to each machine with your software distribution.
4. **macOS — go through OS updates.** Notes on Mac relies on the macOS keychain; get the Mac current and let the OS handle that layer.

In the end the client side isn't a test of whether you can clean one certificate — it's a test of **whether you have a pipeline that can do one thing across the whole fleet at once**. Teams that [kept their client-management foundation in shape](/domino-news/posts/notes-httprequest-14-5-trust-store/) have a far easier time with a "push one file to the whole fleet" job; without one, that pipeline is the real thing to build.

## Don't skip the EOL 9.x (but don't copy the list onto it)

HCL's advisory lists only versions still in the support window (12.0.2 FP8 and earlier, 14.0 FP5 and earlier, 14.5 up to 14.5.1 FP1). 9.x isn't on it because it's **EOL, not because it's safe** — so don't skip it; but don't copy the 12/14 list onto it either.

We measured one 9.0.1's bundled JVM, and the result was the opposite of the intuition: **no emSign at all** (the JVM is too old to have bundled it), **but Comodo AAA was present** — the full result and scope note are in [the Domino Server piece's measurement](/domino-news/posts/domino-emudhra-ca-cve/). That was a server; a **client has the same bundled-JVM structure**, but we didn't separately measure a 9.0.1 client. So the dependable move is to **run `keytool -list` by fingerprint on each of your own 9.x clients** and see which store holds what, rather than assuming.

## Confirming each machine is actually clean

Daniel Nashed offers a LotusScript test button that uses `NotesHTTPRequest` to connect to a site presenting a certificate signed by an affected CA, and checks whether the connection is rejected:

```lotusscript
Dim req As New NotesHTTPRequest
req.Maxredirects = 0
Dim response As String
response = req.Get(testUrl)   ' once clean, this should FAIL (cert not trusted)
```

But verification on the client carries a sharper caveat than on the server: **a desktop has more than one component that connects out.** This snippet only tests the LotusScript `NotesHTTPRequest` path; Domino's embedded browser, the Java-layer client, even other software on the same box each read their own trust store. [Nashed's test](https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm) and the community's live test site confirm the LS path quickly, but **a pass in a browser or with curl doesn't mean the other components on that machine are safe**. Every outbound entry point needs its own check — on each of the machines you sample.

## How this maps to the server piece and the string of CVEs

Pulled apart, it isn't tangled:

- **CVE-2026-108015** — HCL's number for the **Notes client's** outbound-request features; the [cve.org record](https://www.cve.org/CVERecord?id=CVE-2026-108015) shows it published 2026-10-27 with a 9.1 CVSS. It's the client mirror of the server's CVE-2026-108014.
- **CVE-2026-91403 / 114820** — the upstream **Java** problem; the Notes client bundles the IBM Semeru JVM, so it's affected along with it (this part shares the same upstream root cause as the server).
- For the **nature of the flaw, how to read 9.1 vs 6.8, and the full certificate list with fingerprints**, see the [Domino Server piece](/domino-news/posts/domino-emudhra-ca-cve/) — what the client adds is "how to do the same thing across a large number of desktops."

Cross-check the HCL Notes client bulletins (the two covering the bundled Semeru JVM and the client's outbound features) and the manual-removal KB against your version; third-party aggregators sometimes disagree on the KB numbers, so defer to HCL's support portal.

## One line to close

The server test was "do you know which roots you trust"; the client test is "can you do one thing correctly across an entire fleet at once." The first rests on understanding the trust stores; the second rests on whether you've kept the [certificate model](/domino-news/posts/certstore-getting-started/) and your client-deployment plumbing in good shape all along. What you're pushing out this time is just a cleaned `cacert.pem` and an agent to clean `names.nsf` — what actually decides how easy today is, is whether that deployment pipeline was already there.
