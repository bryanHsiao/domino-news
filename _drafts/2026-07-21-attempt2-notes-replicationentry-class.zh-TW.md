---
title: "使用 NotesReplicationEntry 類別管理複製設定"
description: "深入探討如何使用 LotusScript 中的 NotesReplicationEntry 類別來管理 HCL Domino 伺服器上的資料庫複製設定，包括設定複製時間表、優先順序和其他參數。"
pubDate: "2026-07-21T07:58:40+08:00"
lang: "zh-TW"
slug: "notes-replicationentry-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesReplicationEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html"
  - title: "NotesReplication class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html"
  - title: "Replicating databases using LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html" was already cited by [notes-replication] on 2026-07-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html" was already cited by [notes-replication] on 2026-07-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html" was already cited by [notes-replication] on 2026-07-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-replicationentry-class
-->

在 HCL Domino 環境中，資料庫的複製（replication）是確保資料一致性和可用性的關鍵機制。透過 LotusScript 的 `NotesReplicationEntry` 類別，開發者可以程式化地管理資料庫的複製設定，如設定複製時間表、優先順序等。本文將介紹如何使用 `NotesReplicationEntry` 類別來管理複製設定，並提供實作範例。

## 什麼是 NotesReplicationEntry？

`NotesReplicationEntry` 類別代表 Domino 伺服器上某個資料庫的複製設定。每個 `NotesReplicationEntry` 物件包含特定資料庫的複製資訊，如來源伺服器、目的伺服器、複製時間表等。透過此類別，開發者可以讀取和修改這些設定，以滿足特定的業務需求。

## 使用 NotesReplicationEntry 的步驟

1. **取得 NotesReplication 物件**：首先，透過 `NotesDatabase` 物件的 `ReplicationInfo` 屬性取得 `NotesReplication` 物件。

2. **存取複製條目**：使用 `NotesReplication` 物件的 `GetEntry` 方法，根據目標伺服器名稱取得對應的 `NotesReplicationEntry` 物件。

3. **修改複製設定**：透過 `NotesReplicationEntry` 物件的屬性和方法，設定複製時間表、優先順序等。

4. **儲存變更**：使用 `Save` 方法將修改後的設定儲存。

## 實作範例

以下是使用 LotusScript 修改特定資料庫複製設定的範例：

```lotusscript
Sub UpdateReplicationSettings()
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim rep As NotesReplication
    Dim repEntry As NotesReplicationEntry
    
    ' 開啟目標資料庫
    Set db = session.GetDatabase("ServerName", "database.nsf")
    If db Is Nothing Then
        MsgBox "無法開啟資料庫"
        Exit Sub
    End If
    
    ' 取得複製資訊
    Set rep = db.ReplicationInfo
    
    ' 取得特定伺服器的複製條目
    Set repEntry = rep.GetEntry("TargetServerName")
    If repEntry Is Nothing Then
        MsgBox "無法找到複製條目"
        Exit Sub
    End If
    
    ' 設定複製時間表（例如，每天凌晨 1 點）
    repEntry.ReplicationSchedule = "1:00 AM"
    
    ' 設定複製優先順序
    repEntry.Priority = 50
    
    ' 儲存變更
    Call repEntry.Save
    
    MsgBox "複製設定已更新"
End Sub
```

在此範例中，我們首先取得目標資料庫的 `NotesReplication` 物件，然後透過 `GetEntry` 方法取得特定伺服器的複製條目。接著，我們設定複製時間表和優先順序，最後使用 `Save` 方法儲存變更。

## 注意事項

- **權限要求**：確保執行此程式碼的使用者具有修改複製設定的適當權限。

- **錯誤處理**：在實際應用中，應加入錯誤處理機制，以應對可能的例外情況。

- **測試環境**：在生產環境部署前，請在測試環境中驗證程式碼的正確性。

透過 `NotesReplicationEntry` 類別，開發者可以靈活地管理 Domino 伺服器上的資料庫複製設定，確保資料的同步和一致性。更多詳細資訊，請參閱 [NotesReplicationEntry 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html) 和 [NotesReplication 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html) 的官方文件。
