---
title: "Handling Domino Dates and Times in Java with NotesDateTime"
description: "This tutorial introduces how to use the NotesDateTime class in Java to handle HCL Domino dates and times, including steps to create, modify, and compare date-time objects."
pubDate: "2026-07-01T07:32:45+08:00"
lang: "en"
slug: "notes-datetime-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "Java Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html"
  - title: "Java Classes Coding Guidelines"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-java-coding-guidelines"
  - title: "Running a Java program"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_COMPILING_AND_RUNNING_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html" was already cited by [notes-rich-text-navigator-java] on 2026-06-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-datetime-java
-->

## Introduction

In HCL Domino Java development, handling dates and times is a common requirement. The `NotesDateTime` class provides robust functionality, allowing developers to create, modify, and compare date-time objects. This article introduces how to effectively handle Domino dates and times in Java using the `NotesDateTime` class.

## Creating a NotesDateTime Object

To create a `NotesDateTime` object, first obtain the current `Session`, then use the `createDateTime` method to create the date-time object. Below is an example of creating the current date and time:

```java
import lotus.domino.*;

public class DateTimeExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            NotesDateTime dateTime = session.createDateTime("Today");
            System.out.println("Current date and time: " + dateTime.getLocalTime());
            session.recycle();
            NotesThread.stermThread();
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

In the code above, `createDateTime("Today")` creates a `NotesDateTime` object representing the current date. The `getLocalTime()` method returns the local time as a string.

## Modifying a NotesDateTime Object

`NotesDateTime` provides various methods to modify date-time, such as adding or subtracting days, months, or years. The following example demonstrates how to add 7 days to a date:

```java
import lotus.domino.*;

public class DateTimeModification {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            NotesDateTime dateTime = session.createDateTime("Today");
            dateTime.adjustDay(7);
            System.out.println("Date and time after adding 7 days: " + dateTime.getLocalTime());
            session.recycle();
            NotesThread.stermThread();
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

In this example, the `adjustDay(7)` method adds 7 days to the date.

## Comparing NotesDateTime Objects

`NotesDateTime` allows comparing two date-time objects to determine their relationship. The following example demonstrates how to compare two date-time objects:

```java
import lotus.domino.*;

public class DateTimeComparison {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            NotesDateTime dateTime1 = session.createDateTime("Today");
            NotesDateTime dateTime2 = session.createDateTime("Tomorrow");
            int comparison = dateTime1.timeDifferenceDouble(dateTime2);
            if (comparison < 0) {
                System.out.println("dateTime1 is before dateTime2.");
            } else if (comparison > 0) {
                System.out.println("dateTime1 is after dateTime2.");
            } else {
                System.out.println("dateTime1 and dateTime2 are the same.");
            }
            session.recycle();
            NotesThread.stermThread();
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

In this example, the `timeDifferenceDouble` method returns the time difference between two date-time objects in seconds. Based on the return value, you can determine whether one date-time is before, after, or the same as the other.

## Conclusion

The `NotesDateTime` class provides rich functionality for handling HCL Domino dates and times in Java. By creating, modifying, and comparing date-time objects, developers can effectively manage time-related data in applications. For more detailed information, refer to the [Java Classes A-Z](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html) and [Java Classes Coding Guidelines](https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-java-coding-guidelines).
