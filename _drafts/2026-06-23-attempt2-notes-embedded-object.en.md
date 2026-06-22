---
title: "NotesEmbeddedObject: Handling Embedded Objects and Attachments in LotusScript"
description: "A comprehensive guide on using the NotesEmbeddedObject class in LotusScript to manage embedded objects, object links, and attachments, complete with practical examples."
pubDate: "2026-06-23T07:35:08+08:00"
lang: "en"
slug: "notes-embedded-object"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "EmbedObject (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html"
  - title: "Examples: NotesEmbeddedObject class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object
-->

## Introduction

In HCL Domino development, managing embedded objects, object links, and file attachments is a common requirement. LotusScript provides the `NotesEmbeddedObject` class, enabling developers to effectively handle these elements. This article explores how to utilize this class, accompanied by practical examples.

## Overview of the NotesEmbeddedObject Class

The `NotesEmbeddedObject` class represents one of the following:

- An embedded object
- An object link
- A file attachment

This class includes various properties and methods that allow developers to access and manipulate information and functionalities related to these elements.

## Creating Embedded Objects or Attachments

To embed an object or attachment in a rich text item, use the `EmbedObject` method of the `NotesRichTextItem` class. The syntax is as follows:

```lotusscript
Set notesEmbeddedObject = notesRichTextItem.EmbedObject(type%, class$, source$, [name$])
```

Parameter details:

- `type%`: Specifies the type of object to create. Possible values include:
  - `EMBED_ATTACHMENT` (1454): Attachment
  - `EMBED_OBJECT` (1453): Embedded object
  - `EMBED_OBJECTLINK` (1452): Object link
- `class$`: When `type%` is `EMBED_OBJECT` and you want to create an embedded object from an application, specify the application name (e.g., "1-2-3 Worksheet") and set `source$` to an empty string (""). For other cases, set to an empty string ("").
- `source$`: When `type%` is `EMBED_OBJECT` and you want to create an embedded object from a file, specify the file name and set `class$` to an empty string (""). For `EMBED_ATTACHMENT` or `EMBED_OBJECTLINK`, specify the file name to attach or link.
- `name$`: Optional. Specifies the name by which you can reference the embedded object later.

The following example demonstrates how to embed an attachment in a rich text item:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Main"
Set rtItem = New NotesRichTextItem(doc, "Body")
Set embObj = rtItem.EmbedObject(EMBED_ATTACHMENT, "", "C:\path\to\file.txt", "file.txt")
doc.Save True, True
```

In this example, the `EmbedObject` method is used to embed the file located at `C:\path\to\file.txt` as an attachment in the `Body` rich text item, naming it "file.txt".

## Accessing Embedded Objects or Attachments

To access existing embedded objects or attachments, you can use the following methods:

- If you know the name and the rich text item containing it, use the `GetEmbeddedObject` method of `NotesRichTextItem`.
- To access all embedded objects, object links, and attachments in a specific rich text item, use the `EmbeddedObjects` property of `NotesRichTextItem`.
- To access all embedded objects and object links in a specific document, including those not contained within a particular rich text item, use the `EmbeddedObjects` property of `NotesDocument`.

The following example demonstrates how to list all embedded objects in a document:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Forall o In doc.EmbeddedObjects
    Set embObj = o
    MsgBox "Name: " & embObj.Name & Chr(10) & "Type: " & embObj.Type
End Forall
```

In this example, the `EmbeddedObjects` property returns all embedded objects in the document, displaying their names and types.

## Manipulating Embedded Objects or Attachments

The `NotesEmbeddedObject` class provides several methods to manipulate embedded objects or attachments:

- `Activate`: Loads an embedded object or object link.
- `DoVerb`: Executes a specific action on an embedded object.
- `ExtractFile`: Copies an attachment to disk.
- `Remove`: Permanently deletes an embedded object, object link, or attachment.

The following example demonstrates how to extract an attachment to disk:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Set embObj = doc.GetAttachment("file.txt")
Call embObj.ExtractFile("C:\path\to\save\file.txt")
```

In this example, the `ExtractFile` method is used to extract the attachment named "file.txt" to the specified disk path.

## Conclusion

By utilizing the `NotesEmbeddedObject` class, developers can effectively manage embedded objects, object links, and attachments in LotusScript. Familiarity with its properties and methods will aid in developing more robust and flexible HCL Domino applications.

For more information, refer to the [official documentation on the NotesEmbeddedObject class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html) and the [EmbedObject method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html).
