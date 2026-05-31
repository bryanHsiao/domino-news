---
title: "Exploring NotesViewNavigator with LotusScript"
description: "Dive into the NotesViewNavigator class to learn how to efficiently traverse Domino views using LotusScript, and understand its key properties and methods."
pubDate: "2026-06-01T07:28:06+08:00"
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
  - Slug collision: "notesviewnavigator-lotusscript" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html" was already cited by [lotusscript-view-to-excel] on 2026-05-26. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html" was already cited by [notesviewnavigator-lotusscript] on 2026-05-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_EXAMPLES_GETNEXT_METHOD_EX_VIEWNAV.html" was already cited by [notesviewnavigator-lotusscript] on 2026-05-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesviewnavigator-lotusscript
-->

## Introduction

In HCL Domino development, the `NotesViewNavigator` class provides an efficient way to traverse entries within a view. This class allows developers to sequentially access documents, categories, and totals in a view, enabling more flexible data processing.

## Creating a NotesViewNavigator

To create a `NotesViewNavigator`, first obtain the target view's `NotesView` object, then use its methods to initialize the navigator. For example, the `CreateViewNav` method creates a navigator encompassing all entries in the view.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim navigator As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set navigator = view.CreateViewNav
```

## Traversing View Entries

`NotesViewNavigator` offers various methods to traverse view entries. Some commonly used methods include:

- `GetFirst`: Retrieves the first entry in the navigator.
- `GetNext(entry As NotesViewEntry)`: Retrieves the next entry following the specified entry.
- `GetNextDocument(entry As NotesViewEntry)`: Retrieves the next document entry after the specified entry, skipping categories and totals.

The following example demonstrates how to use these methods to traverse all document entries in a view:

```lotusscript
Dim entry As NotesViewEntry
Set entry = navigator.GetFirstDocument

Do While Not (entry Is Nothing)
    ' Process the entry here
    Set entry = navigator.GetNextDocument(entry)
Loop
```

## Accessing Entry Properties

Each `NotesViewEntry` object contains various properties that provide detailed information about the entry. For example:

- `ColumnValues`: Returns the values of all columns in the entry.
- `IsCategory`: Indicates whether the entry is a category.
- `IsDocument`: Indicates whether the entry is a document.

The following example demonstrates how to check the entry type and retrieve column values:

```lotusscript
If entry.IsDocument Then
    Dim values As Variant
    values = entry.ColumnValues
    ' Process column values
End If
```

## Performance Considerations

When using `NotesViewNavigator`, it's recommended to set the view's `AutoUpdate` property to `False` to improve performance and avoid errors caused by view updates during traversal.

```lotusscript
view.AutoUpdate = False
```

Additionally, the `CacheSize` property of `NotesViewNavigator` can be set to adjust the navigator's cache size, further enhancing performance.

```lotusscript
navigator.CacheSize = 100
```

## Conclusion

`NotesViewNavigator` is a powerful tool in LotusScript, allowing developers to efficiently traverse and process entries within Domino views. By understanding its methods and properties, developers can achieve more flexible and efficient application development.

For more detailed information, refer to the [NotesViewNavigator class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html) and [Accessing NotesViewNavigator properties](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html).
