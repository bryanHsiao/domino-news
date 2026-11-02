---
title: "Domino Message Disclaimers: Why to Add Them Client-Side"
description: "Many organizations want a legal disclaimer appended to every outgoing message. Domino does this built in, but the setup spans two documents — and there's a real trap: adding it on the server breaks messages that are already signed or encrypted. This piece covers how the two documents split the work (the disclaimer text, position, and format live on a mail policy settings document; the server on/off switch is on the Configuration Settings document's Router/SMTP → Message Disclaimers tab), that disclaimers are added only to outgoing SMTP messages (not incoming), that the position can be Append or Prepend, that they can be added by the client, the server, or both, and the key point: the server adds the disclaimer after the message is signed, so it breaks S/MIME signatures and encryption — HCL recommends using the Notes client wherever possible (the client adds it before signing, so the signature stays valid), which matters especially where signing is required or where you send multibyte character sets like Chinese. Finally: mail policy changes are applied by AdminP (every 12 hours by default, or tell adminp process mail policy to apply now)."
pubDate: 2026-11-02T07:30:00+08:00
lang: en
slug: domino-message-disclaimers
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Setting up and using message disclaimers (the two documents, only outgoing SMTP, client/server/both, server adds after signing so it breaks S/MIME — recommends the client, AdminP applies changes) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_settingupandusingmessagedisclaimers_t.html"
  - title: "Creating a mail policy settings document (the disclaimer text, position Append/Prepend, and format live on the mail policy settings document) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/conf_creatingamailpolicysettingsdocument_t.html"
  - title: "Adding a disclaimer to outgoing iNotes messages (the client side of adding a disclaimer) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_addingadisclaimertooutgoingmessages_t.html"
relatedJava: []
relatedSsjs: []
---

Lots of organizations need it: every **outgoing** message gets a legal disclaimer appended at the end ("This email is intended only for the recipient…"). Domino does this built in — but the setup **spans two documents**, and there's a real trap: **adding it on the server breaks messages that are already signed or encrypted.** This piece lays out how the two documents split the work, and why HCL recommends "add it client-side wherever you can."

---

## TL;DR

- **Two documents**: the disclaimer's **text, position, and format** live on a **mail policy settings document** (the kind the [policy piece](/domino-news/en/posts/domino-policies) covered); the **server on/off switch** is on the **Configuration Settings document → Router/SMTP → Message Disclaimers** tab.
- **Outgoing only**: HCL — **"Message disclaimers are not added to incoming SMTP messages; they are only added to outgoing SMTP messages."** Inbound mail isn't touched.
- **Position and format**: **Append** (at the **end**) or **Prepend** (at the **beginning**); format plain text or HTML.
- **Who adds it**: the **Notes client**, the **server**, or **both**. With both on, the **client** usually adds it (faster); with both off, nothing is added.
- **The trap (most important)**: the **server adds the disclaimer after the message is signed**, so it **breaks S/MIME signatures and encryption** — HCL says directly, **"Whenever possible, use the Notes client to add disclaimers instead of adding them from the server."** The client adds it **before** signing, so the signature stays valid.
- **When changes apply**: a mail policy change is applied by **AdminP**, which runs **every 12 hours** by default; force it with `tell adminp process mail policy`.

## How the two documents split the work

Domino splits disclaimers across **two documents** ([official: setting up and using message disclaimers](https://help.hcl-software.com/domino/11.0.1/admin/conf_settingupandusingmessagedisclaimers_t.html)):

- **The mail policy settings document**: holds the **disclaimer content** — the text you enter in the **Disclaimer text** field is what gets added to the message. The position (append/prepend) and format (plain/HTML) are on this document's Message Disclaimers tab too ([official: creating a mail policy settings document](https://help.hcl-software.com/domino/11.0.0/admin/conf_creatingamailpolicysettingsdocument_t.html)).
- **The Configuration Settings document**: holds the **server switch** — HCL: "You enable and disable message disclaimers for the server using the server Configuration Settings document," on the **Router/SMTP → Message Disclaimers** tab.

So "what the text is" and "whether the server adds it" are separate: content and position on the policy document, server on/off on the Configuration Settings document.

## Outgoing only, and where it goes

Two base behaviors to keep in mind:

- **Only outgoing SMTP mail**: HCL is explicit that incoming mail isn't touched — disclaimers are for mail you send **out** to external recipients, not mail you receive.
- **Append or Prepend**: **Append** puts the disclaimer at the **end** (the common choice); **Prepend** at the **beginning**; format can be plain text or HTML.

## Who adds it: client, server, or both

A disclaimer can be added by the **Notes client**, the **server**, or **both** (the [iNotes outgoing-disclaimer page](https://help.hcl-software.com/domino/11.0.1/admin/conf_addingadisclaimertooutgoingmessages_t.html) is on the client side):

- **Both enabled**: the **client** usually adds it (the faster path), without double-adding.
- **Server only**: the server adds it; **client only**: Notes adds it.
- **Both disabled**: no disclaimer is added to anything.

## The trap: adding on the server breaks signatures

This is the one to remember. **The server adds the disclaimer after the message is already signed** — effectively editing a signed message's content, so the **signature is no longer valid, and encrypted messages have problems too**. (The server technically **can** add it — HCL says it adds disclaimers even to signed and encrypted messages; the problem is that doing so breaks the signature.) HCL is blunt: **"S/MIME signed and encrypted messages are not handled well by Notes,"** and recommends directly:

> **"Whenever possible, use the Notes client to add disclaimers instead of adding them from the server."**

Why is the client fine? Because the **client adds the disclaimer before signing**, and then signs — so the signature covers the complete content including the disclaimer, and **stays valid**. That's the real reason to "prefer the client": not taste, but that **server-side adding breaks signatures**.

## Character sets: relevant if you send Chinese

One more point that matters especially if you send **Chinese (or other multibyte character sets)**: when the **server** adds the disclaimer, the character set is governed by the server's Multilingual Internet mail setting — with **Use Best Match**, characters that can't be represented may turn into substitutes like **`?`**; with **Use Unicode (UTF-8)**, both the message and the disclaimer are re-coded as UTF-8. When the **client** adds it, the outgoing character set is the Notes client's call, so **this character-set problem doesn't arise** — another reason the client is the easier path.

## When changes take effect

The disclaimer text lives on a mail policy settings document, so a change **doesn't take effect immediately**: it waits for the **Administration Process (AdminP)** to roll the policy change out, which runs **every 12 hours** by default. If you can't wait, run **`tell adminp process mail policy`** at the console to apply it now.

## Wrap-up

- **Two documents**: text/position/format on a mail policy settings document; the server switch on the Configuration Settings document's Router/SMTP → Message Disclaimers tab.
- **Outgoing only**: incoming SMTP isn't touched; position Append (end) / Prepend (start), format plain/HTML.
- **Who adds**: client / server / both; with both on the client usually adds, with both off nothing is added.
- **The trap**: the server adds **after** signing → breaks S/MIME signatures/encryption; HCL recommends the **client** (adds before signing, stays valid).
- **Character sets**: watch Best Match (can become `?`) vs UTF-8 for server-added; client-added avoids it.
- **When it applies**: mail policy changes go out via AdminP, every 12 hours by default; `tell adminp process mail policy` to apply now.
