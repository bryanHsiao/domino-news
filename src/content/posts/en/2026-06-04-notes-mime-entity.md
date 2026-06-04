---
title: "NotesMIMEEntity + NotesMIMEHeader: Parsing Email MIME Structure in LotusScript"
description: "Incoming Domino mail is a nested MIME tree — HTML body, plain-text fallback, attachments, and inline images each live in separate nodes. LotusScript uses NotesMIMEEntity for each node and NotesMIMEHeader for its header fields. This article covers the ConvertMIME=False prerequisite, identifying node types with ContentType/ContentSubType, walking the tree with GetFirstChildEntity and GetNextSibling, extracting body text with GetContentAsText, reading header values with GetNthHeader/GetSomeHeaders, building a MIME message from scratch with CreateMIMEEntity, and a practical pattern for distinguishing attachments from body content."
pubDate: 2026-06-04T07:30:00+08:00
lang: en
slug: notes-mime-entity
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesMIMEEntity class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS_OVERVIEW.html"
  - title: "NotesMIMEHeader class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html"
  - title: "GetMIMEEntity method (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETMIMEENTITY_METHOD.html"
relatedJava: ["MIMEEntity", "MIMEHeader"]
relatedSsjs: []
cover: "/covers/notes-mime-entity.webp"
coverStyle: "risograph"
---

Your agent needs to parse incoming mail — extract the HTML body, list attachments, or read a specific header like `Reply-To` or `X-Mailer`. You open the `NotesDocument`, call `GetItemValue("Body")`, and get empty or mangled text.

The problem: modern email is a **nested MIME tree** — HTML body, plain-text fallback, attachments, and inline images each live in separate nodes. Domino converts this tree to its proprietary rich-text format by default. To access raw MIME data, you have to tell Domino to stop converting, then walk the tree with `NotesMIMEEntity`.

---

## TL;DR

- **`ConvertMIME = False` is a prerequisite** — the default True causes MIME-to-rich-text conversion; `GetMIMEEntity` then returns `Nothing`
- [**`NotesMIMEEntity`**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS_OVERVIEW.html) represents one node in the MIME tree; `ContentType` and `ContentSubType` identify what it contains
- **Navigation**: `GetFirstChildEntity` descends into children; `GetNextSibling` moves across siblings
- **`NotesMIMEHeader`** represents one header field (e.g. `Content-Type`, `Content-Disposition`)
- Available since **Release 5.0.2** — supported in all current versions
- Set `ConvertMIME` back to `True` when done — leaving it `False` causes problems when saving documents

---

## Getting the root MIME entity

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

' Critical: disable auto-conversion first
session.ConvertMIME = False

' Open a mail document
Dim doc As NotesDocument
Set doc = db.GetDocumentByUNID("...")

' Get the root MIME node
Dim mime As NotesMIMEEntity
Set mime = doc.GetMIMEEntity()

If mime Is Nothing Then
    Print "No MIME content (or ConvertMIME was still True)"
Else
    Print "Root Content-Type: " & mime.ContentType & "/" & mime.ContentSubType
End If

session.ConvertMIME = True  ' Restore
```

A document with the item `$NoteHasNativeMIME = "1"` contains native MIME content.

---

## The structure of a MIME tree

A typical HTML email with an attachment looks like this:

```
multipart/mixed                ← root
├── multipart/alternative      ← child (HTML + plain-text alternative)
│   ├── text/plain             ← plain-text fallback
│   └── text/html              ← HTML body
└── application/pdf            ← attachment
```

Walk it with `GetFirstChildEntity` (descend) and `GetNextSibling` (across):

```lotusscript
' Recursively walk the MIME tree
Sub WalkMIME(entity As NotesMIMEEntity, level As Integer)
    Dim indent As String
    indent = Space(level * 2)
    Print indent & entity.ContentType & "/" & entity.ContentSubType

    Dim child As NotesMIMEEntity
    Set child = entity.GetFirstChildEntity()
    Do Until child Is Nothing
        Call WalkMIME(child, level + 1)
        Set child = child.GetNextSibling()
    Loop
