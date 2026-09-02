---
title: "Getting Started with Domino Certificate Management: CertMgr and certstore.nsf Instead of Scattered .kyr Keyrings"
description: "Since Domino 12, TLS certificates no longer live as .kyr keyring files scattered across each server's disk — one CertMgr server task plus one certstore.nsf database manages them all: certificates stored in TLS Credentials documents, private keys encrypted with 256-bit AES, protected by the database ACL, and readable only by the servers you choose. Part one of the certstore series: the model, how to stand certstore.nsf up, what a TLS Credentials document holds, and the full steps to import an existing third-party CA certificate."
pubDate: 2026-09-02T07:30:00+08:00
lang: en
slug: certstore-getting-started
tags:
  - "Admin"
  - "Security"
  - "Tutorial"
sources:
  - title: "Managing TLS certificates with Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html"
  - title: "Setting up the Domino credential and certificate stores — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_set_up_cred_and_cert_stores.html"
  - title: "Managing TLS certificates without Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_managingservercertificatesandcertificaterequests_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/certstore-getting-started.webp"
coverStyle: "low-poly-3d"
---

A picture every Domino admin recognizes: a web server's TLS certificate expires at 2 AM, the site goes down, you log in, and the certificate turns out to live in a `keyfile.kyr` — a keyring file specific to that one server, paired with a `.sth` password-stash file, produced by `kyrtool` or, further back, the Server Certificate Admin application (`certsrv.nsf`). To swap a certificate you re-run the whole dance on that box, push the new kyr out, restart the HTTP task. More servers means multiplying that by the server count. No one watching expiries means something breaks in the middle of the night.

