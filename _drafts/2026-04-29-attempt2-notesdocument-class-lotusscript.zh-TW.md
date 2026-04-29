---
title: "使用 LotusScript 操作 NotesDocument 類別的實用指南"
description: "深入探討如何在 LotusScript 中使用 NotesDocument 類別，涵蓋文檔的創建、修改、保存和郵寄等操作，並提供實用範例。"
pubDate: "2026-04-29T18:54:46+08:00"
lang: "zh-TW"
slug: "notesdocument-class-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocument-class-lotusscript
-->

## 簡介

在 HCL Domino 開發中，`NotesDocument` 類別是操作資料庫中文檔的核心。透過 LotusScript，開發者可以創建、讀取、更新和刪除文檔。本指南將詳細介紹如何使用 `NotesDocument` 類別，並提供實用範例。

## 創建新文檔

要在當前資料庫中創建新文檔，首先需要獲取當前資料庫的引用，然後使用 `New NotesDocument` 方法創建文檔。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
```

在此範例中，`session.CurrentDatabase` 返回當前資料庫的引用，`New NotesDocument(db)` 則在該資料庫中創建新文檔。

## 設置文檔屬性

創建文檔後，可以設置其屬性，例如主題和正文。

```lotusscript
doc.Form = "Memo"
doc.Subject = "會議通知"
doc.Body = "請注意，明天上午10點將舉行部門會議。"
```

設置 `Form` 屬性為 "Memo"，確保文檔在用戶界面中以郵件形式顯示。

## 保存文檔

設置完屬性後，需要保存文檔。

```lotusscript
Call doc.Save(True, True)
```

`Save` 方法的第一個參數表示是否進行自動保存，第二個參數表示是否強制保存。

## 郵寄文檔

要將文檔作為郵件發送，可以使用 `Send` 方法。

```lotusscript
Call doc.Send(False, "收件人姓名")
```

此方法的第一個參數表示是否保存副本，第二個參數是收件人的姓名或地址。

## 總結

`NotesDocument` 類別提供了強大的功能，允許開發者在 LotusScript 中高效地操作 HCL Domino 資料庫中的文檔。透過上述步驟，您可以創建、設置、保存和郵寄文檔，滿足各種應用需求。

有關更多詳細資訊，請參閱 [NotesDocument (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) 和 [NotesDocument 類別範例](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html)。
