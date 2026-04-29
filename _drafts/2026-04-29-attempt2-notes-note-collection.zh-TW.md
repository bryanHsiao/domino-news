---
title: "深入探討 NotesNoteCollection：高效管理 Notes 文件"
description: "學習如何使用 NotesNoteCollection 類別來高效地收集和管理 Notes 文件，提升 LotusScript 應用程式的效能。"
pubDate: "2026-04-29T16:06:38+08:00"
lang: "zh-TW"
slug: "notes-note-collection"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNoteCollection class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html"
  - title: "NotesNoteCollection properties"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_PROPERTIES.html"
  - title: "NotesNoteCollection methods"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_METHODS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-note-collection
-->

## 什麼是 NotesNoteCollection？

在 HCL Domino 的 LotusScript 中，`NotesNoteCollection` 類別提供了一種高效的方法來收集和管理 Notes 文件（notes）。透過此類別，開發者可以根據特定條件收集文件，並對其進行批次處理，從而提升應用程式的效能。

## 為何使用 NotesNoteCollection？

傳統上，開發者可能會使用 `NotesDatabase` 的 `AllDocuments` 方法來獲取資料庫中的所有文件，然後逐一處理。然而，這種方法在處理大量文件時可能會導致效能問題。`NotesNoteCollection` 提供了一種更高效的方式，允許開發者根據特定條件收集文件，並對其進行批次處理。

## 如何使用 NotesNoteCollection？

以下是一個使用 `NotesNoteCollection` 的範例，展示如何收集並處理特定類型的文件：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesNoteCollection
Dim note As NotesDocument

Set db = session.CurrentDatabase
Set collection = db.CreateNoteCollection(False)

' 設定收集的條件，例如僅收集表單名稱為 "Memo" 的文件
collection.SelectForms = True
collection.SelectForm = "Memo"

' 建立收集
Call collection.BuildCollection

' 遍歷收集的文件
Set note = collection.GetFirstNote
Do While Not (note Is Nothing)
    ' 在此處理每個文件
    ' ...
    Set note = collection.GetNextNote
Loop
```

在上述範例中，我們首先建立了一個 `NotesNoteCollection`，並設定了收集條件，僅收集表單名稱為 "Memo" 的文件。然後，我們使用 `BuildCollection` 方法建立收集，並遍歷其中的每個文件進行處理。

## 進階應用：批次處理文件

`NotesNoteCollection` 允許開發者對收集的文件進行批次處理，例如批次刪除或更新。以下是一個批次刪除文件的範例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesNoteCollection

Set db = session.CurrentDatabase
Set collection = db.CreateNoteCollection(False)

' 設定收集的條件，例如僅收集特定類型的文件
collection.SelectDocuments = True
collection.SelectionFormula = "@Contains(Subject; '舊文件')"

' 建立收集
Call collection.BuildCollection

' 批次刪除收集的文件
Call collection.RemoveAll(True)
```

在此範例中，我們使用 `SelectionFormula` 屬性設定了收集條件，僅收集主題包含 "舊文件" 的文件。然後，使用 `RemoveAll` 方法批次刪除這些文件。

## 結論

`NotesNoteCollection` 是一個強大且高效的工具，適用於需要處理大量 Notes 文件的情境。透過正確地設定收集條件和使用適當的方法，開發者可以顯著提升 LotusScript 應用程式的效能和可維護性。更多詳細資訊，請參閱 [NotesNoteCollection 類別](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html) 和 [NotesNoteCollection 方法](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_METHODS.html)。
