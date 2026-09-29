---
title: "@Command vs @PostedCommand：為什麼你的公式沒照順序跑"
description: "你在按鈕公式裡先算欄位、再叫一個 @Command 執行 UI 動作，結果動作先跑、算式後跑，順序全亂。原因是：@Command 大致照你寫的順序跑，但 @PostedCommand 一律排到「所有 @function 都跑完」之後才執行——寫在最前面的 @PostedCommand 反而最後動。更坑的是，有些 @Command 本身就被延後（行為像 @PostedCommand）。這篇用官方的執行順序規則講清楚兩者差別、哪些 @Command 天生 deferred，以及什麼時候該用哪個。"
pubDate: 2026-09-29T07:30:00+08:00
lang: zh-TW
slug: formula-command-postedcommand
tags:
  - "Formula"
  - "Notes UI"
sources:
  - title: "Working with @commands — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WORKING_WITH_COMMANDS.html"
  - title: "Order of evaluation for formula statements — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html"
  - title: "@Command (Formula Language) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html"
relatedJava: []
relatedSsjs: []
---

你在按鈕公式裡想「先把欄位算好、再叫 UI 執行一個動作」，寫下來卻發現:動作先跑了、你的算式後跑，順序整個顛倒。或者你把一個 `@PostedCommand` 放在公式最上面，它偏偏最後才動。

這不是 bug,是 Formula 的執行順序規則——`@Command` 跟 `@PostedCommand` 的**時機不一樣**,而且有些 `@Command` 本身就被延後。搞不清楚這條,UI 動作的先後就會不如預期。

---

## 重點摘要

- **基本規則**:Domino 從上到下、左到右評估公式,做完一句才做下一句——**但 `@PostedCommand` 和少數 `@Command` 是例外**,它們排到所有 @function 都跑完之後才執行。
- **`@Command`**:大致「依序執行」(with some exceptions)。
- **`@PostedCommand`**:一律**排到最後**、彼此之間照順序跑。所以寫在公式最前面的 `@PostedCommand`,反而**最後**才動——官方說這是在「模擬 R3 時代 @Command 的行為」。
- **有些 `@Command` 天生就 deferred**:官方 [@Command 參考頁](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html)有張表把命令分成「Evaluated after all @functions」(如 `EditClear`／`FileExit`／`NavigateNext`)與「Evaluated immediately」(如 `Clear`／`ExitNotes`／`NavNext`)。名字很像、時機不同,別搞混。
- **實務**:要「先算好、再動 UI」→ 動作用 `@PostedCommand`;要「立刻切狀態再繼續往下」→ `@Command`。

## 兩者的執行時機

官方 [Order of evaluation](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html) 把總規則寫得很清楚:

> Domino evaluates formulas from beginning to end and left to right, completing each statement before proceeding to the next, except that @PostedCommand and a few @Command functions are executed in order after all other @functions complete execution.

而 [Working with @commands](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WORKING_WITH_COMMANDS.html) 分別定義兩者:

- **`@Command`**:「@Command functions execute in sequence with other @functions, with some exceptions.」
- **`@PostedCommand`**:「@PostedCommand functions execute in sequence with each other after all other @functions execute.」——並註明「This emulates the behavior of @Command in Notes R3.」

## 「寫在最前面卻最後跑」

`@PostedCommand` 最反直覺的一點:它在原始碼裡的位置**不代表**執行順序。官方的例子:

```
@PostedCommand([CommandName]; Argument);
@If(Condition; TrueStatement; FalseStatement);
FIELD X := "Text"
```

官方對這段的註解是:**「The first statement is executed last.」**——第一句(那個 `@PostedCommand`)最後才執行,因為它要等 `@If`、`FIELD X :=` 這些 @function 全跑完。

對照 `@Command`,同樣寫在前面就先跑:`@Command([EditDocument])` 會在後面的 `@Prompt` **之前**執行;換成 `@PostedCommand([EditDocument])` 就會在 `@Prompt` **之後**。這一前一後,常常就是「文件還沒進編輯模式、prompt 就先跳出來」這種 bug 的根源。

## 有些 @Command 本來就是 deferred

這是最容易被忽略的一層:**不是所有 `@Command` 都「立刻執行」**。[@Command 參考頁](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html)那張表把命令分成兩類——

- **Evaluated after all @functions**(等所有 @function 跑完才執行,行為等同 @PostedCommand):例如 `EditClear`、`FileExit`、`NavigateNext`。
- **Evaluated immediately**(立刻執行):例如 `Clear`、`ExitNotes`、`NavNext`。

注意上面兩兩對照的名字有多像(`FileExit` vs `ExitNotes`、`NavigateNext` vs `NavNext`)。挑錯一個,執行時機就差一整輪。要精準控制順序時,先查你用的那個命令屬於哪一類,別憑名字猜。

## 該用哪個

- **要「先把欄位算好、判斷做完,再執行 UI 動作」** → 動作用 `@PostedCommand`。這樣它保證在你的計算之後才動。
- **要「立刻切換狀態,再接著往下做」**(例如先進編輯模式,再根據模式做別的) → 用 `@Command`,讓它當下就執行。
- **多個動作要有明確先後** → 全部用 `@PostedCommand`,它們之間會照書寫順序跑;混用 `@Command` 與 `@PostedCommand`,順序就會裂成「immediate 的先、posted 的後」兩批。

## 同類別在其他語言

`@Command`／`@PostedCommand` 是 **Formula 語言驅動 Notes 前端 UI** 的機制,沒有直接的 Java／SSJS class 對應:

- **LotusScript**:對應的是 `NotesUIWorkspace` 的方法(`EditDocument`、`ViewRefresh` 等)——直接呼叫、直接執行,沒有 @PostedCommand 那種「排到最後」的語意,順序就是你呼叫的順序。
- **SSJS／XPages**:沒有 `@Command`。前端動作走 XPages 自己的事件與 partial refresh 模型,不是這套 posted／immediate 的排程。
