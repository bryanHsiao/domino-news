---
title: "Merging NotesRichTextItem Using AppendRTItem in LotusScript"
description: "This article explains how to use the AppendRTItem method in LotusScript to append the contents of one NotesRichTextItem to another, with practical examples and considerations."
pubDate: "2026-07-20T08:00:38+08:00"
lang: "en"
slug: "notes-rich-text-item-appendrtitem"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "AppendRTItem (NotesRichTextItem - LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_APPENDRTITEM_METHOD.html"
  - title: "AppendText (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_APPENDTEXT_METHOD.html"
  - title: "AppendStyle (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_APPENDSTYLE_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-rich-text-item-appendrtitem
-->

In HCL Domino's LotusScript, the `NotesRichTextItem` class offers various methods to manipulate rich text fields. Among these, the `AppendRTItem` method allows appending the contents of one rich text item to the end of another.

## Overview of AppendRTItem Method

The syntax for the `AppendRTItem` method is as follows:

```lotusscript
Call notesRichTextItem.AppendRTItem(notesRichTextItem2)
```

- `notesRichTextItem2`: The rich text item to be appended.

This method inserts the contents of `notesRichTextItem2` at the end of `notesRichTextItem`.

## Usage Example

The following example demonstrates how to use the `AppendRTItem` method to append the contents of a rich text field from one document to another:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc1 As NotesDocument
Dim doc2 As NotesDocument
Dim rtItem1 As NotesRichTextItem
Dim rtItem2 As NotesRichTextItem

Set db = session.CurrentDatabase
Set doc1 = db.GetDocumentByUNID("UNID1")
Set doc2 = db.GetDocumentByUNID("UNID2")

Set rtItem1 = doc1.GetFirstItem("Body")
Set rtItem2 = doc2.GetFirstItem("Body")

Call rtItem1.AppendRTItem(rtItem2)
Call doc1.Save(True, False)
```

In this example, the `Body` rich text field content of `doc2` is appended to the end of the `Body` rich text field of `doc1`, and `doc1` is saved.

## Considerations

- **Insertion Point**: The `AppendRTItem` method appends content to the end of the target rich text item.

- **Compatibility with Other Methods**: After setting an insertion point with the `BeginInsert` method, you cannot call the `AppendRTItem` method.

- **UI Update**: In an open document in edit mode, changes made to rich text will not appear on screen immediately. You must close and reopen the document to see the changes.

For more detailed information, refer to the [official documentation on the AppendRTItem method](https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_APPENDRTITEM_METHOD.html).

## Related Methods

- **AppendText**: Inserts text into a rich text item, rendered with the current style of the item.

- **AppendStyle**: Inserts a style into a rich text item; subsequent text is rendered using that style's attributes.

These methods provide more flexible ways to manipulate rich text content.

By understanding and utilizing the `AppendRTItem` method, developers can more effectively manipulate rich text fields in LotusScript, meeting more complex document processing requirements.
