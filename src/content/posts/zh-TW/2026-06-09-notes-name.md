---
title: "NotesName：別再用字串切 Domino 階層名稱"
description: "要從 CN=王小明/OU=Sales/O=Acme/C=TW 取出「王小明」，你還在用 Mid、InStr、@Name 硬切字串嗎？NotesName 是 Domino 內建的名稱解析類別 — session.CreateName() 一句，就能在 canonical、abbreviated、common、Internet（RFC 821/822）各種格式間互轉，並逐段拆出 O / OU / C / G / S 等元件。本文拆解全部唯讀屬性、三種格式互轉、flat name 與 Internet 名稱的行為差異、以及「abbreviation 會有歧義時不縮寫」這個容易忽略的規則。"
pubDate: 2026-06-09T07:30:00+08:00
lang: zh-TW
slug: notes-name
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesName class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html"
  - title: "Common property (NotesName) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMMON_PROPERTY.html"
  - title: "NotesName class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESNAME_CLASS.html"
relatedJava: ["Name"]
relatedSsjs: ["Name"]
cover: "/covers/notes-name.webp"
coverStyle: "collage"
---

你要從 `CN=王小明/OU=Sales/OU=East/O=Acme/C=TW` 這串名字裡，取出「王小明」顯示在介面上。手邊最快的做法是什麼？很多人會直接 `Mid` 加 `InStr` 找 `CN=` 跟第一個 `/`、或在公式語言裡 `@Name([CN]; ...)` 硬切。能動，但一遇到沒有 `CN=` 前綴的 flat name、或階層層數不同的名字，切字串的邏輯就開始長一堆 `If`。

