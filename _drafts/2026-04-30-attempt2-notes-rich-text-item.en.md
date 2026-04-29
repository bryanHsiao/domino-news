---
title: "Mastering NotesRichTextItem: Handling Rich Text in LotusScript"
description: "This tutorial provides a comprehensive guide on using the NotesRichTextItem class in LotusScript to create and manipulate rich text content, including adding text, formatting, and embedding objects, with practical examples."
pubDate: "2026-04-30T07:25:00+08:00"
lang: "en"
slug: "notes-rich-text-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextItem class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesRichTextItem class (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/Java/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "Working with rich text items in LotusScript"
    url: "https://www.ibm.com/docs/en/notes/9.0.1?topic=ssw-9-0-1-composite-applications-dev-working-with-rich-text-items-in-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-rich-text-item
-->

In HCL Domino application development, rich text is a versatile data type that allows developers to include formatted text, tables, images, and other multimedia content within documents. LotusScript offers the NotesRichTextItem class, specifically designed for creating and manipulating rich text items.

## What is NotesRichTextItem?

NotesRichTextItem is a class in LotusScript that represents a rich text field within a Notes document. Through this class, developers can programmatically add, modify, and format rich text content. This includes inserting paragraphs, tables, images, and even embedding other objects.

## Creating and Initializing NotesRichTextItem

To create a new rich text item in LotusScript, first obtain the target document and then use the `CreateRichTextItem` method to create the rich text field.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = doc.CreateRichTextItem("Body")
```

In this code, `"Body"` is the name of the rich text field. If a rich text field with the same name already exists in the document, the `CreateRichTextItem` method will return that existing field.

## Adding Text and Formatting

With NotesRichTextItem, you can add plain text and apply various formatting options. For example, to add paragraphs and set font styles:

```lotusscript
Call rtItem.AppendText("This is a heading")
Call rtItem.AddNewLine(1)
Call rtItem.AppendText("This is the body content.")
```

To apply formatting, use the `AppendStyle` method in conjunction with NotesRichTextStyle:

```lotusscript
Dim style As New NotesRichTextStyle
style.Bold = True
style.FontSize = 12
Call rtItem.AppendStyle(style)
Call rtItem.AppendText("Bold text")
```

## Inserting Tables

NotesRichTextItem allows the insertion of tables using the `AppendTable` method:

```lotusscript
Dim table As NotesRichTextTable
Set table = rtItem.AppendTable(3, 2)
```

This inserts a table with 3 rows and 2 columns. You can use the `BeginInsert` and `EndInsert` methods to populate the table content.

## Embedding Objects

You can also embed objects such as file attachments or OLE objects within the rich text. For example, to embed a file:

```lotusscript
Call rtItem.EmbedObject(EMBED_ATTACHMENT, "", "C:\path\to\file.txt")
```

## Saving and Closing the Document

After editing the rich text content, remember to save and close the document:

```lotusscript
Call doc.Save(True, False)
```

## Conclusion

By utilizing the NotesRichTextItem class, developers can flexibly create and manipulate rich text content in LotusScript to meet various application requirements. For more detailed information, refer to the [official NotesRichTextItem class documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html).
