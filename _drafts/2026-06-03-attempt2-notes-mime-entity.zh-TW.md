---
title: "使用 NotesMIMEEntity 處理電子郵件的 MIME 內容"
description: "深入探討如何在 LotusScript 中使用 NotesMIMEEntity 類別來讀取和修改電子郵件的 MIME 內容，包括解析多部分郵件和修改 MIME 標頭。"
pubDate: "2026-06-03T07:38:38+08:00"
lang: "zh-TW"
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

在 HCL Domino 的 LotusScript 中，`NotesMIMEEntity` 類別提供了強大的功能，讓開發者能夠讀取和修改電子郵件的 MIME（多用途網際網路郵件擴充）內容。這對於需要處理多部分郵件、附件或自訂 MIME 標頭的應用程式特別有用。以下將介紹如何使用 `NotesMIMEEntity` 來解析和修改電子郵件的 MIME 內容。

## 讀取 MIME 內容

要讀取電子郵件的 MIME 內容，首先需要獲取 `NotesDocument`，然後使用 `GetMIMEEntity` 方法來取得 `NotesMIMEEntity` 對象。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("<文件UNID>")
Set mime = doc.GetMIMEEntity

If Not mime Is Nothing Then
    ' 處理 MIME 內容
End If
```

## 解析多部分郵件

電子郵件可能包含多個部分，例如純文字和 HTML 版本。可以使用 `GetNextEntity` 方法來遍歷這些部分。

```lotusscript
Dim childMime As NotesMIMEEntity
Set childMime = mime.GetFirstEntity

While Not childMime Is Nothing
    ' 處理每個部分
    Set childMime = mime.GetNextEntity
Wend
```

## 修改 MIME 標頭

可以使用 `NotesMIMEHeader` 類別來讀取和修改 MIME 標頭。例如，修改主題標頭：

```lotusscript
Dim header As NotesMIMEHeader
Set header = mime.GetHeader("Subject")

If Not header Is Nothing Then
    Call header.SetHeaderVal("新的主題")
End If
```

## 儲存修改

在修改 MIME 內容後，需要將更改儲存回文件。

```lotusscript
Call mime.EncodeContent(ENC_NONE)
Call doc.Save(True, False)
```

## 結論

`NotesMIMEEntity` 類別提供了強大的功能，讓開發者能夠在 LotusScript 中讀取和修改電子郵件的 MIME 內容。透過理解和使用這些方法，可以更有效地處理電子郵件的多部分內容和自訂標頭。更多詳細資訊，請參閱 [NotesMIMEEntity 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html) 和 [NotesMIMEHeader 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html) 的官方文件。
