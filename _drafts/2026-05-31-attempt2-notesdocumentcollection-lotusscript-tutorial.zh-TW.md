---
title: "使用 LotusScript 操作 NotesDocumentCollection 的指南"
description: "深入探討如何在 LotusScript 中使用 NotesDocumentCollection 類別，包括其屬性、方法，以及實際應用範例。"
pubDate: "2026-05-31T07:26:29+08:00"
lang: "zh-TW"
slug: "notesdocumentcollection-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocumentCollection (LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "FTSearch (NotesDocumentCollection - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-ftsearch-notesdocumentcollection"
  - title: "Examples: GetNextDocument method (NotesDocumentCollection - LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_EXAMPLES_GETNEXTDOCUMENT_METHOD_COLLECTION.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html, https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-ftsearch-notesdocumentcollection, https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_EXAMPLES_GETNEXTDOCUMENT_METHOD_COLLECTION.html
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdocumentcollection-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 開發中，`NotesDocumentCollection` 類別代表資料庫中一組符合特定條件的文件集合。透過此類別，開發者可以有效地存取、操作和管理這些文件集合。

## 主要屬性與方法

### 屬性

- **Count**：返回集合中文件的數量。
- **IsSorted**：指示集合中的文件是否已排序。
- **Parent**：返回包含該集合的 `NotesDatabase` 對象。

### 方法

- **GetFirstDocument**：獲取集合中的第一個文件。
- **GetNextDocument**：獲取集合中指定文件之後的下一個文件。
- **FTSearch**：對集合中的所有文件進行全文檢索，並將集合縮減為符合查詢的文件。

## 實際應用範例

### 1. 獲取並遍歷所有文件

以下範例展示如何獲取資料庫中的所有文件，並遍歷每個文件的主題：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.AllDocuments
Set doc = collection.GetFirstDocument()

While Not doc Is Nothing
    Print doc.GetItemValue("Subject")(0)
    Set doc = collection.GetNextDocument(doc)
Wend
```

在此範例中，`AllDocuments` 屬性返回資料庫中的所有文件集合，然後使用 `GetFirstDocument` 和 `GetNextDocument` 方法遍歷每個文件。

### 2. 使用全文檢索篩選文件

以下範例展示如何使用 `FTSearch` 方法查找包含特定關鍵字的文件：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.FTSearch("關鍵字", 0)
Set doc = collection.GetFirstDocument()

While Not doc Is Nothing
    Print doc.GetItemValue("Subject")(0)
    Set doc = collection.GetNextDocument(doc)
Wend
```

此範例中，`FTSearch` 方法對資料庫進行全文檢索，查找包含「關鍵字」的文件，並返回符合條件的文件集合。

### 3. 將文件集合中的文件移動到特定資料夾

以下範例展示如何將符合特定條件的文件移動到名為「Archive」的資料夾：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.FTSearch("關鍵字", 0)
Set doc = collection.GetFirstDocument()

While Not doc Is Nothing
    Call doc.PutInFolder("Archive")
    Set doc = collection.GetNextDocument(doc)
Wend
```

在此範例中，`PutInFolder` 方法將每個符合條件的文件移動到名為「Archive」的資料夾中。

## 注意事項

- **排序**：除非使用全文檢索，否則 `NotesDocumentCollection` 中的文件通常是無序的。
- **效能考量**：對於大型資料庫，使用全文檢索或特定視圖來獲取文件集合可能更有效率。

透過熟悉 `NotesDocumentCollection` 類別的屬性和方法，開發者可以更有效地在 LotusScript 中操作和管理 HCL Domino 資料庫中的文件集合。
