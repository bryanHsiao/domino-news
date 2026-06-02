---
title: "Handling Email MIME Content with NotesMIMEEntity in LotusScript"
description: "A comprehensive guide on using the NotesMIMEEntity class in LotusScript to read and modify email MIME content, including parsing multipart messages and modifying MIME headers."
pubDate: "2026-06-03T07:38:38+08:00"
lang: "en"
slug: "notes-mime-entity"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Notes Client"
sources:
  - title: "NotesMIMEEntity class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html"
  - title: "NotesMIMEHeader class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html"
  - title: "NotesStream class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html" was already cited by [lotusscript-view-to-excel] on 2026-05-26. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-mime-entity
-->

In HCL Domino's LotusScript, the `NotesMIMEEntity` class provides robust capabilities for reading and modifying the MIME (Multipurpose Internet Mail Extensions) content of emails. This is particularly useful for applications that need to handle multipart messages, attachments, or custom MIME headers. This guide will walk you through using `NotesMIMEEntity` to parse and modify email MIME content.

## Reading MIME Content

To read the MIME content of an email, first obtain a `NotesDocument`, then use the `GetMIMEEntity` method to retrieve the `NotesMIMEEntity` object.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("<document UNID>")
Set mime = doc.GetMIMEEntity

If Not mime Is Nothing Then
    ' Process MIME content
End If
```

## Parsing Multipart Messages

Emails may contain multiple parts, such as plain text and HTML versions. You can traverse these parts using the `GetNextEntity` method.

```lotusscript
Dim childMime As NotesMIMEEntity
Set childMime = mime.GetFirstEntity

While Not childMime Is Nothing
    ' Process each part
    Set childMime = mime.GetNextEntity
Wend
```

## Modifying MIME Headers

You can read and modify MIME headers using the `NotesMIMEHeader` class. For example, to modify the subject header:

```lotusscript
Dim header As NotesMIMEHeader
Set header = mime.GetHeader("Subject")

If Not header Is Nothing Then
    Call header.SetHeaderVal("New Subject")
End If
```

## Saving Changes

After modifying the MIME content, save the changes back to the document.

```lotusscript
Call mime.EncodeContent(ENC_NONE)
Call doc.Save(True, False)
```

## Conclusion

The `NotesMIMEEntity` class offers powerful functionality for reading and modifying email MIME content in LotusScript. By understanding and utilizing these methods, you can effectively handle multipart email content and custom headers. For more detailed information, refer to the official documentation for [NotesMIMEEntity class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html) and [NotesMIMEHeader class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html).
