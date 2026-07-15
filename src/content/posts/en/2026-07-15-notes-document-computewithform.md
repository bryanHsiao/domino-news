---
title: "NotesDocument.ComputeWithForm: Running Form Validation from Code — and Why It Won't Stop Your Save"
description: "ComputeWithForm runs a form's default-value, input-translation, and input-validation formulas against a back-end document — the programmatic equivalent of a user saving on the form. But three things surprise people: it returns a pass/fail flag it never enforces (it happily lets you Save an invalid document), input translation can rewrite your field values, and it silently falls back to the default form unless you pin the Form item."
pubDate: 2026-07-15T07:30:00+08:00
lang: en
slug: notes-document-computewithform
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocument.ComputeWithForm method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPUTEWITHFORM_METHOD.html"
  - title: "Example: ComputeWithForm method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_COMPUTEWITHFORM_METHOD.html"
  - title: "NotesDocument class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

When a user fills in a form and saves, Domino runs the form's formulas: default values fill in, input-translation formulas tidy the data, input-validation formulas reject bad input. An agent that creates documents in the back-end skips all of that — unless you call `ComputeWithForm`. It's how you get the same validation from code. But it behaves differently enough from a UI save that leaning on it naively will let invalid data straight into your database.

---

## TL;DR

- [`ComputeWithForm`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPUTEWITHFORM_METHOD.html) "validates a document by executing the default value, translation, and validation formulas, if any are defined in the document form."
- Signature: `flag = doc.ComputeWithForm(doDataTypes, raiseError)`. **The first parameter is ignored** in 14.5.1 — pass `False`. `raiseError` chooses how failure surfaces: `True` raises a trappable error, `False` returns `False`.
- **The big gotcha: it never blocks Save.** "Unlike the Notes user interface, this method allows saving documents even if ComputeWithForm returns False or raises an error." You must gate the `Save` on the return flag yourself.
- **Input translation can rewrite your values.** After the call, re-read any field a translation formula might have changed (`@Trim`, `@ProperCase`, etc.).
- **Pin the form.** It resolves the form from the stored form → the `Form` item → the database default form. On a fresh back-end document with no `Form` item it silently falls back to the default form, so set `doc.Form` explicitly.

## What it runs

`ComputeWithForm` executes three kinds of form formula against the back-end document, exactly as a save on that form would:

- **Default value** formulas — fill in fields the document doesn't have.
- **Input translation** formulas — transform field values (trim whitespace, upper-case, format numbers).
- **Input validation** formulas — check the values and, via `@Failure`, reject them.

What it does *not* do is reproduce a full UI/web save: WebQuerySave agents, `QuerySave` events, and other UI-side effects are outside its scope. It's form-formula validation, not a simulation of a user clicking Save.

## The signature, and the ignored parameter

```lotusscript
flag = doc.ComputeWithForm(doDataTypes, raiseError)
```

- `doDataTypes` — **the method ignores this parameter**; the docs say "Specify either True or False." Older tutorials describe it as a data-type check; in 14.5.1 it does nothing. Pass `False`.
- `raiseError` — `True` raises a runtime error on validation failure (trap it with `On Error`); `False` returns `False` instead. Most code uses `False` and branches on the result.
- Return — `True` means "no errors on the document," `False` means "there are errors."

## The gotcha that lets bad data through

This is the line to tattoo on your arm, straight from the method docs: "Unlike the Notes user interface, this method allows saving documents even if ComputeWithForm returns False or raises an error."

In the UI, failed validation *stops* the save. `ComputeWithForm` does not. It computes the pass/fail flag and hands it to you — and then does nothing to enforce it. If you call `ComputeWithForm` and then unconditionally `Save`, you've validated nothing; the invalid document goes in anyway. The validation only means something if you gate the save on it:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Notification"          ' pin the form — don't rely on the default
doc.Topic = "Large bodies of water"

If doc.ComputeWithForm(False, False) Then
    Call doc.Save(True, True)       ' only save when validation passed
Else
    Print "Validation failed — not saving"
End If
```

This is the [official example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_COMPUTEWITHFORM_METHOD.html), and it's built to fail on purpose: the "Notification" form requires a `Subject`, but only `Topic` was set, so `ComputeWithForm` returns `False` and the guard skips the save. Remove the guard and the incomplete document saves regardless. To take the success path, set the required field (`doc.Subject = "..."`) before the call.

## The other two surprises

**Input translation mutates your data.** Translation formulas run *before* validation and can change field values in place — a `@Trim` strips your spaces, a `@ProperCase` re-cases a name. If downstream code depends on exactly what you wrote, re-read the field after `ComputeWithForm`; it may not be what you set.

**Form resolution falls back silently.** The method picks the form in this order: the form stored in the document, then the document's `Form` item, then the database's default form. A brand-new back-end document has no stored form and — if you didn't set one — no `Form` item, so it validates against the *default* form, which may have entirely different fields and rules. Always set `doc.Form` on documents you build in code.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.ComputeWithForm(doDataTypes, raiseError)` | `doc.computeWithForm(dodatatypes, raiseerror)` | `document.computeWithForm(...)` |

The Java [`Document.computeWithForm(boolean, boolean)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) has the same two-Boolean shape and identical semantics — the first argument ignored, the second toggling exception-versus-return-false (Java throws a `NotesException` when it's `True`). SSJS calls the same back-end method. And the "it doesn't block save" rule holds in every language: the flag is advisory, and enforcing it is your job.
