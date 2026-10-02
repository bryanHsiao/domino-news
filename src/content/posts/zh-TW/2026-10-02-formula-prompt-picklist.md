---
title: "@Prompt 與 @PickList：用 Formula 跳對話框問使用者（只在 client、上不了 web）"
description: "想讓按鈕跳一句「確定要刪嗎？」，或讓使用者從一個 view 裡挑客戶——在 Formula 裡就是 @Prompt 與 @PickList。@Prompt 有一整排樣式（Ok／YesNo／OkCancelList／Password／LocalBrowse…），@PickList 則彈一個 modal 讓你從指定 view 選文件、回傳某欄的值，或從名錄挑人。但同一段公式放到 web、或放進排程 agent，就會默默無效——官方明講「You cannot use this function in Web applications」。這篇整理兩者的樣式與回傳、client-only 的邊界，以及該用哪個。"
pubDate: 2026-10-02T07:30:00+08:00
lang: zh-TW
slug: formula-prompt-picklist
tags:
  - "Formula"
  - "Notes UI"
sources:
  - title: "@Prompt (Formula Language) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PROMPT.html"
  - title: "@PickList (Formula Language) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PICKLIST.html"
  - title: "@Command (Formula Language) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/formula-prompt-picklist.webp"
coverStyle: "paper-craft"
---

你想讓一個按鈕跳出「確定要刪除嗎?」讓使用者按 Yes/No,或彈一個清單讓他從一個 view 裡挑一筆客戶資料——在 Formula 裡,這兩件事分別是 `@Prompt` 和 `@PickList`。

它們很好用,但有一條邊界很多人踩:**這是前端 client 的對話框,放到 web、或放進排程 agent,就默默無效**。官方在兩個函式頁都白紙黑字寫了「You cannot use this function in Web applications」。

這篇整理 `@Prompt` 的各種樣式、`@PickList` 怎麼從 view 挑文件,以及 client-only 這條界線。

---

## 重點摘要

- **`@Prompt`——問一句、確認、選一個**：官方定義「useful for prompting a user for information and determining a course of action based on the user's input」。樣式很多:`[Ok]`、`[YesNo]`、`[YesNoCancel]`、`[OkCancelEdit]`、`[OkCancelList]`、`[OkCancelCombo]`、`[OkCancelEditCombo]`、`[OkCancelListMult]`、`[Password]`、`[LocalBrowse]`、`[ChooseDatabase]`。回傳值依樣式而定(`[YesNo]` 回 1／0)。
- **`@PickList`——彈 modal 挑文件或挑人**：`[Custom]` 從你指定的 view 選一或多筆、**回傳選中文件某一欄的值**;`[Name]` 從 Domino Directory 挑人;另有 `[Room]`／`[Resource]`／`[Folders]`。`[Single]` 限單選,回傳是**文字清單**。
- **client-only 邊界**：兩者都「cannot be used in Web applications」;`@Prompt` 還**不能用在 column、selection、mail agent、scheduled agent** 公式裡。UI 對話框只屬於前端事件。
- **搭配**:對話框拿到使用者選擇後,真正的 UI 動作交給 [`@Command`／`@PostedCommand`](/domino-news/posts/formula-command-postedcommand)。

## @Prompt：問一句、確認、選一個

[官方 @Prompt](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PROMPT.html) 的語法:

```
@Prompt( [ style ] : [NoSort] ; title ; prompt ; defaultChoice ; choiceList ; filetype )
```

常用樣式:

| 樣式 | 做什麼 | 回傳 |
|---|---|---|
| `[Ok]` | 顯示訊息、一顆 OK | 1 |
| `[YesNo]` | Yes／No | 1 或 0 |
| `[YesNoCancel]` | Yes／No／Cancel | 1／0／-1 |
| `[OkCancelEdit]` | 文字輸入框 | 使用者輸入的字串 |
| `[OkCancelList]` | 從清單單選 | 選中的值 |
| `[OkCancelCombo]` | 下拉單選 | 選中的值 |
| `[OkCancelEditCombo]` | 下拉或自行輸入 | 選中或輸入的值 |
| `[OkCancelListMult]` | 清單多選 | 文字清單 |
| `[Password]` | 密碼輸入(隱藏) | 輸入字串 |
| `[LocalBrowse]` | 本機檔案瀏覽 | 選中的檔名 |

例:一個確認框——

```
@If(@Prompt([YesNo]; "確認"; "確定要送出這筆申請嗎?") = 1;
    @Command([FileSave]);
    "")
```

## @PickList：從 view 挑文件、或從名錄挑人

`@PickList` 彈一個 modal。官方定義它顯示「A view you specify from which the user can select one or more documents. @PickList returns a column value from the selected document(s)」,或「A dialog box, displaying information from all available Domino Directories」。

[官方 @PickList](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PICKLIST.html) 的兩種主要寫法:

```
@PickList( [CUSTOM] : [SINGLE] ; server : file ; view ; title ; prompt ; column ; categoryname )
@PickList( [NAME] : [SINGLE] [; selectedoptions ] )
```

- `[CUSTOM]`:從 `server:file` 那個 DB 的 `view` 選文件,回傳第 `column` 欄(1 起算)的值。
- `[NAME]`:從 Domino Directory 挑人。
- `[SINGLE]`:限單選(不加就可多選)。
- 回傳:選中文件的欄值組成的**文字清單**。

例:讓使用者從「Customers」view 挑一筆、回傳第 1 欄——

```
sel := @PickList([CUSTOM] : [SINGLE]; "" : "crm.nsf"; "Customers";
                 "選擇客戶"; "請挑一筆"; 1);
@If(sel = ""; @Return(""); "");
FIELD Customer := sel
```

## 只在 client 跑——別放 web／排程 agent

這是最容易踩的界線。兩個函式頁都寫了同一句:**「You cannot use this function in Web applications.」** 而 `@Prompt` 還多一條限制:**不能用在 column、selection、mail agent、scheduled agent** 的公式裡。

道理很直接:這些是**要有人坐在 Notes client 前面**回應的對話框。放進背景／排程執行的東西(沒有 UI、沒有人按),它無從彈窗——所以會默默無效或報錯。要在 web 或背景做「問使用者」,得換別的機制(web 用表單／XPages dialog,背景邏輯則不該問人、改用預設或參數)。

## 該用哪個

- **只是確認、或給一句訊息** → `@Prompt([YesNo])`／`[Ok]`。
- **要使用者輸入一段文字** → `@Prompt([OkCancelEdit])`;要遮蔽 → `[Password]`。
- **從固定選項挑** → `@Prompt([OkCancelList])`／`[OkCancelCombo])`;多選 → `[OkCancelListMult]`。
- **要從既有資料(一個 view)裡挑一筆或多筆文件** → `@PickList([Custom])`,它直接回傳欄值,不用自己組 choiceList。
- **要挑人** → `@PickList([Name])`。
- 拿到選擇之後,UI 動作交給 [`@Command`／`@PostedCommand`](/domino-news/posts/formula-command-postedcommand)——注意那篇講的執行順序。

## 同類別在其他語言

`@Prompt`／`@PickList` 是 **Formula 驅動 Notes 前端對話框**的機制:

- **LotusScript**:對應 `NotesUIWorkspace` 的 `Prompt`、`PickListStrings`／`PickListCollection`、`DialogBox`——同樣是 client 前端才有的東西,server 端 agent 一樣不能用。
- **SSJS／web**:沒有 `@Prompt`。要「問使用者」得自己做——XPages 的 dialog 控制項、或前端 client-side JavaScript,不是這套 Formula 對話框。
