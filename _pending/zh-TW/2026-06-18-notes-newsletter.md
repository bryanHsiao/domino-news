---
title: "NotesNewsletter：把一堆文件變成一封含 doclink 的摘要信"
description: "你想做一個「每日摘要」或「搜尋結果通知」 — 把符合條件的一堆文件，整理成一封信寄給使用者，信裡每一筆都能點回原文件。這正是 NotesNewsletter 的工作：吃一個 NotesDocumentCollection，用 FormatMsgWithDoclinks 產生一封含 doclink 的摘要信，或用 FormatDocument 逐筆渲染。本文拆解它的建立、DoScore / DoSubject / SubjectItemName 屬性、兩個 Format 方法的差別，以及搭配 FTSearch 的經典寄信範例。"
pubDate: 2026-06-18T07:30:00+08:00
lang: zh-TW
slug: notes-newsletter
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesNewsletter class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html"
  - title: "FormatMsgWithDoclinks method (NotesNewsletter) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMATMSGWITHDOCLINKS_METHOD.html"
  - title: "NotesNewsletter class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESNEWSLETTER_CLASS.html"
relatedJava: ["Newsletter"]
relatedSsjs: ["Newsletter"]
---

需求很常見：每天把「昨天新進、符合某條件」的文件，整理成一封信寄給相關的人；或使用者在 view 裡選了幾筆，按個按鈕「把這些寄給我」。信裡最好每一筆都能直接點回原文件。

你當然可以自己組 HTML、自己塞 doclink —— 但 Domino 內建了一個專做這件事的類別：[`NotesNewsletter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html)。官方定義它是「a document or set of documents that contain information from, or links to, several other documents」—— 白話說，它把**一個文件集合**，變成**一封指回那些文件的摘要信**。

---

## 重點摘要

- 從一個 `NotesDocumentCollection` 建立：`session.CreateNewsletter(collection)`（或 `New NotesNewsletter(collection)`，COM 下不支援 New）
- **兩個產出方法**：`FormatMsgWithDoclinks(db)` 產生**一封**含每筆 doclink 的信；`FormatDocument(db, n)` 渲染集合裡第 n 筆成一份文件
- **三個屬性**（讀寫）：`DoScore`（是否附上每筆的相關性分數）、`DoSubject`（是否附上每筆的主旨字串）、`SubjectItemName`（指定用哪個欄位當主旨來源）
- 建立後就只做兩件事：`FormatMsgWithDoclinks` 或 `FormatDocument`
- 經典組合：`FTSearch` / `UnprocessedDocuments` 拿到集合 → 做成 newsletter → `Send`

---

## 建立：吃一個文件集合

`NotesNewsletter` 的輸入是一個 [`NotesDocumentCollection`](/domino-news/posts/notes-document-collection/) —— 你怎麼湊出這個集合都行（FTSearch、view 選取、UnprocessedDocuments…）：

```lotusscript
Dim newsletter As NotesNewsletter
Set newsletter = New NotesNewsletter(collection)
```

建立後，它的角色很單純：把這個集合「格式化」成信或文件。官方也明說，建立後支援的操作就只有 `FormatMsgWithDoclinks` 跟 `FormatDocument` 兩個。

## FormatMsgWithDoclinks：一封信、每筆一個連結

這是最常用的。它在指定的資料庫裡產生**一份**文件，內含**指向集合中每一筆文件的 doclink**。最典型的就是「搜尋結果摘要信」—— 直接看[官方範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESNEWSLETTER_CLASS.html)（逐字）：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim newsletter As NotesNewsletter
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set collection = db.FTSearch( "arachnid", 15 )
If ( collection.Count > 0 ) Then
  Set newsletter = New NotesNewsletter( collection )
  Set doc = newsletter.FormatMsgWithDoclinks( db )
  doc.Form = "Memo"
  doc.Subject = "The Arachnid Report"
  Call doc.Send( False, "Sharron Karasic" )
End If
```

流程很清楚：[`FTSearch`](/domino-news/posts/lotusscript-ftsearch/) 拿到符合的集合 → [`FormatMsgWithDoclinks`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMATMSGWITHDOCLINKS_METHOD.html) 產出一份帶 doclink 的文件 → 設成 `Memo` 表單、給主旨 → `Send` 寄出。收件人點信裡的連結就跳回原文件。

## FormatDocument：逐筆渲染

`FormatDocument(db, n)` 不一樣 —— 它把集合裡**第 n 筆**文件渲染（picture）成資料庫裡的一份新文件。要逐筆處理時用迴圈：

```lotusscript
Set collection = db.UnprocessedDocuments
Set newsletter = New NotesNewsletter( collection )
For j = 1 To collection.Count
    Set doc = newsletter.FormatDocument( mailDb, j )
    Call doc.Save( True, True )
Next
```

簡單記：**要「一封信、多個連結」用 `FormatMsgWithDoclinks`；要「每筆各自成一份」用 `FormatDocument`。**

## 三個屬性微調內容

在 Format 之前設定這三個（讀寫）可以調整摘要信的內容：

| 屬性 | 作用 |
|---|---|
| `DoScore` | 是否在每筆旁附上相關性分數（搭配 FTSearch 的排序分數很合理） |
| `DoSubject` | 是否附上描述每筆主旨的字串 |
| `SubjectItemName` | 指定「用文件上哪個欄位的值」當主旨來源 |

例如做 FTSearch 摘要信時，`DoScore = True` 就會把搜尋相關度一起列出來，讓收件人知道哪幾筆最相關。

## 同類別在其他語言

| 語言 | 對應類別 | 建立方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `Newsletter` | `session.createNewsletter(collection)` |
| SSJS / XPages | `Newsletter` | `session.createNewsletter(collection)` |

三邊一致：吃一個 document collection、`formatMsgWithDoclinks` / `formatDocument` 兩個方法、`DoScore` / `DoSubject` 同樣可調。要在 Java agent 做排程摘要信，這篇的流程直接搬。
