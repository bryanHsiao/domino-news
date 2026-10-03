---
title: "XPages Performance: Why Your Computed Values Run Many Times per Submit — #{} vs ${}, rendered vs loaded"
description: "Drop a println in a computed value or a rendered formula, click a button once, and it runs five or six times — not a bug, but XPages running the whole JSF lifecycle on every submit, where a #{} (compute dynamically) value binding is re-evaluated every time it's read, adding up to several runs across the phases. This piece covers three knobs that cut that repetition: #{} (re-evaluated each time) vs ${} (computed once at load, static), rendered (in the tree, evaluated across phases) vs loaded (never built into the tree, skipped entirely), when to use each, and the ${} caveat."
pubDate: 2026-10-12T07:30:00+08:00
lang: en
slug: xpages-binding-rendered-loaded-performance
tags:
  - "XPages"
  - "Performance"
sources:
  - title: "Value (control and data binding) (#{} pound = compute dynamically / ${} dollar = compute on page load) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/xpageuser/wpd_controls_pref_value.html"
  - title: "XPages Bindings: When # Runs at Page Load (${} evaluated once at load, #{} deferred; the two can't be mixed) — Intec (Paul Withers)"
    url: "http://intec.co.uk/xpages-bindings-when-runs-at-page-load/"
  - title: "XPages Tip: Loaded Vs Rendered (loaded isn't built into the tree; rendered is built but still processed each phase) — Matt White"
    url: "https://qtzar.com/2009/06/15/dslh-7t2l9q/"
  - title: "Understanding Partial Execution: Part Three – JSF Lifecycle (lifecycle phases and computed/rendered recalculation) — Intec (Paul Withers)"
    url: "http://intec.co.uk/understanding-partial-execution-part-three-jsf-lifecycle/"
relatedJava: []
relatedSsjs: []
---

You drop a `print(...)` into a computed value, or a control's `rendered` formula, click a button once — and that line prints five, six times in the console. You clicked once; why did it run so many times?

It isn't a bug. XPages runs a **whole JSF lifecycle** (six phases) on every submit, and a value binding written with `#{}` is **re-evaluated every time it's read**; across several phases, that adds up to several runs per submit. Harmless most of the time — but when that computed code holds an `@DbLookup`, a loop, or a pile of logic, it becomes a real performance killer.

The good news is there are knobs for this — and they aren't magic, just understanding when something should be computed once versus re-computed every time. This piece covers the three with the most impact: `#{}` vs `${}`, and `rendered` vs `loaded`. (For the lifecycle and partial refresh/execution background, see [partial refresh vs partial execution](/domino-news/en/posts/xpages-partial-refresh-execution/).)

---

## TL;DR

- **One submit = one whole JSF lifecycle**, and a `#{...}` (compute dynamically) value binding is **re-evaluated each time it's read** — several times across the phases.
- **`${...}` (compute on page load) runs once at page load**, bakes the result in as a static value, and doesn't re-compute after that (official: pound `#{}` = compute dynamically, dollar `${}` = compute on page load). If a value won't change within one request, use `${}`.
- **Caveat**: `${}` can't reference objects built later in the lifecycle — a `repeat` control's row variable, per-request data source values — those don't exist yet at load. Those need `#{}`.
- **`rendered`** (false = in the component tree, just not shown) is still **evaluated across the lifecycle phases**; **`loaded`** (false = never built into the tree) **skips all of it**. If visibility is fixed within a request, `loaded` is cheaper than `rendered`.
- **Don't mix `${}` and `#{}` in one expression** — it forces the `#{}` to evaluate at load too, and the behavior won't be what you expect.

## How many times your computed runs per submit: the JSF lifecycle

XPages is built on JSF, and a submit runs six phases in order: Restore View → Apply Request Values → Process Validations → Update Model Values → Invoke Application → Render Response. The catch: **a property (a control's `rendered`, or a computed field's value) isn't read just once at render time — it's read several times along the way**; each time JSF needs that value, it runs your binding again.

So the same `#{javascript:...}` can be evaluated five or six times for a single button click. If it's a string concatenation, no harm; if it's an `@DbLookup`, a `@DbColumn`, opening a view, or a loop, that's "one click, the same heavy work done several times." The root of a performance problem is often right here.

