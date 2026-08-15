---
title: "使用 LotusScript 操作 NotesOutline：建立與管理大綱"
description: "本教程介紹如何使用 LotusScript 的 NotesOutline 類別來建立和管理 Domino 資料庫中的大綱，包括建立大綱、添加條目、設定屬性和保存變更。"
pubDate: "2026-08-16T07:22:22+08:00"
lang: "zh-TW"
slug: "notes-outline-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "CreateEntry (NotesOutline - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEENTRY_METHOD_OUTLINE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-outline-lotusscript-tutorial
-->

在 HCL Domino Designer 中，大綱（Outline）是一種用於組織和導航資料庫內容的結構。透過 LotusScript 的 NotesOutline 類別，開發者可以程式化地建立和管理大綱。本文將介紹如何使用 NotesOutline 類別來建立和管理大綱。

## 1. 建立新的大綱

要在當前資料庫中建立新的大綱，可以使用 `CreateOutline` 方法。此方法需要提供大綱的名稱。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Set db = session.CurrentDatabase
    Set outline = db.CreateOutline("MyOutline")
    MsgBox "已建立大綱：" & outline.Name
End Sub
```

在上述程式碼中，`CreateOutline` 方法建立了一個名為 "MyOutline" 的新大綱，並顯示其名稱。

## 2. 添加條目到大綱

建立大綱後，可以使用 `CreateEntry` 方法向其中添加條目。此方法允許指定條目的名稱，以及可選的參數來設定條目的位置和層級。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Dim entry As NotesOutlineEntry
    Set db = session.CurrentDatabase
    Set outline = db.GetOutline("MyOutline")
    Set entry = outline.CreateEntry("首頁")
    Call outline.Save
    MsgBox "已添加條目：" & entry.Label
End Sub
```

在此範例中，`CreateEntry` 方法在 "MyOutline" 大綱中添加了一個名為 "首頁" 的條目，並保存了變更。

## 3. 設定條目的屬性

每個大綱條目都有多個屬性可供設定，例如標籤（Label）、URL、是否隱藏等。可以使用相應的屬性方法來設定這些值。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Dim entry As NotesOutlineEntry
    Set db = session.CurrentDatabase
    Set outline = db.GetOutline("MyOutline")
    Set entry = outline.CreateEntry("關於我們")
    entry.URL = "/aboutus"
    entry.IsHidden = False
    Call outline.Save
    MsgBox "已添加條目：" & entry.Label & "，URL：" & entry.URL
End Sub
```

此程式碼在 "MyOutline" 大綱中添加了一個名為 "關於我們" 的條目，設定其 URL 為 "/aboutus"，並確保該條目可見。

## 4. 保存變更

在對大綱進行任何修改後，必須調用 `Save` 方法來保存變更。如果未保存，所有修改將在程式結束時丟失。

```lotusscript
Call outline.Save
```

透過上述步驟，開發者可以使用 LotusScript 的 NotesOutline 類別來建立和管理 Domino 資料庫中的大綱，從而提升應用程式的組織性和可導航性。
