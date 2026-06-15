---
title: "使用 NotesNewsletter 類別建立 Domino 電子報"
description: "學習如何使用 LotusScript 中的 NotesNewsletter 類別，從多個文件建立包含摘要資訊和連結的電子報。"
pubDate: "2026-06-16T07:39:34+08:00"
lang: "zh-TW"
slug: "notes-newsletter"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "Making a Domino newsletter"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_MAKING_A_NOTES_NEWSLETTER.html"
  - title: "FormatDocument (NotesNewsletter - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_FORMATDOCUMENT_METHOD.html"
  - title: "SubjectItemName (NotesNewsletter - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_SUBJECTITEMNAME_PROPERTY.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_MAKING_A_NOTES_NEWSLETTER.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-newsletter
-->

## 簡介

在 HCL Domino 中，電子報是一種包含多個文件摘要資訊和連結的文件，方便用戶快速瀏覽和存取相關內容。透過 LotusScript 的 `NotesNewsletter` 類別，我們可以程式化地建立電子報，將多個文件的資訊整合到一個文件中，並可選擇性地發送給特定收件者。

## 建立電子報的步驟

1. **建立 NotesNewsletter 物件**：

   使用 `NotesSession` 的 `CreateNewsletter` 方法，傳入包含目標文件的 `NotesDocumentCollection`，以建立 `NotesNewsletter` 物件。

   ```lotusscript
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Dim collection As NotesDocumentCollection
   Dim newsletter As NotesNewsletter

   Set db = session.CurrentDatabase
   Set collection = db.AllDocuments
   Set newsletter = session.CreateNewsletter(collection)
   ```

2. **設定電子報屬性**：

   根據需求，設定電子報的相關屬性，例如是否包含主題、相關性分數等。

   ```lotusscript
   newsletter.DoSubject = True
   newsletter.SubjectItemName = "Subject"
   newsletter.DoScore = False
   ```

   - `DoSubject`：設定是否在電子報中包含每個文件的主題。
   - `SubjectItemName`：指定每個源文件中包含主題的欄位名稱。
   - `DoScore`：設定是否在電子報中包含每個文件的相關性分數。

3. **格式化電子報**：

   使用 `FormatMsgWithDoclinks` 方法，將電子報格式化為包含文件連結的消息。

   ```lotusscript
   Dim newsletterDoc As NotesDocument
   Set newsletterDoc = newsletter.FormatMsgWithDoclinks(db)
   ```

   此方法會在指定的資料庫中建立一個新文件，該文件包含指向集合中每個文件的連結。

4. **發送電子報**：

   設定電子報的收件者，並使用 `Send` 方法發送。

   ```lotusscript
   newsletterDoc.Send False, "收件者郵件地址"
   ```

   - 第一個參數 `False` 表示不儲存副本。
   - 第二個參數是收件者的郵件地址，可以是單一地址或陣列。

## 注意事項

- **儲存電子報**：如果需要保留電子報的副本，請在發送前使用 `Save` 方法儲存。

  ```lotusscript
  Call newsletterDoc.Save(True, False)
  ```

- **格式化方法選擇**：

  - `FormatDocument`：建立包含指定文件內容的電子報。
  - `FormatMsgWithDoclinks`：建立包含文件連結的電子報。

  根據需求選擇適當的方法。

## 結論

透過 `NotesNewsletter` 類別，我們可以在 HCL Domino 中程式化地建立和發送電子報，將多個文件的資訊整合到一個文件中，方便用戶快速存取和瀏覽相關內容。詳細資訊請參閱 [Making a Domino newsletter](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_MAKING_A_NOTES_NEWSLETTER.html) 和 [FormatDocument 方法](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_FORMATDOCUMENT_METHOD.html)。
