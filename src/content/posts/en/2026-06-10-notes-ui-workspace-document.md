---
title: "NotesUIWorkspace × NotesUIDocument: Front-End Automation in LotusScript"
description: "The classes covered so far — NotesDatabase, NotesDocument — are all back-end. But when you need to read the value a user typed but hasn't saved yet, pop a dialog to ask them something, or flip the open document into edit mode, you reach for the other half: NotesUIWorkspace and NotesUIDocument. This article unpacks the front-end pair, the crucial 'on-screen value vs back-end Document' distinction, FieldGetText/FieldSetText, the Prompt and PickList dialogs, and the rule that trips everyone: UI classes can't run in a background or scheduled agent."
pubDate: 2026-06-10T07:30:00+08:00
lang: en
slug: notes-ui-workspace-document
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesUIWorkspace class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
  - title: "NotesUIDocument class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html"
  - title: "Prompt method (NotesUIWorkspace) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROMPT_METHOD_7966_ABOUT.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-ui-workspace-document.webp"
coverStyle: "ukiyo-e"
---

The classes this site has covered so far — `NotesDatabase`, `NotesDocument`, `NotesView` — are all back-end. They run on the server, in background agents, never seeing (and never needing) the user's screen. But there's a whole category of need they can't touch: the user is typing into a form and hasn't saved yet, and you want to read the value **on their screen right now**; or pop a "Are you sure you want to submit?" dialog when they click a button; or flip the open document straight into edit mode.

All of that happens on the "front end" — inside the Notes Client window. The other half handles it: [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html) (the current workspace window) and `NotesUIDocument` (the document currently open). This article unpacks the front-end pair, and the one concept that costs people hours of debugging if they miss it: **the value on screen is not the same thing as the value the back-end Document has stored.**

---

## TL;DR

- `NotesUIWorkspace` is created with `Dim ws As New NotesUIWorkspace` — it represents "the current workspace window"
- `ws.CurrentDocument` gives you a `NotesUIDocument` — the document the user has **open and focused** right now
- **The core concept**: `NotesUIDocument` is the on-screen document (including unsaved edits); its `.Document` property is the back-end [`NotesDocument`](/domino-news/posts/notes-document/) (the last-saved state)
- Read/write on-screen fields with `FieldGetText` / `FieldSetText`; they don't reach the back end until a save
- Interact with the user via `Prompt` (yes/no / input / list dialogs) and `PickListStrings` (pick people or documents from a list)
- **The rule**: UI classes **cannot run in a background agent, an API-called agent, or an agent triggered by NotesAgent.Run** — only workstation users can

---

## Front-end vs back-end: get this one first

This is the most common trap with the UI classes, so let's nail it up front. Say a user opens a document and changes the `Subject` field from "Quote" to "Quote (revised)" — **but hasn't saved yet**. At that moment:

| What you call | The value you get | Why |
|---|---|---|
| `uidoc.FieldGetText("Subject")` | `Quote (revised)` | reads the **on-screen** current value |
| `uidoc.Document.GetItemValue("Subject")(0)` | `Quote` | reads the **back-end** last-saved value |

The docs define [`NotesUIDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html) as "Represents the document that's currently open in the Notes workspace" — it's the one *on screen*. Its [`Document`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENT_PROPERTY.html) property is described plainly: "The back-end document that corresponds to the currently open document."

So the rule is simple: **unsaved edits live only on the front end.** To read what the user just typed but hasn't saved, use `FieldGetText`; to read what's actually committed to the database, go through `.Document`. Confuse the two and you get the classic "but I changed it and the code still reads the old value" head-scratcher.

## NotesUIWorkspace: getting "the current thing"

`NotesUIWorkspace` is your entry point to the front end — just `New` it:

```lotusscript
Dim ws As New NotesUIWorkspace
Dim uidoc As NotesUIDocument
Set uidoc = ws.CurrentDocument
```

Its three `Current*` properties map to the three things in front of the user:

| Property | Returns | Official wording |
|---|---|---|
| `CurrentDocument` | `NotesUIDocument` | "the document in the window that currently has focus" |
| `CurrentView` | `NotesUIView` | the view currently open |
| `CurrentDatabase` | `NotesUIDatabase` | the database currently open |

⚠️ A focus trap: the docs warn that code in a form **can't assume it has focus** unless it's attached to an action button or similar control. In a composite application or a preview pane, `CurrentDocument` may not be the one you expect. Putting `CurrentDocument` calls in a button event is the safe bet.

## NotesUIDocument: driving the open document

Once you have `uidoc`, the most-used group is the field operations:

| Method | What it does (verbatim) |
|---|---|
| [`FieldGetText(name)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FIELDGETTEXT_METHOD.html) | "returns the contents of a field you specify, as a string" |
| `FieldSetText(name, value)` | "Sets the value of a field... The existing contents... are written over" |
| `FieldContains(name, value)` | checks whether a field contains some text |
| `FieldClear(name)` | clears a field |
| `FieldAppendText(name, value)` | appends text without removing existing content |

