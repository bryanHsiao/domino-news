---
title: "Navigating View Entries with NotesViewNavigator in LotusScript"
description: "A comprehensive guide on using the NotesViewNavigator class in LotusScript to traverse view entries in HCL Domino, complete with practical examples."
pubDate: "2026-07-06T08:10:20+08:00"
lang: "en"
slug: "notesviewnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesViewNavigator class (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Accessing NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Examples: GetFirstDocument method (NotesViewNavigator - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_GETFIRSTDOCUMENT_METHOD_EX_VIEWNAV.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 2
slug: notesviewnavigator-lotusscript-tutorial
topicOverlap: false
issues:
  [critical] Set nav = view.CreateViewNav
      problem: CreateViewNav is not a method on NotesView. The correct method name is CreateViewNav() — actually this exists, but the fuller API surface is being misrepresented. More critically, the article never mentions CreateViewNavFrom, CreateViewNavFromCategory, CreateViewNavFromDescendants, or CreateViewNavMaxLevel — all real, commonly used factory methods on NotesView that are essential context for this topic. Omitting them makes the article materially incomplete for a production audience.
      fix:     Add a section or at minimum a paragraph covering CreateViewNavFrom (start from a specific entry), CreateViewNavFromCategory (all entries under a category), CreateViewNavFromDescendants, and CreateViewNavMaxLevel, explaining when to use each.
  [critical] Set entry = nav.GetNextDocument(entry)
      problem: GetNextDocument (and GetNext, GetPrev, etc.) on NotesViewNavigator do NOT take the current entry as an argument in LotusScript. They take no argument — the navigator maintains its own internal cursor position. The correct call is simply nav.GetNextDocument() with no argument. Showing a parameter here will cause a compile or runtime error.
      fix:     Remove the argument: change nav.GetNextDocument(entry) to nav.GetNextDocument() throughout. Same applies to any other navigation method calls that are shown with an entry argument.
  [major] GetFirst, GetNext, GetFirstDocument, GetNextDocument
      problem: The article lists only four traversal methods and implies this is the full set. It omits GetLast, GetPrev, GetPrevDocument, GetLastDocument, GetNth, GetPos, GetChild, GetParent, GetNextSibling, GetPrevSibling — all legitimate NotesViewNavigator methods. A reader building non-trivial navigation (e.g. walking a categorised view hierarchically) would be poorly served.
      fix:     Expand the methods list to at least mention the backward-navigation counterparts (GetLast/GetPrev/GetPrevDocument) and the hierarchical navigation methods (GetChild, GetParent, GetNextSibling, GetPrevSibling), even if only briefly.
  [major] entry.ColumnValues(0)
      problem: ColumnValues is a 0-based array in LotusScript, which the article shows correctly, but it does not warn that the type of each element is Variant and can be a scalar, an array (for multi-value fields), or a date/time object (NotesDateTime). Treating all column values as strings without type-checking is a common source of runtime errors and the article should flag this.
      fix:     Add a note that ColumnValues returns an array of Variants; individual elements may be strings, numbers, NotesDateTime objects, or sub-arrays for multi-value columns, and code should check/convert accordingly.
  [major] Setting View AutoUpdate
      problem: The article presents view.AutoUpdate = False as a general performance tip but does not explain the risk: if the view index is rebuilt or updated by another user or the server while AutoUpdate is False and navigation is in progress, the navigator can return stale or inconsistent results. It also does not mention that AutoUpdate should be restored to True (or the view released) after traversal, nor does it mention the related NotesViewNavigator.BufferMaxEntries property which is the more direct performance knob for navigator pre-fetching.
      fix:     Qualify the AutoUpdate advice with the staleness caveat, remind readers to re-enable it after traversal, and mention BufferMaxEntries as the navigator-specific performance property.
  [major] UniversalID: The universal ID of the document associated with the entry
      problem: NotesViewEntry.UniversalID is valid only when IsDocument is True. For category entries, UniversalID is empty/meaningless. The article lists it as a general property of NotesViewEntry without this qualification, which is misleading.
      fix:     Qualify the UniversalID property description: note it is only meaningful when IsDocument is True, and is empty for category and total entries.
  [minor] Introduction — 'including documents, categories, and totals'
      problem: The article mentions 'totals' as an entry type but never explains what a total entry is (a view totals row), nor does it cover IsTotal on NotesViewEntry. Mentioning it without any follow-up is confusing.
      fix:     Either add a brief explanation of total entries and the IsTotal property, or remove 'totals' from the introduction if the article will not cover them.
  [minor] Conclusion / overall article
      problem: The article does not mention the Cache / BufferMaxEntries property of NotesViewNavigator, which is the primary tuning lever for large-view traversal performance — a significant omission for a production-focused article.
      fix:     Add a brief note on NotesViewNavigator.BufferMaxEntries (default 0 = no pre-fetch; setting it to e.g. 400 can dramatically improve throughput on large views).
