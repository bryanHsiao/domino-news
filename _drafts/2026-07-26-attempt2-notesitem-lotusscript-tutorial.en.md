---
title: "NotesItem Class: Manipulating Notes Document Fields with LotusScript"
description: "Explore the NotesItem class to learn how to access and manipulate fields within Notes documents using LotusScript, complete with practical examples."
pubDate: "2026-07-26T08:02:42+08:00"
lang: "en"
slug: "notesitem-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesItem (LotusScript)"
    url: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_4_LOTUSSCRIPT_NOTES_CLASSES_REFERENCE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notesform-lotusscript-tutorial] on 2026-07-25. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html?utm_source=openai" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesitem-lotusscript-tutorial
-->

In HCL Domino development, the **NotesItem** class is essential for accessing and manipulating fields within Notes documents. This class allows developers to read, modify, and manage various field data within a document.

## Overview of the NotesItem Class

The **NotesItem** class represents a specific field within a Notes document. In the user interface, document fields are displayed through form fields. When a form's field name matches a document's field name, the field appears in the form. For example, the `Subject` field appears as `[Subject]`. Using LotusScript, developers can access all fields within a document, regardless of the form used to display it. ([hcljapan.co.jp](https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html?utm_source=openai))

## Creating and Accessing a NotesItem

To access a specific field within a document, first obtain the **NotesDocument** object, then use the `GetFirstItem` method to retrieve the **NotesItem**:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("<document_unid>")
Set item = doc.GetFirstItem("<field_name>")
```

In this code, `<document_unid>` is the unique identifier of the document, and `<field_name>` is the name of the field to access.

## Reading and Modifying Field Values

Once you have the **NotesItem** object, you can read or modify its value using the `Text` property:

```lotusscript
Dim fieldValue As String

' Read the field value
fieldValue = item.Text

' Modify the field value
item.Text = "New Value"

' Save the changes
Call doc.Save(True, False)
```

Note that after modifying the field value, you need to call the `doc.Save` method to save the changes.

## Checking the Field Type

The **NotesItem** class provides the `Type` property, allowing developers to check the type of the field:

```lotusscript
Dim itemType As Integer

itemType = item.Type

Select Case itemType
    Case RICHTEXT
        ' Handle rich text field
    Case TEXT
        ' Handle text field
    ' Other types...
End Select
```

This enables different operations based on the field type.

## Conclusion

The **NotesItem** class is a powerful tool in LotusScript for manipulating fields within Notes documents. By understanding its methods and properties, developers can effectively read, modify, and manage field data within documents. For more detailed information, refer to the [official NotesItem class documentation](https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html).
