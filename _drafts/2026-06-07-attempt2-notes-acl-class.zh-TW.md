---
title: "使用 NotesACL 類別管理 Domino 資料庫存取權限"
description: "深入探討如何透過 LotusScript 的 NotesACL 類別來管理 HCL Domino 資料庫的存取控制，包括新增、修改和移除存取控制項。"
pubDate: "2026-06-07T07:27:55+08:00"
lang: "zh-TW"
slug: "notes-acl-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing database access with NotesACL"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MANAGING_DATABASE_ACCESS_WITH_NOTESACL.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl-class
-->

在 HCL Domino 中，存取控制清單（ACL）是管理資料庫安全性的關鍵組件。透過 LotusScript 的 `NotesACL` 類別，開發者可以程式化地管理 ACL，控制使用者和群組的存取權限。本文將介紹如何使用 `NotesACL` 和 `NotesACLEntry` 類別來管理資料庫的存取控制。

## 取得 NotesACL 物件

要存取資料庫的 ACL，首先需要取得 `NotesACL` 物件。這可以透過 `NotesDatabase` 類別的 `ACL` 屬性來實現：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

## 新增 ACL 條目

要新增新的 ACL 條目，使用 `CreateACLEntry` 方法。以下範例展示如何為使用者新增讀取權限：

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("John Doe", ACLLEVEL_READER)
acl.Save
```

## 修改現有的 ACL 條目

若要修改現有的 ACL 條目，首先需要取得該條目，然後設定新的權限等級：

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("John Doe")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_EDITOR
    acl.Save
End If
```

## 移除 ACL 條目

要移除 ACL 條目，使用 `RemoveACLEntry` 方法：

```lotusscript
Call acl.RemoveACLEntry("John Doe")
acl.Save
```

## 設定 ACL 屬性

`NotesACL` 類別提供多種屬性來設定 ACL 的行為，例如：

- `UniformAccess`：控制是否強制統一存取。
- `AdminNames`：指定具有管理權限的使用者。

以下範例展示如何設定這些屬性：

```lotusscript
acl.UniformAccess = True
acl.AdminNames = "Admin1, Admin2"
acl.Save
```

## 結論

透過 `NotesACL` 和 `NotesACLEntry` 類別，開發者可以程式化地管理 HCL Domino 資料庫的存取控制，確保資料的安全性和正確的存取權限。更多詳細資訊，請參閱 [NotesACL 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) 和 [NotesACLEntry 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) 的官方文件。
