---
title: "NotesReplication + NotesReplicationEntry：用 LotusScript 管理資料庫複製設定"
description: "Domino 的複製（Replication）是讓多台伺服器資料同步的核心機制，每個 NSF 都有一份複製設定。LotusScript 的 NotesReplication class 讓你用程式讀寫這份設定 — 暫停 / 恢復複製、調整優先等級、設定截止日期過濾、清除複製歷史。NotesReplicationEntry 則管理「這個 NSF 跟哪台伺服器之間的複製規則」。本文拆解取得方式（db.ReplicationInfo）、IsDisabled / Priority / Abstract 屬性、ClearHistory 清歷史、GetEntry 取特定伺服器對的規則、以及 Save 呼叫的必要性。"
pubDate: 2026-06-06T07:30:00+08:00
lang: zh-TW
slug: notes-replication
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesReplication class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS_1289.html"
  - title: "NotesReplicationEntry class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html"
  - title: "ReplicationInfo property (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATIONINFO_PROPERTY_DB.html"
relatedJava: ["Replication", "ReplicationEntry"]
relatedSsjs: []
cover: "/covers/notes-replication.webp"
coverStyle: "low-poly-3d"
---

Domino 環境裡有幾十個 NSF、每次升版或做維護時、需要暫停部分資料庫的複製、事後再恢復。或者你要做一套自動化工具、批次調整開發環境裡所有 NSF 的複製優先等級。

每個 NSF 都帶著一份複製設定（Replication Info）— 就是你在 Admin Client 開資料庫屬性看到的那頁。[`NotesReplication`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS_1289.html) 讓你用 LotusScript 讀寫這份設定、不必手動一個一個打開 Admin Client。

---

## 重點摘要

- 每個 [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS_1289.html) 都有唯一一個 `NotesReplication` 物件、透過 `db.ReplicationInfo` 取得
- **改完屬性必須呼叫 [`Save()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_REPLICATION.html)**、否則設定不會儲存
- `IsDisabled`：暫停 / 恢復複製
- `Priority`：設複製優先等級（`REPLICATION_PRIORITY_LOW` / `MED` / `HIGH`）
- `Abstract`：截斷大文件 + 移除附件（減少複製流量用）
- `ClearHistory()`：清除複製歷史、下次複製變成全量同步
- [**`NotesReplicationEntry`**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html)：管理兩台伺服器之間的細部規則（選擇性複製公式等）

---

## 取得 NotesReplication 物件

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

' 取得複製設定物件（每個 db 唯一一份）
Dim repl As NotesReplication
Set repl = db.ReplicationInfo

Print "複製是否停用：" & repl.IsDisabled
Print "優先等級：" & repl.Priority
```

---

## 暫停 / 恢復複製

```lotusscript
' 暫停這個資料庫的複製
repl.Disabled = True
Call repl.Save()
Print "複製已暫停"

' 恢復複製
repl.Disabled = False
Call repl.Save()
Print "複製已恢復"
```

**`Save()` 必須呼叫**。這跟多數 LotusScript class 的自動儲存不同 — `NotesReplication` 的屬性修改只在記憶體裡、沒呼叫 `Save()` 就不會寫回 NSF。

---

## 調整複製優先等級

```lotusscript
' 設成低優先（開發 / 測試環境常用）
repl.Priority = REPLICATION_PRIORITY_LOW
Call repl.Save()

' 設成高優先（重要資料庫）
repl.Priority = REPLICATION_PRIORITY_HIGH
Call repl.Save()
```

優先等級常數：

| 常數 | 意義 |
|---|---|
| `REPLICATION_PRIORITY_LOW` | 低優先 |
| `REPLICATION_PRIORITY_MED` | 中優先（預設）|
| `REPLICATION_PRIORITY_HIGH` | 高優先 |
| `REPLICATION_PRIORITY_NOTSET` | 未設定 |

---

## Abstract — 截斷大文件減少流量

```lotusscript
' 啟用 Abstract：大文件會被截斷、附件移除
' 節省複製流量、但讀者只能看到前幾 KB
repl.Abstract = True
Call repl.Save()
```

`Abstract` 是「複製時截斷大文件並移除附件」的設定。在低頻寬環境或只需要 metadata 同步的場景有用、但一般業務 NSF 不建議開啟。

---

## ClearHistory — 清除複製歷史

```lotusscript
' 清除複製歷史 → 下次複製會做全量同步
Call repl.ClearHistory()
' ClearHistory 不需要額外呼叫 Save()
Print "複製歷史已清除"
```

這個操作的使用場景：資料庫被損壞後修復、或者強制讓兩台伺服器重新同步所有文件（通常維護後用）。注意：清了之後**下次複製會全量掃整個資料庫**、流量大。詳細的 [ClearHistory 方法文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CLEARHISTORY_METHOD_REPLICATION.html)有更多說明。

---

## Reset — 還原到上次儲存的狀態

```lotusscript
' 如果中途改變心意、Reset 把屬性還原到 db 裡存的值
' 相當於「放棄這次修改」
Call repl.Reset()
```

跟 `Save` 相對 — `Reset` 還原、`Save` 儲存。

---

## NotesReplicationEntry — 伺服器對規則

[`NotesReplicationEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html) 管理「這個 NSF 跟特定伺服器之間」的複製規則（選擇性複製公式、是否複製到目標伺服器等）：

```lotusscript
' 取得跟 TargetServer 之間的複製 entry
Dim entry As NotesReplicationEntry
Set entry = repl.GetEntry("SourceServer/ACME", "TargetServer/ACME")

If Not (entry Is Nothing) Then
    Print "是否複製到目標：" & entry.IsEnabled
    Print "選擇公式：" & entry.Formula
    ' 修改並儲存
    entry.Formula = "Type = ""Order"""
    Call entry.Save()
End If

' 取得所有 entry
Dim entries As Variant
entries = repl.GetEntries()
If IsArray(entries) Then
    Dim i As Integer
    For i = 0 To UBound(entries)
        Print "Entry：" & entries(i).Source & " → " & entries(i).Destination
    Next
End If
```

---

## 實戰：批次暫停開發環境所有 NSF

```lotusscript
Sub PauseAllReplication(serverName As String)
    Dim session As New NotesSession
    Dim dbDir As NotesDbDirectory
    Set dbDir = session.GetDbDirectory(serverName)

    Dim db As NotesDatabase
    Set db = dbDir.GetFirstDatabase(DATABASE)

    Dim count As Integer
    count = 0
    Do Until db Is Nothing
        If db.IsOpen Then
            Dim repl As NotesReplication
            Set repl = db.ReplicationInfo
            If Not repl.IsDisabled Then
                repl.Disabled = True
                Call repl.Save()
                count = count + 1
            End If
        End If
        Set db = dbDir.GetNextDatabase()
    Loop

    Print "已暫停 " & count & " 個資料庫的複製"
End Sub
```

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesReplication` / `NotesReplicationEntry` |
| Java | `lotus.domino.Replication` / `ReplicationEntry`（去掉 Notes 前綴、用完要 `.recycle()`）|
| SSJS | 沒有直接對應 — 複製管理在 XPages 通常透過 Domino REST API 或 server console 指令完成 |
