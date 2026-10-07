---
title: "12.0.2「子分類底下的文件消失」regression 家族：四支 KB、兩個 notes.ini 參數，先分清楚你中的是哪一個"
description: "升到 12.0.2 後，多層分類的視圖只顯示最上層、子分類底下的文件不見了。你照症狀搜到一支 KB、照它加了 notes.ini 參數，卻「did not work」——因為這不是單一 bug，是一整個家族：四支官方 KB、兩個不同的參數。client 端的 @PickList 與 embedded view 用 EnableExtendedFindByKey=0（修於 FP1），XPages 用 DISABLE_REFIND_IN_READENTRIES=1（修於 FP3/14.0）。這篇把四支 KB 整理成一張對照表，教你先對到自己的介面、再下對的參數。"
pubDate: 2026-10-07T07:30:00+08:00
lang: zh-TW
slug: domino-1202-categorized-view-regression-family
tags:
  - "Notes Client"
  - "XPages"
  - "Admin"
sources:
  - title: "XPages: Unable to get document when filtering a multi-column category and the next column is a category（KB0102504）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504"
  - title: "When using Picklist dialog in a view with categories and subcategories, topmost layer are only showing（KB0102042）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042"
  - title: "When using Show single category in Embedded view along with subcategory, topmost layer are only showing（KB0102043）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043"
  - title: "Embedded views only show first category（KB0101979）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-1202-categorized-view-regression-family.webp"
coverStyle: "watercolor"
---

升到 12.0.2 之後，你的一個多層分類視圖開始少東西：分類、子分類的標題都在，但**某層底下的文件只剩最上面那一筆、其它都不見了**。同一份設計在 12.0.1 是好的。

你照症狀搜，找到一支 HCL KB，照它在 `notes.ini` 加了個參數、重啟——沒用。於是你開始懷疑自己是不是打錯字。

其實你沒打錯。問題是**你搜到的那支 KB，不見得對到你的介面**。12.0.2 這個「子分類底下文件消失」不是單一 bug，是**一整個家族**：四支官方 KB、打在四個不同的介面上，而且**分成兩組、對兩個不同的參數、在兩個不同的 fixpack 才修好**。這篇把四支整理成一張表，重點只有一句：**先分清楚你中的是哪一組，再下對應的參數。**

---

## 重點摘要

- **四支官方 KB、同一層病灶**：12.0.2 這一波為了更好地處理視圖更新，動了 NIF（Notes 的視圖索引層）的查找行為，在好幾個「往子分類底下取文件」的路徑上各自出了 regression。
- **但它們是兩組、不是一顆 bug**——用的是**兩個不同的參數**、B 群還帶著自己的 SPR，加上分別在 FP1 與 FP3/14.0 才修好，都指向這是 NIF 這層的**兩個各自獨立的改動**：

| 介面 | 症狀 | 參數（範疇） | 修復版本 | KB |
|---|---|---|---|---|
| `@PickList` / `PicklistCollection` 對話框 | 只顯示子分類最上層 | `EnableExtendedFindByKey=0`（**client**） | 12.0.2 FP1 | [KB0102042](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042) |
| Embedded view「Show single category」+ 子分類 | 只顯示最上層 | `EnableExtendedFindByKey=0`（**client**） | 12.0.2 FP1 | [KB0102043](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043) |
| Embedded view | 只顯示第一個分類的文件 | `EnableExtendedFindByKey=0`（**client**） | 12.0.2 FP1 | [KB0101979](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979) |
| XPages 多欄分類、下一欄仍分類 | 只顯示分類、文件不見 | `DISABLE_REFIND_IN_READENTRIES=1`（**server**） | 12.0.2 FP3 / 14.0 | [KB0102504](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504) |

- **對症的捷徑**：問題出在 **Notes client 的畫面**（picklist、embedded view）→ 前三列、client 端 `EnableExtendedFindByKey=0`；問題出在 **XPages**（伺服器讀 view entry）→ 最後一列、server 端 `DISABLE_REFIND_IN_READENTRIES=1`。
- **正解永遠是 fixpack**：參數是暫解，升到對應版本後把它移掉。

