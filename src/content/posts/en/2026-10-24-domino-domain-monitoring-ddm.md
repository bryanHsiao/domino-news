---
title: "DDM (Domino Domain Monitoring): Domino's Built-in Proactive Monitoring — Probes, Events in ddm.nsf, a Domain-Wide View via the Collection Hierarchy, and Event Handlers That Tell You"
description: "Server trouble is usually 'the users complain first, then you find out.' DDM (Domino Domain Monitoring) is Domino's built-in, proactive-leaning monitoring: it runs probes on a schedule to check the health of databases, the directory, messaging, the operating system, replication, security, the server, and the web, records events into ddm.nsf, and gives you a top-down, feature-oriented view of the whole domain in the Domino Administrator — often with a probable cause and suggested corrective actions. This piece covers what a probe is (and that its configuration documents live in EVENTS4.NSF and take effect immediately), how ddm.nsf stores events, how the collection hierarchy lets one collection server consolidate the whole domain (the collection interval is a fixed 5 minutes), the difference between enhanced and simple events, and how an event handler notifies you — by logging, mail, running an agent, running a program, sending console commands, or an SNMP trap — when an event fires."
pubDate: 2026-10-24T07:30:00+08:00
lang: en
slug: domino-domain-monitoring-ddm
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Domino domain monitoring (DDM) (one place for the whole domain, 50+ probes, within minutes, probable cause and corrective actions, the collection hierarchy, enhanced vs simple events) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_dominodomainmonitoring_c.html"
  - title: "DDM probes (a probe is a discrete check, the eight feature areas, probe documents in EVENTS4.NSF take effect immediately, scheduling) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_ddmprobes_c.html"
  - title: "Event handler notification methods (event handlers in EVENTS4.NSF, the Event Monitor task, log/mail/agent/program/console/SNMP notification) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_eventhandlernotificationmethods_r.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-domain-monitoring-ddm.webp"
coverStyle: "photoreal-3d"
---

Server trouble is usually "the users complain first, then you find out" — and by the time you notice, it's often too late. **DDM (Domino Domain Monitoring)** is Domino's built-in, **proactive**-leaning monitoring: it runs **probes** on a schedule to check the health of various feature areas, records events into **`ddm.nsf`**, gives you a **domain-wide** status view in the Domino Administrator, and can **notify you automatically** when something fires — often with a probable cause and a suggested fix. This piece walks through how DDM's pieces fit together.

---

## TL;DR

- **What DDM is**: monitoring that lets you **see the health of the whole domain from one place**. HCL says it "Recognizes and reports critical server and client issues within minutes," **automatically determines probable cause** ("determines probable cause"), and "Provides corrective actions and links to databases" — not just an alarm, but a next step.
- **Probes**: a **discrete check (or set of checks)** run against one or more servers, databases, and services. HCL ships **50+ probes** across **ten areas**: **administration, application code, database, directory, messaging, operating system, replication, security, server, web**. A probe's **configuration document lives in `EVENTS4.NSF`** and edits **take effect immediately**; it can run on a default schedule, a custom schedule, or **as needed when events occur**.
- **ddm.nsf**: the **Domino Domain Monitor database**, storing events from probes and other built-in checks. **Each server has its own copy**; a collection server's copy also **consolidates** data from its subordinate servers.
- **Collection hierarchy**: name one or more **collection servers** in `EVENTS4.NSF`, and you can see a server's own plus its subordinates' events **in one place** instead of opening `ddm.nsf` on each. The **periodic collection interval is a fixed 5 minutes — it cannot be changed**.
- **Event handler**: a document (also in `EVENTS4.NSF`) defining **what Domino does when an event occurs**; carried out by the **Event Monitor** task, and **only when a handler exists** for the event. Methods (a dozen-plus in all) include: log to a database, mail, run an agent, run a program, send console commands, SNMP trap.

## What DDM is: one place for the whole domain

