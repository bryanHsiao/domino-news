---
title: "Working with NotesCalendar in LotusScript: A Comprehensive Guide"
description: "Explore how to utilize the NotesCalendar class in LotusScript to access and manage calendar functionalities in HCL Notes, including creating, reading, and managing calendar entries."
pubDate: "2026-08-10T07:34:10+08:00"
lang: "en"
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

## Introduction

In HCL Notes, the calendar is an essential component of daily operations. With the `NotesCalendar` class in LotusScript, developers can programmatically access and manage calendar functionalities. This article will guide you through using the `NotesCalendar` class to create, read, and manage calendar entries.

## Accessing the User's Calendar

To access the current user's calendar, first obtain the user's mail database and then use the `getCalendar` method of `NotesSession` to retrieve the `NotesCalendar` object.

```lotusscript
Dim session As New NotesSession
Dim maildb As NotesDatabase
Dim calendar As NotesCalendar

Set maildb = session.CurrentDatabase
Set calendar = session.getCalendar(maildb)
```

## Creating a New Calendar Entry

To create a new entry in the calendar, use the `CreateEntry` method of `NotesCalendar`. The following example demonstrates how to create a new meeting entry.

```lotusscript
Dim entry As NotesCalendarEntry
Dim icalendar As String

icalendar = "BEGIN:VCALENDAR\n" & _
            "BEGIN:VEVENT\n" & _
            "DTSTART:20230810T090000\n" & _
            "DTEND:20230810T100000\n" & _
            "SUMMARY:Project Meeting\n" & _
            "END:VEVENT\n" & _
            "END:VCALENDAR"

Set entry = calendar.CreateEntry(icalendar)
```

In this example, the `icalendar` string contains event information formatted according to the iCalendar standard. For more details on the `CreateEntry` method, refer to the [NotesCalendar class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html).

## Reading Calendar Entries

To read calendar entries within a specific time range, use the `ReadRange` method of `NotesCalendar`. The following example shows how to read calendar entries for today and tomorrow.

```lotusscript
Dim dt1 As NotesDateTime
Dim dt2 As NotesDateTime
Dim entries As String

Set dt1 = session.CreateDateTime("Today 08:00")
Set dt2 = session.CreateDateTime("Tomorrow 17:00")

entries = calendar.ReadRange(dt1, dt2)
```

This method returns calendar entry information in iCalendar format. For more information on the `ReadRange` method, see the [NotesCalendar class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html).

## Managing Calendar Notices

The `NotesCalendarNotice` class is used to handle calendar notices, such as meeting invitations. To retrieve new invitations, use the `GetNewInvitations` method of `NotesCalendar`.

```lotusscript
Dim notices As Variant
Dim notice As NotesCalendarNotice

notices = calendar.GetNewInvitations()
Forall n In notices
    Set notice = n
    ' Process the notice
End Forall
```

For more information on the `NotesCalendarNotice` class, refer to the [NotesCalendarNotice class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARNOTICE_CLASS.html).

## Conclusion

By leveraging the `NotesCalendar` class in LotusScript, developers can effectively access and manage the calendar functionalities of HCL Notes. Whether it's creating new calendar entries, reading existing ones, or handling calendar notices, the `NotesCalendar` class provides a comprehensive set of methods to meet development needs.
