---
title: "Don't Let Domino Become an Open Relay: Inbound SMTP Controls"
description: "An open relay is a misconfigured SMTP server that relays mail from anyone to anywhere — spammers love it as a free waystation, and the result is your IP on a blocklist and even your legitimate mail not getting out. Domino actually blocks external relaying by default, but you should understand how. This piece covers the inbound relay controls' four fields (allow/deny × destination domain / originating host), how allow and deny interact (allow takes precedence, but an identical entry in both lists has deny win), that Domino checks the original sender, not just the last hop, the enforcement scope (by default only hosts outside the local Internet domain, authenticated users exempt by default, relaxing is not recommended), the add-on DNS blacklists (DNSBL: log only / log and tag / log and reject) and private blacklists / DNS whitelists, and the reverse-DNS check (no PTR, no mail accepted)."
pubDate: 2026-10-31T07:30:00+08:00
lang: en
slug: domino-inbound-smtp-relay-controls
tags:
  - "Domino Server"
  - "Admin"
  - "Security"
sources:
  - title: "Setting inbound relay controls (the four allow/deny fields on the SMTP Inbound Controls tab, allow takes precedence, checks the original sender, * usage) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_settinginboundrelaycontrols_t.html"
  - title: "Specifying enforcement of inbound relay controls (scope: by default only hosts outside the local domain, authenticated users exempt by default, relaxing not recommended) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_specifyingenforcementofinboundrelaycontrols_t.html"
  - title: "Enabling DNS blacklist filters for SMTP connections (DNSBL: log only / log and tag / log and reject, only on hosts subject to relay checks) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/conf_enablingdnsblacklistfiltersforsmtpconnections_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-inbound-smtp-relay-controls.webp"
coverStyle: "risograph"
---

An **open relay** is a misconfigured SMTP server: it relays mail from **anyone** to **anywhere**. Spammers love these — a free waystation to blast spam through *your* server, which lands **your IP on a blocklist** so even your company's legitimate mail stops getting out. The good news: Domino **blocks** external relaying **by default**. But you should understand how it blocks, how far the enforcement reaches, and what you can add — so you never accidentally open a hole.

---

## TL;DR

- **What an open relay is**: an SMTP server that **indiscriminately** takes mail from outside the local Internet domain and relays it on to another external destination. Domino's **inbound relay controls** block that; a new Domino SMTP server **denies external hosts from relaying** by default.
- **Where it's set**: Configuration Settings document → Router/SMTP → Restrictions and Controls → **SMTP Inbound Controls** tab.
- **Four fields**: two allow/deny pairs — one for **destination domains**, one for **originating hosts**: allow only to certain domains / deny to certain domains; allow only from certain hosts / deny from certain hosts.
- **How allow and deny interact**: **allow takes precedence** over a conflicting deny; but when the **same entry** is in both the allow and deny lists, **Domino honors the deny**. An empty allow field means no restriction.
- **Checks the original sender**: when deciding whether to relay, Domino looks at the **original sender, not just the last hop** — blocking a denied source from relaying through an accepted server.
- **Enforcement scope**: by default it applies only to hosts **outside the local Internet domain** (local hosts exempt); **authenticated users are exempt by default** (you can make them checked too); HCL says **relaxing enforcement is not recommended**.
- **Add-ons**: **DNSBL (DNS blacklists)** query the sender's IP on each connection, with an action of **log only / log and tag / log and reject**; plus **private blacklists** and **DNS whitelists** — all of which apply **only to hosts subject to the relay checks**.

## What an open relay is, and how Domino sees it

Domino's docs define an **open relay** as an SMTP server that **indiscriminately** accepts mail from outside the local Internet domain and tries to dispatch it to another external destination — exactly the free waystation spam wants. The mechanism that blocks it is **inbound relay controls**, on the **Router/SMTP → Restrictions and Controls → SMTP Inbound Controls** tab. By default, a Domino SMTP server **won't let external hosts relay** through it.

