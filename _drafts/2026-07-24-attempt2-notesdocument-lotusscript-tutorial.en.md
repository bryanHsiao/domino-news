---
title: "Mastering the NotesDocument Class in LotusScript"
description: "A comprehensive guide to the NotesDocument class, covering creation, reading, modification, deletion, and five common pitfalls to avoid in LotusScript."
pubDate: "2026-07-24T08:02:59+08:00"
lang: "en"
slug: "notesdocument-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=classes-notesdocument-lotusscript"
  - title: "Save (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html"
  - title: "Accessing documents in LotusScript classes"
    url: "https://www.ibm.com/docs/nl/domino-designer/8.5.3?topic=guidelines-accessing-documents-in-lotusscript-classes"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notesdocument-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=classes-notesdocument-lotusscript" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocument-lotusscript-tutorial
-->

## Introduction

The `NotesDocument` class is central to manipulating documents within LotusScript. Whether you're creating, reading, modifying, or deleting documents, this class is indispensable. This guide delves into the usage of `NotesDocument` and highlights five common pitfalls to avoid.

## Creating a New NotesDocument

To create a new document in a database, you can use the following methods:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
```

Alternatively, use the `CreateDocument` method:

```lotusscript
Set doc = db.CreateDocument()
```

Remember to call the `Save` method to persist the new document to disk.

## Accessing Existing NotesDocuments

There are multiple ways to access existing documents:

- **By UNID or NoteID**:

  ```lotusscript
  Set doc = db.GetDocumentByUNID("UNID")
  Set doc = db.GetDocumentByID("NoteID")
  ```

- **Through a View**:

  ```lotusscript
  Dim view As NotesView
  Set view = db.GetView("ViewName")
  Set doc = view.GetFirstDocument()
  ```

- **By Searching**:

  ```lotusscript
  Dim collection As NotesDocumentCollection
  Set collection = db.Search("Form = 'FormName'", Nothing, 0)
  Set doc = collection.GetFirstDocument()
  ```

## Modifying and Saving NotesDocuments

To modify a document, use the `ReplaceItemValue` method to change field values, then save the changes:

```lotusscript
Call doc.ReplaceItemValue("FieldName", "NewValue")
Call doc.Save(True, False)
```

Note that the second parameter of the `Save` method, `createResponse`, does not create a response document. Instead, it controls conflict handling. If set to `True`, the current version becomes a response to the original document in case of a conflict—a common misconception.

## Deleting NotesDocuments

To delete a document, use the `Remove` method:

```lotusscript
Call doc.Remove(True)
```

Be aware that the `force` parameter in the `Remove` method does not control permanent deletion. Permanent deletion depends on the database settings. To force permanent deletion, use the `RemovePermanently` method.

## Five Common Pitfalls

1. **`GetItemValue` Always Returns an Array**: Even for single-value fields, `GetItemValue` returns an array. Access the first value using index `(0)`.

2. **Misunderstanding the `createResponse` Parameter in `Save`**: As mentioned, `createResponse` controls conflict handling, not the creation of response documents.

3. **Misinterpreting the `force` Parameter in `Remove`**: The `force` parameter does not dictate permanent deletion; database settings determine this.

4. **Not Properly Handling New Documents**: Ensure that new documents have their fields set explicitly and are saved using the `Save` method.

5. **Failing to Release Objects**: After using a `NotesDocument` object, release it with `Set doc = Nothing` to conserve memory.

## Conclusion

The `NotesDocument` class is foundational for document manipulation in LotusScript. By understanding its methods and properties and being aware of common pitfalls, you can develop and maintain Domino applications more effectively. For more detailed information, refer to the [official documentation](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=classes-notesdocument-lotusscript) and the [detailed explanation of the Save method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html).