其實 Domino 早就內建了一個專門做這件事的類別。[`NotesName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html) 的官方定義只有三個字 — 「Represents a name.」 — 但它能把一個 Domino 名稱在 canonical、abbreviated、common、甚至 Internet 位址等格式之間自由互轉，還能逐段拆出 `O`、`OU`、`C` 這些元件。一句 `session.CreateName()` 就開工，再也不用自己切字串。

---

## 重點摘要

- 用 `session.CreateName(name$ [, language$])` 建立 — **它掛在 [`NotesSession`](/domino-news/posts/notes-session/) 底下**，`New` 在 COM 下不支援
- **三個最常用的格式屬性**：`Common`（只要 `王小明`）、`Abbreviated`（`王小明/Sales/East/Acme/TW`）、`Canonical`（`CN=王小明/OU=...`）
- **逐段拆元件**：`Organization`(O=)、`OrgUnit1`~`OrgUnit4`(OU=)、`Country`(C=)、`Given`(G=)、`Surname`(S=)、`Initials`(I=)、`Generation`(Q=) 等，全是唯讀
- `IsHierarchical`：`Boolean`，判斷這個名字是不是階層式
- **Internet 名稱那一面**：`Addr821`(RFC 821)、`Addr822LocalPart` / `Addr822Phrase` / `Addr822Comment1~3`(RFC 822)
- 所有屬性**全唯讀** — `NotesName` 只解析、不修改名字
- 兩個一定要知道的行為：`Common` 對 flat name 會「原樣回傳」、對 Internet 名稱回 LocalPart；canonical 縮寫**若會造成歧義就不縮寫**

---

## CreateName：從 NotesSession 建立

`NotesName` 不是 `New` 出來的（官方明說 `New` 在 COM 下不支援），而是由 `NotesSession` 提供 — 跟站上 [`NotesSession`](/domino-news/posts/notes-session/) 那篇講的各種 `CreateXxx` 工廠方法同一個模式：

```lotusscript
Dim session As New NotesSession
Dim nam As NotesName
Set nam = session.CreateName({CN=王小明/OU=Sales/OU=East/O=Acme/C=TW})
```

`CreateName` 還有第二個選用參數 `language$`，用來處理「替代使用者名稱（alternate name）」的語言碼，平常用不到，需要多語名稱時才帶。

## 三種格式互轉：Common / Abbreviated / Canonical

這是 `NotesName` 最高頻的用途。同一個名字，三個屬性給你三種寫法 — 直接看官方範例（原文逐字）：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim nam As NotesName
  Dim msg As String
  REM Create a hierarchical name
  Set nam = session.CreateName( _
  {CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US})
%REM
Returns:
  John B Goode
  John B Goode/Sales/East/Acme/US
  CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US
%END REM
  msg = nam.Common & Chr(13)
  msg = msg & nam.Abbreviated & Chr(13)
  msg = msg & nam.Canonical
  Messagebox msg,, "Canonical name"
End Sub
```

三個屬性的對照：

| 屬性 | 回傳 | 典型用途 |
|---|---|---|
| [`Common`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMMON_PROPERTY.html) | `John B Goode` | 介面顯示、寄件者名稱 |
| [`Abbreviated`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABBREVIATED_PROPERTY.html) | `John B Goode/Sales/East/Acme/US` | 人類可讀、又保留階層 |
| [`Canonical`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CANONICAL_PROPERTY.html) | `CN=John B Goode/OU=...` | 寫進文件、ACL、`Names` 欄位 |

實務上最常見的就是「拿到一個 canonical 名稱、只想顯示 common name」：以前要切字串，現在就 `nam.Common`。反過來，使用者輸入 abbreviated、你要存成 canonical，也只是 `nam.Canonical`。

## 逐段拆解階層的每一段

如果你要的不是整串，而是「這個人屬於哪個 `Organization`」「在哪個 `OrgUnit`」，`NotesName` 把每一段都拆成獨立的唯讀屬性：

| 屬性 | 元件 | 範例值 |
|---|---|---|
| `Organization` | `O=` | `Acme` |
| `OrgUnit1` ~ `OrgUnit4` | `OU=` | `Sales` / `East` / … |
| `Country` | `C=` | `US` |
| `Given` | `G=` | 名 |
| `Surname` | `S=` | 姓 |
| `Initials` | `I=` | 縮寫 |
| `Generation` | `Q=` | 世代，例如 `Jr.` |
| `ADMD` / `PRMD` | `A=` / `P=` | X.400 管理網域元件 |

還有一個方便的 `Keyword` 屬性，把元件用反斜線串起來：`country\organization\OU1\OU2\OU3\OU4` — 適合拿來做分組 key 或排序。

```lotusscript
Dim nam As NotesName
Set nam = session.CreateName(doc.GetItemValue("Author")(0))
If nam.OrgUnit1 = "Sales" Then
    ' 這個人在 Sales 部門，跑對應邏輯
End If
```

## Internet 名稱那一面

`NotesName` 不只懂 Domino 階層名，也懂 Internet 位址。當你丟進去的是一個 RFC 822 名稱（例如 `"王小明" <ming@acme.com>`），這幾個屬性就派上用場：

| 屬性 | 內容 |
|---|---|
| `Addr821` | RFC 821 Internet 位址 |
| `Addr822LocalPart` | RFC 822 的本地部分（`@` 前面那段） |
| `Addr822Phrase` | RFC 822 的顯示名稱片語 |
| `Addr822Comment1` ~ `Comment3` | RFC 822 的註解元件 |

## IsHierarchical 與 flat name 的行為

不是每個名字都是階層式的。先用 `IsHierarchical`（回傳 `Boolean`）判斷，再決定要不要去讀那些階層元件 — 對 flat name 讀 `Organization` 只會拿到空字串。

更要注意的是 `Common` 的「貼心」行為。官方文件對它寫得很清楚：

- 階層名稱 → 回傳 `CN=` 那一段
- **flat name → 「原樣回傳」（returns a flat name as-is）**
- Internet 名稱 → 回傳 LocalPart

這其實是好事：不管丟進來的是哪一種，`nam.Common` 都會給你「一個能顯示的名字」，你不需要先判斷格式。這正是用 `NotesName` 取代手切字串最大的好處 — 它把那些 `If` 都吃掉了。

最後一個容易忽略的規則：**「This class does not abbreviate a canonical name if the abbreviation would be ambiguous.」** 當縮寫後會產生歧義時，`Abbreviated` 不會硬縮，會保留足以辨識的形式。所以別假設 `Abbreviated` 一定比 `Canonical` 短。

## 一個實務範例

把目前使用者名稱轉成 common name 顯示，就是官方的第二個範例：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim nam As NotesName
  Dim msg As String
  REM Create a NotesName from user name
  Set nam = session.CreateName(session.UserName)
  REM Display common, abbreviated, and canonical formats
  msg = nam.Common & Chr(13)
  msg = msg & nam.Abbreviated & Chr(13)
  msg = msg & nam.Canonical
  Messagebox msg,, "User name"
End Sub
```

要批次處理一個 `Readers` / `Authors` / `Names` 欄位裡的多個名字，就在迴圈裡逐一 `CreateName`，全部轉成 common name 後再組回去 — 比自己切字串穩，也自動處理了混在一起的 flat name 與 Internet 名稱。

## 同類別在其他語言

`NotesName` 是少數三種語言都有、行為也一致的類別：

| 語言 | 對應類別 | 建立方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `Name` | `session.createName(name)` |
| SSJS / XPages | `Name` | `session.createName(name)` |

三邊的屬性命名幾乎一一對應（`getCommon()` / `getAbbreviated()` / `getCanonical()` …），所以這篇拆的觀念可以直接帶著走。真正動手寫 Java 或 SSJS 版時，唯一要記得的是它們用 getter 方法、而不是 LotusScript 的屬性語法。
