---
title: "Button, Field, Navigator: the LotusScript Classes With Zero Properties and Zero Methods"
description: "Open the LotusScript help for Button and you expect properties and methods — there are none. Same for Field, same for Navigator. All three are empty on purpose: they exist only as event entry points, the typed Source parameter that tells a front-end event handler which element fired it. A field report on the three classes you never call anything on — what their events are (Click, Entering / Exiting / OnChange), and why the real work always goes through NotesUIDocument."
pubDate: 2026-08-01T07:30:00+08:00
lang: en
slug: button-field-navigator
tags:
  - "LotusScript"
sources:
  - title: "Button (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUTTON_CLASS.html"
  - title: "Field (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FIELD_CLASS.html"
  - title: "Navigator (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAVIGATOR_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/button-field-navigator.webp"
coverStyle: "collage"
---

Open the Designer help for the [`Button`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUTTON_CLASS.html) class expecting a `Caption` or a `Click` method, and you find one flat sentence: "A Button object has no properties or methods." Open [`Field`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FIELD_CLASS.html) — same. Open [`Navigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAVIGATOR_CLASS.html) — same. Three classes in the catalogue with nothing on them at all.

They're empty on purpose. `Button`, `Field`, and `Navigator` aren't objects you manipulate; they're **event entry points** — the typed `Source` parameter of a front-end event handler, there to say "this is the kind of thing that fired me." This is a short field report on the three classes you never call a single method on, and where the actual work goes instead. All three are Notes-client only and none are supported in COM.

---

## Classes as event hooks

Most LotusScript classes are things you do stuff *to* — you read `doc.Items`, call `db.Search`, set `stream.Position`. These three are the opposite. You never construct one and you never call anything on one; the runtime hands you an instance as the `Source` argument when the user clicks a button, enters a field, or picks a navigator hotspot. The class is the *type* of that argument, and its only job is to make the handler's signature specific:

```lotusscript
Sub Click(Source As Button)
    ' Source is a Button — but there's nothing to read off it.
    ' The work happens through the front-end UI classes:
    Dim ws As New NotesUIWorkspace
    Dim uidoc As NotesUIDocument
    Set uidoc = ws.CurrentDocument
    Call uidoc.FieldSetText("Status", "Approved")
    Call uidoc.Save()
End Sub
```

Notice `Source` is never touched. It's typed as `Button` so the event is unambiguous, but because the class has no members, everything real — reading fields, saving, refreshing — routes through [`NotesUIWorkspace`](/domino-news/en/posts/notes-ui-view) and `NotesUIDocument`. That's the pattern for all three: the empty class anchors the event; the UI classes do the work.

## What each one anchors

The value isn't the class, it's the events it lets you write:

- **`Button`** — "an action, action hotspot, or button on a form or document." Its event is `Click` (plus `ObjectExecute`, fired when an OLE2 / Notesflow server activates it). This is the everyday action-button handler.
- **`Field`** — "a field on a form." This is the useful one, because a field has a life cycle: `Entering` fires when the cursor arrives, `Exiting` when it leaves, and `OnChange` when the value changes. That's where classic front-end field behaviour lives — recompute a dependent field on change, format on exit, prime a value on entry.
- **`Navigator`** — "a navigator button, hotspot, or other navigator object." One event, `Click`, for the old imagemap-style navigator objects.

A `Field` handler looks the same as the button one — you get a `Source As Field` you don't touch, and reach for the UI document to read or set values:

```lotusscript
Sub Exiting(Source As Field)
    Dim ws As New NotesUIWorkspace
    Dim uidoc As NotesUIDocument
    Set uidoc = ws.CurrentDocument
    If uidoc.FieldGetText("Amount") <> "" And Not IsNumeric(uidoc.FieldGetText("Amount")) Then
        Messagebox "Amount must be a number.", , "Check"
    End If
End Sub
```

The field's own three events are worth knowing even though the class is empty, because they're the only hook for "do something as the user moves through the form" in the classic client — the place a lot of legacy forms put their interactivity before web validation existed.

## Why they're empty (and why that's fine)

It would be tidier if `Button` had a `Caption` property, but the design element's real state lives in its design (the formula or the label you set in Designer), not in a runtime object. At event time there's nothing on the button worth exposing that you can't get more directly from the document or workspace. So rather than a half-useful object, Notes gives you an empty one whose only purpose is to type the handler. Once you see that, the "no properties or methods" line stops being a disappointment and becomes the whole point: these aren't objects, they're the names of doorways into UI code.

## What about Java and SSJS?

There's no counterpart, and the reason is the same as for the other front-end classes ([`NotesUIView`](/domino-news/en/posts/notes-ui-view), `NotesUIDatabase`): the Domino Java API is back-end only, and SSJS in XPages has its own component-and-event model (a button is an `xp:button` with a server-side action, a field is an `xp:inputText` with validators). The *idea* — an event fired by a UI element — is universal, but these particular empty classes are a classic-client artifact. Porting the behaviour means rebuilding it in the target stack's event model, not looking for a `Button` class that isn't there.
