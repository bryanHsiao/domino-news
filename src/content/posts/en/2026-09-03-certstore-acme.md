---
title: "Wiring Domino CertMgr to Let's Encrypt: Automatic TLS Certificate Requests and Renewals over ACME"
description: "Manual certificate import still means swapping every 90 days, and still means forgetting. This piece (part two of the certstore series) covers CertMgr's real killer feature: requesting, configuring, and renewing free, trusted TLS certificates from Let's Encrypt automatically over the ACME protocol. Set up the two ACME account profiles (Staging/Production) and Global Settings, walk the request flow and the six things CertMgr does automatically after Submit, understand HTTP-01 vs DNS-01 challenges, and see why the micro CA is test-only, plus ECDSA and key rollover."
pubDate: 2026-09-03T07:30:00+08:00
lang: en
slug: certstore-acme
tags:
  - "Admin"
  - "Security"
  - "Tutorial"
sources:
  - title: "Managing TLS certificates with Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html"
  - title: "Requesting a certificate from the Let's Encrypt CA — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_requesting_a_certificate_2.html"
  - title: "Configuring the ACME account profiles — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_configuring_acme_accounts.html"
relatedJava: []
relatedSsjs: []
---

[Part 1](/domino-news/en/posts/certstore-getting-started) moved certificates out of scattered kyr files and into `certstore.nsf`, and walked the manual third-party CA import — copy the CSR, send it to the CA, wait for the signature, paste it back. That's cleaner than the kyr era, but it's still **manual**. And a Let's Encrypt certificate is only valid for 90 days, which means that copy-and-paste dance repeats four times a year, once per internet-facing host. Forget one, and the site still goes down at 2 AM.

What actually moves people to certstore isn't "central management" — it's the thing this piece is about: **fully automating certificate requests and renewals.** This is part two of the certstore series.

---

## TL;DR

- **CertMgr's killer feature is full automation.** One sentence from the docs sums up its role: "CertMgr simplifies and secures Domino web server operations by providing the ability to automatically request, configure, and renew free, widely trusted TLS certificates from the Let's Encrypt certificate authority (CA) using the ACME protocol."
- **Setup is just two things.** Fill in the two ACME account profiles (`LetsEncryptStaging` for testing, `LetsEncryptProduction` for real use) with an email and accepted terms, then set the default provider and key algorithm in Global Settings.
- **Requesting a certificate = provider = ACME, enter the host name, click Submit.** The CSR, challenge, retrieving the certificate chain, and deployment are all done automatically by CertMgr.
- **How a certificate proves it's yours.** ACME validates control of the domain with a challenge — HTTP-01 (over port 80/443, most common) or DNS-01 (which supports wildcard certificates).
- **The micro CA is test-only.** The docs are explicit: "Certificates from a microCA are not intended for production use." Internet-facing production certificates go through Let's Encrypt.

---

## ACME and Let's Encrypt: automating the whole chain

Names first. **Let's Encrypt** is a free, widely trusted certificate authority (CA); **ACME** (Automated Certificate Management Environment) is the automation protocol it uses — request, validate, issue, renew, all machine-to-machine, no human in the loop. [CertMgr](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html) has a built-in ACME client, wiring that chain into Domino.

The difference from Part 1's manual import lands in one line: in the manual path, *you* copy the CSR out, paste it into the CA, and paste the signed certificate back; in the ACME path, all of that is **done for you by CertMgr**. You only describe "which hosts I want a certificate for" — the protocol runs the rest.

## Setup: two ACME account profiles + Global Settings

Before requesting anything, `certstore.nsf` ships with two predefined [ACME Account profile documents](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_configuring_acme_accounts.html) to configure: `LetsEncryptProduction` and `LetsEncryptStaging`. In each, you provide an **email** for notifications and accept Let's Encrypt's terms of agreement.

**Rehearse with Staging first.** Let's Encrypt's production environment rate-limits requests per domain, so hammering it with a misconfigured setup gets you throttled; Staging issues certificates that aren't trusted (the browser warns), but the flow is identical — perfect for confirming your port 80 / DNS setup works before switching to Production.

