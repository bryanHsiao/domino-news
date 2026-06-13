---
title: "NotesDbDirectory：列出 server 上的每一個資料庫"
description: "想寫一支 agent 掃過伺服器上所有 NSF、檢查每個 db 的 ACL 或大小？那是 NotesDbDirectory 的工作 — 別跟先前介紹過的 NotesDirectory（查 Domino Directory 裡的人與群組）搞混，兩個都叫 Directory 但做的事完全不同。本文拆解 GetDbDirectory 建立、GetFirstDatabase / GetNextDatabase 走訪、四個 file-type 常數、Open / CreateDatabase / OpenDatabaseByReplicaID 等方法，以及最容易中的坑：走訪拿到的 NotesDatabase 預設是「關閉」的，必須先 Open 才能用。"
pubDate: 2026-06-14T07:30:00+08:00
lang: zh-TW
slug: notes-db-directory
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDbDirectory class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS.html"
  - title: "GetFirstDatabase method (NotesDbDirectory) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD.html"
  - title: "NotesDbDirectory class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDBDIRECTORY_CLASS.html"
relatedJava: ["DbDirectory"]
relatedSsjs: ["DbDirectory"]
---

你要寫一支管理用 agent：掃過某台伺服器上的**每一個 NSF**，檢查 ACL 有沒有開太大、或統計各 db 的大小。問題是 —— 你手上有 `NotesDatabase`（操作單一資料庫）、也有先前介紹過的 [`NotesDirectory`](/domino-news/posts/notes-directory/)，但後者是查 **Domino Directory**（names.nsf 裡的人、群組、伺服器）的，不是列檔案的。

要「列出伺服器上有哪些資料庫」，靠的是名字很像、但工作完全不同的 [`NotesDbDirectory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS.html)。官方定義：「Represents the Notes databases on a specific server or local computer.」這篇拆解它怎麼走訪、有哪些方法，以及一個一定會中的坑。

---

## 重點摘要

- 用 `session.GetDbDirectory(server$)` 建立；`server$` 傳 `""` 代表**本機**
- **走訪兩步驟**：`GetFirstDatabase(fileType%)` 取第一個、再迴圈 `GetNextDatabase()` 取後續
- **四個 file-type 常數**：`DATABASE`（.nsf 等）、`TEMPLATE`（.ntf）、`REPLICA_CANDIDATE`（未停用複寫的）、`TEMPLATE_CANDIDATE`
- **最大的坑**：走訪拿到的 `NotesDatabase` 是**關閉**的 — 官方明說「The database is closed」，要先 `.Open` 才能讀 Title 以外的東西
- 不只走訪：`OpenDatabase`、`CreateDatabase`、`OpenDatabaseByReplicaID`、`OpenMailDatabase`、`OpenDatabaseIfModified`
- 別跟 [`NotesDirectory`](/domino-news/posts/notes-directory/) 搞混：那個查人/群組，這個列資料庫檔案

---

## 建立：GetDbDirectory

從 `NotesSession` 取得，傳入要查的伺服器名稱：

```lotusscript
Dim session As New NotesSession
Dim dbdir As NotesDbDirectory
Set dbdir = session.GetDbDirectory("Mail01/Acme")
```

`server$` 傳空字串 `""` 代表**本機 / 當前電腦**。它只有兩個唯讀屬性：`Name`（你建立時指定的那台伺服器名）跟 `Parent`（所屬的 `NotesSession`）。（`New NotesDbDirectory(...)` 也能建，但在 COM 下不支援，用 `GetDbDirectory` 最保險。）

## 走訪：GetFirstDatabase + GetNextDatabase

走訪是經典的「先 First、再迴圈 Next」模式。`GetFirstDatabase` 的參數決定你要列哪一類檔案：

| 常數 | 選的是 |
|---|---|
| `DATABASE` | 任何 Notes 資料庫（.nsf / .nsg / .nsh） |
| `TEMPLATE` | 任何範本（.ntf） |
| `REPLICA_CANDIDATE` | 沒有停用複寫的資料庫／範本 |
| `TEMPLATE_CANDIDATE` | 任何資料庫或範本 |

```lotusscript
Dim db As NotesDatabase
Set db = dbdir.GetFirstDatabase(DATABASE)
Do Until db Is Nothing
    ' 處理 db（注意：此時 db 還是關閉的，見下）
    Set db = dbdir.GetNextDatabase()
Loop
```

`GetNextDatabase` 不帶參數 —— 它沿用 `GetFirstDatabase` 當初指定的 file type。還有一個官方提醒值得記：**「Each time you call this method, the database directory is reset and a new search is conducted.」** 每呼叫一次 `GetFirstDatabase`，目錄就會從頭重新搜尋。所以一趟走訪只 `GetFirstDatabase` 一次，後面全用 `GetNextDatabase`，別在迴圈裡重複呼叫 First。

## 最重要的坑：拿到的 db 是「關閉」的

這是 `NotesDbDirectory` 最常害人 debug 半天的地方。`GetFirstDatabase` / `GetNextDatabase` 回傳的 [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html)，**預設是關閉的**。官方 [`GetFirstDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD.html) 文件寫得很白：「The database is closed. To open it, use the Open or OpenIfModified method in NotesDatabase.」

關閉狀態下，少數幾個屬性（如 `Title`、`FileName`、`FilePath`）讀得到，但大部分操作（讀 ACL、跑 search、開 view…）都要先打開：

```lotusscript
Set db = dbdir.GetFirstDatabase(DATABASE)
Do Until db Is Nothing
    If db.Open("", "") Then        ' 先開，回傳 True 才繼續
        ' 這裡才能安全地讀 db.ACL、db.Size 等
    End If
    Set db = dbdir.GetNextDatabase()
Loop
```

忘了 `.Open` 就去讀 ACL，是這個類別最典型的「為什麼報錯／拿到空值」來源。

## 不只走訪

`NotesDbDirectory` 也能直接開／建資料庫，不必先走訪：

| 方法 | 作用 |
|---|---|
| `OpenDatabase(file$)` | 直接開指定檔名的資料庫 |
| `OpenDatabaseByReplicaID(replicaID$)` | 用 replica ID 開（檔名不確定時很有用） |
| `OpenDatabaseIfModified(file$, since)` | 只有自某時間後有改動才開 |
| `OpenMailDatabase()` | 開當前使用者的郵件資料庫 |
| `CreateDatabase(server$, file$)` | 在指定位置建立新資料庫 |

[`OpenDatabaseByReplicaID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENDATABASEBYREPLICAID_METHOD_DBDIRECTORY_COM.html) 特別實用 —— 同一個邏輯資料庫在不同伺服器上檔名可能不同，但 replica ID 一致。

最小的官方範例（逐字）只示範了取第一個：

```lotusscript
Sub Initialize
  Dim dbdir As New NotesDbDirectory("Snapper")
  Dim db As NotesDatabase
  Set db = dbdir.GetFirstDatabase(DATABASE)
  Msgbox db.Title, , db.FileName
End Sub
```

（注意這裡只讀 `Title` / `FileName`，所以沒先 Open 也沒事 —— 但真要操作內容就得 Open。）

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `DbDirectory` | `session.getDbDirectory(server)` |
| SSJS / XPages | `DbDirectory` | `session.getDbDirectory(server)` |

三邊概念一致：`getFirstDatabase` / `getNextDatabase` 走訪、回傳的 db 一樣是關閉的、一樣得先 open。寫 Java 批次掃 server 上資料庫時，這篇的流程跟那個「先開再用」的坑完全照搬。
