---
title: "NotesOutline: Managing View Navigators in LotusScript"
description: "Explore the NotesOutline class to learn how to create and manage view navigators in LotusScript, enhancing your application's user experience."
pubDate: "2026-05-17T07:22:59+08:00"
lang: "en"
slug: "notes-outline"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "NotesOutline - LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESOUTLINE_CLASS_EX.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-outline
-->

## What is NotesOutline?

In HCL Domino applications, the **NotesOutline** class allows developers to programmatically access and manage outlines, which are often used to provide navigation structures within applications. With **NotesOutline**, you can create, modify, and delete outline entries, thereby enhancing the user experience of your application.

## Creating a New Outline

To create a new outline in LotusScript, you can use the `CreateOutline` method of the **NotesDatabase** class. Here's an example of creating an outline named "MainOutline":

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline

Set db = session.CurrentDatabase
Set outline = db.CreateOutline("MainOutline")
Call outline.Save
```

In this code, we first obtain a reference to the current database, then use the `CreateOutline` method to create a new outline, and finally call the `Save` method to store it.

## Adding Outline Entries

After creating an outline, you can add entries using the **NotesOutlineEntry** class. The following example demonstrates how to add an entry that points to a specific view:

```lotusscript
Dim entry As NotesOutlineEntry
Set entry = outline.CreateEntry("View Entry", True)
Call entry.SetView(db, "ViewName")
Call outline.Save
```

In this example, we create an entry named "View Entry" and link it to a view named "ViewName". The `True` parameter indicates that the entry is a main entry.

## Modifying Outline Entries

You can modify existing entries through the properties and methods of **NotesOutlineEntry**. For instance, the following code changes the label of an entry to "Updated Entry":

```lotusscript
entry.Label = "Updated Entry"
Call outline.Save
```

## Deleting Outline Entries

To delete an outline entry, you can use the `RemoveEntry` method:

```lotusscript
Call outline.RemoveEntry(entry)
Call outline.Save
```

## Summary

By utilizing the **NotesOutline** and **NotesOutlineEntry** classes, you can effectively create and manage outlines in LotusScript, thereby enhancing the navigation structure and user experience of your HCL Domino applications. For more detailed information, refer to the official documentation for the [NotesOutline class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html) and the [NotesOutlineEntry class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html).
