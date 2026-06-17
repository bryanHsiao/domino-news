---
title: "使用 LotusScript 操作 NotesView：深入教程"
description: "本教程深入探討如何使用 LotusScript 操作 NotesView，包括存取視圖、遍歷文件、使用全域搜尋等，並提供實用範例。"
pubDate: "2026-06-18T07:38:08+08:00"
lang: "zh-TW"
slug: "notesview-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesView (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
  - title: "Examples: NotesView class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESVIEW_CLASS.html"
  - title: "Locating documents within a view or folder in LotusScript classes"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCATING_DOCUMENTS_WITHIN_A_VIEW_OR_FOLDER.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesview-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 開發中，`NotesView` 類別允許開發者透過 LotusScript 存取和操作資料庫中的視圖（view）或資料夾（folder）。透過 `NotesView`，您可以檢索文件、執行全文搜尋，以及管理視圖的各種屬性和方法。

## 存取視圖

要存取資料庫中的特定視圖，您可以使用 `NotesDatabase` 類別的 `GetView` 方法。以下範例展示如何取得名為 "Main View" 的視圖：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim view As NotesView

Set db = session.CurrentDatabase
Set view = db.GetView("Main View")
```

請注意，`GetView` 方法返回的是 `NotesView` 對象，代表指定的視圖。

## 遍歷視圖中的文件

一旦取得 `NotesView`，您可以使用 `GetFirstDocument` 和 `GetNextDocument` 方法遍歷視圖中的所有文件。以下範例展示如何遍歷視圖中的所有文件並輸出其主題：

```lotusscript
Dim doc As NotesDocument
Set doc = view.GetFirstDocument

While Not (doc Is Nothing)
    Print doc.GetItemValue("Subject")(0)
    Set doc = view.GetNextDocument(doc)
Wend
```

在此範例中，`GetFirstDocument` 方法返回視圖中的第一個文件，`GetNextDocument` 方法則返回指定文件之後的下一個文件。

## 使用全文搜尋

`NotesView` 提供 `FTSearch` 方法，允許您在視圖中執行全文搜尋。以下範例展示如何搜尋包含特定關鍵字的文件：

```lotusscript
Dim count As Integer
count = view.FTSearch("關鍵字")

If count > 0 Then
    Print "找到 " & count & " 個匹配的文件。"
Else
    Print "未找到匹配的文件。"
End If
```

`FTSearch` 方法返回匹配文件的數量，並將視圖過濾為僅包含匹配的文件。

## 設定視圖的自動更新

為了提高性能，建議將視圖的 `AutoUpdate` 屬性設為 `False`，以防止在遍歷視圖時自動更新。您可以在需要時手動調用 `Refresh` 方法來更新視圖。

```lotusscript
view.AutoUpdate = False
' ... 進行操作 ...
view.Refresh
```

## 結論

透過 `NotesView` 類別，開發者可以有效地存取和操作 HCL Domino 資料庫中的視圖。熟悉其屬性和方法將有助於開發更高效和功能豐富的應用程式。更多詳細資訊，請參閱 [NotesView 類別說明](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) 和 [NotesView 類別範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESVIEW_CLASS.html)。
