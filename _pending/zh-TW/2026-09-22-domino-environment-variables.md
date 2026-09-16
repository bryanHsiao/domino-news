---
title: "@SetEnvironment 與 SetEnvironmentVar：那些「環境變數」其實是寫在執行那台的 notes.ini"
description: "想從 Formula 或 LotusScript 記一個設定值，@SetEnvironment／@Environment／session.SetEnvironmentVar／GetEnvironmentString 一堆長得像。它們讀寫的其實是「執行程式那台機器的 notes.ini」——per-machine、不共享、也不複寫。加上一個容易絆倒人的 $ 前綴規則（Formula 與 LS 預設會替你加 $、讀 notes.ini 原生設定要另外處理）。這篇把它們寫到哪、$ 怎麼來、什麼時候該用、什麼時候該改用 profile 文件講清楚。"
pubDate: 2026-09-22T07:30:00+08:00
lang: zh-TW
slug: domino-environment-variables
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Formula"
sources:
  - title: "@SetEnvironment (Formula Language) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html"
  - title: "SetEnvironmentVar (NotesSession) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SETENVIRONMENTVAR_METHOD.html"
  - title: "GetEnvironmentString (NotesSession) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_GETENVIRONMENTSTRING_METHOD.html"
  - title: "Using environment variables — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_USING_ENVIRONMENT_VARIABLES.html"
relatedJava: ["Session"]
relatedSsjs: ["session"]
---

你想從 Formula 或 LotusScript 記一個小設定——上次用的值、一個計數、某個開關。手邊有一堆長得像的東西：`@SetEnvironment`、`@Environment`、`Environment()`、`session.SetEnvironmentVar`、`session.GetEnvironmentString`……名字都叫「環境變數」。但它們**寫到哪去、跨不跨機、要不要加 `$`**，搞錯就會「明明存了卻讀不到」，或誤以為「設一次大家都看得到」。

## 重點摘要

- **它們寫的是「執行那台機器的 notes.ini」**：`@SetEnvironment` 寫使用者的 notes.ini；`SetEnvironmentVar`／`GetEnvironmentString` 讀寫 **local notes.ini**。→ **per-machine、不共享、不複寫**。
- **`$` 前綴規則**：Formula 的 `@SetEnvironment` 會**自動在名字前加 `$`**；LS 的 `SetEnvironmentVar` 在第三個參數 `isSystem` 為 false／省略時也加 `$`、為 true 時不加。`$` 用來**區分 user 環境變數（有 `$`）與 system 環境變數（無 `$`，像 notes.ini 原生設定）**。
- **這不是共享狀態**：server agent 寫到 server 的 notes.ini、client 寫到 client 的——要跨使用者／跨機共享，該用 profile 或 config 文件。

## 它們到底寫到哪

先破最大的誤會：這些「環境變數」**不是存在資料庫裡、也不是所有人共用的一個值**，而是寫進**程式執行那台機器的 `notes.ini`**。

[官方](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html)：`@SetEnvironment` 「sets an environment variable stored in the **user's notes.ini file**（Windows／UNIX）or Notes Preferences file（Macintosh）」。LotusScript 這邊同理——[官方](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_GETENVIRONMENTSTRING_METHOD.html)：`getEnvironmentValue`、`getEnvironmentString`、`setEnvironmentVar` 讀寫的是 **local notes.ini** 裡的環境變數。

這句「執行那台」是重點：

- 使用者在**用戶端**按下的公式／agent，寫到**那台 Notes 用戶端**的 notes.ini。
- 在**伺服器**上跑的 agent，寫到**伺服器**的 notes.ini。

所以它**不跨機、不複寫、不共享**。「我設了一個環境變數，怎麼別台讀不到?」——因為它本來就只在那一台。

## 那個絆倒人的 `$` 前綴

第二個坑是 `$`。Domino 用「名字有沒有 `$` 開頭」來區分兩種變數：**user 環境變數**（`$name`）與 **system 環境變數**（`name`，就是 notes.ini 裡那些原生設定）。而各介面**預設會替你加 `$`**：

- **Formula**：`@SetEnvironment("Foo"; "bar")` 實際上會在 notes.ini 存成 `$Foo=bar`——[官方](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html)明說它「prepends a dollar sign（`$`）to the variable name」。用 `@Environment("Foo")` 讀時同樣走 `$Foo`，對得上。
- **LotusScript**：[`SetEnvironmentVar`](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SETENVIRONMENTVAR_METHOD.html) 「prepends a dollar sign（`$`）to the variable name **if the third parameter is false or omitted**」；`GetEnvironmentValue`／`GetEnvironmentString` 也是「prepend a `$` if the second parameter is false or omitted, and do not prepend a `$` if the second parameter is true」。

```lotusscript
Dim s As New NotesSession
' 寫 user 變數（存成 $MyApp_LastUser）
Call s.SetEnvironmentVar("MyApp_LastUser", "Amy")
Print s.GetEnvironmentString("MyApp_LastUser")          ' 讀 $MyApp_LastUser

' 讀 notes.ini 的「原生」設定（無 $，例如 Debug 參數）→ 第二參數給 True
Print s.GetEnvironmentString("Directory", True)          ' 讀 notes.ini 的 Directory=
```

**踩雷點**：你用 `@SetEnvironment` 存的東西是 `$`-開頭的 user 變數；要用 LS 讀，預設也加 `$`，兩邊對得上、沒問題。但你想**讀／寫 notes.ini 裡沒有 `$` 的原生參數**（像 `Debug_*`、`Directory` 這種），就要把 `isSystem`／第二參數設成 **True**，否則你其實在找 `$那個名字`、當然找不到。

## 什麼時候該用、什麼時候別用

環境變數適合的是**「這台機器的本地小狀態」**：記住某使用者在他工作站上上次選的值、一個本地計數、一個只影響這台的開關。

**不適合**當**共享狀態**——因為它不跨機、不複寫。如果你要的是「所有使用者、所有伺服器都看得到同一個值」（一個全域設定、一個共用計數），環境變數是錯的工具，應該用**設定文件（config document）**或 [profile 文件](/domino-news/posts/profile-documents)——那些才是存在資料庫裡、會隨複寫散出去的。把「環境變數＝本機、profile／config＝資料庫（可共享）」記清楚，就不會用錯。

## 小結

`@SetEnvironment`／`SetEnvironmentVar` 這類「環境變數」，讀寫的是**執行那台機器的 notes.ini**——**per-machine、不共享、不複寫**；而且預設會替名字加 `$`（區分 user vs system 變數），要碰 notes.ini 原生設定得把 `isSystem`／第二參數設 True。拿它記本地小狀態很好用；要**共享**的狀態，換成 profile／config 文件。分清楚「本機 vs 資料庫」，這組 API 就不再讓你「存了讀不到」。