Traditionally, checking server health meant connecting to each server and reading logs and the console. DDM **centralizes** that: in the Domino Administrator it gives a "top-down, feature-oriented view of the domain status" that you drill down from ([official DDM overview](https://help.hcl-software.com/domino/10.0.1/admin/admn_dominodomainmonitoring_c.html)).

Where it leans proactive: it doesn't wait for you to dig through logs — it **runs checks on its own**, recognizes and reports critical issues within minutes, and — DDM's most valuable part — it **automatically determines probable cause and provides corrective actions with links to the relevant databases**. So a DDM event usually tells you not just "it's broken" but "probably why, and what to do."

Events come in two kinds: **enhanced events** carry specific target info (which server, database, or agent), while **simple events** don't. The views also use **visual indicators** for which problems are most critical, which are resolved, and which aren't.

## Probes: the hand that actually checks

What DDM actually uses to "check" is a **probe**. HCL's definition: "A probe is a discrete check, or set of checks, configured to run against one or more servers, databases, and services." ([official DDM probes](https://help.hcl-software.com/domino/11.0.1/admin/admn_ddmprobes_c.html)).

- **50+ built in**, across **ten areas**: **administration, application code, database, directory, messaging, operating system, replication, security, server, web**. From "is a database's view index corrupt" to "is replication stalling" to "are there security misconfigurations," there's a matching probe.
- **Configuration documents live in `EVENTS4.NSF`** (the Monitoring Configuration database), and edits **take effect immediately** — no restart.
- **Scheduling** comes in three forms: on a **default schedule**, a **schedule you set**, or **as needed when events occur** on a server.

To change what DDM checks and how often, you edit these probe documents in `EVENTS4.NSF`.

## ddm.nsf and the collection hierarchy

The results a probe produces need somewhere to go — that's **`ddm.nsf` (the Domino Domain Monitor database)**: it stores the **events** from DDM probes and other built-in checks. The key point: **each server has its own `ddm.nsf`**.

If you had to open each one individually, you'd lose the "one place for the whole domain" benefit. So DDM has a **collection hierarchy**: name one or more **collection servers** in `EVENTS4.NSF`, and a collection server **consolidates its subordinate (node) servers' events** — you open the collection server's `ddm.nsf` and see its own plus the servers beneath it. The hierarchy can be multi-tiered, or just one level. One number to remember: **the periodic collection interval is a fixed 5 minutes and cannot be changed**.

## Event handlers: how it tells you

DDM "detects and records," but "whether and how to page you" is a separate mechanism: the **event handler** ([official: event handler notification methods](https://help.hcl-software.com/domino/10.0.1/admin/admn_eventhandlernotificationmethods_r.html)).

- Event handler documents also live in **`EVENTS4.NSF`** and define **what action Domino takes when an event occurs**.
- They're carried out by the **Event Monitor** task, and **only when a handler exists for that event** — with no handler, the event just sits in `ddm.nsf` and nothing reaches you.
- HCL lists **a dozen-plus (13) notification/action methods**; common ones are: log to a database, **mail**, **run an agent**, **run a program**, **send console commands**, **SNMP trap** — plus broadcast, pager, relay to another server, sound, log to the UNIX system log, and more.

So "DDM caught it but I got no alert" usually isn't DDM failing to run — it's that **the event has no matching event handler**. To be notified, create one in `EVENTS4.NSF`.

## Wrap-up

- **DDM**: built-in monitoring that shows the whole domain's health from one place; reports within minutes, with probable cause and corrective actions.
- **Probes**: discrete checks against servers/databases/services, 50+ built in across eight areas; configured in `EVENTS4.NSF`, edits immediate; default/custom/event-triggered scheduling.
- **ddm.nsf**: stores events, one per server; a collection server consolidates its subordinates.
- **Collection hierarchy**: name a collection server to see the whole domain in one place; the collection interval is a fixed **5 minutes**; events are enhanced or simple.
- **Event handler**: defined in `EVENTS4.NSF`, carried out by Event Monitor, **notifies only if a handler exists**; methods include log/mail/agent/program/console/SNMP.