## The four fields: allow / deny × domain / host

Inbound relay controls have four fields, in two pairs ([official: setting inbound relay controls](https://help.hcl-software.com/domino/11.0.1/admin/conf_settinginboundrelaycontrols_t.html)):

**Destination domains** (where mail may be relayed to):

- **Allow … only to the following external Internet domains**: only relay to the listed domains; others are denied.
- **Deny … to the following external Internet domains**: block relaying to the listed domains; a **`*`** blocks **all** external domains, and others may relay.

**Originating hosts** (who may relay through it):

- **Allow … only from the following Internet hosts**: once populated, only the listed hosts/IPs can relay outbound; all others are denied.
- **Deny … from the following Internet hosts**: block the listed hosts; a **`*`** blocks **all hosts subject to the relay controls**.

Two rules: **allow takes precedence** over a conflicting deny; but when the **same entry** is in both the allow and deny lists, **Domino honors the deny**. An empty allow field means "no restriction."

And one key check: Domino decides whether to relay by the **original sender, not just the last-hop domain** — so "come from a source you denied, hop through a server you allow, then into your domain" is blocked.

## Enforcement: who it actually applies to

Setting allow/deny isn't enough on its own — it matters **who it's enforced against** ([official: specifying enforcement of inbound relay controls](https://help.hcl-software.com/domino/10.0.1/admin/conf_specifyingenforcementofinboundrelaycontrols_t.html)):

- By default, relay checks apply **only to hosts outside the local Internet domain**; hosts **inside** the local domain are exempt. The other choices are "all connecting hosts" or "none."
- **Authenticated users are exempt by default** — someone who's logged in isn't subject to these relay limits; you can change that so authenticated users are checked too, and list hosts to exempt.
- HCL specifically warns that the option to **relax enforcement is not recommended** — loosening the checks is how you open a relay hole.

## Add-ons: DNSBL, private blacklists/whitelists, reverse DNS

Beyond relay controls, Domino can add layers that filter the connecting SMTP host itself:

- **DNSBL (DNS blacklists)**: each incoming connection queries configured DNSBL sites to see whether the sender's IP is on a public spam-source list. The action on a hit: **log only / log and tag / log and reject** ([official: enabling DNSBL](https://help.hcl-software.com/domino/10.0.1/conf_enablingdnsblacklistfiltersforsmtpconnections_t.html)). Note DNSBL is **IPv4 only** — IPv6 connections **skip** the DNSBL check.
- **Private blacklists / DNS whitelists**: your own blacklist, or a whitelist that lets trusted sources skip the checks.
- **Reverse DNS**: inbound connection controls have a "**Verify connecting host name in DNS**" option (**off by default**); turned on, it looks up the connecting IP's **PTR record**, and if Domino **can't resolve** it to a host name (DNS is down, or there's no PTR) it **refuses the mail** (actually accepting the connection and then returning an error at the `MAIL FROM` step, not dropping the connection outright). But HCL warns that legitimate SMTP hosts **aren't required** to have a PTR, so enabling this can **reject valid senders** — use it with care.

One thing they share: **DNSBL and the blacklists/whitelists only apply to hosts subject to the relay checks** — a host you exempted (local domain, authenticated user, whitelist) won't be caught by them. The design is "decide who's in scope first, then filter those in scope."

## Wrap-up

- **Open relay**: an SMTP server that relays external mail to external destinations for anyone; Domino blocks external relaying by default, set on the SMTP Inbound Controls tab.
- **Four fields**: allow/deny × destination domain / originating host; allow takes precedence, an identical entry in deny wins, empty allow = no restriction; `*` blocks all.
- **Checks the original sender**: not just the last hop, blocking detours.
- **Enforcement**: by default only hosts outside the local domain; authenticated users exempt by default; relaxing not recommended.
- **Add-ons**: DNSBL (log/tag/reject), private blacklists, DNS whitelists, reverse DNS (no PTR, no mail) — all only on hosts subject to the relay checks.
