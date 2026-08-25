---
title: "Formula 控制流與變數：暫存變數 :=、@If、@Do、@For/@While"
description: "一條真正的公式會分支、會存中間值、偶爾要迴圈。這篇講怎麼把公式結構化：暫存變數 x := ... 是現代寫法的骨幹（分號分隔、最後一句是回傳值）；@If 可以串到 99 組條件／動作、就是 formula 的 switch；@Do 依序求值回最後一個；真正的迴圈 @For／@While／@DoWhile 存在，但因為 formula 是清單導向的，多數時候根本用不到。Formula @function 系列第六篇。"
pubDate: 2026-08-30T07:30:00+08:00
lang: zh-TW
slug: formula-control-flow
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@If — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IF.html"
  - title: "@Do — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DO.html"
  - title: "@For — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html"
---

一條簡單的公式就是一個運算式。但真正在用的公式會**分支**（依條件走不同路）、會**存中間值**（算一次、用多次）、偶爾還要**迴圈**。這篇講把公式結構化的幾個工具，以及一個從別的語言過來會覺得反直覺的事實：**在 formula 裡，迴圈其實很少用到。**

---

## 重點摘要

- **暫存變數 `x := ...` 是骨幹**：`a := ...; b := ...; 結果`——用分號分隔多個敘述，**最後一句是整條公式的回傳值**。算一次存起來、避免重算，也讓公式好讀。
- **[`@If`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IF.html) 是 formula 的 switch**：可以串**最多 99 組**條件／動作，最後接一個 else。第一個成立的就執行、其餘略過。
- **`@Do` 依序求值**：`@Do(...)` 從左到右算、回**最後一個**的值。
- **迴圈存在但少用**：`@For`／`@While`／`@DoWhile` 是真正的迴圈——但 formula 是[清單導向](/domino-news/posts/formula-list-processing)的，多數「對每個值做事」直接對整串寫就好，用不到迴圈。

---

## 暫存變數：`:=` 是現代寫法的骨幹

先講最該養成的習慣。一條公式可以由**多個以分號分隔的敘述**組成，而**最後一個敘述的值，就是整條公式的結果**。中間的敘述常常是用 `:=` 把算好的東西存進暫存變數：

```
subtotal := Price * Qty;
tax := subtotal * 0.05;
subtotal + tax
```

三句：算小計、算稅、回傳總和。好處有二——**算一次存起來**（`subtotal` 不必重算兩遍）、以及**好讀**（每一步有名字）。這也是為什麼你很少需要 `@Set`：直接 `:=` 更直覺。

（一個容易混的點：分號在**最外層**是「敘述分隔」，在 `@If(...)`、`@Do(...)` 的**括號內**是「參數分隔」。同一個符號、兩種角色。）

## @If：formula 的 switch

`@If` 不是只能「一個條件、真怎樣、假怎樣」。它可以串很多組：

```
@If(cond1; action1; cond2; action2; ...; elseAction)
```

官方說得很清楚：「You can list up to 99 conditions and corresponding actions, followed by just one action to be performed when all the conditions are False.」——**最多 99 組**條件／動作，最後一個是全部不成立時的 else。而且它是**短路**的：「As soon as a condition evaluates to True, Notes/Domino performs the associated action and ignores the remainder of the @If statement.」第一個成立的就做、後面不看。

官方範例就是一個三路分支：

```
@If(CostOfGoods > 12.45; "Over Budget";
    CostOfGoods < 12.45; "Bill of Materials OK";
    "Estimate Right on Target")
```

這其實就是別的語言的 `switch`／`else if` 鏈——別為了它硬套巢狀 `@If`。

## @Do：把幾件事串成一個運算式

有時你需要「依序做幾件事、然後回最後一個結果」——尤其在按鈕、agent 裡。那就是 [`@Do`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DO.html)。官方定義：「Evaluates expressions from left to right, and returns the value of the last expression in the list.」

不過在**算值**的情境，暫存變數 `:=` 通常比深巢狀的 `@Do` 更清楚；`@Do` 留給「按一下按鈕、依序跑幾個 `@Command`／`@Prompt`」這種副作用序列比較合適。

## 迴圈：存在，但你多半用不到

formula 有真正的迴圈——[`@For`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html)、`@While`、`@DoWhile`。`@For` 的官方定義：「Executes one or more statements iteratively while a condition remains true.」語法跟別的語言的 for 幾乎一樣：

```
@For(n := 1;
     n <= @Elements(Categories);
     n := n + 1;
     @Prompt([OK]; "Category " + @Text(n); Categories[n]))
```

初始化、條件、遞增、主體——`@While` 是先判斷再跑、`@DoWhile` 是先跑再判斷。

但關鍵是：**你多半用不到它們。** 上一篇 [清單處理](/domino-news/posts/formula-list-processing) 講過，formula 是清單導向的——「對每個值做同一件事」直接對整串寫（隱式 map、或 `@Transform`）就好，不必迴圈。真正需要 `@For`／`@While` 的，通常是**要累積狀態**、或**要對每個元素做副作用**（像上面對每個 category 跳一個 prompt）這種少數情況。看到自己想在 formula 裡寫迴圈時，先問一句：這能不能用整串運算或 `@Transform` 解掉？

## 該用哪個

- **存中間值、串幾步** → 暫存變數 `:=`（最後一句是結果）。
- **多路分支** → `@If`（多組條件，當 switch 用）。
- **按鈕／agent 裡依序做幾件事** → `@Do`。
- **真的要迭代、累積或逐元素副作用** → `@For`／`@While`——但先確認不能用清單運算解掉。

下一篇是系列收尾：**錯誤處理與求值**——`@IsError`／`@IfError` 怎麼接住錯誤、`@Eval` 動態求值、以及公式在不同地方（欄位、view 欄、agent）求值時機的差別。
