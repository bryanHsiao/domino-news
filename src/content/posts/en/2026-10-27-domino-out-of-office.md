---
title: "Domino Out of Office: Why to Use the Service, Not the Agent"
description: "A user sets an out-of-office auto-reply, comes back and forgets to turn it off so the system keeps replying, or the replies always lag — which of these you get depends on which Out of Office type your server runs: Service or Agent. This piece covers how the two differ (the Service runs inside the mail router, so replies are instantaneous, failover is supported, delegation is integrated with calendar management, it disables itself when the period ends, and it allows periods shorter than a day; the Agent runs on a schedule four times a day by default, must be disabled manually, delegation isn't calendar-integrated, and its minimum period is a day), where you set it (the Server Configuration document's Router/SMTP → Advanced → Control, defaulting to Agent), why you should use the Service today, and two operations: seeing who's out via the Out of Office column on the Files tab, and listing mailboxes with an active Service via Tell router O."
pubDate: 2026-10-27T07:30:00+08:00
lang: en
slug: domino-out-of-office
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Designating the Out of Office service type (Service vs Agent, set in the Server Configuration Router/SMTP → Advanced → Control, defaults to Agent, the trade-offs) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/conf_designatingtheoutofofficeservicetype_t.html"
  - title: "Set user name and enable schedule agent (the request generated when a user enables the OOO agent from the Notes client, needs Editor access) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_setusernameandenablescheduleagent_r.html"
  - title: "Setting up out-of-office notifications (the Notes client side of setting OOO) — HCL Notes (official)"
    url: "https://help.hcl-software.com/notes/12.0.0/client/mail_ooo_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-out-of-office.webp"
coverStyle: "low-poly-3d"
---

A user goes away, sets an out-of-office auto-reply, comes back and forgets to turn it off — so the system keeps blasting a reply at every new message; or the out-of-office reply always lags, going out an hour or two late. These symptoms usually aren't a bug — they're a consequence of which **Out of Office** type your server runs: the **Service** or the **Agent**. The two behave very differently, and today you should almost always use the Service.

---

## TL;DR

- **Two types**: the **Out of Office Service** and the **Out of Office Agent**. You set it in the **Server Configuration document → Router/SMTP → Advanced → Control** (Miscellaneous section); the default is **Agent**.
- **Why the Service wins**: it **runs inside the mail router**, so replies are **instantaneous** and **server failover is supported**; delegation is **integrated with calendar management**; it **disables itself** after the first email once the period ends; and it allows periods of **less than a day (but more than an hour)**.
- **How the Agent differs**: it runs **on a schedule**, **four times a day** by default; it must be **disabled manually** (or it keeps replying); delegation is supported but **not calendar-integrated**; its minimum period is **a day**; delegation also needs a "sign agents on behalf of others" right in the Server document.
- **Which to use**: the Service is for clusters that are all Domino 8+ using the Notes 8 mail template (MAIL8.NTF) — i.e. nearly every environment today. So unless you still run a pre-Domino 8 server, **use the Service**.
- **Two operations**: see who's out via the **Out of Office column on the Files tab** in Domino Administrator; list mailboxes with an active Service with the router command **`Tell router O`**.

## The two types: Service vs Agent

Out of Office has two implementations that decide how it runs ([official: designating the Out of Office service type](https://help.hcl-software.com/domino/14.0.0/admin/conf_designatingtheoutofofficeservicetype_t.html)):

- **Out of Office Service**: the reply logic is **built into the mail router**.
- **Out of Office Agent**: a **scheduled agent** that runs through the mailbox at set times and adds replies to the messages that need them.

You set it in the **Server Configuration document**: Configuration → Server → Configurations, edit the document, go to **Router/SMTP → Advanced → Control**, and find **Out of Office service type** in the Miscellaneous section. HCL is blunt: **"By default, the Out of Office service type is Agent."** So if you've never changed it, your environment is running the older type.

## Why the Service wins

Putting the logic in the router buys several things the Agent can't do:

- **Instant**: a message arrives and the router replies right then. HCL: **"Out of Office responses are instantaneous, server failover is supported."** — instant, and failover-safe.
- **Calendar-integrated delegation**: delegation is supported and **integrated with calendar management** (the delegate needs at least **Editor** access in the ACL).
- **It turns itself off**: once the period ends, it **disables itself after processing the first email** — HCL: **"The service disables itself after processing the first email."** That's the fix for "came back and forgot to turn it off."
- **Short periods**: it supports periods of **less than a day but more than an hour** — handy for stepping out for a few hours.

## How the Agent differs

The Agent is the older mechanism, with a few differences that bite:

- **Scheduled, not instant**: HCL — "By default, the agent executes four times each day on a schedule." Four runs a day, so replies **lag** until the next run.
- **Manual off**: **"The agent must be manually disabled when the Out of Office time period expires."** It won't stop on its own — forget, and it keeps replying.
- **Delegation isn't calendar-integrated**: delegation is supported but **not** integrated with the calendar; and besides Editor access, the delegate needs the "sign agents to run on behalf of others" right granted in the Server document.
- **Minimum a day**: the shortest period is **one day** — you can't set a few hours like the Service.

(When a user **sets and enables** OOO from the Notes client (Tools → Out of Office, completing the dialog), it generates [a request to enable the schedule agent](https://help.hcl-software.com/domino/11.0.1/admin/admn_setusernameandenablescheduleagent_r.html) on the mailbox, and the user needs **Editor** access to that mailbox to set it. The client side of setting OOO is in [the Notes OOO setup page](https://help.hcl-software.com/notes/12.0.0/client/mail_ooo_t.html); this piece is about the **server-side** choice between the two types.)

## Which to use

HCL's applicability is clear: the **Service** is for clusters of Domino 8 servers using the Notes 8 mail template (MAIL8.NTF); the **Agent** is for clusters containing any pre-Domino 8 server.

In plain terms: **today's environments are nearly all Domino 8+, so use the Service** — instant, self-disabling, calendar-integrated delegation, and sub-day periods, strictly better than the Agent. Only fall back to the Agent if you still keep a pre-Domino 8 server around. Changing the **Out of Office service type** field is how you switch between them.

## Two operations worth knowing

- **Who's out**: the **Files tab** in Domino Administrator has an **Out of Office column** — see which mailboxes are currently in OOO state at a glance (this column reflects the Out of Office **Service** state).
- **List mailboxes with an active Service**: at the console, the router command **`Tell router O`** lists the databases with Out of Office Service enabled. (The logic is in the router, so you query it with a router command — which echoes that it shares the same Router task as [mail routing](/domino-news/en/posts/domino-mail-routing-mailbox/).)

## Wrap-up

- **Two types**: Service (built into the router) vs Agent (scheduled); set in the Server Configuration document's Router/SMTP → Advanced → Control, default Agent.
- **Service**: instant, failover-supported, calendar-integrated delegation, self-disables at the end, allows periods < 1 day (> 1 hour).
- **Agent**: scheduled four times a day (lagging), manual off, delegation not calendar-integrated, minimum one day.
- **Choice**: on Domino 8+ (nearly everyone today), use the **Service**; only use the Agent if a pre-Domino 8 server remains.
- **Check**: the Out of Office column on the Files tab for who's out; `Tell router O` for mailboxes with an active Service.
