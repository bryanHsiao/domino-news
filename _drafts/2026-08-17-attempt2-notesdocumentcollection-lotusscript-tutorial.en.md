---
title: "Working with NotesDocumentCollection in LotusScript"
description: "A comprehensive guide on utilizing the NotesDocumentCollection class in LotusScript, covering its properties, methods, and practical examples."
pubDate: "2026-08-17T07:22:02+08:00"
lang: "en"
slug: "notesdocumentcollection-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocumentCollection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "FTSearch (NotesDocumentCollection - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html"
  - title: "Examples: NotesDocumentCollection class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENTCOLLECTION_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html?utm_source=openai" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocumentcollection-lotusscript-tutorial
-->

In HCL Domino's LotusScript, the `NotesDocumentCollection` class represents a collection of documents from a database, selected according to specific criteria. This class enables developers to efficiently manage and manipulate multiple documents.

## Retrieving a Document Collection

To obtain a collection of all documents in a database, use the `AllDocuments` property of the `NotesDatabase` class:

```lotusscript
Dim db As New NotesDatabase("ServerName", "DatabaseName.nsf")
Dim collection As NotesDocumentCollection
Set collection = db.AllDocuments
```

This code establishes a connection to a specific database and retrieves a collection of all its documents.

## Iterating Through the Document Collection

Once you have a `NotesDocumentCollection`, you can iterate through each document using the `GetFirstDocument` and `GetNextDocument` methods:

```lotusscript
Dim doc As NotesDocument
Set doc = collection.GetFirstDocument
While Not (doc Is Nothing)
    ' Process the document here
    Set doc = collection.GetNextDocument(doc)
Wend
```

This loop allows you to process each document in the collection sequentially.

## Performing Full-Text Searches with FTSearch

The `FTSearch` method enables full-text searches within the document collection, reducing it to documents that match the query:

```lotusscript
Dim query As String
query = "keyword"
Call collection.FTSearch(query, 0)
```

This method filters the document collection based on the specified query string. Note that if the database is not full-text indexed, this method will still work but less efficiently. You can check if a database is full-text indexed using the `IsFTIndexed` property of the `NotesDatabase` class. ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html?utm_source=openai))

## Checking if a Document is in the Collection

The `Contains` method checks whether a specific document is present in the collection:

```lotusscript
Dim isContained As Boolean
isContained = collection.Contains(doc)
```

This method returns a Boolean value indicating whether the specified document is in the collection. ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CONTAINS_METHOD_COLLECTION.html?utm_source=openai))

## Cloning a Document Collection

If you need to duplicate a document collection for backup or other operations, use the `Clone` method:

```lotusscript
Dim clonedCollection As NotesDocumentCollection
Set clonedCollection = collection.Clone
```

This creates a copy of the original collection, allowing operations on the clone without affecting the original.

## Conclusion

The `NotesDocumentCollection` class in LotusScript provides powerful capabilities for managing and manipulating multiple documents. By understanding its properties and methods, developers can more effectively handle document collections within HCL Domino databases.
