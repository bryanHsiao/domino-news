---
title: "LotusScript 的回應文件：MakeResponse、ParentDocumentUNID，與遍歷整棵串"
description: "Domino 的父子文件階層 — 主文件、回應、回應之回應 — 用幾個 NotesDocument 成員就能建立與遍歷。本文說明 MakeResponse（以及你必須在它之後呼叫的 Save）、用 ParentDocumentUNID 往上走到父文件、以及 Responses 屬性那個關鍵限制：它只回傳直接子文件 — 所以完整的樹需要遞迴。"
pubDate: 2026-07-14T07:30:00+08:00
lang: zh-TW
slug: notes-response-documents
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocument.MakeResponse method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html"
  - title: "NotesDocument.Responses property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RESPONSES_PROPERTY.html"
  - title: "NotesDocument.ParentDocumentUNID property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARENTDOCUMENTUNID_PROPERTY.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
cover: "/covers/notes-response-documents.webp"
coverStyle: "pencil-sketch"
---

討論串、一張採購單與它的明細、一張工單與它的後續追蹤 — 這些在 Domino 裡都是同一個形狀：一份**主文件**，底下掛著**回應文件**，有時回應底下還掛著回應。LotusScript 用幾個 `NotesDocument` 成員就能建立與走訪那棵樹。它們很簡單，但其中兩個有個鋒利的邊角，不知道的話會悄悄產生錯的結果。

---

## 重點摘要

- [`Call child.MakeResponse(parent)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html) 讓 `child` 成為 `parent` 的回應 —「這兩份文件必須在同一個資料庫」。它只設連結；**你必須在它之後呼叫 `Save`**，否則這個關係會遺失。
- 用 `ParentDocumentUNID`（唯讀）**往上**走 — 父文件的 UNID，沒有父文件則為 `""` — 餵給 `db.GetDocumentByUNID(...)`。
- 用 `Responses`（唯讀 `NotesDocumentCollection`）**往下**走。陷阱在：「集合裡的每份文件都是第一份文件的直接回應。**回應之回應不包含在內。**」完整的樹需要**遞迴**。
- `IsResponse`（唯讀 Boolean）告訴你一份文件是不是回應。一份文件可以**同時**是回應也是父文件。
- 一份全新未存檔的文件上 `Responses` 不可用（存檔並重開之前它回傳 `Nothing`），而如果資料庫開了「Disable specialized response hierarchy information」，它會是空的。

## 建立連結：MakeResponse

你在一份文件上呼叫 `MakeResponse`、傳入父文件，讓它成為回應。這個方法只寫入內部的父連結 — 它不存檔，本身也不改變文件在 UI 表單上的分類：

```lotusscript
Set resp = db.CreateDocument
resp.Form = "Response"
Call resp.ReplaceItemValue("Subject", "A reply")
Call resp.MakeResponse(main)      ' 設父連結
Call resp.Save(True, False)       ' 必要 — 光 MakeResponse 不會持久化
```

文件講得很明白：「如果你要儲存所做的變更，你必須在這個方法之後呼叫 Save。」漏了 `Save`，handle 一離開作用域回應連結就蒸發了。（兩份文件必須住在同一個資料庫 — 不能跨資料庫回應。）

## 往上走：ParentDocumentUNID

從一份回應，[`ParentDocumentUNID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARENTDOCUMENTUNID_PROPERTY.html) 給你父文件的 universal ID — 一個唯讀字串，文件沒有父文件時為空。搭配 `GetDocumentByUNID` 取回真正的父文件：

```lotusscript
If resp.IsResponse Then
    Dim parent As NotesDocument
    Set parent = db.GetDocumentByUNID(resp.ParentDocumentUNID)
    Print "Parent subject: " & parent.GetItemValue("Subject")(0)
End If
```

注意它是**唯讀**的 — 你不是靠指派這個屬性來改父文件；你用 `MakeResponse`。它只回報連結。

## 往下走：Responses — 以及遞迴陷阱

`Responses` 把一份文件的回應以集合回傳。這裡是絆倒人的限制，取自 [屬性文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RESPONSES_PROPERTY.html) 原文：「集合裡的每份文件都是第一份文件的直接回應。回應之回應不包含在內。」

所以 `main.Responses` 給你的是直接子文件 — 不是孫文件。如果你的資料只有一層深，沒問題。如果它有巢狀，單一個 `Responses` 呼叫會悄悄漏掉第一層以下的所有東西，你的 count 就以那種難以察覺的安靜方式錯了。修法是遞迴走訪：

```lotusscript
Sub PrintTree(doc As NotesDocument, depth As Integer)
    Dim responses As NotesDocumentCollection
    Dim child As NotesDocument
    Set responses = doc.Responses
    Set child = responses.GetFirstDocument
    Do Until child Is Nothing
        Print String(depth * 2, " ") & child.GetItemValue("Subject")(0)
        Call PrintTree(child, depth + 1)     ' 遞迴進孫文件
        Set child = responses.GetNextDocument(child)
    Loop
End Sub
```

關於 `Responses` 還有兩件事：它在一份全新未存檔的文件上不會被填充（存檔並重開之前回傳 `Nothing`，因為階層存在已存檔的文件裡），而如果資料庫在屬性裡開了 **「Disable specialized response hierarchy information」** — 一個關掉這項追蹤的效能選項 — 它會回傳空集合。

## 組起來

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim main As NotesDocument
    Dim resp As NotesDocument
    Set db = session.CurrentDatabase

    ' 主文件
    Set main = db.CreateDocument
    main.Form = "MainTopic"
    Call main.ReplaceItemValue("Subject", "Parent topic")
    Call main.Save(True, False)

    ' 掛在它底下的回應
    Set resp = db.CreateDocument
    resp.Form = "Response"
    Call resp.ReplaceItemValue("Subject", "A reply")
    Call resp.MakeResponse(main)
    Call resp.Save(True, False)

    ' 從主文件走整棵樹
    Print main.GetItemValue("Subject")(0)
    Call PrintTree(main, 1)
End Sub
```

最後一個值得分清楚的框架：階層連結與 UI 是兩回事。`MakeResponse` 在資料裡設父子關係；要讓那棵樹在 view 裡*顯示*成縮排的討論串，需要一個設計時開了回應階層（「Show responses in a hierarchy」）的 view。不管有沒有 view 顯示它，連結都存在。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.MakeResponse(parent)` | `doc.makeResponse(parent)` | `document.makeResponse(...)` |
| `doc.ParentDocumentUNID` | `doc.getParentDocumentUNID()` | `document.getParentDocumentUNID()` |
| `doc.Responses` | `doc.getResponses()` | `document.getResponses()` |

`lotus.domino.Document` 的介面在 Java 與 SSJS 都與這些對應，規則相同：`makeResponse` 需要 `save`、`getResponses()` 只回傳直接子文件、`getParentDocumentUNID()` 唯讀。在 XPages 裡 SSJS 的 `NotesXspDocument` 包住同一份後端文件；需要這些成員時透過 `.getDocument()` 取到原始的 `Document`。
