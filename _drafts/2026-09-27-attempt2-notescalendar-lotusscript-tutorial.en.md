---
title: "Working with NotesCalendar in LotusScript: A Comprehensive Guide"
description: "This tutorial provides an in-depth look at using the NotesCalendar class in LotusScript to read and write calendar data in HCL Domino, including creating, reading, and managing calendar entries."
pubDate: "2026-09-27T09:10:04+08:00"
lang: "en"
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

## Introduction

Managing calendar data in HCL Domino is essential for automating meeting schedules, synchronizing with external scheduling systems, or handling invitations programmatically. LotusScript offers the `NotesCalendar` class, enabling developers to access and manipulate calendar data programmatically. This guide delves into using the `NotesCalendar` class to read and write calendar data.

## Obtaining a NotesCalendar Object

To begin working with `NotesCalendar`, first access the current user's mail database and then retrieve the `NotesCalendar` object using the `GetCalendar` method of the `Session` object.

```lotusscript
Dim session As New NotesSession
Dim maildb As NotesDatabase
Dim calendar As NotesCalendar

Set maildb = session.CurrentDatabase
Set calendar = session.GetCalendar(maildb)
```

## Reading Calendar Entries

To read calendar entries within a specific time range, use the `ReadRange` method. This method returns a summary of calendar entries in the specified time frame in `iCalendar` format.

```lotusscript
Dim startDate As New NotesDateTime("2026/09/27 08:00:00")
Dim endDate As New NotesDateTime("2026/09/28 17:00:00")
Dim calendarData As String

calendarData = calendar.ReadRange(startDate, endDate)
```

For more details on the `ReadRange` method, refer to [ReadRange (NotesCalendar - LotusScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-readrange-notescalendar).

## Creating Calendar Entries

To create new calendar entries, use the `CreateEntry` method, which accepts a string in `iCalendar` format as a parameter.

```lotusscript
Dim icalendarData As String
icalendarData = "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Team Meeting\nDTSTART:20261001T090000\nDTEND:20261001T100000\nEND:VEVENT\nEND:VCALENDAR"

Dim newEntry As NotesCalendarEntry
Set newEntry = calendar.CreateEntry(icalendarData)
```

## Managing Calendar Entries

After creating calendar entries, you can manage them using methods from the `NotesCalendarEntry` class. For instance, use the `Update` method to modify an entry or the `Remove` method to delete it.

```lotusscript
' Update entry
newEntry.Update(icalendarData)

' Remove entry
newEntry.Remove(True)
```

For more information on the `NotesCalendarEntry` class, see [NotesCalendarEntry (LotusScript)](https://www.ibm.com/docs/SSVRGU_10.0.0/basic/H_NOTESCALENDARENTRY_CLASS.html).

## Handling Calendar Notices

To process unhandled invitations or notices, use the `NotesCalendarNotice` class. Retrieve new invitations using the `GetNewInvitations` method, and respond with methods like `Accept` or `Decline`.

```lotusscript
Dim notices As Variant
notices = calendar.GetNewInvitations()

Forall notice In notices
    Call notice.Accept
End Forall
```

## Conclusion

By leveraging the `NotesCalendar`, `NotesCalendarEntry`, and `NotesCalendarNotice` classes, developers can effectively read and write calendar data in HCL Domino using LotusScript. These capabilities provide powerful tools for automating calendar management.

For more insights on working with LotusScript to manipulate calendar data, refer to [NotesCalendar: Reading and Writing Domino Calendar Data with LotusScript](https://bryanhsiao.github.io/domino-news/en/posts/notes-calendar/).
