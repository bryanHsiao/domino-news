---
title: "DQL Production-Ready: Catalog Maintenance, Permissions, and sessionAsSigner"
description: "The two real walls when shipping DQL to production: how the Design Catalog gets maintained automatically (bootstrapping brand-new NSFs, incremental refresh after design changes), and why regular users hit the 'You don't have permission' error — plus the sessionAsSigner / scheduled-agent solutions. The final pattern is verified against Domino 12 production logs, with a production-ready Java helper class to drop in."
pubDate: 2026-05-03T08:30:00+08:00
lang: en
slug: dql-production
tags:
  - "DQL"
  - "LotusScript"
  - "Domino Designer"
  - "Performance"
  - "Security"
sources:
  - title: "Domino Query Language overview — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_overview.html"
  - title: "NotesDominoQuery class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOMINOQUERY_CLASS.html"
  - title: "DominoQuery class (Java) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_DOMINOQUERY_CLASS_JAVA.html"
cover: "/covers/dql-production.png"
coverStyle: "low-poly-3d"
---

> 📚 **The "DQL Trilogy" series**
> - **Part 1**: [DQL in Practice: SQL-Looking Syntax, Notes-Specific Traps Everywhere](/domino-news/en/posts/dql-getting-started)
> - **Part 2**: [DQL Pitfalls: 6 Query-Writing Details the Official Docs Don't Spell Out](/domino-news/en/posts/dql-pitfalls)
> - **Part 3**: DQL Production-Ready (you are here)

Once you can write working DQL queries, **shipping them to production** brings two more challenges that the official docs are vague about:

1. **How the Design Catalog gets maintained automatically** — bootstrapping brand-new NSFs, incremental refresh after design changes, and why an in-memory cache is overengineering
2. **Permissions** — why regular users hit "You don't have permission to perform this operation", how to use `sessionAsSigner`, and why a Java helper doesn't carry signer identity by itself

This article verifies each conclusion against real Domino 12 production logs, and ends with a **production-ready Java helper class** you can drop into your project.

If you don't have the basics yet, start with [Part 1 DQL Getting Started](/domino-news/en/posts/dql-getting-started); if your queries return wrong results or hit weird error messages, see [Part 2 Pitfalls](/domino-news/en/posts/dql-pitfalls) first.

## Why the Design Catalog matters

DQL needs to know which views exist in each NSF, what they're called, and what columns each view exposes — that "design index" is the **Design Catalog**. **Bottom line up front**:

| Your query shape | Design Catalog needed? |
|---|---|
| `Form = 'Customer'` (bare-field query) | ❌ No. DQL falls back to a full NSF scan — slow but works |
| `'Customers'.Country = 'Taiwan'` (view name + column) | ✅ Required, otherwise errors out |
| `in ('Customers') and Country = 'Taiwan'` (scoped by view) | ✅ Required, otherwise errors out |

**As soon as your query mentions a view name** (the single-quoted form), you need the Design Catalog — because that catalog is DQL's **only** way to know what view names exist and what columns each view exposes. Without it, DQL can't tell what `'Customers'` even refers to.

The classic trap: a developer adds a view called `Vtest` and tries to scope a query to it using the documented syntax:

```sql
in ('Vtest') and Form = 'Ftest'
```

You get this error:

```text
Domino Query execution error: Unexpected internal error - validation error
Error opening view name or named document set - [Vtest] does not exist or open failed
(Call hint: NSFCalls::NSFDbGetNamedObjectID, Core call #0)
```

The message reads as "the view doesn't exist", but the view is right there in Designer and opens fine. The real cause is that **this NSF's Design Catalog hasn't been built yet, or hasn't been refreshed since the design change.**

### Two server-console commands to know

| When | Command |
|---|---|
| First-time DQL enablement (build the Design Catalog for this NSF) | `load updall <db-path> -e` |
| After any design change (added/modified/removed view, renamed columns, etc.) | `load updall <db-path> -d` |

`<db-path>` is relative to `Domino\Data`, e.g. `apps\crm.nsf`.

### The big warning: relying on console-only is an SOP landmine

This is the part that bites everyone. The scenario:

1. You ran `load updall apps\crm.nsf -e` once and DQL works fine
2. A developer adds a new view named `Vtest` in Designer
3. You run `in ('Vtest')` → boom, `does not exist or open failed`
4. You spend an hour debugging before remembering: you never ran `load updall apps\crm.nsf -d`

**Leaning on an admin to remember `load updall -d` is rarely workable**: there are too many NSFs, deploys are frequent, and the developer pushing the design change usually doesn't have server-console access. Pushing catalog sync onto the admin team is just burying the landmine in the handoff.

The next section solves this from app code.

### Version note: where the catalog lives

- **Domino 10.x**: the Design Catalog is a standalone file `GQFdsgn.cat`, sitting next to the NSF in the data directory
- **Domino 11+**: the Design Catalog moved inside the NSF as hidden design elements (not visible in Designer by default). No `.cat` files appear at the filesystem level anymore, but the `load updall -e` / `-d` workflow is identical

After upgrading an older NSF to 11+, you still need to run `load updall <db-path> -e` once to populate the catalog inside the NSF.

### Advanced: explicitly mark fields as DQL-usable

If you have specific fields you want DQL to use as query conditions through a view index, add this to the view's selection formula:

```text
SELECT @IsAvailable($DQLField)
```

That view then becomes a candidate index source for DQL — the query planner will prefer it over a full NSF scan.

## Sync the catalog from app code (recommended)

`NotesDominoQuery` exposes two properties to trigger catalog sync from app code:

| Property | Equivalent console command | Behavior |
|---|---|---|
| `RefreshDesignCatalog = True` | `load updall <db> -d` | Before the next `Execute` / `Explain`, **incrementally sync** the catalog |
| `RebuildDesignCatalog = True` | `load updall <db> -e` | Before the next `Execute` / `Explain`, **fully rebuild** the catalog |

### Three field-tested facts (Domino 12.x)

**Fact 1: The Catalog is NSF-persistent state (Domino 11+)**

The catalog lives inside the NSF as hidden design elements — not in-memory state. **It survives server restart, HTTP task restart, JVM restart**. An NSF only needs its catalog built once; after that it persists permanently (unless the NSF itself is deleted and recreated).

Field log (first round of queries after a server restart — every NSF returns successfully with no harvest activity):

```
03:23:35  HTTP JVM: DB [dorm] 找到 1 筆
03:23:35  HTTP JVM: DB [docdb] 找到 6 筆
... (12 NSFs all succeed, zero harvest log lines)
```

**Fact 2: `RefreshDesignCatalog = True` is a ~0ms no-op when the catalog is already current**

HCL checks internally whether the catalog needs updating before doing real harvest work. When nothing's changed, the console gets no `harvested` message and the cost is essentially zero — so you can **safely turn it on for every query**.

Field log (every query carries `setRefreshDesignCatalog(true)`, no design changes):

```
04:06:40  HTTP JVM: DB [dorm] 找到 3 筆
04:06:40  HTTP JVM: DB [law] 找到 14 筆
... (12 NSFs, zero harvest log lines, all near-instant)
```

**Fact 3: `RefreshDesignCatalog` automatically does an incremental harvest on stale catalogs**

When the design has just changed, the next query carrying Refresh detects it and updates the catalog automatically — **no manual reset, no in-memory cache, no scheduled agent**.

Field log (after editing the design of LAW and EForm):

```
04:07:59  CTI\LAW\LCM_Ext2.nsf harvested, ... 278.534 msecs
04:07:59  HTTP JVM: DB [law] 找到 14 筆
04:08:00  CTI\EForm.nsf harvested, ... 468.698 msecs
04:08:00  HTTP JVM: DB [EForm] 找到 4 筆
```

**Exception: Refresh cannot bootstrap a brand-new NSF**

For an NSF that's never been catalogued, `RefreshDesignCatalog = True` **fails**; you must use `RebuildDesignCatalog = True` for the first build. The HCL doc on `updall -d` says "If the catalog doesn't already exist, updall automatically creates it" — **but the API behaves differently from the console command**. Refresh does not auto-bootstrap.

Field log (a freshly added workorder.nsf that's never been catalogued):

```
04:06:27  HTTP JVM: DQL: catalog 缺失於 [CTI\Safety\workorder.nsf] — 執行 Rebuild 後重試
04:06:28  CTI\Safety\workorder.nsf harvested, ... 963.684 msecs
04:06:28  HTTP JVM: DB [workorder] 找到 0 筆
```

When the catalog is missing, DQL surfaces this marker phrase in the error: **`needs to be cataloged via updall -e`**.

### Final pattern: always Refresh + catch Rebuild

Combining the three facts and the one exception, the recommended pattern is:

```vb
' LotusScript
Function RunDql(db As NotesDatabase, query As String) As NotesDocumentCollection
    Dim dq As NotesDominoQuery

    ' Phase 1: Refresh + execute (current catalog ~0ms / stale auto-incremental)
    On Error Goto RebuildAndRetry
    Set dq = db.CreateDominoQuery()
    dq.RefreshDesignCatalog = True
    Set RunDql = dq.Execute(query)
    Exit Function

RebuildAndRetry:
    ' Phase 2: brand-new NSF (no catalog) → Rebuild + retry
    If InStr(Error$, "needs to be cataloged via updall -e") = 0 Then Error Err
    Set dq = db.CreateDominoQuery()
    dq.RebuildDesignCatalog = True
    Set RunDql = dq.Execute(query)
End Function
```

Properties:
- ✅ 99% of queries: ~0ms overhead
- ✅ Design changes: auto incremental refresh
- ✅ Brand-new NSF: catch + Rebuild bootstraps it once
- ✅ **No in-memory cache, no reset, no SOP needed**

### Sibling properties

Two more "sync before next query" properties live on the same object: `RefreshFullText` (refreshes the FT index before the query) and `RefreshViews` (refreshes any view the query will touch). Same `True` → next-`Execute`-syncs pattern.

## Permissions: catalog operations require Designer-level ACL

Both `RefreshDesignCatalog` and `RebuildDesignCatalog` write into the NSF's catalog design elements, which requires **at minimum Designer-level ACL**. Regular users (Reader / Author / Editor) running the operation get:

```text
NotesException: DQL execution failed ... cause=[
Domino Query execution error:
您沒有權限執行此作業 (You don't have permission to perform this operation)
]
```

> ⚠️ The Final pattern above looks fine in code, but **deploy it to production where regular users trigger it and you'll wall straight into permissions**. Catalog operations cannot run as the end user.

### Why some contexts hit this and some don't: execution identity

Catalog operations run as **the identity in effect when DQL is invoked**. Different deployment models have different identities:

| Deployment model | Catalog op runs as | Permission issue? |
|---|---|---|
| **Scheduled / event-triggered agent** | Agent's signer (typically admin / server ID) | ✅ OK, agent self-elevates |
| **XPages SSJS using sessionAsSigner** | XPages app's signer (admin) | ✅ OK, sessionAsSigner elevates |
| **XPages SSJS calling a Java helper (no elevation)** | **Logged-in user** | ⚠️ Regular users hit permission errors ← **the case here** |
| **Domino REST API task receiving external HTTP** | The user authenticated by the request | ⚠️ Depends on the user's permissions |

The key observation: **a Java helper class doesn't "automatically carry" signer identity**. Even if the Java code was written by the developer and the JAR was signed by an admin, when called from SSJS it inherits the calling identity (the logged-in user). **Elevation must happen on the SSJS side**, by opening the Database via `sessionAsSigner.getDatabase()` and passing that into Java. The Java side can't elevate by itself.

### XPages solution: `sessionAsSigner`

XPages SSJS has a `sessionAsSigner` global that returns a Session for the identity who signed the XPages app (typically an admin / Designer):

```javascript
var dbPath = "CTI/EForm.nsf";

// Open the DB as the signer — catalog operations now have permission
var db = sessionAsSigner.getDatabase("", dbPath);

var util = new service.DQLUtil();
var result = util.executeQuery(db, dqlQuery);
```

**Prerequisite**: The XPages app must have been signed by an ID with at least Designer / Manager rights. Check Domino Designer → `File → Application → Properties → Design` tab → the "Signed by" field.

### Safety caveat: reader-fields bypass

⚠️ Running queries via signer is essentially running them with admin rights — **reader fields and ACL get bypassed**. If your NSF uses reader fields to control "who sees which docs", users running queries through your code may see docs they shouldn't → **data leak**.

Defenses (recommended top-down):

1. **Bake the user identity filter into the query** (simplest): every query gets a `wdocAuthor = 'CN=...'` style explicit user filter; never write "list all" queries
2. **Two-DB architecture**: queries go through `session.getDatabase()` (user DB, ACL applies); catalog operations go through `sessionAsSigner.getDatabase()` (signer DB). The Java API splits into two parameters — more complex but safe

### Outside XPages

`sessionAsSigner` only exists inside the XPages context. Alternatives elsewhere:

- **Scheduled agent**: write a scheduled agent with "Run on" set to the right server, signed by an admin ID, running catalog maintenance on schedule or on demand
- **`NotesFactory.createSessionWithFullAccess()`**: pure-Java path to an admin session, requires `notes.ini` to list `FullAccessAdministrator`. More dangerous, generally not recommended

## Java production-ready helper

The full-pattern helper, including error enrichment and pairing with `sessionAsSigner`:

```java
package service;

import lotus.domino.Database;
import lotus.domino.DocumentCollection;
import lotus.domino.DominoQuery;
import lotus.domino.NotesException;

public class DQLUtil {

    /**
     * Execute a DQL query.
     * @param db must be opened via sessionAsSigner.getDatabase() because catalog
     *           operations require Designer-level ACL
     * @param dqlQuery the DQL query string
     */
    public DocumentCollection executeQuery(Database db, String dqlQuery) throws NotesException {
        if (db == null) throw new NotesException(0, "DQLUtil: Database is null");
        if (!db.isOpen()) throw new NotesException(0, "DQLUtil: Database is not open");
        if (dqlQuery == null || dqlQuery.trim().isEmpty()) {
            throw new NotesException(0, "DQLUtil: query is empty");
        }

        String dbPath = safeFilePath(db);

        // Phase 1: Refresh + execute
        DominoQuery dql = null;
        try {
            dql = db.createDominoQuery();
            dql.setRefreshDesignCatalog(true);
            DocumentCollection col = dql.execute(dqlQuery);
            if (col == null) throw new NotesException(0, "DQL execute returned null");
            return col;
        } catch (NotesException firstError) {
            if (!isCatalogMissingError(firstError)) {
                throw rethrowWithContext(firstError, dbPath, dqlQuery);
            }
            System.out.println("DQL: catalog missing on [" + dbPath + "] — running Rebuild + retry");
        } finally {
            recycle(dql);
        }

        // Phase 2: Rebuild + retry (only reached for brand-new NSFs)
        DominoQuery dqlRebuild = null;
        try {
            dqlRebuild = db.createDominoQuery();
            dqlRebuild.setRebuildDesignCatalog(true);
            DocumentCollection col = dqlRebuild.execute(dqlQuery);
            if (col == null) throw new NotesException(0, "DQL execute returned null (after Rebuild)");
            return col;
        } catch (NotesException secondError) {
            throw rethrowWithContext(secondError, dbPath, dqlQuery);
        } finally {
            recycle(dqlRebuild);
        }
    }

    private static boolean isCatalogMissingError(NotesException ne) {
        String text = ne.text;
        return text != null && text.contains("needs to be cataloged via updall -e");
    }

    private static NotesException rethrowWithContext(NotesException ne, String dbPath, String query) {
        String causeText = (ne.text != null) ? ne.text : "(no text)";
        String enrichedMsg = String.format(
            "DQL execute failed [%s] query=[%s] cause=[%s]", dbPath, query, causeText
        );
        NotesException rethrow = new NotesException(ne.id, enrichedMsg);
        rethrow.setStackTrace(ne.getStackTrace());
        return rethrow;
    }

    private static void recycle(DominoQuery dql) {
        if (dql != null) {
            try { dql.recycle(); } catch (NotesException ignore) {}
        }
    }

    private static String safeFilePath(Database db) {
        try { return db != null ? db.getFilePath() : "null"; }
        catch (NotesException e) { return "<unable to get path>"; }
    }
}
```

SSJS caller:

```javascript
var db = sessionAsSigner.getDatabase("", "CTI/EForm.nsf");
var util = new service.DQLUtil();
var result = util.executeQuery(db, dqlQuery);
```

## Catalog-related error message lookup

| Error fragment | Meaning | Fix |
|---|---|---|
| `needs to be cataloged via updall -e` | NSF has never been catalogued | Catch and retry with `setRebuildDesignCatalog(true)` |
| `您沒有權限執行此作業` / `You don't have permission` | Catalog op running as a regular user | XPages → switch to `sessionAsSigner.getDatabase()`; agent route → run on the server as admin |
| `Field is not selectable in any view` | DQL has no matching view, falls back to full NSF scan | Add a view, or add `SELECT @IsAvailable($DQLField)` to the view's selection formula |

---

> 📚 **End of the trilogy**
>
> - **Part 1**: [DQL Getting Started](/domino-news/en/posts/dql-getting-started) — why DQL exists, basic syntax, calling from various languages
> - **Part 2**: [DQL Pitfalls](/domino-news/en/posts/dql-pitfalls) — 6 query-writing details the docs don't spell out
> - **Part 3**: DQL Production-Ready (you just finished) — catalog maintenance and permissions
>
> Hit a trap that's not covered here? Let me know — I'll keep updating the series.
