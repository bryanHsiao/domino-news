---
title: "Exploring NotesViewNavigator with LotusScript"
description: "Dive into the NotesViewNavigator class and learn how to efficiently traverse and manipulate Domino view entries using LotusScript."
pubDate: "2026-06-10T07:33:38+08:00"
lang: "en"
slug: "notesviewnavigator-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesViewNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesViewNavigator methods"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_METHODS.html"
  - title: "NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_PROPERTIES.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesviewnavigator-lotusscript
-->

In HCL Domino's LotusScript development, the `NotesViewNavigator` class provides an efficient way to traverse and manipulate entries within a view. This class offers developers precise control over view navigation, enabling more complex data processing logic.

## What is NotesViewNavigator?

`NotesViewNavigator` is a class used to navigate through entries in a `NotesView`. It allows developers to traverse views in various ways, such as sequentially, by category, or based on specific conditions. This is particularly useful for applications requiring fine-grained control over view traversal.

## Creating a NotesViewNavigator

To create a `NotesViewNavigator`, first obtain a `NotesView` object and then use its `CreateViewNav` method:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim navigator As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set navigator = view.CreateViewNav
```

This code retrieves the specified view from the current database and creates a navigator for that view.

## Traversing View Entries

Once you have a `NotesViewNavigator`, you can use its methods to traverse the entries in the view. For example, to iterate through all entries sequentially using the `GetFirst` and `GetNext` methods:

```lotusscript
Dim entry As NotesViewEntry

Set entry = navigator.GetFirst
Do While Not entry Is Nothing
    ' Process each entry here
    Set entry = navigator.GetNext(entry)
Loop
```

This code starts at the first entry in the view and processes each entry until there are no more entries.

## Traversing by Category

If the view contains categories, `NotesViewNavigator` allows traversal by category using the `GetFirstCategory` and `GetNextCategory` methods:

```lotusscript
Dim category As NotesViewEntry

Set category = navigator.GetFirstCategory
Do While Not category Is Nothing
    ' Process each category here
    Set category = navigator.GetNextCategory(category)
Loop
```

This enables processing of each category within the view.

## Traversing Specific Entries

`NotesViewNavigator` also supports starting traversal from specific entries. For instance, using the `GetEntryByKey` method to find an entry with a specific key and then traversing from that entry:

```lotusscript
Dim key As Variant
Dim entry As NotesViewEntry

key = "SpecificKey"
Set entry = navigator.GetEntryByKey(key, True)
If Not entry Is Nothing Then
    ' Process the found entry
End If
```

This allows developers to directly locate and operate on specific view entries.

## Conclusion

The `NotesViewNavigator` class provides LotusScript developers with a powerful tool for efficiently traversing and manipulating entries within Domino views. By understanding its methods and properties, developers can implement more flexible and efficient data processing logic.

For more information on `NotesViewNavigator`, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html).
