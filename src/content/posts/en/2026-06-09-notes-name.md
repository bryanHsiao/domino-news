---
title: "NotesName: Stop String-Parsing Hierarchical Domino Names"
description: "Need to pull \"John B Goode\" out of CN=John B Goode/OU=Sales/O=Acme/C=US? Still doing it with Mid, InStr, or @Name? NotesName is Domino's built-in name-parsing class — one session.CreateName() call converts between canonical, abbreviated, common, and Internet (RFC 821/822) formats, and breaks a name into its O / OU / C / G / S components. This article covers every read-only property, the three-format conversion, how flat names and Internet names behave, and the easy-to-miss rule that an abbreviation is skipped when it would be ambiguous."
pubDate: 2026-06-09T07:30:00+08:00
lang: en
slug: notes-name
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesName class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html"
  - title: "Common property (NotesName) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMMON_PROPERTY.html"
  - title: "NotesName class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESNAME_CLASS.html"
relatedJava: ["Name"]
relatedSsjs: ["Name"]
cover: "/covers/notes-name.webp"
coverStyle: "collage"
---

You need to pull `John B Goode` out of `CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US` to show it in the UI. What's the quickest thing to hand? Plenty of people reach straight for `Mid` plus `InStr` to find `CN=` and the first `/`, or hack it in formula language with `@Name([CN]; ...)`. It works — until a flat name with no `CN=` prefix shows up, or a name with a different number of hierarchy levels, and the string-slicing logic starts sprouting `If` statements.

