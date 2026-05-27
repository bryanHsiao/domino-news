---
title: "Deep Dive into NotesViewNavigator: Navigating Views in LotusScript"
description: "This guide provides an in-depth look at using the NotesViewNavigator class in LotusScript to efficiently traverse and manipulate entries within HCL Domino views."
pubDate: "2026-05-28T07:32:20+08:00"
lang: "en"
slug: "notesviewnavigator-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesViewNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Accessing NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Examples: GetNext method (NotesViewNavigator - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_EXAMPLES_GETNEXT_METHOD_EX_VIEWNAV.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html" was already cited by [lotusscript-view-to-excel] on 2026-05-26. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesviewnavigator-lotusscript
-->

## Introduction

In HCL Domino development, the **NotesViewNavigator** class offers an efficient way to traverse entries within a view. Unlike directly using **NotesView**, **NotesViewNavigator** allows developers to access and manipulate documents, categories, and totals within a view more flexibly.

## Creating a NotesViewNavigator

To create a **NotesViewNavigator**, first obtain a **NotesView** object and then use its methods to initialize the navigator. For example:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim navigator As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set navigator = view.CreateViewNav
```

In this example, the `CreateViewNav` method returns a **NotesViewNavigator** object representing all entries in the view.

## Traversing View Entries

**NotesViewNavigator** provides various methods to traverse view entries, including:

- `GetFirst`: Retrieves the first entry.
- `GetNext`: Retrieves the next entry after the current one.
- `GetNextDocument`: Retrieves the next document entry after the current document entry, skipping categories and totals.

The following example demonstrates how to use these methods to traverse all document entries in a view:

```lotusscript
Dim entry As NotesViewEntry
Set entry = navigator.GetFirstDocument

Do While Not (entry Is Nothing)
    ' Process each document entry here
    Set entry = navigator.GetNextDocument(entry)
Loop
```

In this example, the `GetFirstDocument` method returns the first document entry, and the `GetNextDocument` method returns the next document entry until no more document entries are found.

## Accessing Entry Properties

Each **NotesViewEntry** object contains multiple properties that provide detailed information about the entry. For example:

- `ColumnValues`: Returns the values of the entry's columns in the view.
- `IsCategory`: Indicates whether the entry is a category.
- `IsDocument`: Indicates whether the entry is a document.

The following example demonstrates how to check the entry type and access its column values:

```lotusscript
If entry.IsDocument Then
    Dim columnValues As Variant
    columnValues = entry.ColumnValues
    ' Process column values
End If
```

## Setting Navigator Properties

**NotesViewNavigator** has several properties that control its behavior:

- `CacheSize`: Sets the size of the navigator's cache to improve performance.
- `MaxLevel`: Sets the maximum level of navigation for the navigator.

For example, the following code sets the navigator's maximum level:

```lotusscript
navigator.MaxLevel = 2
```

This limits the navigator to traverse only the first two levels of the view.

## Considerations

When using **NotesViewNavigator**, keep the following in mind:

- **Automatic Updates**: Avoid automatically updating the parent view, as this can degrade performance and invalidate entries in the navigator. It is recommended to set the view's `AutoUpdate` property to `False` and manually refresh the view when needed.

- **Duplicate Entries**: If a document is categorized under multiple categories, duplicate entries may exist. In such cases, the `GetEntry` method returns the first instance of the document.

By correctly utilizing **NotesViewNavigator**, developers can more efficiently traverse and manipulate entries within HCL Domino views, enhancing the performance and flexibility of their applications.

For more detailed information, refer to the [NotesViewNavigator class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html) and [Accessing NotesViewNavigator properties](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html).
