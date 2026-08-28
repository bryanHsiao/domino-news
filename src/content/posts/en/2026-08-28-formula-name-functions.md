---
title: "@Name Is the Swiss Army Knife for Notes Names: Three Formats, Any Component"
description: "In formula you constantly handle Notes names — comparing, displaying, extracting the OU. @Name is the Swiss army knife: [ABBREVIATE]/[CANONICALIZE]/[CN] convert among canonical/abbreviated/common, and [O]/[OU1]/[S] extract any part. Get the current user with @UserName (canonical) or @V3UserName (abbreviated) — but there's a trap: inside a server agent the 'current user' is the signer, and it isn't a security mechanism. Part four of the Formula @function series."
pubDate: 2026-08-28T07:30:00+08:00
lang: en
slug: formula-name-functions
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Name — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAME.html"
  - title: "@UserName — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USERNAME.html"
  - title: "@V3UserName — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_V3USERNAME.html"
---

Notes names come in three shapes: **canonical** (`CN=Mary Tsen/OU=Illustration/O=Acme/C=US`, the full labeled form), **abbreviated** (`Mary Tsen/Illustration/Acme/US`, labels stripped), and **common** (`Mary Tsen`, just the person). The site's earlier [NotesName's three formats](/domino-news/en/posts/notesname-formats) piece covered *why* these three make comparisons silently fail; this part covers how to convert between them and extract a part, in **formula**.

There's one star function: **[`@Name`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAME.html)**. The docs say it "allows you to manipulate hierarchical names" — a Swiss army knife for hierarchical names.

---

## TL;DR

- **`@Name([action]; name)`:** one function, an action keyword decides what it does.
- **Convert between the three formats:** `[CANONICALIZE]` expands to canonical, `[ABBREVIATE]` collapses to abbreviated, `[CN]` takes just the common name.
- **Extract any part:** `[O]` organization, `[OU1]`/`[OU2]` org units, `[G]` given, `[S]` surname, `[C]` country, `[Q]` generation qualifier (like Jr).
- **Get the current user:** `@UserName` returns canonical, `@V3UserName` returns abbreviated.
- **The trap:** inside a **server agent**, `@UserName`'s "current user" is the **signer**, not the person who triggered it — and the docs say it **isn't a security mechanism**.

---

## @Name: converting between the three formats

The three most-used actions map exactly to the three formats:

```
@Name([CANONICALIZE]; "Mary Tsen/Illustration/Acme/US")
    → CN=Mary Tsen/OU=Illustration/O=Acme/C=US

@Name([ABBREVIATE]; "CN=Mary Tsen/OU=Illustration/O=Acme/C=US")
    → Mary Tsen/Illustration/Acme/US

@Name([CN]; "CN=Mary Tsen/OU=Illustration/O=Acme")
    → Mary Tsen
```

- **`[CANONICALIZE]`:** expand an abbreviated name back to full canonical (restoring the `CN=`/`OU=`/`O=`/`C=` labels). When you're writing into **Readers/Authors fields** or **comparing precisely** against a stored value, use this to normalize both sides. (Careful: if the name is missing components, `[CANONICALIZE]` fills them from the **current user's ID** — watch out when canonicalizing a partial name.)
- **`[ABBREVIATE]`:** the reverse — strip labels to abbreviated, the display format for people.
- **`[CN]`:** keep just the person.

(This echoes [the NotesName piece](/domino-news/en/posts/notesname-formats): Notes stores canonical underneath, so "`[CANONICALIZE]` both sides before comparing" is the reliable move.)

## @Name: extracting a part

`@Name` also pulls out **a single component** — useful for categorizing and permission checks:

| action | returns |
|---|---|
| `[CN]` | common name (the person) |
| `[O]` | organization (O) |
| `[OU1]`, `[OU2]`… | the nth org unit |
| `[G]` | given name |
| `[S]` | surname |
| `[C]` | country/region |
| `[Q]` | generation qualifier (e.g. Jr) |

For instance, "which department is this person in" is `@Name([OU1]; PersonName)`. There's also `[TOKEYWORD]` — reverse the hierarchy joined with backslashes (`US\Acme\R&D\…`), meant for view categorization.

## Getting the current user: @UserName and @V3UserName

To get "who this is right now," two functions:

- **[`@UserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USERNAME.html):** the docs say it returns "the current user name," and for a hierarchical name that's **canonical format (including the CN, OU, O, and C identifiers)**. It takes an optional index: `0` primary name (default), `1` alternate (since R5).
- **[`@V3UserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_V3USERNAME.html):** returns the **abbreviated format** (labels omitted).

Same ID, the difference is the format:

```
@UserName    → CN=Mary Tsen/OU=Illustration/.../O=WorkSavers/C=US
@V3UserName  → Mary Tsen/Illustration/.../WorkSavers/US
```

Want the common name? Wrap it: `@Name([CN]; @UserName)`.

## The trap you must know

`@UserName` has a behavior that catches people out: **in an agent running on a server, `@UserName` returns the signer, not the person who actually triggered the agent.** The docs also flag that it gives unpredictable results in a **public view** and **should not be used as a security mechanism**.

In other words: `@UserName` is fine on a **local** database or in a **private view** for "is this me?" checks (like `SELECT @UserName = AssignedTo` for a personal view); but once you're on the server doing real "who can see what" control, don't lean on it — that's the job of Readers fields and the ACL.

## Wrap-up

For Notes names, formula is mostly `@Name`: `[CANONICALIZE]`/`[ABBREVIATE]`/`[CN]` to change format, `[O]`/`[OU1]`/`[S]` to extract a part; get the current user with `@UserName` (canonical) or `@V3UserName` (abbreviated), remembering that on a server it's the signer and not a security mechanism.

The next part turns to **dates and time** — how `@Adjust`, `@Date`, `@Now`/`@Today`, and `@Modified` do date arithmetic in formula.
