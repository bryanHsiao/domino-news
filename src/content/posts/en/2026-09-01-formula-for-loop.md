---
title: "Formula's @For Loop: When You Actually Need It, and a Real 'Reverse an Org Hierarchy' Example"
description: "The list functions (@Transform, @Explode…) handle a whole list in one line, but some jobs still need a real loop — accumulate state, build a string in order, reverse a list. This piece goes deep on @For: the four parts (initialize/condition/increment/body), a thing that trips people up (@For returns 1, not your accumulated value, so you return the variable on a separate final line), and a real need worked through — turning an A\\B\\C org hierarchy into C\\B\\A. Plus how @While/@DoWhile differ, and the infinite-loop guard."
pubDate: 2026-09-01T07:30:00+08:00
lang: en
slug: formula-for-loop
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@For — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html"
  - title: "@While — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHILE_FUNCTION.html"
  - title: "@DoWhile — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOWHILE_FUNCTION.html"
  - title: "Server Tasks - Agent Manager tab (Max LotusScript/Java execution time) — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/othr_servertasksagentmanagertab_r.html"
  - title: "Running Web agents (Web agent time-out) — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/tune_runningwebagents_t.html"
cover: "/covers/formula-for-loop.webp"
coverStyle: "watercolor"
---

The [list-processing part](/domino-news/en/posts/formula-list-processing) showed that most "do the same thing to each value" needs collapse to one line, no loop; the [control-flow part](/domino-news/en/posts/formula-control-flow) said "loops exist but you rarely need them." This part fills in the other half: **when you *do* need a loop, how `@For` works and when it's the right tool.**

Let's open with a concrete real need — an org hierarchy stored as `A\B\C` (company\department\team) that has to display **reversed as `C\B\A`**. Reversing a list is exactly the case formula has no one-line built-in for, and where `@For` is a natural fit.

---

## TL;DR

- **[`@For`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html) has four parts:** `@For(initialize; condition; increment; body...)` — just like a for loop elsewhere. `@For` allows up to 252 statements in all.
- **The thing that trips people up:** `@For` **returns `1` (True), not the value you accumulated in the loop.** So the standard shape is: build the result into a variable inside the loop, then **return that variable on a separate line after the loop**.
- **The accumulator pattern:** start with `result := ""`, build it up step by step in the loop, return `result` at the end.
- **`@While` vs `@DoWhile` differ in when they test:** `@While` tests the condition before running (may never run); `@DoWhile` runs first, tests after (runs at least once).
- **Infinite loops are guarded:** past the standard timeout, the formula engine aborts.

---

## @For's four parts

The docs define it: "executes one or more statements iteratively while a condition remains true." Four segments, almost identical to a for loop anywhere:

```
@For(
    n := 1;                    /* initialize: give the counter a starting value */
    n <= @Elements(A);         /* condition: returns True(1)/False(0); True continues */
    n := n + 1;                /* increment: change the counter after each pass */
    ... body ...               /* body: what to repeat (@For's limit is 252 statements in all) */
)
```

Order of execution: initialize runs once → check the condition → if true, run the body → run the increment → check again… until the condition is false.

## The thing that trips people up: @For doesn't return your result

This is where people coming from other languages, or writing their first `@For`, get stuck: **`@For` itself returns `1` (True)** — the docs say it returns "True (1) unless an error occurs." It does **not** hand back whatever you computed inside the loop.

So you can't write `x := @For(...)` and expect `x` to be the accumulated result. The correct shape is the **accumulator**: open a variable *outside* the loop, build it up inside, and **after the loop, put that variable on its own final line** — a formula's return value is its last expression.

```
result := "";
@For(...  result := result + something  ...);   /* this line returns 1; ignore it */
result                                            /* THIS is what actually returns */
```

## The example: reverse an org hierarchy A\B\C → C\B\A

