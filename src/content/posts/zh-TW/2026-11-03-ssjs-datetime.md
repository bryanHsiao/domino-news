---
title: "XPages 的日期有三種,你得知道手上是哪一種"
description: "在 XPages 的 SSJS 裡處理日期,最容易踩的不是某個方法不會用,而是你根本沒意識到手上同時有三種「日期」在流動:後端的 NotesDateTime、Java 層的 java.util.Date、還有 JavaScript 自己的 Date。從文件讀出來的是 NotesDateTime,@Today 給你的卻可能是別的型別,塞錯地方就報錯或存成怪值。這篇講 NotesDateTime 在 SSJS 怎麼建(session.createDateTime)、三種型別怎麼互轉(toJavaDate)、常用方法(adjustDay / setNow / timeDifference / convertToZone),以及兩個最常見的坑——「Today 沒有時間」和「@Today 不一定是 NotesDateTime」。"
pubDate: 2026-11-03T07:30:00+08:00
lang: zh-TW
slug: ssjs-datetime
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesDateTime (JavaScript)（類別、方法、屬性、時區；toJavaDate）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DateTime.html"
  - title: "NotesSession (JavaScript)（createDateTime）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html"
  - title: "NotesDateTime sample JavaScript code for XPages（SSJS 範例：setNow / adjustDay / convertToZone / toJavaDate）— HCL ddwiki（官方）"
    url: "https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/NotesDateTime_sample_JavaScript_code_for_XPages"
relatedJava: []
relatedSsjs: []
coversClass: "DateTime"
apiLang: "ssjs"
cover: "/covers/ssjs-datetime.webp"
coverStyle: "oil-chiaroscuro"
---

在 XPages 的 SSJS 裡處理日期,真正會咬你的不是哪個方法不會用,而是你沒注意到——手上同時有**三種**「日期」在流動:

- **`NotesDateTime`**:後端 Domino 的日期型別,從文件欄位、`getCreated()` 讀出來的就是它。
- **`java.util.Date`**:Java 層的日期,SSJS 底下跑的是 Java,很多東西回的是這個。
- **JavaScript 的 `Date`**:你在 client 端熟悉的那個,但在 server-side 的 SSJS 裡它跟上面兩個不是同一種東西。

同一個「2026-11-03」,包在不同型別裡,能做的事、該怎麼比較、怎麼寫回文件都不一樣。塞錯地方,輕則報型別錯誤,重則存成一筆看起來對、其實時區或時間跑掉的值。這篇就講:在 SSJS 怎麼建一個 `NotesDateTime`、三種型別怎麼互轉、常用方法有哪些,以及兩個最常見的坑。

---

## 重點摘要

- **建立 `NotesDateTime` 只有一條穩的路:`session.createDateTime(...)`**。官方定義就是「Creates a NotesDateTime object that represents a specified date and time」,參數可以是字串(日期、空格、時間)或一個 Date。
- **要轉成 Java 的 `Date`,用 `toJavaDate()`**——官方:「Converts a NotesDateTime object to a Date object」。這是三種型別之間最常走的那座橋。
- **常用方法**:`adjustDay` / `adjustHour` / `adjustMonth`…(位移)、`setNow`(設為現在)、`timeDifference`(兩個時間相差幾秒)、`convertToZone`(換時區)。
- **坑一:「Today」沒有時間**。`createDateTime("Today")` 只給日期、不給時間,官方要你再 `setNow()` 或直接寫明確時間,例如 `"Today 12:00:00 AM"`。
- **坑二:`@Today` 不一定是 `NotesDateTime`**。要寫日期到文件欄位,用 `session.createDateTime("Today")` 最穩,別直接把 `@Today()` 的結果塞進 `replaceItemValue`(細節見下)。

## 建一個 NotesDateTime:session.createDateTime

