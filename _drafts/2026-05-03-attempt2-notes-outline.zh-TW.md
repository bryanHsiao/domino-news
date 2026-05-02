---
title: "使用 LotusScript 操作 NotesOutline：深入指南"
description: "本教程深入探討如何使用 LotusScript 的 NotesOutline 和 NotesOutlineEntry 類別來創建和管理 HCL Domino 應用程式中的大綱。"
pubDate: "2026-05-03T07:20:44+08:00"
lang: "zh-TW"
slug: "notes-outline"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "Examples: Accessing an outline"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_ACCESSING_AN_OUTLINE_EX_NOTESOUTLINE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-outline
-->

## 簡介

在 HCL Domino 應用程式中，大綱（outline）是一種用於組織和導航應用程式內容的結構化方式。透過 LotusScript 的 `NotesOutline` 和 `NotesOutlineEntry` 類別，開發者可以程式化地創建、修改和管理這些大綱。

## 什麼是 NotesOutline 和 NotesOutlineEntry？

- **NotesOutline**：代表資料庫中的一個大綱。它包含多個 `NotesOutlineEntry`，每個條目代表大綱中的一個節點。

- **NotesOutlineEntry**：代表大綱中的一個條目。每個條目可以包含子條目，形成層次結構。

## 創建和訪問大綱

要創建或訪問大綱，可以使用 `NotesDatabase` 類別的以下方法：

- `CreateOutline`：創建新的大綱。
- `GetOutline`：獲取現有的大綱。

以下示例展示如何訪問名為 "MyOutline" 的大綱並顯示其屬性：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim outline As NotesOutline
  Set db = session.CurrentDatabase
  Set outline = db.GetOutline("MyOutline")
  Messagebox outline.Alias
  Messagebox outline.Comment
End Sub
```

## 添加條目到大綱

要向大綱添加條目，可以使用 `CreateEntry` 方法。以下示例展示如何創建一個名為 "Home" 的新條目並將其添加到名為 "Web site" 的大綱中：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim outline As NotesOutline
  Dim oe As NotesOutlineEntry
  Set db = session.CurrentDatabase
  Set outline = db.GetOutline("Web site")
  Set oe = outline.CreateEntry("Home")
  Call outline.AddEntry(oe)
  Call outline.Save()
End Sub
```

## 瀏覽大綱條目

`NotesOutline` 提供多種方法來瀏覽其條目，例如：

- `GetFirst`：獲取大綱的第一個條目。
- `GetLast`：獲取大綱的最後一個條目。
- `GetNext`：獲取指定條目的下一個條目。
- `GetPrev`：獲取指定條目的上一個條目。

以下示例展示如何獲取 "products" 大綱的第二個條目並顯示其標籤：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline
Dim oeA As NotesOutlineEntry
Dim oeB As NotesOutlineEntry
Set db = session.CurrentDatabase
Set outline = db.GetOutline("products")
Set oeA = outline.GetFirst()
Set oeB = outline.GetNext(oeA)
Messagebox oeB.Label
```

## 移動和刪除條目

- `MoveEntry`：將條目從一個位置移動到另一個位置。
- `RemoveEntry`：從大綱中刪除指定的條目及其子條目。

## 保存更改

對大綱所做的更改需要使用 `Save` 方法保存。

## 結論

透過 `NotesOutline` 和 `NotesOutlineEntry` 類別，開發者可以程式化地創建和管理 HCL Domino 應用程式中的大綱，從而提高應用程式的組織性和可導航性。更多詳細資訊，請參閱 [NotesOutline (LotusScript)](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html) 和 [NotesOutlineEntry (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html)。
