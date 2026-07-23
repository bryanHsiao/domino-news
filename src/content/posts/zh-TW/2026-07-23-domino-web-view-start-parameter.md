---
title: "Domino Web View 翻頁的真相：Start 不是流水號，是階層座標"
description: "「我以為 Start=31 就是第 31 列，然後我錯了。」一篇 classic view ?OpenView Start 參數的除錯實測報告：純數字跳到第 N 個最上層分類、像 1.1.1.1.6 的點號值是階層座標、末段會 clamp 但中段不會、而你沒辦法用一個 URL 跳到絕對最後一頁。外加三個實用應用 —— 分類內序號、@DocNumber(\"\")（含必須單獨使用的地雷）、以及用 ReadViewEntries 做麵包屑。"
pubDate: 2026-07-23T07:30:00+08:00
lang: zh-TW
slug: domino-web-view-start-parameter
tags:
  - "Formula"
  - "JavaScript"
  - "Tutorial"
sources:
  - title: "@DocNumber (Formula Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCNUMBER.html"
  - title: "@DocParentNumber (Formula Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCPARENTNUMBER.html"
  - title: "URL commands for opening servers, databases, and views — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
relatedJava: ["ViewEntry"]
relatedSsjs: ["ViewEntry"]
---

我想要一件簡單的事：在一個 classic Domino web view 上做一個自訂分頁器，列號跨頁接續 —— 第 2 頁從 31 起、第 3 頁從 61 起，以此類推。所以我做了最直覺的事，從 URL 算 `offset = Start - 1`。然後我載入 `?OpenView&Start=31`，拿到一個空白頁。`No documents found`。這個 view 有好幾千份文件。

那個空白頁是一段小小教育的開始。分類 view 裡的 `Start` **不是列號** —— 它是一個階層座標，而一旦你看懂這點，一整類「我的分頁器為什麼壞掉」的 bug 就都說得通了。這就是那篇實測報告（測於 Domino 12.x、classic `?OpenView`；XPages 與 REST API 翻頁方式不同、這些都不適用）。範例用去識別化的 `myview.nsf`。

---

## 重點摘要

- 在**分類** view 裡，純數字 `Start=2` 跳到**第 2 個最上層分類**、不是第 2 列。當最上層分類不足 31 個時，`Start=31` 回 `No documents found`。
- 像 `Start=1.1.1.1.6` 的點號值是**階層座標**：每一段是「在這一層是第幾個兄弟」，而**最後一段是分類內的位置**。它跟 `NotesViewEntry.Position` 與 `?ReadViewEntries` 是同一套座標系統。
- **末段會 clamp、中段不會。** `Start=1.1.1.1.59999` 被夾到該分支尾端；`Start=2.99999.1` 回 `No documents found`。
- **你沒辦法用一個 URL 跳到絕對最後一頁。** 原生的 `ViewNextPage`/`ViewPreviousPage` 之所以能動，是因為 Domino 幫你算好下一個座標（而且原生「下一頁」會重疊一列 —— 上一頁的最後一列變成下一頁的第一列）。
- 三個應用從這裡掉出來：從 Start 段落做的免費**分類內序號**、column formula 裡的 **`@DocNumber` 家族**（含一個鋒利的必須單獨使用地雷）、以及用 `?ReadViewEntries` 反查祖先座標做的**麵包屑**。

## 實測到的行為

與其相信直覺，這是每個 URL 對一個分類 view 實際做的事：

| URL | 結果 |
|---|---|
| `Start=2`（純數字）| 跳到**第 2 個最上層分類** —— 不是第 2 列 |
| `Start=31&ExpandView` | 最上層分類不足 31 個 → **No documents found** |
| `Start=1.1.1.1.6` | 從該分類**第 6 筆文件**開始（原生「下一頁」產生的就是這種）|
| `Start=1.1.1.1.59999`（末段超界）| 被**夾到**該分支尾端 |
| `Start=2.99999.1`（中段超界）| **No documents found**（中間段不 clamp）|

![三段式示意：Start 階層座標樹（085.總務處 → 104 → 一般（實體）→ 085D02_01 → 該分類第 6 筆文件）、Start=1.1.1.1.6 逐段對應五層的 URL 解剖、以及五種 URL 寫法的實測行為速查表](/domino-news/post-images/domino-web-view-start-coordinates.png)

把點號形式讀成一條樹路徑。`1.1.1.1.6` 代表：第 1 個最上層分類 → 它的第 1 個子分類 → 它的第 1 個 → 它的第 1 個 → 底下第 6 筆文件。每一段回答「這裡是第幾個兄弟」，而結尾那段是文件在它直屬分類裡的索引。這正是你在 LotusScript/Java 裡看到的 `NotesViewEntry.Position`、以及 [`?ReadViewEntries`](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) 回應裡的 `position`。

