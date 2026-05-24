---
title: "NotesDateTime + NotesDateRange：LotusScript 日期時間處理的雙人組"
description: "Domino code 裡最常摸到的 utility class 之一 — NotesDateTime 代表單一時間點、NotesDateRange 代表一段時間區間。本文整理建立方式（New 跟 session.CreateDateTime 差別）、三組時區屬性（Local / GMT / Zone）的正確用法、6 個 Adjust 方法做日期算術、TimeDifference vs TimeDifferenceDouble 的精度差異、ConvertToZone 是 in-place mutate 不是 return 新物件、NotesDateRange 的 4 個 property（沒有任何 method）、SetAnyDate / SetAnyTime 是搜尋 wildcard 用、跟 NotesItem.DateTimeValue 互動的 timezone 陷阱、跟兩個實戰範例（期限檢查 agent + 跨時區會議排程）。"
pubDate: 2026-05-25T07:30:00+08:00
lang: zh-TW
slug: notes-datetime
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDateTime class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html"
  - title: "NotesDateRange class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATERANGE_CLASS.html"
  - title: "CreateDateTime method (NotesSession) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATETIME_METHOD.html"
  - title: "CreateDateRange method (NotesSession) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATERANGE_METHOD.html"
relatedJava: ["DateTime", "DateRange"]
relatedSsjs: []
cover: "/covers/notes-datetime.png"
coverStyle: "art-deco"
---

## 重點摘要

- [**NotesDateTime**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html) + **NotesDateRange** — 處理 LotusScript 日期時間的兩個 class、從 V3 就有、Domino code 裡最常摸到的 utility class 之一
- **建立**：`Dim x As New NotesDateTime("...")` 或 `session.CreateDateTime("...")`（`New` 不支援 COM）
- **三組時區屬性別混用**：`LocalTime`（在地時區）/ `GMTTime`（UTC）/ `ZoneTime`（依物件設定的 TZ + DST 調整顯示）
- **時區轉換**：`ConvertToZone(zone, dst)` **改物件本身、不是 return 新物件** — in-place mutate、跟其他語言慣例不同、要先 clone 一份才能保留原值
- **日期算術**：6 個 `Adjust*` 方法（`AdjustDay` / `AdjustHour` / `AdjustMinute` / `AdjustSecond` / `AdjustMonth` / `AdjustYear`）— 也是 in-place mutate、自動跨月跨年
- **差值計算**：`TimeDifference(other)` 回 Long（秒）、`TimeDifferenceDouble(other)` 回 Double（精度高、適合短間隔）
- **NotesDateRange** — 「從 A 時間到 B 時間」的區間、4 個 property、**沒有任何 method**、calendar / schedule 場景常用
- 常見坑：`IsValidDate` 檢查解析、`SetAnyDate` / `SetAnyTime` 是 wildcard 給搜尋用、跟 `NotesItem.DateTimeValue` 互動要注意時區

---

## 建立 NotesDateTime — 兩種寫法

```lotusscript
' 方法 1：New 建構式（最簡潔、但不支援 COM agent）
Dim dt1 As New NotesDateTime("2026-05-25 14:30:00")

' 方法 2：session factory（COM agent 必走這條）
Dim session As New NotesSession
Dim dt2 As NotesDateTime
Set dt2 = session.CreateDateTime("2026-05-25 14:30:00")
```

字串格式接受很寬鬆：

- ISO 8601：`"2026-05-25 14:30:00"`、`"2026-05-25T14:30:00"`
- 美式：`"05/25/2026 02:30 PM"`
- 純日期：`"2026-05-25"`（時間部分變 `SetAnyTime` 狀態）
- 純時間：`"14:30:00"`（日期部分變 `SetAnyDate` 狀態）

**解析失敗不會丟 exception** — 物件還是建出來、但 `IsValidDate = False`。Production 程式碼該檢查：

```lotusscript
Dim dt As NotesDateTime
Set dt = session.CreateDateTime(userInput)
If Not dt.IsValidDate Then
    Print "輸入的日期格式錯誤：" & userInput
    Exit Sub
End If
```

---

## 三組時區屬性 — Local / GMT / Zone

最常踩坑的地方：不同 property 代表不同時區、搞混會算錯時間。

| Property | 型別 | 意義 | 何時用 |
|---|---|---|---|
| `.LocalTime` | String (R/W) | 在地時區的完整 date-time | 顯示給 user 看、寫進 UI |
| `.GMTTime` | String (RO) | UTC 表示 | log、跨系統比對、SLA 計算 |
| `.ZoneTime` | String (RO) | 依物件自己的 TZ + DST 調整 | 多時區 calendar 顯示 |
| `.LSLocalTime` | Variant (R/W) | LS 原生 date 型別、本地 | 跟 LS `Date` 變數互傳 |
| `.LSGMTTime` | Variant (RO) | LS 原生 date 型別、UTC | 同上、UTC 版 |

