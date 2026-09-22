---
title: "@SetEnvironment and SetEnvironmentVar: Those \"Environment Variables\" Live in the notes.ini of Whatever Machine Runs the Code"
description: "To stash a setting from Formula or LotusScript, you've got a pile of look-alikes: @SetEnvironment, @Environment, session.SetEnvironmentVar, GetEnvironmentString. What they actually read and write is the notes.ini of the machine running the code — per-machine, not shared, not replicated. Plus a $-prefix rule that trips people up (Formula and LS prepend $ by default; reading a native notes.ini setting needs a flag). This piece pins down where they write, where the $ comes from, when to use them, and when to switch to a profile document instead."
pubDate: 2026-09-22T07:30:00+08:00
lang: en
slug: domino-environment-variables
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Formula"
sources:
  - title: "@SetEnvironment (Formula Language) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html"
  - title: "SetEnvironmentVar (NotesSession) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SETENVIRONMENTVAR_METHOD.html"
  - title: "GetEnvironmentString (NotesSession) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_GETENVIRONMENTSTRING_METHOD.html"
  - title: "Using environment variables — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_USING_ENVIRONMENT_VARIABLES.html"
relatedJava: ["Session"]
relatedSsjs: ["session"]
---

You want to stash a small setting from Formula or LotusScript — a last-used value, a counter, a toggle. There's a pile of look-alikes to reach for: `@SetEnvironment`, `@Environment`, `Environment()`, `session.SetEnvironmentVar`, `session.GetEnvironmentString`… all called "environment variables." But **where they write, whether they cross machines, and whether they need a `$`** matters — get it wrong and you'll "store it but can't read it back," or assume "set it once and everyone sees it."

## TL;DR

- **They read/write the notes.ini of the machine running the code**: `@SetEnvironment` writes the user's notes.ini; `SetEnvironmentVar` / `GetEnvironmentString` read/write the **local notes.ini**. → **per-machine, not shared, not replicated.**
- **The `$` prefix rule**: Formula's `@SetEnvironment` **prepends `$`** to the name; LS's `SetEnvironmentVar` also prepends `$` when the third parameter `isSystem` is false/omitted, and doesn't when true. The `$` distinguishes **user environment variables (has `$`) from system ones (no `$`, like native notes.ini settings)**.
- **This is not shared state**: a server agent writes the server's notes.ini, a client writes the client's — for cross-user / cross-machine state, use a profile or config document.

## Where they actually write

Break the biggest misconception first: these "environment variables" **aren't stored in a database, and aren't one value everyone shares** — they're written into the **`notes.ini` of the machine running the code**.

The [docs](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html): `@SetEnvironment` "sets an environment variable stored in the **user's notes.ini file** (Windows / UNIX) or Notes Preferences file (Macintosh)." LotusScript is the same — per the [docs](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_GETENVIRONMENTSTRING_METHOD.html), `getEnvironmentValue`, `getEnvironmentString`, and `setEnvironmentVar` read/write environment variables stored in the **local notes.ini** (the current user's notes.ini, or Notes Preferences file).

That word "local" is the point:

- A formula/agent a user clicks on the **client** writes to **that Notes client's** notes.ini.
- An agent running on the **server** writes to the **server's** notes.ini.

So it **doesn't cross machines, doesn't replicate, isn't shared.** "I set an environment variable — why can't another machine read it?" Because it only ever lived on that one machine.

## The `$` prefix that trips people up

The second trap is `$`. Domino uses "does the name start with `$`" to tell apart two kinds: **user environment variables** (`$name`) and **system environment variables** (`name` — the native settings in notes.ini). And each interface **prepends `$` for you by default**:

- **Formula**: `@SetEnvironment("Foo"; "bar")` actually stores `$Foo=bar` in notes.ini — the [docs](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html) say it "prepends a dollar sign (`$`) to the variable name." `@Environment("Foo")` reads `$Foo` too, so they line up.
- **LotusScript**: [`SetEnvironmentVar`](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SETENVIRONMENTVAR_METHOD.html) prepends `$` to the name **unless you set the third parameter `isSystem` to True, or the name already starts with `$`**; `GetEnvironmentValue` / `GetEnvironmentString` per the docs "prepend a `$` if the second parameter is false or omitted, and do not prepend a `$` if the second parameter is true."

```lotusscript
Dim s As New NotesSession
' write a user variable (stored as $MyApp_LastUser)
Call s.SetEnvironmentVar("MyApp_LastUser", "Amy")
Print s.GetEnvironmentString("MyApp_LastUser")          ' reads $MyApp_LastUser

' read a "native" notes.ini setting (no $, e.g. a Debug param) -> pass True
Print s.GetEnvironmentString("Directory", True)          ' reads notes.ini Directory=
```

**The gotcha**: what you store with `@SetEnvironment` is a `$`-prefixed user variable; reading it back from LS (which also prepends `$` by default) lines up fine. But when you want to **read/write a native notes.ini parameter that has no `$`** (things like `Debug_*`, `Directory`), you must set `isSystem` / the second parameter to **True** — otherwise you're looking for `$thatname` and of course won't find it.

## When to use it, when not to

Environment variables suit **"a small local state for this machine"**: remembering a value a user last picked on their workstation, a local counter, a toggle that only affects this box.

They're **wrong for shared state** — because they don't cross machines or replicate. If you need "every user, every server sees the same value" (a global setting, a shared counter), environment variables are the wrong tool; use a **config document** or a [profile document](/domino-news/en/posts/profile-documents) — those live in a database and travel with replication. Keep "environment variable = this machine; profile/config = database (shareable)" straight and you won't reach for the wrong one.

## Wrap-up

`@SetEnvironment` / `SetEnvironmentVar` and friends read and write the **notes.ini of the machine running the code** — **per-machine, not shared, not replicated** — and they prepend `$` to the name by default (user vs system variables), so touching a native notes.ini setting needs `isSystem` / the second parameter set True. Great for a small local state; for **shared** state, switch to a profile/config document. Keep "local machine vs database" clear and this API stops "storing things you can't read back."
