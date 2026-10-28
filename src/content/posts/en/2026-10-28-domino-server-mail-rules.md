---
title: "Domino Server Mail Rules: Catching Mail Before It Reaches the Inbox"
description: "Some messages you don't want landing in a user's inbox at all — block ones with a certain attachment, divert mail to a departed account, keep a copy of a category for the record. You don't need an agent for this: Domino's server mail rules apply while the message is still in MAIL.BOX, as the router handles it. This piece covers where you set them (the Configuration Settings document's Router/SMTP → Restrictions and Controls → Rules), when they run (as the message lands in MAIL.BOX, each message evaluated once — unlike the client-side rules in a user's mailbox), how conditions work (contains/is operators, no wildcards, AND/OR, case-insensitive), the six actions (Journal to keep a copy, Move to database to quarantine, Don't accept to reject outright, Don't deliver to silently delete or send an NDR, Change routing state to HOLD, Stop processing to skip later rules), and two things to know: Domino doesn't notify the sender or recipient by default, and mail rules are not an anti-virus solution."
pubDate: 2026-10-28T07:30:00+08:00
lang: en
slug: domino-server-mail-rules
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Setting server mail rules (configured at Router/SMTP → Restrictions and Controls → Rules, run as mail lands in MAIL.BOX, condition operators and no wildcards, the six actions, no notification, not anti-virus, set rules to reload) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_settingservermailrules_t.html"
  - title: "Filtering mail using rules (the client-side rules in a user's mailbox, for contrast with server rules) — HCL Notes (official)"
    url: "https://help.hcl-software.com/notes/12.0.0/client/mail_rules_t.html"
  - title: "Setting delivery controls (the delivery-layer controls under the same Router/SMTP → Restrictions and Controls, e.g. maximum message size) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/conf_settingdeliverycontrols_t.html"
relatedJava: []
relatedSsjs: []
---

Some messages you don't want landing in a user's inbox at all: block anything with a certain attachment, divert mail sent to a departed account, keep a copy of a category for the record. You **don't need an agent** for this — Domino's **server mail rules** apply while the message is still sitting in **MAIL.BOX**, as the router handles it. They're a different thing from the rules a user sets in their own mailbox: one is server-side, before the inbox; the other is client-side, after it.

---

## TL;DR

- **Where to set them**: Domino Administrator → **Configuration → Messaging → Configurations**, edit the **Configuration Settings document**, go to **Router/SMTP → Restrictions and Controls → Rules**. The rules live in that Configuration Settings document.
- **When they run**: as the message **lands in MAIL.BOX** (**not** at the mailbox), and **each message is evaluated only once**. That's the difference from the [client-side rules](https://help.hcl-software.com/notes/12.0.0/client/mail_rules_t.html) a user sets in a Notes mailbox, which run **after** the message is in the inbox.
- **Conditions**: pick an item (Sender, Subject, Body, attachment name, Size…) and an operator (**contains / does not contain / is / is not / is less than / is greater than**); chain with **AND/OR**, one exception per condition; **no wildcards** (use contains with a search string, not `*`); text matching is **case-insensitive**.
- **Six actions (one per rule)**: **Journal** (copy it, keep routing), **Move to database** (quarantine it), **Don't accept** (reject outright), **Don't deliver** (silently delete, or send an NDR), **Change routing state** (mark **HOLD**, stuck in MAIL.BOX until an admin acts), **Stop processing** (skip this message's later rules).
- **Two things to know**: when a rule blocks a message, Domino **doesn't notify** the sender or recipient by default; and HCL says plainly that **mail rules are not an anti-virus solution**.

## Where they live, and when they run

Server mail rules are configured in the **Configuration Settings document** ([official: setting server mail rules](https://help.hcl-software.com/domino/14.5.0/admin/conf_settingservermailrules_t.html)): Configuration → Messaging → Configurations, edit the document, go to **Router/SMTP → Restrictions and Controls → Rules**, and click New Rule. (The same Restrictions and Controls area holds other delivery-layer knobs too, like the maximum message size in [delivery controls](https://help.hcl-software.com/domino/11.0.0/admin/conf_settingdeliverycontrols_t.html) — mail rules are the "route by rule" piece of it.)

The key is the **timing**: rules are evaluated as the message is **deposited in MAIL.BOX by the router** — that is, **before** it's delivered to anyone's inbox. And HCL states **"Each message is evaluated only once."** This is the biggest difference from client-side rules:

- **Server mail rules**: server-side, in MAIL.BOX, **before** the inbox, over **all mail that passes through**.
- **Client rules**: in a user's mailbox, **after** the inbox, only for that one mailbox.

Changing a rule doesn't take effect immediately — the server has to **reload** them: automatically about **every five minutes**, or right away with **`set rules`** at the console.

## How conditions work

A rule is one or more **conditions**. Each condition picks a message item (Sender, Subject, Body, attachment name, Size…) and an operator:

- Text: **contains / does not contain / is / is not**.
- Numeric (e.g. Size): **is less than / is greater than** (enter the number as a numeral).

A few practical notes: conditions can be chained with **AND / OR**, each condition can have **one exception**; there are **no wildcards** — HCL's "Text fields do not support wildcard values," so use **contains** with a search string instead of `*`; and text matching is **case-insensitive**.

## The six actions (one per rule)

When the conditions match, a single **action** runs (one per rule):

- **Journal this message**: send a **copy** to the journaling database, then **keep routing** it normally (a record, no effect on delivery; journaling has to be enabled separately under Router/SMTP → Advanced → Journaling).
- **Move to database**: **remove** the message from MAIL.BOX and quarantine it in another database (which must **already exist**) — the classic "drop suspicious mail in a graveyard database."
- **Don't accept message**: **reject** it, with no delivery-failure report from Domino.
- **Don't deliver message**: the server accepts it but doesn't deliver — either **silently delete**, or **send an NDR** (nondelivery report) back to the sender.
- **Change routing state**: mark the message **HOLD**, so it stays in MAIL.BOX until an administrator acts. (This is one source of the held mail [the mail-routing piece](/domino-news/en/posts/domino-mail-routing-mailbox/) describes — a mail rule setting the routing state to Held.)
- **Stop processing**: **skip** any of this message's remaining rules (rules after this one don't run).

## Two things to know first

- **No notification by default**: when a rule blocks a message, HCL is explicit — **"Domino does not notify the sender or recipient if a rule prevents a message from reaching its destination"** — unless the action itself sends one (e.g. Don't deliver → Send NDR). So silently blocking mail with a rule leaves both ends unaware.
- **Not anti-virus**: HCL also says plainly, **"Mail rules are not intended to serve as an anti-virus solution."** Rules are great for routing by rule, keeping records, quarantining, and blocking specific patterns — but virus protection belongs to a dedicated scanning solution, not mail rules.

## Wrap-up

- **Where**: the Configuration Settings document → Router/SMTP → Restrictions and Controls → Rules.
- **When**: as mail lands in MAIL.BOX, each message evaluated once (server-side, before the inbox) — versus client-side mailbox rules.
- **Conditions**: item + operator (contains/is/is less than…), no wildcards (use contains), AND/OR, one exception, case-insensitive.
- **Actions (one per rule)**: Journal / Move to database / Don't accept / Don't deliver (silently delete or NDR) / Change routing state = HOLD / Stop processing.
- **Know**: no notification to sender/recipient by default; mail rules aren't anti-virus. Reload a changed rule with `set rules` or wait ~five minutes.
