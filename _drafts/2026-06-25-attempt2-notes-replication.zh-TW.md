---
title: "使用 NotesReplication 類別進行程式化複製"
description: "學習如何使用 NotesReplication 類別在 LotusScript 中程式化地控制 HCL Domino 資料庫的複製過程。"
pubDate: "2026-06-25T07:30:34+08:00"
lang: "zh-TW"
slug: "notes-replication"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesReplication class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html"
  - title: "Replicate method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html"
  - title: "NotesReplicationEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-replication" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-replication
-->

在 HCL Domino 開發中，複製（replication）是確保資料庫同步的關鍵機制。透過 LotusScript 的 `NotesReplication` 類別，開發者可以程式化地控制資料庫的複製行為。本文將介紹如何使用 `NotesReplication` 類別來管理複製過程。

## 取得 NotesReplication 物件

要開始使用 `NotesReplication`，首先需要從 `NotesDatabase` 物件取得該資料庫的複製設定：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim replication As NotesReplication

Set db = session.CurrentDatabase
Set replication = db.ReplicationInfo
```

在此程式碼中，`db.ReplicationInfo` 返回一個 `NotesReplication` 物件，代表該資料庫的複製資訊。

## 設定複製選項

`NotesReplication` 提供多個屬性來設定複製行為，例如：

- `CutoffInterval`：設定複製的截止間隔時間。
- `CutoffDate`：設定複製的截止日期。
- `Disabled`：啟用或停用複製。

以下範例展示如何設定這些屬性：

```lotusscript
replication.CutoffInterval = 30 ' 設定截止間隔為 30 天
replication.Disabled = False ' 啟用複製
```

## 執行複製

要程式化地執行複製，可以使用 `NotesDatabase` 的 `Replicate` 方法。此方法需要目標伺服器的名稱作為參數：

```lotusscript
Dim success As Boolean
success = db.Replicate("ServerName")
If success Then
    MsgBox "複製成功"
Else
    MsgBox "複製失敗"
End If
```

在此範例中，`db.Replicate` 方法嘗試將當前資料庫與指定的伺服器進行複製，並返回一個布林值表示成功或失敗。

## 管理複製條目

`NotesReplication` 類別的 `ReplicationEntries` 屬性返回一個 `NotesReplicationEntry` 集合，代表該資料庫的所有複製條目。可以遍歷這些條目來檢視或修改特定的複製設定：

```lotusscript
Dim entry As NotesReplicationEntry
Forall entry In replication.ReplicationEntries
    MsgBox "伺服器: " & entry.Destination
    ' 可以在此修改 entry 的屬性
End Forall
```

透過上述方法，開發者可以程式化地管理 HCL Domino 資料庫的複製行為，確保資料在不同伺服器之間的同步性。更多詳細資訊，請參閱 [NotesReplication 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html) 和 [Replicate 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html) 的官方文件。
