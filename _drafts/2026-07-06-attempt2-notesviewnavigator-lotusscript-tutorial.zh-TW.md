---
title: "使用 NotesViewNavigator 遍歷視圖條目"
description: "深入探討如何使用 NotesViewNavigator 類別在 LotusScript 中遍歷 HCL Domino 視圖的條目，並提供實用範例。"
pubDate: "2026-07-06T08:10:20+08:00"
lang: "zh-TW"
slug: "notesviewnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesViewNavigator class (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Accessing NotesViewNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "Examples: GetFirstDocument method (NotesViewNavigator - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_GETFIRSTDOCUMENT_METHOD_EX_VIEWNAV.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 2
slug: notesviewnavigator-lotusscript-tutorial
topicOverlap: false
issues:
  [critical] Set nav = view.CreateViewNav
      problem: CreateViewNav is not a method on NotesView. The correct method name is CreateViewNav() — actually this exists, but the fuller API surface is being misrepresented. More critically, the article never mentions CreateViewNavFrom, CreateViewNavFromCategory, CreateViewNavFromDescendants, or CreateViewNavMaxLevel — all real, commonly used factory methods on NotesView that are essential context for this topic. Omitting them makes the article materially incomplete for a production audience.
      fix:     Add a section or at minimum a paragraph covering CreateViewNavFrom (start from a specific entry), CreateViewNavFromCategory (all entries under a category), CreateViewNavFromDescendants, and CreateViewNavMaxLevel, explaining when to use each.
  [critical] Set entry = nav.GetNextDocument(entry)
      problem: GetNextDocument (and GetNext, GetPrev, etc.) on NotesViewNavigator do NOT take the current entry as an argument in LotusScript. They take no argument — the navigator maintains its own internal cursor position. The correct call is simply nav.GetNextDocument() with no argument. Showing a parameter here will cause a compile or runtime error.
      fix:     Remove the argument: change nav.GetNextDocument(entry) to nav.GetNextDocument() throughout. Same applies to any other navigation method calls that are shown with an entry argument.
  [major] GetFirst, GetNext, GetFirstDocument, GetNextDocument
      problem: The article lists only four traversal methods and implies this is the full set. It omits GetLast, GetPrev, GetPrevDocument, GetLastDocument, GetNth, GetPos, GetChild, GetParent, GetNextSibling, GetPrevSibling — all legitimate NotesViewNavigator methods. A reader building non-trivial navigation (e.g. walking a categorised view hierarchically) would be poorly served.
      fix:     Expand the methods list to at least mention the backward-navigation counterparts (GetLast/GetPrev/GetPrevDocument) and the hierarchical navigation methods (GetChild, GetParent, GetNextSibling, GetPrevSibling), even if only briefly.
  [major] entry.ColumnValues(0)
      problem: ColumnValues is a 0-based array in LotusScript, which the article shows correctly, but it does not warn that the type of each element is Variant and can be a scalar, an array (for multi-value fields), or a date/time object (NotesDateTime). Treating all column values as strings without type-checking is a common source of runtime errors and the article should flag this.
      fix:     Add a note that ColumnValues returns an array of Variants; individual elements may be strings, numbers, NotesDateTime objects, or sub-arrays for multi-value columns, and code should check/convert accordingly.
  [major] Setting View AutoUpdate
      problem: The article presents view.AutoUpdate = False as a general performance tip but does not explain the risk: if the view index is rebuilt or updated by another user or the server while AutoUpdate is False and navigation is in progress, the navigator can return stale or inconsistent results. It also does not mention that AutoUpdate should be restored to True (or the view released) after traversal, nor does it mention the related NotesViewNavigator.BufferMaxEntries property which is the more direct performance knob for navigator pre-fetching.
      fix:     Qualify the AutoUpdate advice with the staleness caveat, remind readers to re-enable it after traversal, and mention BufferMaxEntries as the navigator-specific performance property.
  [major] UniversalID: The universal ID of the document associated with the entry
      problem: NotesViewEntry.UniversalID is valid only when IsDocument is True. For category entries, UniversalID is empty/meaningless. The article lists it as a general property of NotesViewEntry without this qualification, which is misleading.
      fix:     Qualify the UniversalID property description: note it is only meaningful when IsDocument is True, and is empty for category and total entries.
  [minor] Introduction — 'including documents, categories, and totals'
      problem: The article mentions 'totals' as an entry type but never explains what a total entry is (a view totals row), nor does it cover IsTotal on NotesViewEntry. Mentioning it without any follow-up is confusing.
      fix:     Either add a brief explanation of total entries and the IsTotal property, or remove 'totals' from the introduction if the article will not cover them.
  [minor] Conclusion / overall article
      problem: The article does not mention the Cache / BufferMaxEntries property of NotesViewNavigator, which is the primary tuning lever for large-view traversal performance — a significant omission for a production-focused article.
      fix:     Add a brief note on NotesViewNavigator.BufferMaxEntries (default 0 = no pre-fetch; setting it to e.g. 400 can dramatically improve throughput on large views).
-->

## 簡介

在 HCL Domino 應用程式開發中，經常需要程式化地存取和操作視圖中的條目。`NotesViewNavigator` 類別提供了一種高效的方法來遍歷視圖條目，包括文件、類別和總計條目。本文將探討如何在 LotusScript 中使用 `NotesViewNavigator`，並提供實用範例。

## 創建 NotesViewNavigator

要創建 `NotesViewNavigator`，首先需要獲取目標視圖的 `NotesView` 對象。然後，使用 `CreateViewNav` 方法創建導航器。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView
Dim nav As NotesViewNavigator

Set db = session.CurrentDatabase
Set view = db.GetView("YourViewName")
Set nav = view.CreateViewNav
```

在此範例中，`CreateViewNav` 方法返回一個 `NotesViewNavigator` 對象，代表視圖中的所有條目。

## 遍歷視圖條目

`NotesViewNavigator` 提供多種方法來遍歷視圖條目。以下是一些常用方法：

- `GetFirst`: 獲取第一個條目。
- `GetNext`: 獲取當前條目的下一個條目。
- `GetFirstDocument`: 獲取第一個文件條目，跳過類別和總計條目。
- `GetNextDocument`: 獲取當前文件條目的下一個文件條目。

以下範例演示如何使用這些方法遍歷視圖中的所有文件條目：

```lotusscript
Dim entry As NotesViewEntry
Set entry = nav.GetFirstDocument

Do While Not (entry Is Nothing)
    ' 在此處處理 entry
    Set entry = nav.GetNextDocument(entry)
Loop
```

在此範例中，`GetFirstDocument` 方法返回第一個文件條目，然後使用 `GetNextDocument` 方法遍歷剩餘的文件條目。

## 訪問條目屬性

`NotesViewEntry` 對象代表視圖中的單個條目，提供多種屬性來訪問條目信息：

- `ColumnValues`: 條目在視圖中的列值。
- `IsCategory`: 指示條目是否為類別條目。
- `IsDocument`: 指示條目是否為文件條目。
- `UniversalID`: 條目關聯文檔的通用 ID。

以下範例演示如何訪問條目的列值和文檔 ID：

```lotusscript
If entry.IsDocument Then
    Dim doc As NotesDocument
    Set doc = entry.Document
    MsgBox "Document Universal ID: " & doc.UniversalID
    MsgBox "First Column Value: " & entry.ColumnValues(0)
End If
```

## 設置視圖自動更新

為了提高性能，建議在遍歷視圖條目時禁用視圖的自動更新。這可以通過將視圖的 `AutoUpdate` 屬性設置為 `False` 來實現：

```lotusscript
view.AutoUpdate = False
```

禁用自動更新可以防止在遍歷過程中視圖被刷新，從而避免潛在的錯誤和性能問題。

## 結論

`NotesViewNavigator` 類別為在 LotusScript 中遍歷 HCL Domino 視圖條目提供了強大且靈活的工具。通過理解其方法和屬性，開發人員可以高效地存取和操作視圖中的條目，從而增強應用程式的功能和性能。

有關 `NotesViewNavigator` 的更多詳細信息，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html)。

此外，您還可以參考 [訪問 NotesViewNavigator 屬性](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_NOTESVIEWNAVIGATOR_PROPERTIES_STEPS_NOTESVIEWNAVIGATOR_CLASS.html) 和 [GetFirstDocument 方法範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_GETFIRSTDOCUMENT_METHOD_EX_VIEWNAV.html) 以獲取更多實用範例。
