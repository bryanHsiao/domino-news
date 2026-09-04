---
title: "Formula 的 @For 迴圈：什麼時候該用它，以及一個「反轉組織階層」的實例"
description: "上一批清單函式（@Transform、@Explode…）能一行處理整串，但有些事還是得用真正的迴圈——累積狀態、依順序組字串、反轉一個 list。這篇深入 @For：四個部位（初始化／條件／遞增／主體）、一個很多人會愣的重點（@For 回傳的是 1 而不是你累積的值，所以要另起一行回傳變數），並用一個真實需求走一遍——把 A\\B\\C 的組織階層反過來顯示成 C\\B\\A。順帶講 @While／@DoWhile 的差別，以及無限迴圈保護。"
pubDate: 2026-09-01T07:30:00+08:00
lang: zh-TW
slug: formula-for-loop
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@For — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html"
  - title: "@While — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHILE_FUNCTION.html"
  - title: "@DoWhile — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOWHILE_FUNCTION.html"
  - title: "Server Tasks - Agent Manager tab（Max LotusScript/Java execution time）— HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/othr_servertasksagentmanagertab_r.html"
  - title: "Running Web agents（Web agent time-out）— HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/tune_runningwebagents_t.html"
cover: "/covers/formula-for-loop.webp"
coverStyle: "watercolor"
---

[清單處理那篇](/domino-news/posts/formula-list-processing)講過，formula 大部分「對每個值做同一件事」的需求，一行就解掉、不必迴圈；[控制流那篇](/domino-news/posts/formula-control-flow)也說了「迴圈存在但少用」。這篇補上另一半：**當你真的需要迴圈的時候，`@For` 怎麼用、什麼情況它才是對的工具。**

用一個很具體的真實需求開場——組織階層存的是 `A\B\C`（總公司\部門\組），要在畫面上**反過來顯示成 `C\B\A`**。這種「反轉一個 list」正好是 formula 清單函式沒有一行內建、而 `@For` 很自然的情況。

---

## 重點摘要

- **[`@For`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FOR_FUNCTION.html) 四個部位**：`@For(初始化; 條件; 遞增; 主體...)`——跟別的語言的 for 一樣。整個 `@For` 最多 252 句。
- **一個會愣的重點**：`@For` **回傳的是 `1`（True），不是你在迴圈裡累積的值**。所以標準寫法是：迴圈裡把結果堆進一個變數、迴圈結束後**另起一行單獨回傳那個變數**。
- **累積器模式**：`result := ""` 起頭，迴圈裡一步步把值堆進 `result`，最後回 `result`。
- **`@While`／`@DoWhile` 差在測試時機**：`@While` 先測條件再跑（可能一次都不跑）、`@DoWhile` 先跑再測（至少跑一次）。
- **無限迴圈有保護**：超過標準逾時，formula 引擎會中止。

---

## @For 的四個部位

官方定義：「executes one or more statements iteratively while a condition remains true」——語法四段，跟別的語言的 for 幾乎一樣：

```
@For(
    n := 1;                    /* 初始化：給計數變數一個起始值 */
    n <= @Elements(A);         /* 條件：回 True(1)/False(0)，True 才繼續 */
    n := n + 1;                /* 遞增：每跑完一輪改一次計數變數 */
    ... 主體 ...               /* 主體：要重複做的事（整個 @For 上限 252 句）*/
)
```

執行順序:初始化跑一次 → 檢查條件 → 條件為真就跑主體 → 跑遞增 → 再檢查條件……直到條件為假。

## 最容易愣的一點:@For 不回傳你的結果

這是從別的語言過來、或第一次寫 `@For` 的人最容易卡的地方:**`@For` 本身回傳的是 `1`(True)**——官方寫明它 return「True (1) unless an error occurs」。它**不會**把你在迴圈裡算出來的東西當結果回傳。

所以你不能寫 `x := @For(...)` 期待 `x` 是累積結果。正確的模式是**累積器**:在迴圈**外**開一個變數,迴圈裡把值堆進去,**迴圈跑完後另起一行、單獨把那個變數當最後一句**——formula 的回傳值是最後一個運算式。

```
result := "";
@For(...  result := result + something  ...);   /* 這行回傳 1,不管它 */
result                                            /* 這才是真正回傳的值 */
```

## 實例:反轉組織階層 A\B\C → C\B\A

