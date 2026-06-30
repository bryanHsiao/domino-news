---
title: "NotesRichTextParagraphStyle, NotesRichTextTab & NotesColorObject: Laying Out Rich Text in Code"
description: "Building rich text from LotusScript isn't just appending strings — margins, alignment, line spacing, tab stops, and colour are separate objects you stamp on before the text. This article covers NotesRichTextParagraphStyle (the layout), NotesRichTextTab (tab stops, born read-only from the style), and NotesColorObject (colour maths), the twips measurement system, the append-style-before-text rule, and the non-obvious bit: NotesColorObject doesn't colour text directly — you derive a Domino colour value from it."
pubDate: 2026-07-01T07:30:00+08:00
lang: en
slug: notes-rich-text-paragraph-style
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextParagraphStyle class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS_3756.html"
  - title: "NotesRichTextTab class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTTAB_CLASS.html"
  - title: "NotesColorObject class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCOLOROBJECT_CLASS.html"
relatedJava: ["RichTextParagraphStyle", "RichTextTab", "ColorObject"]
relatedSsjs: ["RichTextParagraphStyle", "RichTextTab", "ColorObject"]
---

You're generating a report document from an agent — a title centred, body indented, figures lined up on a decimal tab, a heading in your brand blue. In Designer you'd do all this by clicking in the editor. From LotusScript, formatting isn't part of `AppendText` — it lives in separate style objects you apply *before* the text they govern.

Three of those objects work together: [`NotesRichTextParagraphStyle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS_3756.html) holds paragraph layout, [`NotesRichTextTab`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTTAB_CLASS.html) represents one tab stop inside it, and `NotesColorObject` does the colour arithmetic. This piece walks through all three and the one gotcha that surprises everyone: the colour object doesn't actually colour your text.

---

## TL;DR

- Create a paragraph style with `session.CreateRichTextParagraphStyle`, set alignment / margins / spacing / tabs, then `Call rtitem.AppendParagraphStyle(style)` **before** appending the text it should govern.
- Margins and tab positions are in **twips** — `RULER_ONE_INCH` = 1440, `RULER_ONE_CENTIMETER` = 567. The docs put it plainly: "one centimeter is 567 twips and one inch is 1440 twips."
- `Alignment` uses constants `ALIGN_LEFT` (0) / `ALIGN_RIGHT` (1) / `ALIGN_FULL` (2) / `ALIGN_CENTER` (3) / `ALIGN_NOWRAP` (4).
- Tabs are set on the paragraph style (`SetTab`, `SetTabs`, `ClearAllTabs`); a `NotesRichTextTab` is **read-only** — `Position` and `Type` (`TAB_LEFT`/`TAB_RIGHT`/`TAB_DECIMAL`/`TAB_CENTER`).
- `NotesColorObject` (`session.CreateColorObject`) converts between the Domino palette value (`NotesColor`, 0–240), RGB (0–255) and HSL (0–240). `SetRGB` / `SetHSL` snap to the **closest** Domino colour and return it.
- **The catch:** a `NotesColorObject` does *not* attach to rich text. You use it to derive a Domino colour value, then assign that to `NotesRichTextStyle.NotesColor` (the character style). Three different objects: paragraph style, character style, colour object.

## The paragraph style

`NotesRichTextParagraphStyle` — "Represents rich text paragraph attributes" — is created from the session and carries the layout for a paragraph:

```lotusscript
Dim session As New NotesSession
Dim rtps As NotesRichTextParagraphStyle
Set rtps = session.CreateRichTextParagraphStyle
rtps.Alignment = ALIGN_CENTER
rtps.LeftMargin = RULER_ONE_INCH          ' twips
rtps.RightMargin = RULER_ONE_INCH
rtps.SpacingAbove = SPACING_DOUBLE
rtps.SpacingBelow = SPACING_ONE_POINT_50
```

The properties you'll use most: `Alignment`, `LeftMargin` / `RightMargin` / `FirstLineLeftMargin`, `SpacingAbove` / `SpacingBelow` / `InterLineSpacing` (with the `SPACING_SINGLE` / `SPACING_ONE_POINT_50` / `SPACING_DOUBLE` constants), and `Pagination` (`PAGINATE_BEFORE`, `PAGINATE_KEEP_WITH_NEXT`, `PAGINATE_KEEP_TOGETHER`) for controlling page breaks. Margins are twips, so `RULER_ONE_INCH * 0.75` is three-quarters of an inch.

## Tabs

You don't construct a `NotesRichTextTab`. You set tabs on the paragraph style and read them back through its read-only `Tabs` array:

```lotusscript
' Three decimal tabs, first at 1 inch, 1 cm apart — figures align on the decimal point
Call rtps.SetTabs(3, RULER_ONE_INCH, RULER_ONE_CENTIMETER, TAB_DECIMAL)

' Or one tab at a time
Call rtps.SetTab(RULER_ONE_INCH * 2, TAB_RIGHT)

' Clear them all
' Call rtps.ClearAllTabs
```

Each resulting `NotesRichTextTab` exposes `Position` (twips) and `Type` (one of `TAB_LEFT` = 0, `TAB_RIGHT` = 1, `TAB_DECIMAL` = 2, `TAB_CENTER` = 3), both read-only — to change a tab you re-set the style's tabs.

## Colour — and the object that doesn't colour anything

[`NotesColorObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCOLOROBJECT_CLASS.html) ("Represents a color") is colour *maths*. It holds a colour in three representations at once and converts between them:

