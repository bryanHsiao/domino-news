---
title: "使用 LotusScript 探索 NotesViewNavigator"
description: "深入了解 NotesViewNavigator 類別，學習如何在 LotusScript 中有效地遍歷和操作 Domino 視圖的條目。"
pubDate: "2026-06-10T07:33:38+08:00"
lang: "zh-TW"
slug: "notesviewnavigator-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesViewNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesViewNavigator methods"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_METHODS.html"
  - title: "NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_PROPERTIES.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesviewnavigator-lotusscript
-->

在 HCL Domino 的 LotusScript 開發中，`NotesViewNavigator` 類別提供了一種高效的方法來遍歷和操作視圖（view）中的條目。透過此類別，開發者可以精確地控制視圖的導航，實現更複雜的資料處理邏輯。

## 什麼是 NotesViewNavigator？

`NotesViewNavigator` 是一個用於遍歷 `NotesView` 中條目的類別。它允許開發者以不同的方式導航視圖，例如按順序、按類別或按特定條件。這對於需要精細控制視圖遍歷的應用程式特別有用。

## 創建 NotesViewNavigator

要創建一個 `NotesViewNavigator`，首先需要獲取一個 `NotesView` 對象，然後使用其 `CreateViewNav` 方法：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim navigator As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set navigator = view.CreateViewNav
```

這段程式碼獲取當前資料庫中的指定視圖，並為該視圖創建一個導航器。

## 遍歷視圖條目

創建 `NotesViewNavigator` 後，可以使用其方法來遍歷視圖中的條目。例如，使用 `GetFirst` 和 `GetNext` 方法來順序遍歷所有條目：

```lotusscript
Dim entry As NotesViewEntry

Set entry = navigator.GetFirst
Do While Not entry Is Nothing
    ' 在這裡處理每個條目
    Set entry = navigator.GetNext(entry)
Loop
```

這段程式碼從視圖的第一個條目開始，依次遍歷每個條目，直到沒有更多條目為止。

## 按類別遍歷

如果視圖包含類別，`NotesViewNavigator` 允許按類別遍歷條目。使用 `GetFirstCategory` 和 `GetNextCategory` 方法：

```lotusscript
Dim category As NotesViewEntry

Set category = navigator.GetFirstCategory
Do While Not category Is Nothing
    ' 在這裡處理每個類別
    Set category = navigator.GetNextCategory(category)
Loop
```

這樣可以遍歷視圖中的每個類別，對其進行特定的處理。

## 遍歷特定條目

`NotesViewNavigator` 也支持從特定條目開始遍歷。例如，使用 `GetEntryByKey` 方法找到特定鍵值的條目，然後從該條目開始遍歷：

```lotusscript
Dim key As Variant
Dim entry As NotesViewEntry

key = "SpecificKey"
Set entry = navigator.GetEntryByKey(key, True)
If Not entry Is Nothing Then
    ' 處理找到的條目
End If
```

這允許開發者直接定位到特定的視圖條目，進行精確的操作。

## 結論

`NotesViewNavigator` 類別為 LotusScript 開發者提供了一種強大的工具，用於高效地遍歷和操作 Domino 視圖中的條目。透過熟悉其方法和屬性，開發者可以實現更靈活和高效的資料處理邏輯。

欲了解更多關於 `NotesViewNavigator` 的資訊，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html)。
