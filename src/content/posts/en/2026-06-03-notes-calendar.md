---
title: "NotesCalendar: Reading and Writing Domino Calendar Data with LotusScript"
description: "Domino calendar data isn't stored in ordinary documents — it lives in mail.nsf in iCalendar (RFC 5545) format, accessible only through three dedicated classes. This article covers NotesCalendar (the calendar object, entry point), NotesCalendarEntry (a single event), and NotesCalendarNotice (a meeting invitation or update notice): how to obtain them via session.GetCalendar, writing new entries with iCalendar-format strings, batch-reading a date range with ReadRange, fetching unprocessed invitations with GetNewInvitations, accepting or declining with NoticeAction, and the ConvertMIME=False prerequisite that will silently corrupt calendar data if you forget it."
pubDate: 2026-06-03T07:30:00+08:00
lang: en
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

You want to automate Domino calendar entries — auto-create weekly stand-up meetings, sync external scheduling systems (HR, project management) into mail.nsf, or build an agent that auto-accepts certain types of invitations. Then you read the docs and discover: calendar data isn't stored in ordinary documents. It lives in mail.nsf in **iCalendar format (RFC 5545)**, accessible only through three specialised classes.

This article covers how all three classes work together, from creating entries to reading a date range to handling meeting invitations.

---

## TL;DR

- **Three classes, three roles**: [`NotesCalendar`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS.html) (the calendar object, entry point), [`NotesCalendarEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARENTRY_CLASS.html) (a single event or recurring series), [`NotesCalendarNotice`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDARNOTICE_CLASS.html) (a meeting invitation or update notice)
- **Entry point**: `session.GetCalendar(db)` — `db` must be a mail database (`IsMailDatabase = True`)
- **Creating entries**: `CreateEntry(iCalString)` takes an RFC 5545 iCalendar string — you're not setting individual fields
- **`ReadRange`** batch-reads all events in a date range as an iCalendar string
- **`GetNewInvitations`** returns unprocessed invitations as `NotesCalendarNotice` objects; `NoticeAction` accepts or declines them
- **Set `session.ConvertMIME = False` before any calendar operation** — the default True causes MIME-to-rich-text conversion that silently corrupts calendar structure

---

## How the three classes divide the work

| Class | Represents | How to obtain |
|---|---|---|
| `NotesCalendar` | The user's whole calendar | `session.GetCalendar(mailDb)` |
| `NotesCalendarEntry` | A single event, to-do, or recurring series | `calendar.GetEntry(uid)` or `calendar.CreateEntry(iCalString)` |
| `NotesCalendarNotice` | An invitation or update notice | Returned by `calendar.GetNewInvitations()` |

---

## Getting a NotesCalendar object

```lotusscript
Dim session As New NotesSession
Dim mailDb As NotesDatabase

' Open the user's mail.nsf
Set mailDb = session.GetDatabase("MailServer/ACME", "mail/jsmith.nsf")
If Not mailDb.IsOpen Then Call mailDb.Open("", "")

' Obtain the calendar object (must be a mail database)
Dim cal As NotesCalendar
Set cal = session.GetCalendar(mailDb)
```

`GetCalendar` only accepts a mail database (`db.IsMailDatabase = True`). Passing a regular NSF throws an error.

---

## CreateEntry — write a new calendar event

`CreateEntry` takes an iCalendar-format string and returns the new `NotesCalendarEntry`:

```lotusscript
' Create a meeting on 2026-06-03 from 10:00 to 11:00 (UTC)
Dim iCalStr As String
iCalStr = "BEGIN:VCALENDAR" & Chr(13) & Chr(10) & _
          "VERSION:2.0" & Chr(13) & Chr(10) & _
          "BEGIN:VEVENT" & Chr(13) & Chr(10) & _
          "DTSTART:20260603T020000Z" & Chr(13) & Chr(10) & _
          "DTEND:20260603T030000Z" & Chr(13) & Chr(10) & _
          "SUMMARY:Monday stand-up" & Chr(13) & Chr(10) & _
          "LOCATION:Conference Room A" & Chr(13) & Chr(10) & _
          "END:VEVENT" & Chr(13) & Chr(10) & _
          "END:VCALENDAR"

Dim entry As NotesCalendarEntry
Set entry = cal.CreateEntry(iCalStr)

If Not (entry Is Nothing) Then
    Print "Created — UID: " & entry.UID
End If
```

Key points:
- Use **UTC times (trailing Z)** — local timezone strings interact badly with server timezone settings
- Line endings must be **CRLF (`Chr(13) & Chr(10)`)** — RFC 5545 requires it
- When `AutoSendNotices = True`, a VEVENT with ATTENDEE lines will automatically send invitation emails

---

## ReadRange — batch-read a date range

```lotusscript
Dim startDt As New NotesDateTime("2026-06-03")
Dim endDt As New NotesDateTime("2026-06-07 23:59:00")

' Returns all events in the range as an iCalendar string
Dim iCalResult As String
iCalResult = cal.ReadRange(startDt, endDt)

Print "This week's calendar — " & Len(iCalResult) & " bytes of iCal"
```

The return value is a full iCalendar string containing all matching VEVENTs. Parse it with string operations or a proper parser. `EntriesProcessed` records how many entries were included.

---

## GetNewInvitations — fetch unprocessed invitations

```lotusscript
' Returns all unresponded invitations
Dim invitations As Variant
invitations = cal.GetNewInvitations()

If IsArray(invitations) Then
    Dim i As Integer
    For i = 0 To UBound(invitations)
        Dim notice As NotesCalendarNotice
        Set notice = invitations(i)
        Print "Invitation: " & notice.Summary
        Print "Organiser: " & notice.Organizer
    Next
End If
```

Returns an array of `NotesCalendarNotice` objects — one per outstanding invitation.

---

## NoticeAction — accept, decline, or tentative

```lotusscript
Dim notice As NotesCalendarNotice
' (obtained from GetNewInvitations)

' Accept
Call notice.NoticeAction(CALACTION_ACCEPT, "Confirmed, see you there", Nothing, False)

' Decline
Call notice.NoticeAction(CALACTION_DECLINE, "Schedule conflict that day", Nothing, False)

' Tentative
Call notice.NoticeAction(CALACTION_TENTATIVE, "", Nothing, False)
```

Action constants:

| Constant | Value | Meaning |
|---|---|---|
| `CALACTION_ACCEPT` | 1 | Accept |
| `CALACTION_DECLINE` | 2 | Decline |
| `CALACTION_TENTATIVE` | 3 | Tentative |
| `CALACTION_REQUESTINFO` | 4 | Request more information |

---

## The trap: ConvertMIME must be False

Calendar data in mail.nsf is stored as MIME. If `session.ConvertMIME` is `True` (the default), Domino auto-converts MIME to rich text — which destroys the iCalendar structure and produces unpredictable results.

**Always set this before any calendar operation:**

```lotusscript
session.ConvertMIME = False

' ... all calendar operations ...

' Reset when done
session.ConvertMIME = True
```

This is session-scoped, not persistent. But skip it and even a successful `GetCalendar` call can produce corrupted data on subsequent reads.

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesCalendar` / `NotesCalendarEntry` / `NotesCalendarNotice` |
| Java | `lotus.domino.Calendar` / `CalendarEntry` / `CalendarNotice` (drop the `Notes` prefix; `.recycle()` when done) |
| SSJS | No direct equivalent — calendar operations in XPages are typically done via the Domino REST API |
