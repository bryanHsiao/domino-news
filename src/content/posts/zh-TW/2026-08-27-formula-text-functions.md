---
title: "Formula 字串處理：@Left/@Right/@Middle、@Word、@ReplaceSubstring"
description: "在 formula 裡切字串，很多人只知道 @Left(s; 3) 這種數字元版本——但 @Left／@Right／@Middle 同時也吃「分隔字串」：@Left(email; \"@\") 就是取 @ 之前的全部。@Middle 更是有四種簽章，「取 X 和 Y 之間」一行就成。這篇把 formula 的字串工具講清楚：@Middle 的四形態、@Left/@Right 的雙形態、@Word 按分隔取第 n 個（-1 取最後、抓姓氏）、@ReplaceSubstring 平行清單多重取代。Formula @function 系列第三篇。"
pubDate: 2026-08-27T07:30:00+08:00
lang: zh-TW
slug: formula-text-functions
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Middle — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIDDLE.html"
  - title: "@Word — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORD.html"
  - title: "@ReplaceSubstring — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACESUBSTRING.html"
---

在 formula 裡對字串動刀——切一段出來、抓某個字、找了替換——就是幾個 @function 的事。但有一個很多人不知道的重點先講：**`@Left`／`@Right`／`@Middle` 不只吃「字元數」，也吃「分隔字串」。**

`@Left(subject; 10)` 是取前 10 個字元；但 `@Left(email; "@")` 是取 **`@` 之前的全部**——同一個函式，第二個參數給數字是「數幾個」，給字串是「切到哪」。認得這個雙形態，很多字串處理會突然變簡單。

（接續[上一篇](/domino-news/posts/formula-list-processing)——這些函式跟清單處理一樣，套在多值欄位上會逐元素跑。）

---

## 重點摘要

- **`@Left`／`@Right` 雙形態**：`@Left(s; 3)` 取前 3 字元；`@Left(s; "@")` 取 `@` 之前的全部。`@Right` 對稱（從右邊）。
- **[`@Middle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIDDLE.html) 四形態**：起點（offset 或 startString）× 長度（numberchars 或 endstring）四種組合。「取 X 和 Y 之間」= `@Middle(s; "X"; "Y")`。
- **[`@Word`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORD.html) 按分隔取第 n 個**：`@Word(s; " "; 2)` 取第二個字；**`-1` 取最後一個**（抓姓氏很好用）。
- **[`@ReplaceSubstring`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACESUBSTRING.html) 找替換**：`@ReplaceSubstring(s; from; to)`，**大小寫敏感**，`from`／`to` 可以是平行清單一次換多組。
- 其餘：`@Text`（轉文字）、`@UpperCase`／`@LowerCase`／`@ProperCase`、`@Length`、`@Contains`／`@Begins`／`@Ends`。

---

## @Middle：最萬用的擷取

`@Middle` 是這組裡最靈活的，官方給了**四種簽章**——起點與終點各有兩種寫法：

| 起點 | 長度／終點 | 語法 |
|---|---|---|
| offset（數字位置） | numberchars | `@Middle(string; offset; numberchars)` |
| offset | endstring（分隔字串） | `@Middle(string; offset; endstring)` |
| startString（分隔字串） | endstring | `@Middle(string; startString; endstring)` |
| startString | numberchars | `@Middle(string; startString; numberchars)` |

官方的範例最好懂：

- `@Middle("North Carolina"; 4; 3)` → `"h C"`（位置 4 之後取 3 個字元）。
- `@Middle("North Carolina"; " "; 3)` → `"Car"`（**空格之後**取 3 個字元）。
- `@Middle("This is the text"; 4; "text")` → `" is the "`（位置 4 到 `"text"` 之間的全部）。

第三種（`startString` + `endstring`）最好用——**「取兩個標記之間的東西」一行就成**，像從 `<tag>value</tag>` 裡挖出 `value`。`numberchars` 給負數則是**從起點往左**數。

## @Left／@Right：同樣的雙形態

`@Left`／`@Right` 跟 `@Middle` 一樣，第二個參數可以是**字元數**或**分隔字串**：

- `@Left("2026-08-27"; 4)` → `"2026"`（前 4 個字元）。
- `@Left("user@example.com"; "@")` → `"user"`（`@` 之前的全部）。
- `@Right("user@example.com"; "@")` → `"example.com"`（`@` 之後的全部）。

還有 `@LeftBack`／`@RightBack`——從字串**尾端**往回找那個分隔字串。處理路徑、副檔名、反向切割時很順手。

## @Word：按分隔取第 n 個

要「第幾個以某字元分隔的段」，用 `@Word`。官方對「word」的定義就是：字串裡被指定分隔字元切出來的一段。

```
@Word("Larson, Collins, and Jensen"; " "; 2)   → "Collins,"
```

`number` 給正數從頭數（`0` 等同 `1`）、給**負數從尾端數**，超出範圍回空字串。負數那個特別實用——抓「最後一段」不必管前面有幾段：

```
@Word(@UserName; " "; -1)
```

不管使用者名字有沒有中間名，這都抓到**姓氏**（最後一個以空格分隔的字）。

## @ReplaceSubstring：找與替換

找了替換用 `@ReplaceSubstring(sourceList; fromList; toList)`。官方一句話：「Replaces specific words or phrases in a string with new words or phrases that you specify. Case sensitive.」——注意**大小寫敏感**。

好用的是 `from`／`to` 可以是**平行清單**，一次換多組：

```
@ReplaceSubstring("I like apples"; "like" : "apples"; "hate" : "peaches")
→ "I hate peaches"
```

`"like"→"hate"`、`"apples"→"peaches"` 一起換掉。要注意替換是**依序**進行的——每一組是在前一組替換的結果上再掃，所以順序有時會有影響。

## 其他常用字串函式

湊齊一套：

- **`@Text`**：把數字／日期轉成文字（可帶格式碼）。
- **`@UpperCase`／`@LowerCase`／`@ProperCase`**：大小寫轉換。
- **`@Length`**：字串長度。
- **`@Contains`／`@Begins`／`@Ends`**：判斷包含／開頭／結尾（回 `@True`／`@False`）。

一句話收：切一段用 `@Left`／`@Right`／`@Middle`（記得它們吃分隔字串）、抓一段用 `@Word`（`-1` 抓尾）、換字用 `@ReplaceSubstring`（大小寫敏感、可平行）。

下一篇轉到一個很常見的具體需求：**在 formula 裡處理 Notes 名稱**——`@Name` 的 `[CN]`／`[Abbreviate]`／`[Canonicalize]` 怎麼把三種名稱格式互轉。