## 一個症狀、四個介面

四支 KB 的畫面症狀講的是同一件事：**多層分類的視圖，往子分類底下取文件時只回得到最上層那一筆（或那一批），下面的都不出現**。四支的「Applies to」都是 12.0.2。

其中三支（下一節的 A 群）成因欄貼著同一句官方說法——

> A new functionality was added in Notes 12.0.2 that was to do an advanced form of NIF lookup by default that can better handle updating of views.

翻成白話：12.0.2 為了讓視圖在文件變動後更新得更好，動了 NIF 的查找。NIF 是 Notes/Domino 底層負責視圖索引的那一層，`FindByKey`、`ReadEntries` 這些讀 view entry 的動作都經過它。第四支（B 群的 XPages）成因寫的是另一回事：12.0.2 修另一個 issue（SPR# PJONB7GRUL）時，`ReadEntries` 多了一個 refind 步驟。

兩邊指的都是 NIF 這一層、都是 12.0.2 這一波為了「視圖更新」動的手腳、症狀也都是「子分類底下抓不到文件」——所以像一家人。但它們是這一層的**兩個不同改動**（這也正是參數不通用的原因），下一節分開講。

## A 群：client 端的 extended FindByKey（`EnableExtendedFindByKey=0`，修於 FP1）

三支 KB 打在 **Notes client 自己畫的畫面**上，共用同一個 client 端參數：

- **[KB0102042](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042)** — 用 `@PickList`（formula）或 `NotesUIWorkspace.PicklistCollection`（LotusScript）對一個有分類與子分類的視圖選文件時，對話框**只列出子分類最上層的文件**，其它不出現。
- **[KB0102043](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043)** — 用 embedded view 的「Show single category」搭配子分類時，同樣**只顯示最上層**。
- **[KB0101979](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979)** — embedded view **只顯示第一個分類的文件**，其餘看不到。

三支的暫解一模一樣：在 **client 端的 `notes.ini`** 加

```
EnableExtendedFindByKey=0
```

然後重啟 Notes client。KB 的成因欄只說是「advanced form of NIF lookup」，沒點名 find-by-key；但參數名 `EnableExtendedFindByKey` 本身就指向這條路。官方對這個參數的定位很清楚：它讓 picklist 對話框 / embedded view 的**顯示**，回到 12.0.2 之前那套處理，不影響應用程式其它部分。KB0102043 還多補了一句很重要的話：

> Adding this INI will change the functionality on how the view works by not using the latest indexer changes but it will only effect the HCL Notes clients with that INI and not the HCL Domino Server indexing.

也就是說——這是**純 client 端**的開關，只影響裝了這行的那台 Notes client，**不會動到 Domino Server 的索引**。你不需要、也不應該把它加到伺服器上去救這一群。三支的 Resolved version 都是 **12.0.2 FP1**。

## B 群：server 端的 ReadEntries refind（`DISABLE_REFIND_IN_READENTRIES=1`，修於 FP3 / 14.0）

第四支是**不同的一組**——[KB0102504](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504)：XPages 視圖分類在多個欄位上，篩選後停在一個「下一欄仍是分類」的層時，**只顯示分類、底下的文件不見**。它跟 A 群同屬「12.0.2 改 view 查找」這個大主題，但差別是實打實的：