把上面串起來。需求:`DeptFullCName` 是 `總公司\部門\組` 這種 `\` 分隔的路徑,要反過來顯示。

```
A := @Explode(DeptFullCName; "\\");     /* 切成 list:總公司 : 部門 : 組 */
result := "";                           /* 累積器,先初始化(別依賴未賦值變數) */
@For(n := 1; n <= @Elements(A); n := n + 1;
     @If(result = "";
         result := A[n];                /* 第一個:直接放 */
         result := A[n] + "\\" + result /* 之後:把新的接在「前面」 */
     )
);
result
```

（`\\` 在 formula 字串裡代表一個反斜線 `\`。）關鍵在最後那句 `A[n] + "\\" + result`——每一輪都把當前元素接在 `result` 的**前面**,所以正著跑一遍,順序就翻過來了:

| n | A[n] | result 變成 |
|---|---|---|
| 1 | 總公司 | `總公司` |
| 2 | 部門 | `部門\總公司` |
| 3 | 組 | `組\部門\總公司` |

最後 `result` = `組\部門\總公司`,正是要的反轉。這就是 `@For` 的典型場景:**要依順序、把每一步的結果累積成下一步的輸入**——這種「有狀態、後面依賴前面」的事,清單函式的一次性 map 表達不出來,迴圈才是對的工具。

（岔題:反轉在 formula 沒有一行內建的 `@Reverse`,硬要一行也有招——用 `@Transform` 配 `@Member` 換到鏡像位置——但那招在**各層名稱重複時會壞**。組織路徑通常不重名,但不保證;所以這個 `@For` 版反而是**最穩、最好讀**的寫法,不必為了「一行」冒風險。)

## 什麼時候該用 @For（而不是清單函式）

判斷很簡單，回到[清單處理那篇](/domino-news/posts/formula-list-processing)的原則——**先問「這能不能對整串一次算完」**：

- **能**（對每個值做同一件、彼此獨立的事）→ 用整串運算或 `@Transform`，不要迴圈。
- **不能**，因為：
  - **要累積狀態**（跑總和、把每步結果餵給下一步、像上面反轉這種）
  - **後一個元素依賴前一個的結果**
  - **要在中途依條件提早停**

  → 這才是 `@For`／`@While` 上場的時候。

換句話說：迴圈不是「不好」，而是「大部分時候有更短的寫法」。真正需要順序累積的少數場景，`@For` 清楚又穩，別為了炫一行而繞。

## @While 與 @DoWhile

`@For` 的兩個近親，差別只在**什麼時候測條件**：

- **[`@While`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WHILE_FUNCTION.html)**：**先測條件、再跑**主體——條件一開始就假，主體**一次都不跑**。
- **[`@DoWhile`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOWHILE_FUNCTION.html)**：**先跑、再測條件**——所以主體**至少跑一次**。

`@For` 其實就是「初始化 + `@While`」的包裝：把計數與遞增收進語法裡。你自己管計數變數時，`@While` 也能寫出一樣的迴圈：

```
n := 1;
@While(n <= @Elements(A);
    ... 主體 ...;
    n := n + 1)
```

## 一個保護：無限迴圈不會卡死 server

最後一個安心的點：就算你的條件寫錯、變成無窮迴圈，也不會把 server 拖垮。官方 `@For` 文件的原文是：「The formula engine exits a formula or breaks an infinite loop if the time spent performing the iterations exceeds the standard timeout value allowed for an operation.」——跑迭代的時間一旦超過「該操作的標準逾時值」，formula 引擎就中止公式、打斷無限迴圈。

那個「標準逾時值」是多少、能不能獨立設定？官方這句刻意講得通用，因為它取決於**包住這段公式的操作**——實務上就是外層 agent 的執行時間上限，而那設定在 **Server 文件**（不是 notes.ini）：

- **背景／排程 agent**：Server 文件 → Server Tasks → Agent Manager 分頁的 [`Max LotusScript/Java execution time`](https://help.hcl-software.com/domino/14.5.1/admin/othr_servertasksagentmanagertab_r.html)，預設**日間 10 分鐘／夜間 15 分鐘**；官方寫「If the agent exceeds this maximum, the agent doesn't finish, and the Agent Log records the termination.」——超過就中止、記進 Agent Log。
- **Web agent**：Server 文件 → Internet Protocols → Domino Web Engine 分頁的 [`Web agent time-out`](https://help.hcl-software.com/domino/14.5.1/admin/tune_runningwebagents_t.html)，單位是秒、預設 **0（不逾時）**。

`AMgr_*` 那組 notes.ini 控的是排程間隔、不是執行時間上限，所以要調得改 Server 文件那個欄位，而不是加 ini。要老實提醒的是：HCL 並沒有逐字把 @For 這句的「standard timeout value」綁到上面那個欄位，但那就是實務上「包住 @For 的操作」會被砍的地方。這終究是保護網、不是讓你偷懶的理由——條件與遞增還是要寫對。

## 小結

`@For` 是「真的需要順序累積」時的工具：四段語法（初始化／條件／遞增／主體）、**回傳的是 1 而非你的結果**（所以用累積器變數 + 最後一行回傳它）、`@While` 先測、`@DoWhile` 後測。大部分清單需求用整串運算或 `@Transform` 更短；但像「反轉組織階層」這種有狀態、有順序的事，`@For` 才是最清楚也最穩的答案。
