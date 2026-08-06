---
title: "同一個人，三個名字：讓你的比較靜默失敗的 NotesName 格式"
description: "你把一個名字跟 session.EffectiveUserName 比，永遠不相等，明明就是同一個人。或者你把一個使用者寫進 Readers 欄位，他還是看不到文件。同一個根因：一個 Notes 名字有三種文字形式 —— canonical、abbreviated、common —— 而你比到了不同的兩種。一篇關於 NotesName 的實測報告：每種格式是什麼、Notes 內部存哪一種、以及為什麼每次名字比較都該先用 NotesName 正規化。"
pubDate: 2026-08-06T07:30:00+08:00
lang: zh-TW
slug: notesname-formats
tags:
  - "LotusScript"
sources:
  - title: "NotesName (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html"
  - title: "CreateName (NotesSession, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATENAME_METHOD.html"
  - title: "EffectiveUserName (NotesSession, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html"
relatedJava: ["Name"]
relatedSsjs: ["Name"]
cover: "/covers/notesname-formats.webp"
coverStyle: "pencil-sketch"
---

你寫 `If userName = session.EffectiveUserName Then`，它永遠不成立 —— 即使 `userName` 明明裝著同一個人。或者你把一個使用者的名字塞進文件的 Readers 欄位，他還是打不開那份文件。這兩件看起來無關，其實是同一個 bug：一個 Notes 名字不是單一字串。同一個人有三種文字形式，而這兩個情況裡，你比到、或存到了錯的那一種。

[`NotesName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html) 就是解開這團的類別。這是一篇關於它暴露的三種名稱格式的實測報告：Notes 底層用哪一種、以及那個讓「同一個人卻不相等」整類 bug 消失的習慣 —— 比較前先正規化。

---

## 重點摘要

- 一個階層式 Notes 名字有三種形式。**Canonical**：`CN=John B Goode/OU=Sales/O=Acme/C=US` —— 完整、帶元件標籤。**Abbreviated**：`John B Goode/Sales/Acme/US` —— 同樣的部分、拿掉標籤。**Common**：`John B Goode` —— 只有 CN。
- Notes 以 **canonical** 形式儲存與比對名字：ACL 條目、Readers／Authors 欄位、`$UpdatedBy`、以及 `session.EffectiveUserName` 全都是 fully distinguished。
- 用 `Set nn = session.CreateName(raw)` 建一個，然後讀 `nn.Canonical`、`nn.Abbreviated`、`nn.Common` —— 外加 `nn.Organization`、`nn.OrgUnit1`、`nn.Country`、`nn.IsHierarchical`。
- 絕不要比對原始名字字串。比較前先把兩邊都用 `NotesName` 正規化成同一種格式 —— 比對／儲存用 canonical，顯示用 common 或 abbreviated。

## 同一個名字的三種形式

這個類別會解析你丟給它的任何東西、再用任何格式重新輸出。文件給了重要的三種，配一個讓差別一目了然的例子：

- **`Canonical`** ——「canonical 形式的階層式名字」，例如 `CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US`。每個元件都帶著它的標籤（`CN=`、`OU=`、`O=`、`C=`）。
- **`Abbreviated`** ——「abbreviated 形式的階層式名字」，例如 `John B Goode/Sales/East/Acme/US`。同樣的元件、同樣的順序，標籤拿掉。
- **`Common`** ——「common name 元件（CN=）」，例如 `John B Goode`。只有那個人。

需要的話還有更多元件 —— `Organization`（`O=`）、`OrgUnit1` 到 `OrgUnit4`、`Country`（`C=`）、`Given`、`Surname`、以及用來分辨階層名與扁平名的 `IsHierarchical`。但上面那三種格式，才是 bug 住的地方。

## Notes 實際用的是哪一種

這裡有個事實能解釋開頭那兩個症狀：**Notes 以 canonical 儲存名字。** 一個 ACL 條目是 canonical。一個 Readers 或 Authors 欄位放的是 canonical 名字。`$UpdatedBy` 是 canonical。而 [`session.EffectiveUserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html) 回傳 fully distinguished —— 也就是 canonical —— 的名字。所以內部的、存取控制那一層講 canonical，而 UI 給你看的是 abbreviated 或 common。你的程式一旦拿一個從顯示情境來的名字、去比一個從儲存層來的，你就是在拿 `John B Goode` 比 `CN=John B Goode/O=Acme/C=US`，而 `=` 永遠說 false。

Readers 欄位那個版本更糟，因為它靜默失敗。把 `"John B Goode"`（common）或 `"John B Goode/Acme"`（abbreviated）寫進 Readers 欄位，Domino 不報錯 —— 它只是對不上那個 reader 實際擁有的 canonical 身分，所以文件對他隱形。這正是抓住 [用 web 使用者身分跑的 agent](/domino-news/zh-TW/posts/agent-run-as-identity) 的同一個雷：effective user 是 canonical，而一個沒放 canonical 形式的 [Readers 欄位](/domino-news/zh-TW/posts/readers-authors-fields) 不會放他進來。

## 那個習慣：先正規化、再比較

修法是一行紀律 —— 把兩邊都跑過 `NotesName`、比同一種格式：

```lotusscript
Dim session As New NotesSession
Dim a As NotesName, b As NotesName
Set a = session.CreateName(nameFromForm)
Set b = session.CreateName(session.EffectiveUserName)

If a.Canonical = b.Canonical Then       ' 同一個人，不管輸入是哪種格式
    ' ...
End If
```

[`CreateName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATENAME_METHOD.html) 接受任一種格式（甚至 RFC 822 網際網路位址與扁平名），所以你不需要知道輸入是哪種形式進來的 —— 你把它轉換、再用 canonical 比。任何你要*儲存*、而且存取取決於它的東西 —— 一個 Readers 欄位、一個 ACL 更新 —— 寫 `nn.Canonical`。任何人要*讀*的東西 —— 一個標籤、一份報表 —— 用 `nn.Abbreviated` 或 `nn.Common`。經驗法則：canonical 給機器、abbreviated 與 common 給人，而你永遠不讓兩者在一個原始的 `=` 裡相遇。（給 computed 欄位用的公式語言版本是 `@Name([Canonicalize]; x)`、`@Name([Abbreviate]; x)`、`@Name([CN]; x)` —— 同樣三種轉換。）

## 同類別在其他語言

這一個有乾淨的對應。Java 的 `lotus.domino.Name` 類別是同一個物件、同樣三個存取器 —— `getCanonical()`、`getAbbreviated()`、`getCommon()` —— 用 `session.createName(...)` 建立。XPages 裡的 SSJS 用同一個 `session.createName(...)`。所以「比較前先正規化」這條規則直接搬得過去，只有語法變。不管你在哪處理 Notes 名字，底層的真相不變：一個身分、三種寫法，而 canonical 是存取控制那一層相信的那一個。
