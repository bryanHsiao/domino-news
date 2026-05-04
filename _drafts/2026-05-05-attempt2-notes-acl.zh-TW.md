---
title: "使用 LotusScript 管理 NotesACL"
description: "深入探討如何使用 LotusScript 操作 HCL Domino 的 NotesACL 類別，涵蓋 ACL 的讀取、修改和管理，確保資料庫的安全性和存取控制。"
pubDate: "2026-05-05T07:23:28+08:00"
lang: "zh-TW"
slug: "notes-acl"
tags:
  - "Domino Server"
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "NotesACL class - HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class - HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing Access Control Lists (ACLs) in LotusScript"
    url: "https://www.ibm.com/docs/en/notes/9.0.1?topic=ssw-9-0-1-composite-application-developer-managing-access-control-lists-acls-in-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl
-->

## 簡介

在 HCL Domino 中，存取控制清單（Access Control List，ACL）決定了哪些使用者或群組可以存取資料庫，以及他們擁有的權限。透過 LotusScript 的 `NotesACL` 類別，開發者可以程式化地讀取和修改 ACL，從而有效地管理資料庫的安全性。

## 讀取 ACL

要存取資料庫的 ACL，首先需要獲取 `NotesDatabase` 物件，然後使用其 `ACL` 屬性來取得 `NotesACL` 物件。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

## 新增 ACL 條目

要新增新的使用者或群組到 ACL 中，可以使用 `CreateACLEntry` 方法。以下範例展示了如何新增一個使用者並賦予其「編輯者」權限。

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("newuser", ACLLEVEL_EDITOR)
acl.Save
```

## 修改現有的 ACL 條目

若要修改現有使用者或群組的權限，首先需要使用 `GetEntry` 方法取得 `NotesACLEntry` 物件，然後修改其屬性。

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("existinguser")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_MANAGER
    acl.Save
End If
```

## 刪除 ACL 條目

要從 ACL 中移除使用者或群組，可以使用 `RemoveACLEntry` 方法。

```lotusscript
acl.RemoveACLEntry("userToRemove")
acl.Save
```

## 設定 ACL 選項

`NotesACL` 類別提供了多種屬性來設定 ACL 的行為，例如 `UniformAccess` 屬性可控制是否強制統一存取。

```lotusscript
acl.UniformAccess = True
acl.Save
```

## 結論

透過 LotusScript 的 `NotesACL` 類別，開發者可以程式化地管理 HCL Domino 資料庫的存取控制，確保資料的安全性和正確的存取權限。更多詳細資訊，請參閱 [NotesACL 類別官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html) 和 [NotesACLEntry 類別官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html)。
