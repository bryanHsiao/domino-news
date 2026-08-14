---
title: "在 Java 裡處理 Notes 日期，為什麼不能直接用 java.util.Date？"
description: "在 Java 裡處理 Notes 的日期，你不能直接用 java.util.Date——中間隔著一個 lotus.domino.DateTime。它是個背後連著 handle 的重量級後端物件，在迴圈裡不 recycle 就漏記憶體；它用字串在存日期、壞值會丟例外；而 toJavaDate() 是你把它換成 Java 自家時間型別、再接上 java.time 的那座橋。這篇講 Java 版 DateTime 怎麼建、怎麼讀寫、怎麼跟 Java 的時間世界互轉，以及那個從 LotusScript 帶不過來的 recycle 負擔。"
pubDate: 2026-08-15T07:30:00+08:00
lang: zh-TW
slug: java-datetime
tags:
  - "Java"
sources:
  - title: "DateTime class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS_JAVA.html"
  - title: "Session.createDateTime (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATETIME_METHOD_JAVA.html"
  - title: "DateTime.toJavaDate (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TOJAVADATE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-datetime.webp"
coverStyle: "bw-grain"
---

在 Java 裡要對一個 Notes 日期做點事——比對、加減天數、存回文件——你會發現一件不太順手的事：你不能直接用 `java.util.Date`。Domino 的日期在 Java API 裡是一個叫 [`DateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS_JAVA.html) 的類別，而它跟 Java 自家的時間型別是兩個世界。你得先進到 `DateTime`、做完事、再換回來。

這個 `DateTime` 有三個從 LotusScript 過來的人會卡住的地方：它是個**會漏記憶體的後端物件**、它用**字串**在存日期、而它跟 `java.util.Date` 之間要靠一座叫 `toJavaDate()` 的橋來回。這篇把這三件事講清楚。

---

## 重點摘要

- **`DateTime` 是後端物件，不是 Java 日期**：官方說它「represents a date and time」、繼承自 `Base`。它背後連著一個垃圾回收看不到的 handle——在迴圈裡建了不 `recycle` 就會漏。
- **用 `session.createDateTime(...)` 建**：吃 `String`、`java.util.Date` 或 `java.util.Calendar` 三種；時區會依 Domino 的區域設定自動帶。傳字串時，壞值或空字串會丟「Invalid date」例外。
- **`toJavaDate()` 是出口**：把 `DateTime` 換成 `java.util.Date`，再從那裡接上現代的 `java.time`。
- **讀寫用字串屬性**：`getDateOnly` / `getTimeOnly` / `getGMTTime` / `getLocalTime` 回的都是字串；`getLocalTime` 可寫。
- **日期運算在物件上做**：`setNow`、`adjustDay` / `adjustHour` / `adjustMonth` / `adjustYear`、`timeDifference`（回兩個時間相差幾秒）。

---

## 它是什麼：一個代表日期的後端物件

官方對 `DateTime` 的定義很簡短——它「represents a date and time」，繼承自 `Base`，被 `Session`、`Document`、`Database`、`View` 等類別持有。關鍵在「繼承自 `Base`」這一句：跟 `Document`、`Session` 一樣，`DateTime` 是一個重量級的後端物件，背後連著一個 C handle。

這就帶出它最該記住的性格：**它會漏記憶體**。你在一個跑上萬份文件的迴圈裡，每份都 `session.createDateTime(...)` 或從欄位讀出一個 `DateTime`，那些物件就會一路堆積。這正是站上 [recycle() 那篇](/domino-news/posts/java-recycle-memory)講的坑，`DateTime` 是其中最容易被忽略的一種——因為它看起來就只是個「日期」，不像 `Document` 那麼「重」。但在 Java API 裡，日期一樣要收。

## 怎麼建：createDateTime 的三種入口

`DateTime` 不是 `new` 出來的，是跟 `Session` 要的。[`createDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATETIME_METHOD_JAVA.html) 有三個 overload：

```java
public DateTime createDateTime(String date)            throws NotesException
public DateTime createDateTime(java.util.Date date)    throws NotesException
public DateTime createDateTime(java.util.Calendar date) throws NotesException
```