Domino has had a class dedicated to exactly this for a long time. The official definition of [`NotesName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html) is just three words — "Represents a name." — but it converts a Domino name freely between canonical, abbreviated, common, and even Internet-address formats, and breaks it down into `O`, `OU`, `C` and other components. One `session.CreateName()` and you're done parsing strings by hand.

---

## TL;DR

- Create with `session.CreateName(name$ [, language$])` — **it hangs off [`NotesSession`](/domino-news/posts/notes-session/)**; `New` isn't supported under COM
- **The three everyday format properties**: `Common` (just `John B Goode`), `Abbreviated` (`John B Goode/Sales/East/Acme/US`), `Canonical` (`CN=John B Goode/OU=...`)
- **Component-by-component breakdown**: `Organization` (O=), `OrgUnit1`–`OrgUnit4` (OU=), `Country` (C=), `Given` (G=), `Surname` (S=), `Initials` (I=), `Generation` (Q=) — all read-only
- `IsHierarchical`: a `Boolean` telling you whether the name is hierarchical
- **The Internet-name side**: `Addr821` (RFC 821), `Addr822LocalPart` / `Addr822Phrase` / `Addr822Comment1`–`3` (RFC 822)
- Every property is **read-only** — `NotesName` parses, it doesn't modify
- Two behaviours to know: `Common` returns a flat name as-is and an Internet name's LocalPart; canonical abbreviation **is skipped if it would be ambiguous**

---

## CreateName: build it from NotesSession

`NotesName` isn't created with `New` (the docs are explicit that `New` isn't supported under COM) — it's vended by `NotesSession`, the same factory-method pattern as the `CreateXxx` calls covered in the [`NotesSession`](/domino-news/posts/notes-session/) piece:

```lotusscript
Dim session As New NotesSession
Dim nam As NotesName
Set nam = session.CreateName({CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US})
```

`CreateName` takes a second optional `language$` argument for the language code of an alternate name — you rarely need it, only when working with multilingual names.

## Converting between Common / Abbreviated / Canonical

This is `NotesName`'s highest-frequency job. One name, three properties, three renderings — here's the official example, verbatim:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim nam As NotesName
  Dim msg As String
  REM Create a hierarchical name
  Set nam = session.CreateName( _
  {CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US})
%REM
Returns:
  John B Goode
  John B Goode/Sales/East/Acme/US
  CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US
%END REM
  msg = nam.Common & Chr(13)
  msg = msg & nam.Abbreviated & Chr(13)
  msg = msg & nam.Canonical
  Messagebox msg,, "Canonical name"
End Sub
```

Side by side:

| Property | Returns | Typical use |
|---|---|---|
| [`Common`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMMON_PROPERTY.html) | `John B Goode` | UI display, sender name |
| [`Abbreviated`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABBREVIATED_PROPERTY.html) | `John B Goode/Sales/East/Acme/US` | Human-readable, keeps the hierarchy |
| [`Canonical`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CANONICAL_PROPERTY.html) | `CN=John B Goode/OU=...` | Writing to documents, ACLs, `Names` fields |

The single most common case is "I have a canonical name and just want to display the common name": where you used to slice strings, it's now `nam.Common`. Going the other way — the user typed an abbreviated name and you want to store it canonical — is just `nam.Canonical`.

## Breaking a name into its components

When you want not the whole string but "which `Organization` is this person in" or "which `OrgUnit`", `NotesName` exposes every segment as its own read-only property:

| Property | Component | Example |
|---|---|---|
| `Organization` | `O=` | `Acme` |
| `OrgUnit1`–`OrgUnit4` | `OU=` | `Sales` / `East` / … |
| `Country` | `C=` | `US` |
| `Given` | `G=` | given name |
| `Surname` | `S=` | surname |
| `Initials` | `I=` | initials |
| `Generation` | `Q=` | generation, e.g. `Jr.` |
| `ADMD` / `PRMD` | `A=` / `P=` | X.400 management-domain components |

There's also a handy `Keyword` property that joins the components with backslashes: `country\organization\OU1\OU2\OU3\OU4` — useful as a grouping key or sort value.

```lotusscript
Dim nam As NotesName
Set nam = session.CreateName(doc.GetItemValue("Author")(0))
If nam.OrgUnit1 = "Sales" Then
    ' This person is in Sales — run the matching logic
End If
```

## The Internet-name side

`NotesName` understands more than Domino hierarchy — it parses Internet addresses too. When what you feed it is an RFC 822 name (say `"John B Goode" <john@acme.com>`), these properties come into play:

| Property | Holds |
|---|---|
| `Addr821` | RFC 821 Internet address |
| `Addr822LocalPart` | the local part (before the `@`) |
| `Addr822Phrase` | the display-name phrase |
| `Addr822Comment1`–`Comment3` | RFC 822 comment components |

## IsHierarchical and how flat names behave

Not every name is hierarchical. Test with `IsHierarchical` (a `Boolean`) before reading hierarchy components — read `Organization` off a flat name and you'll just get an empty string.

More important is `Common`'s "helpful" behaviour. The docs spell it out clearly:

- hierarchical name → returns the `CN=` component
- **flat name → "returns a flat name as-is"**
- Internet name → returns the LocalPart

That's a feature: whatever format you pass in, `nam.Common` hands back "a name you can display", with no need to detect the format first. This is the biggest win of using `NotesName` over hand-rolled slicing — it absorbs all those `If` branches for you.

One last easy-to-miss rule: **"This class does not abbreviate a canonical name if the abbreviation would be ambiguous."** When abbreviating would create ambiguity, `Abbreviated` keeps a form that's still distinguishable rather than forcing the short version. So don't assume `Abbreviated` is always shorter than `Canonical`.

## A practical example

Turning the current user name into a common name for display is the docs' second example:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim nam As NotesName
  Dim msg As String
  REM Create a NotesName from user name
  Set nam = session.CreateName(session.UserName)
  REM Display common, abbreviated, and canonical formats
  msg = nam.Common & Chr(13)
  msg = msg & nam.Abbreviated & Chr(13)
  msg = msg & nam.Canonical
  Messagebox msg,, "User name"
End Sub
```

To process the multiple names in a `Readers` / `Authors` / `Names` field, loop and `CreateName` each one, convert them all to common names, then reassemble — sturdier than slicing strings, and it handles the flat names and Internet names mixed in for free.

## What about Java and SSJS?

`NotesName` is one of the rare classes present, and consistent, across all three languages:

| Language | Counterpart | Created via |
|---|---|---|
| Java (`lotus.domino.*`) | `Name` | `session.createName(name)` |
| SSJS / XPages | `Name` | `session.createName(name)` |

The property names map almost one-to-one across all three (`getCommon()` / `getAbbreviated()` / `getCanonical()` …), so the concepts here carry straight over. The only thing to remember when you actually write the Java or SSJS version is that they use getter methods rather than LotusScript's property syntax.
