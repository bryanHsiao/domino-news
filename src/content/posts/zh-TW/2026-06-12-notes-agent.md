---
title: "NotesAgent：用程式呼叫另一支 Agent（Run vs RunOnServer）"
description: "你有一支很重的處理 agent，想讓另一支 agent、或一個按鈕在需要時觸發它 — 不是用排程、是用程式直接叫起來。NotesAgent 就是做這件事的類別：db.GetAgent() 拿到 agent，再用 Run 或 RunOnServer 跑它。本文拆解這兩個方法最關鍵的差異（在 client 跑還是在 server 跑）、怎麼用 noteID 把一份文件傳給被呼叫的 agent、IsEnabled / Trigger / Target 等屬性，以及四個限制：不能遞迴、不能 debug、使用者不能互動、輸出只進 Domino log。"
pubDate: 2026-06-12T07:30:00+08:00
lang: zh-TW
slug: notes-agent
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesAgent class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html"
  - title: "Run method (NotesAgent) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUN_METHOD_6415.html"
  - title: "RunOnServer method (NotesAgent) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUNONSERVER_METHOD_5924_ABOUT.html"
relatedJava: ["Agent"]
relatedSsjs: ["Agent"]
cover: "/covers/notes-agent.webp"
coverStyle: "pencil-sketch"
---

你有一支很重的批次處理 agent — 跑一次要好幾分鐘。現在需求變了：使用者按下表單上的按鈕時，要能「立刻把這支 agent 叫起來跑」；或是另一支 agent 處理到一半，需要把工作轉交給它。重點是 — 你不想用排程等它自己跑，你想**用程式直接觸發**。

這正是 [`NotesAgent`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html) 的用途。官方對它的定義是「Represents an agent」 — 它代表資料庫裡的一支 agent 設計元件，讓你查它的設定、也讓你**用程式把它跑起來**。而「跑起來」有兩個方法：`Run` 跟 `RunOnServer` — 選錯會讓你的程式在錯的機器上跑、或根本沒效果。這篇把這個決定講清楚。

---

## 重點摘要

- 用 `db.GetAgent("agent名稱")` 拿到一支 `NotesAgent`，或用 `db.Agents` 取得全部
- **`Run`**：在**當前（client）**環境跑 agent；**`RunOnServer`**：在**資料庫所在的伺服器**上跑
- 兩者都回傳 `Integer` 狀態碼，**`0` 代表成功**，簽章都帶一個選用的 `noteID$`
- `noteID$` 會被傳進被呼叫 agent 的 **`ParameterDocID`** 屬性 — 這是把「要處理哪份文件」傳過去的標準做法
- 屬性可查 agent 設定：`IsEnabled`（讀寫）、`Trigger`、`Target`、`LastRun`、`ServerName`、`IsWebAgent` / `IsNotesAgent`、`Owner`
- 四個限制：**不能遞迴呼叫自己、不能 debug 被呼叫的 agent、使用者不能直接互動、輸出只進 Domino log**

---

## 拿到一支 Agent

agent 屬於資料庫，所以從 `NotesDatabase` 取得：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

Dim agent As NotesAgent
Set agent = db.GetAgent("DailyCleanup")
If agent Is Nothing Then
    ' 這個名稱在這個 db 裡找不到
    Exit Sub
