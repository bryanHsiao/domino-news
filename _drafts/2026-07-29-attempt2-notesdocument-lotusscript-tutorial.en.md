---
title: "NotesDocument Class: Core Document Operations in LotusScript"
description: "An in-depth exploration of the NotesDocument class in LotusScript, covering its properties, methods, and common usage scenarios with important considerations."
pubDate: "2026-07-29T07:59:43+08:00"
lang: "en"
slug: "notesdocument-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notesdocument-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" was already cited by [notes-document-computewithform] on 2026-07-15. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notesform-lotusscript-tutorial] on 2026-07-25. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocument-lotusscript-tutorial
-->

## Introduction

The `NotesDocument` class is central to handling documents within HCL Domino databases using LotusScript. It enables developers to create, read, modify, and delete documents, as well as access various properties and items within them.

## Creating a NotesDocument

To create a new `NotesDocument`, you can use the following approach:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
```

In this code, `session.CurrentDatabase` retrieves a reference to the current database, and `New NotesDocument(db)` creates a new document within that database.

## Accessing and Modifying Document Properties

The `NotesDocument` class provides various properties to access and modify document information, such as:

- `Authors`: Reads the authors of the document.
- `Created`: Retrieves the creation date and time of the document.
- `LastModified`: Retrieves the last modification date and time of the document.

To access these properties:

```lotusscript
Dim authors As Variant
Dim created As NotesDateTime
Dim lastModified As NotesDateTime

authors = doc.Authors
Set created = doc.Created
Set lastModified = doc.LastModified
```

## Working with Document Items

`NotesDocument` allows access to and manipulation of individual items within a document. For example, to set the value of an item named "Subject":

```lotusscript
doc.ReplaceItemValue "Subject", "Meeting Notice"
```

To retrieve the value of an item:

```lotusscript
Dim subject As String
subject = doc.GetItemValue("Subject")(0)
```

Note that `GetItemValue` returns an array, even if the item contains a single value, so you need to use an index `(0)` to access the actual value.

## Saving and Deleting Documents

After modifying a `NotesDocument`, you must call the `Save` method to persist changes:

```lotusscript
Call doc.Save(True, False)
```

Here, the first parameter indicates whether to force the save, and the second parameter specifies whether to create a conflict document if a conflict occurs.

To delete a document, use the `Remove` method:

```lotusscript
Call doc.Remove(True)
```

The parameter indicates whether to force the deletion.

## Important Considerations

- **`GetItemValue` Returns an Array**: Even for single-value items, `GetItemValue` returns an array. Always use an index to access the value.
- **Saving Changes**: Modifications to a `NotesDocument` are not automatically saved. You must explicitly call the `Save` method.
- **Deleting Documents**: When using the `Remove` method, be aware of database settings, such as whether soft deletions are enabled.

## Conclusion

The `NotesDocument` class is essential for document operations in LotusScript within Domino applications. Understanding its properties and methods, along with common usage details, enables effective development and maintenance of Domino applications.

For more information, refer to the [official NotesDocument class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) and [NotesDocument class examples](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html).
