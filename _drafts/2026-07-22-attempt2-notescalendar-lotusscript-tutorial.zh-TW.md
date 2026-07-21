---
title: "使用 LotusScript 操作 NotesCalendar：完整指南"
description: "深入探討如何使用 LotusScript 存取和管理 HCL Domino 的 NotesCalendar，涵蓋建立、讀取和管理行事曆事件的實作範例。"
pubDate: "2026-07-22T07:57:39+08:00"
lang: "zh-TW"
slug: "notescalendar-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesCalendar (LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendar-lotusscript"
  - title: "NotesCalendarEntry (LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendarentry-lotusscript"
  - title: "ReadRange (NotesCalendar - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-readrange-notescalendar"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendar-lotusscript, https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendarentry-lotusscript, https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-readrange-notescalendar
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendar-lotusscript" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notescalendar-lotusscript-tutorial
-->

在 HCL Domino 中，`NotesCalendar` 類別提供了存取和管理行事曆的功能。透過 LotusScript，開發者可以建立、讀取和管理行事曆事件。本文將介紹如何使用 `NotesCalendar` 類別，並提供實作範例。

## 取得使用者的行事曆

首先，您需要取得當前使用者的行事曆。這可以透過 `NotesSession` 和 `NotesDatabase` 物件來完成：

```lotusscript
Dim session As New NotesSession
Dim maildb As NotesDatabase
Dim calendar As NotesCalendar

Set maildb = session.CurrentDatabase
Set calendar = session.getCalendar(maildb)
```

在上述程式碼中，`session.getCalendar(maildb)` 方法返回一個 `NotesCalendar` 物件，代表當前使用者的行事曆。

## 讀取特定時間範圍內的行事曆事件

要讀取特定時間範圍內的行事曆事件，可以使用 `ReadRange` 方法。此方法返回指定時間範圍內的事件摘要，格式為 `iCalendar`：

```lotusscript
Dim startDate As NotesDateTime
Dim endDate As NotesDateTime
Dim calendarEntries As String

Set startDate = session.CreateDateTime("2026/07/21 08:00 AM")
Set endDate = session.CreateDateTime("2026/07/22 05:00 PM")

calendarEntries = calendar.ReadRange(startDate, endDate)
```

在此範例中，`ReadRange` 方法返回從 2026 年 7 月 21 日上午 8 點到 2026 年 7 月 22 日下午 5 點之間的行事曆事件摘要。

## 建立新的行事曆事件

要建立新的行事曆事件，可以使用 `CreateEntry` 方法。此方法需要一個 `iCalendar` 格式的字串作為輸入：

```lotusscript
Dim icalEntry As String
Dim newEntry As NotesCalendarEntry

icalEntry = "BEGIN:VCALENDAR\n" & _
            "VERSION:2.0\n" & _
            "BEGIN:VEVENT\n" & _
            "DTSTART:20260721T140000Z\n" & _
            "DTEND:20260721T150000Z\n" & _
            "SUMMARY:新會議\n" & _
            "END:VEVENT\n" & _
            "END:VCALENDAR"

Set newEntry = calendar.CreateEntry(icalEntry)
```

在此範例中，`CreateEntry` 方法使用 `iCalendar` 格式的字串來建立一個新的行事曆事件，該事件於 2026 年 7 月 21 日下午 2 點開始，持續一小時，主題為「新會議」。

## 取得特定的行事曆事件

要取得特定的行事曆事件，可以使用 `GetEntry` 方法，該方法需要事件的唯一識別碼（UID）：

```lotusscript
Dim entryUID As String
Dim calendarEntry As NotesCalendarEntry

entryUID = "F0A3694E4E7E20938525790F004D370A-Lotus_Notes_Generated"
Set calendarEntry = calendar.GetEntry(entryUID)
```

在此範例中，`GetEntry` 方法返回具有指定 UID 的行事曆事件。

## 讀取行事曆事件的詳細資訊

取得 `NotesCalendarEntry` 物件後，可以使用其 `Read` 方法來讀取事件的詳細資訊，格式為 `iCalendar`：

```lotusscript
Dim entryDetails As String

entryDetails = calendarEntry.Read()
```

在此範例中，`Read` 方法返回行事曆事件的詳細資訊。

## 結論

透過 `NotesCalendar` 和 `NotesCalendarEntry` 類別，開發者可以使用 LotusScript 存取和管理 HCL Domino 的行事曆。這些類別提供了豐富的方法和屬性，允許開發者建立、讀取和管理行事曆事件。更多詳細資訊，請參閱 [NotesCalendar (LotusScript)](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendar-lotusscript) 和 [NotesCalendarEntry (LotusScript)](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendarentry-lotusscript)。
