---
title: "Mastering NotesViewNavigator: Efficiently Navigating Domino Views"
description: "This tutorial guides you on using the NotesViewNavigator class to efficiently traverse HCL Domino views, complete with practical LotusScript examples."
pubDate: "2026-04-29T07:23:49+08:00"
lang: "en"
slug: "notes-view-navigator"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesViewNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_PROPERTIES.html"
  - title: "NotesViewNavigator methods"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_METHODS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-view-navigator
-->

## Introduction

In HCL Domino application development, views are essential for organizing and displaying data. When programmatically traversing documents within a view, LotusScript offers powerful tools, one of which is the `NotesViewNavigator` class. This article delves into how to use `NotesViewNavigator` to efficiently navigate views, providing practical code examples.

## Overview of NotesViewNavigator Class

The `NotesViewNavigator` class allows developers to programmatically navigate entries within a view, including documents, categories, and other elements. Compared to directly iterating over a `NotesView` using `NotesViewEntryCollection`, `NotesViewNavigator` offers a more flexible and efficient approach to accessing view contents.

### Key Properties

- **Navigator**: Indicates the current position of the navigator.
- **Entry**: Returns the current entry.

### Key Methods

- **GetFirst**: Retrieves the first entry in the view.
- **GetNext**: Retrieves the next entry relative to the current entry.
- **GetChild**: Retrieves the first child entry of the current entry.
- **GetParent**: Retrieves the parent entry of the current entry.
- **GetNextSibling**: Retrieves the next sibling entry of the current entry.
- **GetPrevSibling**: Retrieves the previous sibling entry of the current entry.

## Usage Example

The following example demonstrates how to use `NotesViewNavigator` to traverse all document entries in a view:

```lotusscript
Sub TraverseViewEntries(view As NotesView)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim navigator As NotesViewNavigator
    Dim entry As NotesViewEntry

    Set db = session.CurrentDatabase
    Set navigator = view.CreateViewNav
    Set entry = navigator.GetFirst

    Do While Not entry Is Nothing
        ' Process the current entry
        Print "Document UNID: " & entry.Document.UniversalID
        Set entry = navigator.GetNext(entry)
    Loop
End Sub
```

In this example, we first create a `NotesViewNavigator`, then use the `GetFirst` method to retrieve the first entry in the view, and iterate through all entries using the `GetNext` method.

## Advanced Usage

`NotesViewNavigator` also supports more complex navigation, such as traversing child or sibling entries. The following example demonstrates how to traverse all child entries of a specific entry:

```lotusscript
Sub TraverseChildEntries(view As NotesView, parentEntry As NotesViewEntry)
    Dim navigator As NotesViewNavigator
    Dim childEntry As NotesViewEntry

    Set navigator = view.CreateViewNav
    Set childEntry = navigator.GetChild(parentEntry)

    Do While Not childEntry Is Nothing
        ' Process the child entry
        Print "Child Document UNID: " & childEntry.Document.UniversalID
        Set childEntry = navigator.GetNextSibling(childEntry)
    Loop
End Sub
```

In this example, the `GetChild` method is used to retrieve the first child entry of a specified parent entry, and the `GetNextSibling` method is used to traverse all sibling child entries.

## Conclusion

`NotesViewNavigator` is a powerful and flexible tool that allows developers to efficiently traverse entries within HCL Domino views. By understanding its properties and methods, you can implement more efficient view navigation and data processing in LotusScript.

For more detailed information on `NotesViewNavigator`, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html).
