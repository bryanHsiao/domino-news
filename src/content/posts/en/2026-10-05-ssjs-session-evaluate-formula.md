---
title: "Running @Formula from SSJS: session.evaluate — Its Vector Return, Limits, and Why It Can't Change a Document"
description: "You already have Formula logic — an @DbLookup, an @Name formatting call — and you don't want to rewrite it in SSJS. session.evaluate() runs a Formula string straight from SSJS and hands the result back. But it has sharp edges: it returns a java.util.Vector (not a scalar), field references need the document as a second argument, UI @functions (@Command/@Prompt/@PickList…) don't work in it, and it can't change a document — only compute a result. This covers the two signatures, the return and limits, and how to write the result back when you need to persist it."
pubDate: 2026-10-05T07:30:00+08:00
lang: en
slug: ssjs-session-evaluate-formula
tags:
  - "SSJS"
  - "Formula"
  - "XPages"
sources:
  - title: "evaluate (Session - Java) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EVALUATE_METHOD_JAVA.html"
  - title: "Global objects and functions (JavaScript) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html"
  - title: "Server-side scripting — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/ssjs-session-evaluate-formula.webp"
coverStyle: "minimalist-mono"
---

You already have a piece of Formula logic — an `@DbLookup`, an `@Name` call to format a name — and in XPages you'd rather not rewrite the whole thing in SSJS. `session.evaluate()` is for exactly that: **run a Formula string straight from SSJS and get the result back.**

But it has sharp edges worth knowing: it returns a `Vector` (not the scalar you might expect), field references need the document passed in, UI @functions don't work in it, and — the one that surprises people — **it can't change a document, only compute a result.**

This piece lays out `session.evaluate`'s two forms, its return and limits.

---

## TL;DR

- **`session.evaluate(formula)` → `java.util.Vector`**: results come back in a Vector, with a scalar result in the **first element** (`firstElement`).
- **Formula references a field → use the two-arg `evaluate(formula, doc)`**: pass the document as the second argument so the formula can read field values.
- **UI @functions don't work**: `@Command`, `@Prompt`, `@PickList`, `@DialogBox`, `@PostedCommand`, `@DbName`, `@DbTitle`, `@ViewTitle`, `@DDE*`, `@DbManager` all fail inside evaluate.
- **It can't change a document**: HCL says "You cannot change a document with evaluate; you can only get a result" — to persist, write the result back with `replaceItemValue`.
- **SSJS already exposes many @functions natively**: lots of @functions can be called directly in SSJS, no evaluate needed.
- **Use it** to reuse existing Formula (lookups, name formatting) without porting it to SSJS.

## session.evaluate: run a Formula, get a Vector

The official [evaluate (Session)](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EVALUATE_METHOD_JAVA.html) has two signatures:

```
public java.util.Vector evaluate(String formula)
public java.util.Vector evaluate(String formula, Document doc)
```

The return is always a `java.util.Vector` — "A scalar result is returned in firstElement." So even when your formula computes a single value, read it from the first element:

```javascript
var v = session.evaluate("@Name([Abbreviate]; @UserName)");
var name = v.firstElement();     // scalar result is in the first element
```

## Pass the document: when the formula references fields

As soon as a formula mentions a field name, use the **two-arg form** with the document, or it can't resolve the values:

```javascript
var doc = currentDocument.getDocument();     // or any NotesDocument
var total = session.evaluate("Qty * UnitPrice", doc).firstElement();
```

Without the doc, `Qty` and `UnitPrice` have nothing to resolve against.

## Two limits: UI @functions, and no document changes

**(1) UI @functions fail.** evaluate is back-end computation with no front-end UI, so HCL lists these UI-affecting @functions as ones that "do not work": `@Command`, `@DbManager`, `@DbName`, `@DbTitle`, `@DDEExecute`, `@DDEInitiate`, `@DDEPoke`, `@DDETerminate`, `@DialogBox`, `@PickList`, `@PostedCommand`, `@Prompt`, `@ViewTitle`. To pop a dialog or drive the UI, use another path (see [@Prompt / @PickList](/domino-news/en/posts/formula-prompt-picklist) and [@Command](/domino-news/en/posts/formula-command-postedcommand) — also client front-end only).

**(2) It can't change a document.** This is the one people misread. HCL's words:

> You cannot change a document with evaluate; you can only get a result. To change a document, write the result to the document with a method such as Document.replaceItemValue.

So even a formula with a `FIELD X := ...` won't be written back by evaluate — it just returns a result. To persist, you take over:

```javascript
var result = session.evaluate("@Trim(@Name([CN]; Owner))", doc).firstElement();
doc.replaceItemValue("OwnerCN", result);     // write it back yourself
```

## SSJS already has many @functions

Not everything needs evaluate. The SSJS runtime ([Server-side scripting](https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html) and [Global objects and functions](https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html)) exposes a set of @functions you can call directly in SSJS, without wrapping them in a string for evaluate. For simple formatting or decisions, a native @function or plain SSJS is more direct; `session.evaluate`'s value is in **reusing a whole piece of existing Formula** (a dynamically-built formula string, or existing @DbLookup logic).

## When to use it

- **Reuse existing Formula logic** (lookups, complex @formula) without porting it → `session.evaluate`.
- **The formula is a dynamically-built string** → evaluate takes a string, which fits.
- **Just simple formatting / a decision** → use plain SSJS or a native @function; skip evaluate.
- **You need to store the result** → remember evaluate only returns it; `replaceItemValue` it back yourself.

## What about LotusScript and Java?

- **LotusScript**: the counterpart is `Evaluate` (`NotesSession.Evaluate` / the global `Evaluate`), with the same semantics — returns an array, doesn't change the document, UI @functions don't work. The site's [LotusScript Evaluate piece](/domino-news/en/posts/lotusscript-evaluate) covers the LS side; this is the SSJS form.
- **Java**: `session.evaluate(...)` is itself a Java method (it's what SSJS calls), returning `java.util.Vector`, used the same way.
