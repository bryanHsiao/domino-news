---
title: "Manipulating NotesMIMEEntity with LotusScript: Handling Email MIME Structures"
description: "A comprehensive guide on using LotusScript's NotesMIMEEntity class to read and modify the MIME structure of emails, including accessing MIME parts, modifying headers, and saving changes."
pubDate: "2026-08-05T08:05:42+08:00"
lang: "en"
slug: "notes-mime-entity-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Notes Client"
sources:
  - title: "NotesMIMEEntity class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html"
  - title: "NotesMIMEHeader class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html"
  - title: "NotesMIMEHeader.SetHeader method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SETHEADER_METHOD_MIMEHEADER.html"
draft: true
---
<!--
REJECTED DRAFT — URL gate FAILED — 2 source URL(s) are not reachable:
  - 200 https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html
  - 200 https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SETHEADER_METHOD_MIMEHEADER.html
attempt: 2
slug: notes-mime-entity-lotusscript-tutorial
-->

In HCL Domino development, handling the MIME (Multipurpose Internet Mail Extensions) structure of emails is a common requirement. LotusScript provides the NotesMIMEEntity class, enabling developers to read and modify the MIME content of emails. This article will guide you through using the NotesMIMEEntity class to access and modify the MIME structure of emails.

## Accessing the MIME Structure of an Email

To access the MIME structure of an email, first obtain the target document's NotesDocument object, and then use the `GetMIMEEntity` method to retrieve the MIME entity.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("Target document's UNID")
Set mime = doc.GetMIMEEntity
```

The `GetMIMEEntity` method returns the document's MIME entity, allowing you to access and modify the MIME content.

## Modifying MIME Headers

You can use the NotesMIMEHeader class to access and modify MIME headers. For example, to modify the "Subject" header:

```lotusscript
Dim header As NotesMIMEHeader
Set header = mime.GetHeader("Subject")
Call header.SetHeader("New Subject")
```

The `GetHeader` method returns the MIME header with the specified name, and the `SetHeader` method sets a new value for the header.

## Saving Changes

After modifying the MIME structure, save the changes:

```lotusscript
Call doc.Save(True, False)
```

The `Save` method's first parameter is True, indicating a forced save; the second parameter is False, indicating not to create a new version.

## References

- [NotesMIMEEntity class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html)
- [NotesMIMEHeader class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html)
- [NotesMIMEHeader.SetHeader method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SETHEADER_METHOD_MIMEHEADER.html)

By following the methods outlined above, you can use LotusScript to access and modify the MIME structure of emails, catering to various development needs.
