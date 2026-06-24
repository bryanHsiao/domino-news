---
title: "NotesIDVault：用程式從 ID Vault 取 ID、同步、重設密碼"
description: "ID Vault 是 Domino 用 policy 集中保管使用者 ID 檔的機制。NotesIDVault 讓你用程式操作它 — 從 vault 取出某使用者的 ID 檔、把本機 ID 同步回 vault、檢查某人 ID 在不在 vault 裡、甚至重設 vault 密碼。本文拆解它的取得、GetUserIDFile / SyncUserIDFile / IsIDInVault / ResetUserPassword / PutUserIDFile 各方法、跟 NotesUserID 的關係，以及這些操作的權限前提。"
pubDate: 2026-06-25T07:30:00+08:00
lang: zh-TW
slug: notes-id-vault
tags:
  - "LotusScript"
  - "Admin"
  - "Security"
sources:
  - title: "NotesIDVault class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESIDVAULT_CLASS.html"
  - title: "NotesUserID class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUSERID_CLASS.html"
  - title: "NotesSession class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
relatedJava: ["IDVault"]
relatedSsjs: []
cover: "/covers/notes-id-vault.webp"
coverStyle: "risograph"
---

**ID Vault** 是 Domino 用 policy 集中、安全地保管使用者 Notes ID 檔的設施 —— 使用者忘記密碼、換電腦、ID 損毀時，管理員（或自動化流程）能從 vault 把 ID 補回去。那「用程式操作 ID Vault」靠的就是 [`NotesIDVault`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESIDVAULT_CLASS.html)。

官方定義：「The NotesIDVault class is a representation of the secure storage facility for UserIDs that may be configured for Domino by policy.」它讓你從 vault 取 ID、把本機 ID 同步回去、檢查某人在不在 vault、重設 vault 密碼 —— 這些原本要在 Admin Client 一個個點的事，能寫成自動化。

---

## 重點摘要

- 從 [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) 取得：`Set vault = session.GetIDVault()`。
- **取 ID**：`GetUserIDFile(path, vaultServer, password, userName)` 把某使用者的 ID 從 vault 拉成檔案。
- **同步**：`SyncUserIDFile(...)` 把本機 ID 的變更更新回 vault 裡的副本。
- **查詢**：`IsIDInVault(vaultServer, userName)` 回 `Boolean`，看某人 ID 在不在 vault。
- **重設密碼**：`ResetUserPassword(vaultServer, password, userName, downloadCount)`。
- **放入**：`PutUserIDFile(path, vaultServer, password, userName)` 把 ID 檔存進 vault。
- 取出的 ID 可進一步包成 [`NotesUserID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUSERID_CLASS.html)，用來取得該 ID 可用的私密加密金鑰名稱。

## 取得與基本操作

直接從 session 拿到 vault 物件，再對它呼叫各操作。官方範例（逐字）把幾個主要方法都示範了：

```lotusscript
Set id = session.getIDVault()
Call id.getUserIDFile("c:/1.id", "test vault1/IBM", "12345", "TEST/IBM")
Call id.syncUserIDFile("c:/2.id", "test vault1/IBM", "12345", "TEST/IBM")
bVault = id.isIDInVault("test vault1", "TEST/IBM")
Call id.resetUserPassword("test vault1/IBM", "67890", "TEST/IBM", 0)
Call id.putUserIDFile("c:/3.id", "test vault2/IBM", "12345", "TEST/IBM")
```

各方法的參數模式很一致：**vault 伺服器名、密碼、目標使用者名**，加上各自需要的東西（檔案路徑、下載次數等）。

## 各方法在做什麼

| 方法 | 作用 |
|---|---|
| `GetUserIDFile` | 從 vault 取出某使用者的 ID 檔到指定路徑 |
| `SyncUserIDFile` | 把本機 ID 檔的變更同步回 vault |
| `IsIDInVault` | 檢查某使用者的 ID 是否在 vault 中（回 `Boolean`） |
| `ResetUserPassword` | 重設 vault 中該 ID 的密碼，最後一個參數是允許的下載次數 |
| `PutUserIDFile` | 把一個 ID 檔放進 vault |

典型自動化場景：使用者報修「Notes 開不了、忘記密碼」，流程自動 `ResetUserPassword` 給一組臨時密碼 + 下載次數，使用者用它在新機器上自動取回 ID —— 不用管理員手動處理。

## 權限前提（重要）

這組操作碰的是**安全核心**，不是隨便誰跑都行：

- 程式要能存取 vault，背後得有對應的 **vault 信任 / 授權**（例如以有權限的身分執行、或 agent 簽章者具備 vault 操作權）。
- `ResetUserPassword`、`PutUserIDFile` 這類等同管理動作，受 vault 的 policy 與 ACL 控管。
- 這也是為什麼 `relatedSsjs` 是空的 —— ID Vault 操作屬於管理/伺服器端範疇，不是 XPages 前端會碰的東西。

換句話說，能不能跑得動，先取決於環境的 vault 設定與你的身分權限，不是 API 寫對就好。

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `IDVault` | `session.getIDVault()` |
| SSJS / XPages | 無 | ID Vault 是管理/伺服器端能力，不在前端範圍 |

Java 端 `IDVault` 的方法名與這篇一一對應（`getUserIDFile` / `syncUserIDFile` / `resetUserPassword`…）。要做「使用者自助找回 ID」這類自動化，Java agent 配 vault policy 是常見組合。