End Sub

' Call it
session.ConvertMIME = False
Dim mime As NotesMIMEEntity
Set mime = doc.GetMIMEEntity()
Call WalkMIME(mime, 0)
session.ConvertMIME = True
```

---

## Extracting the body text

Once you find a `text/html` or `text/plain` node, `GetContentAsText` returns the decoded content:

```lotusscript
Function GetHTMLBody(rootEntity As NotesMIMEEntity) As String
    If rootEntity.ContentType = "text" And rootEntity.ContentSubType = "html" Then
        GetHTMLBody = rootEntity.GetContentAsText()
        Exit Function
    End If
    ' Recurse into children
    Dim child As NotesMIMEEntity
    Set child = rootEntity.GetFirstChildEntity()
    Do Until child Is Nothing
        Dim result As String
        result = GetHTMLBody(child)
        If result <> "" Then
            GetHTMLBody = result
            Exit Function
        End If
        Set child = child.GetNextSibling()
    Loop
End Function
```

---

## Identifying attachments

An attachment node has a `Content-Disposition: attachment` header:

```lotusscript
Sub ListAttachments(entity As NotesMIMEEntity)
    Dim dispHeader As NotesMIMEHeader
    Set dispHeader = entity.GetNthHeader("Content-Disposition")
    If Not (dispHeader Is Nothing) Then
        If InStr(LCase(dispHeader.HeaderVal), "attachment") > 0 Then
            Print "Attachment: " & entity.ContentType & "/" & entity.ContentSubType
        End If
    End If
    ' Recurse
    Dim child As NotesMIMEEntity
    Set child = entity.GetFirstChildEntity()
    Do Until child Is Nothing
        Call ListAttachments(child)
        Set child = child.GetNextSibling()
    Loop
End Sub
```

---

## Reading header values

Each node's headers are accessible through [`NotesMIMEHeader`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html) objects:

```lotusscript
' Get a specific header
Dim ctHeader As NotesMIMEHeader
Set ctHeader = mime.GetNthHeader("Content-Type")
If Not (ctHeader Is Nothing) Then
    Print "Content-Type: " & ctHeader.HeaderVal
    Print "  charset param: " & ctHeader.getParamVal("charset")
End If

' Get multiple headers as a single string
Dim someHeaders As String
someHeaders = mime.GetSomeHeaders("Content-Type, Content-Transfer-Encoding")
Print someHeaders
```

Commonly useful headers: `Content-Type`, `Content-Disposition`, `Content-Transfer-Encoding`, `Content-ID` (for inline images).

---

## Building a MIME message from scratch with CreateMIMEEntity

The [`CreateMIMEEntity`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEMIMEENTITY_METHOD.html) method on NotesDocument creates the root node:

```lotusscript
session.ConvertMIME = False

Dim doc As NotesDocument
Set doc = db.CreateDocument()
doc.Form = "Memo"
doc.SendTo = "recipient@example.com"
doc.Subject = "MIME test message"

' Create the root node
Dim root As NotesMIMEEntity
Set root = doc.CreateMIMEEntity("Body")
root.ContentType = "multipart"
root.ContentSubType = "alternative"

' Add plain-text child
Dim textPart As NotesMIMEEntity
Set textPart = root.CreateChildEntity()
Call textPart.SetContentFromText("Plain text version", "text/plain;charset=UTF-8", ENC_NONE)

' Add HTML child
Dim htmlPart As NotesMIMEEntity
Set htmlPart = root.CreateChildEntity()
Call htmlPart.SetContentFromText("<p>This is the <b>HTML</b> version</p>", "text/html;charset=UTF-8", ENC_NONE)

Call doc.Save(True, False)
session.ConvertMIME = True
```

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesMIMEEntity` / `NotesMIMEHeader` |
| Java | `lotus.domino.MIMEEntity` / `MIMEHeader` (drop the `Notes` prefix; `.recycle()` when done) |
| SSJS | `MIMEEntity` / `MIMEHeader` (callable in XPages, same API surface) |
