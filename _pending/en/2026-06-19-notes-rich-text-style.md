---
title: "NotesRichTextStyle: Setting Bold, Font Size, and Colour in Code (and STYLE_NO_CHANGE)"
description: "You're building rich text in code with NotesRichTextItem and want a span to be bold, larger, a different colour — that 'style' is NotesRichTextStyle. This article covers creating it, the Bold / Italic / FontSize / NotesColor properties, applying it with AppendStyle and SetStyle, and one crucial design point: a freshly created style has every property set to STYLE_NO_CHANGE, so you set only the ones you want to change and leave the rest alone."
pubDate: 2026-06-19T07:30:00+08:00
lang: en
slug: notes-rich-text-style
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextStyle class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSTYLE_CLASS.html"
  - title: "NotesRichTextItem class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "FontSize property (NotesRichTextStyle) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FONTSIZE_PROPERTY.html"
relatedJava: ["RichTextStyle"]
relatedSsjs: ["RichTextStyle"]
---

You're appending text into Body span by span with [`NotesRichTextItem`](/domino-news/posts/notes-rich-text-item/), and now you want the heading span to be bold, two sizes bigger, in blue. The question is — when you append text, where does the "style" come from?

The answer is [`NotesRichTextStyle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSTYLE_CLASS.html). Its definition is just "Represents rich text attributes" — a bundle of "how the text should look" (bold, size, colour, font…). You build a style, set the attributes you want, then apply it to the rich text. This piece also clears up a design that's easy to misread at first: **STYLE_NO_CHANGE**.

---

## TL;DR

- Create with `session.CreateRichTextStyle()`
- **Properties** (read-write): `Bold`, `Italic`, `Underline`, `StrikeThrough`, `Effects`, `FontSize`, `NotesColor`, `NotesFont`, `PassThruHTML`
- **Key**: a freshly created style has every property at **`STYLE_NO_CHANGE`** — meaning "leave this alone." You **set only the ones you want to change** and the rest stay untouched
- **Apply** with `NotesRichTextItem.AppendStyle(style)` (text appended afterward uses it) or [`NotesRichTextRange`](/domino-news/posts/notes-rich-text-navigator/)'s `SetStyle(style)` (applies to a selected range)
- `IsDefault` (read-only): whether all attributes are still at the default state
- No methods — it's just a bundle of properties

---

## Create and configure

Create it from `NotesSession`, then set the properties you want:

```lotusscript
Dim session As New NotesSession
Dim style As NotesRichTextStyle
Set style = session.CreateRichTextStyle()
style.Bold = True
style.FontSize = 14
```

Its properties cover the usual text formatting:

| Property | Controls |
|---|---|
| `Bold` / `Italic` / `Underline` / `StrikeThrough` | bold / italic / underline / strikethrough |
| [`FontSize`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FONTSIZE_PROPERTY.html) | size in points |
| `NotesColor` | colour |
| `NotesFont` | font |
| `Effects` | special effects (superscript, subscript, etc.) |
| `PassThruHTML` | whether to mark as pass-through HTML |

It has **no methods** — it's purely a property container.

## The key idea: STYLE_NO_CHANGE

This is the design to grasp first. The docs are explicit: right after `CreateRichTextStyle()`, **every property's value is `STYLE_NO_CHANGE`**.

`STYLE_NO_CHANGE` means "**don't touch this attribute**." So a property like `Bold` is actually **tri-state**, not a plain True/False:

- `True` — make it bold
- `False` — make it not bold
- `STYLE_NO_CHANGE` (default) — don't touch bold, leave it as-is

This is genuinely useful: if you want to "only enlarge the text and not touch any other formatting", you **set only `FontSize`** and leave `Bold`, `NotesColor`, etc. alone — they stay at `STYLE_NO_CHANGE`, so applying the style won't wipe out the existing bold or colour. **Setting only what you want to change is the correct way to use this class.** Conversely, `style.Bold = False` to "also clear bold" is a deliberate action, not "leaving it unset."

`IsDefault` (read-only) tells you whether a style still has all attributes at the default (all `STYLE_NO_CHANGE`).

## Applying it to rich text

A configured style applies two ways:

**1. `AppendStyle` — affects text appended afterward.** Call it on a [`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html); whatever you `AppendText` next carries this style:

```lotusscript
Dim body As NotesRichTextItem
Set body = doc.CreateRichTextItem("Body")
Call body.AppendStyle(style)
Call body.AppendText("This span is bold, size 14")
```

**2. `SetStyle` — applies to a selected range.** Call it on a [`NotesRichTextRange`](/domino-news/posts/notes-rich-text-navigator/) to apply the style to the selected span (this is the official example's approach):

```lotusscript
Set body = doc.GetFirstItem("Body")
Dim rtrange As NotesRichTextRange
Set rtrange = body.CreateRange
Dim rtstyle As NotesRichTextStyle
Set rtstyle = session.CreateRichTextStyle
rtstyle.FontSize = 18
Call rtrange.SetStyle(rtstyle)
Call doc.Save(True, True)
```

Quick rule: **building as you go → `AppendStyle`; restyling an existing span → `SetStyle`.**

## What about Java and SSJS?

| Language | Counterpart | Created via |
|---|---|---|
| Java (`lotus.domino.*`) | `RichTextStyle` | `session.createRichTextStyle()` |
| SSJS / XPages | `RichTextStyle` | `session.createRichTextStyle()` |

Consistent across all three, down to the `STYLE_NO_CHANGE` tri-state idea. Java/SSJS use getters/setters (`setBold(...)` / `setFontSize(...)`), and the constant is `RichTextStyle.STYLE_NO_CHANGE` on the Java side. To build formatted rich text in a back-end Java agent, the "set only what you want to change" principle applies just the same.
