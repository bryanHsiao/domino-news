---
title: "使用 LotusScript 操作 NotesCalendar：深入教程"
description: "本教程深入探討如何使用 LotusScript 的 NotesCalendar 類別來讀取和寫入 HCL Domino 的行事曆資料，包括創建、讀取和管理行事曆條目。"
pubDate: "2026-09-27T09:10:04+08:00"
lang: "zh-TW"
slug: "notescalendar-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Notes Client"
sources:
  - title: "NotesCalendar (LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=classes-notescalendar-lotusscript"
  - title: "NotesCalendarEntry (LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_NOTESCALENDARENTRY_CLASS.html"
  - title: "NotesCalendar: Reading and Writing Domino Calendar Data with LotusScript"
    url: "https://bryanhsiao.github.io/domino-news/en/posts/notes-calendar/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notescalendar-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
attempt: 2
slug: notescalendar-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 環境中，行事曆資料的管理對於自動化會議安排、同步外部排程系統或自動處理邀請等應用至關重要。LotusScript 提供了 `NotesCalendar` 類別，允許開發者以程式方式存取和操作行事曆資料。本教程將詳細介紹如何使用 `NotesCalendar` 類別來讀取和寫入行事曆資料。

## 取得 NotesCalendar 物件

要開始使用 `NotesCalendar`，首先需要取得當前使用者的郵件資料庫，然後透過 `Session` 物件的 `GetCalendar` 方法來獲取 `NotesCalendar` 物件。

```lotusscript
Dim session As New NotesSession
Dim maildb As NotesDatabase
Dim calendar As NotesCalendar

Set maildb = session.CurrentDatabase
Set calendar = session.GetCalendar(maildb)
```

## 讀取行事曆條目

要讀取特定時間範圍內的行事曆條目，可以使用 `ReadRange` 方法。此方法返回指定時間範圍內的行事曆條目摘要，格式為 `iCalendar`。

```lotusscript
Dim startDate As New NotesDateTime("2026/09/27 08:00:00")
Dim endDate As New NotesDateTime("2026/09/28 17:00:00")
Dim calendarData As String

calendarData = calendar.ReadRange(startDate, endDate)
```

`ReadRange` 方法的詳細資訊可參考 [ReadRange (NotesCalendar - LotusScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-readrange-notescalendar)。

## 創建行事曆條目

要創建新的行事曆條目，可以使用 `CreateEntry` 方法。此方法接受 `iCalendar` 格式的字串作為參數。

```lotusscript
Dim icalendarData As String
icalendarData = "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Team Meeting\nDTSTART:20261001T090000\nDTEND:20261001T100000\nEND:VEVENT\nEND:VCALENDAR"

Dim newEntry As NotesCalendarEntry
Set newEntry = calendar.CreateEntry(icalendarData)
```

## 管理行事曆條目

創建行事曆條目後，可以使用 `NotesCalendarEntry` 類別的方法來管理這些條目。例如，使用 `Update` 方法來更新條目，或使用 `Remove` 方法來刪除條目。

```lotusscript
' 更新條目
newEntry.Update(icalendarData)

' 刪除條目
newEntry.Remove(True)
```

`NotesCalendarEntry` 類別的詳細資訊可參考 [NotesCalendarEntry (LotusScript)](https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_NOTESCALENDARENTRY_CLASS.html)。

## 處理行事曆通知

對於未處理的邀請或通知，可以使用 `NotesCalendarNotice` 類別來處理。透過 `GetNewInvitations` 方法，可以獲取新的邀請，然後使用 `Accept`、`Decline` 等方法來回應。

```lotusscript
Dim notices As Variant
notices = calendar.GetNewInvitations()

Forall notice In notices
    Call notice.Accept
End Forall
```

## 結論

透過 `NotesCalendar`、`NotesCalendarEntry` 和 `NotesCalendarNotice` 類別，開發者可以在 LotusScript 中有效地讀取和寫入 HCL Domino 的行事曆資料。這些功能為自動化行事曆管理提供了強大的工具。

更多關於使用 LotusScript 操作行事曆的資訊，請參考 [NotesCalendar: Reading and Writing Domino Calendar Data with LotusScript](https://bryanhsiao.github.io/domino-news/en/posts/notes-calendar/)。
