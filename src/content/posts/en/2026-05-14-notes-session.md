---
title: "NotesSession Deep Dive — LotusScript's Entry Point, the Single-Instance Rule, Three UserName Variants, and Evaluate"
description: "NotesSession is the class every LotusScript script reaches for first — it represents the current script's runtime environment and gives you CurrentDatabase, three user-name properties (UserName, EffectiveUserName, CommonUserName), Evaluate for running @Formula from LS, CreateLog for NotesLog, GetEnvironmentString for notes.ini reads. This guide covers the class's role, the one-session-per-script rule, key properties and methods, the three UserName variants and how they diverge under On Behalf Of agents, server-side vs workstation access-level differences, five common pitfalls, and a complete example."
pubDate: 2026-05-14T07:30:00+08:00
lang: en
slug: notes-session
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesSession class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
  - title: "NotesSession.Evaluate method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVALUATE_METHOD.html"
  - title: "NotesSession.GetEnvironmentString method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETENVIRONMENTSTRING_METHOD.html"
  - title: "Examples: OnBehalfOf property (NotesAgent) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_ONBEHALFOF_PROPERTY_AGENT.html"
relatedJava: ["Session"]
relatedSsjs: ["session"]
cover: "/covers/notes-session.webp"
coverStyle: "low-poly-3d"
---

## TL;DR

[`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) is the **first class every LotusScript reaches for** — HCL's class doc puts it directly: "Represents the environment of the current script, providing access to environment variables, Address Books, information about the current user, and information about the current Notes platform and release number." Highlights to internalize:

1. **One session per script** — verbatim from HCL: "Since there can only be one session per script, the New method always returns the same object each time you call it. Do not delete session objects"
2. **Three user-name properties** (`UserName` / `EffectiveUserName` / `CommonUserName`) sound interchangeable but diverge under On Behalf Of agents
3. **Server-script vs workstation-script access levels are completely different** — server-side uses the script signer's ACL; workstation-side uses the current user's ACL
4. **`Evaluate` is the bridge between LotusScript and @Formula** — run `@Today` / `@DbLookup` / arithmetic-formula one-liners directly from LS

## Why every LS reaches for it first

`NotesSession` is the root of the Domino Objects containment hierarchy. To get a `NotesDatabase`, `NotesDocument`, `NotesView`, or `NotesAgent` — you go through a session first. The canonical opening lines:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase
```

About 90% of Domino LS agents start with those three lines.

## One session per script

The rule's right there in HCL's [NotesSession docs](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html): "Since there can only be one session per script, the New method always returns the same object each time you call it. Do not delete session objects."

What it means in practice:

- `Dim s1 As New NotesSession` and `Dim s2 As New NotesSession` give you **the same object**
- You don't need to (and **shouldn't**) call `Delete` or `Set s = Nothing` on a session
- One session per agent is enough — every sub/function can share it

The convention: declare `Dim session As New NotesSession` once at the top of `Initialize`, share across everything that follows.

## Key context properties

`NotesSession` exposes 24 properties in 14.5.1. The ones you'll actually use:

