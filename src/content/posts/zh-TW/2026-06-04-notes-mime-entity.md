---
title: "NotesMIMEEntity + NotesMIMEHeader：LotusScript 解析郵件 MIME 結構"
description: "Domino 收到的郵件是 MIME 多層巢狀結構 — HTML body、純文字備用、附件、inline image 各自是不同的 MIME entity。LotusScript 用 NotesMIMEEntity 代表每一個節點、NotesMIMEHeader 代表節點的 header 欄位。本文拆解取得方式（session.ConvertMIME = False 的必要性）、ContentType / ContentSubType 識別 MIME 類型、GetFirstChildEntity + GetNextSibling 走訪 MIME 樹、GetContentAsText 取出文字內文、GetNthHeader / GetSomeHeaders 讀取 header 值、CreateMIMEEntity 從頭建立 MIME 郵件、以及 body 跟 attachment 的實戰辨別方法。"
pubDate: 2026-06-04T07:30:00+08:00
lang: zh-TW
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

你的 agent 需要解析收到的郵件 — 找 HTML body、抓附件清單、或讀特定 header（譬如 `X-Mailer` 或 `Reply-To`）。打開 `NotesDocument`、`GetItemValue("Body")` 卻拿到空的或破碎的文字。

問題在：現代郵件是 **MIME 多層巢狀結構**、HTML body + 純文字備用 + 附件 + inline image 各自是獨立的節點。Domino 預設會把這個結構「翻譯」成自家的 rich text 格式 — 但如果你需要原始 MIME 資料、就要先告訴 Domino 不要翻譯、然後用 `NotesMIMEEntity` 走訪這棵樹。

---

## 重點摘要

- **ConvertMIME = False 是前提** — 預設值 True 會讓 Domino 把 MIME 轉成 rich text、之後 `GetMIMEEntity` 拿到 `Nothing`
- [**`NotesMIMEEntity`**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEENTITY_CLASS_OVERVIEW.html) 代表 MIME 樹的一個節點、每個節點有 `ContentType` / `ContentSubType` 屬性識別類型
- **走訪方式**：`GetFirstChildEntity` 進入子節點、`GetNextSibling` 走同層下一個
- **`NotesMIMEHeader`** 代表節點的 header 欄位（`Content-Type` / `Content-Disposition` 等）
- **Release 5.0.2** 起加入、所有主流版本都支援
- 操作完要把 `ConvertMIME` 改回 `True`、否則後續儲存文件會有問題

---

## 取得 MIME 根節點

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

' 關鍵：先關掉 MIME 自動轉換
session.ConvertMIME = False

' 開啟一封郵件文件
Dim doc As NotesDocument
Set doc = db.GetDocumentByUNID("...")

' 取得 MIME 根節點
Dim mime As NotesMIMEEntity
Set mime = doc.GetMIMEEntity()

If mime Is Nothing Then
    Print "這份文件沒有 MIME 內容（或 ConvertMIME 還是 True）"
Else
    Print "根節點 Content-Type: " & mime.ContentType & "/" & mime.ContentSubType
End If

session.ConvertMIME = True  ' 操作完還原
```

如果文件裡的 `$NoteHasNativeMIME` item 值為 "1"、表示有原生 MIME 內容（`doc.HasItem("$NoteHasNativeMIME")` 可快速預判）。

---

## MIME 樹的結構

一封典型 HTML 郵件（含附件）的 MIME 樹長這樣：

```
multipart/mixed                ← 根節點
├── multipart/alternative      ← 子節點（text/html + text/plain 擇一顯示）
│   ├── text/plain             ← 純文字備用
│   └── text/html              ← HTML body
└── application/pdf            ← 附件
```

走訪用 `GetFirstChildEntity`（進入子層）搭配 `GetNextSibling`（走同層）：

```lotusscript
' 遞迴走訪整棵 MIME 樹
Sub WalkMIME(entity As NotesMIMEEntity, level As Integer)
    Dim indent As String
    indent = Space(level * 2)
    Print indent & entity.ContentType & "/" & entity.ContentSubType

    ' 走子節點
    Dim child As NotesMIMEEntity
    Set child = entity.GetFirstChildEntity()
    Do Until child Is Nothing
        Call WalkMIME(child, level + 1)
        Set child = child.GetNextSibling()
    Loop
