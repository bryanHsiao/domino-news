---
title: "Wrong Entry Count from &Count on a Categorized View? The 12.0.2 ReadViewEntries Regression and DISABLE_REFIND_IN_READENTRIES"
description: "After moving to 12.0.2, a categorized view read with ?ReadViewEntries&Count=N comes back with the wrong number of entries — nothing in your app changed, it's a Domino regression. It was introduced in 12.0.2 while fixing another bug (SPR# PJONB7GRUL), tracked as SPR# MNIACMGKUV; the workaround is DISABLE_REFIND_IN_READENTRIES=1 in the server notes.ini, and the real fix is 12.0.2 FP3 or 14.0. This covers the symptom, what ReadViewEntries&Count is, why it happens, and a look-alike categorized-view bug where the same setting does nothing."
pubDate: 2026-10-06T07:30:00+08:00
lang: en
slug: domino-readviewentries-count-regression
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "URL commands for opening servers, databases, and views (?ReadViewEntries / Count) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
  - title: "KB0113007 (categorized view &Count wrong count; SPR# MNIACMGKUV) — HCL Customer Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0113007"
  - title: "Categorised view problem in Domino Nomad Web 1.07 (a similar but different bug) — FoCul"
    url: "https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/"
relatedJava: []
relatedSsjs: []
---

After moving to 12.0.2, a **categorized view** read with `?ReadViewEntries&Count=N` comes back with the **wrong number of entries**. You didn't change a line of your app and the view is untouched — this isn't your bug, it's a Domino regression.

The part that trips people up: you'll find a notes.ini workaround online, `DISABLE_REFIND_IN_READENTRIES=1` — but **the same setting does nothing for another, very similar categorized-view bug.** So confirm which one you've hit before you add it.

This piece covers the symptom, what `ReadViewEntries&Count` is, why 12.0.2 does this, and how to tell the two apart.

---

## TL;DR

- **Symptom**: a **categorized view** read with `?ReadViewEntries&Count=N` returns the **wrong number of entries** — starting in **12.0.2**.
- **Cause**: a **regression** (**SPR# MNIACMGKUV**) introduced when 12.0.2 fixed another bug (**SPR# PJONB7GRUL**); a "refind" (re-position) step added to the read miscounts.
- **Workaround**: add `DISABLE_REFIND_IN_READENTRIES=1` to the **server** `notes.ini` and restart — it turns that refind off, reverting to the pre-fix behavior.
- **Real fix**: upgrade to **12.0.2 FP3** or **14.0** (the setting is a stopgap; upgrade when you can).
- **Don't confuse it**: there's a separate "empty categories" categorized-view bug ([FoCul's write-up](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/)) where the same `DISABLE_REFIND_IN_READENTRIES=1` "did not work" — that's a different SPR, fixed in 12.0.2 FP1.

## The symptom: &Count is wrong on a categorized view

`?ReadViewEntries` is the Domino URL command that reads **view entries as XML** (without the fonts, formats, and other appearance attributes) — it's what classic web, DAS (Domino Access Services) REST, and Nomad Web use under the hood. HCL's [URL commands](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) define `Count` plainly: `Count=n`, where n is the number of rows to display — paired with `Start` (which row to begin at — a categorized view can use hierarchical subindexes like `3.5.1`) to page through. The trouble is in **categorized views** specifically: after 12.0.2, reading one with `&Count` returns an entry count that doesn't add up. A categorized view's "entries" include both **category rows** and **document rows**, so counting and positioning are trickier than in a flat view — which is exactly where the regression lands.

## Why: fix one bug, introduce another

It's a classic regression story. When HCL fixed a bug in 12.0.2 (**SPR# PJONB7GRUL**), the `ReadEntries` read path gained a "refind" — a **re-positioning to an entry** during the read. That's harmless in a flat view, but in a categorized view it throws off the `&Count`, becoming a new regression (**SPR# MNIACMGKUV**, see [KB0113007](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0113007)).

The setting name is literal: `DISABLE_REFIND_IN_READENTRIES` **turns off that refind inside ReadEntries**, taking the behavior back to before the step was added.

## Workaround and real fix

**Workaround** — add to the **server's** `notes.ini`:

```
DISABLE_REFIND_IN_READENTRIES=1
```

then restart Domino. It disables the refind that miscounts and restores the pre-PJONB7GRUL behavior.

**But this is a stopgap, not the destination.** The issue is fixed in **12.0.2 FP3** and **14.0**; when you can schedule the fixpack or upgrade, do it — don't leave a `DISABLE_*` "turn off an internal behavior" setting living in notes.ini, since it also turns off the behavior the PJONB7GRUL fix was after. Once you're upgraded, remember to remove the line.

## Don't confuse it with the "same setting does nothing" look-alike

Around 12.0.2, categorized-view reads have **more than one** look-alike bug — don't apply the same setting to all of them:

- **Yours** (KB0113007 / SPR# MNIACMGKUV): `&Count` returns the wrong count → `DISABLE_REFIND_IN_READENTRIES=1` **works**, fixed in **12.0.2 FP3 / 14.0**.
- **The other one** (categorized view "empty categories," Nomad Web): [FoCul's testing](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/) (Nomad Web 1.07) states plainly that `DISABLE_REFIND_IN_READENTRIES=1` **"did not work"** — that's a different SPR, fixed in **12.0.2 FP1** (FoCul also references a similar XPages issue, KB0102504).

So the order is: **confirm the symptom (wrong `&Count` count, or empty categories?), confirm your version, then decide whether to add the setting.** If you add it and nothing changes, you've likely hit the other bug — not mistyped the setting. Don't burn time on the wrong one.

## Wrap-up

A categorized view's `?ReadViewEntries&Count` returning the wrong count after 12.0.2 is a regression (SPR# MNIACMGKUV) introduced by the SPR# PJONB7GRUL fix. `DISABLE_REFIND_IN_READENTRIES=1` is a stopgap that turns off the ReadEntries refind; the real fix is 12.0.2 FP3 or 14.0, after which you remove the setting. And the last word: the same-named setting does nothing for the "empty categories" look-alike — **diagnose first, then set the parameter.**
