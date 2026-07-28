---
title: "使用 LotusScript 的 NotesNewsletter：創建包含多文件連結的新聞信"
description: "學習如何使用 LotusScript 的 NotesNewsletter 類別，從多個文檔集合中創建包含連結的新聞信，方便用戶快速訪問相關內容。"
pubDate: "2026-07-28T08:04:48+08:00"
lang: "zh-TW"
slug: "notes-newsletter-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNewsletter (LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-notesnewsletter-lotusscript"
  - title: "IsDoScore (NotesNewsletter - JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-isdoscore"
  - title: "formatDocument (NotesNewsletter - JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-formatdocument"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-notesnewsletter-lotusscript, https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-isdoscore, https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-formatdocument
attempt: 2
slug: notes-newsletter-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 開發中，您可能需要向用戶發送包含多個文檔連結的新聞信。LotusScript 提供了 `NotesNewsletter` 類別，允許您從文檔集合中創建包含連結的新聞信，方便用戶快速訪問相關內容。

## `NotesNewsletter` 類別概述

`NotesNewsletter` 類別允許您從 `NotesDocumentCollection` 創建新聞信，該新聞信可以包含文檔的渲染內容或連結。該類別包含以下主要方法：

- **`FormatDocument`**：創建包含特定文檔渲染內容的新文檔。
- **`FormatMsgWithDoclinks`**：創建包含文檔連結的新聞信文檔。

此外，該類別還有以下屬性：

- **`DoScore`**：指示新聞信是否包含每個文檔的相關性分數。
- **`DoSubject`**：指示新聞信是否包含每個文檔的主題描述。
- **`SubjectItemName`**：指定用作主題行的項目名稱。

## 使用 `NotesNewsletter` 創建包含連結的新聞信

以下是使用 `NotesNewsletter` 類別創建包含連結的新聞信的步驟：

1. **獲取文檔集合**：

   ```lotusscript
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Dim view As NotesView
   Dim docCollection As NotesDocumentCollection

   Set db = session.CurrentDatabase
   Set view = db.GetView("YourViewName")
   Set docCollection = view.AllDocuments
   ```

2. **創建 `NotesNewsletter` 對象**：

   ```lotusscript
   Dim newsletter As New NotesNewsletter(docCollection)
   ```

3. **設置新聞信屬性**（可選）：

   ```lotusscript
   newsletter.DoScore = True
   newsletter.DoSubject = True
   newsletter.SubjectItemName = "Subject"
   ```

4. **格式化新聞信並發送**：

   ```lotusscript
   Dim mailDb As NotesDatabase
   Dim mailDoc As NotesDocument

   Set mailDb = session.GetDatabase("", "mail\yourmailfile.nsf")
   Set mailDoc = newsletter.FormatMsgWithDoclinks(mailDb)

   mailDoc.Send False, "recipient@example.com"
   ```

在上述代碼中，我們首先獲取了包含所需文檔的集合，然後使用該集合創建了 `NotesNewsletter` 對象。接著，我們設置了新聞信的屬性，最後格式化新聞信並將其發送給指定的收件人。

## 注意事項

- **`DoScore` 屬性**：該屬性僅適用於已排序的文檔集合，例如通過 `FTSearch` 方法獲得的集合。如果集合未排序，該屬性將無效。

- **`FormatDocument` 方法**：該方法創建包含特定文檔渲染內容的新文檔，類似於轉發文檔時的效果。

- **`FormatMsgWithDoclinks` 方法**：該方法創建包含文檔連結的新聞信文檔，方便用戶快速訪問相關文檔。

通過使用 `NotesNewsletter` 類別，您可以在 LotusScript 中輕鬆創建包含多個文檔連結的新聞信，提升用戶體驗和信息傳遞效率。

參考資料：

- [NotesNewsletter (LotusScript)](https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-notesnewsletter-lotusscript)
- [IsDoScore (NotesNewsletter - JavaScript)](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-isdoscore)
- [formatDocument (NotesNewsletter - JavaScript)](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-formatdocument)
