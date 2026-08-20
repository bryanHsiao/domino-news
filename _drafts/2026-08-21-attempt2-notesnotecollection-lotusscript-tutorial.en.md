---
title: "Working with NotesNoteCollection in LotusScript"
description: "A comprehensive guide on utilizing the NotesNoteCollection class in LotusScript to manage design and data elements within a Domino database."
pubDate: "2026-08-21T07:27:20+08:00"
lang: "en"
slug: "notesnotecollection-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesNoteCollection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS.html"
  - title: "Building a note collection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_BUILDING_A_NOTE_COLLECTION.html"
  - title: "CreateNoteCollection (NotesDatabase - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATENOTECOLLECTION_METHOD_DATABASE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesnotecollection-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, LotusScript offers powerful tools for managing various elements within a database. The `NotesNoteCollection` class allows developers to gather and manipulate design and data elements, making it invaluable for batch processing and automation tasks.

## Creating a NotesNoteCollection

To create a `NotesNoteCollection` object, first obtain a reference to the current database and then use the `CreateNoteCollection` method. This method's parameter determines whether to select all elements.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim noteCollection As NotesNoteCollection

Set db = session.CurrentDatabase
Set noteCollection = db.CreateNoteCollection(False)
```

In this example, `False` indicates that not all elements are selected by default. You can set the `Select` properties to choose specific types of elements as needed.

## Setting Select Properties

The `NotesNoteCollection` class provides multiple `Select` properties, allowing you to specify the types of elements to include. For instance, to select all forms and views, set the following properties:

```lotusscript
noteCollection.SelectForms = True
noteCollection.SelectViews = True
```

Additionally, you can use the `SelectionFormula` property to select elements based on specific criteria.

## Building the Collection

After setting the desired `Select` properties, use the `BuildCollection` method to compile the collection.

```lotusscript
Call noteCollection.BuildCollection()
```

Once built, you can retrieve the number of elements in the collection using the `Count` property.

## Iterating Through the Collection

To iterate through the elements in the collection, use the `GetFirstNoteID` and `GetNextNoteID` methods.

```lotusscript
Dim noteID As String
noteID = noteCollection.GetFirstNoteID()

Do While noteID <> ""
    ' Process each element here
    noteID = noteCollection.GetNextNoteID(noteID)
Loop
```

## Conclusion

The `NotesNoteCollection` class provides developers with an efficient way to manage and manipulate design and data elements within a Domino database. By appropriately setting the `Select` properties and utilizing the relevant methods, you can easily perform various batch operations.

For more detailed information, refer to the [NotesNoteCollection (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS.html) and [Building a note collection (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_BUILDING_A_NOTE_COLLECTION.html) documentation.
