---
title: "@Command vs @PostedCommand: Why Your Formula Doesn't Run in the Order You Wrote It"
description: "You compute a field, then call an @Command to do a UI action — and the action runs first, your computation second. Here's why: @Command mostly runs in the order you wrote it, but @PostedCommand always defers until after every other @function finishes, so a @PostedCommand at the top of your formula runs last. Worse, some @Command functions are themselves deferred. This uses the official order-of-evaluation rules to explain the difference, which @Commands are inherently deferred, and when to use which."
pubDate: 2026-09-29T07:30:00+08:00
lang: en
slug: formula-command-postedcommand
tags:
  - "Formula"
  - "Notes UI"
sources:
  - title: "Working with @commands — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WORKING_WITH_COMMANDS.html"
  - title: "Order of evaluation for formula statements — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html"
  - title: "@Command (Formula Language) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html"
relatedJava: []
relatedSsjs: []
---

You want to "compute the fields first, then have the UI do an action," so you write it in that order — and the action runs first, your computation second. Or you put a `@PostedCommand` at the very top of the formula and it insists on running last.

That's not a bug — it's Formula's order-of-evaluation rule. `@Command` and `@PostedCommand` run at **different times**, and some `@Command`s are themselves deferred. Miss this and your UI actions fire in the wrong sequence.

---

## TL;DR

- **The base rule**: Domino evaluates a formula top-to-bottom, left-to-right, finishing each statement before the next — **except that `@PostedCommand` and a few `@Command` functions defer** until after every other @function has run.
- **`@Command`**: mostly runs "in sequence" (with some exceptions).
- **`@PostedCommand`**: always runs **last**, in order among themselves. So a `@PostedCommand` written at the top of the formula executes **after** everything else — HCL says this "emulates the behavior of @Command in Notes R3."
- **Some `@Command`s are inherently deferred**: the [@Command reference](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html) table splits commands into "Evaluated after all @functions" (e.g. `EditClear` / `FileExit` / `NavigateNext`) vs "Evaluated immediately" (e.g. `Clear` / `ExitNotes` / `NavNext`). Similar names, different timing — don't confuse them.
- **In practice**: "compute first, then act" → put the action in `@PostedCommand`; "switch state now, then continue" → `@Command`.

## When each one runs

The official [Order of evaluation](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html) states the master rule plainly:

> Domino evaluates formulas from beginning to end and left to right, completing each statement before proceeding to the next, except that @PostedCommand and a few @Command functions are executed in order after all other @functions complete execution.

And [Working with @commands](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WORKING_WITH_COMMANDS.html) defines the two:

- **`@Command`**: "@Command functions execute in sequence with other @functions, with some exceptions."
- **`@PostedCommand`**: "@PostedCommand functions execute in sequence with each other after all other @functions execute." — noting "This emulates the behavior of @Command in Notes R3."

## "Written first, runs last"

The counterintuitive part of `@PostedCommand`: its position in the source does **not** reflect when it runs. HCL's example:

```
@PostedCommand([CommandName]; Argument);
@If(Condition; TrueStatement; FalseStatement);
FIELD X := "Text"
```

HCL's note on it: **"The first statement is executed last."** — the `@PostedCommand` runs last, because it waits for `@If` and `FIELD X :=` and every other @function to finish.

Compare `@Command`, which runs where you put it: `@Command([EditDocument])` executes **before** a following `@Prompt`; switch it to `@PostedCommand([EditDocument])` and it runs **after**. That before/after is exactly what causes "the prompt pops up before the document is even in edit mode" bugs.

## Some @Commands are deferred anyway

The layer people miss: **not every `@Command` runs immediately.** The [@Command reference](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html) table splits them:

- **Evaluated after all @functions** (deferred, behaving like @PostedCommand): e.g. `EditClear`, `FileExit`, `NavigateNext`.
- **Evaluated immediately**: e.g. `Clear`, `ExitNotes`, `NavNext`.

Notice how alike the pairs are (`FileExit` vs `ExitNotes`, `NavigateNext` vs `NavNext`). Pick the wrong one and the timing shifts by a whole pass. When ordering matters, check which class your command is in — don't guess from the name.

## Which to use

- **"Compute the fields and decisions first, then do the UI action"** → put the action in `@PostedCommand`, so it's guaranteed to run after your computation.
- **"Switch state now, then keep going based on it"** (enter edit mode, then act on the mode) → use `@Command` so it runs right there.
- **Multiple actions that need a defined order** → use `@PostedCommand` for all of them; they run in written order among themselves. Mixing `@Command` and `@PostedCommand` splits the order into "immediate ones first, posted ones after."

## What about Java and SSJS?

`@Command` / `@PostedCommand` are a **Formula-language mechanism for driving the Notes front-end UI**, with no direct Java/SSJS class counterpart:

- **LotusScript**: the equivalent is `NotesUIWorkspace` methods (`EditDocument`, `ViewRefresh`, etc.) — called directly and executed directly, with none of the "defer to the end" semantics of @PostedCommand; the order is simply the order you call them.
- **SSJS/XPages**: there's no `@Command`. Front-end actions go through XPages' own event and partial-refresh model, not this posted/immediate scheduling.
