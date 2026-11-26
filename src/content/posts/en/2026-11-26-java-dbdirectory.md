---
title: "Iterating Domino Databases in Java: getFirstDatabase Hands You a Closed Database"
description: "A Java agent needs to sweep every database on a server — an inventory, a report, every instance of one template, filter by modified date. You use DbDirectory: getDbDirectory to get the directory, getFirstDatabase/getNextDatabase to walk it. But there's a trap: the Database getFirstDatabase hands back is closed — until you call db.open(), only a subset of its methods work. The open* family (openDatabase, openDatabaseByReplicaID, openDatabaseIfModified) is the opposite: they return an already-open database. This covers getting a DbDirectory, the four type constants, closed vs open, opening by replica ID / modified date, and that createDatabase gives you a blank slate."
pubDate: 2026-11-26T07:30:00+08:00
lang: en
slug: java-dbdirectory
tags:
  - "Java"
sources:
  - title: "DbDirectory class (Java) (getDbDirectory, getFirstDatabase/getNextDatabase, open* family) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS_JAVA.html"
  - title: "getFirstDatabase (DbDirectory - Java) (the returned database is closed) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD_JAVA.html"
  - title: "openDatabaseByReplicaID (DbDirectory - Java) (open by replica ID) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENBYREPLICAID_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "DbDirectory"
apiLang: "java"
cover: "/covers/java-dbdirectory.webp"
coverStyle: "oil-chiaroscuro"
---

A Java agent needs to sweep the databases on a server: an inventory, which ones came from a given template, which changed recently. You find `DbDirectory`, call `getDbDirectory` for the directory, and walk it with `getFirstDatabase` / `getNextDatabase`.

You get the first `Database`, go to read its title, view count, last-modified time — and most of the methods come back empty or throw. Because the `Database` [`getFirstDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD_JAVA.html) hands you is **closed**. Without `db.open()`, the docs say, "only a subset of its methods are available."

This covers getting a `DbDirectory`, the four type constants, the closed-vs-open distinction (the trap people hit), opening by replica ID / modified date, and that `createDatabase` gives you a blank slate.

---

## Getting a DbDirectory

[`DbDirectory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS_JAVA.html) is, in the docs, "Represents the Domino databases on a server or the local computer." You build it from Session:

```java
DbDirectory dir = session.getDbDirectory(null);   // null = the session's environment (local)
// session.getDbDirectory("Mail/Acme") → a named server
```

- **Local is `null`, not an empty string** — docs: "Use null to indicate the session's environment."
- Remote has a hard rule: "Must be null for remote (IIOP) operations." Over IIOP you can only pass null, not another server's name.

## Iterating: getFirstDatabase(type) + getNextDatabase

`getFirstDatabase(int type)` with `getNextDatabase()` walks the directory. `type` is one of four constants (from the official constants page):

| Constant | Value | Official meaning |
|---|---|---|
| `DbDirectory.DATABASE` | 1247 | any database (NSF, NSG, or NSH file) |
| `DbDirectory.TEMPLATE` | 1248 | any template (NTF file) |
| `DbDirectory.REPLICA_CANDIDATE` | 1245 | any database or template not disabled for replication |
| `DbDirectory.TEMPLATE_CANDIDATE` | 1246 | any database or template |

One detail: "Each time you call this method, the database directory is reset and a new search is conducted." So **don't call `getFirstDatabase` again in the middle of a loop** — it starts over from the top.

## The trap: getFirstDatabase returns a closed Database

This is the cut people hit with this class. The docs' Usage section is blunt: "The returned database is closed. If you do not open the database, only a subset of its methods are available. See isOpen in Database."

So as you walk, **open each database with `db.open()` before using most methods**:

```java
DbDirectory dir = session.getDbDirectory(null);
Database db = dir.getFirstDatabase(DbDirectory.TEMPLATE);   // closed
while (db != null) {
  System.out.println(db.getTemplateName());   // a few properties read while closed
  db.open();                                   // ← without this, the next line gets nothing
  System.out.println("Last modified: " + db.getLastModified().getLocalTime());
  db = dir.getNextDatabase();                  // next one, also closed
}
```

A few properties like `getTemplateName()` and the filename read while closed; but `getLastModified()`, `getViews()`, opening documents — those need `open()`. The symptom of missing it: "the loop runs fine, but all the data I expected is empty." That's almost always a missing `db.open()`.

## The open* family: these return an open database

Opposite to `getFirstDatabase`, the `open*` group **returns an already-open Database** (or `null`) — no second open needed:

- `openDatabase(dbfile)` / `openDatabase(dbfile, failover)` — opens a database. With `failover` true, if it can't open on the current server an attempt is made on another cluster server ("if there is a cluster"); but "For remote (IIOP) access, failover is always false."
- [`openDatabaseByReplicaID(rid)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENBYREPLICAID_METHOD_JAVA.html) — opens by replica ID (which survives the file being renamed or moved, so it's the sturdiest handle).
- `openDatabaseIfModified(dbfile, date)` — opens only if a document changed since `date`, otherwise leaves it unopened; `date` can't be null. Good for "process only if changed" jobs.
- `openMailDatabase()` — opens the current user's mail database.

The mnemonic: **"iterate" (getFirstDatabase) returns closed; "open" (open*) returns open.** Mix them up and you'll either miss an `open()` or open twice.

## createDatabase: a blank slate

`createDatabase(dbfile)` / `createDatabase(dbfile, open)` makes a new database; `open` decides whether it's opened. The docs warn: "Because the new database is not based on a template, it's blank and does not contain any forms or views." So it comes out with **no design at all** — you supply forms/views yourself (or copy from a template instead).

## What about LotusScript and SSJS?

The same `DbDirectory`:

- **LotusScript**: `NotesDbDirectory`, with `GetFirstDatabase` / `GetNextDatabase` / `OpenDatabase` — same "GetFirstDatabase returns a closed database, call `.Open` first", no recycle.
- **SSJS / XPages**: the same `session.getDbDirectory()`, used when an XPages admin tool lists databases or opens one by replica.
- **The Java-specific part** isn't the API (the methods are shared) — it's the setting: a back-end / scheduled Java agent doing server-level inventory, maintenance, or reporting. `DbDirectory` is the entry point; just keep straight that `getFirstDatabase` hands you a closed database and `open*` hands you an open one.
