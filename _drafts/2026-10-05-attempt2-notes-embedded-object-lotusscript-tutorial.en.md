---
title: "A Guide to Using NotesEmbeddedObject in LotusScript"
description: "An in-depth look at how to use the NotesEmbeddedObject class in LotusScript to handle embedded objects, object links, and file attachments, including properties, methods, and implementation examples."
pubDate: "2026-10-05T09:43:31+08:00"
lang: "en"
slug: "notes-embedded-object-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "Working with attachments and embedded objects in LotusScript classes"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript"
  - title: "EmbedObject (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_EMBEDOBJECT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript&utm_source=openai" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, LotusScript offers robust capabilities for handling embedded objects, object links, and file attachments. The `NotesEmbeddedObject` class is central to these operations, allowing developers to embed and manage various objects within Notes documents. This article provides a detailed guide on using the `NotesEmbeddedObject` class, covering its properties, methods, and implementation examples.

## Overview of the NotesEmbeddedObject Class

The `NotesEmbeddedObject` class represents one of the following:

- **Embedded Object**: An object directly embedded within a Notes document.
- **Object Link**: A link to an external object.
- **File Attachment**: A file attached to a Notes document.

It's important to note that embedded objects and object links are not supported on UNIX and Macintosh platforms; however, file attachments are supported. ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html?utm_source=openai))

## Creating an Embedded Object

To create an embedded object within a rich text item of a Notes document, you can use the `EmbedObject` method of the `NotesRichTextItem` class. Here's an example of creating an embedded object:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = New NotesRichTextItem(doc, "Body")

' Create an embedded object
Set embObj = rtItem.EmbedObject(EMBED_OBJECT, "Excel.Sheet", "C:\path\to\file.xlsx", "EmbeddedExcel")

Call doc.Save(True, False)
```

In this example, the parameters for the `EmbedObject` method are as follows:

- `EMBED_OBJECT`: Specifies that an embedded object is to be created.
- `"Excel.Sheet"`: Specifies the application class for creating the object.
- `"C:\path\to\file.xlsx"`: Specifies the path to the file to be embedded.
- `"EmbeddedExcel"`: Specifies the name of the embedded object. ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_EMBEDOBJECT_METHOD.html?utm_source=openai))

## Accessing Embedded Objects

To access embedded objects within a Notes document, you can use the `EmbeddedObjects` property of the `NotesRichTextItem` or `NotesDocument` class. Here's an example of accessing embedded objects:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject
Dim embObjs As Variant

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Set rtItem = doc.GetFirstItem("Body")

' Get all embedded objects
embObjs = rtItem.EmbeddedObjects

Forall obj In embObjs
    Set embObj = obj
    Msgbox "Embedded Object Name: " & embObj.Name
End Forall
```

In this example, the `EmbeddedObjects` property returns an array of all embedded objects, which can then be iterated over to access each object's properties. ([ibm.com](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript&utm_source=openai))

## Manipulating Embedded Objects

The `NotesEmbeddedObject` class provides several methods for manipulating embedded objects, including:

- **Activate**: Activates the embedded object.
- **DoVerb**: Executes an action on the embedded object.
- **ExtractFile**: Extracts the embedded object to a file.
- **Remove**: Removes the embedded object from the rich text item.

Here's an example of using the `ExtractFile` method to extract an embedded object:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject
Dim embObjs As Variant

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Set rtItem = doc.GetFirstItem("Body")

' Get all embedded objects
embObjs = rtItem.EmbeddedObjects

Forall obj In embObjs
    Set embObj = obj
    If embObj.Type = EMBED_ATTACHMENT Then
        Call embObj.ExtractFile("C:\path\to\save\" & embObj.Name)
    End If
End Forall
```

In this example, the `ExtractFile` method extracts the embedded object and saves it to the specified path. ([ibm.com](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript&utm_source=openai))

## Conclusion

The `NotesEmbeddedObject` class provides developers with powerful capabilities for handling embedded objects, object links, and file attachments within Notes documents. By understanding its properties and methods, developers can effectively create, access, and manipulate these objects, enhancing the functionality and flexibility of their applications.