| Property | Description (verbatim) |
|---|---|
| `CurrentDatabase` | "Read-only. The database in which the current script resides. This database may or may not be open" |
| `CurrentAgent` | "Read-only. The agent that's currently running" |
| `UserName` | "Read-only. The current user's name" |
| `EffectiveUserName` | (the HCL 14.5.1 class doc lists the name but doesn't describe it — the practical meaning is clearest in the On Behalf Of scenario, covered in its own section below) |
| `CommonUserName` | "Read-only. The common name portion of the current user's name" |
| `ServerName` | "Read-only. The full name of the server that the session is running on" |
| `NotesVersion` | "Read-only. The release of Notes in which the current script is running" |
| `Platform` | "Read-only. The name of the platform on which the session is running" |
| `IsOnServer` | "Read-only. Indicates whether a script is running on a server" |
| `AddressBooks` | "Read-only. The Domino Directories and Personal Address Books, including directory catalogs, known to the current session" |

`CurrentDatabase` and `CurrentAgent` are the two anchors for "where am I running." The three `UserName*` variants are the most commonly conflated trio (covered below).

## Key methods

`NotesSession` exposes 41 methods in 14.5.1. The high-leverage ones:

| Method | Purpose |
|---|---|
| `GetDatabase(server, file)` | "Creates a NotesDatabase object that represents the database located at the server and file name you specify, and opens the database, if possible" |
| `GetDbDirectory(server)` | Returns a NotesDbDirectory you can walk to enumerate every db on that server |
| `CreateDateTime(s)` | Build a NotesDateTime from a string |
| `CreateLog(name)` | Build a NotesLog for agent-style logging |
| [`Evaluate(formula, [doc])`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVALUATE_METHOD.html) | **Run @Formula from LotusScript** — "Evaluates a Domino formula" |
| `FreeTimeSearch` | "Searches for free time slots for calendaring and scheduling" |
| [`GetEnvironmentString(name)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETENVIRONMENTSTRING_METHOD.html) | Read a notes.ini string variable |
| `SetEnvironmentVar(name, value)` | Write a notes.ini variable |
| `Resolve(url)` | "Returns the Domino object that a URL addresses" — turn a Notes URL into a NotesDocument |

`Evaluate` is the universal escape hatch when complex LS logic has a one-line @Formula equivalent (`@DbLookup`, `@DbColumn`, date arithmetic). Use it — your code is easier to read.

## UserName / EffectiveUserName / CommonUserName — diverging under On Behalf Of

In normal contexts all three properties report similar values. They diverge when the agent is configured **"On Behalf Of"** another user — running with someone else's identity. HCL's [OnBehalfOf example page](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_ONBEHALFOF_PROPERTY_AGENT.html) shows the three values are kept separately:

```lotusscript
Call body.AppendText("User = " & session.UserName)
Call body.AddNewLine(1)
Call body.AppendText("Effective user = " & session.EffectiveUserName)
Call body.AddNewLine(1)
Call body.AppendText("OnBehalfOf = " & agent.OnBehalfOf)
```

The practical mapping:

| Property | Meaning | Under "On Behalf Of" |
|---|---|---|
| `session.UserName` | The "current user of the script" — typically the agent **signer** | Stays the signer |
| `session.EffectiveUserName` | The runtime identity — what ACLs check against | Becomes the configured OnBehalfOf user |
| `session.CommonUserName` | The CN portion of UserName (e.g., `CN=Bryan/O=ACME` → `Bryan`) | Stays the signer's CN |
| `agent.OnBehalfOf` | "Read-only. Name of the user under whose identity the agent runs" | The configured OnBehalfOf user |

**Common gotcha**: writing an audit log capturing "who triggered this approval" and using `session.UserName` — under an On Behalf Of agent that always logs the signer, never the actual triggering user. The fix: use `session.EffectiveUserName`.

## Server-script vs workstation-script — access level matters

There's a rule HCL applies broadly to LS scripts (per the [NotesDatabase access discussion](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html)): "When a script runs on a server, the script access level to databases and servers corresponds to the access level of the script owner (the person who last saved the script). When a script runs on a workstation, the access level to databases and servers corresponds to the access level of the current user."

In practice:

- **Agent runs on server** (scheduled or event-triggered) → ACL is the **script signer's** ACL
- **Agent runs on client** (user clicks a button or menu action) → ACL is the **current user's** ACL

The natural consequence:

- The same agent can succeed on server and fail on client (or vice versa) — typically an ACL mismatch
- First debug step when ACL-related: print `session.UserName` + `session.IsOnServer` to confirm where you really are and as whom

## Five pitfalls

### 1. Forgetting `Dim As New` — compiles fine, fails at runtime

```lotusscript
Dim session As NotesSession   ' WRONG — no New
Set db = session.CurrentDatabase  ' runtime error — session is Nothing
```

LotusScript **doesn't catch this at compile time**. The agent runs, hits `session.CurrentDatabase`, and throws "Object variable not set." Always `As New NotesSession`.

### 2. Re-`New`ing the session — pointless

```lotusscript
Dim session As New NotesSession
Set session = New NotesSession   ' redundant — returns the same object
```

Per HCL: "the New method always returns the same object each time you call it." Re-`New` doesn't give you a fresh session.

### 3. Using the wrong UserName variant for audit logs

```lotusscript
Print "Approval action by: " & session.UserName  ' WRONG under On Behalf Of agent
```

The correct property for identifying who actually triggered the action:

```lotusscript
Print "Approval action by: " & session.EffectiveUserName
```

### 4. `Evaluate`'s string argument needs escaped quotes

When you pass an @Formula to `Evaluate` as a string, the inner quotes need escaping. LotusScript's `{}` curly-brace string syntax avoids the mess:

```lotusscript
Dim result As Variant
' Painful — embedded quotes
result = Evaluate("@DbLookup("""":"""";"""":""";""serverA/orders.nsf"";""(byCustomer)"";Key;1)")

' Clean — curly-brace string lets you use real double quotes inside
result = Evaluate({@DbLookup("":""; ""serverA/orders.nsf""; ""(byCustomer)""; Key; 1)})
```

### 5. Don't `Delete` the session

HCL says it directly: "Do not delete session objects." LotusScript doesn't need the Java-style recycle pattern. Setting `session = Nothing` just unbinds your variable — the session is still around. Next `New` returns the same object anyway. Skip the cleanup.

## A complete example

A single agent using CurrentDatabase + Evaluate + CreateLog + GetEnvironmentString together:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim log As NotesLog
    Dim envValue As String
    Dim today As Variant

    ' Grab the current database
    Set db = session.CurrentDatabase

    ' Open a NotesLog that writes to the database itself
    Set log = session.CreateLog("Approval Audit")
    Call log.OpenNotesLog("", db.FilePath)

    ' Audit who actually triggered this — EffectiveUserName, not UserName
    Call log.LogAction("Agent triggered by " & session.EffectiveUserName _
        & " (signer: " & session.UserName & "), on server: " & CStr(session.IsOnServer))

    ' Run @Formula from LotusScript — get today's date as text plus a @DbLookup
    today = Evaluate("@Text(@Today)")
    Print "Today = " & today(0)

    ' Read a custom notes.ini value
    envValue = session.GetEnvironmentString("MyAppDefaultServer", True)
    Print "Default server (from notes.ini) = " & envValue

    Call log.Close()
End Sub
```

Things to notice:

- **`session` is declared once and shared across the whole sub** — no need to re-create
- **`EffectiveUserName` vs `UserName` audit-log distinction** — captures the actual triggerer separately from the signer
- **`Evaluate(...)` returns a Variant array** — same array-indexing convention as `GetItemValue`, you need `(0)` to read the value
- **`GetEnvironmentString`'s second parameter (`True`)** — controls whether the lookup prefixes `$` (the notes.ini convention for "custom variables marked as user-set" — `True` means don't prefix)

## What about Java and SSJS?

| Language | Equivalent class |
|---|---|
| LotusScript | `NotesSession` |
| Java | `lotus.domino.Session` — camelCase methods (`getCurrentDatabase`, `evaluate`, `createLog`, `getEnvironmentString`, `getEffectiveUserName`) |
| SSJS (XPages) | `session` is an implicit global variable injected by the XPages runtime — equivalent to `lotus.domino.Session` |

Cross-language behavior is identical. The one operational difference: **Java needs explicit `session.recycle()`** to free C++-side memory when the session goes out of scope. LotusScript auto-recycles, so this isn't an LS concern. SSJS's `session` is already provided by the runtime — **use it, don't `new` it**.

## Closing

`NotesSession` looks like just an entry point but the details add up:

1. **One session per script** — don't re-New, don't Delete
2. **`EffectiveUserName` is the runtime identity** — don't conflate with UserName in audit logs
3. **`Evaluate` is the LS-to-@Formula bridge** — short formula logic stays clean
4. **Server-script and client-script have different access levels** — first debug step is `IsOnServer` + `UserName`

Every Domino LS developer touches `NotesSession` daily, but plenty have written it for ten years without grasping the `UserName` / `EffectiveUserName` distinction. Bookmark this; scan it before writing the next agent.
