---
title: "NotesDocument: Document Operations in LotusScript"
description: "Explore the NotesDocument class to learn how to create, read, update, and delete documents in HCL Domino databases using LotusScript."
pubDate: "2026-07-02T07:34:13+08:00"
lang: "en"
slug: "notesdocument-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NoteID property (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTEID_PROPERTY.html"
  - title: "Examples: Items property (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_ITEMS_PROPERTY.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" was already cited by [lotusscript-evaluate] on 2026-06-20. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdocument-lotusscript-tutorial
-->

In HCL Domino's LotusScript development, the `NotesDocument` class is central to handling documents within a database. This article provides a comprehensive guide on creating, reading, updating, and deleting documents using the `NotesDocument` class, complete with practical code examples.

## Creating a New Document

To create a new document in a database, use the `CreateDocument` method of the `NotesDatabase` class:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.CreateDocument

doc.Form = "Memo"
doc.Subject = "New Document Title"
doc.Body = "This is the content of the new document."

doc.Save True, False
```

This code snippet creates a new document, sets its form to "Memo," assigns a subject, adds content, and saves it to the database.

## Reading an Existing Document

To read an existing document, you can retrieve it by its Universal Unique Identifier (UNID) using the `GetDocumentByUNID` method of the `NotesDatabase` class:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim unid As String

Set db = session.CurrentDatabase
unid = "C1257D1C003B5A7C85257D1C003B5A7C"
Set doc = db.GetDocumentByUNID(unid)

If Not doc Is Nothing Then
    MsgBox "Document Subject: " & doc.GetItemValue("Subject")(0)
Else
    MsgBox "Document not found."
End If
```

This script retrieves a document by its UNID and displays its subject.

## Updating a Document

To update an existing document, modify its item values and save the changes:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim unid As String

Set db = session.CurrentDatabase
unid = "C1257D1C003B5A7C85257D1C003B5A7C"
Set doc = db.GetDocumentByUNID(unid)

If Not doc Is Nothing Then
    doc.ReplaceItemValue "Subject", "Updated Subject"
    doc.Save True, False
    MsgBox "Document updated."
Else
    MsgBox "Document not found."
End If
```

This code updates the subject of the specified document and saves the changes.

## Deleting a Document

To delete a document, use the `Remove` method:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim unid As String

Set db = session.CurrentDatabase
unid = "C1257D1C003B5A7C85257D1C003B5A7C"
Set doc = db.GetDocumentByUNID(unid)

If Not doc Is Nothing Then
    doc.Remove True
    MsgBox "Document deleted."
Else
    MsgBox "Document not found."
End If
```

This script deletes the specified document from the database.

## Retrieving a Document's NoteID

Each document in a database has a unique NoteID, accessible via the `NoteID` property:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim noteID As String

Set db = session.CurrentDatabase
Set doc = db.GetFirstDocument

If Not doc Is Nothing Then
    noteID = doc.NoteID
    MsgBox "Document NoteID: " & noteID
Else
    MsgBox "No document found."
End If
```

This code retrieves and displays the NoteID of the first document in the database.

## Listing All Items in a Document

You can list all items in a document using the `Items` property:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.GetFirstDocument

If Not doc Is Nothing Then
    Forall item In doc.Items
        MsgBox "Item Name: " & item.Name
    End Forall
Else
    MsgBox "No document found."
End If
```

This script lists the names of all items in the document.

By mastering these fundamental operations with the `NotesDocument` class, developers can effectively manage documents within HCL Domino databases using LotusScript.
