---
title: "使用 LotusScript 管理 NotesACL：完整指南"
description: "本指南詳細介紹如何使用 LotusScript 操作 NotesACL，包括讀取、修改和管理訪問控制列表的步驟，並提供實用範例。"
pubDate: "2026-06-14T07:30:19+08:00"
lang: "zh-TW"
slug: "notes-acl"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl
-->

## 簡介

在 HCL Domino 中，訪問控制列表（Access Control List，ACL）決定了誰可以訪問資料庫以及他們擁有的權限。透過 LotusScript，開發者可以程式化地讀取和修改 ACL，以自動化管理任務。本文將詳細介紹如何使用 LotusScript 操作 NotesACL，包括讀取、修改和管理 ACL 的步驟，並提供實用範例。

## 取得 NotesACL 物件

要操作資料庫的 ACL，首先需要取得該資料庫的 NotesACL 物件。這可以透過 NotesDatabase 類別的 `ACL` 屬性來實現。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

在上述程式碼中，`session.CurrentDatabase` 取得當前資料庫的引用，然後透過其 `ACL` 屬性獲取該資料庫的 ACL。

## 讀取 ACL 條目

取得 NotesACL 物件後，可以使用 `GetFirstEntry` 和 `GetNextEntry` 方法來遍歷 ACL 中的所有條目。

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetFirstEntry

While Not entry Is Nothing
    Print "Name: " & entry.Name & ", Level: " & entry.Level
    Set entry = acl.GetNextEntry(entry)
Wend
```

這段程式碼將列出 ACL 中每個條目的名稱和權限級別。

## 修改 ACL 條目

要修改現有的 ACL 條目，可以使用 `GetEntry` 方法取得特定條目，然後更改其屬性。

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("John Doe")

If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_EDITOR
    Call acl.Save
Else
    Print "未找到指定的 ACL 條目。"
End If
```

在此範例中，將名為 "John Doe" 的條目權限級別更改為編輯者（Editor），並保存更改。

## 新增 ACL 條目

要新增新的 ACL 條目，可以使用 `CreateACLEntry` 方法。

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("Jane Doe", ACLLEVEL_AUTHOR)
Call acl.Save
```

這將為 "Jane Doe" 新增一個具有作者（Author）權限的 ACL 條目。

## 刪除 ACL 條目

要刪除 ACL 條目，可以使用 `RemoveACLEntry` 方法。

```lotusscript
Call acl.RemoveACLEntry("Jane Doe")
Call acl.Save
```

這將刪除名為 "Jane Doe" 的 ACL 條目。

## 設定 ACL 屬性

NotesACL 物件還提供了多種屬性來控制 ACL 的行為，例如 `UniformAccess` 屬性。

```lotusscript
acl.UniformAccess = True
Call acl.Save
```

這將設定 ACL 的統一訪問屬性。

## 結論

透過 LotusScript 操作 NotesACL，開發者可以程式化地管理 HCL Domino 資料庫的訪問控制列表，實現自動化的安全性管理。本文提供了從讀取、修改到管理 ACL 的完整指南，幫助您更有效地管理資料庫的訪問權限。

有關更多資訊，請參閱 [NotesACL 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) 和 [NotesACLEntry 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) 的官方文件。
