---
title: "NotesInternational：別再寫死日期分隔符號和貨幣符號"
description: "NotesInternational 是一扇唯讀的窗，讓你看見程式所在那台機器的地區設定 —— 日期順序、分隔符號、上午/下午字串、貨幣符號與格式、時區、以及 DST 旗標。本文說明怎麼從 session.International 取得、值得知道的屬性分組、一段偵測地區日期順序的可跑範例，以及三個陷阱：它反映的是執行端 OS（不是終端使用者）、它是唯讀的、而它的 TimeZone 正負號是經典又反直覺的 Notes 慣例。"
pubDate: 2026-06-30T07:30:00+08:00
lang: zh-TW
slug: notes-international
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesInternational class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESINTERNATIONAL_CLASS.html"
  - title: "Examples: NotesInternational class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESINTERNATIONAL_CLASS.html"
  - title: "Example: AMString property — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_AMSTRING_PROPERTY.html"
relatedJava: ["International"]
relatedSsjs: ["International"]
cover: "/covers/notes-international.webp"
coverStyle: "photoreal-3d"
---

你寫了一個 agent，把日期格式化成 `month & "/" & day & "/" & year`，在自己機器上測一切正常。然後它跑在一台設定成歐洲地區的伺服器上 —— 那裡日期是日在前；或者客戶把它複製到一台小數分隔符號是逗號的主機上 —— 突然之間「01/02」指的是錯的那一天，貨幣金額也看起來怪怪的。

解法不是用猜的。Domino 早就知道程式所在那台機器的地區設定，並且透過 [`NotesInternational`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESINTERNATIONAL_CLASS.html) 攤開來給你。它是個小小的唯讀類別 —— 但它正是「輸出符合地區慣例」和「只在開發者筆電上跑得對」之間的差別。

---

## 重點摘要

- `session.International` 回傳一個**唯讀**的 `NotesInternational` —— 執行端 OS 地區設定的即時視圖。
- 它反映的是**程式執行的那台機器**：排程 agent 讀的是*伺服器*的設定、用戶端程式讀的是*用戶端*的。在 web 應用裡，它**不是**遠端瀏覽器的語系。
- 日期順序用三個布林值表示 —— `IsDateDMY` / `IsDateMDY` / `IsDateYMD` —— 再加上 `DateSep` / `TimeSep` 分隔符號，所以你可以組出正確的格式，而不是寫死 `/` 和 `:`。
- 貨幣與數字格式：`CurrencySymbol`、`CurrencyDigits`、`DecimalSep`、`ThousandsSep`、`IsCurrencySuffix`、`IsCurrencySpace`、`IsCurrencyZero`。
- `TimeZone` 用的是經典 Notes 慣例 —— **正值代表 GMT 以西**（美東標準時間是 `5`，不是 `-5`），而且官方文件還補一句它並非對每個時區都是乾淨的帶號位移。
- 這個類別**沒有任何方法** —— 純屬性。拿它來解讀或格式化 [`NotesDateTime`](/domino-news/zh-TW/posts/notes-datetime) 的值，而不是拿來改任何東西。

---

## 取得物件

`NotesInternational` 被 `NotesSession` 所包含 —— 沒有建構子，你從 session 上讀出來：

```lotusscript
Dim session As New NotesSession
Dim intl As NotesInternational
Set intl = session.International
```

類別說明很明白地點出它有多「即時」：

> 「代表作業環境中的國際設定，例如 Windows 控制台的國際設定。當這些設定在作業環境中被改變時，Domino 會立刻辨識到新的設定。」

所以別在一個長時間執行的程序裡把它快取起來、以為它是凍結的快照 —— 需要的時候再讀。

## 它能讀到什麼

每個屬性都是唯讀的。有用的那些分成四組。

**日期與時間的形狀**

| 屬性 | 作用 |
|---|---|
| `IsDateDMY` / `IsDateMDY` / `IsDateYMD` | 這個地區用哪種順序寫日期 |
| `DateSep` | 日期各部分之間的分隔符號（`/`、`-`、`.`）|
| `TimeSep` | 時間各部分之間的分隔符號（`:`）|
| `IsTime24Hour` | 24 小時制 vs 12 小時制 |
| `AMString` / `PMString` | 這個地區表示上午／下午的字串 |

**數字與貨幣**