The smallest official example just prints the current document's `Subject`:

```lotusscript
Dim workspace As New NotesUIWorkspace
Dim uidoc As NotesUIDocument
Set uidoc = workspace.CurrentDocument
Messagebox( uidoc.FieldGetText( "Subject" ) )
```

Document state is controlled by: `Save()`, `Close()`, `Refresh()` (per the docs, "its computed fields are recalculated"), and `Reload()` (pull back-end changes into the front end). Plus a few common properties: `IsNewDoc` ("a document that hasn't been saved"), `EditMode` (read-write, whether you're in edit mode), and `ModifiedSinceSaved` (are there unsaved changes).

### FieldSetText or Document.ReplaceItemValue?

Both change a field, but the timing differs:

- **`FieldSetText`** changes the on-screen value — the user **sees it immediately**, and it triggers dependent form logic. Use it when "the user has the document open and you want to update what they see, live."
- **`Document.ReplaceItemValue`** (via the back-end [`NotesDocument`](/domino-news/posts/notes-document/)) changes the back-end value without touching the UI. Use it for background processing or programmatic edits that need no visual feedback.

Quick rule: **a person is looking at the screen and needs to see the change → FieldSetText; everything else → the back-end Document.**

## Talking to the user: Prompt and PickList

The most useful thing the front-end classes offer is "ask the user." [`Prompt`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROMPT_METHOD_7966_ABOUT.html) packs several dialog types into one method — the docs: "Displays a dialog box and returns a value based on your actions in the dialog box."

```lotusscript
Dim ws As New NotesUIWorkspace
Dim ans As Variant
ans = ws.Prompt(PROMPT_YESNO, "Confirm", "Submit this quote?")
If ans = 1 Then
    Call uidoc.Save()
End If
```

The first argument's constant picks the dialog type. The common ones:

| Constant | Dialog | Returns |
|---|---|---|
| `PROMPT_OK` | OK only | — |
| `PROMPT_YESNO` | Yes / No | `1` / `0` |
| `PROMPT_YESNOCANCEL` | Yes / No / Cancel | `1` / `0` / `-1` |
| `PROMPT_OKCANCELEDIT` | text input box | the entered string |
| `PROMPT_OKCANCELLIST` | single-select list | the selected string |
| `PROMPT_OKCANCELLISTMULT` | multi-select list | a string array |

The signature is `ws.Prompt(type%, title$, prompt$ [, default] [, values])` — for the list types, pass the choices in the `values` array.

To let the user "pick documents from a view," use `PickListStrings` (docs: "Creates a string array from a list selected by the user") or `PickListCollection` (returns a `NotesDocumentCollection`). Far less work than hand-rolling a selection list.

## The rule you must know: no UI classes in the background

This is the sharpest line between the UI classes and the back-end ones, and the wall newcomers hit most. Verbatim:

> "You cannot use the UI classes in a background agent, an agent called through an API, or an agent called by the NotesAgent Run method. Only workstation users can run scripts that access UI objects."

In other words: **the UI classes are only for a real person at a workstation.** Put a `NotesUIWorkspace` inside a scheduled agent, a web agent, or one triggered by `NotesAgent.Run`, and at best you get Nothing, at worst an error. To modify documents in the background, stick to the back-end `NotesDatabase` / `NotesDocument`.

That restriction is really the flip side of the front-end/back-end split above: the UI classes exist on the premise that "there's a user, and there's a screen." Where there's no screen, they were never the right tool.

## What about Java and SSJS?

As with the GPS trio, the cross-language verdict is **no counterpart**:

| Language | Counterpart | Why |
|---|---|---|
| Java (`lotus.domino.*`) | None | The back-end Java API has no UI classes at all |
| SSJS / XPages | None | XPages is a completely different component model (`view`, document data sources, SSJS events) — not an equivalent of NotesUIDocument |

`NotesUIWorkspace` / `NotesUIDocument` are **LotusScript + Notes Client only** front-end classes. The equivalent interaction on the web runs through XPages' own world — a separate topic for a future article, not the same path as this client front end.
