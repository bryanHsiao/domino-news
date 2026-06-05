---
title: "使用 LotusScript 操作 NotesOutline：完整指南"
description: "深入探討如何使用 LotusScript 操作 HCL Domino 中的 NotesOutline，涵蓋建立、修改和管理大綱及其條目。"
pubDate: "2026-06-06T07:32:24+08:00"
lang: "zh-TW"
slug: "notes-outline-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "Examples: CreateEntry method"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_CREATEENTRY_METHOD_EX.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-outline-lotusscript
-->

## 簡介

在 HCL Domino 中，大綱（NotesOutline）是一種導航結構，允許開發者組織和展示資料庫中的元素，如視圖、文件和表單。透過 LotusScript，開發者可以程式化地建立、修改和管理這些大綱及其條目（NotesOutlineEntry）。

## 建立新的大綱

要在資料庫中建立新的大綱，可以使用 `CreateOutline` 方法。以下範例展示如何在當前資料庫中建立名為 "MainOutline" 的大綱：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline

Set db = session.CurrentDatabase
Set outline = db.CreateOutline("MainOutline")
```

## 訪問現有的大綱

若要訪問現有的大綱，可以使用 `GetOutline` 方法：

```lotusscript
Set outline = db.GetOutline("ExistingOutline")
```

## 向大綱添加條目

使用 `CreateEntry` 方法可以向大綱添加新的條目。以下範例展示如何添加一個名為 "First Entry" 的條目：

```lotusscript
Dim entry As NotesOutlineEntry
Set entry = outline.CreateEntry("First Entry")
```

您還可以使用 `CreateEntryFrom` 方法，基於現有的條目來創建新條目。

## 設置條目的屬性

創建條目後，可以設置其各種屬性，如標籤（Label）、URL、類型等。例如，設置條目的 URL：

```lotusscript
entry.SetURL("http://www.example.com")
```

## 保存大綱

對大綱進行修改後，請記得使用 `Save` 方法保存更改：

```lotusscript
Call outline.Save
```

## 總結

透過 LotusScript，開發者可以靈活地操作 HCL Domino 中的大綱，從而更好地組織和展示資料庫內容。更多詳細資訊，請參閱 [NotesOutline 類別說明](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESOUTLINE_CLASS.html) 和 [NotesOutlineEntry 類別說明](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESOUTLINEENTRY_CLASS.html)。