| 屬性 | 作用 |
|---|---|
| `DecimalSep` / `ThousandsSep` | 小數點與千分位分隔符號 |
| `CurrencySymbol` | 例如 `$`、`€`、`¥` |
| `CurrencyDigits` | 數字格式中的小數位數 |
| `IsCurrencySuffix` | 符號是否跟在數字後面（`100$` vs `$100`）|
| `IsCurrencySpace` | 符號與數字之間是否有空格 |
| `IsCurrencyZero` | 小數點前是否顯示前導零 |

**時區與 DST**

| 屬性 | 作用 |
|---|---|
| `TimeZone` | 整數 GMT 位移（經典 Notes 正負號慣例 —— 見後面陷阱）|
| `IsDST` | 格式是否反映日光節約時間 |

**地區用字**：`Today`、`Tomorrow`、`Yesterday` 給你 Notes 在 view 裡用的本地化相對日字詞。

## 一段完整範例

這個 agent 讀了幾個設定，並組出一個符合執行端地區日期順序的格式 —— 沒有寫死的 `/`、也沒有預設 MDY：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim intl As NotesInternational
  Set intl = session.International

  ' 相對於美式預設，回報格式上的「例外」
  Dim msg As String
  If intl.CurrencySymbol <> "$" Then
    msg = "Currency symbol is " & intl.CurrencySymbol
  End If
  If intl.DecimalSep <> "." Then
    If msg <> "" Then msg = msg & Chr(10)
    msg = msg & "Decimal separator is " & intl.DecimalSep
  End If
  If intl.IsTime24Hour Then
    If msg <> "" Then msg = msg & Chr(10)
    msg = msg & "Time is 24-hour"
  End If
  If msg = "" Then msg = "Locale matches the US default"
  Print msg

  ' 組出符合地區實際順序的日期格式
  Dim pattern As String
  If intl.IsDateDMY Then
    pattern = "DD" & intl.DateSep & "MM" & intl.DateSep & "YYYY"
  ElseIf intl.IsDateMDY Then
    pattern = "MM" & intl.DateSep & "DD" & intl.DateSep & "YYYY"
  ElseIf intl.IsDateYMD Then
    pattern = "YYYY" & intl.DateSep & "MM" & intl.DateSep & "DD"
  End If
  Print "Locale date pattern: " & pattern
End Sub
```

前半段改寫自官方的[類別範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESINTERNATIONAL_CLASS.html)；那段[AM/PM 範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_AMSTRING_PROPERTY.html)示範了讀時間字串的同一套模式，而偵測日期順序這段才是實用的回報 —— 你現在知道該把 `01/02/2026` 解讀成 1 月 2 日還是 2 月 1 日。

## 三個陷阱

**1. 它是執行端的設定，不是使用者的。** 這是最讓人意外的一個。在排程 agent 裡，`session.International` 讀的是*伺服器*的地區設定；在用戶端程式裡讀的是*用戶端*的。一個替遠端瀏覽器產生畫面的 web 應用，**不會**透過這個方式拿到那個瀏覽器的語系 —— 要在 web 應用裡做到每個請求各自的語系，你得自己去讀 HTTP 的 `Accept-Language` 標頭。

**2. 它是唯讀的。** 沒有任何 setter，也完全沒有方法 —— 你只能讀 OS 回報的內容。要*改變*格式，你得去改 OS 的地區設定（或自己用這些值把字串組出來）。

**3. `TimeZone` 的正負號是經典 Notes 慣例。** 它是個整數，依官方文件的說法，這個值「代表為了換算成格林威治標準時間、必須加到該時間上的小時數」—— 所以**正值是 GMT 以西**：GMT 是 `0`，美東標準時間是 `5`、不是 `-5`。文件還補一句「在許多情況下、但並非全部」—— 別把它當成對每個時區都成立的乾淨帶號位移，尤其跨越 DST 與半小時時區時。

## 搭配 NotesDateTime

`NotesInternational` 告訴你這個地區*怎麼*格式化日期時間；[`NotesDateTime`](/domino-news/zh-TW/posts/notes-datetime) 則持有實際的值。拿前者去解讀或顯示後者 —— 讀 `DateSep` 和那組 `IsDateXYZ` 旗標來組出正確的顯示或解析字串，而不是寫死分隔符號和順序。兩者互補：一個是格式規則，一個是資料。

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| LotusScript | `NotesInternational` | `session.International` |
| Java | `lotus.domino.International` | `session.getInternational()` |
| SSJS / XPages | `International` | `session.getInternational()` |

三種語言的介面一致 —— 同一組唯讀的地區屬性。在 Java 與 SSJS 裡存取子是 `getDateSep()`、`getCurrencySymbol()`、`isDateDMY()` 這種寫法，但值與「反映執行端 OS」的語意都原封不動地沿用。
