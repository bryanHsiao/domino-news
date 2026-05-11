---
title: "使用 NotesNewsletter 類別建立電子報"
description: "本教程介紹如何使用 NotesNewsletter 類別在 HCL Domino 中建立和發送電子報，涵蓋類別的屬性、方法以及實作範例。"
pubDate: "2026-05-12T07:24:46+08:00"
lang: "zh-TW"
slug: "notes-newsletter"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "Java Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "HCL Notes and Domino Application Development wiki: Getting Started: Writing Code to Deal With Multivalued Data"
    url: "https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/Writing_Code_to_Deal_With_Multivalued_Data"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-newsletter
-->

## 簡介

在 HCL Domino 中，`NotesNewsletter` 類別允許開發人員建立包含多個文件的電子報，這些文件可以作為單一電子郵件發送給收件人。這在需要將多個相關文件以摘要形式傳遞時特別有用。

## NotesNewsletter 類別概述

`NotesNewsletter` 類別提供了以下主要屬性和方法：

- **AddDocument**：將 `NotesDocument` 添加到電子報中。
- **FormatDocument**：設定電子報中單個文件的格式。
- **Send**：將電子報發送給指定的收件人。

## 建立電子報的步驟

以下是使用 `NotesNewsletter` 類別建立和發送電子報的步驟：

1. **初始化 `NotesNewsletter` 實例**：

   ```lotusscript
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Set db = session.CurrentDatabase
   Dim newsletter As New NotesNewsletter(db)
   ```

2. **添加文件到電子報**：

   ```lotusscript
   Dim doc As NotesDocument
   Set doc = db.GetDocumentByUNID("<DocumentUNID>")
   Call newsletter.AddDocument(doc)
   ```

3. **設定電子報格式**（可選）：

   ```lotusscript
   Call newsletter.FormatDocument(doc, "標題", "摘要", "連結")
   ```

4. **發送電子報**：

   ```lotusscript
   Call newsletter.Send("收件人郵件地址")
   ```

## 完整範例

以下是完整的 LotusScript 範例，展示如何使用 `NotesNewsletter` 類別建立並發送電子報：

```lotusscript
Sub SendNewsletter()
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Set db = session.CurrentDatabase
   
   Dim newsletter As New NotesNewsletter(db)
   
   ' 添加第一個文件
   Dim doc1 As NotesDocument
   Set doc1 = db.GetDocumentByUNID("<DocumentUNID1>")
   Call newsletter.AddDocument(doc1)
   
   ' 添加第二個文件
   Dim doc2 As NotesDocument
   Set doc2 = db.GetDocumentByUNID("<DocumentUNID2>")
   Call newsletter.AddDocument(doc2)
   
   ' 發送電子報
   Call newsletter.Send("recipient@example.com")
End Sub
```

## 注意事項

- 確保 `NotesNewsletter` 類別在您的環境中可用，並且您有適當的權限來存取和發送電子郵件。
- 在添加文件時，確保文件的 UNID 正確無誤。

透過上述步驟，您可以在 HCL Domino 中有效地建立和發送包含多個文件的電子報，方便地與收件人分享相關資訊。
