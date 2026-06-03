---
title: "NotesCalendar：LotusScript 讀寫 Domino 行事曆的三個 Class"
description: "Domino 行事曆資料不是放在一般文件裡、而是用結構化的 iCalendar 格式存在 mail.nsf。LotusScript 提供三個 class 處理這層結構：NotesCalendar（行事曆物件本身）、NotesCalendarEntry（單一行事曆項目）、NotesCalendarNotice（會議邀請通知）。本文拆解取得方式（session.GetCalendar 傳入 mail.nsf）、CreateEntry 寫入 iCalendar 格式的字串、ReadRange 批次讀取時間段內的項目、GetNewInvitations 取得未處理邀請、NoticeAction 接受/拒絕邀請、跟幾個一定會踩的坑（ConvertMIME 必須設 False、行事曆文件不能當一般 NotesDocument 操作）。"
pubDate: 2026-06-03T07:30:00+08:00
lang: zh-TW
slug: notes-calendar
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesCalendar class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html"
  - title: "NotesCalendarEntry class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARENTRY_CLASS.html"
  - title: "NotesCalendarNotice class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARNOTICE_CLASS.html"
relatedJava: ["Session"]
relatedSsjs: []
cover: "/covers/notes-calendar.webp"
coverStyle: "ukiyo-e"
---

公司的 Domino 行事曆系統要做自動化 — 每週五自動建下週一到週五的定期會議、或者把外部系統（人事、專案管理）產生的行程同步進 mail.nsf。看了文件才發現：行事曆資料不是存在一般 `NotesDocument` 裡、而是用 **iCalendar 格式（RFC 5545）** 結構化儲存、必須透過三個專用 class 操作。

本文拆解這三個 class 的分工、從建立行事曆項目到讀取時間段、到處理會議邀請。

---

## 重點摘要

