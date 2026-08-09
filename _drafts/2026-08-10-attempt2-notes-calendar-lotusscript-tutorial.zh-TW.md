---
title: "使用 LotusScript 操作 NotesCalendar：完整指南"
description: "深入探討如何透過 LotusScript 使用 NotesCalendar 類別來存取和管理 HCL Notes 的行事曆功能，包括建立、讀取和管理行事曆條目。"
pubDate: "2026-08-10T07:34:10+08:00"
lang: "zh-TW"
slug: "notes-calendar-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Notes Client"
sources:
  - title: "NotesCalendar (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html"
  - title: "NotesCalendarEntry (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARENTRY_CLASS.html"
  - title: "NotesCalendarNotice (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARNOTICE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-calendar-lotusscript-tutorial
-->

## 簡介

在 HCL Notes 中，行事曆是日常工作的重要組成部分。透過 LotusScript 的 `NotesCalendar` 類別，開發者可以程式化地存取和管理行事曆功能。本文將介紹如何使用 `NotesCalendar` 類別來建立、讀取和管理行事曆條目。

## 存取使用者的行事曆

要存取當前使用者的行事曆，首先需要獲取當前使用者的郵件資料庫，然後使用 `NotesSession` 的 `getCalendar` 方法來獲取 `NotesCalendar` 對象。

```lotusscript
Dim session As New NotesSession
Dim maildb As NotesDatabase
Dim calendar As NotesCalendar

Set maildb = session.CurrentDatabase
Set calendar = session.getCalendar(maildb)
```

## 建立新的行事曆條目

要在行事曆中建立新的條目，可以使用 `NotesCalendar` 的 `CreateEntry` 方法。以下範例展示如何建立一個新的會議條目。

```lotusscript
Dim entry As NotesCalendarEntry
Dim icalendar As String

icalendar = "BEGIN:VCALENDAR\n" & _
            "BEGIN:VEVENT\n" & _
            "DTSTART:20230810T090000\n" & _
            "DTEND:20230810T100000\n" & _
            "SUMMARY:專案會議\n" & _
            "END:VEVENT\n" & _
            "END:VCALENDAR"

Set entry = calendar.CreateEntry(icalendar)
```

在此範例中，`icalendar` 字串包含了符合 iCalendar 格式的事件資訊。更多關於 `CreateEntry` 方法的資訊，請參閱 [NotesCalendar 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html)。

## 讀取行事曆條目

要讀取特定時間範圍內的行事曆條目，可以使用 `NotesCalendar` 的 `ReadRange` 方法。以下範例展示如何讀取今天和明天的行事曆條目。

```lotusscript
Dim dt1 As NotesDateTime
Dim dt2 As NotesDateTime
Dim entries As String

Set dt1 = session.CreateDateTime("Today 08:00")
Set dt2 = session.CreateDateTime("Tomorrow 17:00")

entries = calendar.ReadRange(dt1, dt2)
```

此方法返回符合 iCalendar 格式的行事曆條目資訊。更多關於 `ReadRange` 方法的資訊，請參閱 [NotesCalendar 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html)。

## 管理行事曆通知

`NotesCalendarNotice` 類別用於處理行事曆通知，例如會議邀請。要獲取新的邀請，可以使用 `NotesCalendar` 的 `GetNewInvitations` 方法。

```lotusscript
Dim notices As Variant
Dim notice As NotesCalendarNotice

notices = calendar.GetNewInvitations()
Forall n In notices
    Set notice = n
    ' 處理通知
End Forall
```

更多關於 `NotesCalendarNotice` 類別的資訊，請參閱 [NotesCalendarNotice 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARNOTICE_CLASS.html)。

## 結論

透過 LotusScript 的 `NotesCalendar` 類別，開發者可以有效地存取和管理 HCL Notes 的行事曆功能。無論是建立新的行事曆條目、讀取現有條目，還是處理行事曆通知，`NotesCalendar` 類別都提供了豐富的方法來滿足開發需求。
