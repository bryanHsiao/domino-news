---
title: "Working with NotesOutline in LotusScript: A Comprehensive Guide"
description: "Explore how to programmatically create, modify, and manage outlines and their entries in HCL Domino using LotusScript."
pubDate: "2026-06-06T07:32:24+08:00"
lang: "en"
slug: "notes-outline-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "Examples: CreateEntry method"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_CREATEENTRY_METHOD_EX.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-outline-lotusscript
-->

## Introduction

In HCL Domino, an outline (NotesOutline) serves as a navigational structure that allows developers to organize and present elements within a database, such as views, documents, and forms. Using LotusScript, developers can programmatically create, modify, and manage these outlines and their entries (NotesOutlineEntry).

## Creating a New Outline

To create a new outline in a database, use the `CreateOutline` method. The following example demonstrates how to create an outline named "MainOutline" in the current database:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline

Set db = session.CurrentDatabase
Set outline = db.CreateOutline("MainOutline")
```

## Accessing an Existing Outline

To access an existing outline, use the `GetOutline` method:

```lotusscript
Set outline = db.GetOutline("ExistingOutline")
```

## Adding Entries to an Outline

Use the `CreateEntry` method to add new entries to an outline. The following example demonstrates how to add an entry named "First Entry":

```lotusscript
Dim entry As NotesOutlineEntry
Set entry = outline.CreateEntry("First Entry")
```

You can also use the `CreateEntryFrom` method to create a new entry based on an existing one.

## Setting Entry Properties

After creating an entry, you can set various properties such as label, URL, and type. For example, to set the entry's URL:

```lotusscript
entry.SetURL("http://www.example.com")
```

## Saving the Outline

After making modifications to the outline, remember to save the changes using the `Save` method:

```lotusscript
Call outline.Save
```

## Conclusion

By leveraging LotusScript, developers can effectively manipulate outlines in HCL Domino, enhancing the organization and presentation of database content. For more detailed information, refer to the [NotesOutline class documentation](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html) and [NotesOutlineEntry class documentation](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESOUTLINEENTRY_CLASS.html).
