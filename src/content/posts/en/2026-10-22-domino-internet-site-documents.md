---
title: "Where Domino Reads Its Web Config: Internet Site Documents vs the Server Document, the All-or-Nothing Rule, and Why Ports Stay in the Server Document"
description: "You change a Domino web setting and nothing happens — often it's not a wrong value, it's the wrong place: Domino's Internet-protocol configuration comes from two sources, the older Server document (Web Server Configurations / virtual servers) and the newer Internet Site documents (stored in the Domino Directory and managed centrally). Which one a server reads is decided by one switch on the Server document's Basics tab. This piece covers how the two models switch, which protocols an Internet Site document configures (Web/IMAP/POP3/SMTP Inbound/LDAP/IIOP), why edits don't need a restart, an easy-to-hit all-or-nothing rule (if one protocol on a server uses Internet Sites, all protocols must), what the Web Site document's Basics/Configuration/Domino Web Engine/Security tabs each control, which settings (TCP/IP port, SSL port, server access) always stay in the Server document, and how to confirm from the HTTP startup message which source the server is actually using."
pubDate: 2026-10-22T07:30:00+08:00
lang: en
slug: domino-internet-site-documents
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Understanding Internet site documents (what they are, the six protocols, stored in the Domino Directory and shared across servers, dynamic edits, the all-or-nothing rule, how a server chooses its source, what stays in the Server document) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/inst_understandinginternetsitedocuments_c.html"
  - title: "Hosting Web sites (enabling Internet Sites, creating a Web Site document, the tabs) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_hostingwebsites_t.html"
  - title: "Configuring a Web Site document (the Web Site document's Basics/host names, Configuration, Domino Web Engine, Security tabs) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/trial_config_internet_site.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-internet-site-documents.webp"
coverStyle: "oil-chiaroscuro"
---

You change a Domino web setting — some HTTP option, a session timeout, which site maps to which database — and **nothing happens**. Often it isn't a wrong value, it's the **wrong place**: Domino's Internet-protocol configuration comes from **two sources**, and a server reads only one of them at a time. Knowing which it reads, and how to switch, is the starting point for every Domino web-config problem.

---

## TL;DR

- **Two config sources**: the older **Server document** (Web Server Configurations, i.e. the old virtual servers) and the newer **Internet Site documents**.
- **One switch decides which**: the Server document's **Basics tab** option "**Load Internet configurations from Server\Internet Sites documents**." **Off** = the server uses Server document settings; **on** = it reads Internet Site documents instead (toggling it needs a **restart**).
- **What Internet Site documents are**: documents in the **Domino Directory**, one type per Internet protocol (**Web/HTTP, IMAP, POP3, SMTP Inbound, LDAP, IIOP**); one can serve one or several servers, so they're **managed centrally**. And edits are **dynamic — no restart**.
- **All-or-nothing (easy to hit)**: on a given server, once you use an Internet Site document for **one** protocol, you must use them for **all** protocols. You can't run HTTP via Internet Sites and LDAP via the Server document.
- **Some settings always stay in the Server document**: even with Internet Sites on, the **TCP/IP port and status, the SSL port and status (including TCP→SSL redirection), and server access** are still set in the Server document.
- **How to confirm**: every time HTTP starts/restarts, the console prints whether it's getting config from Internet Sites or the Server document.

## Two models, and that switch

Domino's web (and other Internet-protocol) config has historically lived in two places:

- **Web Server Configurations in the Server document** (originally "virtual servers"): settings tied to a single Server document.
- **Internet Site documents**: standalone documents in the **Domino Directory**.

Which one a server reads comes down to the **Server document → Basics tab** switch "**Load Internet configurations from Server\Internet Sites documents**" ([official: understanding Internet site documents](https://help.hcl-software.com/domino/10.0.1/admin/inst_understandinginternetsitedocuments_c.html)):

- Switch **off**: HCL's wording is "the server defaults to Server document settings."
- Switch **on**: it reads from Internet Site documents instead.

Toggling the switch itself **requires a server restart** (it's on the Server document; the full enable-and-host steps are in [official: Hosting Web sites](https://help.hcl-software.com/domino/11.0.1/admin/conf_hostingwebsites_t.html)). This is one of the most common reasons "I created a Web Site document but it does nothing": the **switch is still off**, so the server never reads those documents.

## Internet Site documents: central and dynamic

An Internet Site document is a Domino Directory document "used to configure the Internet protocols supported by Domino servers." Three things matter:

- **One type per protocol**: **Web (HTTP), IMAP, POP3, SMTP Inbound, LDAP, IIOP**.
- **Across servers**: because they live in the Domino Directory, one document can serve **one or several** servers — so protocol settings can be **managed centrally** instead of per Server document.
- **Edits are dynamic**: HCL verbatim — "Modifications to Internet site documents (including the creation of new Site documents) are dynamic" — change (or create) one and it takes effect in minutes, **no restart**. (Note: that's editing a Site document's *content*; the "use Internet Sites at all" switch above still needs a restart when toggled.)

## All-or-nothing: the easy trap

This rule catches people: on a given server, **once you use an Internet Site document for one protocol, you must use Internet Site documents for all Internet protocols on that server**. HCL's wording: "You must also use Internet site documents for all Internet protocols on that server."

So you **can't** configure HTTP with a Site document while still configuring LDAP through the Server document. It's the whole server on Internet Sites, or the whole server on the Server document — no mixing. Before switching, inventory **every** Internet protocol in use on that server and move them together.

## Configuring a Web Site document

With the switch on, from Domino Administrator go to **Configuration → Web → Internet Sites**, and **Add Internet Site → Web** to create a Web Site document ([official: configuring a Web Site document](https://help.hcl-software.com/domino/12.0.0/admin/trial_config_internet_site.html)):

- **Basics tab**: the site name, organization, and the **host names / addresses** mapped to this site (which URLs route to it).
- **Which servers host the site**: an optional field; **servers not listed won't load this site's config** — another common reason "one server just won't serve this site."
- **Configuration tab**: allowed HTTP methods, etc.
- **Domino Web Engine tab**: **session authentication** (how web login works — the next piece covers this).
- **Security tab**: access control.
- Afterward you can add **Web Site Rules** (redirects/substitutions) and file protection.

## What still stays in the Server document

An important but easily missed boundary: **even with Internet Sites on, these are still set in the Server document** —

- The **TCP/IP port number and status**
- The **SSL port number and status** (including TCP→SSL redirection)
- **Server access** settings

So "which port is HTTP on, is SSL enabled" is always in the Server document — don't look for it in the Web Site document.

## How to confirm which source a server reads

Don't guess: **every time the HTTP task starts or restarts, the console prints a line** saying whether it's getting config from **Internet Sites** or the **Server document (Web Server Configurations view)**. When nothing you set is taking effect, check that line first — it tells you directly where the server is reading from.

## Wrap-up

- **Two sources**: the Server document (Web Server Configurations) vs Internet Site documents (Domino Directory, cross-server).
- **The switch**: the Server document Basics option "Load Internet configurations from…Internet Sites documents," restart to toggle; it decides which source.
- **Internet Site documents**: one type per protocol (six), centrally managed, content edits dynamic (no restart).
- **All-or-nothing**: once one protocol on a server uses Internet Sites, all protocols must.
- **Always in the Server document**: TCP/IP port, SSL port (incl. TCP→SSL redirection), server access.
- **Confirm**: read the HTTP start/restart console line — Internet Sites or Server document.
