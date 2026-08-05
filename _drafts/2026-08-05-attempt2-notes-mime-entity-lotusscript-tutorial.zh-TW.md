---
title: "使用 LotusScript 操作 NotesMIMEEntity：處理電子郵件的 MIME 結構"
description: "深入探討如何使用 LotusScript 的 NotesMIMEEntity 類別來讀取和修改電子郵件的 MIME 結構，包括存取 MIME 部分、修改標頭，以及保存變更。"
pubDate: "2026-08-05T08:05:42+08:00"
lang: "zh-TW"
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

在 HCL Domino 開發中，處理電子郵件的 MIME（多用途網際網路郵件擴充）結構是常見的需求。LotusScript 提供了 NotesMIMEEntity 類別，讓開發者能夠讀取和修改電子郵件的 MIME 內容。本文將介紹如何使用 NotesMIMEEntity 類別來存取和修改電子郵件的 MIME 結構。

## 存取電子郵件的 MIME 結構

要存取電子郵件的 MIME 結構，首先需要取得目標文件的 NotesDocument 物件，然後透過 `GetMIMEEntity` 方法取得 MIME 實體。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("目標文件的 UNID")
Set mime = doc.GetMIMEEntity
```

`GetMIMEEntity` 方法返回文件的 MIME 實體，您可以透過此物件來存取和修改 MIME 內容。

## 修改 MIME 標頭

您可以使用 NotesMIMEHeader 類別來存取和修改 MIME 標頭。例如，修改 "Subject" 標頭：

```lotusscript
Dim header As NotesMIMEHeader
Set header = mime.GetHeader("Subject")
Call header.SetHeader("新的主題")
```

`GetHeader` 方法返回指定名稱的 MIME 標頭，`SetHeader` 方法用於設定新的標頭值。

## 保存變更

修改 MIME 結構後，需要保存變更：

```lotusscript
Call doc.Save(True, False)
```

`Save` 方法的第一個參數為 True，表示強制保存；第二個參數為 False，表示不創建新版本。

## 參考資料

- [NotesMIMEEntity 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS.html)
- [NotesMIMEHeader 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html)
- [NotesMIMEHeader.SetHeader 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SETHEADER_METHOD_MIMEHEADER.html)

透過上述方法，您可以使用 LotusScript 來存取和修改電子郵件的 MIME 結構，滿足各種開發需求。
