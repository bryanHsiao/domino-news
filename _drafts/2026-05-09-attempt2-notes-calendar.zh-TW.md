---
title: "使用 NotesCalendar 類別管理行事曆事件的指南"
description: "深入探討如何使用 NotesCalendar 類別在 LotusScript 中管理 HCL Domino 行事曆事件，包括建立、讀取、更新和刪除行事曆條目。"
pubDate: "2026-05-09T07:25:00+08:00"
lang: "zh-TW"
slug: "notes-calendar"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesCalendar class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESCALENDAR_CLASS.html"
  - title: "NotesCalendarEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESCALENDARENTRY_CLASS.html"
  - title: "NotesCalendarNotice class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESCALENDARNOTICE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-calendar
-->

## 簡介

在 HCL Domino 中，`NotesCalendar` 類別提供了一個強大的介面，讓開發者能夠透過 LotusScript 程式碼存取和管理行事曆事件。這篇指南將帶您了解如何使用 `NotesCalendar` 類別來建立、讀取、更新和刪除行事曆條目。

## 取得 NotesCalendar 物件

要開始使用 `NotesCalendar`，首先需要取得 `NotesSession` 和 `NotesDatabase` 物件，然後透過 `NotesSession` 的 `getCalendar` 方法來取得 `NotesCalendar` 物件。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim calendar As NotesCalendar

Set db = session.CurrentDatabase
Set calendar = session.getCalendar(db)
```

## 建立行事曆條目

使用 `createEntry` 方法可以建立新的行事曆條目。此方法接受 iCalendar 格式的字串作為參數。

```lotusscript
Dim icalendar As String
Dim entry As NotesCalendarEntry

icalendar = "BEGIN:VCALENDAR\n" & _
            "BEGIN:VEVENT\n" & _
            "SUMMARY:會議\n" & _
            "DTSTART:20230501T090000\n" & _
            "DTEND:20230501T100000\n" & _
            "END:VEVENT\n" & _
            "END:VCALENDAR"

Set entry = calendar.createEntry(icalendar)
```

## 讀取行事曆條目

要讀取行事曆條目，可以使用 `getEntries` 方法，該方法接受開始和結束日期作為參數，並返回符合條件的條目集合。

```lotusscript
Dim entries As NotesCalendarEntryCollection
Dim startTime As New NotesDateTime("2023/05/01")
Dim endTime As New NotesDateTime("2023/05/31")

Set entries = calendar.getEntries(startTime, endTime)
```

## 更新行事曆條目

要更新現有的行事曆條目，首先需要取得該條目，然後使用 `replaceItemValue` 方法來修改其屬性。

```lotusscript
Dim entry As NotesCalendarEntry
Dim uid As String

uid = "1234567890"
Set entry = calendar.getEntry(uid)

Call entry.replaceItemValue("Subject", "更新後的會議主題")
Call entry.save()
```

## 刪除行事曆條目

要刪除行事曆條目，可以使用 `remove` 方法。

```lotusscript
Dim entry As NotesCalendarEntry
Dim uid As String

uid = "1234567890"
Set entry = calendar.getEntry(uid)

Call entry.remove(True)
```

## 結論

透過 `NotesCalendar` 類別，開發者可以在 LotusScript 中有效地管理 HCL Domino 行事曆事件。這篇指南介紹了如何建立、讀取、更新和刪除行事曆條目，幫助您更好地利用這些功能來開發應用程式。

有關 `NotesCalendar` 類別的更多資訊，請參閱 [官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESCALENDAR_CLASS.html)。
