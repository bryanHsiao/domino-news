---
title: "LotusScript 的 Evaluate：在程式裡直接跑 @formula"
description: "有時候你心裡那個剛好的工具是一個 @function — @Name、@Unique、@Explode、@DbLookup — 但你人在 LotusScript 裡。Evaluate 就是那座橋：把 @formula 當字串丟進去、在程式裡執行、拿回結果。本文拆解兩種呼叫形式（帶不帶 document context）、一個一定會踩的陷阱（回傳值永遠是陣列），以及哪些 @function 不支援（@Command、@Prompt、@PickList 等 UI 類）。"
pubDate: 2026-06-20T07:30:00+08:00
lang: zh-TW
slug: lotusscript-evaluate
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Using the Evaluate statement — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html"
  - title: "NotesSession class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
  - title: "NotesDocument class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
relatedJava: ["Session"]
relatedSsjs: ["session"]
---

有時候你在寫 LotusScript，但心裡那個「剛好能解」的工具是一個 **@function** —— 你想要 `@Name` 的階層名稱處理、`@Unique` 的去重、`@Explode` / `@Implode` 的字串拆併、或 `@DbLookup` 的跨庫查值。問題是：這些是公式語言（@formula），你人在 LotusScript 裡。

[`Evaluate`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html) 就是那座橋。它讓你把一段 @formula 當**字串**丟進去、在程式執行期跑它、拿回結果。這篇講清楚它的兩種用法、一個幾乎人人都踩過的陷阱，以及哪些 @function 在這裡不能用。

---

## 重點摘要

- 兩種形式：`result = Evaluate(formula$)`、或帶文件脈絡 `result = Evaluate(formula$, doc)`
- formula 是**字串** —— 用大括號 `{...}` 或引號包起來丟進去
- **最大陷阱**：回傳值**永遠是陣列**（用 `Variant` 接），就算只有一個值也在 `result(0)`
- 帶 `doc` 那一形式：公式裡可以參照那份文件的欄位
- **不支援的 @function**：UI / DDE 類 —— `@Command`、`@Prompt`、`@PickList`、`@DialogBox`、`@PostedCommand`、`@DbManager`、`@DbName`、`@DbTitle`、`@ViewTitle`、`@DDE*`

---

## 兩種呼叫形式

**只給公式**：公式自給自足、不需要某份文件的欄位時：

```lotusscript
Dim v As Variant
v = Evaluate({@Name([Abbreviate]; "CN=王小明/OU=Sales/O=Acme/C=TW")})
Print v(0)    ' 王小明/Sales/Acme/TW
```

**給公式 + 文件脈絡**：公式裡要參照「某份文件」的欄位時，把 [`NotesDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) 當第二個參數傳進去：

```lotusscript
v = Evaluate({@Created}, doc)         ' 取 doc 的建立時間
v = Evaluate({Subject + " (" + Status + ")"}, doc)   ' 直接引用 doc 的欄位
```

`Evaluate` 也是 [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) 的方法（`session.Evaluate(...)`），行為相同。

## 最大陷阱：回傳值永遠是陣列

這是新手 100% 會中的一個。官方原文：「You should use a variant for the return value, since you may not know how many elements are being returned.」—— **結果永遠是陣列**，即使公式只算出一個純量值，它也放在 `result(0)`，不是直接給你那個值。

```lotusscript
Dim v As Variant
v = Evaluate({@Sum(1 : 2 : 3)})
' 對的：
Print v(0)        ' 6
' 錯的：
Print v           ' 型別錯誤 / 不是你要的
```

所以接 `Evaluate` 的結果，一律用 `Variant`、一律從 `(0)` 取（多值結果就整個陣列遍歷）。把它當成「回傳純量」來寫，遲早出錯。

## 哪些 @function 不支援

`Evaluate` 跑的是「計算型」公式，**所有需要使用者介面或 DDE 的 @function 都不支援**。官方點名的有：

`@Command`、`@DbManager`、`@DbName`、`@DbTitle`、`@DDEExecute`、`@DDEInitiate`、`@DDEPoke`、`@DDETerminate`、`@DialogBox`、`@PickList`、`@PostedCommand`、`@Prompt`、`@ViewTitle`。

道理跟前面寫過的 UI class 一樣 —— `Evaluate` 在程式邏輯層跑、不在某個開著的 UI 視窗脈絡裡，所以「跳對話框」「下選單指令」「問使用者」這類本來就無從執行。要跟使用者互動，回到 `NotesUIWorkspace` 那條路。

## 什麼時候該用 Evaluate

不是所有事都該繞去公式 —— 純字串、數字處理，LotusScript 自己的函式更直接。`Evaluate` 真正划算的時機是：**某個 @function 一行就解、而 LotusScript 要寫一大段**。常見的有：

- `@Unique` —— 去重一個清單
- `@Name` —— 階層名稱各種格式轉換（雖然站上也介紹過用 [`NotesName`](/domino-news/posts/notes-name/) 做，看你順手哪個）
- `@Explode` / `@Implode` / `@Trim` —— 字串拆併與去空白
- `@DbLookup` / `@DbColumn` —— 跨庫查值
- `@Abstract` —— 摘要文字

一行公式換掉十行迴圈時，`Evaluate` 就是對的工具。

## 在其他語言

| 語言 | 對應 | 形式 |
|---|---|---|
| Java（`lotus.domino.*`） | `Session.evaluate` | `session.evaluate(formula)` / `session.evaluate(formula, doc)` |
| SSJS / XPages | `session.evaluate` | 同上 |

三邊一致：丟字串公式、回傳 `Vector` / 陣列（一樣是「永遠是集合」）、一樣不支援 UI 類 @function。Java 端回的是 `java.util.Vector`，取值用 `elementAt(0)` —— 那個「永遠是集合」的陷阱換成 Java 一樣存在。
