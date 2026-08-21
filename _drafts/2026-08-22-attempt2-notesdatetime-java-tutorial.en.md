---
title: "Working with NotesDateTime in Java: A Comprehensive Guide"
description: "An in-depth exploration of using the NotesDateTime class in Java, covering its properties, methods, and interactions with Java's date-time classes."
pubDate: "2026-08-22T07:26:13+08:00"
lang: "en"
slug: "notesdatetime-java-tutorial"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "DateTime (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATETIME_CLASS_JAVA.html"
  - title: "Examples: DateTime class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_NOTESDATETIME_CLASS_JAVA.html"
  - title: "NotesCalendar (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCALENDAR_CLASS_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATETIME_CLASS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdatetime-java-tutorial
-->

## Introduction

In HCL Domino's Java API, the `NotesDateTime` class represents date and time. Understanding how to effectively use this class is crucial for developing Java applications based on Domino.

## Creating a NotesDateTime Object

To create a `NotesDateTime` object, you can use the `createDateTime` method of the `Session` class. This method accepts a `String`, `java.util.Date`, or `java.util.Calendar` as a parameter.

```java
import lotus.domino.*;
import java.util.Calendar;

public class CreateDateTimeExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Calendar calendar = Calendar.getInstance();
            calendar.set(2023, Calendar.MARCH, 4, 6, 7, 8);
            DateTime dt = session.createDateTime(calendar);
            System.out.println("Local time = " + dt.getLocalTime());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

In this example, `Calendar` is used to set a specific date and time, which is then used to create a `DateTime` object via the `createDateTime` method. This approach avoids dependencies on regional settings.

## Setting and Getting Date and Time

After creating a `DateTime` object, you can use its methods to set or get the date and time.

```java
// Set to current time
dt.setNow();

// Get local time
String localTime = dt.getLocalTime();
System.out.println("Local time = " + localTime);

// Get GMT time
String gmtTime = dt.getGMTTime();
System.out.println("GMT time = " + gmtTime);
```

The `setNow` method sets the `DateTime` object to the current date and time. The `getLocalTime` and `getGMTTime` methods return string representations of the local time and Greenwich Mean Time, respectively.

## Adjusting Date and Time

The `DateTime` class provides various methods to adjust the date and time.

```java
// Add one day
dt.adjustDay(1);

// Add one hour
dt.adjustHour(1);

// Add one minute
dt.adjustMinute(1);

// Add one second
dt.adjustSecond(1);

// Add one month
dt.adjustMonth(1);

// Add one year
dt.adjustYear(1);
```

These methods allow you to modify the date and time as needed.

## Interacting with Java's Date-Time Classes

The `DateTime` class offers the `toJavaDate` method, enabling conversion of a `DateTime` object to a `java.util.Date` object.

```java
java.util.Date javaDate = dt.toJavaDate();
System.out.println("Java Date = " + javaDate);
```

This facilitates seamless conversion between Domino and Java's standard date-time classes.

## Important Considerations

- **Time Zone Handling**: When creating a new `DateTime` object, Domino's time zone setting determines its `TimeZone` property. For instance, if the code runs on a machine set to Eastern Standard Time, the `TimeZone` property of the new `DateTime` object is automatically set to 5.

- **Regional Settings Dependency**: When setting the date and time from a string, ensure that the string format matches the operating system's regional settings to avoid parsing errors.

By understanding and effectively utilizing the `NotesDateTime` class, developers can better handle Domino's dates and times in Java, ensuring the accuracy and reliability of applications.

For more detailed information, refer to the [DateTime (Java)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATETIME_CLASS_JAVA.html) and [Examples: DateTime class](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_NOTESDATETIME_CLASS_JAVA.html).
