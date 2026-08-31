---
title: "Formula 的錯誤處理與求值：@IfError、@Eval，以及公式在哪裡跑很重要"
description: "系列收尾。前六篇講 formula 能做什麼；這篇講兩件不管你寫什麼都會遇到的事：公式出錯時怎麼辦，以及公式到底在哪裡、什麼時候跑。錯誤用 @IfError 接住、給備援值，@IsError 判斷是不是錯誤——但別忘了 @IfError 會把真正的錯誤訊息藏起來、debug 時要先拿掉。@Eval 能在執行期把字串當公式跑。而「公式跑在哪個情境」正是整個系列一堆坑（@DbLookup 不能用在欄公式…）的根源。Formula @function 系列第七篇（完結）。"
pubDate: 2026-08-31T07:30:00+08:00
lang: zh-TW
slug: formula-errors-evaluation
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@IfError — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IFERROR_FUNCTION.html"
  - title: "@Eval — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVAL.html"
  - title: "Where to use scripts and formulas — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHERE_TO_USE_SCRIPTS_AND_FORMULAS.html"
---

這是 Formula @function 系列的最後一篇。前六篇講 formula **能做什麼**——[讀資料](/domino-news/posts/formula-dblookup-dbcolumn)、[清單處理](/domino-news/posts/formula-list-processing)、[文字](/domino-news/posts/formula-text-functions)、[名稱](/domino-news/posts/formula-name-functions)、[日期](/domino-news/posts/formula-date-time)、[控制流](/domino-news/posts/formula-control-flow)。這一篇講兩件不管你寫什麼都會遇到的事：**公式出錯時怎麼辦**，以及**公式到底在哪裡、什麼時候跑**。

---

## 重點摘要

- **`@IfError` 接住錯誤**：`@IfError(算式; 出錯時的備援)`——算式出錯就回備援值（沒給備援就回 `""`）。
- **`@IsError` 判斷是不是錯誤**：官方說它「Returns 1 (True) if the value is an @ERROR value」。
- **debug 陷阱**：`@IfError` 會把**真正的錯誤訊息藏起來**——查問題時先把它拿掉。
- **`@Eval` 動態求值**：在執行期把一段**字串當公式**跑。
- **情境很重要**：一條公式跑在欄位、view 欄、選取公式、agent、還是按鈕，行為與能用的函式都不同——這正是整個系列一堆坑的根源。

---

## 接住錯誤：@IfError 與 @IsError

整個系列你已經撞過幾個「會回錯誤」的地方——最典型的是[第一篇](/domino-news/posts/formula-dblookup-dbcolumn)的 `@DbLookup`：找不到 key 時回的不是空值，是錯誤「Entry not found in index」。這種錯誤如果不接，會一路往外傳、整條公式失敗。

接住它最直接的是 **[`@IfError`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IFERROR_FUNCTION.html)**。官方定義：「Returns a null string ("") or the value of an alternative statement if a statement returns an error.」

```
@IfError(@DbLookup(""; ""; "ProductsByCode"; Code; "Name"); "（查無此代碼）")
```

第一段正常就回它的值；出錯就回第二段的備援。沒給第二段，出錯就回 `""`。

要**判斷**一個值是不是錯誤（而不是直接替換），用 **`@IsError`**——官方說它「Returns 1 (True) if the value is an @ERROR value, returns 0 (False) if not an error.」搭 `@If` 可以做更明確的分流：

```
result := @DbLookup(...);
@If(@IsError(result); "查無"; result)
```

**一個很重要的 debug 提醒**：`@IfError` 好用，但它會把**真正的錯誤訊息吃掉**、換成你的備援值。所以當你在查「為什麼這條公式怪怪的」時，**先把 `@IfError` 拿掉**、讓真正的錯誤浮出來，修好再包回去。錯誤處理不該變成錯誤隱藏。

## @Eval：把字串當公式跑

有時公式邏輯本身要**動態產生**——存在欄位裡、或組出來的一段字串，想在執行期把它當公式算。那就是 **[`@Eval`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EVAL.html)**。文字用 `{}` 或 `""` 包起來、多段用 `+` 串，回**最後一個運算式**的值：

```
x := "re";
@Eval({x + "bar"})     → "rebar"
```

它適合在 **agent、按鈕**這種地方跑動態邏輯。但**別在 view 欄公式、選取公式裡用**——view 引擎沒辦法預先分析一段「執行期才知道長怎樣」的公式，結果不可預期。

## 公式跑在哪裡，很重要

這是把整個系列串起來的一個觀念。你可能已經注意到，前面好幾個函式都附帶一句「**不能用在 column 或 selection 公式，也不能用在 mail agent**」——`@DbLookup`、`@DbColumn` 是、`@Eval` 也是。這不是隨機的限制，而是因為**一條公式跑在哪個情境，決定了它能做什麼、什麼時候被求值**。

[官方對 formula 的定位](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHERE_TO_USE_SCRIPTS_AND_FORMULAS.html)是：「Formulas are expressions that have program-like attributes」、最適合「working within the object that the user is currently processing」——回一個欄位預設值、決定一個 view 的選取條件。而不同情境的求值時機差很多：

- **欄位公式**：求值時機[依欄位型別而定](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABOUT_EDITABLE_AND_COMPUTED_FIELDS.html)——Computed 在建立／存檔／重整時算、Computed for display 在開啟／存檔時算、Computed when composed 只在文件建立時算一次。
- **view 欄公式／選取公式**：view 建索引時對每份文件求值——所以這裡**不能**放會回外部資料、或執行期才定的東西（`@DbLookup`、`@Now`、`@Eval`），否則不是拖垮效能就是結果不穩。
- **agent／按鈕**：由觸發驅動，能做副作用（`@Command`、`@Prompt`、`@Eval` 動態邏輯）。
- **hide-when 公式**：控制元素顯不顯示，隨顯示情境求值。

看到一個函式「在這裡沒作用」或「結果怪怪的」，先問一句：**這條公式是在什麼情境跑的?** 十之八九答案就在那裡。

## 系列回顧

七篇走完，formula 從一個「填欄位的小算式」變成一個你能認真用的語言：

1. [讀跨庫資料](/domino-news/posts/formula-dblookup-dbcolumn)：`@DbColumn`／`@DbLookup`。
2. [清單處理](/domino-news/posts/formula-list-processing)：把它當函數式清單語言，`@Transform` 當 map。
3. [文字](/domino-news/posts/formula-text-functions)：`@Left`／`@Middle`／`@Word`／`@ReplaceSubstring`。
4. [名稱](/domino-news/posts/formula-name-functions)：`@Name` 三格式互轉。
5. [日期](/domino-news/posts/formula-date-time)：`@Adjust`、相減拿秒差。
6. [控制流](/domino-news/posts/formula-control-flow)：暫存變數 `:=`、`@If` 當 switch。
7. 錯誤與求值（本篇）：`@IfError`、`@Eval`、情境決定行為。

formula 不是要取代 LotusScript／Java，但在「填欄位、算 view、做快速邏輯」這些地方，它常常是最短、最貼近 Domino 的那條路。系列完結。
