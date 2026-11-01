---
title: "Domino Message Tracking: Where Did That Message Actually Go?"
description: "A user says 'the message I sent didn't arrive' — how do you find where it actually went, where it's stuck, or whether it ever left? That's message tracking. It records each message's handling trail — who sent it, where it went, what state it's in — so you can trace a single message in the Message Tracking Center. It's different from last time's mail journaling: journaling keeps a full copy of the message, tracking keeps the metadata about where it went. This piece covers how to turn it on (the Configuration Settings document's Router/SMTP → Message Tracking, off by default), how the MTC (Mail Tracking Collector) task gathers the tracking logs the Router produces into MTSTORE.NSF, the options worth knowing (collection interval default 15 minutes, logging subjects off by default for privacy, who's allowed to track defaulting to LocalDomainServers, retention controlled by replication settings), and the tell mtc console commands."
pubDate: 2026-11-01T07:30:00+08:00
lang: en
slug: domino-message-tracking
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Configuring the server for message tracking (enabled on Router/SMTP → Message Tracking, collection interval 15 min, Log message subjects default No, Allowed to track defaults to LocalDomainServers, the Tracking Center tracks a single message) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_configuringtheserverformessagetracking_t.html"
  - title: "Controlling the Mail Tracking Collector (MTC creates MTSTORE.NSF in MTDATA, collects the Router's MTC logs, tell mtc process/quit/compact/reindex/purge) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_controllingthemailtrackingcollector_c.html"
  - title: "Tools for mail monitoring (where message tracking sits among the mail-monitoring tools) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_toolsformailmonitoring_c.html"
relatedJava: []
relatedSsjs: []
---

A user says "that message I sent this morning never arrived" — how do you find out **where it went, where it's stuck, or whether it ever left**? That's what **message tracking** is for: it records each message's handling trail — who sent it, where it went, what state it's in — so you can trace a single message in the **Message Tracking Center**. It's different from last time's [mail journaling](/domino-news/en/posts/domino-mail-journaling/): journaling keeps a **full copy** of the message, tracking keeps the **metadata about where it went** — one stores content, the other records the trail.

---

## TL;DR

- **What it is**: records message-handling activity (who sent to whom, where, what state) so you can trace a single message. **Versus journaling**: journaling stores copies (content); tracking stores metadata (the trail).
- **How to turn it on**: **off by default**. On the **Configuration Settings document → Router/SMTP → Message Tracking** tab, set **Message tracking** to Enabled.
- **Who collects it**: the **MTC (Mail Tracking Collector)** task — once enabled, it **automatically creates `MTSTORE.NSF`** (in the **MTDATA** subdirectory of the data directory) and **periodically** gathers data from the tracking log files the Router produces into that store.
- **Options worth knowing**: **collection interval** (how often, in minutes — **default 15**, which HCL notes can affect performance), **Log message subjects** (whether to record **subjects** — **default No**, a privacy consideration), **Don't track messages for** (exclude users/groups), **Allowed to track messages** (who can track — **blank = only the LocalDomainServers group**), and **retention** via the database's **replication settings** (not set on this tab).
- **How to trace**: in Domino Administrator's **Tracking Center** tab, track a single message's **status**.
- **MTC commands**: `tell mtc process` (collect now), `tell mtc quit` (stop MTC without stopping the Router), `tell mtc compact`, `tell mtc reindex`, `tell mtc purge <days>`.

## What it is, and how it differs from journaling

Message tracking records a **trail**: as each message is handled, the Router logs information about how it was processed, and you can later use those records to **trace a specific message** — did it arrive? on which server? when?

It's easy to confuse with **journaling** from last time, but the purpose differs:

- **Journaling**: copies the **full content** of a message for the record (compliance).
- **Message tracking**: records only the **metadata** — **where the message went and its state** (diagnostics).

So "I need to reproduce the whole message" is journaling; "I need to know whether this message arrived, and where it's stuck" is tracking. (It's one of Domino's [mail-monitoring tools](https://help.hcl-software.com/domino/11.0.1/admin/admn_toolsformailmonitoring_c.html).)

## How to turn it on, and who collects it

You enable it on the **Configuration Settings document → Router/SMTP → Message Tracking** tab ([official: configuring the server for message tracking](https://help.hcl-software.com/domino/10.0.1/admin/admn_configuringtheserverformessagetracking_t.html)), setting **Message tracking** to **Enabled** (default Disabled).

Once on, the actual work is done by the **MTC (Mail Tracking Collector)** task ([official: controlling the MTC](https://help.hcl-software.com/domino/14.0.0/admin/admn_controllingthemailtrackingcollector_c.html)):

- It **automatically creates `MTSTORE.NSF`** (the MailTracker Store), in the **MTDATA** subdirectory of the data directory.
- The Router produces raw tracking log files as it handles mail; the MTC task **periodically collects** those into `MTSTORE.NSF`.
- So there are two stages: **the Router writes logs → MTC collects them into the store → the Tracking Center reads the store**.

## A few options worth knowing

On the same Message Tracking tab:

- **Message tracking collection interval**: how often the MTC collects, in minutes. HCL says this number **can affect server performance** and recommends the **15-minute default**.
- **Log message subjects**: whether to record **subjects** in the store — **default No**. Logging subjects makes "find a message by subject" easy but has a **privacy** impact (you're keeping every message's subject) — the companion **Don't log subjects for** can exclude specific senders.
- **Don't track messages for**: users/groups whose sent mail isn't tracked (e.g. to keep ISpy probe messages out of `MTSTORE.NSF`).
- **Allowed to track messages / Allowed to track subjects**: who may track messages (or subjects) on this server. **Blank (default) means only members of the LocalDomainServers group** can track — so it isn't open for anyone to look up others' mail trails.
- **Retention**: this tab doesn't set retention; to limit how many days of data `MTSTORE.NSF` keeps, use the database's **replication settings**.

## How to trace a message

With it on, go to Domino Administrator's **Messaging → Tracking Center** tab to **track a single message's status**. Give it the sender/recipient/date clues, and it queries `MTSTORE.NSF` for that message's handling trail — telling you how far it got and whether it was delivered.

(When you need to stop the MTC, collect immediately, or maintain the store, use the console `tell mtc` family: `tell mtc process` to collect now, `tell mtc quit` to stop MTC without stopping the Router, and `tell mtc compact` / `reindex` / `purge <days>` for maintenance.)

## Wrap-up

- **What it is**: records each message's handling trail (metadata) to trace a single message; a different job from journaling (which stores copies).
- **How to turn it on**: Configuration Settings → Router/SMTP → Message Tracking → Enabled (off by default).
- **Who collects**: the MTC task creates `MTSTORE.NSF` (MTDATA subdirectory) and periodically collects the Router's tracking logs.
- **Options**: collection interval default 15 min (affects performance), Log subjects default No (privacy), Don't track for, Allowed to track blank = LocalDomainServers only, retention via replication settings.
- **How to trace**: Domino Administrator's Tracking Center tab; maintain with `tell mtc process/quit/compact/reindex/purge`.
