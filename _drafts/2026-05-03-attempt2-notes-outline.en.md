---
title: "Working with NotesOutline in LotusScript: A Comprehensive Guide"
description: "This tutorial provides an in-depth look at using the NotesOutline and NotesOutlineEntry classes in LotusScript to create and manage outlines in HCL Domino applications."
pubDate: "2026-05-03T07:20:44+08:00"
lang: "en"
slug: "notes-outline"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "Examples: Accessing an outline"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_ACCESSING_AN_OUTLINE_EX_NOTESOUTLINE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-outline
-->

## Introduction

In HCL Domino applications, outlines are a structured way to organize and navigate application content. Using the `NotesOutline` and `NotesOutlineEntry` classes in LotusScript, developers can programmatically create, modify, and manage these outlines.

## What are NotesOutline and NotesOutlineEntry?

- **NotesOutline**: Represents an outline in a database. It contains multiple `NotesOutlineEntry` objects, each representing a node in the outline.

- **NotesOutlineEntry**: Represents an entry within an outline. Each entry can contain child entries, forming a hierarchical structure.

## Creating and Accessing Outlines

To create or access an outline, you can use the following methods of the `NotesDatabase` class:

- `CreateOutline`: Creates a new outline.
- `GetOutline`: Retrieves an existing outline.

The following example demonstrates how to access an outline named "MyOutline" and display its properties:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim outline As NotesOutline
  Set db = session.CurrentDatabase
  Set outline = db.GetOutline("MyOutline")
  Messagebox outline.Alias
  Messagebox outline.Comment
End Sub
```

## Adding Entries to an Outline

To add entries to an outline, you can use the `CreateEntry` method. The following example demonstrates how to create a new entry named "Home" and add it to an outline named "Web site":

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim outline As NotesOutline
  Dim oe As NotesOutlineEntry
  Set db = session.CurrentDatabase
  Set outline = db.GetOutline("Web site")
  Set oe = outline.CreateEntry("Home")
  Call outline.AddEntry(oe)
  Call outline.Save()
End Sub
```

## Navigating Outline Entries

The `NotesOutline` class provides several methods to navigate its entries, such as:

- `GetFirst`: Retrieves the first entry of an outline.
- `GetLast`: Retrieves the last entry of an outline.
- `GetNext`: Retrieves the entry immediately following the specified entry.
- `GetPrev`: Retrieves the entry immediately preceding the specified entry.

The following example demonstrates how to retrieve the second entry in the "products" outline and display its label:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline
Dim oeA As NotesOutlineEntry
Dim oeB As NotesOutlineEntry
Set db = session.CurrentDatabase
Set outline = db.GetOutline("products")
Set oeA = outline.GetFirst()
Set oeB = outline.GetNext(oeA)
Messagebox oeB.Label
```

## Moving and Removing Entries

- `MoveEntry`: Moves the specified entry from one location to another in an outline.
- `RemoveEntry`: Deletes the specified entry and its subentries from an outline.

## Saving Changes

Any changes made to an outline need to be saved using the `Save` method.

## Conclusion

By utilizing the `NotesOutline` and `NotesOutlineEntry` classes, developers can programmatically create and manage outlines in HCL Domino applications, enhancing the organization and navigability of the application. For more detailed information, refer to the [NotesOutline (LotusScript)](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html) and [NotesOutlineEntry (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html) documentation.
