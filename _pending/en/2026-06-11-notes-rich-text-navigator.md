---
title: "NotesRichTextNavigator × NotesRichTextRange: Traversing and Rewriting Rich Text in Code"
description: "You have 500 documents whose Body field needs every doclink counted, or one string replaced throughout — and just getting the field with NotesRichTextItem isn't enough. NotesRichTextNavigator walks rich text one element type at a time; NotesRichTextRange selects a span and then styles or removes it. This article unpacks the two Release-6 companions, the element-type constants, FindAndReplace's options and return value, and the rule that costs people hours: every navigation marker is invalidated after a FindAndReplace."
pubDate: 2026-06-11T07:30:00+08:00
lang: en
slug: notes-rich-text-navigator
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTNAVIGATOR_CLASS.html"
  - title: "NotesRichTextRange class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTRANGE_CLASS.html"
  - title: "FindAndReplace method (NotesRichTextRange) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FINDANDREPLACE_METHOD_RTRANGE.html"
relatedJava: ["RichTextNavigator", "RichTextRange"]
relatedSsjs: ["RichTextNavigator", "RichTextRange"]
---

Here's the task: across 500 documents, replace the old company name "Acme" with "AcmeCorp" everywhere in the `Body` field, and while you're at it, count how many doclinks each document has. The earlier [`NotesRichTextItem`](/domino-news/posts/notes-rich-text-item/) piece gets you the whole Body field and lets you `AppendText`, but it hands you the field as one block — it can't say "move to the next table" or "select this span and swap the text."

For that kind of **fine-grained traversal and rewriting**, Domino added two companions back in Release 6: [`NotesRichTextNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTNAVIGATOR_CLASS.html) (move a "cursor" through rich text) and [`NotesRichTextRange`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTRANGE_CLASS.html) (select a span and then act on it). This article shows how they work together — and the one `FindAndReplace` trap that bites if nobody warns you.

---

## TL;DR

- Both come from a [`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html): `body.CreateNavigator()`, `body.CreateRange()`
- **Navigator = a cursor**: walk with `FindFirstElement` / `FindNextElement` plus element-type constants (`RTELEM_TYPE_TABLE`, `RTELEM_TYPE_DOCLINK`…)
- **Limit**: a navigator only moves *within one type* — it can find "the next table", but there's no "next element regardless of type"
- **Range = a selection**: bound it with `SetBegin` / `SetEnd` (using a navigator), then `SetStyle` to format, `Remove` to delete, or read `TextRun` / `TextParagraph`
- **`FindAndReplace(target, replacement, options)`** returns the number of replacements; options combine: `RT_FIND_CASEINSENSITIVE`, `RT_REPL_ALL`, etc.
- **The rule**: after a `FindAndReplace`, **every navigation marker in that rich text item (ranges included) is invalidated** — rebuild before continuing

---

## Two tools, both from NotesRichTextItem

Neither class is created with `New` — both grow out of the rich text field you already have:

```lotusscript
Dim body As NotesRichTextItem
Set body = doc.GetFirstItem("Body")

Dim rtnav As NotesRichTextNavigator
Set rtnav = body.CreateNavigator()

Dim rtrange As NotesRichTextRange
Set rtrange = body.CreateRange()
```

The division of labour is clean: **the navigator decides "where to move to"; the range decides "what to do with the selected span."** They're usually used together — the navigator locates a spot, then hands its position to the range as a boundary.

## NotesRichTextNavigator: walk by element type

The official definition: "Represents a means of navigation in a rich text item." It keeps a "current position" that you move with the Find family:

| Method | What it does |
|---|---|
| `FindFirstElement(type)` | move to the first element of a type, returns `Boolean` |
| `FindNextElement(type)` | move to the next element of the same type |
| `FindNthElement(type, n)` | move to the nth one |
| `FindFirstString(s)` / `FindNextString(s)` | move to a string occurrence |
| `GetElement()` | get the element at the current position |

`type` uses the `RTELEM_TYPE_*` constants, covering the various "things" in rich text:

| Constant | Element |
|---|---|
| `RTELEM_TYPE_TEXTPARAGRAPH` | text paragraph |
| `RTELEM_TYPE_TEXTRUN` | text run (a same-style span) |
| `RTELEM_TYPE_DOCLINK` | doclink |
| `RTELEM_TYPE_FILEATTACHMENT` | file attachment |
| `RTELEM_TYPE_OLE` | OLE object |
| `RTELEM_TYPE_SECTION` | collapsible section |
| `RTELEM_TYPE_TABLE` | table |
| `RTELEM_TYPE_TABLECELL` | table cell |

