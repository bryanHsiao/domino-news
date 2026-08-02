---
title: "NotesUIScheduler：用 LotusScript 驅動內嵌的 free/busy 排程格"
description: "一張自訂的會議室預約或會議表單上有內嵌排程控制項 —— 那個你放進與會者、看大家 free/busy 的忙碌時間格。NotesUIScheduler 就是你用程式驅動那個控制項的方式：從 UI 文件用名稱取得它、加或移除與會者、刷新排程資料、讀回使用者選的時段。一篇關於唯一那個前端排程類別的實測報告 —— 它的 GetScheduleData 刷新、以及你會掛的兩個事件。"
pubDate: 2026-08-02T07:30:00+08:00
lang: zh-TW
slug: notes-ui-scheduler
tags:
  - "LotusScript"
  - "Notes UI"
  - "Tutorial"
sources:
  - title: "NotesUIScheduler (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUISCHEDULER_CLASS.html"
  - title: "NotesUIDocument (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html"
  - title: "NotesDateTime (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html"
relatedJava: []
relatedSsjs: []
---

你在做一張自訂的會議或會議室預約表單，上面有一個內嵌排程控制項 —— 那個你把與會者跟會議室丟進去、看大家 free/busy 攤開來的忙碌時間格。控制項自己會渲染；問題是你怎麼用程式驅動它：預填必要與會者、把會議室當資源加進去、刷新那格、再讀回使用者最後選定的時段好存會議。這正是 [`NotesUIScheduler`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUISCHEDULER_CLASS.html) 的用途。

跟空空的 [`Button` / `Field` / `Navigator`](/domino-news/zh-TW/posts/button-field-navigator) 類別不同，這一個有真的狀態 —— 十五個顯示屬性、四個方法、兩個事件。這是一篇關於唯一那個前端排程類別的實測報告：怎麼取得它、管理它的與會者、刷新它的資料、掛它的 interval。它是 Release 6 新增，只在前端（Notes client）有效，不支援 COM。

---

## 重點摘要

- `NotesUIScheduler`「代表文件中一個內嵌的排程器」。你從開著的 UI 文件用名稱取得它：`Set sched = uidoc.GetSchedulerObject("SchedulerName")` —— 這個內嵌排程器必須有命名、且存在於表單上。
- 用 `AddParticipant`、`RemoveParticipants`、`GetParticipants` 管理與會者；改完名單後呼叫 `GetScheduleData` 刷新 free/busy 格。
- `Interval` 屬性是格子正在顯示／使用者選定的會議時段 —— 讀它來存會議，或設它來移動選取。
- `Display*` 屬性（`DisplayRooms`、`DisplayResources`、`DisplayMeetingSuggestions`、`DisplayCheckboxes`…）切換格子顯示什麼。
- 兩個事件：`OnIntervalChange`（使用者拖出新時段）與 `OnSuggestionsAvailable`（被選的名單集合改變了）。

## 取得物件

排程器是你在 Designer 裡放到表單上、並**命名**的一個內嵌控制項。執行時你從開著的 [`NotesUIDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html) 取得它，而不是 new 出來：

```lotusscript
Dim ws As New NotesUIWorkspace
Dim uidoc As NotesUIDocument
Set uidoc = ws.CurrentDocument

Dim sched As NotesUIScheduler
Set sched = uidoc.GetSchedulerObject("RoomScheduler")   ' 控制項在 Designer 裡的名字
```

如果名字對不上目前表單上的某個排程器，你就拿不到東西 —— 所以那個名字字串是唯一要跟表單設計保持同步的東西。`SchedulerName`（唯讀）會把它反映回來，讓你確認手上握的是哪個控制項。

## 與會者與刷新

四個方法全是關於與會者名單。`AddParticipant` 加一個人、會議室、或資源；`RemoveParticipants` 把他們拿掉；`GetParticipants` 讀出目前這組。要記住的是 `GetScheduleData` —— 你改了與會者名單之後，格子不會自己重新查 free/busy，所以你呼叫 `GetScheduleData` 去刷新它：

```lotusscript
Call sched.AddParticipant("CN=Alex Chen/O=Acme")
Call sched.AddParticipant("Conference Room 3/Acme")   ' 一個會議室資源
Call sched.GetScheduleData()                           ' 為新的名單重新查忙碌時間
```

忘了刷新就是這裡的經典 bug：你用程式加了三個必要與會者，格子卻還顯示舊的兩個，會議建議也是拿錯的名單算的。先加與會者、再刷新。

## 讀回選定的時段

`Interval` 屬性是格子聚焦的會議時間 —— 使用者拖到的起訖、或他接受的建議。它是前端選取回到你程式裡的方式：使用者確認時讀 `Interval`，把起訖（以 [`NotesDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html) 值）寫進會議文件、再存檔。你也可以*設* `Interval` 用程式移動格子的選取 —— 很適合用一個提議時間替表單開場。其餘顯示屬性（`ScheduleGridStart`、`DisplayHoursPerDay`、`TimeZone`、`DisplayRooms`、`DisplayResources`、`DisplayMeetingSuggestions`）是「使用者看到多少格、用哪個時區」的旋鈕 —— 表單開啟時設一次就好。

## 那兩個事件

`OnIntervalChange` 在使用者拖到不同時段時觸發 —— 是「隨提議時間移動去重算成本／檢查會議室容量／更新一個標籤」的掛鉤。`OnSuggestionsAvailable` 在被選名單改變、且新的會議建議算好時觸發 —— 是「一個新與會者名單的 free/busy 就緒後去反應」的掛鉤。兩個都是控制項上的前端事件，跟其餘 UI 類別一樣是沒有 `Query*` 的通知模型：它們告訴你發生了某件事，你再透過排程器（與 UI 文件）伸回去處理。

## 同類別在其他語言

那個*控制項*沒有對應，理由一樣 —— 它是 Notes client 的 UI 元件，Domino Java API 與 XPages SSJS 都沒有 `NotesUIScheduler`。真正跨得過去的是它底下的 free/busy *資料*：在後端你透過 [`NotesCalendar`](/domino-news/zh-TW/posts/notes-calendar) 與行事曆/排程儲存體計算或讀取忙碌時間，而現代的 web 排程器是建在 Domino REST API 的行事曆端點上、不是一個內嵌控制項。所以這個格子只屬於 classic client；它視覺化的那份可用時間資料，到哪都拿得到，只是走不同的門。
