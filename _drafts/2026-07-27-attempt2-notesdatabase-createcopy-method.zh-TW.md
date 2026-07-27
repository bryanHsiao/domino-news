---
title: "使用 NotesDatabase.CreateCopy 方法建立資料庫副本"
description: "深入探討如何使用 LotusScript 中的 NotesDatabase.CreateCopy 方法來建立資料庫的空白副本，包括語法、參數、使用注意事項及實際範例。"
pubDate: "2026-07-27T08:02:41+08:00"
lang: "zh-TW"
slug: "notesdatabase-createcopy-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "CreateCopy (NotesDatabase - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=lotusscript-createcopy-notesdatabase"
  - title: "Examples: CreateCopy method"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-examples-createcopy-method"
  - title: "NotesDatabase class"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesdatabase-class"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=lotusscript-createcopy-notesdatabase, https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-examples-createcopy-method, https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesdatabase-class
attempt: 2
slug: notesdatabase-createcopy-method
-->

## 簡介

在 HCL Domino 開發中，您可能需要建立現有資料庫的副本以進行測試、備份或其他目的。LotusScript 提供了 `NotesDatabase` 類別的 `CreateCopy` 方法，允許您建立資料庫的空白副本。本文將詳細介紹該方法的使用方式。

## 語法與參數

`CreateCopy` 方法的語法如下：

```lotusscript
Set notesDatabaseNew = notesDatabase.CreateCopy(newServer$, newDbFile$ [, maxsize%])
```

- `newServer$`：新資料庫所在伺服器的名稱。使用空字串（""）表示在當前電腦上建立副本。
- `newDbFile$`：新副本的檔案名稱。
- `maxsize%`（可選）：新資料庫的最大大小（以 GB 為單位）。此參數適用於 Release 4 的資料庫或尚未升級至 Release 5 的伺服器上的資料庫。輸入大於 4 的整數會產生運行時錯誤。

## 使用注意事項

- 如果在 `newServer$` 和 `newDbFile$` 指定的位置已存在同名資料庫，則會產生錯誤編號 4005（"File already exists"）。
- 副本包含原始資料庫的設計元素、相同的存取控制清單（ACL）和相同的標題，但不包含任何文件。
- 副本不是複製品（Replica）。
- 原始資料庫的 ACL 會被複製到新資料庫，但您可能需要修改副本的 ACL。例如，即使您不是原始資料庫的管理者，您可能希望對副本擁有管理者存取權限。可以使用 `GrantAccess` 和 `RevokeAccess` 方法來修改副本的 ACL。

## 實際範例

以下範例展示如何使用 `CreateCopy` 方法來建立資料庫的空白副本：

```lotusscript
Dim db As NotesDatabase, archiveDb As NotesDatabase
Set db = New NotesDatabase("Athens", "purchase.nsf")
Set archiveDb = db.CreateCopy("Athens", "archive\purchase.nsf")
```

在此範例中，程式碼在伺服器 "Athens" 上建立了 "purchase.nsf" 資料庫的空白副本，副本的路徑為 "archive\purchase.nsf"。

## 參考資料

- [CreateCopy 方法（NotesDatabase - LotusScript）](https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=lotusscript-createcopy-notesdatabase)
- [CreateCopy 方法範例](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-examples-createcopy-method)
- [NotesDatabase 類別](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesdatabase-class)
