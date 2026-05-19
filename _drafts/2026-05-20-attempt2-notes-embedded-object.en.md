---
title: "Manipulating NotesEmbeddedObject with LotusScript: Embedding, Extracting, and Deleting"
description: "This tutorial demonstrates how to use LotusScript to manipulate NotesEmbeddedObject, including steps for embedding, extracting, and deleting embedded objects, with complete code examples."
pubDate: "2026-05-20T07:30:32+08:00"
lang: "en"
slug: "notes-embedded-object"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "NotesRichTextItem class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesRichTextItem.EmbedObject method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD_RICHTEXTITEM.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object
-->

## Introduction

In HCL Domino applications, embedding objects such as documents, images, or other files is a common requirement. LotusScript provides the `NotesEmbeddedObject` class, allowing developers to embed, extract, and delete objects within Notes documents. This article will detail how to manipulate `NotesEmbeddedObject` using LotusScript, complete with code examples.

## Embedding Objects

To embed an object into a Notes document, you can use the `EmbedObject` method of the `NotesRichTextItem` class. Below is an example of embedding a file into an existing document:

```lotusscript
Sub EmbedFileInDocument(doc As NotesDocument, filePath As String, fileName As String)
    Dim rtItem As NotesRichTextItem
    Set rtItem = doc.GetFirstItem("Body")
    If rtItem Is Nothing Then
        Set rtItem = New NotesRichTextItem(doc, "Body")
    End If
    Call rtItem.EmbedObject(EMBED_ATTACHMENT, "", filePath, fileName)
    Call doc.Save(True, False)
End Sub
```

In this example, the constant `EMBED_ATTACHMENT` indicates that the file is embedded as an attachment. `filePath` is the full path to the file to be embedded, and `fileName` is the name displayed in the Notes document. For more information on the `EmbedObject` method, refer to the [NotesRichTextItem.EmbedObject method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD_RICHTEXTITEM.html).

## Extracting Embedded Objects

To extract embedded objects from a Notes document, you can iterate through the `NotesRichTextItem`, locate `NotesEmbeddedObject` instances, and save them to disk. Here's an example:

```lotusscript
Sub ExtractEmbeddedObjects(doc As NotesDocument, savePath As String)
    Dim rtItem As NotesRichTextItem
    Dim embObj As NotesEmbeddedObject
    Dim embObjects As Variant
    Set rtItem = doc.GetFirstItem("Body")
    If Not rtItem Is Nothing Then
        embObjects = rtItem.EmbeddedObjects
        ForAll obj In embObjects
            Set embObj = obj
            Call embObj.ExtractFile(savePath & "\" & embObj.Name)
        End ForAll
    End If
End Sub
```

This code extracts all embedded objects in the document to the specified `savePath` directory. The `EmbeddedObjects` property returns a collection of `NotesEmbeddedObject` instances. For more details on `NotesEmbeddedObject`, see the [NotesEmbeddedObject class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html).

## Deleting Embedded Objects

To delete an embedded object, you can use the `Remove` method of the `NotesEmbeddedObject` class. Here's an example of deleting a specific embedded object:

```lotusscript
Sub RemoveEmbeddedObject(doc As NotesDocument, objectName As String)
    Dim rtItem As NotesRichTextItem
    Dim embObj As NotesEmbeddedObject
    Dim embObjects As Variant
    Set rtItem = doc.GetFirstItem("Body")
    If Not rtItem Is Nothing Then
        embObjects = rtItem.EmbeddedObjects
        ForAll obj In embObjects
            Set embObj = obj
            If embObj.Name = objectName Then
                Call embObj.Remove
                Exit ForAll
            End If
        End ForAll
        Call doc.Save(True, False)
    End If
End Sub
```

This code searches for an embedded object with the name `objectName` in the document and removes it. After deletion, remember to save the document to apply the changes.

## Conclusion

By following the examples above, you can use LotusScript to embed, extract, and delete embedded objects within HCL Domino applications. These operations are particularly useful when dealing with documents containing attachments or other embedded content. For more detailed information, refer to the [NotesRichTextItem class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html) and the [NotesEmbeddedObject class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html).
