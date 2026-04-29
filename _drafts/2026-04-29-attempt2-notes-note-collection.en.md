---
title: "Mastering NotesNoteCollection: Efficiently Managing Notes Documents"
description: "Learn how to utilize the NotesNoteCollection class to efficiently collect and manage Notes documents, enhancing the performance of your LotusScript applications."
pubDate: "2026-04-29T16:06:38+08:00"
lang: "en"
slug: "notes-note-collection"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNoteCollection class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html"
  - title: "NotesNoteCollection properties"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_PROPERTIES.html"
  - title: "NotesNoteCollection methods"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_METHODS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-note-collection
-->

## What is NotesNoteCollection?

In HCL Domino's LotusScript, the `NotesNoteCollection` class provides an efficient way to collect and manage Notes documents (notes). This class allows developers to gather documents based on specific criteria and perform batch processing, thereby improving application performance.

## Why Use NotesNoteCollection?

Traditionally, developers might use the `AllDocuments` method of `NotesDatabase` to retrieve all documents in a database and process them individually. However, this approach can lead to performance issues when dealing with large datasets. `NotesNoteCollection` offers a more efficient method, enabling developers to collect documents based on specific criteria and process them in batches.

## How to Use NotesNoteCollection?

Below is an example demonstrating how to use `NotesNoteCollection` to collect and process specific types of documents:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesNoteCollection
Dim note As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.CreateNoteCollection(False)

' Set collection criteria, e.g., collect only documents with form name "Memo"
collection.SelectForms = True
collection.SelectForm = "Memo"

' Build the collection
Call collection.BuildCollection

' Iterate through the collected documents
Set note = collection.GetFirstNote
Do While Not (note Is Nothing)
    ' Process each document here
    ' ...
    Set note = collection.GetNextNote
Loop
```

In this example, we first create a `NotesNoteCollection` and set the collection criteria to gather only documents with the form name "Memo." We then build the collection using the `BuildCollection` method and iterate through each document for processing.

## Advanced Application: Batch Processing Documents

`NotesNoteCollection` allows developers to perform batch operations on collected documents, such as batch deletion or updates. Below is an example of batch deleting documents:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesNoteCollection

Set db = session.CurrentDatabase
Set collection = db.CreateNoteCollection(False)

' Set collection criteria, e.g., collect specific types of documents
collection.SelectDocuments = True
collection.SelectionFormula = "@Contains(Subject; 'Old Document')"

' Build the collection
Call collection.BuildCollection

' Batch delete the collected documents
Call collection.RemoveAll(True)
```

In this example, we use the `SelectionFormula` property to set the collection criteria, gathering only documents whose subject contains "Old Document." We then use the `RemoveAll` method to batch delete these documents.

## Conclusion

`NotesNoteCollection` is a powerful and efficient tool for scenarios requiring the processing of large numbers of Notes documents. By correctly setting collection criteria and using appropriate methods, developers can significantly enhance the performance and maintainability of LotusScript applications. For more detailed information, refer to the [NotesNoteCollection class](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html) and [NotesNoteCollection methods](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_METHODS.html).