End If
```

要列出資料庫裡所有 agent，則用 `db.Agents`（回傳陣列）。注意官方對 `Name` 的提醒：「Within a database, the name of an agent may not be unique」 — 同名 agent 在一個 db 裡可能不只一支，`GetAgent` 拿到的是其中之一。

## Run vs RunOnServer：最重要的決定

[`Run`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUN_METHOD_6415.html) 跟 [`RunOnServer`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUNONSERVER_METHOD_5924_ABOUT.html) 兩個方法都「把 agent 跑起來」，但**跑在哪台機器上**完全不同：

| | `Run` | `RunOnServer` |
|---|---|---|
| 執行位置 | 當前 client 環境 | 資料庫所在的**伺服器** |
| 簽章 | `status = agent.Run([noteID$])` | `status = agent.RunOnServer([noteID$])` |
| 回傳 | `Integer`，`0` = 成功 | 同左 |
| 典型情境 | 互動式、client 端觸發 | 把重活丟到 server 跑、不佔用 client |

為什麼這個選擇重要？想像那支「跑好幾分鐘」的批次 agent：用 `Run`，它在使用者的 Notes Client 上跑，使用者整個卡住等它跑完；用 `RunOnServer`，工作交給伺服器、client 馬上拿回控制權。**重活就該 `RunOnServer`。**

有一個例外要記住，官方原文：「On a local database, the RunOnServer method works like the Run method, that is, runs the agent on the local computer.」 — 如果資料庫是本機的，`RunOnServer` 其實就退化成 `Run`、在本機跑。沒有伺服器，自然沒地方「丟過去」。

兩個方法都「runs any agent regardless of source language（simple action、formula、LotusScript、Java）」 — 被呼叫的 agent 是什麼語言寫的都行。

## 把一份文件傳給被呼叫的 agent

`Run` / `RunOnServer` 的選用參數 `noteID$`，官方說明：「The note ID of a document. This value is passed to the ParameterDocID property of the called agent.」

換句話說，這是「呼叫端」跟「被呼叫端」之間傳遞「要處理哪份文件」的標準管道：

```lotusscript
' 呼叫端：把某份文件的 NoteID 傳過去
Call agent.RunOnServer(doc.NoteID)
```

```lotusscript
' 被呼叫的 agent 裡：從自己的 ParameterDocID 取回那份文件
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = db.GetDocumentByID(session.CurrentAgent.ParameterDocID)
```

被呼叫的 agent 從自己的 [`ParameterDocID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARAMETERDOCID_PROPERTY_AGENT.html)（官方：「the note ID of a document passed to the agent by Run or RunOnServer」，唯讀，Release 5.02 起）拿到那個 NoteID，再用 `GetDocumentByID` 取回文件來處理。這比用一個全域暫存欄位乾淨得多。

## 認識這支 agent：常用屬性

不只能跑它，也能查它的設定（多數唯讀）：

| 屬性 | 內容 |
|---|---|
| `IsEnabled` | 讀寫，「whether an agent is able to run or not」— 可程式化啟用／停用 |
| `Trigger` | 這支 agent 何時觸發（排程／事件…） |
| `Target` | 它作用在哪些文件上 |
| `LastRun` | 上次執行的日期 |
| `ServerName` | 讀寫，設定它排程跑在哪台 server（是設計元件的屬性，不是這次執行的） |
| `IsNotesAgent` / `IsWebAgent` | 能在 Notes client／Web 瀏覽器環境跑嗎 |
| `IsPublic` | 共用還是私人 |
| `Owner` | 最後修改並儲存它的人 |

`IsEnabled` 可寫這點很實用 — 維護期間用程式把某支排程 agent 停掉、完事再開回來，配合 `Save()` 寫回設計元件即可。

## 幾個限制

呼叫 agent 不是萬能，官方列了幾條硬限制：

- **不能遞迴**：「You cannot run an agent recursively (cannot call it from itself).」 agent 不能呼叫自己。
- **不能 debug**：「You cannot debug a called agent.」 被 `Run` / `RunOnServer` 叫起來的 agent 進不了 debugger。
- **使用者不能互動**：「The user cannot interact directly with a called agent.」 被呼叫的 agent 裡別放對話框 — 沒人能按。
- **輸出只進 log**：「User output goes to the Domino log.」 `Print` 之類的輸出會跑到 Domino log，不會出現在使用者眼前。要記錄被呼叫 agent 的執行過程，搭配站上先前寫的 [`NotesLog`](/domino-news/posts/notes-log/) 是更可控的做法。

## 同類別在其他語言

`NotesAgent` 三種語言都有，名字一致：

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `Agent` | `db.getAgent(name)` |
| SSJS / XPages | `Agent` | `database.getAgent(name)` |

`run` / `runOnServer` 跟 `ParameterDocID` 的觀念三邊一致。XPages 端用 SSJS 從按鈕觸發後端 agent 是很常見的模式，走的也是這個 `runOnServer` — 把重活丟回 server，跟這篇的邏輯完全相同。
