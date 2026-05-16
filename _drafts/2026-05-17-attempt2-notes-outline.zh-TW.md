---
title: "NotesOutline：LotusScript 中的視圖導航器"
description: "深入探討 NotesOutline 類別，學習如何在 LotusScript 中建立和管理視圖導航器，提升應用程式的使用者體驗。"
pubDate: "2026-05-17T07:22:59+08:00"
lang: "zh-TW"
slug: "notes-outline"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "NotesOutline - LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESOUTLINE_CLASS_EX.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-outline
-->

## 什麼是 NotesOutline？

在 HCL Domino 應用程式中，**NotesOutline** 類別允許開發者以程式方式存取和管理大綱（outline），這些大綱通常用於提供應用程式的導航結構。透過 **NotesOutline**，您可以建立、修改和刪除大綱條目，從而提升應用程式的使用者體驗。

## 建立新的大綱

要在 LotusScript 中建立新的大綱，您需要使用 **NotesDatabase** 類別的 `CreateOutline` 方法。以下是建立名為 "MainOutline" 的大綱的範例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline

Set db = session.CurrentDatabase
Set outline = db.CreateOutline("MainOutline")
Call outline.Save
```

在此程式碼中，我們首先取得當前資料庫的參考，然後使用 `CreateOutline` 方法建立新的大綱，最後呼叫 `Save` 方法將其儲存。

## 新增大綱條目

建立大綱後，您可以使用 **NotesOutlineEntry** 類別新增條目。以下範例展示如何新增一個指向特定視圖的條目：

```lotusscript
Dim entry As NotesOutlineEntry
Set entry = outline.CreateEntry("View Entry", True)
Call entry.SetView(db, "ViewName")
Call outline.Save
```

在此範例中，我們建立了一個名為 "View Entry" 的條目，並將其連結到名為 "ViewName" 的視圖。`True` 參數表示該條目是主要條目。

## 修改大綱條目

您可以透過 **NotesOutlineEntry** 的屬性和方法來修改現有條目。例如，以下程式碼將條目的標題更改為 "Updated Entry"：

```lotusscript
entry.Label = "Updated Entry"
Call outline.Save
```

## 刪除大綱條目

要刪除大綱條目，您可以使用 `RemoveEntry` 方法：

```lotusscript
Call outline.RemoveEntry(entry)
Call outline.Save
```

## 總結

透過 **NotesOutline** 和 **NotesOutlineEntry** 類別，您可以在 LotusScript 中有效地建立和管理大綱，從而提升 HCL Domino 應用程式的導航結構和使用者體驗。更多詳細資訊，請參閱 [NotesOutline 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html) 和 [NotesOutlineEntry 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html) 的官方文件。
