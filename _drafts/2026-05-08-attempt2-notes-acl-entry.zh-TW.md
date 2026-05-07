---
title: "深入解析 NotesACLEntry：管理 Domino 資料庫的存取控制"
description: "本文詳細介紹了如何使用 LotusScript 中的 NotesACLEntry 類別來管理 HCL Domino 資料庫的存取控制清單（ACL），包括新增、修改和刪除 ACL 條目的步驟。"
pubDate: "2026-05-08T07:23:24+08:00"
lang: "zh-TW"
slug: "notes-acl-entry"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html"
  - title: "NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDATABASE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-acl-entry
-->

## 什麼是 NotesACLEntry？

在 HCL Domino 中，存取控制清單（ACL）決定了哪些使用者或群組可以存取資料庫，以及他們擁有的權限。`NotesACLEntry` 類別代表 ACL 中的單一條目，允許開發人員透過 LotusScript 程式碼來管理這些條目。

## 使用 NotesACLEntry 管理 ACL 條目

以下是如何使用 `NotesACLEntry` 類別來新增、修改和刪除 ACL 條目的步驟。

### 1. 取得資料庫的 ACL

首先，您需要取得目標資料庫的 ACL 物件。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

在此程式碼中，`session.CurrentDatabase` 取得當前資料庫，`db.ACL` 則取得該資料庫的 ACL。

### 2. 新增 ACL 條目

要新增新的 ACL 條目，您可以使用 `CreateACLEntry` 方法。

```lotusscript
Dim entry As NotesACLEntry

Set entry = acl.CreateACLEntry("John Doe", ACLLEVEL_EDITOR)
entry.IsPerson = True
entry.CanCreateDocuments = True
entry.CanDeleteDocuments = False

acl.Save
```

此程式碼新增了一個名為 "John Doe" 的使用者，賦予編輯者（Editor）等級的權限，允許其建立文件但不允許刪除文件。最後，使用 `acl.Save` 方法保存更改。

### 3. 修改現有的 ACL 條目

若要修改現有的 ACL 條目，您需要先取得該條目，然後進行修改。

```lotusscript
Dim entry As NotesACLEntry

Set entry = acl.GetEntry("John Doe")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_MANAGER
    entry.CanDeleteDocuments = True
    acl.Save
Else
    MsgBox "找不到名為 'John Doe' 的 ACL 條目。"
End If
```

此程式碼將 "John Doe" 的權限等級提升為管理者（Manager），並允許其刪除文件。

### 4. 刪除 ACL 條目

要刪除 ACL 條目，您可以使用 `RemoveACLEntry` 方法。

```lotusscript
acl.RemoveACLEntry("John Doe")
acl.Save
```

此程式碼刪除了名為 "John Doe" 的 ACL 條目，並保存更改。

## 注意事項

- 在修改 ACL 之前，確保您擁有足夠的權限。
- 每次對 ACL 進行更改後，請記得呼叫 `acl.Save` 方法以保存更改。
- 使用 `NotesACLEntry` 類別時，請參考 [官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html) 以獲取更詳細的資訊。

透過上述步驟，您可以有效地使用 LotusScript 來管理 HCL Domino 資料庫的存取控制清單，確保資料庫的安全性和正確的存取權限配置。
