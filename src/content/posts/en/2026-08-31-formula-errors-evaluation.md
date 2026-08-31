---
title: "Error Handling and Evaluation in Formula: @IfError, @Eval, and Where a Formula Runs"
description: "Series finale. The first six parts covered what formula can do; this one covers two things you hit no matter what you write: what happens when a formula errors, and where and when a formula actually runs. Catch errors with @IfError and a fallback, test with @IsError — but remember @IfError hides the real error message, so drop it while debugging. @Eval runs a string as a formula at runtime. And 'which context a formula runs in' is the root of half the series' gotchas (@DbLookup not allowed in column formulas...). Part seven (final) of the Formula @function series."
pubDate: 2026-08-31T07:30:00+08:00
lang: en
slug: formula-errors-evaluation
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@IfError — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IFERROR_FUNCTION.html"
  - title: "@Eval — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVAL.html"
  - title: "Where to use scripts and formulas — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHERE_TO_USE_SCRIPTS_AND_FORMULAS.html"
cover: "/covers/formula-errors-evaluation.webp"
coverStyle: "photoreal-3d"
---

This is the last part of the Formula @function series. The first six covered what formula **can do** — [reading data](/domino-news/en/posts/formula-dblookup-dbcolumn), [list processing](/domino-news/en/posts/formula-list-processing), [text](/domino-news/en/posts/formula-text-functions), [names](/domino-news/en/posts/formula-name-functions), [dates](/domino-news/en/posts/formula-date-time), [control flow](/domino-news/en/posts/formula-control-flow). This part covers two things you hit no matter what you write: **what to do when a formula errors**, and **where and when a formula actually runs**.

---

## TL;DR

- **`@IfError` catches errors:** `@IfError(expression; fallback)` — the expression errors, you get the fallback (no fallback given, you get `""`).
- **`@IsError` tests for an error:** the docs say it "Returns 1 (True) if the value is an @ERROR value."
- **Debugging trap:** `@IfError` **hides the real error message** — drop it while chasing a problem.
- **`@Eval` evaluates at runtime:** run a **string as a formula** during execution.
- **Context matters:** a formula in a field, a view column, a selection formula, an agent, or a button behaves differently and allows different functions — the root of many of the series' gotchas.

---

## Catching errors: @IfError and @IsError

Across the series you've already met a few places that **return errors** — the canonical one is [part one](/domino-news/en/posts/formula-dblookup-dbcolumn)'s `@DbLookup`: a key that isn't found returns not an empty value but the error "Entry not found in index." Left uncaught, that error propagates outward and the whole formula fails.

The most direct catch is **[`@IfError`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IFERROR_FUNCTION.html)**. The docs define it: "Returns a null string ("") or the value of an alternative statement if a statement returns an error."

```
@IfError(@DbLookup(""; ""; "ProductsByCode"; Code; "Name"); "(no such code)")
```

The first argument, if normal, returns its value; on an error, you get the second. With no second argument, an error returns `""`.

To **test** whether a value is an error (rather than substitute directly), use **`@IsError`** — the docs say it "Returns 1 (True) if the value is an @ERROR value, returns 0 (False) if not an error." Paired with `@If`, it gives you explicit branching:

```
result := @DbLookup(...);
@If(@IsError(result); "not found"; result)
```

**One important debugging note:** `@IfError` is handy, but it **swallows the real error message** and replaces it with your fallback. So when you're chasing "why is this formula misbehaving," **drop the `@IfError` first**, let the real error surface, fix it, then wrap it back. Error handling shouldn't become error hiding.

## @Eval: run a string as a formula

Sometimes the formula logic itself is **built dynamically** — stored in a field, or assembled as a string, to be evaluated at runtime. That's **[`@Eval`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVAL.html)**. Wrap the text in `{}` or `""`, concatenate segments with `+`, and it returns the value of the **last expression**:

```
x := "re";
@Eval({x + "bar"})     → "rebar"
```

It's suited to **agents and buttons** for dynamic logic. But **don't use it in a view column or selection formula** — the view engine can't pre-analyze a formula whose shape is only known at runtime, and the result is unpredictable.

## Where a formula runs matters

This is the idea that ties the whole series together. You may have noticed several functions came with a rider: "**not allowed in a column or selection formula, or a mail agent**" — `@DbLookup`, `@DbColumn`, and `@Eval` all do. That isn't a random restriction; it's because **which context a formula runs in decides what it can do and when it's evaluated.**

The [docs frame formula](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHERE_TO_USE_SCRIPTS_AND_FORMULAS.html) as: "Formulas are expressions that have program-like attributes," best "for working within the object that the user is currently processing" — return a field's default value, decide a view's selection criteria. And the evaluation timing varies a lot by context:

- **Field formulas:** the timing [depends on the field type](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABOUT_EDITABLE_AND_COMPUTED_FIELDS.html) — Computed on create/save/refresh, Computed for display on open/save, and Computed when composed only once, at document creation.
- **View column / selection formulas:** evaluated for each document as the view indexes — which is why you **can't** put anything that returns external data or is runtime-determined here (`@DbLookup`, `@Now`, `@Eval`), on pain of poor performance or unstable results.
- **Agents / buttons:** driven by a trigger, able to do side effects (`@Command`, `@Prompt`, `@Eval` dynamic logic).
- **Hide-when formulas:** control whether an element shows, evaluated as the display context changes.

When a function "does nothing here" or "gives odd results," ask first: **what context is this formula running in?** Nine times out of ten the answer is there.

## Series recap

Seven parts in, formula goes from "a little expression that fills a field" to a language you can seriously use:

1. [Reading across databases](/domino-news/en/posts/formula-dblookup-dbcolumn): `@DbColumn` / `@DbLookup`.
2. [List processing](/domino-news/en/posts/formula-list-processing): it's a functional list language, `@Transform` as map.
3. [Text](/domino-news/en/posts/formula-text-functions): `@Left` / `@Middle` / `@Word` / `@ReplaceSubstring`.
4. [Names](/domino-news/en/posts/formula-name-functions): `@Name` converts the three formats.
5. [Dates](/domino-news/en/posts/formula-date-time): `@Adjust`, subtracting for seconds.
6. [Control flow](/domino-news/en/posts/formula-control-flow): temp variables `:=`, `@If` as switch.
7. Errors and evaluation (this part): `@IfError`, `@Eval`, context decides behavior.

Formula isn't out to replace LotusScript or Java, but for "fill a field, compute a view, do quick logic," it's often the shortest and most Domino-native path. End of series.
