---
title: "Working with NotesView in LotusScript: A Comprehensive Guide"
description: "This tutorial provides an in-depth look at using LotusScript to interact with NotesView, covering accessing views, iterating through documents, performing full-text searches, and more, with practical examples."
pubDate: "2026-06-18T07:38:08+08:00"
lang: "en"
slug: "notesview-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesView (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
  - title: "Examples: NotesView class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESVIEW_CLASS.html"
  - title: "Locating documents within a view or folder in LotusScript classes"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCATING_DOCUMENTS_WITHIN_A_VIEW_OR_FOLDER.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesview-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, the `NotesView` class allows developers to access and manipulate views or folders within a database using LotusScript. With `NotesView`, you can retrieve documents, perform full-text searches, and manage various properties and methods associated with views.

## Accessing a View

To access a specific view within a database, you can use the `GetView` method of the `NotesDatabase` class. The following example demonstrates how to obtain a view named "Main View":

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView

Set db = session.CurrentDatabase
Set view = db.GetView("Main View")
```

Note that the `GetView` method returns a `NotesView` object representing the specified view.

## Iterating Through Documents in a View

Once you have a `NotesView`, you can iterate through all documents in the view using the `GetFirstDocument` and `GetNextDocument` methods. The following example demonstrates how to iterate through all documents in the view and print their subjects:

```lotusscript
Dim doc As NotesDocument
Set doc = view.GetFirstDocument

While Not (doc Is Nothing)
    Print doc.GetItemValue("Subject")(0)
    Set doc = view.GetNextDocument(doc)
Wend
```

In this example, the `GetFirstDocument` method returns the first document in the view, and the `GetNextDocument` method returns the document following the specified document.

## Performing Full-Text Searches

The `NotesView` class provides the `FTSearch` method, allowing you to perform full-text searches within the view. The following example demonstrates how to search for documents containing a specific keyword:

```lotusscript
Dim count As Integer
count = view.FTSearch("keyword")

If count > 0 Then
    Print "Found " & count & " matching documents."
Else
    Print "No matching documents found."
End If
```

The `FTSearch` method returns the number of matching documents and filters the view to include only those documents.

## Setting AutoUpdate for Views

To improve performance, it is recommended to set the `AutoUpdate` property of the view to `False` to prevent automatic updates while iterating through the view. You can manually call the `Refresh` method to update the view when needed.

```lotusscript
view.AutoUpdate = False
' ... perform operations ...
view.Refresh
```

## Conclusion

By leveraging the `NotesView` class, developers can effectively access and manipulate views within HCL Domino databases. Familiarity with its properties and methods will aid in developing more efficient and feature-rich applications. For more detailed information, refer to the [NotesView class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) and [NotesView class examples](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESVIEW_CLASS.html).
