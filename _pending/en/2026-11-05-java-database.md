---
title: "Opening a Notes Database in Java: Many Paths, One Trap"
description: "In LotusScript, session.GetDatabase returns Nothing when the open fails, and your reflex Is Nothing check covers you. The same line in Java does NOT return null — getDatabase hands you a Database object anyway, one whose isOpen is false, a shell pointing at a database that isn't there. This covers how to get and hold a Database handle in Java: where it comes from, the open paths (getCurrentDatabase / getDatabase / DbDirectory), how to catch the 'returned an object but didn't open' trap, and where Database sits in the recycle parent-child chain — recycle it too early and the Views and Documents you're holding die with it."
pubDate: 2026-11-05T07:30:00+08:00
lang: en
slug: java-database
tags:
  - "Java"
sources:
  - title: "Database class (Java) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS_JAVA.html"
  - title: "getDatabase (Session - Java) (createonfail and isOpen semantics) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDATABASE_METHOD_JAVA.html"
  - title: "recycle (Java) (parent-child chain and same-thread recycle rules) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "Database"
apiLang: "java"
---

In LotusScript you open a database, and if it fails you get `Nothing`. Your reflex `If db Is Nothing Then` catches it, and you move on. That reflex will hurt you in Java.

Because Java's [`session.getDatabase(server, file)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDATABASE_METHOD_JAVA.html) does **not** return `null`. Database missing, path mistyped, no access — it still hands you a `Database` object. You null-check it, feel safe, and the next line `db.getView(...)` blows up. The object is real; the database it points at never opened.

This piece is about how to **get and hold** a `Database` handle in Java: where it comes from, the paths that open one, how to catch that trap, and where the handle sits in the memory-recycle chain. recycle, threading, and DQL each have their own article — here they get a pointer, not a re-explanation.

---

## TL;DR

- **`Database` is a child of `Session`.** You need a Session before you can get a Database; how to get the Session is [its own story](/domino-news/posts/java-session-notesfactory/). This piece assumes you have one.
- **Three main paths to open one**: inside an agent, `agentContext.getCurrentDatabase()` for the current database; to name another database, `session.getDatabase(server, file)`; to enumerate the databases on a server, `DbDirectory`.
- **The big trap: `getDatabase` doesn't return null.** On the two-argument overload, `createonfail` defaults to `true`, and per the docs, a failed open "creates a Database object even if the specified database cannot be opened," one where "isOpen is false." So the thing to check isn't `null` — it's `db.isOpen()`.
- **Want a clean null?** Use the three-argument overload with `createonfail` set to `false` — the docs: "If false, returns null if the database cannot be opened." Then your familiar null-check means what you think it means.
- **The recycle chain has a direction.** Recycle the `Session` and the `Database` under it dies too; recycle the `Database` and every `View` / `Document` you got from it dies with it. Recycle too early and you've pulled out a handle you're still using.

## Where a Database comes from: it's a child of Session

Java's [`Database`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS_JAVA.html) has a short official definition — "Represents a Notes database." — but the important part is its *lineage*: the class `extends Base`, and the docs state it is "contained" by `AgentContext`, `DbDirectory`, and `Session`.

