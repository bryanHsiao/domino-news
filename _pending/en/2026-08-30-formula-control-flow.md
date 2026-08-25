---
title: "Control Flow and Variables in Formula: :=, @If, @Do, @For/@While"
description: "A real formula branches, holds intermediate values, and occasionally loops. This piece covers structuring formulas: temp variables x := ... are the modern backbone (semicolon-separated, the last statement is the return value); @If chains up to 99 condition/action pairs — formula's switch; @Do evaluates in sequence and returns the last; and real loops @For/@While/@DoWhile exist but, because formula is list-oriented, are rarely needed. Part six of the Formula @function series."
pubDate: 2026-08-30T07:30:00+08:00
lang: en
slug: formula-control-flow
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@If — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IF.html"
  - title: "@Do — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DO.html"
  - title: "@For — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html"
---

A simple formula is a single expression. But real formulas **branch** (take different paths by condition), **hold intermediate values** (compute once, use many times), and occasionally **loop**. This part covers the tools for structuring a formula — and one fact that feels counterintuitive coming from other languages: **in formula, you rarely need a loop.**

---

## TL;DR

- **Temp variables `x := ...` are the backbone:** `a := ...; b := ...; result` — semicolon-separated statements, and the **last statement is the whole formula's return value**. Compute once and store it, avoid recomputing, and keep the formula readable.
- **[`@If`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IF.html) is formula's switch:** chain **up to 99** condition/action pairs, ending with one else. The first true one runs; the rest are skipped.
- **`@Do` evaluates in sequence:** `@Do(...)` left to right, returning the **last** value.
- **Loops exist but are rarely used:** `@For`/`@While`/`@DoWhile` are real loops — but formula is [list-oriented](/domino-news/en/posts/formula-list-processing), so most "do something to each value" is written against the whole list, no loop needed.

---

## Temp variables: `:=` is the modern backbone

The habit to build first. A formula can be **several statements separated by semicolons**, and **the value of the last statement is the formula's result**. The middle statements often use `:=` to store computed values in temp variables:

```
subtotal := Price * Qty;
tax := subtotal * 0.05;
subtotal + tax
```

Three statements: subtotal, tax, return the sum. Two wins — **compute once and store** (`subtotal` isn't recomputed twice) and **readable** (each step has a name). It's also why you rarely need `@Set`: `:=` is more direct.

(One easy confusion: a semicolon at the **top level** is a "statement separator," but inside `@If(...)` or `@Do(...)` it's an "argument separator." One symbol, two roles.)

## @If: formula's switch

`@If` isn't limited to "one condition, true-branch, false-branch." It chains many pairs:

```
@If(cond1; action1; cond2; action2; ...; elseAction)
```

The docs are clear: "You can list up to 99 conditions and corresponding actions, followed by just one action to be performed when all the conditions are False." — **up to 99** condition/action pairs, ending with the else. And it short-circuits: "As soon as a condition evaluates to True, Notes/Domino performs the associated action and ignores the remainder of the @If statement." The first true one runs; the rest aren't looked at.

The docs' example is a three-way branch:

```
@If(CostOfGoods > 12.45; "Over Budget";
    CostOfGoods < 12.45; "Bill of Materials OK";
    "Estimate Right on Target")
```

That's the `switch` / `else if` chain of other languages — don't force nested `@If` for it.

## @Do: chain several things into one expression

Sometimes you need to "do several things in order, then return the last result" — especially in buttons and agents. That's [`@Do`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DO.html). The docs define it: "Evaluates expressions from left to right, and returns the value of the last expression in the list."

For **computing values**, though, temp variables `:=` are usually clearer than deeply nested `@Do`; keep `@Do` for side-effect sequences like "on button click, run several `@Command`/`@Prompt` in order."

## Loops: they exist, but you mostly won't need them

Formula has real loops — [`@For`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html), `@While`, `@DoWhile`. The docs define `@For`: "Executes one or more statements iteratively while a condition remains true." The syntax is nearly the same as a for loop elsewhere:

```
@For(n := 1;
     n <= @Elements(Categories);
     n := n + 1;
     @Prompt([OK]; "Category " + @Text(n); Categories[n]))
```

Initialize, condition, increment, body — `@While` checks before running, `@DoWhile` checks after.

But the key point: **you mostly won't need them.** As the [list-processing part](/domino-news/en/posts/formula-list-processing) covered, formula is list-oriented — "do the same thing to each value" is written against the whole list (implicit map, or `@Transform`), no loop. The cases that genuinely need `@For`/`@While` are the few where you **accumulate state** or **do a side effect per element** (like the per-category prompt above). When you catch yourself wanting a loop in formula, ask first: can this be a whole-list operation or `@Transform`?

## Which to reach for

- **Store intermediate values, chain a few steps** → temp variables `:=` (the last statement is the result).
- **Multi-way branching** → `@If` (many condition pairs, used as a switch).
- **Do several things in order in a button/agent** → `@Do`.
- **Genuinely iterate, accumulate, or side-effect per element** → `@For`/`@While` — but first confirm a list operation won't do it.

The next part closes the series: **error handling and evaluation** — how `@IsError`/`@IfError` catch errors, `@Eval` evaluates dynamically, and how a formula's evaluation timing differs across places (a field, a view column, an agent).
