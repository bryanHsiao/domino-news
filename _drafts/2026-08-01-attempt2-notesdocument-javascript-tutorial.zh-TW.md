---
title: "使用 JavaScript 操作 NotesDocument：完整指南"
description: "深入探討如何在 HCL Domino Designer 中使用 JavaScript 操作 NotesDocument，涵蓋創建、讀取、更新和刪除文檔的實踐方法。"
pubDate: "2026-08-01T08:03:52+08:00"
lang: "zh-TW"
slug: "notesdocument-javascript-tutorial"
tags:
  - "Tutorial"
  - "JavaScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument (JavaScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/reference/r_domino_Document.html"
  - title: "NotesURL (NotesDocument - JavaScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Document_NotesURL.html"
  - title: "Lock (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_LOCK_METHOD_DOC.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdocument-javascript-tutorial
-->

在 HCL Domino Designer 中，`NotesDocument` 類別允許開發者使用 JavaScript 操作資料庫中的文檔。本文將介紹如何創建、讀取、更新和刪除文檔，並提供實際範例。

## 創建新文檔

要創建新文檔，首先需要獲取目標資料庫的引用，然後使用 `createDocument` 方法：

```javascript
var db:NotesDatabase = session.getDatabase("serverName", "databasePath");
var doc:NotesDocument = db.createDocument();
doc.replaceItemValue("Form", "FormName");
doc.replaceItemValue("FieldName", "Value");
doc.save();
```

此範例中，`replaceItemValue` 方法用於設置文檔的字段值，`save` 方法用於保存文檔。

## 讀取現有文檔

要讀取現有文檔，可以使用 `getDocumentByID` 方法，該方法需要文檔的 NoteID：

```javascript
var doc:NotesDocument = db.getDocumentByID("NoteID");
var fieldValue = doc.getItemValueString("FieldName");
```

此範例中，`getItemValueString` 方法用於獲取指定字段的值。

## 更新文檔

要更新文檔，可以修改字段值，然後保存更改：

```javascript
doc.replaceItemValue("FieldName", "NewValue");
doc.save();
```

## 刪除文檔

要刪除文檔，可以使用 `remove` 方法：

```javascript
doc.remove(true);
```

此方法的參數 `true` 表示強制刪除，即使文檔在打開後被其他用戶修改。

## 鎖定文檔

在多用戶環境中，為防止同時編輯導致的衝突，可以使用 `lock` 方法鎖定文檔：

```javascript
var isLocked = doc.lock();
if (isLocked) {
    // 執行編輯操作
    doc.unlock();
} else {
    // 處理無法鎖定的情況
}
```

此範例中，`lock` 方法嘗試鎖定文檔，成功時返回 `true`，否則返回 `false`。

## 獲取文檔的 URL

可以使用 `getNotesURL` 方法獲取文檔的 Notes URL：

```javascript
var notesURL = doc.getNotesURL();
```

此方法返回文檔的 Notes 協議 URL。

通過上述方法，開發者可以在 HCL Domino Designer 中使用 JavaScript 有效地操作 `NotesDocument`，實現對文檔的創建、讀取、更新和刪除等操作。
