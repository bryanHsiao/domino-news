---
title: "Guide to Handling Embedded Objects with NotesEmbeddedObject Class"
description: "A comprehensive guide on using the NotesEmbeddedObject class in HCL Domino to embed and manage objects, with practical LotusScript examples."
pubDate: "2026-08-15T07:24:03+08:00"
lang: "en"
slug: "notes-embedded-object"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "Embedding data in a Notes document"
    url: "https://help.hcl-software.com/notes/12.0.2/client/sh_embed_data_in_doc_c.html"
  - title: "EmbedObject method"
    url: "https://www.ibm.com/docs/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EMBEDOBJECT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-embedded-object" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object
-->

## Introduction

In HCL Domino, the `NotesEmbeddedObject` class allows developers to embed objects, object links, or file attachments within rich text fields of Notes documents. This functionality is particularly useful for integrating external content into applications.

## Understanding Embedded Objects

An embedded object is a copy of data from another application, stored within a Notes document. These objects can be complete file attachments, embedded application objects (such as Excel worksheets), or object links. It's important to note that embedded objects do not maintain a link to the original file; therefore, changes to the original file are not reflected in the embedded object.

## Embedding Objects Using LotusScript

Here are the steps to embed an object into a rich text field of a Notes document using LotusScript:

1. **Initialize NotesRichTextItem**:

   ```lotusscript
   Dim rtItem As NotesRichTextItem
   Set rtItem = doc.GetFirstItem("Body")
   ```

2. **Embed the Object**:

   Use the `EmbedObject` method to embed the object into the rich text field. The syntax is as follows:

   ```lotusscript
   Set embeddedObject = rtItem.EmbedObject(EMBED_OBJECT, "ClassName", "FilePath")
   ```

   - `EMBED_OBJECT`: Constant indicating that an object is to be embedded.
   - `ClassName`: String specifying the name of the application, e.g., "Excel.Sheet".
   - `FilePath`: String specifying the path to the file to be embedded.

   For example, to embed an Excel worksheet:

   ```lotusscript
   Set embeddedObject = rtItem.EmbedObject(EMBED_OBJECT, "Excel.Sheet", "C:\path\to\file.xlsx")
   ```

3. **Save the Document**:

   ```lotusscript
   Call doc.Save(True, False)
   ```

A complete example:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embeddedObject As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Main"
Set rtItem = New NotesRichTextItem(doc, "Body")
Set embeddedObject = rtItem.EmbedObject(EMBED_OBJECT, "Excel.Sheet", "C:\path\to\file.xlsx")
Call doc.Save(True, False)
```

## Accessing Embedded Objects

To access embedded objects, use the `EmbeddedObjects` property of `NotesRichTextItem`. The following example lists all embedded objects in a rich text field:

```lotusscript
Dim rtItem As NotesRichTextItem
Dim embeddedObject As NotesEmbeddedObject

Set rtItem = doc.GetFirstItem("Body")
Forall obj In rtItem.EmbeddedObjects
    Set embeddedObject = obj
    MsgBox "Embedded Object Name: " & embeddedObject.Name
End Forall
```

## Important Considerations

- **Object Name**: The name of the embedded object can be retrieved using the `Name` property of `NotesEmbeddedObject`.
- **Object Type**: Determine the type of the embedded object using the `Type` property, such as `EMBED_ATTACHMENT`, `EMBED_OBJECT`, or `EMBED_OBJECTLINK`.
- **Activating Embedded Objects**: Use the `Activate` method to launch the embedded object, opening the corresponding application for editing.

```lotusscript
Call embeddedObject.Activate(True)
```

## Conclusion

By utilizing the `NotesEmbeddedObject` class, developers can effectively embed and manage various objects within HCL Domino, enhancing the functionality and interactivity of applications. For more detailed information and examples, refer to the [NotesEmbeddedObject class examples](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html) and [Embedding data in a Notes document](https://help.hcl-software.com/notes/12.0.2/client/sh_embed_data_in_doc_c.html).
