---
title: "使用 LotusScript 操作 NotesDocumentCollection"
description: "深入探討如何在 LotusScript 中使用 NotesDocumentCollection 類別，包括其屬性、方法，以及實際應用範例。"
pubDate: "2026-08-17T07:22:02+08:00"
lang: "zh-TW"
slug: "notesdocumentcollection-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocumentCollection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "FTSearch (NotesDocumentCollection - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html"
  - title: "Examples: NotesDocumentCollection class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENTCOLLECTION_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html?utm_source=openai" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocumentcollection-lotusscript-tutorial
-->

在 HCL Domino 的 LotusScript 中，`NotesDocumentCollection` 類別代表資料庫中一組根據特定條件選取的文件集合。透過此類別，開發者可以有效地管理和操作多個文件。

## 取得文件集合

要獲取資料庫中的所有文件集合，可以使用 `NotesDatabase` 類別的 `AllDocuments` 屬性：

```lotusscript
Dim db As New NotesDatabase("伺服器名稱", "資料庫名稱.nsf")
Dim collection As NotesDocumentCollection
Set collection = db.AllDocuments
```

這段程式碼建立了一個指向特定資料庫的連線，並取得該資料庫中所有文件的集合。

## 遍歷文件集合

取得 `NotesDocumentCollection` 後，可以使用 `GetFirstDocument` 和 `GetNextDocument` 方法來遍歷集合中的每個文件：

```lotusscript
Dim doc As NotesDocument
Set doc = collection.GetFirstDocument
While Not (doc Is Nothing)
    ' 在此處理文件
    Set doc = collection.GetNextDocument(doc)
Wend
```

這樣的迴圈允許您逐一處理集合中的每個文件。

## 使用 FTSearch 方法進行全文檢索

`FTSearch` 方法允許在文件集合中執行全文檢索，並將集合縮小到符合查詢條件的文件：

```lotusscript
Dim query As String
query = "關鍵字"
Call collection.FTSearch(query, 0)
```

此方法會根據指定的查詢字串篩選文件集合。需要注意的是，若資料庫未建立全文索引，該方法仍可運作，但效率較低。您可以使用 `NotesDatabase` 類別的 `IsFTIndexed` 屬性來檢查資料庫是否已建立全文索引。 ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html?utm_source=openai))

## 檢查文件是否在集合中

`Contains` 方法可用來檢查特定文件是否存在於集合中：

```lotusscript
Dim isContained As Boolean
isContained = collection.Contains(doc)
```

此方法返回布林值，指示指定的文件是否在集合中。 ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CONTAINS_METHOD_COLLECTION.html?utm_source=openai))

## 複製文件集合

若需要對文件集合進行備份或其他操作，可以使用 `Clone` 方法來複製集合：

```lotusscript
Dim clonedCollection As NotesDocumentCollection
Set clonedCollection = collection.Clone
```

這樣可以獲得原始集合的副本，對其進行操作而不影響原始集合。

## 結論

`NotesDocumentCollection` 類別在 LotusScript 中提供了強大的功能，允許開發者有效地管理和操作多個文件。透過理解其屬性和方法，您可以更靈活地處理 HCL Domino 資料庫中的文件集合。
