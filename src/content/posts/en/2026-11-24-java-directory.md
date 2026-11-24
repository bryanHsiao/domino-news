---
title: "Looking Up the Domino Directory in Java: Directory Hands You a Three-Level Navigator, Not a List"
description: "A Java agent needs to look up someone's mail server or internet address — or a group's members — from the Domino Directory (NAB). You reach for the Directory class: session.getDirectory() to get the directory, lookupNames() to ask for items on a set of names, and then — it hands you back not a list you can loop, but a DirectoryNavigator: a three-level cursor over names × matches × items. Get the nesting wrong and you read the wrong value, or an empty one. This covers getting a Directory, lookupNames vs lookupAllNames, how that three-level walk actually works, and one trap: the official example page uses an API that contradicts the class docs — don't copy it."
pubDate: 2026-11-24T07:30:00+08:00
lang: en
slug: java-directory
tags:
  - "Java"
sources:
  - title: "Directory class (Java) (session.getDirectory, lookupNames/lookupAllNames, child DirectoryNavigator) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS_JAVA.html"
  - title: "DirectoryNavigator class (Java) (findFirstName/findFirstMatch/getFirstItemValue, three-level walk) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS_JAVA.html"
  - title: "lookupNames (Directory - Java) (view, names, items, partialMatches) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOOKUPNAMES_METHOD_DIRECTORY_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass:
  - "Directory"
  - "DirectoryNavigator"
apiLang: "java"
---

A scheduled Java agent needs something out of the Domino Directory (names.nsf / the NAB): which mail server this person is on, their internet address, who's in a group. You'd rather not open `names.nsf` by hand, guess view names, and hand-roll `@NameLookup` — so you find the `Directory` class.

You call `session.getDirectory()`, feed `lookupNames()` a set of names, say which items you want back, and get ready to loop the result — and what comes back is **not a list**. It's a [`DirectoryNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS_JAVA.html). And it's a **three-level** one: names → matches → items. Nest it wrong and you read the wrong value, or nothing.

This covers getting a Directory, `lookupNames` vs `lookupAllNames`, how that three-level walk actually works, and a very practical trap: the official example page itself uses an API that doesn't match the class docs.

---

## Getting a Directory

[`Directory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS_JAVA.html) is, in the docs, "Represents the Notes directories on a specific server or local computer, each of which is associated with one or more directory navigators to allow directory lookups." You build it from Session:

```java
Directory dir = session.getDirectory();      // no argument = local directory
// session.getDirectory("")          → the current computer
// session.getDirectory("Mail/Acme") → a named server's directory
```

- With no server name, you get the local directory (per `UseContextServer`).
- **Cross-server has a condition**: the docs say "the current server must have a Trusted relationship with the specified server." Pointing at another server's directory isn't just a matter of naming it.
- `getDirectory` is new as of Release 8.5.

## lookupNames: give names, give the items you want, get a navigator

[`lookupNames`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOOKUPNAMES_METHOD_DIRECTORY_JAVA.html), in one line, "Looks up designated Items for specified Names contained in the specified View." Three required arguments plus one optional:

```java
Vector names = new Vector(); names.add("John Smith");
Vector items = new Vector(); items.add("MailServer"); items.add("InternetAddress");
DirectoryNavigator nav = dir.lookupNames("($Users)", names, items, true);
//                                         view       the names   which items   partialMatches
```

- `view` is the directory view you look up in (e.g. `($Users)`).
- `names` is a single string or an array of strings.
- `items` is which fields to return — **column programmatic names from the view perform best** (docs: "For best performance, use column names from the specified view"). You can also pass note field names, or a NAMELookup computed item like `$$DbName`, but those are slower.
- The trailing `partialMatches` is optional; `true` allows partial name matches.

The sibling `lookupAllNames(view, items)` takes no names and returns the items for every entry in the view — but the docs warn: "Large results will be limited by the system, according to settings in Notes.ini. This method is intended for views with limited scopes." Don't point it at a big directory; Notes.ini will cap it.

## The trap: the navigator is a names × matches × items cursor

This is the part people get wrong. `lookupNames` returns not a collection but a **three-level cursor** you walk by level:

1. **Names** — `findFirstName()` / `findNextName()`. You looked up N names; this level moves among them. `findFirstName()` returns how many matches that name has.
2. **Matches** — `findFirstMatch()` / `findNextMatch()`. One name can hit several entries (same name, partial matches); this level moves among them.
3. **Items** — `getFirstItemValue()` / `getNextItemValue()`. You pass however many items you asked for, in order.

```java
Directory dir = session.getDirectory();
Vector names = new Vector(); names.add("John Smith");
Vector items = new Vector(); items.add("MailServer"); items.add("InternetAddress");
DirectoryNavigator nav = dir.lookupNames("($Users)", names, items, true);

nav.findFirstName();                      // position to the first name
while (nav.isNameLocated()) {             // NameLocated: did we find a name?
  nav.findFirstMatch();                   // position to that name's first match
  while (nav.isMatchLocated()) {          // MatchLocated: is this match valid?
    String mailServer = nav.getFirstItemValue();   // items order: #1
    String inetAddr   = nav.getNextItemValue();     // #2
    System.out.println(nav.getCurrentName() + " -> " + mailServer + " / " + inetAddr);
    nav.findNextMatch();
  }
  nav.findNextName();
}
```

The classic symptom of getting it wrong: you only walk the name level, never enter the match level, so each name yields only its first entry. Or `getFirstItemValue` / `getNextItemValue` drift out of step with `items`, so you read the wrong field into the wrong variable. The order **is** the order you passed `items` in.

Useful state along the way: `CurrentName` (which name you're on), `CurrentMatches` (how many matches this name has), `CurrentView`. And on the Directory itself, `LimitMatches` — docs: "Indicates if the results of lookups are limited to fifty entries." It caps results at **50** by default; turn it off to pull everything.

## Don't copy the official example

Here's the red flag the source check turned up: the agent on the official Directory examples page uses `DirEntryCollection` / `DirEntry` / `getFirstEntry()` / `dir.getName()` — none of which appear anywhere in the Directory or DirectoryNavigator docs. `lookupNames` is documented to return a `DirectoryNavigator`, not any `DirEntryCollection`; Directory has a `Server` property, not `getName()`. That sample looks like an older one that never tracked the API (it's even missing a semicolon).

**Don't write it that way.** Follow the `DirectoryNavigator` three-level walk. This is exactly why every piece here is re-checked against the docs line by line — even the official example can contradict its own class reference.

## What about LotusScript and SSJS?

The same `Directory` / `DirectoryNavigator`:

- **LotusScript**: `NotesDirectory` / `NotesDirectoryNavigator`, with `CreateNavigator`, `LookupNames`, and `FindFirstName` / `FindFirstMatch` / `GetFirstItemValue` — the exact same three-level model, no recycle.
- **SSJS / XPages**: the same `session.getDirectory()`; looking the directory up in a managed bean or SSJS to render a field (the signed-in user's department, their mail server) is common.
- **The Java-specific part** isn't the API (the methods are shared) — it's the setting: a back-end / scheduled Java agent that has to batch-look-up a pile of names (reconciliation, notifications, access sync) is where `lookupNames` + the navigator earns its place. Just remember it's a cursor, not a list — and don't trust that official example.
