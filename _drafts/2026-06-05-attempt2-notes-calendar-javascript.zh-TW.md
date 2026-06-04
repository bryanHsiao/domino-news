---
title: "使用 JavaScript 操作 NotesCalendar：完整指南"
description: "本教程介紹如何在 HCL Domino 環境中，使用 JavaScript 操作 NotesCalendar，涵蓋日曆的讀取、創建和管理。"
pubDate: "2026-06-05T07:31:34+08:00"
lang: "zh-TW"
slug: "notes-calendar-javascript"
tags:
  - "Tutorial"
  - "JavaScript"
  - "Domino Server"
sources:
  - title: "NotesCalendar (JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendar-javascript"
  - title: "NotesCalendarEntry (JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendarentry-javascript"
  - title: "NotesSession (JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notessession-javascript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendar-javascript, https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendarentry-javascript, https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notessession-javascript
attempt: 2
slug: notes-calendar-javascript
-->

## 簡介

在 HCL Domino 環境中，開發者可以使用 JavaScript 操作 NotesCalendar，以讀取、創建和管理日曆事件。這對於需要在 Web 應用程式中整合日曆功能的開發者特別有用。

## 初始化 NotesSession

首先，需要初始化 `NotesSession` 物件，這是訪問其他 Domino 物件的起點。

```javascript
var session = sessionAsSigner;
```

`sessionAsSigner` 物件根據 XPages 設計元素的簽署者分配憑證，並受應用程式的 ACL 和伺服器的 Domino 目錄條目安全標籤的限制。更多資訊請參閱 [NotesSession (JavaScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notessession-javascript)。

## 獲取 NotesCalendar

使用 `NotesSession` 物件，可以獲取當前用戶的 `NotesCalendar` 物件。

```javascript
var calendar = session.getCalendar();
```

`getCalendar` 方法返回當前用戶的日曆。詳細資訊請參閱 [NotesCalendar (JavaScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendar-javascript)。

## 讀取日曆條目

要讀取特定日期範圍內的日曆條目，可以使用 `readRange` 方法。

```javascript
var startDate = new Date('2026-06-01T00:00:00');
var endDate = new Date('2026-06-30T23:59:59');
var entries = calendar.readRange(startDate, endDate);
```

`readRange` 方法返回指定日期範圍內的 `NotesCalendarEntry` 物件集合。更多資訊請參閱 [NotesCalendarEntry (JavaScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendarentry-javascript)。

## 創建新的日曆條目

要創建新的日曆條目，可以使用 `createEntry` 方法。

```javascript
var icalString = "BEGIN:VCALENDAR\n" +
                 "BEGIN:VEVENT\n" +
                 "SUMMARY:會議\n" +
                 "DTSTART:20260615T090000\n" +
                 "DTEND:20260615T100000\n" +
                 "END:VEVENT\n" +
                 "END:VCALENDAR";
var newEntry = calendar.createEntry(icalString);
```

`createEntry` 方法接受 iCalendar 格式的字符串，並返回新的 `NotesCalendarEntry` 物件。

## 更新日曆條目

要更新現有的日曆條目，可以使用 `update` 方法。

```javascript
var entry = entries.getFirstEntry();
entry.setSubject("更新後的會議主題");
entry.update();
```

`setSubject` 方法設置條目的主題，`update` 方法保存更改。

## 刪除日曆條目

要刪除日曆條目，可以使用 `remove` 方法。

```javascript
var entry = entries.getFirstEntry();
entry.remove();
```

`remove` 方法刪除指定的日曆條目。

## 結論

通過上述步驟，開發者可以在 HCL Domino 環境中，使用 JavaScript 操作 NotesCalendar，實現日曆的讀取、創建、更新和刪除功能。這為 Web 應用程式的日曆整合提供了強大的支持。
