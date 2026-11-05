---
title: "Domino's eMudhra Certificate Alert: What the 9.1 Really Means, and Which Trust Store to Clean"
description: "In late October HCL published a security bulletin that lists Domino Server as affected, with a CVE carrying a 9.1 CVSS. But this isn't a bug in Domino's code — it's that the private keys of a set of eMudhra intermediate CAs can be recovered, and those CAs are trusted by Java's trust store and by the trust chain Domino uses for outbound connections. Three things actually matter: how to read that 9.1 (Oracle says 9.1, Red Hat says 6.8), whether your environment is really exposed (most servers trust these CAs in the bundled Java cacerts, not in certstore.nsf), and which certificates to pull from which trust stores. This lays out how CVE-2026-91403 / 114820 / 108014 map together, the affected versions, the removal list, and how to verify."
pubDate: 2026-11-05T07:30:00+08:00
lang: en
slug: domino-emudhra-ca-cve
tags:
  - "Domino Server"
  - "Security"
  - "Admin"
  - "News"
sources:
  - title: "Security Bulletin: eMudhra Compromised Certificate vulnerabilities in Java impact HCL Domino Server (CVE-2026-91403, CVE-2026-114820) — HCL Support (official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0134847"
  - title: "CVE-2026-91403 — official CVE record (cve.org, Oracle CNA)"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-91403"
  - title: "CVE-2026-108014 — official CVE record (cve.org, HCL Domino Server)"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-108014"
  - title: "CVE-2026-91403 — Red Hat Customer Portal (the CVSS 6.8 reading and how the fix evolved)"
    url: "https://access.redhat.com/security/cve/cve-2026-91403"
  - title: "eMudhra CA Key Compromise — How to remove the affected certs — Daniel Nashed's Blog (Domino community)"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-emudhra-ca-cve.webp"
coverStyle: "ukiyo-e"
---

You run a few Domino servers. In late October an HCL security bulletin names Domino, and next to the CVE sits a red **9.1 / 10**. Your boss forwards the link and asks whether this is an all-nighter.

Breathe first. This is not the kind of hole where someone runs code on your Domino box from across the internet — Domino's own code is fine. What broke is **a set of widely trusted CA certificates**: a certificate authority called eMudhra has several intermediate CAs whose private keys can be recovered, and those CAs are in turn trusted by Java's trust store and by the chain Domino uses for outbound connections. In other words, this is a **wrong-thing-in-the-trust-store** problem, not an execution-layer break. The score looks frightening; the work is concrete and very much under your control.

This piece covers three things: how to read that 9.1, whether your environment is really exposed, and which certificates to pull from which trust stores.

---

## TL;DR

