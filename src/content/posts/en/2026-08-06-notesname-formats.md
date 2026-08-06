---
title: "One Person, Three Names: the NotesName Formats That Make Your Comparison Silently Fail"
description: "You compare a name to session.EffectiveUserName and it's never equal, even though it's obviously the same person. Or you write a user into a Readers field and they still can't see the document. Same root cause: a Notes name has three text forms — canonical, abbreviated, common — and you compared two different ones. A field report on NotesName: what each format is, which one Notes stores internally, and why every name comparison should normalise through NotesName first."
pubDate: 2026-08-06T07:30:00+08:00
lang: en
slug: notesname-formats
tags:
  - "LotusScript"
sources:
  - title: "NotesName (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html"
  - title: "CreateName (NotesSession, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATENAME_METHOD.html"
  - title: "EffectiveUserName (NotesSession, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html"
relatedJava: ["Name"]
relatedSsjs: ["Name"]
cover: "/covers/notesname-formats.webp"
coverStyle: "pencil-sketch"
---

You write `If userName = session.EffectiveUserName Then` and it's never true — even though `userName` plainly holds the same person. Or you push a user's name into a document's Readers field and they still can't open the document. These look unrelated, but they're the same bug: a Notes name isn't one string. The same person has three text forms, and in both cases you compared — or stored — the wrong one.

[`NotesName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html) is the class that untangles this. This is a field report on the three name formats it exposes, which one Notes uses under the hood, and the one habit — normalise before you compare — that makes the whole category of "same person, not equal" bugs disappear.

---

## TL;DR

- A hierarchical Notes name has three forms. **Canonical**: `CN=John B Goode/OU=Sales/O=Acme/C=US` — full, with the component labels. **Abbreviated**: `John B Goode/Sales/Acme/US` — same parts, labels stripped. **Common**: `John B Goode` — just the CN.
- Notes stores and matches names in **canonical** form: ACL entries, Readers / Authors fields, `$UpdatedBy`, and `session.EffectiveUserName` are all fully distinguished.
- Build one with `Set nn = session.CreateName(raw)`, then read `nn.Canonical`, `nn.Abbreviated`, `nn.Common` — plus `nn.Organization`, `nn.OrgUnit1`, `nn.Country`, `nn.IsHierarchical`.
- Never compare raw name strings. Normalise both sides through `NotesName` to the same format first — canonical for matching/storage, common or abbreviated for display.

## Three forms of the same name

The class parses whatever you hand it and re-emits it in any format. The docs give the three that matter, with an example that makes the difference obvious:

- **`Canonical`** — "a hierarchical name in canonical form," e.g. `CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US`. Every component carries its label (`CN=`, `OU=`, `O=`, `C=`).
- **`Abbreviated`** — "a hierarchical name in abbreviated form," e.g. `John B Goode/Sales/East/Acme/US`. Same components, in the same order, with the labels dropped.
- **`Common`** — "the common name component (CN=)," e.g. `John B Goode`. Just the person.

There are more components if you need them — `Organization` (`O=`), `OrgUnit1` through `OrgUnit4`, `Country` (`C=`), `Given`, `Surname`, and `IsHierarchical` to tell a hierarchical name from a flat one. But the three formats above are where the bugs live.

## Which form Notes actually uses

Here's the fact that explains both symptoms in the opening: **Notes stores names canonically.** An ACL entry is canonical. A Readers or Authors field holds canonical names. `$UpdatedBy` is canonical. And [`session.EffectiveUserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html) returns the fully distinguished — canonical — name. So the internal, access-control layer speaks canonical, while the UI shows you abbreviated or common. The moment your code compares a name you got from a display context to one from the storage layer, you're comparing `John B Goode` to `CN=John B Goode/O=Acme/C=US`, and `=` says false forever.

The Readers-field version is worse because it fails silently. Write `"John B Goode"` (common) or `"John B Goode/Acme"` (abbreviated) into a Readers field and Domino doesn't error — it just doesn't match the canonical identity the reader actually has, so the document is invisible to them. This is the same trap that catches [agents running as a web user](/domino-news/en/posts/agent-run-as-identity): the effective user is canonical, and a [Readers field](/domino-news/en/posts/readers-authors-fields) that doesn't hold the canonical form doesn't let them in.

## The habit: normalise, then compare

The fix is one line of discipline — run both sides through `NotesName` and compare the same format:

```lotusscript
Dim session As New NotesSession
Dim a As NotesName, b As NotesName
Set a = session.CreateName(nameFromForm)
Set b = session.CreateName(session.EffectiveUserName)

If a.Canonical = b.Canonical Then       ' same person, regardless of input format
    ' ...
End If
```

[`CreateName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATENAME_METHOD.html) accepts any of the formats (and even RFC 822 internet addresses and flat names), so you don't need to know what form the input arrived in — you convert it and compare canonically. For anything you *store* where access depends on it — a Readers field, an ACL update — write `nn.Canonical`. For anything a person *reads* — a label, a report — use `nn.Abbreviated` or `nn.Common`. The rule of thumb: canonical is for the machine, abbreviated and common are for the human, and you never let the two meet in a raw `=`. (The Formula-language equivalent, for computed fields, is `@Name([Canonicalize]; x)`, `@Name([Abbreviate]; x)`, and `@Name([CN]; x)` — same three conversions.)

## What about Java and SSJS?

This one has a clean counterpart. The Java `lotus.domino.Name` class is the same object with the same three accessors — `getCanonical()`, `getAbbreviated()`, `getCommon()` — created with `session.createName(...)`. SSJS in XPages uses the same `session.createName(...)`. So the normalise-before-compare rule ports directly; only the syntax changes. Wherever you handle Notes names, the underlying truth is constant: one identity, three spellings, and canonical is the one the access-control layer believes.