Global Settings is where those requests get their defaults: **Certificate provider** set to ACME (to use the Let's Encrypt CA), **Key algorithm** defaulting to RSA with a default key size of 4096, and **ACME account** set to Staging or Production. Every new certificate inherits these, so you don't re-enter them each time.

## Requesting a Let's Encrypt certificate

Once configured, [requesting a certificate](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_requesting_a_certificate_2.html) is short:

1. Make sure the **HTTP task is running** on that server (the HTTP-01 challenge needs it).
2. Open `certstore.nsf`, go to **TLS Credentials > By Host Name**, and click **Add TLS Credentials**.
3. Set **Certificate provider** to **ACME**.
4. In **Host names**, enter the internet-facing host names to sign (multiple allowed; wildcards only with DNS-01; up to 30 SANs).
5. In **Servers with access**, choose which servers may use this certificate — the private key is encrypted for them (the same model as Part 1).
6. Other fields inherit the Global Settings defaults — adjust if needed.
7. Click **Submit Request**.

After you click, CertMgr does all of this automatically: **generates and stores the key pair → builds and submits the CSR → handles the challenge (HTTP-01 or DNS-01) → uses the ACME protocol to request the signed certificate chain, polling the CA until it's available → writes the chain back to the TLS Credentials document → generates a keyfile and deploys it to the server's data directory.** Compared with Part 1's manual flow, the whole copy-the-CSR step just disappears — that's the value of automation.

## HTTP-01 or DNS-01: proving the domain is yours

ACME doesn't hand out certificates for free — it first makes you prove "this domain really is yours." That step is the challenge, and CertMgr supports two:

- **HTTP-01**: the most common. The CA connects to your host on **port 80/443** and checks for a validation file CertMgr placed at a known path. So before requesting, that server's HTTP task must be up and port 80 reachable from outside.
- **DNS-01**: CertMgr puts a TXT record in your DNS for the CA to verify. It's more work (you need to be able to change DNS), but **only DNS-01 can sign wildcard certificates** (`*.example.com`), and it suits servers that don't expose port 80.

Picking one: a single host with port 80 open → HTTP-01; wildcards, or port 80 inconvenient → DNS-01.

## Automatic renewal: the actual reason

Here's the point. CertMgr runs as a server task on a schedule, and the docs are explicit that it can automatically **renew** these Let's Encrypt certificates — as a certificate nears expiry, the same ACME flow runs again and swaps in a fresh one, with no one going back into `certstore.nsf` by hand. Let's Encrypt's short 90-day lifetime, paired with automatic renewal, turns into an advantage: certificates rotate often, so the exposure window from a leaked key is short — and you do nothing. (The official docs don't state a specific "renew N days before expiry" number, so this piece won't invent one.)

This is certstore's most practical selling point: no more "the certificate expired at 2 AM and took the site down."

## micro CA, ECDSA, and key rollover

Three quick additions:

- **micro CA**: CertMgr has a built-in mini-CA that signs certificates in one click. But its role is explicit in the docs — "A quick and easy way to generate TLS certificates for testing and development purposes is by creating and using a microCA," and "Certificates from a microCA are not intended for production use." Handy for spinning up certificates on a test box or an internal demo, but **don't sign a public production site with it.**
- **ECDSA**: beyond the default RSA, CertMgr supports ECDSA (NIST P-256 / P-384 curves) for ACME accounts and TLS 1.2 host keys — shorter keys and cheaper handshakes at equivalent strength.
- **key rollover**: you can request a key rollover when needed — the more typical TLS host key rollover, or an ACME account key rollover. Both certificate and account keys can be rotated without starting over.

## Wrap-up

Part 1 got certificates into `certstore.nsf`; Part 2 makes them **grow on their own**: configure the two ACME account profiles and Global Settings, request with provider = ACME + a host name + Submit, and CertMgr handles the CSR, challenge, retrieval, and deployment — then renews automatically. HTTP-01 is easiest for a single host, DNS-01 gives you wildcards, and the micro CA stays test-only.

Once certificates live in `certstore.nsf`, the next question is: how do Domino's **outbound connections** — `NotesHTTPRequest`, the Domino REST API — actually consume the certificates and trusted roots stored here? And what's the story with Domino 14.5 moving trusted roots from `cacerts.pem` into the Domino Directory? That's the subject of [Part 3: certstore from the developer's side](/domino-news/en/posts/certstore-for-developers).