Putting it together. The need: `DeptFullCName` is a `\`-delimited path like `company\department\team`, to be displayed reversed.

```
A := @Explode(DeptFullCName; "\\");     /* split into a list: company : department : team */
result := "";                           /* accumulator, initialized (don't read an unassigned var) */
@For(n := 1; n <= @Elements(A); n := n + 1;
     @If(result = "";
         result := A[n];                /* first one: just place it */
         result := A[n] + "\\" + result /* after: prepend the new one in FRONT */
     )
);
result
```

(`\\` in a formula string means one backslash `\`.) The key is that last line, `A[n] + "\\" + result` — each pass puts the current element **in front of** `result`, so running forward once flips the order:

| n | A[n] | result becomes |
|---|---|---|
| 1 | company | `company` |
| 2 | department | `department\company` |
| 3 | team | `team\department\company` |

Ending with `result` = `team\department\company` — the reversal you wanted. This is the classic `@For` scenario: **build each step's result into the next step's input, in order** — a stateful, "later depends on earlier" job that a one-shot map can't express, where a loop is the right tool.

(Aside: formula has no one-line `@Reverse`. You *can* force a one-liner — `@Transform` paired with `@Member` to map each element to its mirror position — but that **breaks when level names repeat**. Org paths usually don't repeat, but it's not guaranteed, so this `@For` version is actually the **most robust and most readable** — no need to risk it for the sake of one line.)

## When to reach for @For (instead of the list functions)

The call is simple — back to the [list-processing](/domino-news/en/posts/formula-list-processing) principle, **first ask "can I compute this over the whole list at once?"**:

- **Yes** (the same, independent thing to each value) → whole-list operators or `@Transform`, no loop.
- **No**, because:
  - **you accumulate state** (a running total, feeding each step's result into the next, like the reversal above)
  - **a later element depends on an earlier one's result**
  - **you need to stop early on a condition**

  → that's when `@For` / `@While` earn their place.

In other words, loops aren't "bad" — it's that most of the time there's a shorter form. For the genuine order-and-accumulation cases, `@For` is clear and robust; don't twist yourself into one line just to avoid it.

## @While and @DoWhile

`@For`'s two close relatives differ only in **when the condition is tested**:

- **[`@While`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHILE_FUNCTION.html):** tests the condition **before** running the body — if it's false to start, the body runs **zero times**.
- **[`@DoWhile`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOWHILE_FUNCTION.html):** runs the body first, **tests after** — so the body runs **at least once**.

`@For` is really just "initialize + `@While`" with the counter and increment folded into the syntax. Manage the counter yourself and `@While` writes the same loop:

```
n := 1;
@While(n <= @Elements(A);
    ... body ...;
    n := n + 1)
```

## One safety net: an infinite loop won't hang the server

A reassuring last point: even if your condition is wrong and the loop never ends, it won't drag the server down. The exact wording in the `@For` docs is: "The formula engine exits a formula or breaks an infinite loop if the time spent performing the iterations exceeds the standard timeout value allowed for an operation." — once the iterations exceed *the operation's* standard timeout, the formula engine aborts the formula and breaks the loop.

So how long is that "standard timeout," and can you set it? The docs keep the phrasing generic on purpose, because it depends on **the operation wrapping the formula** — in practice, the enclosing agent's execution-time limit, which lives in the **Server document** (not notes.ini):

- **Background / scheduled agents**: Server document → Server Tasks → Agent Manager tab → [`Max LotusScript/Java execution time`](https://help.hcl-software.com/domino/14.5.1/admin/othr_servertasksagentmanagertab_r.html), defaulting to **10 minutes (daytime) / 15 minutes (nighttime)**; the docs state "If the agent exceeds this maximum, the agent doesn't finish, and the Agent Log records the termination."
- **Web agents**: Server document → Internet Protocols → Domino Web Engine tab → [`Web agent time-out`](https://help.hcl-software.com/domino/14.5.1/admin/tune_runningwebagents_t.html), in seconds, defaulting to **0 (no timeout)**.

The `AMgr_*` notes.ini settings govern scheduling intervals, not the execution-time cap — so you change the Server document field, not an ini. One honest caveat: HCL doesn't verbatim tie the `@For` sentence's "standard timeout value" to that specific field, but that's where the operation wrapping your `@For` actually gets cut off in practice. It's a safety net, not an excuse — still write the condition and increment correctly.

## Wrap-up

`@For` is the tool for genuine ordered accumulation: four segments (initialize/condition/increment/body), it **returns 1, not your result** (so use an accumulator variable plus a final line returning it), `@While` tests before, `@DoWhile` after. Most list needs are shorter with whole-list operators or `@Transform`; but for stateful, ordered work like reversing an org hierarchy, `@For` is the clearest and most robust answer.
