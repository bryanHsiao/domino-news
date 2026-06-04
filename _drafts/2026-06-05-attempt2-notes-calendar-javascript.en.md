---
title: "Manipulating NotesCalendar with JavaScript: A Comprehensive Guide"
description: "This tutorial introduces how to manipulate NotesCalendar using JavaScript in the HCL Domino environment, covering reading, creating, and managing calendar entries."
pubDate: "2026-06-05T07:31:34+08:00"
lang: "en"
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

## Introduction

In the HCL Domino environment, developers can manipulate `NotesCalendar` using JavaScript to read, create, and manage calendar entries. This is particularly useful for integrating calendar functionalities into web applications.

## Initializing NotesSession

First, initialize the `NotesSession` object, which serves as the entry point to access other Domino objects.

```javascript
var session = sessionAsSigner;
```

The `sessionAsSigner` object assigns credentials based on the signer of the XPages design element and is restricted by the application's ACL and the security tab of the server's Domino Directory entry. For more information, refer to [NotesSession (JavaScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notessession-javascript).

## Accessing NotesCalendar

Using the `NotesSession` object, you can access the current user's `NotesCalendar` object.

```javascript
var calendar = session.getCalendar();
```

The `getCalendar` method returns the calendar for the current user. Detailed information can be found in [NotesCalendar (JavaScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendar-javascript).

## Reading Calendar Entries

To read calendar entries within a specific date range, use the `readRange` method.

```javascript
var startDate = new Date('2026-06-01T00:00:00');
var endDate = new Date('2026-06-30T23:59:59');
var entries = calendar.readRange(startDate, endDate);
```

The `readRange` method returns a collection of `NotesCalendarEntry` objects within the specified date range. More information is available in [NotesCalendarEntry (JavaScript)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=domino-notescalendarentry-javascript).

## Creating a New Calendar Entry

To create a new calendar entry, use the `createEntry` method.

```javascript
var icalString = "BEGIN:VCALENDAR\n" +
                 "BEGIN:VEVENT\n" +
                 "SUMMARY:Meeting\n" +
                 "DTSTART:20260615T090000\n" +
                 "DTEND:20260615T100000\n" +
                 "END:VEVENT\n" +
                 "END:VCALENDAR";
var newEntry = calendar.createEntry(icalString);
```

The `createEntry` method accepts an iCalendar format string and returns a new `NotesCalendarEntry` object.

## Updating a Calendar Entry

To update an existing calendar entry, use the `update` method.

```javascript
var entry = entries.getFirstEntry();
entry.setSubject("Updated Meeting Subject");
entry.update();
```

The `setSubject` method sets the subject of the entry, and the `update` method saves the changes.

## Deleting a Calendar Entry

To delete a calendar entry, use the `remove` method.

```javascript
var entry = entries.getFirstEntry();
entry.remove();
```

The `remove` method deletes the specified calendar entry.

## Conclusion

By following the steps above, developers can manipulate `NotesCalendar` using JavaScript in the HCL Domino environment, enabling the reading, creation, updating, and deletion of calendar entries. This provides robust support for integrating calendar functionalities into web applications.
