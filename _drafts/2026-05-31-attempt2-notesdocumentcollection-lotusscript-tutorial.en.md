---
title: "A Guide to Using NotesDocumentCollection in LotusScript"
description: "An in-depth look at utilizing the NotesDocumentCollection class in LotusScript, covering its properties, methods, and practical examples."
pubDate: "2026-05-31T07:26:29+08:00"
lang: "en"
slug: "notesdocumentcollection-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocumentCollection (LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "FTSearch (NotesDocumentCollection - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-ftsearch-notesdocumentcollection"
  - title: "Examples: GetNextDocument method (NotesDocumentCollection - LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_EXAMPLES_GETNEXTDOCUMENT_METHOD_COLLECTION.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html, https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-ftsearch-notesdocumentcollection, https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_EXAMPLES_GETNEXTDOCUMENT_METHOD_COLLECTION.html
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdocumentcollection-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, the `NotesDocumentCollection` class represents a collection of documents from a database that meet specific criteria. This class allows developers to efficiently access, manipulate, and manage these document collections.

## Key Properties and Methods

### Properties

- **Count**: Returns the number of documents in the collection.
- **IsSorted**: Indicates whether the documents in the collection are sorted.
- **Parent**: Returns the `NotesDatabase` object that contains the collection.

### Methods

- **GetFirstDocument**: Retrieves the first document in the collection.
- **GetNextDocument**: Retrieves the document following a specified document in the collection.
- **FTSearch**: Performs a full-text search on all documents in the collection, reducing the collection to those that match the query.

## Practical Examples

### 1. Retrieving and Iterating Through All Documents

The following example demonstrates how to retrieve all documents in a database and iterate through each document's subject:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.AllDocuments
Set doc = collection.GetFirstDocument()

While Not doc Is Nothing
    Print doc.GetItemValue("Subject")(0)
    Set doc = collection.GetNextDocument(doc)
Wend
```

In this example, the `AllDocuments` property returns a collection of all documents in the database. The `GetFirstDocument` and `GetNextDocument` methods are used to iterate through each document.

### 2. Filtering Documents Using Full-Text Search

The following example demonstrates how to use the `FTSearch` method to find documents containing a specific keyword:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.FTSearch("keyword", 0)
Set doc = collection.GetFirstDocument()

While Not doc Is Nothing
    Print doc.GetItemValue("Subject")(0)
    Set doc = collection.GetNextDocument(doc)
Wend
```

In this example, the `FTSearch` method performs a full-text search on the database for documents containing the word "keyword" and returns a collection of matching documents.

### 3. Moving Documents in a Collection to a Specific Folder

The following example demonstrates how to move documents that meet specific criteria to a folder named "Archive":

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.FTSearch("keyword", 0)
Set doc = collection.GetFirstDocument()

While Not doc Is Nothing
    Call doc.PutInFolder("Archive")
    Set doc = collection.GetNextDocument(doc)
Wend
```

In this example, the `PutInFolder` method moves each document that meets the criteria into the "Archive" folder.

## Considerations

- **Sorting**: Unless obtained through a full-text search, documents in a `NotesDocumentCollection` are typically unordered.
- **Performance**: For large databases, using full-text search or specific views to retrieve document collections may be more efficient.

By understanding the properties and methods of the `NotesDocumentCollection` class, developers can more effectively manipulate and manage document collections in HCL Domino databases using LotusScript.
