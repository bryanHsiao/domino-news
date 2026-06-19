---
title: "LotusScript's Evaluate: Running @Formula Straight from Code"
description: "Sometimes the perfect tool in your head is an @function — @Name, @Unique, @Explode, @DbLookup — but you're in LotusScript. Evaluate is the bridge: pass an @formula as a string, run it at runtime, get the result back. This article covers the two call forms (with and without a document context), the trap everyone hits (the return value is always an array), and which @functions aren't supported (the UI ones — @Command, @Prompt, @PickList, and friends)."
pubDate: 2026-06-20T07:30:00+08:00
lang: en
slug: lotusscript-evaluate
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Using the Evaluate statement — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html"
  - title: "NotesSession class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
  - title: "NotesDocument class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
relatedJava: ["Session"]
relatedSsjs: ["session"]
cover: "/covers/lotusscript-evaluate.webp"
coverStyle: "art-deco"
---

Sometimes you're writing LotusScript, but the tool that fits perfectly is an **@function** — you want `@Name`'s hierarchical-name handling, `@Unique`'s dedup, `@Explode` / `@Implode`'s string split-and-join, or `@DbLookup`'s cross-database lookup. The problem: those are formula language (@formula), and you're in LotusScript.

[`Evaluate`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html) is the bridge. It lets you pass an @formula as a **string**, run it at runtime, and get the result back. This piece covers its two forms, one trap nearly everyone hits, and which @functions can't be used here.

---

## TL;DR

- Two forms: `result = Evaluate(formula$)`, or with a document context `result = Evaluate(formula$, doc)`
- The formula is a **string** — wrap it in braces `{...}` or quotes
- **The big trap**: the return value is **always an array** (catch it with a `Variant`); even a single value lives in `result(0)`
- The `doc` form: the formula can reference that document's fields
- **Unsupported @functions**: the UI / DDE ones — `@Command`, `@Prompt`, `@PickList`, `@DialogBox`, `@PostedCommand`, `@DbManager`, `@DbName`, `@DbTitle`, `@ViewTitle`, `@DDE*`

---

## The two call forms

**Formula only**, when the formula is self-contained and needs no document's fields:

```lotusscript
Dim v As Variant
v = Evaluate({@Name([Abbreviate]; "CN=John B Goode/OU=Sales/O=Acme/C=US")})
Print v(0)    ' John B Goode/Sales/Acme/US
```

**Formula + document context**, when the formula references a document's fields, pass a [`NotesDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) as the second argument:

```lotusscript
v = Evaluate({@Created}, doc)         ' the doc's creation time
v = Evaluate({Subject + " (" + Status + ")"}, doc)   ' reference the doc's fields directly
```

`Evaluate` is also a method of [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) (`session.Evaluate(...)`), with identical behaviour.

## The big trap: the result is always an array

This one bites every newcomer. Verbatim from the docs: "You should use a variant for the return value, since you may not know how many elements are being returned." — the **result is always an array**, and even when the formula computes a single scalar, it sits in `result(0)`, not handed to you directly.

```lotusscript
Dim v As Variant
v = Evaluate({@Sum(1 : 2 : 3)})
' Right:
Print v(0)        ' 6
' Wrong:
Print v           ' type error / not what you wanted
```

So always catch an `Evaluate` result in a `Variant` and always read from `(0)` (iterate the whole array for multi-value results). Write it as if it returns a scalar and you'll eventually trip.

## Which @functions aren't supported

`Evaluate` runs "computational" formulas; **any @function that needs a UI or DDE is unsupported**. The ones the docs name:

`@Command`, `@DbManager`, `@DbName`, `@DbTitle`, `@DDEExecute`, `@DDEInitiate`, `@DDEPoke`, `@DDETerminate`, `@DialogBox`, `@PickList`, `@PostedCommand`, `@Prompt`, `@ViewTitle`.

The reasoning is the same as the UI classes covered earlier — `Evaluate` runs in the logic layer, not in the context of an open UI window, so "pop a dialog", "issue a menu command", "ask the user" simply have nowhere to run. For user interaction, go back to the `NotesUIWorkspace` path.

## When you should reach for Evaluate

Not everything should detour through formula — for plain string and number work, LotusScript's own functions are more direct. `Evaluate` pays off when **one @function solves it in a line while LotusScript would take a chunk**. Common cases:

- `@Unique` — dedup a list
- `@Name` — every flavour of hierarchical-name conversion (the site also covered doing this with [`NotesName`](/domino-news/posts/notes-name/) — use whichever fits)
- `@Explode` / `@Implode` / `@Trim` — split, join, and trim strings
- `@DbLookup` / `@DbColumn` — cross-database lookups
- `@Abstract` — summarise text

When one formula line replaces ten lines of loop, `Evaluate` is the right tool.

## In other languages

| Language | Counterpart | Form |
|---|---|---|
| Java (`lotus.domino.*`) | `Session.evaluate` | `session.evaluate(formula)` / `session.evaluate(formula, doc)` |
| SSJS / XPages | `session.evaluate` | same |

Consistent across all three: pass a string formula, get back a `Vector` / array (still "always a collection"), still no UI-class @functions. On the Java side the return is a `java.util.Vector` and you read it with `elementAt(0)` — the "always a collection" trap is the same, just spelled in Java.
