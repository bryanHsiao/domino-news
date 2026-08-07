---
title: "同一個人，三個名字：為什麼比對 NotesName 會悄悄失敗"
description: "你拿一個名字去比 session.EffectiveUserName，永遠不相等——明明是同一個人。或者你把某個使用者寫進 Readers 欄位，他還是看不到文件。這兩個都是同一個根因：一個 Notes 名字有三種寫法（canonical、abbreviated、common），而你不小心比到、或存到了不同的兩種。這篇筆記講三種格式各是什麼、Notes 內部存的是哪一種，以及為什麼每次比名字前都該先用 NotesName 正規化。"
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

你寫 `If userName = session.EffectiveUserName Then`，結果永遠不成立——即使 `userName` 裝的明明是同一個人。或者你把某人的名字塞進文件的 Readers 欄位，他卻還是打不開那份文件。這兩件事看起來無關，其實是同一個 bug：一個 Notes 名字不是單一字串，同一個人有三種寫法；而這兩個情境裡，你都比到、或存到了錯的那一種。

[`NotesName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNAME_CLASS.html) 就是用來解這團的類別。這篇筆記講它給你的三種名稱格式：Notes 底層存的是哪一種，以及一個能讓「同一個人卻不相等」這類 bug 整批消失的習慣——比較前先正規化。

---

## 重點摘要

- 一個階層式 Notes 名字有三種寫法。**Canonical**：`CN=John B Goode/OU=Sales/O=Acme/C=US`——完整、每個元件都帶標籤。**Abbreviated**：`John B Goode/Sales/Acme/US`——一樣的內容，但拿掉標籤。**Common**：`John B Goode`——只留 CN。
- Notes 內部**一律用 canonical** 儲存和比對名字：ACL 條目、Readers／Authors 欄位、`$UpdatedBy`、`session.EffectiveUserName`，全都是 fully distinguished 的完整形式。
- 用 `Set nn = session.CreateName(raw)` 建一個，再讀 `nn.Canonical`、`nn.Abbreviated`、`nn.Common`（還有 `nn.Organization`、`nn.OrgUnit1`、`nn.Country`、`nn.IsHierarchical` 等）。
- 別直接比對原始的名字字串。比之前先把兩邊都用 `NotesName` 轉成同一種格式：要比對／儲存就用 canonical，要顯示就用 common 或 abbreviated。

## 同一個名字的三種形式

這個類別會把你丟給它的任何名字解析掉，再用你要的格式輸出。文件列的三種最重要，配上例子差別就很清楚：

- **`Canonical`** ——「canonical 形式的階層式名字」，例如 `CN=John B Goode/OU=Sales/OU=East/O=Acme/C=US`。每個元件都帶著它的標籤（`CN=`、`OU=`、`O=`、`C=`）。
- **`Abbreviated`** ——「abbreviated 形式的階層式名字」，例如 `John B Goode/Sales/East/Acme/US`。同樣的元件、同樣的順序，標籤拿掉。
- **`Common`** ——「common name 元件（CN=）」，例如 `John B Goode`。就只有這個人的名字。

需要的話還有更多元件：`Organization`（`O=`）、`OrgUnit1` 到 `OrgUnit4`、`Country`（`C=`）、`Given`、`Surname`，以及用來分辨階層名與扁平名的 `IsHierarchical`。但真正會出 bug 的，就是上面那三種格式。

## Notes 實際用的是哪一種

有個事實能一次解釋開頭那兩個症狀：**Notes 存名字用的是 canonical。** ACL 條目是 canonical；Readers 或 Authors 欄位放的是 canonical；`$UpdatedBy` 是 canonical；[`session.EffectiveUserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html) 回傳的也是 fully distinguished（也就是 canonical）。換句話說，內部那一層（存取控制）講的是 canonical，UI 給你看的卻是 abbreviated 或 common。你的程式只要拿一個「從畫面來的名字」去比一個「從儲存層來的名字」，等於在拿 `John B Goode` 比 `CN=John B Goode/O=Acme/C=US`，`=` 當然永遠是 false。

Readers 欄位那個版本更麻煩，因為它是**悄悄失敗**。你把 `"John B Goode"`（common）或 `"John B Goode/Acme"`（abbreviated）寫進 Readers 欄位，Domino 不會報錯——它只是對不上那位 reader 真正的 canonical 身分，於是文件對他就這樣隱形了。這跟 [用 web 使用者身分跑的 agent](/domino-news/posts/agent-run-as-identity) 踩到的是同一顆雷：effective user 是 canonical，而一個沒寫成 canonical 的 [Readers 欄位](/domino-news/posts/readers-authors-fields)，就是不會放他進來。

## 那個習慣：先正規化、再比較

修法就一條紀律：把兩邊都先過一次 `NotesName`，再比同一種格式：

```lotusscript
Dim session As New NotesSession
Dim a As NotesName, b As NotesName
Set a = session.CreateName(nameFromForm)
Set b = session.CreateName(session.EffectiveUserName)

If a.Canonical = b.Canonical Then       ' 同一個人，不管輸入是哪種格式
    ' ...
End If
```

[`CreateName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATENAME_METHOD.html) 什麼格式都吃（連 RFC 822 網際網路位址、扁平名都行），所以你根本不必先知道輸入是哪種形式——丟進去轉換、再用 canonical 比就對了。凡是要*存*、而且會影響存取的東西（Readers 欄位、ACL 更新），寫 `nn.Canonical`；凡是要給人*看*的（標籤、報表），用 `nn.Abbreviated` 或 `nn.Common`。一句話記：**canonical 給機器、abbreviated 和 common 給人，而且絕不讓這兩邊在一個直接的 `=` 裡碰頭。**（公式語言版本是 `@Name([Canonicalize]; x)`、`@Name([Abbreviate]; x)`、`@Name([CN]; x)`，同樣三種轉換，給 computed 欄位用。）

## 同類別在其他語言

這個有乾淨的對應。Java 的 `lotus.domino.Name` 就是同一個物件、同樣三個存取器（`getCanonical()`、`getAbbreviated()`、`getCommon()`），用 `session.createName(...)` 建立；XPages 的 SSJS 也是同一個 `session.createName(...)`。所以「比較前先正規化」這條規則可以直接搬過去，只有語法不同。不管你在哪處理 Notes 名字，底層的道理都一樣：一個身分、三種寫法，而 canonical 才是存取控制那一層認的那一個。
