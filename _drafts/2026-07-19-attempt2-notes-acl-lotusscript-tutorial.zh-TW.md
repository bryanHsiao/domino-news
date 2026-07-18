---
title: "使用 LotusScript 管理 NotesACL：完整指南"
description: "本教程深入探討如何使用 LotusScript 操作 NotesACL 和 NotesACLEntry，涵蓋存取控制清單的讀取、修改和管理，並提供實用範例。"
pubDate: "2026-07-19T07:56:04+08:00"
lang: "zh-TW"
slug: "notes-acl-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Security"
  - "Domino Server"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing the ACL with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MANAGING_THE_ACL_WITH_LOTUSSCRIPT.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 中，存取控制清單（Access Control List，ACL）決定了誰可以存取資料庫以及他們擁有的權限。透過 LotusScript，開發者可以程式化地讀取和修改 ACL，以自動化安全性管理。本文將介紹如何使用 LotusScript 操作 NotesACL 和 NotesACLEntry 類別，並提供實用範例。

## 存取 NotesACL

要存取資料庫的 ACL，首先需要取得 NotesDatabase 物件，然後使用其 `ACL` 屬性獲取 NotesACL 物件。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

## 讀取 ACL 條目

使用 NotesACL 的 `GetFirstEntry` 和 `GetNextEntry` 方法，可以遍歷 ACL 中的所有條目。

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetFirstEntry

While Not entry Is Nothing
    Print "Name: " & entry.Name & ", Level: " & entry.Level
    Set entry = acl.GetNextEntry(entry)
Wend
```

## 修改 ACL 條目

要修改現有的 ACL 條目，例如更改使用者的存取級別，可以使用 NotesACLEntry 的 `Level` 屬性。

```lotusscript
Set entry = acl.GetEntry("John Doe")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_EDITOR
    Call acl.Save
End If
```

## 新增 ACL 條目

要新增新的 ACL 條目，使用 NotesACL 的 `CreateACLEntry` 方法。

```lotusscript
Set entry = acl.CreateACLEntry("Jane Doe", ACLLEVEL_AUTHOR)
Call acl.Save
```

## 刪除 ACL 條目

要刪除 ACL 條目，使用 NotesACL 的 `DeleteACLEntry` 方法。

```lotusscript
Call acl.DeleteACLEntry("Jane Doe")
Call acl.Save
```

## 設定 ACL 選項

NotesACL 提供多種選項，例如強制執行 Reader 欄位、允許匿名存取等。這些選項可以透過相應的屬性進行設定。

```lotusscript
acl.ForceUserToChangePassword = True
acl.Save
```

## 結論

透過 LotusScript，開發者可以有效地管理 HCL Domino 資料庫的 ACL，實現自動化的安全性管理。更多詳細資訊，請參閱 [NotesACL 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) 和 [NotesACLEntry 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) 的官方文件。