```lotusscript
Dim color As NotesColorObject
Set color = session.CreateColorObject
Dim dominoColor As Integer
dominoColor = color.SetRGB(0, 102, 204)   ' returns the closest Domino palette value
```

Its read-only `Red` / `Green` / `Blue` (0–255), `Hue` / `Saturation` / `Luminance` (0–240), and read-write `NotesColor` (the Domino palette value, 0–240) stay in sync — per the docs, "Setting NotesColor sets the RGB and HSL properties to values that correspond to the Domino color value." Because the palette is only 0–240, `SetRGB` / `SetHSL` snap an arbitrary colour to the **closest** Domino colour, which is the value they return.

Here's the trap: a `NotesColorObject` never attaches to a rich text item. Text colour is carried by `NotesRichTextStyle` (the *character* style). The colour object's job is to give you the Domino value to assign there:

```lotusscript
Dim richStyle As NotesRichTextStyle
Set richStyle = session.CreateRichTextStyle
richStyle.NotesColor = dominoColor        ' from SetRGB above; or a constant like COLOR_RED
richStyle.Bold = True
```

So three objects, three jobs: the **paragraph style** lays out the block, the **character style** carries colour/bold/font, and the **colour object** computes a palette value from arbitrary RGB. The colour object is only worth reaching for when you need a colour outside the named `COLOR_*` constants.

## Putting it together

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase
  Dim doc As New NotesDocument(db)
  doc.Form = "Memo"

  ' Paragraph layout
  Dim rtps As NotesRichTextParagraphStyle
  Set rtps = session.CreateRichTextParagraphStyle
  rtps.Alignment = ALIGN_CENTER
  Call rtps.SetTabs(3, RULER_ONE_INCH, RULER_ONE_CENTIMETER, TAB_DECIMAL)

  ' Colour -> character style
  Dim color As NotesColorObject
  Set color = session.CreateColorObject
  Dim richStyle As NotesRichTextStyle
  Set richStyle = session.CreateRichTextStyle
  richStyle.NotesColor = color.SetRGB(0, 102, 204)
  richStyle.Bold = True

  ' Build the item: styles BEFORE text
  Dim rt As New NotesRichTextItem(doc, "Body")
  Call rt.AppendParagraphStyle(rtps)
  Call rt.AppendStyle(richStyle)
  Call rt.AppendText("Q1 Report")

  Call doc.Save(True, False)
End Sub
```

*(Assembled from the official "working with text" examples; the combination of margins, tabs and a colour-object-derived colour in one routine is adapted.)*

**The order rule is the #1 pitfall:** append the paragraph style and the character style *before* the text they apply to. Stamp them after and they govern nothing.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesRichTextParagraphStyle` | `RichTextParagraphStyle` | `RichTextParagraphStyle` |
| `NotesRichTextTab` | `RichTextTab` | `RichTextTab` |
| `NotesColorObject` | `ColorObject` | `ColorObject` |

The Java and SSJS surfaces mirror these — `session.createRichTextParagraphStyle()`, `session.createColorObject()`, the same twips and constants. The same "style before text" and "colour object feeds the character style" rules carry over unchanged.