End Sub

' 呼叫
session.ConvertMIME = False
Dim mime As NotesMIMEEntity
Set mime = doc.GetMIMEEntity()
Call WalkMIME(mime, 0)
session.ConvertMIME = True
```

---

## 讀取郵件內文

找到 `text/html` 或 `text/plain` 節點後、用 `GetContentAsText` 取出內容：

```lotusscript
' 找 HTML body
Function GetHTMLBody(rootEntity As NotesMIMEEntity) As String
    If rootEntity.ContentType = "text" And rootEntity.ContentSubType = "html" Then
        GetHTMLBody = rootEntity.GetContentAsText()
        Exit Function
    End If
    ' 遞迴找子節點
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

## 辨別附件

附件節點的 `Content-Disposition` header 值是 `attachment`：

```lotusscript
Sub ListAttachments(entity As NotesMIMEEntity)
    ' 讀 Content-Disposition header
    Dim dispHeader As NotesMIMEHeader
    Set dispHeader = entity.GetNthHeader("Content-Disposition")
    If Not (dispHeader Is Nothing) Then
        If InStr(LCase(dispHeader.HeaderVal), "attachment") > 0 Then
            ' 這個節點是附件
            Dim nameHeader As NotesMIMEHeader
            Set nameHeader = entity.GetNthHeader("Content-Disposition")
            Print "附件：" & entity.ContentSubType
        End If
    End If
    ' 遞迴子節點
    Dim child As NotesMIMEEntity
    Set child = entity.GetFirstChildEntity()
    Do Until child Is Nothing
        Call ListAttachments(child)
        Set child = child.GetNextSibling()
    Loop
End Sub
```

---

## 讀取 Header 值

每個節點的 [header 透過 `NotesMIMEHeader`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESMIMEHEADER_CLASS.html) 物件存取：

```lotusscript
' 取特定 header 的值
Dim ctHeader As NotesMIMEHeader
Set ctHeader = mime.GetNthHeader("Content-Type")
If Not (ctHeader Is Nothing) Then
    Print "Content-Type: " & ctHeader.HeaderVal
    Print "  charset param: " & ctHeader.getParamVal("charset")
End If

' 取多個 header 的值（回傳字串）
Dim someHeaders As String
someHeaders = mime.GetSomeHeaders("Content-Type, Content-Transfer-Encoding")
Print someHeaders
```

常用的 header 名稱：`Content-Type`、`Content-Disposition`、`Content-Transfer-Encoding`、`Content-ID`（inline image 用）。

---

## 建立 MIME 郵件

[`CreateMIMEEntity`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEMIMEENTITY_METHOD.html) 從頭建立結構：

```lotusscript
session.ConvertMIME = False

Dim doc As NotesDocument
Set doc = db.CreateDocument()
doc.Form = "Memo"
doc.SendTo = "recipient@example.com"
doc.Subject = "測試 MIME 郵件"

' 建根節點
Dim root As NotesMIMEEntity
Set root = doc.CreateMIMEEntity("Body")
root.ContentType = "multipart"
root.ContentSubType = "alternative"

' 加純文字子節點
Dim textPart As NotesMIMEEntity
Set textPart = root.CreateChildEntity()
Call textPart.SetContentFromText("這是純文字版本", "text/plain;charset=UTF-8", ENC_NONE)

' 加 HTML 子節點
Dim htmlPart As NotesMIMEEntity
Set htmlPart = root.CreateChildEntity()
Call htmlPart.SetContentFromText("<p>這是 <b>HTML</b> 版本</p>", "text/html;charset=UTF-8", ENC_NONE)

Call doc.Save(True, False)
session.ConvertMIME = True
```

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesMIMEEntity` / `NotesMIMEHeader` |
| Java | `lotus.domino.MIMEEntity` / `MIMEHeader`（去掉 Notes 前綴、用完要 `.recycle()`）|
| SSJS | `MIMEEntity` / `MIMEHeader`（XPages 內可呼叫、API 一致）|
