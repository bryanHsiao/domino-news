---
title: "NotesView AutoUpdate=False: Why Modifying Documents in a View Loop Slows Down and Throws 'Entry not found in index'"
description: "An agent loops a view, tweaks each document, and gets slower and slower — sometimes even throwing 'Entry not found in index.' The culprit: NotesView refreshes itself by default, so when your loop modifies the very documents the view indexes, the view keeps re-sorting under your feet — killing performance and invalidating your navigation position. The fix is one line before the loop: view.AutoUpdate = False. This piece explains the mechanism, the correct 'grab the next handle before modifying' pattern, and three side effects to know (snapshot, current-code-only, must Refresh to see updates)."
pubDate: 2026-09-15T07:30:00+08:00
lang: en
slug: notes-view-autoupdate
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Performance"
sources:
  - title: "AutoUpdate property (NotesView) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html"
  - title: "Refresh method (NotesView) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_REFRESH_METHOD_VIEW.html"
  - title: "NotesView class (LotusScript) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESVIEW_CLASS.html"
relatedJava: ["View"]
relatedSsjs: ["view"]
---

You write an agent that walks a view with `GetFirstDocument` / `GetNextDocument`, changing a field on each document and saving. With a few documents it's fine; at scale it gets **slower and slower**, and every so often throws a baffling error: **"Entry not found in index."** Your logic looks correct — so what gives?

The problem isn't your loop. It's that the **view keeps re-sorting itself under your feet**. Here's why, and the one-line fix.

## TL;DR

- **`NotesView` defaults to `AutoUpdate = True`**: the view refreshes itself automatically — the [docs](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html) say "True (default) indicates that the view is automatically refreshed."
- **Modifying documents in the loop = modifying the view itself**: if the fields you change affect this view (additions, deletions, or a change to a field the selection formula uses), each change can trigger a refresh — **wrecking performance and possibly invalidating your position** (that "Entry not found in index").
- **The fix is one line**: set `view.AutoUpdate = False` *before* the loop to suppress auto-refresh; iteration becomes stable and fast.
- **Three side effects to know**: the view is now a **snapshot** and won't reflect changes made during the loop; it only governs **your own code's** refreshes (`updall` still updates the index); and you must `Refresh` to see updates.

## Why it slows down and throws errors

The [official AutoUpdate page](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html) is blunt:

> "It is best to avoid automatically updating the view by explicitly setting this property to False especially if the view is a base for navigators or entry collections. **Automatic updates degrade performance and may invalidate entries in child objects.**"

Applied to your case: by default the view refreshes whenever a navigation method touches an updated document. And your loop is **modifying the very documents this view indexes** — change a selection or sort field and the document's position in the view shifts (it may even get selected in or filtered out). So every save can prompt another re-sort; with many documents that's compounding waste, and it gets **slower and slower**.

Worse is the navigation position: the `doc` you hold was found at its index position *before* the refresh; once the view re-sorts, `GetNextDocument(doc)` may no longer find its place in the new index — which is exactly where **"Entry not found in index"** comes from. The docs single this out as especially likely when the view is a base for a navigator or entry collection.

## The right way: turn off auto-refresh + grab the next before modifying

Two moves: set `AutoUpdate = False` before the loop; and inside the loop, **get the next handle first, then modify the current one** (so even if your change knocks the current document out of the view, you already hold the next).

```lotusscript
Dim view As NotesView
Set view = db.GetView("MyView")
view.AutoUpdate = False              ' <- turn off auto-refresh before the loop (the key line)

Dim doc As NotesDocument
Dim nextDoc As NotesDocument
Set doc = view.GetFirstDocument
While Not doc Is Nothing
    Set nextDoc = view.GetNextDocument(doc)   ' grab the next handle first
    Call doc.ReplaceItemValue("Status", "Done")
    Call doc.Save(True, False)                 ' then modify the current one
    Set doc = nextDoc
Wend
```

With `AutoUpdate = False`, the view object becomes a **snapshot as of the moment you enter the loop**: it won't keep re-sorting because of your saves, so iteration is stable and much faster. This is precisely what the docs recommend "especially if the view is a base for navigators or entry collections."

## Three side effects to know

1. **It's a snapshot — it won't show changes made during the loop.** After you turn off auto-refresh, documents added or changed during the loop aren't reflected in this view object — usually exactly what you want (stable iteration), but if you *need* to see updates, the docs are explicit: "If this property is False, **you must call Refresh** to navigate to an update." — call [`view.Refresh`](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_REFRESH_METHOD_VIEW.html) at the right moment.
2. **It only governs *your own code's* refreshes.** The [docs](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html): "This property only addresses refreshes by the currently running code. Other code, such as running the `Updall` task against the database, will update the view index... regardless of the value of this property." — you've only suppressed refreshes triggered by your own code; `updall` or other code on the server still updates the index, unaffected.
3. **Changing selection fields still needs care.** Even with auto-refresh off, if you heavily change selection/sort fields during iteration, be clear you're iterating a snapshot; when you need "re-run against a clean view after the changes," finish with a `Refresh` or `GetView` a fresh one.

## Wrap-up

A `GetNextDocument` loop that modifies documents and gets slower — or throws "Entry not found in index" — is almost always the same cause: **the view auto-refreshes by default, and you're modifying the documents it indexes.** One line before the loop, `view.AutoUpdate = False`, plus "grab the next handle before modifying the current," makes it stable and fast — just remember it's now a snapshot and you `Refresh` to see updates. For more on walking views, see [NotesViewNavigator](/domino-news/en/posts/notes-view-navigator).
