---
title: "@Name 是處理 Notes 名稱的瑞士刀：三種格式互轉、抽出任一段"
description: "在 formula 裡常要處理 Notes 名稱——比對、顯示、抽出 OU。@Name 是那把瑞士刀：[ABBREVIATE]／[CANONICALIZE]／[CN] 在 canonical／abbreviated／common 三種格式間互轉，[O]／[OU1]／[S] 抽出任一段。取當前使用者用 @UserName（canonical）或 @V3UserName（abbreviated），但有個坑：在 server agent 裡「當前使用者」其實是簽署者，也不能拿來當安全機制。Formula @function 系列第四篇。"
pubDate: 2026-08-28T07:30:00+08:00
lang: zh-TW
slug: formula-name-functions
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Name — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAME.html"
  - title: "@UserName — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USERNAME.html"
  - title: "@V3UserName — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_V3USERNAME.html"
---

Notes 名稱有三種長相：**canonical**（`CN=Mary Tsen/OU=Illustration/O=Acme/C=US`，帶標籤的完整式）、**abbreviated**（`Mary Tsen/Illustration/Acme/US`，去掉標籤）、**common**（`Mary Tsen`，只有人名）。站上先前那篇 [NotesName 的三種格式](/domino-news/posts/notesname-formats) 講過**為什麼**這三種會讓比對悄悄失敗；這一篇講在 **formula** 裡怎麼在它們之間互轉、怎麼抽出其中一段。

主角只有一個函式：**[`@Name`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAME.html)**。官方說它「allows you to manipulate hierarchical names」——一把處理階層式名稱的瑞士刀。

---

## 重點摘要

- **`@Name([action]; name)`**：一個函式、靠 action 關鍵字決定要做什麼。
- **三種格式互轉**：`[CANONICALIZE]` 展開成 canonical、`[ABBREVIATE]` 收成 abbreviated、`[CN]` 只取 common name。
- **抽出任一段**：`[O]` 組織、`[OU1]`／`[OU2]` 各級組織單位、`[G]` 名、`[S]` 姓、`[C]` 國別、`[Q]` 世代（Jr 之類）。
- **取當前使用者**：`@UserName` 回 canonical、`@V3UserName` 回 abbreviated。
- **那個坑**：在 **server agent** 裡，`@UserName` 的「當前使用者」是**簽署者**，不是觸發的人；官方也說它**不該當安全機制**。

---

## @Name：三種格式互轉

最常用的三個 action，正好對應三種格式：

```
@Name([CANONICALIZE]; "Mary Tsen/Illustration/Acme/US")
    → CN=Mary Tsen/OU=Illustration/O=Acme/C=US

@Name([ABBREVIATE]; "CN=Mary Tsen/OU=Illustration/O=Acme/C=US")
    → Mary Tsen/Illustration/Acme/US

@Name([CN]; "CN=Mary Tsen/OU=Illustration/O=Acme")
    → Mary Tsen
```

- **`[CANONICALIZE]`**：把 abbreviated 補回完整的 canonical（補上 `CN=`／`OU=`／`O=`／`C=` 標籤）。要**存進 Readers／Authors 欄位**、或要跟儲存值**精確比對**時，用這個把兩邊都正規化。（小心：名稱若本身缺了某幾段，`[CANONICALIZE]` 會拿**當前使用者 ID** 的對應段補上——處理不完整的名稱時要留意。）
- **`[ABBREVIATE]`**：反過來，去掉標籤成 abbreviated——給人看的顯示格式。
- **`[CN]`**：只留人名。

（這正好呼應 [NotesName 那篇](/domino-news/posts/notesname-formats) 的教訓：Notes 底層存的是 canonical，所以「比對前先把兩邊都 `[CANONICALIZE]`」是最穩的做法。）

## @Name：抽出其中一段

`@Name` 也能從一個名稱裡挖出**某一段**——做分類、做權限判斷時很有用：

| action | 取出 |
|---|---|
| `[CN]` | common name（人名） |
| `[O]` | 組織（O） |
| `[OU1]`、`[OU2]`… | 第 n 級組織單位 |
| `[G]` | 名（given name） |
| `[S]` | 姓（surname） |
| `[C]` | 國別／地區 |
| `[Q]` | 世代限定詞（如 Jr） |

例如「這個人屬於哪個部門」就是 `@Name([OU1]; PersonName)`。還有一個 `[TOKEYWORD]`——把階層反轉、用反斜線串起來（`US\Acme\R&D\…`），是拿來做 view 分類用的。

## 取當前使用者：@UserName 與 @V3UserName

要拿「現在這個人是誰」，兩個函式：

- **[`@UserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USERNAME.html)**：官方說它回「the current user name」，階層式名稱時是 **canonical 格式（含 CN、OU、O、C 標籤）**。可帶一個 index：`0` 主要名（預設）、`1` 替代名（R5 起）。
- **[`@V3UserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_V3USERNAME.html)**：回的是**abbreviated 格式**（去掉那些標籤）。

同一個 ID，兩者的差別就是格式：

```
@UserName    → CN=Mary Tsen/OU=Illustration/.../O=WorkSavers/C=US
@V3UserName  → Mary Tsen/Illustration/.../WorkSavers/US
```

想要 common name？把 `@UserName` 再套一層 `@Name([CN]; @UserName)` 就好。

## 那個一定要知道的坑

`@UserName` 有一個會坑很多人的行為：**在 server 上跑的 agent，`@UserName` 回的是「簽署者」，不是實際觸發 agent 的人。** 官方也點名它在**公開 view**（public view）裡結果不可預測、而且**不該拿來當安全機制**。

換句話說：`@UserName` 適合在**本機**、或**私有 view** 裡判斷「這是不是我」（像 `SELECT @UserName = AssignedTo` 做個人 view）；但一旦到了 server 端要做「誰能看什麼」的真正權限控制，別靠它——那是 Readers 欄位與 ACL 的工作。

## 小結

處理 Notes 名稱，formula 裡幾乎都是 `@Name` 一把抓：`[CANONICALIZE]`／`[ABBREVIATE]`／`[CN]` 換格式、`[O]`／`[OU1]`／`[S]` 抽段；取當前使用者用 `@UserName`（canonical）或 `@V3UserName`（abbreviated），但記得 server 上它是簽署者、也不是安全機制。

下一篇轉到**日期與時間**——`@Adjust`、`@Date`、`@Now`／`@Today`、`@Modified` 怎麼在 formula 裡做日期運算。
