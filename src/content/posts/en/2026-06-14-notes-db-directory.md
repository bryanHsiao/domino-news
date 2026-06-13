---
title: "NotesDbDirectory: Enumerating Every Database on a Server"
description: "Want an agent that sweeps every NSF on a server and checks each database's ACL or size? That's NotesDbDirectory's job — don't confuse it with the earlier NotesDirectory (which looks up people and groups in the Domino Directory); both end in Directory but do completely different things. This article covers creating it with GetDbDirectory, walking databases with GetFirstDatabase / GetNextDatabase, the four file-type constants, Open / CreateDatabase / OpenDatabaseByReplicaID, and the trap that bites everyone: the NotesDatabase you get back is closed by default and must be Opened before use."
pubDate: 2026-06-14T07:30:00+08:00
lang: en
slug: notes-db-directory
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDbDirectory class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS.html"
  - title: "GetFirstDatabase method (NotesDbDirectory) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD.html"
  - title: "NotesDbDirectory class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDBDIRECTORY_CLASS.html"
relatedJava: ["DbDirectory"]
relatedSsjs: ["DbDirectory"]
cover: "/covers/notes-db-directory.webp"
coverStyle: "paper-craft"
---

You're writing an admin agent: sweep **every NSF** on a server and check whether any ACL is too open, or tally each database's size. The thing is — you have `NotesDatabase` (for one database) and the earlier [`NotesDirectory`](/domino-news/posts/notes-directory/), but that one looks things up in the **Domino Directory** (people, groups, and servers in names.nsf), not the files on disk.

To "list which databases exist on a server", you reach for the similarly named but entirely different [`NotesDbDirectory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS.html). The official definition: "Represents the Notes databases on a specific server or local computer." This article covers how to walk it, what methods it has, and the one trap you're guaranteed to hit.

---

## TL;DR

- Create with `session.GetDbDirectory(server$)`; pass `""` for the **local** computer
- **Walk in two steps**: `GetFirstDatabase(fileType%)` for the first, then loop `GetNextDatabase()` for the rest
- **Four file-type constants**: `DATABASE` (.nsf etc.), `TEMPLATE` (.ntf), `REPLICA_CANDIDATE` (not disabled for replication), `TEMPLATE_CANDIDATE`
- **The big trap**: the `NotesDatabase` you get back is **closed** — the docs say plainly "The database is closed", so call `.Open` before reading anything beyond Title
- More than walking: `OpenDatabase`, `CreateDatabase`, `OpenDatabaseByReplicaID`, `OpenMailDatabase`, `OpenDatabaseIfModified`
- Don't confuse it with [`NotesDirectory`](/domino-news/posts/notes-directory/): that looks up people/groups, this lists database files

---

## Creating it: GetDbDirectory

Get it from `NotesSession`, passing the server you want to inspect:

```lotusscript
Dim session As New NotesSession
Dim dbdir As NotesDbDirectory
Set dbdir = session.GetDbDirectory("Mail01/Acme")
```

Passing an empty string `""` for `server$` means the **local / current computer**. It has just two read-only properties: `Name` (the server name you specified) and `Parent` (the owning `NotesSession`). (`New NotesDbDirectory(...)` also works, but isn't supported under COM — `GetDbDirectory` is the safe choice.)

## Walking: GetFirstDatabase + GetNextDatabase

Walking is the classic "First, then loop Next" pattern. `GetFirstDatabase`'s argument decides which kind of file you list:

| Constant | Selects |
|---|---|
| `DATABASE` | any Notes database (.nsf / .nsg / .nsh) |
| `TEMPLATE` | any template (.ntf) |
| `REPLICA_CANDIDATE` | databases/templates not disabled for replication |
| `TEMPLATE_CANDIDATE` | any database or template |

```lotusscript
Dim db As NotesDatabase
Set db = dbdir.GetFirstDatabase(DATABASE)
Do Until db Is Nothing
    ' process db (note: it's still closed here — see below)
    Set db = dbdir.GetNextDatabase()
Loop
```

`GetNextDatabase` takes no argument — it reuses the file type you gave `GetFirstDatabase`. One official note worth remembering: **"Each time you call this method, the database directory is reset and a new search is conducted."** Every call to `GetFirstDatabase` restarts the search from the top. So call `GetFirstDatabase` once per walk and use `GetNextDatabase` for the rest — don't re-call First inside the loop.

## The big trap: the db you get is closed

This is where `NotesDbDirectory` costs people the most debugging time. The [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html) returned by `GetFirstDatabase` / `GetNextDatabase` is **closed by default**. The official [`GetFirstDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD.html) docs spell it out: "The database is closed. To open it, use the Open or OpenIfModified method in NotesDatabase."

While closed, a few properties (`Title`, `FileName`, `FilePath`) are readable, but most operations (reading the ACL, running a search, opening a view…) need it open first:

```lotusscript
Set db = dbdir.GetFirstDatabase(DATABASE)
Do Until db Is Nothing
    If db.Open("", "") Then        ' open first; continue only if True
        ' now it's safe to read db.ACL, db.Size, etc.
    End If
    Set db = dbdir.GetNextDatabase()
Loop
```

Forgetting `.Open` before reading the ACL is the textbook source of "why is this erroring / returning empty" with this class.

## More than walking

`NotesDbDirectory` can also open or create databases directly, without walking:

| Method | What it does |
|---|---|
| `OpenDatabase(file$)` | open a database by file name directly |
| `OpenDatabaseByReplicaID(replicaID$)` | open by replica ID (handy when the file name is uncertain) |
| `OpenDatabaseIfModified(file$, since)` | open only if changed since a given time |
| `OpenMailDatabase()` | open the current user's mail database |
| `CreateDatabase(server$, file$)` | create a new database at the location you specify |

[`OpenDatabaseByReplicaID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENDATABASEBYREPLICAID_METHOD_DBDIRECTORY_COM.html) is especially useful — the same logical database can have different file names on different servers, but the replica ID stays the same.

The smallest official example (verbatim) just grabs the first one:

```lotusscript
Sub Initialize
  Dim dbdir As New NotesDbDirectory("Snapper")
  Dim db As NotesDatabase
  Set db = dbdir.GetFirstDatabase(DATABASE)
  Msgbox db.Title, , db.FileName
End Sub
```

(Note it only reads `Title` / `FileName`, so it's fine without an Open — but touch the content and you'll need to Open.)

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| Java (`lotus.domino.*`) | `DbDirectory` | `session.getDbDirectory(server)` |
| SSJS / XPages | `DbDirectory` | `session.getDbDirectory(server)` |

The concept is identical across all three: `getFirstDatabase` / `getNextDatabase` to walk, the returned db is likewise closed, and you still open it first. When you write a Java batch sweeping databases on a server, the flow here — and the "open before you use it" trap — carries straight over.