- **介面不同**：這一支是 **XPages 讀 view entry**（伺服器端的 `ReadEntries`），不是 Notes client 畫面。
- **參數不同**：暫解是 **server 端**的 `DISABLE_REFIND_IN_READENTRIES=1`，不是 client 端的 `EnableExtendedFindByKey=0`。
- **成因是另一個 SPR**：官方寫的是「a regression caused by another issue (SPR# PJONB7GRUL) that was fixed in 12.0.2」；而看參數名 `DISABLE_REFIND_IN_READENTRIES`，那次修復顯然為 `ReadEntries` 引入了一個「refind（重新定位）」步驟，這步在巢狀分類往下取文件時把文件漏掉了（regression 本身是 SPR# MNIACMGKUV）。
- **修復版本更晚**：Resolved 是 **12.0.2 FP3 與 14.0**，不是 A 群的 FP1。

這一支我另有一篇完整走查，包含一個很多人「不小心」踩到的觸發點——分類欄公式裡一個 `\` 就把視圖悄悄做成巢狀分類：見 [XPages 多欄位分類、下一欄還是分類時文件不顯示](/domino-news/posts/xpages-multi-column-category-document/)。這裡只把它放進家族地圖的定位：**B 群、server 端、FP3/14.0。**

## 怎麼判斷你中的是哪一個

不用背 KB 號碼，照介面走就好：

1. **畫面是誰畫的?**
   - 是 **Notes client** 的 picklist 對話框、或 embedded view → **A 群**，在 client `notes.ini` 加 `EnableExtendedFindByKey=0`，升 **FP1**。
   - 是 **XPages**（瀏覽器 / Nomad Web 跑的 XPages 視圖）→ **B 群**，在 server `notes.ini` 加 `DISABLE_REFIND_IN_READENTRIES=1`，升 **FP3 / 14.0**。
2. **參數加了沒用?** 先確認你加對邊了——A 群的參數放伺服器沒用、B 群的參數放 client 也沒用。範疇（client vs server）搞反是最常見的「did not work」。
3. **還是不對?** 那可能是家族外的鄰居（見下一節），或不是這一批 regression，回頭確認症狀是不是真的「子分類底下文件消失」、版本是不是 12.0.2。

## 一個鄰居：多層分類的 by-key lookup（不同問題，但同一塊地）

有一個很像、但**不屬於這個 12.0.2 家族**的陷阱值得一併知道：在多層分類的視圖用 `GetAllDocumentsByKey` 往下取，count 會悄悄不對——它在第一個子分類就停住、不往下走。那是 `GetAllDocumentsByKey` 這個 API 在多層分類下的**語意**問題，不是 12.0.2 才有的 regression，也不靠上面兩個參數解。我把那個實測寫在 [多層分類 view 裡的 GetAllDocumentsByKey](/domino-news/posts/by-key-lookup-categorized-views/)。

會把它放這裡，是因為兩者的地盤重疊得很巧：都發生在「多層分類 + 用 key 往下定位」，而 A 群那個 client 參數的名字就叫 `EnableExtendedFindByKey`——**FindByKey**。踩到「子分類底下東西不對」時，先分清楚你是撞到 12.0.2 的顯示 regression（這篇），還是 `GetAllDocumentsByKey` 的 by-key 語意（那篇），會少走很多冤枉路。

## 正解永遠是 fixpack

兩個參數都是**暫解**，不是終點：

- A 群（picklist / embedded view）：升到 **12.0.2 FP1** 就修好了，之後把 `EnableExtendedFindByKey=0` 從 client `notes.ini` 移掉。
- B 群（XPages）：升到 **12.0.2 FP3 或 14.0**，之後把 `DISABLE_REFIND_IN_READENTRIES=1` 從 server `notes.ini` 移掉。

這兩個都是「關掉 12.0.2 某個內部改動」的參數，長期掛在 `notes.ini` 等於一直不吃那次改動想帶來的好處（更好的視圖更新）。能排 fixpack 就排，升好記得清掉。

## 小結

12.0.2「子分類底下文件消失」是**一個家族、不是一顆 bug**：四支官方 KB（KB0102042 / KB0102043 / KB0101979 / KB0102504）同屬 NIF 這一層、同一波 12.0.2 改動、同一類症狀，但其實是**兩個各自獨立的改動**、清楚分成兩組——**client 端 picklist / embedded view 用 `EnableExtendedFindByKey=0`、修於 FP1**；**XPages 用 `DISABLE_REFIND_IN_READENTRIES=1`、修於 FP3/14.0**。參數不通用，所以順序永遠是先對介面、再下參數；而不管哪一組，正解都是升到對應的 fixpack、再把暫解參數移掉。
