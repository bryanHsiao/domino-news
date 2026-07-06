---
title: "NotesDateTime 與時區：GMTTime、ConvertToZone，與那個絆倒每個人的正負號慣例"
description: "一個 NotesDateTime 是單一個瞬間，你可以用三種方式讀出來 —— GMT、機器的本地時間、以及轉換後的時區。本文說明 GMTTime vs LocalTime vs ZoneTime、TimeZone 整數那個反直覺的 Notes 正負號慣例（正值代表 GMT 以西）、ConvertToZone 與它的 DST 陷阱、用 LSGMTTime 做原生日期運算，以及為什麼 GMTTime 是唯一能跨機器安全儲存與比較的形式。"
pubDate: 2026-07-09T07:30:00+08:00
lang: zh-TW
slug: notes-datetime-timezone
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDateTime class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html"
  - title: "TimeZone property (NotesDateTime) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TIMEZONE_PROPERTY.html"
  - title: "ConvertToZone method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CONVERTTOZONE_METHOD.html"
relatedJava: ["DateTime"]
relatedSsjs: ["DateTime"]
---

台北的使用者在早上 9 點建一筆紀錄；法蘭克福伺服器上的排程 agent 處理它；報表把它呈現給紐約的讀者。如果你儲存與比較的是原始的本地時間字串，這三方看到的是三個不同的「9:00」，你的排序也就亂了。[`NotesDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html) 有把這件事做對的工具 —— 但它們附帶一個正負號慣例和一條 DST 規則，幾乎每個人第一次都會被絆到。

解開這個類別的心智模型是：**一個 `NotesDateTime` 是單一個絕對瞬間**，而 GMTTime / LocalTime / ZoneTime 是它的三個*視圖*。`ConvertToZone` 改的是視圖、不是瞬間。這是這個類別的第三個切角 —— 一般的 [`NotesDateTime` 走訪](/domino-news/zh-TW/posts/notes-datetime)講建構與運算；這篇講時區。

---

## 重點摘要

- **`GMTTime`**（唯讀）是這個瞬間的格林威治標準時間 —— 不管哪台機器讀都是同一個值。這是正規形式：**用 GMTTime 儲存與比較。**
- **`LocalTime`**（可讀寫）是這個瞬間在執行機器時區的樣子；**`ZoneTime`**（唯讀）是這個瞬間在 `ConvertToZone` 所設時區的樣子（在你轉換之前等於 LocalTime）。
- **`TimeZone`**（唯讀整數）用經典 Notes 慣例：它是「為了換算成 GMT、必須加到該時間上的小時數」—— 所以**正值代表 GMT 以*西***（美東是 `5`、不是 `-5`）。文件補一句「在許多情況下、但並非全部」，所以別把它當成乾淨的通用位移。
- **`ConvertToZone(newzone, dst)`** 把這個瞬間在另一個時區重新視圖 —— 它改 `TimeZone`/`IsDST`/`ZoneTime`，但「不影響 GMTTime 與 LocalTime 屬性」。它的 DST 陷阱：它「使用被轉換*來源*時區的日光節約規則，而非被轉換*目標*時區的」。
- 做原生日期運算用 **`LSGMTTime`** / **`LSLocalTime`**（LotusScript `Date` variant）；字串型的 `GMTTime`/`LocalTime` 用於儲存與顯示。

## 一個瞬間的三個視圖

```lotusscript
Dim dt As New NotesDateTime("04/16/96 05:36 PM")
Print "LocalTime: " & dt.LocalTime      ' 機器時區字串
Print "TimeZone : " & dt.TimeZone       ' 整數位移（見下）
Print "GMTTime  : " & dt.GMTTime        ' 絕對 GMT 字串
```

在一台美東機器上，同一個瞬間的 GMTTime 印出 `04/16/96 09:36:00 PM GMT`；在一台往西 11 個時區的機器上，它印出*不同的本地*時間、但**同樣的 GMTTime**。這正是重點：`GMTTime` 與機器無關，所以兩個在不同伺服器上建立的 `NotesDateTime` 值，只有在你用 GMT 比較時才會正確地比較與排序 —— 而不是用地區格式化的 `LocalTime` 字串。

## TimeZone 的正負號慣例

這是產生「差幾個小時」bug 的那個。依 [`TimeZone`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TIMEZONE_PROPERTY.html) 文件，這個整數「代表為了換算成 GMT、必須加到該時間上的小時數」。所以 GMT 是 `0`、美東標準時間是 `5`、阿拉斯加-夏威夷是 `10` —— **正值是 GMT 以西**，跟多數開發者腦中的 `UTC+8` / `UTC−5` 記法正好反號。台北（UTC+8）在這裡讀作 `-8`。文件補一句「在許多情況下、但並非全部」，它自己的但書，表示半小時時區與歷史規則無法對到一個乾淨的整數 —— 所以把 `TimeZone` 當成 Notes 的內部標記，而不是你拿來做算術的可攜位移。

## ConvertToZone，以及它的 DST 陷阱

[`ConvertToZone(newzone, dst)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CONVERTTOZONE_METHOD.html) 把同一個絕對瞬間重新標記成另一個時區的視圖。官方範例讓一個瞬間走過每一個時區：

