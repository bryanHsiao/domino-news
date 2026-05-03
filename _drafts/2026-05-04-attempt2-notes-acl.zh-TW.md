---
title: "使用 LotusScript 管理 NotesACL"
description: "深入探討如何透過 LotusScript 操作 HCL Domino 的 NotesACL，涵蓋存取控制清單的基本概念、主要方法，以及實作範例。"
pubDate: "2026-05-04T07:21:09+08:00"
lang: "zh-TW"
slug: "notes-acl"
tags:
  - "Domino Server"
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing Access Control Lists in LotusScript"
    url: "https://www.ibm.com/docs/en/notes/9.0.1?topic=ssw-9-0-1-composite-applications-dev-managing-access-control-lists-in-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl
-->

## 介紹

在 HCL Domino 中，存取控制清單（Access Control List，ACL）決定了哪些使用者或群組可以存取資料庫，以及他們擁有的權限。透過 LotusScript，開發者可以程式化地管理 ACL，以自動化安全性設定或動態調整存取權限。

## NotesACL 類別概述

`NotesACL` 類別代表資料庫的 ACL，提供了多種方法來檢視和修改 ACL。主要方法包括：

- `CreateACLEntry`：新增 ACL 條目。
- `GetEntry`：取得特定使用者或群組的 ACL 條目。
- `RemoveACLEntry`：移除特定的 ACL 條目。
- `Save`：儲存對 ACL 所做的更改。

詳細資訊請參閱 [NotesACL 類別](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html)。

## NotesACLEntry 類別概述

`NotesACLEntry` 類別代表 ACL 中的單一條目，允許設定特定使用者或群組的權限。主要方法和屬性包括：

- `Level`：設定或取得存取等級（如讀者、作者、管理者等）。
- `Roles`：設定或取得指派的角色。
- `IsPerson`、`IsGroup`、`IsServer`：判斷條目類型。

詳細資訊請參閱 [NotesACLEntry 類別](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html)。

## 實作範例：新增 ACL 條目

以下範例展示如何使用 LotusScript 新增一個新的 ACL 條目，並設定其存取等級和角色：

```lotusscript
Sub AddUserToACL(db As NotesDatabase, userName As String, accessLevel As Integer, roles As Variant)
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set acl = db.ACL
    Set entry = acl.CreateACLEntry(userName, accessLevel)
    entry.Roles = roles
    acl.Save
End Sub
```

在此範例中，`db` 是目標資料庫，`userName` 是要新增的使用者名稱，`accessLevel` 是存取等級（如 `ACLLEVEL_AUTHOR`），`roles` 是要指派的角色陣列。

## 實作範例：修改現有 ACL 條目

以下範例展示如何修改現有使用者的 ACL 條目，變更其存取等級：

```lotusscript
Sub ModifyUserAccessLevel(db As NotesDatabase, userName As String, newAccessLevel As Integer)
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set acl = db.ACL
    Set entry = acl.GetEntry(userName)
    If Not entry Is Nothing Then
        entry.Level = newAccessLevel
        acl.Save
    Else
        MsgBox "使用者未在 ACL 中找到。"
    End If
End Sub
```

在此範例中，`newAccessLevel` 是新的存取等級，如 `ACLLEVEL_EDITOR`。

## 實作範例：移除 ACL 條目

以下範例展示如何移除特定使用者的 ACL 條目：

```lotusscript
Sub RemoveUserFromACL(db As NotesDatabase, userName As String)
    Dim acl As NotesACL
    
    Set acl = db.ACL
    Call acl.RemoveACLEntry(userName)
    acl.Save
End Sub
```

## 注意事項

- 在修改 ACL 之前，確保您擁有足夠的權限。
- 每次對 ACL 進行更改後，請記得呼叫 `Save` 方法以儲存更改。
- 在批次處理大量 ACL 更改時，建議在所有更改完成後再呼叫一次 `Save`，以提高效能。

透過上述方法，開發者可以有效地使用 LotusScript 管理 HCL Domino 資料庫的存取控制清單，確保系統的安全性和靈活性。
