---
title: "深入解析 NotesViewNavigator：高效遍歷 Domino 視圖"
description: "本教程將指導您如何使用 NotesViewNavigator 類別，以高效地遍歷 HCL Domino 視圖，並提供實用的 LotusScript 範例。"
pubDate: "2026-04-29T07:23:49+08:00"
lang: "zh-TW"
slug: "notes-view-navigator"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesViewNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_PROPERTIES.html"
  - title: "NotesViewNavigator methods"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_METHODS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-view-navigator
-->

## 介紹

在 HCL Domino 應用程式開發中，視圖（View）是組織和顯示資料的關鍵元素。當需要程式化地遍歷視圖中的文件時，LotusScript 提供了強大的工具，其中之一就是 `NotesViewNavigator` 類別。本文將深入探討如何使用 `NotesViewNavigator` 來高效地遍歷視圖，並提供實用的範例程式碼。

## NotesViewNavigator 類別概述

`NotesViewNavigator` 類別允許開發人員以程式方式導航視圖中的條目（Entry），無論是文件、類別還是視圖的其他元素。與直接遍歷 `NotesView` 的 `NotesViewEntryCollection` 相比，`NotesViewNavigator` 提供了更靈活和高效的方式來訪問視圖內容。

### 主要屬性

- **Navigator**：指示當前導航器的位置。
- **Entry**：返回當前條目。

### 主要方法

- **GetFirst**：獲取視圖中的第一個條目。
- **GetNext**：獲取當前條目的下一個條目。
- **GetChild**：獲取當前條目的第一個子條目。
- **GetParent**：獲取當前條目的父條目。
- **GetNextSibling**：獲取當前條目的下一個同級條目。
- **GetPrevSibling**：獲取當前條目的上一個同級條目。

## 使用範例

以下範例展示了如何使用 `NotesViewNavigator` 遍歷視圖中的所有文件條目：

```lotusscript
Sub TraverseViewEntries(view As NotesView)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim navigator As NotesViewNavigator
    Dim entry As NotesViewEntry

    Set db = session.CurrentDatabase
    Set navigator = view.CreateViewNav
    Set entry = navigator.GetFirst

    Do While Not entry Is Nothing
        ' 處理當前條目
        Print "Document UNID: " & entry.Document.UniversalID
        Set entry = navigator.GetNext(entry)
    Loop
End Sub
```

在此範例中，我們首先創建了一個 `NotesViewNavigator`，然後使用 `GetFirst` 方法獲取視圖中的第一個條目，並通過 `GetNext` 方法遍歷所有條目。

## 高級用法

`NotesViewNavigator` 也支持更複雜的導航，例如遍歷子條目或同級條目。以下範例展示了如何遍歷特定條目的所有子條目：

```lotusscript
Sub TraverseChildEntries(view As NotesView, parentEntry As NotesViewEntry)
    Dim navigator As NotesViewNavigator
    Dim childEntry As NotesViewEntry

    Set navigator = view.CreateViewNav
    Set childEntry = navigator.GetChild(parentEntry)

    Do While Not childEntry Is Nothing
        ' 處理子條目
        Print "Child Document UNID: " & childEntry.Document.UniversalID
        Set childEntry = navigator.GetNextSibling(childEntry)
    Loop
End Sub
```

在此範例中，`GetChild` 方法用於獲取指定父條目的第一個子條目，然後使用 `GetNextSibling` 方法遍歷所有同級子條目。

## 結論

`NotesViewNavigator` 是一個強大且靈活的工具，允許開發人員高效地遍歷 HCL Domino 視圖中的條目。通過理解其屬性和方法，您可以在 LotusScript 中實現更高效的視圖導航和數據處理。

有關 `NotesViewNavigator` 的更多詳細資訊，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html)。