- **三個 class 分工**：[`NotesCalendar`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html)（行事曆物件、取得入口）/ [`NotesCalendarEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARENTRY_CLASS.html)（單一行程項目）/ [`NotesCalendarNotice`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARNOTICE_CLASS.html)（會議邀請通知）
- **取得方式**：`session.GetCalendar(db)`、`db` 必須是使用者的 mail.nsf（不能是任意 NSF）
- **寫入要用 iCalendar 字串**：`CreateEntry(iCalString)` 接受 RFC 5545 格式的字串、不是直接設欄位
- **`ReadRange`** 批次讀取指定時間段內的所有行程（回傳 iCalendar 字串）
- **`GetNewInvitations`** 取得尚未處理的會議邀請、配合 `NoticeAction` 接受 / 拒絕
- **操作行事曆前要設 `session.ConvertMIME = False`**、否則行事曆的 MIME 結構會被自動轉換成 rich text 破壞資料

---

## 三個 Class 的分工

| Class | 代表什麼 | 建立方式 |
|---|---|---|
| `NotesCalendar` | 使用者的整個行事曆 | `session.GetCalendar(mailDb)` |
| `NotesCalendarEntry` | 單一行程（會議 / 個人事項 / 週期性事件）| `calendar.GetEntry(uid)` 或 `calendar.CreateEntry(iCalString)` |
| `NotesCalendarNotice` | 會議邀請 / 更新通知 | `calendar.GetNewInvitations` 回傳陣列 |

---

## 取得 NotesCalendar 物件

```lotusscript
Dim session As New NotesSession
Dim mailDb As NotesDatabase

' 開使用者自己的 mail.nsf
Set mailDb = session.GetDatabase("MailServer/ACME", "mail/jsmith.nsf")
If Not mailDb.IsOpen Then Call mailDb.Open("", "")

' 取得行事曆物件（必須是 mail database）
Dim cal As NotesCalendar
Set cal = session.GetCalendar(mailDb)
```

**重要**：`GetCalendar` 只接受 mail database（`db.IsMailDatabase = True`）。一般業務 NSF 呼叫會拋錯。

---

## CreateEntry — 寫入新行程

`CreateEntry` 接受一個 iCalendar 格式字串、建立行事曆項目並回傳 `NotesCalendarEntry`：

```lotusscript
' 建立一個 2026-06-03 10:00-11:00 的會議
Dim iCalStr As String
iCalStr = "BEGIN:VCALENDAR" & Chr(13) & Chr(10) & _
          "VERSION:2.0" & Chr(13) & Chr(10) & _
          "BEGIN:VEVENT" & Chr(13) & Chr(10) & _
          "DTSTART:20260603T020000Z" & Chr(13) & Chr(10) & _
          "DTEND:20260603T030000Z" & Chr(13) & Chr(10) & _
          "SUMMARY:週一站立會議" & Chr(13) & Chr(10) & _
          "LOCATION:Conference Room A" & Chr(13) & Chr(10) & _
          "END:VEVENT" & Chr(13) & Chr(10) & _
          "END:VCALENDAR"

Dim entry As NotesCalendarEntry
Set entry = cal.CreateEntry(iCalStr)

If Not (entry Is Nothing) Then
    Print "建立成功，UID：" & entry.UID
End If
```

幾個注意：
- 時間格式用 **UTC（結尾 Z）**、不要用本地時區字串（容易因伺服器時區設定產生誤差）
- 換行必須是 **CRLF（`Chr(13) & Chr(10)`）**、RFC 5545 的規定
- `AutoSendNotices = True` 時、建立含 ATTENDEE 的 VEVENT 會自動寄邀請信

---

## ReadRange — 批次讀取時間段行程

```lotusscript
Dim startDt As New NotesDateTime("2026-06-03")
Dim endDt As New NotesDateTime("2026-06-07 23:59:00")

' 讀取這段時間內的所有行程、回傳 iCalendar 字串
Dim iCalResult As String
iCalResult = cal.ReadRange(startDt, endDt)

Print "本週行程 iCal 長度：" & Len(iCalResult) & " bytes"
```

回傳的是整個 iCalendar 字串（包含所有 VEVENT）、要解析可以用字串操作或寫 parser。`EntriesProcessed` 屬性記錄這次讀了幾筆。

---

## GetNewInvitations — 取得未處理邀請

```lotusscript
' 取得所有未處理的會議邀請
Dim invitations As Variant
invitations = cal.GetNewInvitations()

If IsArray(invitations) Then
    Dim i As Integer
    For i = 0 To UBound(invitations)
        Dim notice As NotesCalendarNotice
        Set notice = invitations(i)
        Print "邀請：" & notice.Summary
        Print "主辦人：" & notice.Organizer
    Next
End If
```

`GetNewInvitations` 回傳 `NotesCalendarNotice` 物件陣列、每個代表一封尚未回應的邀請。

---

## NoticeAction — 接受 / 拒絕邀請

`NotesCalendarNotice` 的 `NoticeAction` 方法處理邀請回應：

```lotusscript
Dim notice As NotesCalendarNotice
' (從 GetNewInvitations 取得)

' 接受邀請
Call notice.NoticeAction(CALACTION_ACCEPT, "確認參加", Nothing, False)

' 拒絕邀請
Call notice.NoticeAction(CALACTION_DECLINE, "當天行程衝突", Nothing, False)

' 暫訂
Call notice.NoticeAction(CALACTION_TENTATIVE, "", Nothing, False)
```

常數說明：

| 常數 | 值 | 動作 |
|---|---|---|
| `CALACTION_ACCEPT` | 1 | 接受 |
| `CALACTION_DECLINE` | 2 | 拒絕 |
| `CALACTION_TENTATIVE` | 3 | 暫訂 |
| `CALACTION_REQUESTINFO` | 4 | 要求更多資訊 |

---

## 必踩的坑：ConvertMIME

行事曆資料在 mail.nsf 是 MIME 格式儲存。如果你在操作行事曆前 `session.ConvertMIME` 是 `True`（預設值）、Domino 會自動把 MIME 轉成 rich text — 這會破壞行事曆結構、造成無法預期的錯誤。

**操作行事曆之前一定要設：**

```lotusscript
session.ConvertMIME = False

' ... 所有行事曆操作 ...

' 操作完還原
session.ConvertMIME = True
```

這個設定只影響當次 session、不會持久化。但忘記設、就算 `GetCalendar` 成功、後續讀寫行程資料時也可能拿到損壞的內容。

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesCalendar` / `NotesCalendarEntry` / `NotesCalendarNotice` |
| Java | `lotus.domino.Calendar` / `CalendarEntry` / `CalendarNotice`（去掉 Notes 前綴、用完要 `.recycle()`）|
| SSJS | 沒有直接對應 — 行事曆操作在 XPages 通常透過 Domino REST API 完成 |
