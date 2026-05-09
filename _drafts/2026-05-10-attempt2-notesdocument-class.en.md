---
title: "Mastering the NotesDocument Class: A Practical Guide in LotusScript"
description: "This tutorial provides a comprehensive guide on using the NotesDocument class in LotusScript to create, access, and manipulate documents within HCL Domino databases, complete with practical examples."
pubDate: "2026-05-10T07:21:50+08:00"
lang: "en"
slug: "notesdocument-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Programming in Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_OVERVIEW_OF_SCRIPTS_AND_FORMULAS_3325_OVERVIEW.html"
  - title: "Accessing sessions"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WAYS_TO_ACCESS_NOTES_SESSIONS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesdocument-class
-->

## What is the NotesDocument Class?

The `NotesDocument` class represents a document within an HCL Domino database. It allows developers to create new documents, read and modify existing documents, and perform various document-related operations.

## Creating a New Document

To create a new document in LotusScript, you first need to obtain references to the current session and the target database. Here are the basic steps:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)

' Set the document's fields
doc.Form = "MainForm"
doc.Subject = "New Document"

' Save the document
doc.Save True, False
```

In this code, `session.CurrentDatabase` retrieves a reference to the current database, `New NotesDocument(db)` creates a new document object, and by setting field values and saving, the document is created.

## Accessing Existing Documents

To access existing documents, you can use various methods, such as retrieving a document by its Universal ID (UNID) or NoteID:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' Access the document's field value
    MsgBox doc.GetItemValue("Subject")(0)
End If
```

In this example, the `db.GetDocumentByUNID` method retrieves the document corresponding to the provided UNID, and `GetItemValue` reads the value of a specific field.

## Modifying Document Content

To modify the content of an existing document, you can directly set field values and then save the changes:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' Modify field value
doc.ReplaceItemValue "Subject", "Updated Subject"
    ' Save changes
doc.Save True, False
End If
```

Here, the `ReplaceItemValue` method updates the value of a field, and the `Save` method commits the changes.

## Deleting a Document

To delete a document, use the `Remove` method:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' Delete the document
doc.Remove True
End If
```

The `Remove` method's parameter determines whether the document is permanently deleted (`True`) or moved to the trash (`False`).

## Conclusion

The `NotesDocument` class is a fundamental tool in LotusScript for interacting with documents in HCL Domino databases. By mastering its methods and properties, developers can efficiently create, access, modify, and delete documents to meet various application requirements.

For more detailed information on the `NotesDocument` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html).
