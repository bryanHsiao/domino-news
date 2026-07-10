---
title: "使用 NotesURL 類別解析與生成 Domino URL"
description: "深入探討 NotesURL 類別，學習如何解析與生成 HCL Domino URL，並透過實例展示其在 LotusScript 中的應用。"
pubDate: "2026-07-10T08:07:29+08:00"
lang: "zh-TW"
slug: "notes-url-class"
tags:
  - "Domino Server"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesURL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESURL_CLASS.html"
  - title: "NotesURL properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTESURL.html"
  - title: "NotesURL methods"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_METHODS_NOTESURL.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESURL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-url-class
-->

在 HCL Domino 的開發中，處理 URL 是常見的需求。`NotesURL` 類別提供了一個強大的工具，讓開發者能夠解析和生成 Domino URL，從而更有效地管理和操作文檔、視圖等資源。

## 什麼是 NotesURL 類別？

`NotesURL` 類別是 HCL Domino 中的一個物件，允許開發者解析和生成符合 Domino 格式的 URL。透過此類別，您可以將 URL 分解為其組成部分，或從各個組件組合成完整的 URL。

## NotesURL 的主要屬性

- **Database**：表示 URL 中的資料庫部分。
- **View**：表示 URL 中的視圖部分。
- **Document**：表示 URL 中的文檔部分。
- **Action**：表示 URL 中的動作部分。
- **Navigator**：表示 URL 中的導航器部分。

這些屬性允許開發者存取和修改 URL 的各個組成部分，從而靈活地操作 Domino 資源。

## 如何使用 NotesURL 解析 URL

以下是一個使用 `NotesURL` 類別解析 Domino URL 的範例：

```lotusscript
Dim session As New NotesSession
Dim notesURL As NotesURL
Set notesURL = session.CreateURL("notes://ServerName/DatabaseName/ViewName/DocumentUNID")

Print "Database: " & notesURL.Database
Print "View: " & notesURL.View
Print "Document: " & notesURL.Document
```

在此範例中，我們創建了一個 `NotesURL` 物件，並解析了一個給定的 Domino URL，然後輸出其資料庫、視圖和文檔部分。

## 如何使用 NotesURL 生成 URL

`NotesURL` 也可以用來生成新的 Domino URL。以下是生成 URL 的範例：

```lotusscript
Dim session As New NotesSession
Dim notesURL As NotesURL
Set notesURL = session.CreateURL("")

notesURL.Server = "ServerName"
notesURL.Database = "DatabaseName"
notesURL.View = "ViewName"
notesURL.Document = "DocumentUNID"

Dim fullURL As String
fullURL = notesURL.GetURL()
Print "Generated URL: " & fullURL
```

在此範例中，我們創建了一個空的 `NotesURL` 物件，設置了伺服器、資料庫、視圖和文檔部分，然後生成了完整的 URL。

## 結論

`NotesURL` 類別為 HCL Domino 開發者提供了一個強大的工具，方便地解析和生成 Domino URL。透過熟悉其屬性和方法，開發者可以更有效地管理和操作 Domino 資源，提升應用程式的靈活性和可維護性。

更多詳細資訊，請參閱 [NotesURL 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESURL_CLASS.html) 和 [NotesURL 屬性](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTESURL.html)。
