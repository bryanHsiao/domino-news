---
title: "Formula 跨 View／跨資料庫取值：@DbColumn 與 @DbLookup 一次搞懂"
description: "在 formula 裡要讀另一個 view 或另一個資料庫的資料，九成的情況就靠兩個函式：@DbColumn 抓一整欄（做關鍵字清單、下拉選單），@DbLookup 按 key 找一個值（把代碼換成標籤、拉一個關聯欄位）。這篇講兩者的語法、cache 關鍵字（空字串／NoCache／ReCache）、以及那幾個一定要知道的規矩——第一欄要排序、只能相等比對、64KB 上限、還有它們在哪些地方不能用。Formula @function 系列第一篇。"
pubDate: 2026-08-25T07:30:00+08:00
lang: zh-TW
slug: formula-dblookup-dbcolumn
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@DbColumn (Notes databases) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBCOLUMN_NOTES_DATABASES.html"
  - title: "@DbLookup (Notes databases) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_NOTES_DATABASES.html"
  - title: "About formulas that look for values in columns and views — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html"
cover: "/covers/formula-dblookup-dbcolumn.webp"
coverStyle: "minimalist-mono"
---

在 formula 裡，你常常要讀「別的地方」的資料——另一個 view 的某一欄、另一個資料庫裡的某個值。做這件事，九成的情況就靠兩個函式：

- **[`@DbColumn`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBCOLUMN_NOTES_DATABASES.html)**：抓一整欄的值回來（做關鍵字清單、下拉選單最常用）。
- **[`@DbLookup`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_NOTES_DATABASES.html)**：按一個 key 去找、回傳對應的值（把代碼換成標籤、拉一個關聯欄位）。

這是 Formula @function 系列的第一篇，先把這兩個主力函式講清楚。

---

## 重點摘要

- **`@DbColumn` 抓整欄**：`@DbColumn(class:cache; server:database; view; columnNumber)`——回傳那一欄的所有值成一個 list。
- **`@DbLookup` 按 key 找**：`@DbLookup(class:cache; server:database; view; key; fieldName 或 columnNumber; keywords)`。
- **cache 關鍵字**：`""`（快取、同 session 重用）、`"NoCache"`（每次都抓新的）、`"ReCache"`（刷新快取）。
- **幾個硬規矩**：key 比對的是 view 的**第一個排序欄**（未必是第 1 欄，但那欄一定要排序）、只能**相等比對**（不能用大於小於）、大小寫不分但空格標點要精準、**回傳上限 64KB**。
- **有些地方不能用**：官方明講「This function does not work in column or selection formulas, or in mail agents」。

---

## @DbColumn：抓一整欄

最典型的用途是「用另一個 view 的某一欄，餵一個關鍵字欄位的選項」。語法：

```
@DbColumn(""; ""; "Customers"; 1)
```

拆開看：

- **`class:cache`**——第一段。`class` 傳 `""` 或 `"Notes"`（給 Domino 資料庫用）；`cache` 傳 `""`（快取）、`"NoCache"` 或 `"ReCache"`。上面例子兩個都空，等於「Notes 資料庫、用快取」。
- **`server:database`**——目標庫。`""` 是當前庫；`"":"NAMES.NSF"` 是本機某個庫；`"SERVER":"DB.NSF"` 是某台 server 上的庫；也可以直接給**抄本 ID**（`"85255CEB:0032AC04"`）指定任一抄本。
- **`view`**——view 名（要跟 View 屬性裡的名字一致，同義字也可以）。
- **`columnNumber`**——第幾欄，只數「非常數、非特殊函式」的欄。

回來的是那一欄的所有值，組成一個 list。官方對回傳的定義很直接：「The values found in the view column that you indicated.」

## @DbLookup：按 key 找

`@DbColumn` 是「整欄倒出來」，`@DbLookup` 則是「拿一個 key 去比對、只要對上的那些值」。語法多了 `key` 和「要回傳什麼」：

```
@DbLookup(""; ""; "ProductsByCode"; ProductCode; "ProductName")
```

- **`key`**——拿去比對 view **第一個排序欄**的值。以上例是用文件裡的 `ProductCode` 欄去 `ProductsByCode` 這個 view 找。
- **`fieldName` 或 `columnNumber`**——找到之後要回什麼：給**欄位名**回那份文件的**儲存欄位值**，給**欄號**回**顯示欄的值**。

還有三個常用的 keyword：

- **`[FAILSILENT]`**：找不到時回 `""`，而不是丟錯。
- **`[PARTIALMATCH]`**：用開頭字元比對，不必完全相等。
- **`[RETURNDOCUMENTUNIQUEID]`**：回符合文件的 UNID，而不是欄位／欄值。

## cache：三種模式

那個 `cache` 參數，實務上很有感：

- **`""`（快取）**：官方說它「caches the results of the lookup…reuses that data until you specify 'ReCache'」——同一個 session 內重複查同樣的東西，直接吃快取、不再回資料庫。快，但你在別處改了來源資料，這裡不會馬上反映。
- **`"ReCache"`**：強制用最新資料刷新快取。來源會變、又想要即時的，用這個。
- **`"NoCache"`**：每次都回資料庫拿，官方說「no cache is used」。最即時，但最慢。

## 那幾個一定要知道的規矩

`@DbLookup`／`@DbColumn` 好用，但有一組[硬限制](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html)，踩到了會很困惑：

- **要查的欄必須排序**：`@DbLookup` 是拿 key 去比對 view 的**第一個排序欄**，那欄沒排序就查不了。
- **只能相等比對**：不能像 SQL 那樣 `>`、`<`、`like`；大小寫不分，但空格與標點要精準對上。
- **找不到會丟錯**：沒對上時回的是錯誤「Entry not found in index」，要用 `@IsError` 或 `@IfError` 接住（或直接加 `[FAILSILENT]`）。這個系列最後一篇會專講錯誤處理。
- **回傳上限 64KB**：兩個函式都受限。`@DbColumn` 官方寫死「@DbColumn can return no more than 64K bytes of data.」；資料一多就會截斷或出錯。這個坑站上有專篇 [@DbLookup／@DbColumn 的 64K 快取上限](/domino-news/posts/dblookup-cache-64k) 深入談過，這裡不重複。
- **有些地方根本不能用**：官方明講「This function does not work in column or selection formulas, or in mail agents.」——別在 view 的欄公式、選取公式、或 mail agent 裡用它們。
- **拿不到 rich text**：`@DbLookup` 不能回 rich text 欄位。

## 兩個怎麼選

- **要一整欄**（關鍵字清單、下拉選單、把某欄所有值列出來）→ `@DbColumn`。
- **拿一個 key 找對應值**（代碼換標籤、拉關聯文件的一個欄位）→ `@DbLookup`。

一句話記：`@DbColumn` 是「倒出一整欄」，`@DbLookup` 是「按 key 對一個」。兩個都記得 view 要有排序欄、都吃 64KB 上限、也都要想清楚 cache 要不要即時。這兩個主力顧好，formula 讀跨 view／跨庫資料的需求就解掉大半。

下一篇進到 formula 意外強大的一面：**把它當成一個函數式的清單語言**——`@Transform`、`@Explode`／`@Implode`、`@Unique`、`@Sort` 怎麼在一行裡處理整串資料。
