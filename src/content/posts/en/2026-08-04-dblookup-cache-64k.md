---
title: "@DbLookup and @DbColumn: the Cache Keyword You're Not Passing, and the 64K Wall"
description: "You update a keyword document, reload the form, and the dropdown still shows the old value. Or a keyword list quietly stops growing at a few thousand entries. Both are @DbLookup / @DbColumn behaviours hiding in the argument most formulas leave empty: the cache keyword. A field report on the three cache options (default / NoCache / ReCache) and the hard 64KB limit on what these functions can return — with the classic-web cases where each one bites."
pubDate: 2026-08-04T07:30:00+08:00
lang: en
slug: dblookup-cache-64k
tags:
  - "Formula"
  - "Performance"
sources:
  - title: "@DbLookup (Domino data source) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBLOOKUP_NOTES_DATABASES.html"
  - title: "@DbColumn (Domino data source) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBCOLUMN_NOTES_DATABASES.html"
  - title: "NotesView (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
relatedJava: []
relatedSsjs: []
---

Someone updates a keyword document, reloads the form, and the dropdown still shows the old value — for the rest of their session. Or a keyword list that used to be complete quietly stops a few thousand entries in, and nobody notices until a record can't be found. These aren't random Domino flakiness. They're two documented behaviours of [`@DbLookup`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBLOOKUP_NOTES_DATABASES.html) and [`@DbColumn`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBCOLUMN_NOTES_DATABASES.html), and both hide in parts of the call most formulas ignore: the cache keyword, and the 64KB ceiling.

This is a field report on those two — the cache option you're probably passing as an empty string without knowing what it does, and the hard limit on how much these functions can hand back.

---

## TL;DR

- The first argument carries a **cache keyword**, and leaving it as `""` is not "no caching" — it *is* caching. Default (`""`) caches the result for the session; the next identical lookup reuses it until something calls `"ReCache"`.
- `"NoCache"` reads fresh every time (correct data, slower). `"ReCache"` reads fresh *and* refreshes the cache for later default lookups. Pick per how volatile the data is.
- `@DbLookup` and `@DbColumn` each return **no more than 64KB of data**. Past that they fail or truncate — the reason a growing keyword list silently goes incomplete.
- On classic web, computed-for-display fields re-evaluate on every render, so both the cache choice and the 64K limit hit harder than on a Notes client.

## The cache keyword, spelled out

The signature people remember is `@DbColumn(""; server:db; view; column)` — and that leading `""` is where the caching lives. It's not a placeholder; it's a choice, and the docs are precise about the three values:

- **`""` (default)** — "caches the results of the lookup. Each subsequent lookup to the same location (within the same Domino session and so long as the database executing this lookup remains open) re-uses that data until you specify `ReCache`." Great for stable data; a stale-data bug for anything that changes mid-session.
- **`"NoCache"`** — "gets the results of the lookup from the database; no cache is used." Use it when every lookup must see the latest. Note the subtlety: it *ignores* the cache but doesn't update it — "if the same lookup was already cached, the cache is not updated."
- **`"ReCache"`** — "refreshes the cache with the latest data from the database." It reads fresh, stores the fresh result, and a later default (`""`) lookup then gets that refreshed value.

So the stale-dropdown bug is the default cache doing exactly its job: you edited the keyword document, but the form's computed field ran `@DbColumn(""; …)` earlier this session and is handing back the cached list. The fix is intent-driven — `"NoCache"` on the field that must always be current, or a `"ReCache"` right after the code that changes the source data so the next default lookup is fresh. Reaching for `"NoCache"` everywhere "to be safe" is the opposite mistake: every keyword field re-reads its view on every form open, and a busy form with a dozen lookups gets slow for no benefit on data that rarely changes.

```
REM {Volatile — must reflect edits made this session};
@DbColumn("" : "NoCache"; "" : "App.nsf"; "vwActiveProjects"; 1)

REM {Stable reference data — cache it};
@DbColumn(""; "" : "App.nsf"; "vwCountryCodes"; 1)
```

## The 64KB wall

Both functions have a hard ceiling: they "can return no more than 64KB of data." That's fine for a country list; it's a landmine for anything open-ended. A `@DbColumn` over a view of every customer, or an `@DbLookup` that pulls a multi-value field across thousands of matches, works in testing with 200 rows and then, in production at 5,000 rows, crosses 64KB and returns an error or a truncated set. The keyword list that "stopped growing" didn't stop — it hit the wall, and because a truncated list still looks like a list, nobody sees it until the missing entry is needed.

When a result can grow without bound, `@DbColumn` / `@DbLookup` is the wrong tool. Narrow the lookup so it can't exceed 64KB — categorise the view and `@DbLookup` by category instead of pulling the whole column — or move the read to the back end, where a [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) navigator (or DQL) has no such limit and can page through results. The rule of thumb: these formulas are for *bounded* reference data — code lists, small keyword sets — not for reading a data set that scales with your document count.

## Why the web makes both worse

On a Notes client, a computed keyword field evaluates when the document opens and mostly sits still. On classic web, fields computed for display re-evaluate every time Domino renders the form, so a lookup-heavy web form runs its `@DbColumn`s on every page load. That amplifies both issues at once: the default cache is more likely to serve stale data across a longer-lived session, and the 64K limit is hit on the same render path a user triggers repeatedly. If you're moving a keyword-heavy form to the web, the cache keyword and the size of every `@DbColumn` are the first two things to audit — not because the functions changed, but because the web exercises them far harder than the client ever did.