-->

## Introduction

In HCL Domino application development, it's common to programmatically access and manipulate entries within a view. The `NotesViewNavigator` class provides an efficient way to traverse view entries, including documents, categories, and totals. This article explores how to use `NotesViewNavigator` in LotusScript, accompanied by practical examples.

## Creating a NotesViewNavigator

To create a `NotesViewNavigator`, first obtain the target view's `NotesView` object. Then, use the `CreateViewNav` method to create the navigator.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim nav As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set nav = view.CreateViewNav
```

In this example, the `CreateViewNav` method returns a `NotesViewNavigator` object representing all entries in the view.

## Traversing View Entries

`NotesViewNavigator` offers various methods to traverse view entries. Some commonly used methods include:

- `GetFirst`: Retrieves the first entry.
- `GetNext`: Retrieves the entry following the current entry.
- `GetFirstDocument`: Retrieves the first document entry, skipping category and total entries.
- `GetNextDocument`: Retrieves the document entry following the current document entry.

The following example demonstrates how to use these methods to traverse all document entries in a view:

```lotusscript
Dim entry As NotesViewEntry
Set entry = nav.GetFirstDocument

Do While Not (entry Is Nothing)
    ' Process entry here
    Set entry = nav.GetNextDocument(entry)
Loop
```

In this example, the `GetFirstDocument` method returns the first document entry, and the `GetNextDocument` method traverses the remaining document entries.

## Accessing Entry Properties

A `NotesViewEntry` object represents a single entry in a view and provides various properties to access entry information:

- `ColumnValues`: The column values of the entry in the view.
- `IsCategory`: Indicates whether the entry is a category entry.
- `IsDocument`: Indicates whether the entry is a document entry.
- `UniversalID`: The universal ID of the document associated with the entry.

The following example demonstrates how to access an entry's column values and document ID:

```lotusscript
If entry.IsDocument Then
    Dim doc As NotesDocument
    Set doc = entry.Document
    MsgBox "Document Universal ID: " & doc.UniversalID
    MsgBox "First Column Value: " & entry.ColumnValues(0)
End If
```

## Setting View AutoUpdate

To enhance performance, it's advisable to disable the view's auto-update feature when traversing view entries. This can be achieved by setting the view's `AutoUpdate` property to `False`:

```lotusscript
view.AutoUpdate = False
```

Disabling auto-update prevents the view from refreshing during traversal, thereby avoiding potential errors and performance issues.

## Conclusion

The `NotesViewNavigator` class provides a powerful and flexible tool for traversing view entries in HCL Domino using LotusScript. By understanding its methods and properties, developers can efficiently access and manipulate view entries, thereby enhancing the functionality and performance of their applications.

For more detailed information on `NotesViewNavigator`, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html).

Additionally, you can consult [Accessing NotesViewNavigator properties](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html) and [Examples: GetFirstDocument method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_GETFIRSTDOCUMENT_METHOD_EX_VIEWNAV.html) for more practical examples.