⚠️ **The key limitation**, verbatim: "Navigation is within elements of the same type... You cannot find or get an element regardless of type." A navigator only moves *within one type*. There's no "give me the next element, whatever it is." To walk a Body you have to decide "which type am I after this pass" and scan one type at a time.

The canonical traversal is a loop opened by `FindFirstElement` and closed by `FindNextElement`:

```lotusscript
If rtnav.FindFirstElement(RTELEM_TYPE_DOCLINK) Then
    Dim n As Integer
    Do
        n = n + 1
    Loop While rtnav.FindNextElement(RTELEM_TYPE_DOCLINK)
End If
' n = the number of doclinks in this document's Body
```

## NotesRichTextRange: select a span, then act on it

The official definition: "Represents a range of elements in a rich text item." The default range covers the whole item. Its read-only properties let you "see" what the span is:

| Property | Holds |
|---|---|
| `Type` | the type of the first element in the range |
| `TextRun` | text from the start to the next newline or style change |
| `TextParagraph` | text from the start to the next paragraph |
| `Style` | the style of the first text run |
| `Navigator` | a navigator confined to the range |

The methods let you "act": `SetBegin(nav)` / `SetEnd(nav)` to bound the span with a navigator, `SetStyle(style)` to apply a style across the range, `Remove()` to delete its content, `Reset()` to restore defaults, `Clone()` to copy.

Bumping a selected span's font size is straight from the official example:

```lotusscript
Set body = doc.GetFirstItem("Body")
Set rtrange = body.CreateRange
Set rtstyle = session.CreateRichTextStyle
rtstyle.FontSize = 18
Call rtrange.SetStyle(rtstyle)
Call doc.Save(True, True)
```

## FindAndReplace: find-and-swap across rich text

[`FindAndReplace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FINDANDREPLACE_METHOD_RTRANGE.html) is `NotesRichTextRange`'s most useful method. The signature:

```lotusscript
count& = rtrange.FindAndReplace(target$, replacement$, [options&])
```

The return value is the **number of replacements actually made** (`Long`). `options` combine via addition or `Or`:

| Constant | Value | Meaning |
|---|---|---|
| `RT_FIND_CASEINSENSITIVE` | 1 | case-insensitive (default is case-sensitive) |
| `RT_FIND_PITCHINSENSITIVE` | 2 | pitch-insensitive |
| `RT_FIND_ACCENTINSENSITIVE` | 4 | accent-insensitive |
| `RT_REPL_PRESERVECASE` | 8 | preserve case in the replacement |
| `RT_REPL_ALL` | 16 | replace all occurrences (default replaces only the next one) |

Replacing every "Acme" with "AcmeCorp" in the Body, case-insensitive:

```lotusscript
Dim rtrange As NotesRichTextRange
Set rtrange = body.CreateRange
Dim cnt As Long
cnt = rtrange.FindAndReplace("Acme", "AcmeCorp", _
    RT_REPL_ALL Or RT_FIND_CASEINSENSITIVE)
If cnt > 0 Then Call doc.Save(True, True)
```

⚠️ **And here's the trap you must remember**, verbatim: "All navigation markers in the RTitem, including ranges, are invalidated after a FindAndReplace operation." Once `FindAndReplace` runs, **every navigator and range on that rich text item becomes invalid**. If you need to keep traversing or select another span, you must build a fresh range with `SetBegin` / `SetEnd` — you can't reuse the old one. A lot of "everything goes weird after the replace" bugs trace back to exactly this.

## What about Java and SSJS?

This pair exists in all three languages, with consistent names:

| Language | Counterpart | Created via |
|---|---|---|
| Java (`lotus.domino.*`) | `RichTextNavigator` / `RichTextRange` | `rtitem.createNavigator()` / `createRange()` |
| SSJS / XPages | `RichTextNavigator` / `RichTextRange` | same |

The concepts are identical: navigator to traverse, range to select and rewrite, the same element-type constants. The only differences are that Java / SSJS use method calls (`findFirstElement(...)`) rather than property syntax, and the constants take the `RichTextItem.RTELEM_TYPE_*` form on the Java side. When you write a back-end Java batch over rich text, the flow in this article carries straight over.
