---
title: "In XPages the Database Is Free — the Question Is Whose Rights Opened It"
description: "LotusScript and Java both make you write a few lines to get a Database; in XPages SSJS, database is just there, pointing at the current NSF — you don't even call getDatabase. So the hard part of the Database in SSJS isn't how to get it, it's a question LS and Java rarely force on you: whose rights is this code running with? The user's? Or the XPage's signer's? This covers the database global, how to open other databases (session.getDatabase / getCurrentDatabase), and the session vs sessionAsSigner vs sessionAsSignerWithFullAccess rights model — when you have no choice but to run as the signer."
pubDate: 2026-11-06T07:30:00+08:00
lang: en
slug: ssjs-database
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "Global objects and functions (JavaScript) (database / session / sessionAsSigner / sessionAsSignerWithFullAccess globals) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html"
  - title: "Server-side scripting (the credentials and rights model: session vs sessionAsSigner) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/xpageuser/wpd_scripts_server.html"
  - title: "NotesSession (JavaScript) (getDatabase / getCurrentDatabase / getDbDirectory) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html"
relatedJava: []
relatedSsjs: []
coversClass: "Database"
apiLang: "ssjs"
cover: "/covers/ssjs-database.webp"
coverStyle: "minimalist-mono"
---

LotusScript needs `session.GetDatabase` plus a check; Java needs you to get a Session first, then `getDatabase`, then check `isOpen`. XPages SSJS skips all of it — `database` is just there, a ready-made global pointing at the current application's NSF. You don't even call `getDatabase`.

Precisely because "how to get it" isn't the problem, the real thing to get right about the Database in SSJS is something LS and Java rarely force on you: **whose rights is this server-side script running with?** The user who opened the page? Or the signer of this XPage? Get it wrong and, at best, something that should be readable isn't; at worst, an ordinary user just did something their ACL never granted them.

This piece covers three things: what the `database` global is, how to open another database, and the `session` / `sessionAsSigner` / `sessionAsSignerWithFullAccess` rights model — when you have no choice but to switch rights.

---

## TL;DR

- **`database` is a ready-made global**, officially "represents the HCL Domino database currently being used as a data source" — the current application's data store, nothing to create or open.
- **To open another database**, call `session.getDatabase(server, file)`; `session.getCurrentDatabase()` equals `database`, and `session.getDbDirectory()` gets a directory. It's the same `lotus.domino` API underneath.
- **The real point is rights.** `session` uses the **current user's** credentials; `sessionAsSigner` uses **this XPage's signer's**; `sessionAsSignerWithFullAccess` uses the signer's credentials **plus full access**.
- **The `database` global follows `session`** — it runs with the current user's rights. What the user's ACL can't read, `database` can't read either.
- **When you need `sessionAsSigner`**: the app legitimately has to touch a database the user has no rights to (a central config store, an audit log, a cross-database lookup) — open it with `sessionAsSigner.getDatabase(...)` as the signer, instead of loosening that database's ACL for everyone.

## database: ready-made, pointing at the current application

In an XPages server-side script, `database` is a **global variable** — no declaration, nothing to create. The official [Global objects](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) page defines it as "represents the HCL Domino database currently being used as a data source" — the current application's database, of type `NotesDatabase`.

It's the same treatment as LotusScript's `session` global, or SSJS's own `session`: the framework has it ready on every request, and you just use it. So the typical SSJS starts like this:

```javascript
var view:NotesView = database.getView("vwOrders");
var doc:NotesDocument = database.getDocumentByUNID(unid);
```

