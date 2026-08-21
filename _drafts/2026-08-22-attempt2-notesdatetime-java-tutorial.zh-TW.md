---
title: "在 Java 中使用 NotesDateTime：全面指南"
description: "深入探討如何在 Java 中使用 NotesDateTime 類別，包括其屬性、方法，以及與 Java 日期時間類別的互動。"
pubDate: "2026-08-22T07:26:13+08:00"
lang: "zh-TW"
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

## 簡介

在 HCL Domino 的 Java API 中，`NotesDateTime` 類別用於表示日期和時間。理解如何有效地使用此類別對於開發基於 Domino 的 Java 應用程式至關重要。

## 創建 NotesDateTime 對象

要創建 `NotesDateTime` 對象，您可以使用 `Session` 類別的 `createDateTime` 方法。此方法接受 `String`、`java.util.Date` 或 `java.util.Calendar` 作為參數。

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

在此示例中，`Calendar` 用於設置特定的日期和時間，然後通過 `createDateTime` 方法創建 `DateTime` 對象。這種方法避免了對區域設置的依賴。

## 設置和獲取日期時間

創建 `DateTime` 對象後，您可以使用其方法來設置或獲取日期和時間。

```java
// 設置當前時間
dt.setNow();

// 獲取本地時間
String localTime = dt.getLocalTime();
System.out.println("Local time = " + localTime);

// 獲取 GMT 時間
String gmtTime = dt.getGMTTime();
System.out.println("GMT time = " + gmtTime);
```

`setNow` 方法將 `DateTime` 對象設置為當前日期和時間。`getLocalTime` 和 `getGMTTime` 方法分別返回本地時間和格林威治標準時間的字符串表示。

## 調整日期時間

`DateTime` 類別提供了多種方法來調整日期和時間。

```java
// 增加一天
dt.adjustDay(1);

// 增加一小時
dt.adjustHour(1);

// 增加一分鐘
dt.adjustMinute(1);

// 增加一秒
dt.adjustSecond(1);

// 增加一個月
dt.adjustMonth(1);

// 增加一年
dt.adjustYear(1);
```

這些方法允許您根據需要調整日期和時間。

## 與 Java 日期時間類別的互動

`DateTime` 類別提供了 `toJavaDate` 方法，允許將 `DateTime` 對象轉換為 `java.util.Date` 對象。

```java
java.util.Date javaDate = dt.toJavaDate();
System.out.println("Java Date = " + javaDate);
```

這使得在 Domino 和 Java 標準日期時間類別之間進行轉換變得簡單。

## 注意事項

- **時區處理**：當創建新的 `DateTime` 對象時，Domino 的時區設置會影響其 `TimeZone` 屬性。例如，如果代碼在設置為東部標準時間的計算機上運行，則新 `DateTime` 對象的 `TimeZone` 屬性將自動設置為 5。

- **區域設置依賴**：當從字符串設置日期時間時，確保字符串格式與操作系統的區域設置匹配，以避免解析錯誤。

通過理解和有效地使用 `NotesDateTime` 類別，開發人員可以在 Java 中更好地處理 Domino 的日期和時間，確保應用程式的準確性和可靠性。

有關更多詳細信息，請參閱 [DateTime (Java)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATETIME_CLASS_JAVA.html) 和 [DateTime 類別示例](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_NOTESDATETIME_CLASS_JAVA.html)。