```lotusscript
Sub Initialize
  Dim dateTime As New NotesDateTime("Today 06:00")
  Dim msg As String
  msg = "Zone" & Chr(9) & "Time"
  For i = -12 To 12
    Call dateTime.ConvertToZone(i, True)
    msg = msg & Chr(10) & dateTime.TimeZone & Chr(9) & dateTime.ZoneTime
  Next
  Messagebox msg,, "Today 06:00 across zones"
End Sub
```

文件對兩件事講得很明白。第一，轉換「不影響 GMTTime 與 LocalTime 屬性」—— `ConvertToZone` 之後你從 `ZoneTime` 讀結果，而 `GMTTime`（絕對瞬間）與 `LocalTime` 都不動。第二，DST 陷阱：它「使用被轉換*來源*時區的日光節約規則，而非被轉換*目標*時區的」。所以在兩個 DST 規則不同的時區之間轉換，可能產生一個差了 DST 位移的牆上時間 —— 如果目標時區的精確牆上時間很重要，就對照那個時區的實際規則驗證，而不是盲目相信轉換。

## 原生日期運算：LSGMTTime

`GMTTime` 與 `LocalTime` 回傳地區格式化的*字串* —— 適合儲存與顯示，但不利於運算。當你需要把一個值餵進 LotusScript 日期運算或 `Format$` 時，用 `LS*` 變體，它們回傳原生 `Date`：

```lotusscript
Dim dt As New NotesDateTime("2026-07-09 09:00:00")
Dim gmt As Variant
gmt = dt.LSGMTTime          ' 一個 LotusScript Date、GMT —— 安全可比較
```

把 `LSGMTTime`（或字串型的 `GMTTime`）當成你持久化與比較的正規值；只有在替人格式化顯示時才動用 `LocalTime` / `ZoneTime`。要算兩個瞬間之間的經過時間，`TimeDifference` 回傳秒數差（`self` 減參數），而 `TimeDifferenceDouble` 回傳 `Double`、避免跨數十年時溢位 —— 因為兩個運算元各自帶著自己的時區資訊，差值是在絕對瞬間上計算、時區正確。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesDateTime` | `DateTime` | `DateTime` |

Java 的 `lotus.domino.DateTime`（經 `session.createDateTime(...)`）攤出同樣的模型 —— `getGMTTime()`、`getLocalTime()`、`getTimeZone()`、`convertToZone(int, boolean)`、`timeDifference()` —— 正負號慣例與 DST 但書完全相同。Java 沒有 `LS*` 原生變體對應物；它改提供 `toJavaDate()` 給你一個 `java.util.Date`。SSJS 透過 `session.createDateTime(...)` 取到同一個後端類別。要帶到每個地方的那條規則：用 GMT 持久化與比較。
