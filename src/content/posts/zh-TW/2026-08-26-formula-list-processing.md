---
title: "在 formula 裡處理一串值，為什麼幾乎不用寫迴圈？"
description: "從 LotusScript／Java 過來，你會想用迴圈處理一串值。但 formula 幾乎沒有迴圈——因為一條公式本來就是對「整串 list」一次作用的。這篇把 formula 當成函數式清單語言來看：套在多值欄位上的運算自動逐元素跑（隱式 map）、@Transform 是明確的 map（還能用 @Nothing 當 filter、回傳 list 當 flatMap）、@Explode／@Implode 切字串接清單、@Sort 排序（含 [CUSTOMSORT] 用 $A/$B 自訂）。原本十行迴圈，常常一行公式就完。Formula @function 系列第二篇。"
pubDate: 2026-08-26T07:30:00+08:00
lang: zh-TW
slug: formula-list-processing
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Transform — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TRANSFORM.html"
  - title: "@Explode — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXPLODE.html"
  - title: "@Sort — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SORT.html"
cover: "/covers/formula-list-processing.webp"
coverStyle: "collage"
---

從 LotusScript 或 Java 過來的人，看到一串值（一個多值欄位、一個 list）的第一個念頭通常是：寫個迴圈跑一遍。但在 formula 裡，你會發現一件反直覺的事——**幾乎沒有迴圈**。不是它不能，而是它根本不太需要：**一條公式，本來就是對「整串 list」一次作用的。**

這篇([上一篇](/domino-news/posts/formula-dblookup-dbcolumn)講怎麼把資料讀進來，這篇講讀進來之後怎麼處理)把 formula 當成一個**函數式的清單語言**來看。換上這個腦袋，很多原本要十行迴圈的事，一行公式就解掉。

---

## 重點摘要

- **隱式 map**：套在多值欄位上的運算會**自動逐元素**跑。`Categories + "!"` 是把每個值都加上 `!`，不是把整串當一個字串。
- **[`@Transform`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TRANSFORM.html) 是明確的 map**：`@Transform(list; "x"; formula)`——對每個元素套一段公式、收成新 list。官方說它「applies a formula to each element of a list and returns the results in a list」。
- **`@Transform` 還能當 filter 和 flatMap**：某次回傳 `@Nothing` 就把那個元素**踢掉**（filter）；回傳一個 list 就把多個值**攤進**結果（flatMap）。
- **`@Explode`／`@Implode` 切與接**：字串 → list、list → 字串。
- **`@Sort` 排序**：`[ASCENDING]`／`[DESCENDING]` 等關鍵字，或 `[CUSTOMSORT]` 用 `$A`／`$B` 自訂比較。

---

## 換腦袋：一條公式作用在整串上

先建立這個最重要的直覺。假設 `Categories` 是一個多值欄位，值是 `"A":"B":"C"`。你寫：

```
Categories + "!"
```

結果**不是** `"ABC!"`，而是 `"A!":"B!":"C!"`——formula 把運算**逐元素**套到整串上了。兩個等長的 list 相加也是配對進行：`("A":"B") + ("1":"2")` 得到 `"A1":"B2"`。

這就是為什麼 formula 很少需要迴圈：大部分「對每個值做同一件事」的需求，直接對整串寫一次就好。

## @Transform：明確的 map（外加 filter 與 flatMap）

當「對每個值做的事」複雜到不能只靠算符，就用 `@Transform`。它是 formula 的 **map**：

```
@Transform(Categories; "x"; @UpperCase(x))
```

`"x"` 是每次迭代代表當前元素的變數名，第三段是對它套的公式。官方的範例示範得很好——替沒有星號開頭的元素加上星號：

```
@Transform(original; "var"; @If(@Begins(var; "*"); var; "*" + var))
```

`@Transform` 真正好玩的是它**一個函式吃下三種操作**：

- **map**：如上，每個元素換成新值。
- **filter**：某次迭代回傳 **`@Nothing`**，那個元素就**不進**結果。想留下符合條件的值，就 `@If(條件; x; @Nothing)`。
- **flatMap**：某次迭代**回傳一個 list**，那幾個值會**攤平**進結果。

（一個小提醒：迭代中若某次回傳錯誤，`@Transform` 會把錯誤往外傳。）

## @Explode／@Implode：字串與清單互切

資料常常是「一段用逗號分隔的字串」和「一個 list」之間來回。這對函式就是做這個的：

- **[`@Explode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXPLODE.html)**：把字串切成 list。預設分隔字元是空格、逗號、分號（`" ,;"`）；換行永遠算分隔（除非把 `newlineAsSeparator` 設 False）。`@Explode("a,b,c")` 得到 `"a":"b":"c"`。
- **`@Implode`**：反過來，把 list 接回字串——官方說它「Concatenates all members of a text list and returns a text string」。

兩個常常一起用，做「換分隔符」這種事：

```
@Implode(@Explode(entry; "&"); "+")
```

先用 `&` 切開、再用 `+` 接回——一行就把分隔符換掉了。

## @Sort：排序，含自訂比較

[`@Sort`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SORT.html) 把一串值排序。預設是「ascending, case-sensitive, accent-sensitive, pitch-sensitive」，可以用關鍵字調：

```
@Sort(names; [DESCENDING])
```

除了 `[ASCENDING]`／`[DESCENDING]`，還有 `[CASEINSENSITIVE]`、`[ACCENTINSENSITIVE]` 等。要更彈性的排序邏輯，用 `[CUSTOMSORT]`——官方說它讓你「a formula that uses the temporary variables $A and $B to compare the values of elements in the list two at a time」：拿 `$A`、`$B` 兩兩比，`$A > $B` 時回 `@True` 或正數。

## 其他常用的清單工具

湊齊一套：

- **`@Unique`**：去重，回傳沒有重複值的 list。
- **`@Elements`**：數這串有幾個元素。
- **`@Trim`**：把每個元素前後與多餘的空白去掉，並順帶移除整個是空白的元素。
- **`@Subset`／`@Member`／`@IsMember`**：取子集、取第 n 個、判斷某值在不在。

## 一個組合的例子

把「拿一串以逗號分隔的標籤、去空白、去重、排序、每個加前綴」串起來——完全沒有迴圈：

```
tags := @Explode(RawTags; ",");
clean := @Unique(@Trim(tags));
@Sort(@Transform(clean; "t"; "#" + t))
```

三行，做完了在別的語言要一個 for 迴圈加幾個暫存變數的事。這就是 formula 當清單語言的威力。

下一篇轉到**文字處理**——`@Left`／`@Right`／`@Middle`／`@Word`／`@ReplaceSubstring`／`@Text`，在 formula 裡對字串動刀。