- 傳 **`String`**：最直覺，但也最危險——官方明講「An invalid date-time or empty string results in an 'Invalid date' exception.」壞格式或空字串會直接丟例外，所以字串來源不可信時要包 try/catch。
- 傳 **`java.util.Date`**：從 Java 自家的日期建，最乾淨。
- 傳 **`java.util.Calendar`**：連時區一起帶（Release 6 起支援）。

時區的部分，官方說建出來的 `DateTime` 會依 Domino 的區域設定自動帶時區——這件事跟 LotusScript 一致，但在 Java 裡你更常需要明確處理，往下看。

## 那座橋：toJavaDate()

`DateTime` 自己不好拿來做現代日期運算，真正的出口是 [`toJavaDate()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TOJAVADATE_METHOD_JAVA.html)：

```java
public java.util.Date toJavaDate() throws NotesException
```

官方一句話——它「Converts a Notes date and time into a java.util.Date object.」一旦你有了 `java.util.Date`，就從 Domino 的時間世界踏進了 Java 自己的時間世界，接下來要接上現代的 `java.time` 也就一步之遙：

```java
java.util.Date jd = dt.toJavaDate();
java.time.LocalDateTime ldt =
    jd.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
```

（後面這段是純 Java、不是 Domino API——但它是你把 Notes 日期接進 `LocalDate` / `LocalDateTime` 做正經日期運算的實務路徑。`DateTime` 適合「跟 Domino 溝通」，`java.time` 適合「算」。）

## 讀與寫：屬性都是字串

`DateTime` 的幾個讀取屬性回的都是**字串**，不是數字：

- `getDateOnly()`：日期部分的字串。
- `getTimeOnly()`：時間部分的字串。
- `getGMTTime()`：轉成 GMT 的字串。
- `getLocalTime()`：本地時區的字串，而且這個是**可寫**的。
- `getTimeZone()`：一個整數，表示轉 GMT 要加幾小時。

要算的話，運算方法直接作用在物件上：`setNow()` 把它設成現在、`adjustDay(n)` / `adjustHour(n)` / `adjustMonth(n)` / `adjustYear(n)` 加減對應單位、`timeDifference(other)` 回兩個 `DateTime` 相差幾秒。這些跟 LotusScript 的 `NotesDateTime` 幾乎一對一，差別只在——每個你建出來的中間 `DateTime`，用完都要收。

## 一個完整的例子

建一個日期、算三十天後、換成 Java 型別、記得收：

```java
DateTime due = session.createDateTime("2026-08-15");   // 字串壞值會丟例外
due.adjustDay(30);                                     // 就地 +30 天

java.util.Date jd = due.toJavaDate();                  // 過橋到 Java 時間世界

DateTime now = session.createDateTime("Today");
now.setNow();                                          // 覆蓋種子、設成此刻
int secs = due.timeDifference(now);                    // due 減 now：距到期還有幾秒（timeDifferenceDouble 回 double）

due.recycle();                                         // 後端物件，用完就收
now.recycle();
```

那兩行 `recycle()` 不是可有可無——在會重複執行的程式（agent、迴圈）裡，少收的每一個 `DateTime` 都在累積。

## 同類別在其他語言

- **LotusScript**：`NotesDateTime` 提供幾乎一樣的 `AdjustDay`、`TimeDifference`、`LocalTime`，但**記憶體是自動的**——你不必手動 recycle，這是 LS 在這個角落比 Java 舒服的地方。站上有 [NotesDateTime](/domino-news/posts/notes-datetime) 與 [時區處理](/domino-news/posts/notes-datetime-timezone) 兩篇。
- **SSJS／XPages**：底層就是同一個 `lotus.domino.DateTime`，`createDateTime`、`toJavaDate` 都在；一樣是後端物件，一樣建議收。你也可以直接在 SSJS 裡走 `java.util.Date` / `java.time`——參見站上 [XPages 直接用 java.util.Vector 操作多值](/domino-news/posts/ssjs-vector-multivalue) 的同一種「直接用 Java 型別」思路。