The methods under `database` — `getView`, `getDocumentByUNID`, `createDocument`, `FTSearch` — are the same `lotus.domino` API as LotusScript and Java, differing only in casing convention. (DQL is the exception: SSJS's `database` has **no** `createDominoQuery` — `NotesDominoQuery` exists only in LotusScript and Java, so to run DQL from XPages you go through Java; see [DQL in production](/domino-news/posts/dql-production/).)

## To open another database: go through session

`database` only points at the **current** application. To reach another NSF (a cross-database lookup, logging into a shared store), you open it yourself, and the entry point is `session`:

```javascript
// open a named database on a server
var other:NotesDatabase = session.getDatabase("Mail01/ACME", "shared/config.nsf");

// the current database (equivalent to the database global)
var cur:NotesDatabase = session.getCurrentDatabase();

// a database directory
var dir:NotesDbDirectory = session.getDbDirectory("Mail01/ACME");
```

The official [NotesSession (JavaScript)](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html) page describes `getDatabase` as "Creates a NotesDatabase object that represents the database located at the server and file name you specify," and "opens the database, if possible." Note that last clause — "if possible." As in Java, a failed open doesn't always throw on the spot; get in the habit of checking `isOpen()`. Java's "returned an object but didn't open" trap is covered in detail in [the Java Database piece](/domino-news/posts/java-database/), and SSJS runs on the same back end.

## The real question: whose rights is this code running with?

This is where SSJS differs most from LS and Java. With a LotusScript agent you usually know whose identity it runs as (the signer, or a designated runtime user); an XPages server-side script runs, by default, as **the user who opened the page** — and the `database` global and the `session` global both use **their** credentials.

The official [Server-side scripting](https://help.hcl-software.com/dom_designer/14.5.1/xpageuser/wpd_scripts_server.html) page lays out the three identities plainly:

- **`session`** — "assigns credentials based on the user." The current user's credentials, restricted by the application's ACL and the server's Domino Directory security settings. The `database` global rides on this.
- **`sessionAsSigner`** — "assigns credentials based on the signer of the ... XPages design element." The **signer's** credentials instead (still bounded by the ACL and security settings — only the "who" changes to the signer).
- **`sessionAsSignerWithFullAccess`** — the signer's credentials **plus full administrative access**: "allows full administrative access to the application's data." But with a hard condition attached: the signer must actually have that right, or "the session is not created" — you get an empty result, not a smuggled-in back door.

In one line: **`session` (and `database`) is the user's view; `sessionAsSigner` is the signer's view.**

## When you have no choice but sessionAsSigner

The scenario is concrete: your XPage needs to write an audit record into a shared `audit.nsf`, but ordinary users have `No Access` in that database's ACL — correctly, because an audit store shouldn't be open to walk-ins. If you open it with `database` or `session`, the user's rights fall short and the write fails.

The fix is **not** to loosen `audit.nsf`'s ACL (that opens the whole store to everyone for the sake of one feature) — it's to open it with the signer's rights:

```javascript
var audit:NotesDatabase = sessionAsSigner.getDatabase("", "audit.nsf");
if (audit != null && audit.isOpen()) {
    var log:NotesDocument = audit.createDocument();
    log.replaceItemValue("Form", "AuditEntry");
    log.replaceItemValue("User", session.getEffectiveUserName());  // record the real user
    log.replaceItemValue("Action", "ViewedRecord");
    log.save();
}
```

The point is that rights stay **contained**: only this signed XPage can write the log as the signer, and the user never holds that right themselves. Who's the signer? The official rule is "XPages are signed with the ID of the current Domino Designer user upon saving the XPage design element" — the moment you save that XPage, it's signed with your ID. So before deploying, make sure the XPage is signed with an ID that **has** the right access, or `sessionAsSigner` grants something other than what you assumed.

There's a safety net worth knowing too: the XPages SSJS interpreter polices "restricted operations" — it "Rejects embedded Java statements in JavaScript ... if the XPages Signer is not granted permission to perform restricted operations." So if the signer isn't authorized for a restricted operation, even dropping to embedded Java inside SSJS to get around it is blocked.

## What about recycle?

Standalone Java has to count its own `recycle()` calls and release handles (those rules are in [Rewrote LotusScript in Java and memory blew up](/domino-news/posts/java-recycle-memory/)). In the XPages request lifecycle, `database` and `session` are **request-scope globals the framework provides**; their lifetime is owned by the XPages runtime, and you don't need to — and generally shouldn't — recycle them. Extra objects you open yourself via `session.getDatabase(...)` live within the one request; the heavy manual per-object recycling Java forces on you is comparatively rare in XPages. One less thing to carry is a real advantage SSJS has over Java.

## What about Java and LotusScript?

The same `NotesDatabase`, but "getting it" and "rights" differ a lot across the three:

- **LotusScript**: `session.GetDatabase(server, file)` then `db.Open`, returning `Nothing` on failure; rights are usually just the agent's run identity (signer or a designated runtime user) — there's no `sessionAsSigner`-style "switch identity within the same code" mechanism.
- **Java**: get a Session first, then `getDatabase`, and mind the `isOpen` trap and the `recycle` chain — see [Opening a Notes Database in Java](/domino-news/posts/java-database/).
- **The SSJS-specific part** is exactly this piece's subject: `database` is ready-made, and `sessionAsSigner` / `sessionAsSignerWithFullAccess` let you switch to the signer's rights within the same script. For how SSJS reaches the back-end document (`document1` vs the back-end `NotesDocument`), see [XPages has two documents](/domino-news/posts/ssjs-backend-document/).
