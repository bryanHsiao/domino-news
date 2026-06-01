---
title: "Applying Rich Text Styles with NotesRichTextStyle"
description: "This tutorial demonstrates how to use the NotesRichTextStyle class in LotusScript to set rich text styles in HCL Domino documents, including font, size, and color."
pubDate: "2026-06-02T07:36:56+08:00"
lang: "en"
slug: "notes-rich-text-style"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextStyle (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESRICHTEXTSTYLE_CLASS.html"
  - title: "NotesRichTextItem (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesRichTextParagraphStyle (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-rich-text-style
-->

In HCL Domino development, it's common to insert rich text content into documents and apply specific style settings. LotusScript provides the NotesRichTextStyle class, enabling developers to programmatically set rich text style attributes such as font, size, and color.

## Overview of NotesRichTextStyle Class

The NotesRichTextStyle class represents the style attributes of rich text and includes the following key properties:

- **Bold**: Boolean indicating whether the text is bold.
- **Italic**: Boolean indicating whether the text is italicized.
- **Underline**: Boolean indicating whether the text is underlined.
- **FontSize**: Integer specifying the font size.
- **NotesFont**: Integer specifying the font type.
- **NotesColor**: Integer specifying the text color.

To create a new NotesRichTextStyle object, use the CreateRichTextStyle method of the NotesSession class.

## Example Usage

The following example demonstrates how to use NotesRichTextStyle in LotusScript to set rich text styles:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim rtStyle As NotesRichTextStyle

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = doc.CreateRichTextItem("Body")
Set rtStyle = session.CreateRichTextStyle

' Set style properties
rtStyle.Bold = True
rtStyle.Italic = True
rtStyle.Underline = False
rtStyle.FontSize = 12
rtStyle.NotesFont = FONT_COURIER
rtStyle.NotesColor = COLOR_RED

' Apply style to rich text item
Call rtItem.AppendStyle(rtStyle)
Call rtItem.AppendText("This is a styled text.")

' Save the document
Call doc.Save(True, False)
```

In this example:

1. A new NotesRichTextStyle object is created.
2. Style properties such as bold, italic, font size, font type, and color are set.
3. The style is applied to a rich text item, and text content is inserted.
4. The document containing the rich text content is saved.

## Considerations

- Ensure that a NotesRichTextItem object is created and initialized before applying styles.
- Set the properties of NotesRichTextStyle according to your requirements; unset properties will retain their default values.
- After applying a style, subsequent inserted text will inherit that style until a new style is applied or the style is reset.

By utilizing the NotesRichTextStyle class, developers can programmatically control the styling of rich text content in HCL Domino applications, enhancing document readability and aesthetics.
