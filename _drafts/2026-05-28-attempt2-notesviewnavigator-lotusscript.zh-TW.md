---
title: "深入探討 NotesViewNavigator：LotusScript 中的視圖導航"
description: "本指南詳細介紹了如何在 LotusScript 中使用 NotesViewNavigator 類別來有效地遍歷和操作 HCL Domino 視圖中的條目。"
pubDate: "2026-05-28T07:32:20+08:00"
lang: "zh-TW"
slug: "notesviewnavigator-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesViewNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Accessing NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Examples: GetNext method (NotesViewNavigator - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_EXAMPLES_GETNEXT_METHOD_EX_VIEWNAV.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html" was already cited by [lotusscript-view-to-excel] on 2026-05-26. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesviewnavigator-lotusscript
-->

## 簡介

在 HCL Domino 開發中，**NotesViewNavigator** 類別提供了一種高效的方法來遍歷視圖中的條目。與直接使用 **NotesView** 不同，**NotesViewNavigator** 允許開發者更靈活地訪問和操作視圖中的文檔、類別和總計等元素。

## 創建 NotesViewNavigator

要創建 **NotesViewNavigator**，首先需要獲取一個 **NotesView** 對象，然後使用其方法來初始化導航器。例如：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim navigator As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set navigator = view.CreateViewNav
```

在此示例中，`CreateViewNav` 方法返回一個 **NotesViewNavigator** 對象，該對象代表視圖中的所有條目。

## 遍歷視圖條目

**NotesViewNavigator** 提供了多種方法來遍歷視圖條目，包括：

- `GetFirst`: 獲取第一個條目。
- `GetNext`: 獲取當前條目的下一個條目。
- `GetNextDocument`: 獲取當前文檔條目的下一個文檔條目，跳過類別和總計條目。

以下示例演示了如何使用這些方法來遍歷視圖中的所有文檔條目：

```lotusscript
Dim entry As NotesViewEntry
Set entry = navigator.GetFirstDocument

Do While Not (entry Is Nothing)
    ' 在此處處理每個文檔條目
    Set entry = navigator.GetNextDocument(entry)
Loop
```

在此示例中，`GetFirstDocument` 方法返回第一個文檔條目，`GetNextDocument` 方法則返回下一個文檔條目，直到沒有更多的文檔條目為止。

## 訪問條目屬性

每個 **NotesViewEntry** 對象都包含多個屬性，可用於獲取條目的詳細信息。例如：

- `ColumnValues`: 返回條目在視圖中每列的值。
- `IsCategory`: 指示條目是否為類別。
- `IsDocument`: 指示條目是否為文檔。

以下示例演示了如何檢查條目類型並訪問其列值：

```lotusscript
If entry.IsDocument Then
    Dim columnValues As Variant
    columnValues = entry.ColumnValues
    ' 處理列值
End If
```

## 設置導航器屬性

**NotesViewNavigator** 具有多個屬性，可用於控制其行為：

- `CacheSize`: 設置導航器的緩存大小，以提高性能。
- `MaxLevel`: 設置導航器的最大導航層級。

例如，以下代碼設置了導航器的最大層級：

```lotusscript
navigator.MaxLevel = 2
```

這將限制導航器僅遍歷視圖的前兩個層級。

## 注意事項

在使用 **NotesViewNavigator** 時，請注意以下事項：

- **自動更新**：避免自動更新父視圖，因為這可能會降低性能並導致導航器中的條目無效。建議將視圖的 `AutoUpdate` 屬性設置為 `False`，並在需要時手動刷新視圖。

- **重複條目**：如果文檔被分類到多個類別中，則可能存在重複條目。在這種情況下，`GetEntry` 方法將返回文檔的第一個實例。

通過正確使用 **NotesViewNavigator**，開發者可以更高效地遍歷和操作 HCL Domino 視圖中的條目，從而提高應用程序的性能和靈活性。

有關更多詳細信息，請參閱 [NotesViewNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html) 和 [訪問 NotesViewNavigator 屬性](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html)。
