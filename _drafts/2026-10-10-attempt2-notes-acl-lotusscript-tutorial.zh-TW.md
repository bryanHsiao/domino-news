---
title: "使用 LotusScript 管理 Notes ACL：完整指南"
description: "本教程深入探討如何使用 LotusScript 操作 Notes 的存取控制清單（ACL），包括檢視、修改和管理 ACL 條目，以有效控制資料庫的存取權限。"
pubDate: "2026-10-10T10:10:16+08:00"
lang: "zh-TW"
slug: "notes-acl-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
  - "Admin"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing ACLs with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MANAGING_ACLS_WITH_LOTUSSCRIPT.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-acl-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 環境中，存取控制清單（Access Control List，ACL）是管理資料庫安全性的關鍵組件。透過 ACL，您可以控制哪些使用者或群組可以存取資料庫，以及他們擁有的權限。LotusScript 提供了強大的類別和方法，讓開發人員能夠程式化地檢視和修改 ACL，從而自動化安全性管理。

## 先決條件

在開始之前，請確保您具備以下條件：

- 熟悉 HCL Domino 和 Notes 環境。
- 具備基本的 LotusScript 程式設計知識。
- 擁有對目標資料庫的適當存取權限。

## 檢視 ACL 條目

要檢視資料庫的 ACL 條目，您可以使用 `NotesDatabase` 類別的 `ACL` 屬性，該屬性返回一個 `NotesACL` 對象。以下是如何列出所有 ACL 條目的範例程式碼：

```lotusscript
Sub ListACLEntries
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Set entry = acl.GetFirstEntry
    Do Until entry Is Nothing
        Print "Name: " & entry.Name & ", Level: " & entry.Level
        Set entry = acl.GetNextEntry(entry)
    Loop
End Sub
```

在此程式碼中，`GetFirstEntry` 和 `GetNextEntry` 方法用於遍歷 ACL 條目。每個條目的名稱和權限級別都會被列印出來。

## 修改 ACL 條目

您可以使用 `NotesACL` 類別的 `GetEntry` 方法來獲取特定的 ACL 條目，然後修改其權限級別。以下是如何將特定使用者的權限級別設置為管理員的範例：

```lotusscript
Sub SetAdminAccess(userName As String)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Set entry = acl.GetEntry(userName)
    If Not entry Is Nothing Then
        entry.Level = ACLLEVEL_MANAGER
        acl.Save
        Print "Access level for " & userName & " set to Manager."
    Else
        Print "User " & userName & " not found in ACL."
    End If
End Sub
```

在此程式碼中，`ACLLEVEL_MANAGER` 是一個常數，表示管理員級別的存取權限。請注意，修改 ACL 後需要呼叫 `Save` 方法來保存更改。

## 新增 ACL 條目

要新增新的 ACL 條目，您可以使用 `NotesACL` 類別的 `CreateACLEntry` 方法。以下是如何為新使用者新增讀取權限的範例：

```lotusscript
Sub AddReaderAccess(userName As String)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Set entry = acl.CreateACLEntry(userName, ACLLEVEL_READER)
    acl.Save
    Print "Added " & userName & " with Reader access."
End Sub
```

在此程式碼中，`ACLLEVEL_READER` 是一個常數，表示讀取級別的存取權限。

## 刪除 ACL 條目

要刪除 ACL 條目，您可以使用 `NotesACL` 類別的 `RemoveACLEntry` 方法。以下是如何刪除特定使用者的 ACL 條目的範例：

```lotusscript
Sub RemoveACLEntry(userName As String)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Call acl.RemoveACLEntry(userName)
    acl.Save
    Print "Removed " & userName & " from ACL."
End Sub
```

請注意，刪除 ACL 條目後同樣需要呼叫 `Save` 方法來保存更改。

## 結論

透過 LotusScript，您可以程式化地管理 HCL Domino 資料庫的 ACL，從而自動化安全性管理流程。這不僅提高了效率，還確保了存取控制的一致性。欲了解更多詳細資訊，請參閱 [NotesACL 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) 和 [NotesACLEntry 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) 的官方文件。
