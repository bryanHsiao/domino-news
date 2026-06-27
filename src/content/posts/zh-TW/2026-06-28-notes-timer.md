---
title: "NotesTimer：在 Notes client 裡每隔幾秒觸發一次事件"
description: "想在 Notes client 開著的畫面上每隔幾秒做一件事 — 自動刷新 view、輪詢有沒有新信、更新一個狀態顯示？NotesTimer 就是這個：建立時給一個秒數間隔，它就週期性觸發 Alarm 事件。本文拆解建立、Interval / Enabled / Comment 屬性、用 On Event 綁事件處理，以及四個一定要知道的限制：只能在 UI 不能在 agent、要宣告在全域、handler 必須在間隔內跑完、預設就是啟用。"
pubDate: 2026-06-28T07:30:00+08:00
lang: zh-TW
slug: notes-timer
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesTimer class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTIMER_CLASS.html"
  - title: "NotesTimer class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESTIMER_CLASS.html"
  - title: "NotesUIWorkspace class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
relatedJava: []
relatedSsjs: []
---

你想在 Notes client 開著的某個畫面上，每隔幾秒自動做一件事：刷新一個 view、看看有沒有新文件進來、更新一個「最後同步時間」的顯示。LotusScript 沒有 `Sleep` 迴圈那種土法（會卡住 UI），但有一個專門做這件事的類別 —— [`NotesTimer`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTIMER_CLASS.html)。

官方定義：「Represents a mechanism for triggering an event every fixed number of seconds.」你建立時給一個秒數，它就週期性地觸發一個 **Alarm 事件**，你把要做的事寫在事件處理 sub 裡。簡單，但有幾個限制不知道會踩雷。

---

## 重點摘要

- 用 `New NotesTimer(interval [, comment])` 建立 —— `interval` 是觸發間隔秒數。
- **屬性**（讀寫）：`Interval`（間隔秒數）、`Enabled`（是否啟用，**新物件預設就是啟用**）、`Comment`。
- 用 **`On Event Alarm From timer Call yourSub`** 把事件綁到處理 sub，sub 收一個 `NotesTimer` 參數。
- **四個一定要知道的限制**：
  - **只能在 Notes UI、不能在 agent**：官方明說「intended for use in Notes UI objects and not agents」。
  - **要宣告在全域**：放在 `PostOpen` 之類的 routine 裡，routine 一結束物件就被銷毀、timer 也沒了。
  - **handler 必須在間隔內跑完**：否則會疊起來出問題。
  - **不支援 COM**。

## 建立與綁事件

關鍵是「在哪宣告」。timer 變數要宣告在**全域**（模組層級），不能放在會結束的 routine 裡，否則 routine 一退出它就被回收：

```lotusscript
' 全域宣告（在 Declarations，不是在 Sub 裡）
Dim timer As NotesTimer

Sub Postopen(Source As Notesuidocument)
    Set timer = New NotesTimer(5, "auto-refresh")   ' 每 5 秒
    On Event Alarm From timer Call OnTick
End Sub

Sub OnTick(Source As NotesTimer)
    ' 這裡寫每 5 秒要做的事 —— 必須在 5 秒內跑完
    Dim ws As New NotesUIWorkspace
    Call ws.ViewRefresh()      ' 例：刷新當前 view
End Sub
```

`On Event Alarm From timer Call OnTick` 是把 timer 的 Alarm 事件接到 `OnTick` 這個 sub；sub 第一個參數會收到觸發的 `NotesTimer` 物件。（這段改寫自[官方 NotesTimer 範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESTIMER_CLASS.html)；handler 裡用到的 [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html) 就是站上前面介紹過的當前工作區。）

## 控制：Enabled 與 Interval

- **`Enabled`** —— 讀寫 `Boolean`。要暫停就 `timer.Enabled = False`，要恢復 `= True`。注意官方提醒：**新建的 NotesTimer 預設就是啟用的** —— `New` 出來那一刻就開始計時，不用你再開。
- **`Interval`** —— 讀寫，可以中途改間隔。
- **`Comment`** —— 純註解。

要「先準備好、晚點再啟動」，就建立後馬上 `timer.Enabled = False`，需要時再打開。

## 四個限制細談

**1. 只能在 UI，不能在 agent。** 官方原文：「NotesTimer is intended for use in Notes UI objects and not agents.」這跟站上 [UI 類別那篇](/domino-news/posts/notes-ui-workspace-document/)、以及 [NotesAgent](/domino-news/posts/notes-agent/) 講的是同一條線 —— timer 依賴一個「活著的 UI 事件迴圈」，背景 agent 沒有那個迴圈。要在伺服器端週期性做事，走 scheduled agent，不是 NotesTimer。

**2. 一定要宣告在全域。** 官方：「If you declare it in a routine such as PostOpen... it is destroyed when the routine exits.」這是最常見的坑 —— 在 PostOpen 裡 `Dim timer As NotesTimer` 然後 New，PostOpen 一結束 timer 就沒了、完全不會觸發。變數宣告要放 Declarations。

**3. handler 必須在間隔內跑完。** 官方：handler 要在「a time period less than the NotesTimer object's interval」內完成。如果你設 5 秒、但 handler 要跑 8 秒，就會出問題。間隔要抓得比 handler 最壞情況還長，或在 handler 裡先 `Enabled = False`、做完再 `= True`。

**4. 不支援 COM。** 純 Notes client LotusScript 的東西。

## 同類別在其他語言

跟前面 UI 類別、composite app 一樣，這次也是 **沒有對應**：

| 語言 | 對應 | 說明 |
|---|---|---|
| Java（`lotus.domino.*`） | 無 | 後端 Java API 沒有這種綁 UI 事件迴圈的 timer |
| SSJS / XPages | 無 | Web 端要週期性動作，走瀏覽器的 `setInterval` / XPages 的 partial refresh polling，完全不同的機制 |

`NotesTimer` 是少數「只屬於 Notes client UI」的類別之一 —— 它的存在前提就是一個活著的、有事件迴圈的桌面 UI。沒有那個前提（伺服器、Web）就沒有它，要的是各自情境的對應做法（scheduled agent、`setInterval`）。