只取**日期或時間部分**：

| Property | 回什麼 |
|---|---|
| `.DateOnly` | 日期字串（local TZ）譬如 `"05/25/2026"` |
| `.TimeOnly` | 時間字串（local TZ）譬如 `"14:30:00"` |

實務 rule of thumb：

- **存進 NSF / 傳給其他 server** → 用 `GMTTime` 或 `LSGMTTime`（UTC 唯一、不會誤解）
- **顯示給 user** → 用 `LocalTime`（自動依 client 時區）
- **日期算術 / 比較** → 直接拿物件操作、不要先轉字串

---

## Adjust 系列 — 6 個 in-place 算術

6 個對應 6 個時間單位、全部 **in-place mutate**（改物件本身、不是 return 新物件）：

```lotusscript
Dim dt As New NotesDateTime("2026-05-25 14:30:00")

Call dt.AdjustDay(7)        ' → 2026-06-01 14:30:00
Call dt.AdjustHour(-3)      ' → 2026-06-01 11:30:00
Call dt.AdjustMonth(1)      ' → 2026-07-01 11:30:00
Call dt.AdjustYear(1)       ' → 2027-07-01 11:30:00
Call dt.AdjustMinute(45)    ' → 2027-07-01 12:15:00
Call dt.AdjustSecond(-15)   ' → 2027-07-01 12:14:45
```

**自動跨界**：`AdjustDay(35)` 從 5/1 過去就是 6/5、不用自己算閏月。負數倒退、邏輯一致。

兩個 wildcard 方法給搜尋用、不是給日期算術：

```lotusscript
Call dt.SetAnyDate()  ' 日期變 "*"、用在 view formula 比對任意日期
Call dt.SetAnyTime()  ' 時間變 "*"、用在 view formula 比對任意時間
```

跟 `SetNow()` 一起記：把整個物件 reset 成「現在」。

```lotusscript
Dim now As New NotesDateTime("")
Call now.SetNow()   ' 物件現在等於 server 當下時間
```

---

## 比較 — TimeDifference vs TimeDifferenceDouble

兩個都算「自己 - 對方」差幾秒、差別在 return type 跟精度：

| Method | 回傳 | 精度 | 適用 |
|---|---|---|---|
| `TimeDifference(other)` | Long（整數秒）| 1 秒 | 一般場景：超時、跨日、SLA 計時 |
| `TimeDifferenceDouble(other)` | Double | 小數秒（毫秒級）| 短間隔測量、效能 benchmark |

```lotusscript
Dim t1 As New NotesDateTime("")
Call t1.SetNow()

' ...做點事...

Dim t2 As New NotesDateTime("")
Call t2.SetNow()

Dim elapsedSec As Long
elapsedSec = t2.TimeDifference(t1)
Print "經過 " & elapsedSec & " 秒"
```

**順序**：`A.TimeDifference(B)` = A - B。負數代表 A 比 B 早。

---

## ConvertToZone — in-place 時區轉換

`ConvertToZone(zone, dst)` 改物件本身、不是回新物件：

```lotusscript
Dim dt As New NotesDateTime("2026-05-25 14:30:00")  ' 假設在地 Taipei UTC+8

Call dt.ConvertToZone(0, False)  ' 轉成 UTC
Print dt.LocalTime  ' "2026-05-25 06:30:00"（注意 LocalTime 已經變了）
```

兩個參數：

- `zone` — 整數時區 offset（Taipei 是 `-8`、紐約 EST 是 `5`、注意**正負號跟一般習慣相反**：HCL 是 「local minus GMT」的反向）
- `dst` — `True` / `False` 決定是否套日光節約

**要保留原物件**就先 clone：

```lotusscript
Dim original As New NotesDateTime("2026-05-25 14:30:00")
Dim cloned As New NotesDateTime(original.LocalTime)  ' 從 LocalTime 字串重建
Call cloned.ConvertToZone(0, False)  ' 只改 cloned、original 不動
```

LS 沒有 deep clone 的 first-class API、所以走 `LocalTime` 字串 round-trip 是慣例做法。

---

## NotesDateRange — 區間表達、扁平、無 method

物件結構非常扁、4 個 property、**完全沒有 method**：

| Property | 型別 | 用途 |
|---|---|---|
| `.StartDateTime` | NotesDateTime (R/W) | 起始時間 |
| `.EndDateTime` | NotesDateTime (R/W) | 結束時間 |
| `.Text` | String (R/W) | 字串表示（譬如 `"05/25/2026 - 06/01/2026"`），讀寫雙向 |
| `.Parent` | NotesSession (RO) | 持有的 session |

建立兩種寫法：