在 SSJS 裡,你不會 `new` 一個 [`NotesDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DateTime.html)——它的官方定義是「Represents a date and time」,而建立方式只有一個入口:`session.createDateTime`。官方 [NotesSession](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html) 頁的描述是「Creates a NotesDateTime object that represents a specified date and time」。

```javascript
// 字串:日期 空格 時間
var dt:NotesDateTime = session.createDateTime("2026-11-03 09:30:00");

// 關鍵字也行
var today:NotesDateTime = session.createDateTime("Today");

// 也可以餵一個現成的 Date
var fromDate:NotesDateTime = session.createDateTime(new Date());
```

這跟 LotusScript 的 `New NotesDateTime(...)`、Java 的 `session.createDateTime(...)` 是同一套概念,只是 SSJS 寫法。

## 三種型別,怎麼互轉

這是 SSJS 比 LS/Java 更容易亂的地方,因為三種日期型別常常在同一段 code 裡擦身而過。釐清方向:

- **從文件讀出來 → `NotesDateTime`**。`doc.getCreated()`、`doc.getLastModified()`、或一個日期欄位讀出來的,都是 `NotesDateTime`。
- **要給需要 Java `Date` 的地方(格式化、跟其他 Java API 互動)→ `toJavaDate()`**。這是官方明說的轉換:「Converts a NotesDateTime object to a Date object」。
- **要再回到 `NotesDateTime`(例如寫回文件)→ `session.createDateTime(那個 Date)`**。

```javascript
var created:NotesDateTime = doc.getCreated();     // 後端讀出 → NotesDateTime
var jdate:java.util.Date  = created.toJavaDate();  // 轉 Java Date 去做格式化/運算
// ... 處理完 ...
var back:NotesDateTime = session.createDateTime(jdate);  // 要寫回文件,轉回來
doc.replaceItemValue("ProcessedAt", back);
```

一句話:**後端的事用 `NotesDateTime`,要跟 Java 世界打交道就 `toJavaDate()`,寫回文件再 `createDateTime` 回來。**

## 常用方法

`NotesDateTime` 的方法跟 LS/Java 同名,SSJS 直接用。官方 [ddwiki 的 SSJS 範例](https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/NotesDateTime_sample_JavaScript_code_for_XPages)把這些都示範過:

```javascript
var dt:NotesDateTime = session.createDateTime("Today");
dt.setNow();              // 設為現在(日期+時間)
dt.adjustDay(7);          // 往後 7 天;官方:Increments a date-time by a number of days
dt.adjustHour(-3);        // 往前 3 小時

// 兩個時間差幾秒
var a:NotesDateTime = session.createDateTime("2026-11-03 09:00:00");
var b:NotesDateTime = session.createDateTime("2026-11-03 17:30:00");
var secs = b.timeDifference(a);   // 官方:difference in seconds

// 換時區
dt.convertToZone(8, false);       // 官方:Changes the TimeZone and IsDST properties
```

讀取用的屬性也值得記:`DateOnly`(只取日期字串)、`TimeOnly`(只取時間字串)、`GMTTime`(轉成 GMT 的字串)、`LocalTime`(本地時區字串)。

## 坑一:「Today」沒有時間

這是官方文件自己點名的陷阱。`createDateTime("Today")`(以及 `"Tomorrow"`、`"Yesterday"`)用的是 Domino 的當前日期,但**不設時間**——官方原文建議:要嘛接著 `setNow()`、要嘛一開始就寫明確時間,例如 `"Today 12:00:00 AM"`。

後果很實際:一個「只有日期、沒有時間」的 `NotesDateTime`,它的 `TimeZone` 會變成無效(官方說此時回 `0`),拿去跟一個「有時間」的值比較或相減,結果常常不是你要的。要做時間運算,先把它補成完整的日期+時間。

```javascript
var d:NotesDateTime = session.createDateTime("Today");
d.setNow();   // 補上時間,後面的 timeDifference / adjustHour 才準
```

## 坑二:@Today 不一定是 NotesDateTime

這個比較隱晦,也是三種型別混用最容易中招的地方。**在 SSJS 裡,`@Today()` / `@Now()` 這些 @function 回傳的,不一定是 `NotesDateTime`**——社群(HCL developer 論壇)回報它回的是 Java 的 `Date`,直接把 `@Today()` 的結果丟進 `doc.replaceItemValue(...)` 寫日期欄位,有人就踩到型別錯誤。

> 這點我查到的是**社群回報、不是官方白紙黑字**,請在你自己的 Domino 版本上用 `typeof` / `getClass()` 實測確認。但無論 @Today 回什麼,**結論一致且安全**:要寫一個日期值到文件,用 `session.createDateTime("Today")` 產一個明確的 `NotesDateTime`,就不會賭型別。

```javascript
// 穩的寫法:明確產一個 NotesDateTime
doc.replaceItemValue("DueDate", session.createDateTime("Today"));
```

## 時區,一句話

`NotesDateTime` 的時區來自 Domino 的設定,`convertToZone` 可以換,`GMTTime` 直接給你 GMT 字串。XPages 把 `+08:00` 的值在不同層(後端、顯示、request 時區)之間傳的時候,off-by-一小時/一天 是老問題——時區的完整坑在 [LotusScript 的 NotesDateTime 時區那篇](/domino-news/posts/notes-datetime-timezone/)講得更細,底層同一套規則。

## 同類別在其他語言

同一個 `NotesDateTime`,三種語言的重點不太一樣:

- **LotusScript**:`New NotesDateTime(...)` 或 `session.CreateDateTime(...)`,方法同名;基礎用法見 [NotesDateTime 那篇](/domino-news/posts/notes-datetime/)。沒有「三種型別雜耍」的問題——LS 裡就是 `NotesDateTime` 一種。
- **Java**:`session.createDateTime(...)`,一樣有 `toJavaDate()` 跟 `java.util.Date` 的來回,而且多一件事——用完要 `recycle()`。Java 的日期處理見 [Java 的 NotesDateTime](/domino-news/posts/java-datetime/)。
- **SSJS 專屬的痛點**,正是這篇的主題:你同時被 `NotesDateTime`、`java.util.Date`、JavaScript `Date` 三種型別夾在中間,`toJavaDate()` 是橋、`session.createDateTime` 是回頭路,搞清楚手上是哪一種,日期才不會跑掉。
