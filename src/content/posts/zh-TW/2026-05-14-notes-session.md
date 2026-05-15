---
title: "NotesSession 全攻略 — LotusScript 的入口、單例規則、UserName 的三個變體、Evaluate 把 @Formula 拉進 LS"
description: "NotesSession 是每支 LotusScript 一定會碰到的入口 class — 它代表「當前 script 的執行環境」，提供 CurrentDatabase、UserName / EffectiveUserName / CommonUserName 三個 user 屬性、Evaluate 從 LS 跑 @Formula、CreateLog 寫 NotesLog、GetEnvironmentString 讀 notes.ini。本文整理 class 角色、一個 script 一個 session 的規則、核心 property / method、UserName 三變體在 On Behalf Of agent 的差異、server 端 vs client 端存取權限差異、五個踩雷點，跟完整範例。"
pubDate: 2026-05-14T07:30:00+08:00
lang: zh-TW
slug: notes-session
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesSession class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
  - title: "NotesSession.Evaluate method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVALUATE_METHOD.html"
  - title: "NotesSession.GetEnvironmentString method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETENVIRONMENTSTRING_METHOD.html"
  - title: "Examples: OnBehalfOf property (NotesAgent) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_ONBEHALFOF_PROPERTY_AGENT.html"
relatedJava: ["Session"]
relatedSsjs: ["session"]
cover: "/covers/notes-session.png"
coverStyle: "low-poly-3d"
---

## 重點摘要

