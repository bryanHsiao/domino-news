---
title: "The Unread-Marks Trap: They're Per-User, Not a Property of the Document"
description: "A document goes bold with a star beside it — the unread mark looks like a field on the document, but it isn't. It's one of the few things in Domino kept per user: your having read it doesn't mean anyone else has. Driving it from LotusScript with MarkRead/MarkUnread, it's easy to mark for the wrong user (an agent runs as one ID and only touches that ID's unread state); and unread marks don't replicate by default, so the server and your local replica routinely disagree on what's read. This piece explains the mechanism and three traps."
pubDate: 2026-09-21T07:30:00+08:00
lang: en
slug: domino-unread-marks
tags:
  - "Domino Designer"
  - "LotusScript"
sources:
  - title: "Identifying unread documents (per user) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html"
  - title: "Replicating unread marks — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/admn_replicatingunreadmarks_c.html"
  - title: "MarkRead method (NotesDocument) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_MARKREAD_DOCUMENT.html"
  - title: "MarkUnread method (NotesDocument) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MARKUNREAD_DOCUMENT.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
cover: "/covers/domino-unread-marks.webp"
coverStyle: "paper-craft"
---

A document goes bold in a view, with a star (`*`) beside it — this "unread mark" looks like a property of the document, so people assume "setting it to read" is like changing a field. It isn't. Unread marks are one of the few things in Domino kept **per user**, and by default they **don't replicate**. Miss those two facts and you'll go in circles both driving them from code and diagnosing "why is unread out of sync."

## TL;DR

- **Unread is per user**: the [docs](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html) — "A set of unread marks are maintained for each user, so even if one person has read a particular document, the asterisk still appears for other users who haven't read it yet." It is not a field on the document.
- **How to drive it**: `db.UnreadDocuments` (the current user's unread collection), `doc.MarkRead([user])` / `doc.MarkUnread([user])`, and `MarkAllRead` / `MarkAllUnread` on a collection.
- **Trap 1: marking for the wrong user** — `MarkRead` without a name acts on the **current running identity**. An agent runs as one ID and only touches that ID's unread state, not the user's.
- **Trap 2: no replication by default** — unread marks don't replicate unless you enable it, so the server and a local replica routinely disagree; enabling is recommended **only for mail-type databases**.
- **Trap 3: the database may not maintain unread at all** (a DB property) — then there's nothing to drive.

## Unread is "a set per user"

This is the idea to fix first. The [docs](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html):

> "A set of unread marks are maintained for each user, so even if one person has read a particular document, the asterisk still appears for other users who haven't read it yet."

So unread status is **not part of the document** (not an item, not one flag shared by everyone) — it's **each user's own table of "what I've read,"** kept at the database level and keyed by user. Marking a document read only edits **your** table; everyone else's unread state is untouched.

## Driving unread from code

The LotusScript interface is straightforward:

```lotusscript
' the current user's unread collection
Dim unread As NotesDocumentCollection
Set unread = db.UnreadDocuments

' mark one document read / unread (omit the name = current user)
Call doc.MarkRead              ' read
Call doc.MarkUnread            ' unread

' in bulk
Call unread.MarkAllRead        ' mark this whole collection read
```

`MarkRead` / `MarkUnread` can take **a user name**: pass one to mark on that person's behalf, omit it to mark for the current user. That "can take a name" is the root of the next trap.

## Trap 1: an agent marks read for the wrong user

The most common trap: you write an agent to "mark some documents read," it runs fine, and yet the **user still sees them as unread**. That's because `MarkRead` without a name acts on the **current running identity** — an agent on the server usually runs as its **signer or a service ID**, so you only changed that ID's unread state, not the actual user's.

To mark for a specific user, **pass that person's name explicitly**: `Call doc.MarkRead("CN=Somebody/O=Org")`. (And because unread is per user, "programmatically mark an announcement read for the whole company" fundamentally means marking it once per user — there's no shared flag to flip in one shot.)

## Trap 2: unread doesn't replicate by default

The second diagnosis nightmare: **the same document shows read on the server but unread on your local replica** (or vice versa). That's not a bug — unread marks **don't replicate by default**. The [docs](https://help.hcl-software.com/domino/11.0.0/admin/admn_replicatingunreadmarks_c.html):

> "Unread marks can be replicated for selected databases, most notably mail databases, by using the advanced database properties…" — you have to **enable it deliberately**, via advanced database properties, and it's chiefly for **mail**. Once on, "the unread marks are replicated along with the database according to your established replication schedule."

The docs also caution that enabling it on **high-activity, non-mail** databases isn't recommended (performance), and that you should sync unread across replicas before turning it on. So unless you deliberately enabled unread replication, "different replicas show different unread" is normal — don't spend time fixing something that isn't broken.

## Trap 3: the database may not maintain unread at all

One more: you try to change unread and nothing sticks — because the database has **"Don't maintain unread marks"** checked (the Advanced tab of Database properties). For performance, some databases turn unread off. If your design relies on unread, first confirm the database actually maintains it.

## Wrap-up

The counter-intuitive core of unread marks: **they're not a property of the document — they're each user's own table.** Hold that and the three traps resolve — marking from code depends on **whose** unread you touch (omit the name and it's the running identity; agents often mark the wrong one); different replicas disagree because unread **doesn't replicate by default** (enable it deliberately, and only for mail); and if nothing sticks, the database may **not be maintaining unread** at all. Keep "a set per user" in mind and you'll stop chasing your tail.