In other words, you don't `new` a `Database` out of thin air. It always comes from one of those parents. That's unlike LotusScript, where you can `Dim db As New NotesDatabase("", "")` to make an empty one and then `db.Open` it. Java has no such route — you ask Session (or the agent's context, or a DbDirectory) for it.

Having a Session in the first place isn't a given in Java either: LS's `session` is a global you never create, and Java makes you get one yourself. That's a separate topic — see [Getting a Session in Java: NotesFactory, local, and remote](/domino-news/posts/java-session-notesfactory/). Here, assume `session` is already in hand.

## The paths that open a database

**(1) Inside an agent, grab "the current database"** — the common case, your Java agent is attached to some database:

```java
Database db = agentContext.getCurrentDatabase();
```

`agentContext` comes from `session.getAgentContext()`. This path gives you the database the agent runs in — no naming, and no exposure to the isOpen trap below (it's already open).

**(2) Name another database** — cross-database lookups, logging into a different NSF:

```java
Database db = session.getDatabase("Mail01/ACME", "app/orders.nsf");
```

First argument is the server (empty string `""` for local), second is the path relative to the data directory. **This is the path with the trap** — next section.

**(3) Enumerate databases on a server** — when you don't know the exact filename and want to list them, use `DbDirectory`:

```java
DbDirectory dir = session.getDbDirectory("Mail01/ACME");
Database db = dir.openDatabase("app/orders.nsf");
// or by replica ID:  dir.openDatabaseByReplicaID(...)
// or the mail file:   dir.openMailDatabase()
```

`DbDirectory` also has `openDatabaseIfModified` (open only if newer than a given time) and `createDatabase` (make one from scratch). The concept matches LotusScript's `NotesDbDirectory` — see [the DbDirectory piece](/domino-news/posts/notes-db-directory/) — but Java adds one hard rule: **you can't use a `DbDirectory` across threads** (the docs: "do not use DbDirectory across threads"). A background thread needs its own, which is covered in [the NotesThread piece](/domino-news/posts/java-notesthread/).

## The trap that doesn't throw: an object back ≠ a database open

Back to path (2). `getDatabase` has two official overloads:

```java
public Database getDatabase(String server, String db)
public Database getDatabase(String server, String db, boolean createonfail)
```

The whole difference is that third `createonfail` argument — and **the two-argument form treats it as `true`**. Verbatim from the docs:

> "If true or omitted, creates a Database object even if the specified database cannot be opened."
>
> "If the database cannot be opened and createonfail is true or omitted, isOpen is false for the Database object."
>
> "It will create the in-memory object that refers to the non-existent database."

In plain terms: the `session.getDatabase(server, file)` you normally write does **not** return null when the open fails — it returns a "shell" whose `isOpen()` is `false`, an in-memory object pointing at a database that isn't there. Your `if (db != null)` is always true, and the next `db.getView(...)` throws a `NotesException`.

So in Java there are two ways to guard; pick one and hold it:

```java
// Guard A: accept the two-arg shell, check isOpen instead
Database db = session.getDatabase("", "app/orders.nsf");
if (db != null && db.isOpen()) {
    // really opened — go ahead
}

// Guard B: want a clean null, use the three-arg form with false
Database db = session.getDatabase("", "app/orders.nsf", false);
if (db != null) {          // docs: "If false, returns null if the database cannot be opened"
    // now null-check means "opened"
}
```

I lean on Guard B — it puts the null-check back to the instinct you carried over from LotusScript. But plenty of old code uses Guard A (or neither), so when you read someone else's Java agent and see a `getDatabase` followed by only a null-check, no isOpen, that line is a shell waiting to slip through.

(A related fact: the Database class page notes that most of the time "the class library opens a database automatically," with the few exceptions handled through `isOpen` — which is exactly where that check earns its place.)

## Once you have the Database

With the handle solid, the rest is the entry points you already know, the method names nearly identical to LotusScript, just different casing:

- `db.getView("vwOrders")` — a view or folder.
- `db.getDocumentByUNID(unid)` — open a document straight by UNID.
- `db.createDocument()` — a new document.
- `db.search(formula, null, 0)` — scan the whole database by `@formula`.
- `db.FTSearch(query, 0)` — full-text search.
- `db.createDominoQuery()` — a DQL query object. DQL in Java is in [the Java DominoQuery piece](/domino-news/posts/java-dql-dominoquery/).

What matters isn't these methods themselves — it's that **what they hand back is also a handle**, and also needs recycling. Especially the "loop over a pile of documents" case — in Java that's the number-one source of memory leaks, and the correct iteration and recycle order (get the next document using the current one, then recycle the current one) is a topic of its own: [Looping a DocumentCollection in Java](/domino-news/posts/java-collection-iteration/).

## The recycle chain: who dies first, who dies with it

This is the thing Java has that LotusScript doesn't, and it ties straight to `Database`. [`recycle()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html), per the docs: "The recycle method unconditionally destroys an object and returns its memory to the system." Why is it mandatory? Because "Garbage collection has no effect on Domino Objects unless you first explicitly recycle them" — the JVM's GC can't see the native handle behind the object. The full mechanism (and the four official rules, and the loop leak) is in [Rewrote LotusScript in Java and memory blew up? You forgot recycle()](/domino-news/posts/java-recycle-memory/).

For `Database`, two things to remember on this chain:

1. **Recycle has a parent-child direction.** The docs: "Recycling a parent recycles all the children." `Session` is the parent of `Database`; `Database` is the parent of `View` / `Document`. So recycle the `Session` and your `db` dies with it; recycle the `db` and every `View` and `Document` you pulled from it dies too. **The flip side is the trap**: recycle `db` while a loop is still using those documents, and you've pulled the floor out from under yourself. The order is always "children first, keep the parent, recycle the parent last."

2. **Recycle on the thread that created it.** The docs: "Recycle an object in the same thread in which it is created." A `Database` you opened on a background thread shouldn't be thrown back to the main thread to recycle. A background thread should have its own Session, its own database, its own recycling — those rules live in [the NotesThread piece](/domino-news/posts/java-notesthread/).

The good news: if your agent is single-threaded and ends when it's done, recycling the top-level `Session` once usually clears the whole chain — `db` included. Manual per-object recycling is for the "runs long, loops tens of thousands of documents" case.

## What about LotusScript and SSJS?

The same idea of "a database" looks a little different in each language:

- **LotusScript**: `NotesDatabase`. You can `Dim db As New NotesDatabase(server, file)` then `db.Open`, and a failed open returns `Nothing` (so `Is Nothing` does catch it); and you **never recycle** — it's cleaned up when it leaves scope. Those are the two habits hardest to leave behind when you move to Java.
- **SSJS (XPages)**: `database` is a ready-made global pointing at the current NSF — you don't get it, it's handed to you (like LS's `session`); opening another database still goes through `session.getDatabase(...)`. SSJS runs on this same Java API underneath, but inside an XPages request scope the framework usually owns the recycling, so you worry about it far less. How SSJS reaches the back-end document is in [XPages has two documents](/domino-news/posts/ssjs-backend-document/).
- **In one line**: LS gives you `Nothing` and automatic cleanup; Java gives you a **possibly-not-opened non-null object** plus a **recycle chain you count yourself**. Same `getDatabase` line, two different mindsets.
