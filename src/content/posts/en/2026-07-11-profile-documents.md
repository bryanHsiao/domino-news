---
title: "Profile Documents: The Cached Settings Store in Domino, and Why the Cache Bites"
description: "A profile document is a hidden, view-invisible document keyed by name (and optionally user) — perfect for app configuration and per-user preferences, and fast because it's cached. This article covers GetProfileDocument, the IsProfile / NameOfProfile / Key properties, per-user profiles via the unique key, and the pitfall the caching creates: another process's write may not be visible to your already-open session, with no refresh API to force a re-read."
pubDate: 2026-07-11T07:30:00+08:00
lang: en
slug: profile-documents
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "GetProfileDocument method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCUMENT_METHOD.html"
  - title: "GetProfileDocCollection method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCCOLLECTION_METHOD_DATABASE.html"
  - title: "Key property (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_KEY_PROPERTY.html"
relatedJava: ["Database", "Document"]
relatedSsjs: ["database", "document"]
cover: "/covers/profile-documents.webp"
coverStyle: "minimalist-mono"
---

Every non-trivial Domino application needs somewhere to keep settings — the company logo, the default page size, a per-user theme. You could make a "config" form and a view, but Domino has a purpose-built mechanism: the **profile document**. It's a document, but a special one — invisible in views, excluded from the database's document count, and cached for speed. That caching is exactly why profiles are fast, and also exactly what trips developers up.

---

## TL;DR

- A profile document stores app-wide or per-user settings. Per the docs, profiles "are invisible in views, they are not included in the document count for a database, and they are cached while the database containing them is open."
- Get one with [`db.GetProfileDocument(profileName$ [, uniqueKey$])`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCUMENT_METHOD.html) — it "Retrieves **or creates**" the profile, so it always returns a usable document.
- Pass a **unique key** (conventionally `session.UserName`) for a **per-user** profile; omit it for a single shared, database-wide profile.
- Introspect with `NotesDocument.IsProfile`, `NameOfProfile`, and `Key` (the unique key — note it's `Key`, not `KeyOfProfile`).
- **The caching pitfall:** a profile is cached in the backend while the database is open. If another process updates it, your already-loaded copy is stale — and re-calling `GetProfileDocument` in the same session can hand back the cached version rather than the fresh one on disk. There's no simple "refresh this profile" API.

## Reading and writing a profile

A profile is saved and read like any document; the only difference is how you retrieve it. Omit the unique key for a shared, database-wide profile:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim profile As NotesDocument
  Set db = session.CurrentDatabase

  ' No unique key => one shared profile. Created if it doesn't exist yet.
  Set profile = db.GetProfileDocument("AppSettings")
  Call profile.ReplaceItemValue("MaxItemsPerPage", 50)
  Call profile.ReplaceItemValue("LastUpdatedBy", session.UserName)
  Call profile.Save(True, False)     ' profiles save like normal documents
End Sub
```

Pass the unique key for a per-user profile — each user gets their own instance under the same profile name:

```lotusscript
Dim prefs As NotesDocument
Set prefs = db.GetProfileDocument("UserPrefs", session.UserName)
Call prefs.ReplaceItemValue("Theme", "dark")
Call prefs.Save(True, False)

Print prefs.IsProfile & " / " & prefs.NameOfProfile & " / " & prefs.Key
' => True / UserPrefs / CN=Jane Doe/O=Acme
```

The three introspection properties are read-only: `IsProfile` tells you a document is a profile, `NameOfProfile` returns the profile name, and [`Key`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_KEY_PROPERTY.html) returns "the user name (key) of the profile" — the unique key you passed in. To enumerate every profile of a name (e.g. to iterate all users' preferences), use [`GetProfileDocCollection(profileName$)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCCOLLECTION_METHOD_DATABASE.html), which returns a `NotesDocumentCollection` — or all profiles if you pass no name.

## The caching pitfall

Profiles are cached "while the database containing them is open" — that's a deliberate performance feature, and for read-mostly config it's exactly right: you can hammer `GetProfileDocument` in a loop and it's cheap. The problem surfaces under concurrency. Because your session holds a cached copy after first access:

- If another user, agent, or server task updates the same profile, **your loaded copy is stale** — you're still looking at the values from when you first read it.
- Re-calling `GetProfileDocument` for the same name/key **within the same open session can return the cached copy**, not the freshly-saved version on disk. So you don't reliably see the other process's write just by re-fetching.
- Two writers can silently clobber each other — last-writer-wins on top of a stale cache.

There is no `.refresh`-style call that cleanly invalidates a cached profile, which is precisely why this is worth knowing. The practical guidance:

- **Use profiles for read-mostly configuration**, not for high-frequency mutable data. A hit counter or per-request state in a profile is a classic mistake — the caching makes concurrent increments lose updates.
- To force a genuinely fresh read across processes, you generally have to drop and re-acquire the database (or session) handle, not just call `GetProfileDocument` again.
- The behaviour is well-known enough that HCL's own ideas portal carries a standing request to make the caching optional — so if it bites you, you're in good company, and the fix is to design around it.

In XPages/SSJS the pitfall is amplified: the server process is long-lived and multi-user, so a stale cached profile can persist across many requests until the database handle recycles. Treat profiles there as read-mostly and refresh the handle when you truly need current data.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `db.GetProfileDocument(name, key)` | `db.getProfileDocument(name, key)` | `database.getProfileDocument(name, key)` |
| `db.GetProfileDocCollection(name)` | `db.getProfileDocCollection(name)` | `database.getProfileDocCollection(name)` |
| `doc.IsProfile / NameOfProfile / Key` | `doc.isProfile() / getNameOfProfile() / getKey()` | same, camelCase |

The API and the caching semantics are identical across the three. In Java the collection method requires the profile name argument (LotusScript makes it optional), but otherwise it's the same mechanism — and the same advice: profiles are a fast cached settings store, best kept read-mostly.
