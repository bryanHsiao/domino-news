---
title: "使用 NotesMIMEEntity 處理 MIME 內容的指南"
description: "深入探討如何在 LotusScript 中使用 NotesMIMEEntity 類別來存取和操作 HCL Domino 文件中的 MIME 內容。"
pubDate: "2026-05-07T07:23:17+08:00"
lang: "zh-TW"
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

## 簡介

在 HCL Domino 開發中，處理電子郵件和其他 MIME（多用途網際網路郵件擴充）內容是常見的需求。LotusScript 提供了 `NotesMIMEEntity` 類別，讓開發者能夠存取和操作文件中的 MIME 內容。本文將介紹如何使用 `NotesMIMEEntity` 來讀取和建立 MIME 內容。

## 存取 MIME 內容

要存取文件中的 MIME 內容，首先需要設定 `NotesSession` 的 `ConvertMIME` 屬性為 `False`，以防止系統自動將 MIME 內容轉換為富文本。接著，可以使用 `NotesDocument` 的 `GetMIMEEntity` 方法來取得 MIME 實體。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("文檔UNID")

session.ConvertMIME = False ' 禁止自動轉換 MIME
Set mime = doc.GetMIMEEntity

If Not mime Is Nothing Then
    ' 處理 MIME 內容
End If

session.ConvertMIME = True ' 恢復自動轉換 MIME
```

在上述程式碼中，`GetMIMEEntity` 方法返回文件的頂層 MIME 實體。如果文件不包含 MIME 內容，該方法將返回 `Nothing`。

## 讀取 MIME 內容

取得 `NotesMIMEEntity` 物件後，可以存取其內容和標頭。例如，以下程式碼顯示 MIME 實體的內容類型、子類型、字符集和編碼方式。

```lotusscript
Dim contentType As String
Dim contentSubType As String
Dim charset As String
Dim encoding As Integer

contentType = mime.ContentType
contentSubType = mime.ContentSubType
charset = mime.Charset
encoding = mime.Encoding

MsgBox "內容類型: " & contentType & "/" & contentSubType & Chr(13) & _
       "字符集: " & charset & Chr(13) & _
       "編碼: " & encoding
```

此外，可以使用 `GetContentAsText` 方法來取得 MIME 實體的文本內容。

```lotusscript
Dim content As String
content = mime.GetContentAsText
MsgBox "內容: " & content
```

## 建立 MIME 內容

要在文件中建立新的 MIME 內容，可以使用 `CreateMIMEEntity` 方法。以下範例展示如何建立一個簡單的 MIME 實體，並設置其內容和標頭。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim mime As NotesMIMEEntity
Dim header As NotesMIMEHeader
Dim stream As NotesStream

Set db = session.CurrentDatabase
Set doc = db.CreateDocument

session.ConvertMIME = False ' 禁止自動轉換 MIME
Set mime = doc.CreateMIMEEntity("Body")

' 設置標頭
Set header = mime.CreateHeader("Content-Type")
Call header.SetHeaderVal("text/plain; charset=UTF-8")

' 設置內容
Set stream = session.CreateStream
Call stream.WriteText("這是 MIME 消息的文本內容。")
Call mime.SetContentFromText(stream, "text/plain; charset=UTF-8", ENC_NONE)

' 保存文檔
doc.Save True, False

session.ConvertMIME = True ' 恢復自動轉換 MIME
```

在此範例中，`CreateMIMEEntity` 方法在文件中建立一個名為 "Body" 的 MIME 實體。接著，使用 `CreateHeader` 方法設置 "Content-Type" 標頭，並使用 `SetContentFromText` 方法設置內容。

## 結論

`NotesMIMEEntity` 類別提供了強大的功能，讓開發者能夠在 LotusScript 中存取和操作 HCL Domino 文件中的 MIME 內容。透過正確的使用方法，可以有效地讀取、修改和建立 MIME 實體，滿足各種應用需求。

有關更多資訊，請參閱 [NotesMIMEEntity 類別](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesmimeentity-class) 和 [在 LotusScript 中處理 MIME 實體](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS.html)。
