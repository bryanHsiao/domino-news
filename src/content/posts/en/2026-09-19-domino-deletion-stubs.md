---
title: "Why Deleted Documents Come Back: Deletion Stubs, the Purge Interval, and Two Ways They Resurrect"
description: "You delete a document and days later it's back — not a haunting. In Domino a delete doesn't erase the document; it leaves a deletion stub, a marker that lets replication carry \"this one was deleted\" to the other replicas. Stubs get cleaned up on the purge interval (default 90 days). Documents \"resurrect\" for one of two reasons: the stub was purged before it replicated, or the same document was edited on one replica and deleted on another and the edit won. This piece explains the mechanism, both causes, and the settings that prevent it."
pubDate: 2026-09-19T07:30:00+08:00
lang: en
slug: domino-deletion-stubs
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Deleted documents reappear — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html"
  - title: "Limiting the contents of a replica (purge interval) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html"
  - title: "Deleting inactive documents — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/tune_deletinginactivedocuments_t.html"
relatedJava: []
relatedSsjs: []
---

You delete a document and a few days later it's back; or the thing you deleted is still there on a colleague's copy, and one replication brings it right back. This isn't a haunting — it's how Domino's **delete mechanism** actually works. Once you understand deletion stubs and the purge interval, this "document resurrection" stops being mysterious.

## TL;DR

- **A delete leaves a stub, not nothing**: deleting a document leaves a **deletion stub** — a small marker recording "this one was deleted" so replication can carry the deletion to the other replicas.
- **Stubs have a shelf life (the purge interval, default 90 days)**: old stubs get cleaned up; Domino checks and removes them at **one-third of the interval** (30 days by default).
- **Resurrection cause #1: the stub was purged too early** — it got cleaned up before it replicated out, so another replica still holds the document and replicates it back.
- **Resurrection cause #2: the edit won** — the same document was edited on one replica and deleted on another between replications, and the edit takes precedence over the delete.
- Avoid it: **replicate more often than the purge interval**, and don't set the purge interval too low.

## The "stub" a delete leaves behind

The [docs](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html) put it plainly:

> "When a document is deleted, it leaves behind a deletion stub. When the database replicates, Notes uses the deletion stub to identify and delete the same document in the replica."

So deleting a document doesn't scrub it clean off disk — it leaves a **deletion stub**: a tiny marker carrying the document's identity (its UNID) and a timestamp. Its one job is to let **replication** know "this one was deleted — go delete the same document on the other replicas too." Without the stub, replication has no way to carry the *deletion* forward.

## How long stubs live: the purge interval

Stubs don't stick around forever (or a database would fill with delete markers). They're cleaned up on the **purge interval**. The [docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html):

> "Deletion stubs are markers that remain from deleted documents so that Domino knows to delete documents in other replicas of the database."

The default purge interval is **90 days**, and Domino checks for cleanup at **one-third of the interval**:

> "It checks for deletion stubs that require removal at one-third of the purge interval. For example, assuming the default value, 90 days, when a user opens a database, Domino checks if it has been at least 30 days since it removed deletion stubs, and if so it removes any deletion stubs that are at least 90 days old."

So by default a stub lives roughly 90 days, with a cleanup pass about every 30. That 90 days exists for a reason — it has to **last long enough for every replica to have replicated the deletion out.**

## Resurrection #1: the stub was purged before it replicated

The first — and most classic — cause: **the stub got purged before it replicated out.** The [docs](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html):

> "If Notes purges the deletion stubs before they replicate, deleted documents can reappear after the next replication."

Picture it: server A deletes the document and leaves a stub, but this database's purge interval was set very short (or it hasn't replicated with B in a long time). The stub gets cleaned up — the document is truly gone on A, with no evidence it was ever deleted. Now B (which still holds the document and never got the deletion) replicates with A and sends the document back **as if it were new data** — and it "resurrects."

The avoidance rule is blunt ([docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html)):

> "be sure to replicate more frequently than the purge interval; otherwise, deleted documents can be replicated back to the replica."

**Replicate more often than the purge interval.** So replicas that were offline for a long time, or databases whose purge interval someone shortened, are the ones most prone to this resurrection.

## Resurrection #2: the edit beat the delete

The second cause has nothing to do with stubs — it's replication's **conflict-resolution rule**: for the same document, edited on one side and deleted on the other, the edit wins. The [docs](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html):

> "If a document is edited multiple times on one server and deleted on another server between replication sessions, the edited document takes precedence because it underwent the greatest number of changes, even if the deletion was the most recent change."

And it holds even with a single change each, if the edit came after the delete:

> "If somebody deletes a document on one server and then someone else updates the document on another server once between replication sessions, the edit overrides the deletion because both documents were updated once and the edit occurred after the deletion."

So: you deleted it on A, but in the same window someone edited it on B. At the next replication, Domino decides the *edited* copy should survive (more changes, or a later edit) → **your deletion is overwritten and the document is back.** This is especially common in multi-user, multi-replica setups.

## How to set it, how to avoid it

- **Don't set the purge interval too low**: it lives in Replication Settings (Space Savers); too short means stubs don't live long enough, which is exactly the resurrection risk. The default 90 days is right for most cases.
- **Replicate often enough**: at least more frequently than the purge interval, so deletions have time to reach every replica.
- **Watch long-offline replicas**: a replica that comes back after being offline longer than the purge interval can drag long-deleted documents back — the same concern behind the official [deleting-inactive-documents](https://help.hcl-software.com/domino/12.0.0/admin/tune_deletinginactivedocuments_t.html) mechanism.

## Wrap-up

Deleted documents resurrect not because Domino is broken but because its deletes run on **deletion stubs + replication**: the stub carries the deletion outward, the purge interval decides how long the stub lives. Resurrection is almost always one of two causes — **the stub was purged before it replicated** (replication too slow / purge interval too short), or **the same document was edited and deleted and the edit won.** Keep the purge interval generous and replication frequent, and the haunting stops. For replication itself, see [NotesReplication and replication settings](/domino-news/en/posts/notes-replication).
