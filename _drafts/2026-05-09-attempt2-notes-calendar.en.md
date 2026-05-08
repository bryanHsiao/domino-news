---
title: "Managing Calendar Events with the NotesCalendar Class"
description: "A comprehensive guide on using the NotesCalendar class in LotusScript to manage HCL Domino calendar events, including creating, reading, updating, and deleting calendar entries."
pubDate: "2026-05-09T07:25:00+08:00"
lang: "en"
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

## Introduction

In HCL Domino, the `NotesCalendar` class provides a robust interface for developers to access and manage calendar events through LotusScript code. This guide will walk you through how to use the `NotesCalendar` class to create, read, update, and delete calendar entries.

## Obtaining a NotesCalendar Object

To begin using `NotesCalendar`, you first need to obtain `NotesSession` and `NotesDatabase` objects, and then use the `getCalendar` method of `NotesSession` to get a `NotesCalendar` object.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim calendar As NotesCalendar

Set db = session.CurrentDatabase
Set calendar = session.getCalendar(db)
```

## Creating Calendar Entries

You can create new calendar entries using the `createEntry` method, which accepts an iCalendar format string as a parameter.

```lotusscript
Dim icalendar As String
Dim entry As NotesCalendarEntry

icalendar = "BEGIN:VCALENDAR\n" & _
            "BEGIN:VEVENT\n" & _
            "SUMMARY:Meeting\n" & _
            "DTSTART:20230501T090000\n" & _
            "DTEND:20230501T100000\n" & _
            "END:VEVENT\n" & _
            "END:VCALENDAR"

Set entry = calendar.createEntry(icalendar)
```

## Reading Calendar Entries

To read calendar entries, you can use the `getEntries` method, which accepts start and end dates as parameters and returns a collection of matching entries.

```lotusscript
Dim entries As NotesCalendarEntryCollection
Dim startTime As New NotesDateTime("2023/05/01")
Dim endTime As New NotesDateTime("2023/05/31")

Set entries = calendar.getEntries(startTime, endTime)
```

## Updating Calendar Entries

To update existing calendar entries, first retrieve the entry and then use the `replaceItemValue` method to modify its properties.

```lotusscript
Dim entry As NotesCalendarEntry
Dim uid As String

uid = "1234567890"
Set entry = calendar.getEntry(uid)

Call entry.replaceItemValue("Subject", "Updated Meeting Subject")
Call entry.save()
```

## Deleting Calendar Entries

To delete calendar entries, you can use the `remove` method.

```lotusscript
Dim entry As NotesCalendarEntry
Dim uid As String

uid = "1234567890"
Set entry = calendar.getEntry(uid)

Call entry.remove(True)
```

## Conclusion

By leveraging the `NotesCalendar` class, developers can effectively manage HCL Domino calendar events within LotusScript. This guide has covered how to create, read, update, and delete calendar entries, helping you utilize these features to develop applications more efficiently.

For more information on the `NotesCalendar` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESCALENDAR_CLASS.html).