兩個值得內化的後果。第一，「末段 clamp、中段不 clamp」規則代表你可以安全地在一個分類*內*超界（做「這個分類的最後一頁」很方便），但不能跨樹超界。第二 —— 這是殺死天真分頁器的那個 —— **沒有單一 URL 能跳到絕對最後一頁**，因為你得先知道最後一個葉節點的完整座標。內建的 `ViewNextPage` / `ViewPreviousPage` `@DbCommand` 之所以能動，正是因為 Domino 走過樹、幫你算好座標。（那些內建的一個怪癖：「下一頁」把上一頁的最後一列當新頁的第一列 —— 一個刻意的一列重疊。）

## 應用一：免費的分類內序號

因為 Start 座標的最後一段*就是*分類內的位置，你可以零額外請求地推出一個連續號。從 `location.search` 讀 `Start`、把它的最後一段當這頁第一列的起始號、往下走時每遇到一個分類列就歸 1。你就得到跨頁保持正確的「每分類重編」序號 —— 免費、不用伺服器往返。它有效，但如果你能加一個直欄，下一個選項更乾淨。

## 應用二：@DocNumber 家族 —— 以及它的地雷

如果你能改 view 設計，[`@DocNumber`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCNUMBER.html) 直接在一個直欄裡把座標交給你：

| 公式 | 輸出 |
|---|---|
| `@DocNumber` | `1.1.1.1.5`（完整座標）|
| `@DocNumber("")` | `5` ——「文件編號中最不重要的一段……它最右邊的元件」（＝分類內序號）|
| `@DocNumber(":")` | `1:1:1:1:5`（自訂分隔符）|

`@DocNumber("")` 是拿「分類內位置」的乾淨方式。但地雷在這裡，而且是個好地雷：**`@DocNumber` 必須是整個直欄公式。** 文件講得很白 ——「這個 function 在任何其他 formula 裡都不作用」，以及「你不能在 Web 應用裡用這個 function，除了 column formula」。`@DocNumber`（以及它的親戚 `@DocChildren`、`@DocDescendants`、[`@DocParentNumber`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCPARENTNUMBER.html)）是**渲染期特殊 token**、由 view indexer 求值，不是一般 formula 意義下的值。所以像這樣的公式：

```
@Subset(@Explode(@Text(@DocNumber); "."); -1)
```

—— 想「自己取最後一段」—— **不報錯、也不生效**。它編得過、跑得動，而直欄照樣顯示完整的 `1.1.1.1.5`，因為 `@DocNumber` 從沒變成一個字串讓 `@Explode` 去切。要只拿最後一段，用內建的 `@DocNumber("")`。（另外注意 `@Position` 在公式語言裡根本不存在 —— 那是 LotusScript/Java 的 `NotesViewEntry` 世界。）

## 應用三：用反查做麵包屑

這個座標也是一把你可以查詢的鍵。`?ReadViewEntries&Start=1.1.1&Count=1` 精準回傳那一個節點，它的分類名稱在回應的 `<text>` 元素裡。所以當使用者翻到一個大分類 view 的中段、完全失去自己*在哪*的感覺時，你可以把脈絡重建起來：拿 Start 座標、走它的祖先路徑（`1`、然後 `1.1`、然後 `1.1.1`…）、逐層反查，在表格上方組出像 `085 › 總務處 › 104 › …（接續）` 的麵包屑。

```js
var m = location.search.match(/[?&]Start=([\d.]+)/i);
if (m && m[1].indexOf('.') > 0) {
  var segs = m[1].split('.');
  for (var i = 1; i < segs.length; i++) {
    var pos = segs.slice(0, i).join('.');
    // ?ReadViewEntries&Start=<pos>&Count=1 → 讀 <text> 節點 = 該層分類名稱
  }
}
```

這裡兩個陷阱：`?ReadViewEntries` 對純數字 `Start` 一樣只認最上層（分類），所以要明確組出點號祖先路徑；而 `Count` 有伺服器端上限（約 1000），所以別想一個請求拉整個大 view。

## 最後一個注意：座標會位移

一個座標是*位置*、不是身分 —— 插入或刪除文件，變動之後的每個座標都會位移。所以 `Start` 值很適合「從這裡、現在、往下一頁」，但對任何你要持久化的東西是壞選擇。如果你在用 Start 做「記住我剛剛在哪」的功能，加一個時效防呆（一個 timestamp、或重新錨定到一個文件 UNID），而不是相信一個存下來的座標稍後還指著同一列。

## 同類別在其他語言

Start/`@DocNumber` 機制是 classic-web 與公式語言的功能、沒有直接的 XPages 或 REST 對應 —— 那些 stack 用自己的方式翻頁。真正跨得過去的是座標系統本身：你在 Start URL 裡看到的點號位置，就是 LotusScript 與 Java 裡以 `NotesViewEntry.Position` 攤出的同一個值（SSJS 裡透過 `getPosition()`）。如果你是在後端、而不是 URL 上計算階層位置，那就是你要伸手拿的屬性 —— 同樣的座標、不同的門。
