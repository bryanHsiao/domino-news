---
title: "使用 LotusScript 操作 NotesNoteCollection"
description: "深入探討如何在 LotusScript 中使用 NotesNoteCollection 類別來管理 Domino 資料庫中的設計和數據元素。"
pubDate: "2026-08-21T07:27:20+08:00"
lang: "zh-TW"
slug: "notesnotecollection-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesNoteCollection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS.html"
  - title: "Building a note collection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_BUILDING_A_NOTE_COLLECTION.html"
  - title: "CreateNoteCollection (NotesDatabase - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATENOTECOLLECTION_METHOD_DATABASE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesnotecollection-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 的開發中，LotusScript 提供了強大的工具來管理資料庫中的各種元素。`NotesNoteCollection` 類別允許開發者收集和操作資料庫中的設計和數據元素，這對於批量處理和自動化任務非常有用。

## 創建 NotesNoteCollection

要創建一個 `NotesNoteCollection` 對象，首先需要獲取當前資料庫的引用，然後使用 `CreateNoteCollection` 方法。此方法的參數決定了是否選擇所有的元素。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim noteCollection As NotesNoteCollection

Set db = session.CurrentDatabase
Set noteCollection = db.CreateNoteCollection(False)
```

在此示例中，`False` 表示不自動選擇所有元素。您可以根據需要設置 `Select` 屬性來選擇特定的元素類型。

## 設置選擇屬性

`NotesNoteCollection` 提供了多個 `Select` 屬性，允許您指定要包含的元素類型。例如，若要選擇所有的表單和視圖，可以設置以下屬性：

```lotusscript
noteCollection.SelectForms = True
noteCollection.SelectViews = True
```

此外，您還可以使用 `SelectionFormula` 屬性來基於特定條件選擇元素。

## 構建集合

在設置完所需的選擇屬性後，使用 `BuildCollection` 方法來構建集合。

```lotusscript
Call noteCollection.BuildCollection()
```

構建完成後，您可以使用 `Count` 屬性來獲取集合中元素的數量。

## 遍歷集合

要遍歷集合中的元素，可以使用 `GetFirstNoteID` 和 `GetNextNoteID` 方法。

```lotusscript
Dim noteID As String
noteID = noteCollection.GetFirstNoteID()

Do While noteID <> ""
    ' 在此處處理每個元素
    noteID = noteCollection.GetNextNoteID(noteID)
Loop
```

## 結論

`NotesNoteCollection` 類別為開發者提供了一種高效的方法來管理和操作 Domino 資料庫中的設計和數據元素。通過正確地設置選擇屬性和使用相關方法，您可以輕鬆地執行各種批量操作。

有關更多詳細信息，請參閱 [NotesNoteCollection (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS.html) 和 [Building a note collection (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_BUILDING_A_NOTE_COLLECTION.html)。