- **The nature of it**: the private keys of eMudhra intermediate CAs can be recovered. Anyone holding them can issue a "looks legitimate" TLS certificate for **any domain**. As long as an attacker can sit in the middle of your connection (a man-in-the-middle, MITM), a Java TLS client that still trusts those CAs will accept the forged site.
- **Not a bug in Domino's code** — a problem with what's inside the trust store. The CWE sits under Improper Certificate Validation[^cwe].
- **The 9.1 has two readings**: Oracle and HCL both score it CVSS[^cvss] **9.1**; Red Hat scores it **6.8** on CVSS 3.1 — the difference is that the real MITM path requires the attacker to first hold a middle position and the victim end to connect out. Neither reading is "someone is already on your server."
- **Are you exposed? Look in the right place**: on most Domino servers the CAs are trusted in the **bundled Java trust store** (`cacerts`) and in the older `cacert.pem`; `certstore.nsf` holds **only the Let's Encrypt roots by default**, and a standard Domino Directory **doesn't carry** these public roots either — unless you imported them yourself.
- **What to do**: remove the eMudhra / emSign / Comodo roots HCL lists **from every trust store**, **match by fingerprint, not by name**, and remove **all** of the related ones (pull just one and the chain can rebuild through another path).
- **Affected versions** (HCL's Domino Server list): **12.0.2 FP8 and earlier, 14.0 FP5 and earlier, 14.5 up to 14.5.1 FP1**. Both R12 and R14 are in scope.

## What the vulnerability actually is

TLS trust is a chain: when your server connects out, the far end presents a certificate, that certificate is signed a layer up, and so on, until it reaches a root CA **in your trust store**. If the chain reaches a root you trust, the connection is treated as safe.

What broke this time is the middle of the chain. The heart of [CVE-2026-91403](https://www.cve.org/CVERecord?id=CVE-2026-91403) is that root CAs in Java's trust store signed eMudhra **intermediate** CAs whose **private keys can be recovered**. Community analysis points to 8 affected eMudhra intermediates (6 signing TLS, 2 signing code), all cross-signed under the AAA Certificate Services root.

Holding an intermediate CA's private key is a master key: you can issue a certificate for `mail.yourcompany.com`, `login.partner.com`, any domain, that **chains back to a trusted root**. Then an attacker who can sit in the middle of the connection (reroute, poison DNS, ARP on the same segment…) feeds the forged site to your Domino, and a TLS client that still trusts those CAs accepts it.

Worth stressing: **revocation alone won't stop this**. Many TLS implementations don't check revocation status by default, so the fix is to **remove** these CAs from the trust store outright, not to hope a revocation list catches them.

## 9.1 or 6.8?

You'll see two scores for the same CVE. Both are right; they measure different things:

| Scorer | Score | Vector | Measuring what |
|---|---|---|---|
| Oracle / HCL | **9.1** | `AV:N/AC:L/PR:N/UI:N/...` (high C, high I) | the broad JSSE / untrusted-code worst case |
| [Red Hat](https://access.redhat.com/security/cve/cve-2026-91403) | **6.8** | `AV:N/AC:H/PR:N/UI:R/...` | the real MITM-TLS path: needs a middle position + interaction |

The gap is in `AC` (attack complexity) and `UI` (whether user/client interaction is needed). Oracle scores against the widest framing; Red Hat scores the practical "forge a cert → man-in-the-middle" path, which lands medium-high rather than critical. For a Domino admin that means: **fix it, but it's not "someone is hammering your 443 with an exploit right now."** High priority — with time to do it correctly.

## Is your environment actually exposed

This is where the 9.1 tempts people into overreacting. The question isn't "is Domino affected," it's "**which trust store** actually holds these CAs." Domino touches several, and their defaults differ a lot:

- **The bundled Java trust store (`cacerts`)** — the main place it burns. Domino's bundled JVM ships its own trust store (PKCS12 on 14.x, still named `cacert` with no extension) that includes these public roots. This one almost always needs attention.
- **`cacert.pem` / `cacerts.pem` (data directory)** — the older trust source. From Domino 14.5, server-side [`NotesHTTPRequest`](/domino-news/posts/notes-httprequest-14-5-trust-store/) reads roots from the Domino Directory by default and no longer reads this file — but if your environment still relies on it (or uses the `.ini` switch back to the old behaviour), clean it too.
- **`certstore.nsf`** — community testing (Daniel Nashed, late October) notes it holds **only the Let's Encrypt roots by default**, so it's in scope **only if you imported** these public CAs yourself.
- **A standard Domino Directory (`names.nsf`)** — also **doesn't carry** these public roots by default; again, only relevant if you added them by hand.

The practical takeaway: **check the bundled Java `cacerts` first**, then look at whether you've touched `cacert.pem`, `certstore.nsf`, or the Domino Directory. On a server with an untouched trust source, the thing to clean is usually that bundled Java store. This is also why anyone who already understands [what each of the trust stores is for](/domino-news/posts/certstore-getting-started/) has an easy time here.

## Don't assume about EOL versions: one measured 9.0.1

The instinct is "9.x is older, so it must be affected too" — but a measurement flipped that. On a 9.0.1 FP10 Domino server (a self-built container; IBM J9 Java 1.8.0_151, cacerts dated 2018, 105 entries) we checked all three trust stores:

- **The bundled JVM `cacerts` (checked with `keytool -list` — the authoritative one)**: **no emSign / eMudhra at all**; but Comodo's **AAA Certificate Services is present** (alias `comodoaaaca`, SHA-256 `D7:A7:A0:FB…69:EF:4`).
- **`names.nsf` (Domino Directory)**: likewise **no emSign**; the AAA string does show up, but that's only a binary string scan of names.nsf — whether those are still-active Internet cross-certificate documents needs per-entry confirmation via Domino admin / DXL, and a grep isn't proof.
- **`cacert.pem`**: this box **doesn't have the file at all** (neither the data nor the program directory), so the tools that target `cacert.pem` have nothing to act on here.

Why no emSign in any of the three? This JVM's cacerts is old (2018), and emSign was only added to trust stores around 2018 onward — so it was never bundled in. That's consistent with the official lists stopping at 12.0.2 / 14.x for emSign. So on this 9.0.1 the thing to assess is **AAA, not emSign** — and AAA is a broadly-used old root, so removing it has a large regression surface; test the TLS chains you depend on before touching it.

> Scope note: this is **one measured 9.0.1 FP10 server container**; a 9.0.1 whose JVM was manually updated could differ. The one solid takeaway: **don't skip 9.x, but don't copy the 12/14 list onto it either — run `keytool -list` by fingerprint on each of your own 9.x boxes and sort out which store holds what.**

## Which certificates to remove

HCL's manual-remediation guidance lists several roots to pull. Below is the list and the SHA-256 fingerprints as relayed by the community ([Nashed](https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm), panagenda) — but **always go by the current list in HCL's bulletin**, since HCL may update it as the investigation moves:

```text
emSign ECC Root CA - G3        (the main one)
  SHA-256 86:A1:EC:BA:08:9C:4A:8D:3B:BE:27:34:C6:12:BA:34:
          1D:81:3E:04:3C:F9:E8:A8:62:CD:5C:57:A3:6B:BE:6B

emSign Root CA - C1
  SHA-256 12:56:09:AA:30:1D:A0:A2:49:B9:7A:82:39:CB:6A:34:
          21:6F:44:DC:AC:9F:39:54:B1:42:92:F2:E8:C8:60:8F

emSign ECC Root CA - C3
  SHA-256 BC:4D:80:9B:15:18:9D:78:DB:3E:1D:8C:F4:F9:72:6A:
          79:5D:A1:64:3C:A5:F1:35:8E:1D:DB:0E:DC:0D:7E:B3

AAA Certificate Services (Comodo)
  SHA-256 D7:A7:A0:FB:5D:7E:27:31:D7:71:E9:48:4E:BC:DE:F7:
          1D:5F:0C:3E:0A:29:48:78:2B:C8:3E:E0:EA:69:9E:F4
```

Two operational points that people who've done it will press on:

1. **Match by fingerprint, not by name.** The same root shows up under different display names across trust stores (the AAA root may read as "Comodo AAA Services root" in `cacert.pem`). Comparing by SHA-256 fingerprint is what keeps you from missing one or deleting the wrong thing.
2. **Remove all of them, not some.** Nashed calls this out specifically: `emSign ECC Root CA - G3` and the Comodo cross-cert **both have to go** — pull only one and the chain can rebuild through the other path, which is the same as not cleaning at all.

> **A contested fifth: emSign Root CA – G1.** The four above are the HCL/Domino community (panagenda) removal list; G1 isn't on it, [Mozilla currently chooses not to remove it](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449), and Chrome is still reviewing (G1's issue leans on a CRL-signature problem, not quite the same line as the eight intermediate-CA key compromises). But some Java-trust-store guidance (Ignition, Camunda) and some field fix tools take the more conservative stance and remove G1 too. If you hit G1 while cleaning a Java `cacerts`, it's not an omission — it's vendors drawing the line differently; go by your vendor's current guidance, and test the TLS chains your services depend on before removing it.

## How to remediate on the server

As of writing (2026-11), HCL's guidance is **manual steps for now, with fixed releases to follow**. For a Domino Server:

1. **Handle the bundled Java trust store.** Remove or replace those roots in the JVM's `cacerts` — this one is separate from the data-directory files and has to be done on its own.
2. **Check `cacert.pem` / `cacerts.pem`.** If your environment still reads it (or uses the `.ini` switch back to the old behaviour), remove the matching roots by fingerprint.
3. **Touch `certstore.nsf` and the Domino Directory only if you added these by hand** — remove any eMudhra / emSign / Comodo certifiers you imported.
4. **Don't forget the OS certificate store**: other software on the same host (a reverse proxy, a backup tool) may keep its own trust store — handle those through your existing certificate-management process.

Cross-check your exact steps, and whether a fixed release is available for your version, against HCL's Domino Server bulletin (KB0134847) and the manual-removal KB it links to.

## How to confirm it's actually clean

Nashed offers a LotusScript test that uses `NotesHTTPRequest` to connect to a test site presenting a certificate signed by an affected CA, and checks whether the connection is rejected:

```lotusscript
Dim req As New NotesHTTPRequest
req.Maxredirects = 0
Dim response As String
response = req.Get(testUrl)   ' once clean, this should FAIL (cert not trusted)
```

One important caveat: **this only tests the LotusScript `NotesHTTPRequest` path.** Domino's embedded browser, the Java-layer HTTP client, and other components each use their own trust store and have to be verified separately. On Linux you can cross-check with `curl` against the same test site. In other words, **passing on one path doesn't mean everything is safe** — every component that makes outbound connections needs its own confirmation.

## How this string of CVEs maps together

You'll run into more than one CVE number here, which is easy to tangle. Pulled apart, it's clear:

- **CVE-2026-91403 / CVE-2026-114820** — the upstream **Java** problem (Oracle Java SE, GraalVM, OpenJDK). 91403 was the first fix (distrust only the intermediates); because it turned out easy to bypass and the first fix wasn't enough, OpenJDK removed the root CAs outright, which got the new number 114820. Domino bundles the JVM, so it's affected along with it — which is why the [Domino Server bulletin (KB0134847)](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0134847) carries both numbers.
- **CVE-2026-108014** — HCL's own number, for the certificate trust in **Domino Server's outbound-request features**; the [cve.org record](https://www.cve.org/CVERecord?id=CVE-2026-108014) shows it published 2026-10-27 with a 9.1 CVSS. This is the one behind that "official bulletin" at the end of October.
- **CVE-2026-108015** — same nature, but for the **Notes client's** outbound features.

Four numbers, two layers (upstream Java + Domino itself) — but **the closing move is the same one thing**: get those affected roots out of your trust stores.

## One line to close

This is a textbook "high score, but the substance is trust-store hygiene" event. It follows the same thread as Domino 14.5 moving [NotesHTTPRequest's trust source to the Domino Directory](/domino-news/posts/notes-httprequest-14-5-trust-store/), and the [certstore / CertMgr certificate model](/domino-news/posts/certstore-getting-started/) — the same world where [DRAPI reads only the JVM truststore](/domino-news/posts/drapi-keycloak-oidc/). Whoever actually knows which roots their server trusts, and in which stores, is just cleaning a few certificates by fingerprint this week; whoever doesn't is the one that 9.1 leaves frozen, unsure where to start.

[^cvss]: CVSS (Common Vulnerability Scoring System) is the industry-standard severity score for vulnerabilities, 0–10, with a "vector string" spelling out attack path, complexity, privileges required, and so on. Different scorers can land on different numbers for the same flaw because they assume different attack scenarios.
[^cwe]: CWE (Common Weakness Enumeration) classifies the *type* of weakness. This one sits under CWE-295 (Improper Certificate Validation) and CWE-327 (Use of a Broken or Risky Cryptographic Algorithm) — both pointing at a broken trust relationship rather than an execution-layer break like a memory compromise.