That [manual, without-Certificate-Manager way](https://help.hcl-software.com/domino/14.5.1/admin/conf_managingservercertificatesandcertificaterequests_t.html) is still documented and still works, but it's scattered and it leans on someone remembering. Since Domino 12 there's a mechanism that pulls all of this into one place, and this piece — part one of the certstore series — starts with what it is and how to stand it up.

---

## TL;DR

- **One task plus one database.** Straight from the docs: "HCL Domino 12 introduces a new server task, Certificate Manager (CertMgr), that works with a new database, Certificate Store (certstore.nsf) to manage TLS certificates in your Domino environment." Certificates stop being kyr files on disk and get managed centrally in `certstore.nsf`.
- **certstore.nsf creates itself.** No manual template step — run the `load certmgr` task and the first run creates the database.
- **Certificates live in TLS Credentials documents.** The docs: "certificates generated through Certificate Manager are securely stored directly in TLS Credentials documents in certstore.nsf rather than in keyring files on disk."
- **Keys are encrypted, the database has an ACL.** "certstore.nsf is protected by the database ACL and private keys are protected by 256 bit AES encryption." You also pick which servers can read a private key.
- **Three ways a certificate gets in.** Automatic requests from the Let's Encrypt / ACME CA, a built-in micro CA, and manual import of a third-party CA's certificate. The first two are the next part's subject; this one walks the manual import.

---

## What certstore.nsf actually is

Get the roles straight first. [Certificate Manager](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html) (CertMgr) is a **server task**; `certstore.nsf` (the Certificate Store) is the **database** it operates on. The docs define that database in one line: "This database provides the interface to request, store, and distribute certificates in a secure way." — requesting, storing, and distributing certificates all happen in this one place.

The biggest change from the kyr era is that word *distribute*. Before, a certificate was bolted to one keyring file on one server. Now it lives in `certstore.nsf`, and an NSF replicates — the same certificate can be shared by several servers while you maintain it in exactly one spot. Swapping a certificate means editing one document, not crawling into every box.

## Standing certstore.nsf up

The good news is there's almost nothing to "build." The [official steps for setting up the stores](https://help.hcl-software.com/domino/14.5.1/admin/conf_set_up_cred_and_cert_stores.html) open with: "Create a certificate store on the server using the `load certmgr` console command. This starts the Certificate Manager task, which will create the certstore.nsf database." — type `load certmgr` at the server console and the task creates `certstore.nsf` as it comes up.

To have it there on every restart, add `CertMgr` to the `ServerTasks` setting in notes.ini, or schedule it with a Program document. Then open `certstore.nsf` — inside is the interface where you manage certificates: a Certificate Authority document (the Basics tab), a set of trusted root certificates, and TLS Credentials documents one per certificate. Restart the Domino server afterward so the HTTP task picks up the new certificate source.

## TLS Credentials documents: the unit of storage

The thing inside `certstore.nsf` that actually holds a certificate is a **TLS Credentials document**. A TLS Credential is more than "a certificate" — it's a bundle: which **host names** this certificate covers (when one IP maps to several Internet Sites, each gets its own SAN — Subject Alternative Name), **which servers can read its private key**, who issued it (the provider), and the key pair and certificate chain themselves.

That "which servers can read the private key" field (Servers with access) is the heart of the certstore security model: the private key is **encrypted for the specific servers you name**, and only those can decrypt and use the certificate. It's also why the same NSF can safely replicate to several machines — a server that wasn't granted access can hold the document and still not read the private key.

## Importing an existing third-party CA certificate

If you already hold a certificate signed by a commercial CA (DigiCert, Sectigo, and the like), or company policy mandates an internal CA, you take the **manual import** path. In `certstore.nsf`:

1. Go to the **TLS Credentials** view and click **Add TLS Credentials**.
2. In **Host names**, enter the host name of the internet-facing server; when one IP maps to several web hosts through Internet Sites, add a SAN for each host.
3. In **Servers with access**, select which Domino servers may read this certificate's private key.
4. In **Certificate Provider**, select **Manual**.
5. Click **Submit Request**. CertMgr generates the key pair and a CSR. When **Status** turns to **Waiting**, copy the contents of the **Certificate signing request (CSR)** field and submit it to your CA.
6. Once the CA signs and returns the certificate, paste the received certificates into the document's **Certificates & Roots (PEM)** field and click **Submit Request** again to finish.

Certificates in and out are **PEM** (Base64-encoded DER). Throughout, the key pair is generated by CertMgr inside the database — the private key never lands as a bare file on disk, which is exactly the point relative to the kyr era.

## The security model: ACL + AES-256, not a bare file on disk

Pulling the security story into one place: in the kyr era, the private key was a `.kyr` file on disk, guarded by filesystem permissions plus a `.sth` password-stash file — a backup, a machine move, or a mis-set permission could leak it. certstore replaces that with two layers of native Domino protection: the whole `certstore.nsf` is gated by the **database ACL** for who can open it, and each **private key inside is further encrypted with 256-bit AES**, decryptable only by the servers named in "Servers with access." The private key stops being a file you could copy wholesale and becomes data protected by both ACL and encryption — with its readership pinned.

## Wrap-up

The certstore model comes down to one sentence: **take the kyr keyring files scattered across each server's disk and consolidate them into a single ACL-protected, AES-encrypted `certstore.nsf`, managed and distributed by the CertMgr task.** Standing it up is just `load certmgr`; one certificate is one TLS Credentials document; an existing third-party certificate comes in through the Manual provider.

That covers what it is, how to stand it up, and how to place a certificate by hand. What actually moves most people to certstore, though, is that it can request and renew certificates from Let's Encrypt **automatically** over the ACME protocol — no more 2 AM certificate swaps — which is the subject of [Part 2: CertMgr + ACME automatic certificates](/domino-news/en/posts/certstore-acme). And how the certificates in certstore are actually consumed by outbound connections like `NotesHTTPRequest` and the Domino REST API — plus Domino 14.5 moving the trusted-root source from `cacerts.pem` into the Domino Directory — is left to [Part 3: certstore from the developer's side](/domino-news/en/posts/certstore-for-developers).
