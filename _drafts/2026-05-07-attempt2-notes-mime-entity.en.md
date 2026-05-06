---
title: "Guide to Handling MIME Content with NotesMIMEEntity"
description: "An in-depth look at using the NotesMIMEEntity class in LotusScript to access and manipulate MIME content within HCL Domino documents."
pubDate: "2026-05-07T07:23:17+08:00"
lang: "en"
slug: "notes-mime-entity"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesMIMEEntity class"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesmimeentity-class"
  - title: "Working with a MIME entity in LotusScript classes"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS.html"
  - title: "Examples: GetMIMEEntity method (NotesDocument - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=lotusscript-examples-getmimeentity-method-notesdocument"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesmimeentity-class" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-mime-entity
-->

## Introduction

In HCL Domino development, handling emails and other MIME (Multipurpose Internet Mail Extensions) content is a common requirement. LotusScript provides the `NotesMIMEEntity` class, enabling developers to access and manipulate MIME content within documents. This article explores how to use `NotesMIMEEntity` to read and create MIME content.

## Accessing MIME Content

To access MIME content within a document, first set the `ConvertMIME` property of the `NotesSession` to `False` to prevent automatic conversion of MIME content to rich text. Then, use the `GetMIMEEntity` method of the `NotesDocument` to retrieve the MIME entity.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("DocumentUNID")

session.ConvertMIME = False ' Prevent automatic MIME conversion
Set mime = doc.GetMIMEEntity

If Not mime Is Nothing Then
    ' Process MIME content
End If

session.ConvertMIME = True ' Restore automatic MIME conversion
```

In this code, the `GetMIMEEntity` method returns the top-level MIME entity of the document. If the document does not contain MIME content, the method returns `Nothing`.

## Reading MIME Content

Once you have a `NotesMIMEEntity` object, you can access its content and headers. For example, the following code displays the content type, subtype, charset, and encoding of the MIME entity.

```lotusscript
Dim contentType As String
Dim contentSubType As String
Dim charset As String
Dim encoding As Integer

contentType = mime.ContentType
contentSubType = mime.ContentSubType
charset = mime.Charset
encoding = mime.Encoding

MsgBox "Content Type: " & contentType & "/" & contentSubType & Chr(13) & _
       "Charset: " & charset & Chr(13) & _
       "Encoding: " & encoding
```

Additionally, you can use the `GetContentAsText` method to retrieve the text content of the MIME entity.

```lotusscript
Dim content As String
content = mime.GetContentAsText
MsgBox "Content: " & content
```

## Creating MIME Content

To create new MIME content within a document, use the `CreateMIMEEntity` method. The following example demonstrates how to create a simple MIME entity and set its content and headers.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity
Dim header As NotesMIMEHeader
Dim stream As NotesStream

Set db = session.CurrentDatabase
Set doc = db.CreateDocument

session.ConvertMIME = False ' Prevent automatic MIME conversion
Set mime = doc.CreateMIMEEntity("Body")

' Set headers
Set header = mime.CreateHeader("Content-Type")
Call header.SetHeaderVal("text/plain; charset=UTF-8")

' Set content
Set stream = session.CreateStream
Call stream.WriteText("This is the text content of the MIME message.")
Call mime.SetContentFromText(stream, "text/plain; charset=UTF-8", ENC_NONE)

' Save the document
doc.Save True, False

session.ConvertMIME = True ' Restore automatic MIME conversion
```

In this example, the `CreateMIMEEntity` method creates a MIME entity named "Body" within the document. Then, the `CreateHeader` method sets the "Content-Type" header, and the `SetContentFromText` method sets the content.

## Conclusion

The `NotesMIMEEntity` class provides powerful capabilities for developers to access and manipulate MIME content within HCL Domino documents using LotusScript. By following the correct procedures, you can effectively read, modify, and create MIME entities to meet various application requirements.

For more information, refer to the [NotesMIMEEntity class](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesmimeentity-class) and [Working with a MIME entity in LotusScript classes](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS.html).
