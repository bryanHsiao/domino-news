---
title: "Working with NotesCalendar in LotusScript: A Comprehensive Guide"
description: "Explore how to access and manage HCL Domino's NotesCalendar using LotusScript, including examples on creating, reading, and managing calendar events."
pubDate: "2026-07-22T07:57:39+08:00"
lang: "en"
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

In HCL Domino, the `NotesCalendar` class provides functionalities to access and manage calendars. Using LotusScript, developers can create, read, and manage calendar events. This article introduces how to use the `NotesCalendar` class with practical examples.

## Accessing the User's Calendar

First, you need to access the current user's calendar. This can be achieved using the `NotesSession` and `NotesDatabase` objects:

```lotusscript
Dim session As New NotesSession
Dim maildb As NotesDatabase
Dim calendar As NotesCalendar

Set maildb = session.CurrentDatabase
Set calendar = session.getCalendar(maildb)
```

In the code above, the `session.getCalendar(maildb)` method returns a `NotesCalendar` object representing the current user's calendar.

## Reading Calendar Entries within a Specific Time Range

To read calendar entries within a specific time range, you can use the `ReadRange` method. This method returns a summary of entries in the `iCalendar` format:

```lotusscript
Dim startDate As NotesDateTime
Dim endDate As NotesDateTime
Dim calendarEntries As String

Set startDate = session.CreateDateTime("2026/07/21 08:00 AM")
Set endDate = session.CreateDateTime("2026/07/22 05:00 PM")

calendarEntries = calendar.ReadRange(startDate, endDate)
```

In this example, the `ReadRange` method returns a summary of calendar entries between 8:00 AM on July 21, 2026, and 5:00 PM on July 22, 2026.

## Creating a New Calendar Entry

To create a new calendar entry, you can use the `CreateEntry` method. This method requires an `iCalendar` formatted string as input:

```lotusscript
Dim icalEntry As String
Dim newEntry As NotesCalendarEntry

icalEntry = "BEGIN:VCALENDAR\n" & _
            "VERSION:2.0\n" & _
            "BEGIN:VEVENT\n" & _
            "DTSTART:20260721T140000Z\n" & _
            "DTEND:20260721T150000Z\n" & _
            "SUMMARY:New Meeting\n" & _
            "END:VEVENT\n" & _
            "END:VCALENDAR"

Set newEntry = calendar.CreateEntry(icalEntry)
```

In this example, the `CreateEntry` method uses an `iCalendar` formatted string to create a new calendar event starting at 2:00 PM on July 21, 2026, lasting one hour, with the subject "New Meeting".

## Retrieving a Specific Calendar Entry

To retrieve a specific calendar entry, you can use the `GetEntry` method, which requires the unique identifier (UID) of the entry:

```lotusscript
Dim entryUID As String
Dim calendarEntry As NotesCalendarEntry

entryUID = "F0A3694E4E7E20938525790F004D370A-Lotus_Notes_Generated"
Set calendarEntry = calendar.GetEntry(entryUID)
```

In this example, the `GetEntry` method returns the calendar entry with the specified UID.

## Reading Details of a Calendar Entry

Once you have a `NotesCalendarEntry` object, you can use its `Read` method to obtain the details of the entry in `iCalendar` format:

```lotusscript
Dim entryDetails As String

entryDetails = calendarEntry.Read()
```

In this example, the `Read` method returns the details of the calendar entry.

## Conclusion

By utilizing the `NotesCalendar` and `NotesCalendarEntry` classes, developers can access and manage HCL Domino's calendar using LotusScript. These classes provide a rich set of methods and properties, allowing developers to create, read, and manage calendar events. For more detailed information, refer to the [NotesCalendar (LotusScript)](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendar-lotusscript) and [NotesCalendarEntry (LotusScript)](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-notescalendarentry-lotusscript) documentation.