```lotusscript
' 方法 1：先建兩個 NotesDateTime、再 set 進 range
Dim start As New NotesDateTime("2026-05-25 09:00:00")
Dim ends As New NotesDateTime("2026-05-25 17:00:00")
Dim range As NotesDateRange
Set range = session.CreateDateRange()
Set range.StartDateTime = start
Set range.EndDateTime = ends

' 方法 2：直接 set Text、Domino 自動 parse 出兩端
Dim range2 As NotesDateRange
Set range2 = session.CreateDateRange()
range2.Text = "05/25/2026 09:00 AM - 05/25/2026 05:00 PM"
```

**用途**：`NotesItem` 存「時間區間」型欄位（譬如會議的 Required attendance time）就是 `NotesDateRange` 陣列。Calendar app 場景幾乎都會用到。

---

## 實戰範例 1：期限檢查 agent

scheduled agent 找超過 30 天未更新的文件、發提醒：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' 算出「30 天前」的時間點
    Dim cutoff As New NotesDateTime("")
    Call cutoff.SetNow()
    Call cutoff.AdjustDay(-30)

    ' 找所有 LastModified < cutoff 的文件
    Dim docs As NotesDocumentCollection
    Set docs = db.Search("@Modified < [" & cutoff.LocalTime & "]", Nothing, 0)

    Dim doc As NotesDocument
    Set doc = docs.GetFirstDocument()
    Do Until doc Is Nothing
        ' 算這份文件多久沒動了
        Dim lastMod As NotesDateTime
        Set lastMod = doc.LastModified
        Dim staleDays As Long
        staleDays = -lastMod.TimeDifference(cutoff) / 86400  ' 秒 → 天

        Print doc.GetItemValue("Subject")(0) & " 已 " & (staleDays + 30) & " 天未更新"
        Set doc = docs.GetNextDocument(doc)
    Loop
End Sub
```

---

## 實戰範例 2：跨時區會議排程

把 Taipei 09:00 的會議翻譯成參加者所在時區：

```lotusscript
Function MeetingTimeForZone(taipeiTime As String, attendeeZone As Integer) As String
    Dim dt As NotesDateTime
    Set dt = New NotesDateTime(taipeiTime)

    ' 從 Taipei (UTC+8) 轉到 attendee 時區
    Call dt.ConvertToZone(attendeeZone, False)
    MeetingTimeForZone = dt.LocalTime
End Function

' 用法
Print MeetingTimeForZone("2026-05-25 09:00:00", 5)   ' New York EST → 21:00（前一天）
Print MeetingTimeForZone("2026-05-25 09:00:00", 0)   ' UTC → 01:00
Print MeetingTimeForZone("2026-05-25 09:00:00", -8)  ' Taipei → 09:00 維持
```

---

## 常見坑

### 跟 `NotesItem.DateTimeValue` 互動

從文件讀出來的 DateTime item value 帶 server timezone 資訊、寫回去要小心：

```lotusscript
Dim doc As NotesDocument
Set doc = view.GetFirstDocument()

Dim item As NotesItem
Set item = doc.GetFirstItem("EventDate")

Dim dt As NotesDateTime
Set dt = item.DateTimeValue
' dt 帶 server TZ、不是你 client TZ

Print dt.GMTTime  ' ← 用 GMT 比較安全、不會有 TZ 誤解
```

### `SetAnyDate` / `SetAnyTime` 不是「清空」

很多人以為這兩個 method 是「把日期清空」、其實是給**搜尋用的 wildcard**：

```lotusscript
Dim dt As New NotesDateTime("2026-05-25 14:30:00")
Call dt.SetAnyDate()   ' 日期變 wildcard "*"、但時間 14:30:00 還在
' 用途：放進 view selection formula、比對「任何日期、時間是 14:30」的文件
```

要表達「現在不知道時間」、不要用 SetAnyTime；該用空字串建構或乾脆別建。

### `Adjust*` mutate 而不是 return 新物件

```lotusscript
' ❌ 錯
Dim tomorrow As NotesDateTime
Set tomorrow = today.AdjustDay(1)  ' AdjustDay 不回 value、tomorrow 會是 Nothing

' ✅ 對
Set tomorrow = New NotesDateTime(today.LocalTime)
Call tomorrow.AdjustDay(1)
```

JavaScript / Python / Java 8 的 immutable date 慣例不適用 — LS 是 mutate-in-place、要保留原值要先 clone。

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesDateTime` / `NotesDateRange` |
| Java | `lotus.domino.DateTime` / `lotus.domino.DateRange`（API surface 一致、命名去掉 `Notes` 前綴）|
| SSJS | 用 JS 原生 `Date`（XPages 內可以再用 `@Today()` / `@Now()` 等 formula function 補強）|

Java side 的差別主要在記憶體管理：`lotus.domino.DateTime` 物件用完要 `.recycle()`、不像 LS 自動 GC。SSJS 直接用 `new Date()` / `Date.now()`、Domino 不另外提供包裝。
