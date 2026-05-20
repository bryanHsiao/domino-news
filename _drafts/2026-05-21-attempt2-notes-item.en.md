---
title: "Deep Dive into NotesItem: Accessing Document Data in LotusScript"
description: "This article provides an in-depth look at the NotesItem class, explaining its role in LotusScript and offering practical examples on how to access and manipulate document data within HCL Domino applications."
pubDate: "2026-05-21T07:33:20+08:00"
lang: "en"
slug: "notes-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesItem (LotusScript)"
    url: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_4_LOTUSSCRIPT_NOTES_CLASSES_REFERENCE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notes-newsletter] on 2026-05-12. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-item
-->

## What is NotesItem?

In HCL Domino's LotusScript, the `NotesItem` class represents a specific piece of data within a document. These items typically correspond to fields on a form but can also exist independently within a document. Through `NotesItem`, developers can read, modify, and manage data within documents.

## Creating and Accessing NotesItem

To create a new `NotesItem`, you can use the `New` method or the `ReplaceItemValue` method of the `NotesDocument` class. For example:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set item = doc.ReplaceItemValue("Subject", "This is the subject")
```

In this example, the `ReplaceItemValue` method creates a `NotesItem` named "Subject" and sets its value to "This is the subject".

## Properties and Methods of NotesItem

`NotesItem` offers various properties and methods that allow developers to manipulate data within documents. Some commonly used ones include:

- **Name**: Returns or sets the name of the item.
- **Values**: Returns or sets the value(s) of the item.
- **IsSummary**: Indicates whether the item is included in the document's summary.
- **Remove**: Removes the item from the document.

For instance, the following code demonstrates how to read and modify an existing item's value:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("Document's UNID")
Set item = doc.GetFirstItem("Subject")

If Not item Is Nothing Then
    MsgBox "Current subject: " & item.Values(0)
    Call item.Remove
    Call doc.ReplaceItemValue("Subject", "New subject")
    Call doc.Save(True, False)
End If
```

In this example, the code retrieves the "Subject" item, displays its current value, removes it, adds a new "Subject" item, and then saves the document.

## Important Considerations

- **Data Types**: The value of a `NotesItem` can be of various data types, including text, numbers, and dates. Ensure you handle the correct data type when manipulating items.
- **Summary Items**: Items with `IsSummary` set to `True` are included in the document's summary, which is crucial for views and search operations.

## Conclusion

`NotesItem` is a fundamental class in LotusScript for interacting with document data in HCL Domino. By understanding its properties and methods, developers can effectively read, modify, and manage data within documents, enabling the creation of robust Domino applications.

For more detailed information, refer to the [NotesItem (LotusScript)](https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html) and [Using the Domino classes](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html) documentation.