[`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) 是每支 LotusScript **第一個碰到的 class** — HCL 官方原話「Represents the environment of the current script, providing access to environment variables, Address Books, information about the current user, and information about the current Notes platform and release number」。本文重點：

1. **一個 script 只有一個 session** — HCL 文件原話：「Since there can only be one session per script, the New method always returns the same object each time you call it. Do not delete session objects」
2. **`UserName` / `EffectiveUserName` / `CommonUserName` 三個都跟「user」有關但意義不同** — On Behalf Of agent 是這三個分歧的典型場景
3. **Server-script vs client-script 的存取權限完全不同** — script 在 server 上跑、權限是「最後簽 script 的人」；在 client 跑、權限是「當前使用者」
4. **`Evaluate` method 是 LS 跟 @Formula 互通的橋** — 可以從 LotusScript 直接跑 `@Today` / `@DbLookup` 等 @Formula

## 為什麼每支 LS 都要先碰它

`NotesSession` 是 Domino Objects 階層的根，你要拿到 `NotesDatabase`、`NotesDocument`、`NotesView`、`NotesAgent` 等任何 backend class，**都要先有 session**。最典型開頭：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase
```

整個 Domino LS code base 90% 的 agent 都從這三行開始。

## 一個 script 只有一個 session

HCL 文件明確規定（[NotesSession 文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html)）：「Since there can only be one session per script, the New method always returns the same object each time you call it. Do not delete session objects」

意思是：

- 你寫 `Dim s1 As New NotesSession` 跟 `Dim s2 As New NotesSession` —— **`s1` 跟 `s2` 是同一個物件**
- 你不需要、也**不應該**用 `Delete` 或 `Set s = Nothing` 把 session 釋放
- 整支 agent 用一個 session 就夠了，不必每個 sub / function 重新 `New`

實務上：把 `Dim session As New NotesSession` 放在 `Initialize` 開頭一次、後續所有地方共用。

## 核心 context property

依 HCL 14.5.1 文件，`NotesSession` 有 24 個 property。下面是寫 agent 時用最多的：

| Property | 描述（verbatim） |
|---|---|
| `CurrentDatabase` | "Read-only. The database in which the current script resides. This database may or may not be open" |
| `CurrentAgent` | "Read-only. The agent that's currently running" |
| `UserName` | "Read-only. The current user's name" |
| `EffectiveUserName` | （HCL 14.5.1 class doc 只列名稱、沒給描述 — 但跟 `OnBehalfOf` agent 一起用時意義最清楚，下節展開） |
| `CommonUserName` | "Read-only. The common name portion of the current user's name" |
| `ServerName` | "Read-only. The full name of the server that the session is running on" |
| `NotesVersion` | "Read-only. The release of Notes in which the current script is running" |
| `Platform` | "Read-only. The name of the platform on which the session is running" |
| `IsOnServer` | "Read-only. Indicates whether a script is running on a server" |
| `AddressBooks` | "Read-only. The Domino Directories and Personal Address Books, including directory catalogs, known to the current session" |

`CurrentDatabase` 跟 `CurrentAgent` 是 agent 起步的兩大基石。`UserName` 系列 三個變體常被搞混（下節）。

## 核心 method

`NotesSession` 提供 41 個 method（依 14.5.1 doc 列表）。重要的：

| Method | 用途 |
|---|---|
| `GetDatabase(server, file)` | "Creates a NotesDatabase object that represents the database located at the server and file name you specify, and opens the database, if possible" |
| `GetDbDirectory(server)` | 拿到某 server 的 NotesDbDirectory，可以走訪該 server 上所有 db |
| `CreateDateTime(s)` | 從字串建 NotesDateTime |
| `CreateLog(name)` | 建 NotesLog 物件（給 agent 寫 log 用） |
| [`Evaluate(formula, [doc])`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVALUATE_METHOD.html) | **從 LotusScript 跑 @Formula** — Evaluates a Domino formula |
| `FreeTimeSearch` | "Searches for free time slots for calendaring and scheduling" |
| [`GetEnvironmentString(name)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETENVIRONMENTSTRING_METHOD.html) | 讀 notes.ini 的 string variable |
| `SetEnvironmentVar(name, value)` | 寫 notes.ini variable |
| `Resolve(url)` | "Returns the Domino object that a URL addresses" — 把 Notes URL 解成 NotesDocument |

`Evaluate` 是 LS 寫複雜邏輯時的萬用 escape hatch — `@DbLookup`、`@DbColumn`、日期算術等用 @Formula 一行寫完的場景，從 LS 走 Evaluate 比手刻好讀很多。

## UserName / EffectiveUserName / CommonUserName — On Behalf Of agent 的分歧場景

三個 property 在普通情境下會傳一樣的值。但在 **On Behalf Of agent**（也就是 agent 設定為「以另一個 user 的身分執行」）時就分歧了。HCL 提供的 [OnBehalfOf 範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_ONBEHALFOF_PROPERTY_AGENT.html) 直接示範這三個值是分開的：

```lotusscript
Call body.AppendText("User = " & session.UserName)
Call body.AddNewLine(1)
Call body.AppendText("Effective user = " & session.EffectiveUserName)
Call body.AddNewLine(1)
Call body.AppendText("OnBehalfOf = " & agent.OnBehalfOf)
```

實務上的對照：

| Property | 意義 | On Behalf Of agent 時 |
|---|---|---|
| `session.UserName` | 「當前 script 的 user」 — 通常是 agent **simer**（簽 agent 的人） | 仍是簽 agent 的人 |
| `session.EffectiveUserName` | 執行身分 — 跟 ACL 比對權限時用的名字 | 變成 OnBehalfOf 設定的 user |
| `session.CommonUserName` | UserName 的 CN 部分（例如 `CN=Bryan/O=ACME` → `Bryan`） | 仍是 UserName 的 CN |
| `agent.OnBehalfOf` | "Read-only. Name of the user under whose identity the agent runs" | 設定的 OnBehalfOf user |

**踩雷點**：寫 audit log 想記「誰實際觸發的 agent」、結果用了 `session.UserName` —— On Behalf Of agent 永遠記成 signer，看不到真正觸發的人。正解：用 `session.EffectiveUserName`。

## Server-script vs client-script — 存取權限完全不同

HCL [NotesDatabase 文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html)有一條規則：「When a script runs on a server, the script access level to databases and servers corresponds to the access level of the script owner (the person who last saved the script). When a script runs on a workstation, the access level to databases and servers corresponds to the access level of the current user」

翻譯：

- **Agent 在 server 跑**（scheduled / event-triggered）→ 用「最後簽 script 的人」的 ACL 權限
- **Agent 在 client 跑**（user 從 menu / button 觸發）→ 用「當前操作的 user」的 ACL 權限

實務後果：

- 同一支 agent 在 server 跑得通、在 client 跑不通（或反過來）—— 通常是 ACL 不同
- Debug 的第一步：印出 `session.UserName` + `session.IsOnServer` 確認真正執行身分

## 五個踩雷點

### 1. 忘 `Dim As New` — 編譯通、執行 nil reference

```lotusscript
Dim session As NotesSession   ' ❌ 忘了 As New
Set db = session.CurrentDatabase  ' runtime error — session 是 Nothing
```

LotusScript **不會在編譯期擋這個** — 編譯通過、執行才噴 「Object variable not set」。`As New NotesSession` 是必須。

### 2. 用 `Set` 重新指派 session — 沒意義

```lotusscript
Dim session As New NotesSession
Set session = New NotesSession   ' ⚠️ 多此一舉，回的還是同一個 object
```

依 HCL 規則「the New method always returns the same object each time you call it」，重 New 不會給你新的 session。

### 3. 寫 audit log 用錯 UserName 變體

```lotusscript
Print "Approval action by: " & session.UserName  ' ❌ On Behalf Of agent 永遠印 signer
```

正解：

```lotusscript
Print "Approval action by: " & session.EffectiveUserName
```

### 4. `Evaluate` 的字串參數要 escape 雙引號

從 LS 跑 @Formula 時，formula 是字串、字串裡的雙引號要用 `{}` 包：

```lotusscript
Dim result As Variant
' ❌ 雙引號衝突、語法錯誤
result = Evaluate("@DbLookup(""":"";""";""serverA/...";:"":"";""orders";Key;1)")

' ✅ 用 {} 包字串
result = Evaluate({@DbLookup("":""; ""serverA/orders.nsf""; ""(byCustomer)""; Key; 1)})
```

### 5. 不必、也不該 `Delete session`

HCL 文件原話：「Do not delete session objects」。LS 不像 Java 需要 recycle、不要習慣性 `Set session = Nothing` —— 你只是讓變數 unbind，session 物件還在、下次 `New` 還會回同一個。

## 完整範例

一支同時用到 CurrentDatabase、Evaluate、CreateLog、GetEnvironmentString 的 agent：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim log As NotesLog
    Dim envValue As String
    Dim today As Variant

    ' 拿到當前 database
    Set db = session.CurrentDatabase

    ' 開 NotesLog 寫到 db 裡（log 的 doc form 是 LogEntry）
    Set log = session.CreateLog("Approval Audit")
    Call log.OpenNotesLog("", db.FilePath)

    ' 紀錄誰跑了 agent
    Call log.LogAction("Agent triggered by " & session.EffectiveUserName _
        & " (signer: " & session.UserName & "), on server: " & CStr(session.IsOnServer))

    ' 從 LS 跑 @Formula 拿今天日期 + 一個 @DbLookup
    today = Evaluate("@Text(@Today)")
    Print "Today = " & today(0)

    ' 讀 notes.ini 的某個自訂變數
    envValue = session.GetEnvironmentString("MyAppDefaultServer", True)
    Print "Default server (from notes.ini) = " & envValue

    Call log.Close()
End Sub
```

幾個觀察：

- **`session` 一次宣告、整支 sub 共用** — 不需要每個 method call 重新拿
- **`session.EffectiveUserName` 跟 `session.UserName` 區分簽 vs 執行身分** — 給 audit trail
- **`Evaluate("@Text(@Today)")` 回的是 Variant array** — 跟 `GetItemValue` 一樣、要 `(0)` 取值
- **`GetEnvironmentString` 的第二個參數**：`True` 表示「不要 prefix `$`」 — notes.ini 的自訂 variable 慣例是有沒有 `$` 前綴的差別

## 同類別在其他語言

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesSession` |
| Java | `lotus.domino.Session` — method 名 camelCase (`getCurrentDatabase`、`evaluate`、`createLog`、`getEnvironmentString`、`getEffectiveUserName`) |
| SSJS（XPages） | `session` 隱含全域變數，等同 `lotus.domino.Session` 透過 JSF 注入 |

跨語言行為一致 —— 唯一差別：Java 物件**要記得 `session.recycle()`**（end-of-method 釋放 C++ side memory）。LS 自動 recycle、不必管。SSJS 的 `session` 是 XPages runtime 已經建好的全域、**用就好、不要 New**。

## 結論

`NotesSession` 看起來只是個入口、但細節很多：

1. **一個 script 一個 session** — 不要重 New、不要 Delete
2. **`EffectiveUserName` 才是「執行身分」** — audit log 別用錯
3. **`Evaluate` 是 LS / @Formula 的橋** — 短小 @Formula 邏輯不要手刻 LS
4. **Server-script vs client-script** 權限不同 — debug 先印 `IsOnServer` 跟 `UserName`

每支 LS 都要碰它、但很多 dev 寫了 10 年也沒搞清楚 `UserName` 跟 `EffectiveUserName` 的差別。把這篇 bookmark 起來、下次寫 agent 時掃一眼。