## `#{}` vs `${}`: re-computed every time vs computed once at load

These two symbols are the most-confused — and highest-leverage — spot in XPages ([official Value binding](https://help.hcl-software.com/dom_designer/14.0.0/xpageuser/wpd_controls_pref_value.html)):

- **`#{...}` = compute dynamically (pound)**: a value binding, **re-computed every time that element is read / rendered**. It's what the Designer property panel's "Compute Value" gives you, and it's the default.
- **`${...}` = compute on page load (dollar)**: a load-time binding, **evaluated once when the page first loads**, baked into the component as a static value, and not re-computed for the rest of the lifecycle ([Intec's write-up](http://intec.co.uk/xpages-bindings-when-runs-at-page-load/): `${}` runs at load, `#{}` is deferred).

That's the lever: **if a computed result won't change within this request, use `${}` so it runs once** instead of letting `#{}` re-run every phase. You don't need to sweat it early on, but at scale — or when the computed code does real work — converting the should-be-static ones to `${}` is tangible.

Two limits to remember:

- **`${}` can't reference "things not built yet."** It computes at load, so if your expression references a `repeat` control's row variable, or a data source value that only loads per request, those objects don't exist yet at load and `${}` gets nothing (or the wrong thing). That dynamic data needs `#{}`.
- **`${}` and `#{}` can't be mixed in one expression.** The whole value property is handed to the underlying layer as one string; mixing forces the `#{}` part to evaluate at load too, and the behavior stops matching what you intended.

## `rendered` vs `loaded`: whether it's in the component tree at all

The second knob is about whether a control even exists. Both `rendered` and `loaded` can make a control "not appear," but the cost is wildly different ([Loaded vs Rendered](https://qtzar.com/2009/06/15/dslh-7t2l9q/)):

- **`rendered="false"`**: the control is **still built into the component tree**, just not shown. It's still processed through the lifecycle phases, its bindings still evaluate, and even the dojo/resources it needs are still detected and injected into the HTML header.
- **`loaded="false"`**: the control is **never built into the tree at all**. XPages skips it outright — no processing, no evaluation, no resources, and your code can't get at it (`getComponent` returns nothing).

So: **if whether a block of UI appears is fixed within a request (by role, by document mode), `loaded` is much cheaper than `rendered`**, because it takes the whole control — and the computation under it — out of the lifecycle. Use `rendered` instead when you need the control "still in the tree, just hidden for now, to be shown by a later partial refresh" or "reachable from code."

## Related: when to read a value, and converters

Since we're on the lifecycle, two related points worth keeping:

- **Early phases only have the `submittedValue` (a string); the typed `getValue()` isn't there until after phase 4, Update Model Values.** So reading the same field in different phases gives you different things — the same lifecycle that [`document1.getDocument(true)`](/domino-news/en/posts/xpages-getdocument-applychanges/) hinges on for "when the value reaches the data source."
- **Disabling validation doesn't skip the converter**: even with validation off, type conversion still runs. Don't assume "validation off" means "everything is saved."

## In practice: when to use which

Boiled down to a few rules you can keep:

- **A value that won't change within this request** → `${}` (computed once at load). One that does change (per-row, per-request dynamic data) → `#{}`, and keep what's inside it cheap.
- **Visibility that's fixed within this request** → `loaded` (takes the whole block out of the lifecycle). Need it in the tree, for a later partial refresh or programmatic access → `rendered`.
- **Not sure how many times it runs** → drop a counter or a `print` in, click once, and watch how many times it fires; let the number decide whether to switch to `${}` / `loaded`.

## Wrap-up

Your computed value running several times per submit isn't a bug — it's a `#{}` (compute dynamically) value binding re-evaluating every time it's read across the whole JSF lifecycle. Switch the values that don't change within a request to `${}` (compute on page load, once), and switch controls whose visibility is fixed from `rendered` to `loaded` (never built into the tree), and you take the repeated work out of the lifecycle. Remember `${}`'s two limits (can't reference objects built later, can't mix with `#{}`), add a counter to measure, and the places worth saving become visible.
