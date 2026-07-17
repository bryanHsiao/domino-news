---
title: "用程式管理全文索引：CreateFTIndex、UpdateFTIndex，與本機 vs 伺服器的分界"
description: "FTSearch 要快就需要全文索引 — 而 NotesDatabase 能用 LotusScript 建立、更新、移除索引。陷阱是一個幾乎沒人料到的分界：CreateFTIndex / UpdateFTIndex / RemoveFTIndex 只對本機資料庫有效，而 FTIndexFrequency 只對伺服器有效，伺服器索引其實是由 Updall 工作管理的（updall -X 是重建、不是建立）。本文說明 options bitmask、create 與 update 的差別、以及那個分界。"
pubDate: 2026-07-17T07:30:00+08:00
lang: zh-TW
slug: notes-database-ft-index
tags:
  - "LotusScript"
  - "Admin"
  - "Tutorial"
sources:
  - title: "NotesDatabase.CreateFTIndex method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html"
  - title: "NotesDatabase.UpdateFTIndex method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_UPDATEFTINDEX_METHOD.html"
  - title: "NotesDatabase.IsFTIndexed property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html"
relatedJava: ["Database"]
relatedSsjs: ["database"]
---

全文索引是讓 [`FTSearch`](/domino-news/zh-TW/posts/lotusscript-ftsearch) 快的東西 — 沒有它，文字查詢會退回 `db.Search`，一個 O(N) 的公式掃描，在大資料庫上爬得很慢。所以自然會想用程式建立與維護那個索引。`NotesDatabase` 讓你做：`CreateFTIndex`、`UpdateFTIndex`、`RemoveFTIndex`、`IsFTIndexed`。絆倒人的不是 API — 是一個本機 vs 伺服器的分界，直到你的程式對著伺服器資料庫悄悄什麼都沒做（或拋錯）才會發現。

---

## 重點摘要

- 用 [`db.IsFTIndexed`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html) 把關 —「指出一個資料庫是否有全文索引」（資料庫必須開啟）。
- [`db.CreateFTIndex(options&, recreate)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html) 建立索引。`recreate=True` 刪除並重建；`recreate=False` 在已有索引時什麼都不做。**只限本機資料庫。**
- [`db.UpdateFTIndex(createFlag)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_UPDATEFTINDEX_METHOD.html) 增量刷新既有索引；`createFlag=True` 在沒有時建立（需要至少一份文件）。也**只限本機**。
- **分界：** 那些管理方法**只限本機**，但 `FTIndexFrequency`（自動更新頻率）**只限伺服器**。伺服器資料庫的索引由 **Updall** 工作建立/重建，不是這些方法。
- `options&` 是一個 bitmask：`FTINDEX_ATTACHED_FILES`（1）、`FTINDEX_ENCRYPTED_FIELDS`（2）、`FTINDEX_ALL_BREAKS`（4）、`FTINDEX_CASE_SENSITIVE`（8）、`FTINDEX_ATTACHED_BIN_FILES`（16）。相加來組合。

## 檢查、建立、更新

正統寫法是依 `IsFTIndexed` 分支，然後 create（重建）或 update：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase

  ' 管理方法只對「本機」資料庫有效。
  Dim options As Long
  options = FTINDEX_ALL_BREAKS + FTINDEX_ATTACHED_FILES   ' 索引斷句 + 附件文字

  If db.IsFTIndexed Then
    Call db.UpdateFTIndex(False)          ' 增量刷新既有索引
    Print "Existing FT index updated"
  Else
    Call db.CreateFTIndex(options, False) ' 用選定的 options 建立
    Print "New FT index created"
  End If
End Sub
```

`options` bitmask 控制什麼被索引：附件文字（`FTINDEX_ATTACHED_FILES`）與二進位附件內容（`FTINDEX_ATTACHED_BIN_FILES`）最會撐大索引；`FTINDEX_ALL_BREAKS` 記錄句/段落斷點、讓 `PARAGRAPH`/`SENTENCE` 查詢運算子能用；`FTINDEX_CASE_SENSITIVE` 啟用 `EXACTCASE`。`recreate` 與 `createFlag` 這一對要分清楚：

- `CreateFTIndex(options, True)` — 用那些 options **刪除並完整重建**。別排程跑它；它每次都把索引丟掉。
- `CreateFTIndex(options, False)` —「如果這個參數為 False 且索引存在，不採取任何動作」。
- `UpdateFTIndex(True)` — **沒有就建、有就刷新**。這是「確保它存在且是最新」的呼叫。（空資料庫即使傳 `True` 也不會有索引 — 它需要至少一份文件。）
- `UpdateFTIndex(False)` — 只刷新；沒索引就 no-op。

`RemoveFTIndex` 刪除索引（只限本機，而且是 no-op — 沒索引也不會錯）。

## 沒人料到的分界

這是文件講得很白、但開發者一直漏掉的部分。管理方法說，原文：「這個方法只對本機資料庫有效。」`UpdateFTIndex` 的說法是「如果你試圖在一個非本機的資料庫上建立全文索引，Notes 會回傳錯誤」。所以對著一個在伺服器上的資料庫，`CreateFTIndex` / `UpdateFTIndex` / `RemoveFTIndex` 不會悄悄運作 — 它們拋錯。

而唯一是伺服器範圍的屬性正好相反：`FTIndexFrequency`（自動更新頻率 —`FTINDEX_DAILY`、`FTINDEX_SCHEDULED`、`FTINDEX_HOURLY`、`FTINDEX_IMMEDIATE`）「只適用於伺服器上的資料庫」。所以你能用程式設定一個伺服器索引*多久*刷新一次，卻不能用程式*建立*那個伺服器索引。

**那伺服器索引誰建？** **Updall** 伺服器工作。管理員跑 `load updall <database>` 更新 view 與全文索引，`load updall <database> -X` — 注意大寫的 `-X` — 來**重建**損毀的全文索引。這裡要精確：`-X` 是*重建*、不是*建立*初始索引。伺服器資料庫的初始全文索引，是透過 Domino Administrator（資料庫屬性 / Full Text）設定、或啟用索引後讓 Update/Updall 建起來。LotusScript 方法就是沒辦法伸手到伺服器資料庫。

## 實務指引

- **agent 建立並搜尋的本機暫存/臨時資料庫**：放心用 `CreateFTIndex` / `UpdateFTIndex` — 那正是它們的範圍。
- **伺服器正式資料庫**：別想用 LotusScript 索引它們；那是管理員/Updall 的地盤。從程式你能讀 `IsFTIndexed` 來*檢查*、設 `FTIndexFrequency` 來*調頻率*，但建立本身在伺服器端。
- 永遠用 `IsFTIndexed` 把關 `FTSearch`、沒索引時退回 `db.Search`，讓你的搜尋程式優雅降級、而不是對著沒索引的資料庫跑得很慢。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `db.CreateFTIndex(opts, recreate)` | `db.createFTIndex(opts, recreate)` | `database.createFTIndex(...)` |
| `db.UpdateFTIndex(create)` | `db.updateFTIndex(create)` | `database.updateFTIndex(...)` |
| `db.IsFTIndexed` / `FTIndexFrequency` | `db.isFTIndexed()` / `getFTIndexFrequency()` | `database.isFTIndexed()` / … |

Java 與 SSJS 的 `Database` 類別一個方法對一個方法地對應，而同樣的本機 vs 伺服器分界在每個語言都適用 — 它是索引實體住在哪裡的性質，不是你從哪個 API 面呼叫它的性質。
