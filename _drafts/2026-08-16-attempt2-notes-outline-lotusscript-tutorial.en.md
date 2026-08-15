---
title: "Managing NotesOutline with LotusScript: Creating and Handling Outlines"
description: "This tutorial demonstrates how to use the NotesOutline class in LotusScript to create and manage outlines in a Domino database, including creating outlines, adding entries, setting properties, and saving changes."
pubDate: "2026-08-16T07:22:22+08:00"
lang: "en"
slug: "notes-outline-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "CreateEntry (NotesOutline - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEENTRY_METHOD_OUTLINE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-outline-lotusscript-tutorial
-->

In HCL Domino Designer, an outline is a structure used to organize and navigate the contents of a database. With the NotesOutline class in LotusScript, developers can programmatically create and manage outlines. This article will guide you through the process of using the NotesOutline class to create and manage outlines.

## 1. Creating a New Outline

To create a new outline in the current database, use the `CreateOutline` method, providing the name of the outline.

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Set db = session.CurrentDatabase
    Set outline = db.CreateOutline("MyOutline")
    MsgBox "Outline created: " & outline.Name
End Sub
```

In this code, the `CreateOutline` method creates a new outline named "MyOutline" and displays its name.

## 2. Adding Entries to the Outline

After creating an outline, you can add entries using the `CreateEntry` method. This method allows you to specify the name of the entry and optional parameters to set its position and level.

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Dim entry As NotesOutlineEntry
    Set db = session.CurrentDatabase
    Set outline = db.GetOutline("MyOutline")
    Set entry = outline.CreateEntry("Home")
    Call outline.Save
    MsgBox "Entry added: " & entry.Label
End Sub
```

In this example, the `CreateEntry` method adds an entry named "Home" to the "MyOutline" outline and saves the changes.

## 3. Setting Entry Properties

Each outline entry has several properties that can be set, such as label, URL, visibility, etc. You can use the corresponding property methods to set these values.

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Dim entry As NotesOutlineEntry
    Set db = session.CurrentDatabase
    Set outline = db.GetOutline("MyOutline")
    Set entry = outline.CreateEntry("About Us")
    entry.URL = "/aboutus"
    entry.IsHidden = False
    Call outline.Save
    MsgBox "Entry added: " & entry.Label & ", URL: " & entry.URL
End Sub
```

This code adds an entry named "About Us" to the "MyOutline" outline, sets its URL to "/aboutus", and ensures the entry is visible.

## 4. Saving Changes

After making any modifications to the outline, you must call the `Save` method to persist the changes. If not saved, all modifications will be lost when the program ends.

```lotusscript
Call outline.Save
```

By following these steps, developers can use the NotesOutline class in LotusScript to create and manage outlines in a Domino database, enhancing the organization and navigability of applications.
