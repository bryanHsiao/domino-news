---
title: "使用 NotesDateTime 類別在 Java 中處理 Domino 日期時間"
description: "本教程介紹如何在 Java 中使用 NotesDateTime 類別來處理 HCL Domino 的日期和時間，包括創建、修改和比較日期時間物件的步驟。"
pubDate: "2026-07-01T07:32:45+08:00"
lang: "zh-TW"
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

## 簡介

在 HCL Domino 的 Java 開發中，處理日期和時間是一個常見的需求。`NotesDateTime` 類別提供了強大的功能，允許開發者創建、修改和比較日期時間物件。本文將介紹如何在 Java 中使用 `NotesDateTime` 類別來有效地處理 Domino 的日期和時間。

## 創建 NotesDateTime 物件

要創建一個 `NotesDateTime` 物件，首先需要獲取當前的 `Session`，然後使用 `createDateTime` 方法來創建日期時間物件。以下是創建當前日期時間的示例：

```java
import lotus.domino.*;

public class DateTimeExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            NotesDateTime dateTime = session.createDateTime("Today");
            System.out.println("當前日期時間: " + dateTime.getLocalTime());
            session.recycle();
            NotesThread.stermThread();
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

在上述代碼中，`createDateTime("Today")` 創建了一個表示當前日期的 `NotesDateTime` 物件。`getLocalTime()` 方法返回本地時間的字符串表示。

## 修改 NotesDateTime 物件

`NotesDateTime` 提供了多種方法來修改日期時間，例如增加或減少天數、月數或年數。以下示例展示了如何將日期增加 7 天：

```java
import lotus.domino.*;

public class DateTimeModification {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            NotesDateTime dateTime = session.createDateTime("Today");
            dateTime.adjustDay(7);
            System.out.println("增加 7 天後的日期時間: " + dateTime.getLocalTime());
            session.recycle();
            NotesThread.stermThread();
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

在這個示例中，`adjustDay(7)` 方法將日期增加了 7 天。

## 比較 NotesDateTime 物件

`NotesDateTime` 允許比較兩個日期時間物件，以確定它們之間的關係。以下示例展示了如何比較兩個日期時間物件：

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
                System.out.println("dateTime1 在 dateTime2 之前。");
            } else if (comparison > 0) {
                System.out.println("dateTime1 在 dateTime2 之後。");
            } else {
                System.out.println("dateTime1 和 dateTime2 相同。");
            }
            session.recycle();
            NotesThread.stermThread();
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

在這個示例中，`timeDifferenceDouble` 方法返回兩個日期時間物件之間的時間差，以秒為單位。根據返回值，可以確定一個日期時間是否在另一個之前、之後或相同。

## 結論

`NotesDateTime` 類別為在 Java 中處理 HCL Domino 的日期和時間提供了豐富的功能。通過創建、修改和比較日期時間物件，開發者可以有效地管理應用程序中的時間相關數據。更多詳細信息，請參閱 [Java 類別 A-Z](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html) 和 [Java 類別編碼指南](https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-java-coding-guidelines)。
