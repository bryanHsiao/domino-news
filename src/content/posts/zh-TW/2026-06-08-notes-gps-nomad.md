---
title: "Nomad 定位三件組：NotesGPS / NotesGPSPosition / NotesGPSCoordinates"
description: "傳統 LotusScript 沒有定位 API — 但跑在 HCL Nomad 上的 app 其實拿得到使用者的經緯度。NotesGPS 是 Domino 為 Nomad 補上的客戶端定位類別，從 NotesSession.CreateGPS() 起手，經 RequestAccess() 取得授權、GetCurrentPosition() 拿到 NotesGPSPosition、再從 Coordinates 讀出 NotesGPSCoordinates 的 Latitude / Longitude。本文拆解這條三類別鏈、官方範例逐行解說，以及 error 4508、iOS 首呼叫 Speed/Heading 為空、HighAccuracy 室內失準等幾個一定要知道的坑。"
pubDate: 2026-06-08T07:30:00+08:00
lang: zh-TW
slug: notes-gps-nomad
tags:
  - "LotusScript"
  - "Tutorial"
  - "Nomad"
sources:
  - title: "NotesGPS class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPS_CLASS.html"
  - title: "NotesGPSPosition class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSPOSITION_CLASS.html"
  - title: "NotesGPSCoordinates class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSCOORDINATES_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-gps-nomad.webp"
coverStyle: "art-deco"
---

你接到一個外勤稽核 app 的需求：稽核員到了現場，在 Notes 表單上按「現場簽到」，系統要把他當下的經緯度一起寫進文件。問題是 — 你翻遍 LotusScript 的 class 清單，從 `NotesDatabase` 到 `NotesDocument`，沒有任何一個跟「定位」沾得上邊。傳統的 LotusScript 是為桌面 Client 寫的，桌機沒有 GPS，自然也沒有定位 API。

但如果這個 app 是跑在 **HCL Nomad** 上呢？手機本身就有 GPS，而 Domino 確實為這個情境補上了一組客戶端定位類別。起手式就一句：`Set gps = session.CreateGPS()`。

這篇把 [`NotesGPS`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPS_CLASS.html) 跟它的兩個夥伴 `NotesGPSPosition`、`NotesGPSCoordinates` 完整拆一遍 — 從授權、取位置、讀座標，到幾個官方文件藏在角落、但不踩會出事的坑。

---

## 重點摘要

- **三個類別、一條鏈**：[`NotesGPS`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPS_CLASS.html)（入口）→ `NotesGPSPosition`（一次定位的結果）→ `NotesGPSCoordinates`（實際的經緯度數字）
- 用 `session.CreateGPS()` 建立 `NotesGPS`，**它掛在 `NotesSession` 底下**，不是 `New` 出來的
- 取座標前**必須先呼叫 [`RequestAccess()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REQUESTACCESS_METHOD_NGPS.html)** — 它會跳出系統權限提示，回傳 `Boolean`（給不給）
- `GetCurrentPosition()` 回傳 `NotesGPSPosition`，再從它的 `Coordinates` 屬性拿到 `NotesGPSCoordinates`
- 座標屬性全是**唯讀的 `Variant`（Double）**：`Latitude`、`Longitude`、`Altitude`、`Accuracy`、`AltitudeAccuracy`、`Heading`、`Speed`
- **平台門檻**：HCL Nomad on iOS / Android 需 **V1.0.4+**、Nomad for web browsers 需 **V1.0.3+**
- 三個坑：使用者拒絕授權會丟 **error 4508**；iOS 首次呼叫 `Speed` / `Heading` 可能是空的；`HighAccuracy` 室內別開

---

## 三個類別、一條鏈

這組 API 的設計是「一層拆一層」，不要把它當成一個大物件：

| 類別 | 角色 | 怎麼拿到 |
|---|---|---|
| `NotesGPS` | 定位服務的入口，負責授權與發出請求 | `session.CreateGPS()` |
| `NotesGPSPosition` | 「某一次定位」的結果容器，帶時間戳 | `gps.GetCurrentPosition()` |
| `NotesGPSCoordinates` | 真正的經緯度等數字 | `position.Coordinates` |

官方文件對三者的定義很精簡：`NotesGPS` 是「Provides access to user location for supported platforms」、[`NotesGPSPosition`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSPOSITION_CLASS.html) 是「Represents a position provided by the global positioning device on a platform」、[`NotesGPSCoordinates`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSCOORDINATES_CLASS.html) 是「Contains the current coordinates of the position of a device」。

把它想成拆包裹：`NotesGPS` 是你跟系統要位置的窗口，要回來的是一個 `NotesGPSPosition` 包裹（裡面還附了一張「這是什麼時候量的」時間標籤），拆開包裹才是 `NotesGPSCoordinates` 這串數字。

## 第一步：從 NotesSession 拿到 NotesGPS

`NotesGPS` 不是用 `New` 建立的，它由 `NotesSession` 提供 — 這跟站上先前寫過的 [`NotesSession`](/domino-news/posts/notes-session/) 各種 `CreateXxx` 工廠方法是同一個模式：

```lotusscript
Dim session As New NotesSession
Dim gps As NotesGPS
Set gps = session.CreateGPS()
```

拿到 `gps` 之後，它身上只有兩個屬性，但兩個都值得認識：

| 屬性 | 存取 | 說明（官方原文） |
|---|---|---|
| `TimeoutSec` | 讀/寫 | 「Timeout in seconds for a NotesGPS request.」一次定位請求的逾時秒數 |
| `HighAccuracy` | 讀/寫 | 「Tells the platform to return only a high-accuracy location. **Not for use when indoors.**」要求高精準度定位 — 室內別用 |

`HighAccuracy` 那句「室內別用」是官方自己標的，不是我加的。原因很實際：高精準模式會逼裝置去等更準的 GPS 衛星定位，室內收不到衛星訊號時，它不會退而用 Wi-Fi / 基地台粗定位，而是更容易直接逾時失敗。

### RequestAccess：先要到授權，再談取位置

定位是敏感權限，作業系統不會讓你的 app 默默讀使用者的位置。所以在取任何座標之前，一定要先呼叫 [`RequestAccess()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REQUESTACCESS_METHOD_NGPS.html)：

```lotusscript
Dim hasAccess As Boolean
hasAccess = gps.RequestAccess()
If Not hasAccess Then
    ' 使用者拒絕，或平台不支援 — 不要繼續往下取座標
    Exit Sub
End If
```

它的行為就是字面意思 — 「Requests access from the platform」，向平台請求授權。回傳值是 `Boolean`：給授權回 `True`、不給回 `False`。第一次呼叫時，使用者手機上會跳出系統的定位權限提示；之後就照使用者當初的選擇走。

**這一步不能省。** 略過 `RequestAccess()` 直接 `GetCurrentPosition()`，在沒授權的裝置上會直接踩到 error 4508（後面細講）。

## 第二步：GetCurrentPosition 取得位置

授權拿到之後，才是真正的取位置：

```lotusscript
Dim pos As NotesGPSPosition
Set pos = gps.GetCurrentPosition()
```

`GetCurrentPosition()`「Sends a request to the platform to get the current position」— 向平台發出一次「現在在哪」的請求，回傳一個 `NotesGPSPosition`。這個物件身上有兩個唯讀屬性、一個方法：

| 成員 | 型別 | 說明 |
|---|---|---|
| `Coordinates` | `NotesGPSCoordinates`（讀） | 這次定位的經緯度等數字 |
| `TimeStamp` | `NotesDateTime`（讀） | 這筆位置「是什麼時候量到的」 |
| `Update()` | 方法 | 「Requests the platform to update the current NotesGPSPosition」要求平台重新量一次、更新這個物件 |

`TimeStamp` 回傳的是大家熟悉的 [`NotesDateTime`](/domino-news/posts/notes-datetime/)，所以你可以直接拿它去跟文件上的其他時間欄位比對、算時差。它的用途是判斷「這個定位夠不夠新」 — 如果你拿著一個 `NotesGPSPosition` 放了一段時間，與其重抓整條鏈，可以直接 `pos.Update()` 讓同一個物件刷新。

## 第三步：Coordinates 讀出經緯度

拆到最裡層，`NotesGPSCoordinates` 就是一串數字。它**沒有任何方法**，全部都是唯讀屬性，型別都是 `Variant`（內含 `Double`）：

| 屬性 | 內容（「…of the current position if available」） |
|---|---|
| `Latitude` | 緯度 |
| `Longitude` | 經度 |
| `Altitude` | 海拔高度 |
| `Accuracy` | 水平位置的精準度 |
| `AltitudeAccuracy` | 海拔高度的精準度 |
| `Heading` | 行進方位（航向） |
| `Speed` | 行進速度 |

注意官方每一條描述都帶了 **「if available」** 這個尾巴 — 這不是文件偷懶，是真的「不保證有值」。手機靜止不動時談不上 `Speed` 跟 `Heading`；`Altitude` 在某些裝置或瀏覽器定位下也可能拿不到。實務上除了 `Latitude` / `Longitude`，其他幾個都要當作「可能是空的」來處理。

## 完整官方範例（逐行）

把三步串起來，就是官方文件給的這個 `getCoordinates()` 函式。我原封不動貼上，再逐段解釋：

```lotusscript
Public Function getCoordinates() As String

    On Error GoTo errhandler
    On Error 4508 GoTo err4508

    Dim session As New NotesSession
    Dim gps As NotesGPS
    Set gps = session.CreateGPS()

    Dim hasAccess As Boolean
    hasAccess = GPS.Requestaccess()
    If hasAccess Then
        Dim pos As NOTESGPSPOSITION
        Set pos = GPS.Getcurrentposition()
        Dim coo As NOTESGPSCOORDINATES
        Set coo = pos.Coordinates
        Dim lat As Double
        Dim lot As Double
        lat = coo.Latitude
        lot = coo.Longitude
    End If
    getCoordinates = "Coordinates: LAT " & lat & " LONG " & lot
    Exit Function
errhandler:
    MsgBox Error$ & " in " & Erl & " - " & Err
    Exit Function
err4508:
    getCoordinates = ""
    Exit Function
End Function
```

幾個值得注意的點：

- **兩道 `On Error`**：`On Error 4508 GoTo err4508` 專門攔授權／定位失敗那一類錯誤，跟一般錯誤分開處理。這是這組 API 的標準寫法。
- **先 `If hasAccess Then` 再往下**：沒授權就整段跳過，最後回傳的 `lat` / `lot` 會是 `0`。如果你的業務邏輯需要區分「真的在 0,0 外海」跟「根本沒定到位」，要靠 `hasAccess` 自己加旗標，別只看經緯度。
- **`err4508` 回空字串**：官方範例把「定位失敗」對應成回傳 `""`，讓呼叫端自己決定怎麼處理空結果。

要落到你那個外勤稽核 app，把 `lat` / `lot` 寫進文件就好：

```lotusscript
Call doc.ReplaceItemValue("Lat", coo.Latitude)
Call doc.ReplaceItemValue("Long", coo.Longitude)
Call doc.ReplaceItemValue("FixTime", pos.TimeStamp.LSLocalTime)
```

## 幾個一定要知道的坑

**1. Error 4508 = 沒授權 / 定位不可用。** 這是這組 API 最常見的 runtime 錯誤。使用者在權限提示按「不允許」、裝置關掉定位服務、或平台根本不支援，都會走到這裡。一定要用 `On Error 4508` 接住，不要讓它變成使用者眼前的 LotusScript 錯誤框。

**2. iOS 首次呼叫，`Speed` 跟 `Heading` 可能是空的。** 官方原文：「For iOS, the values for Speed and Heading are filled in the GPS location data once the device has gathered enough course data. These values may not be available on the first call of GPS.getCurrentPosition.」翻成白話 — iOS 要先「動一段」累積足夠的航跡資料，才填得出速度與方位。如果你的功能依賴 `Speed` / `Heading`，第一次拿到空值是正常的，需要隔一段再呼叫、或用 `Update()` 重量。

**3. `HighAccuracy` 室內會害你逾時。** 前面提過，這個屬性要求高精準度定位，室內收不到衛星就容易卡死到 `TimeoutSec` 設的秒數才失敗。室內場景、或只需要「大概在哪棟樓」的精度，就別開 `HighAccuracy`。

**4. 平台版本是硬門檻。** 這組類別只在夠新的 Nomad 上存在：iOS / Android 要 **V1.0.4+**、web browsers 要 **V1.0.3+**。在桌面 Notes Client 上跑同一段 code，`CreateGPS()` 拿到的物件不會有可用的定位來源 — 這是 Nomad 專屬功能，設計表單時要把「桌面開啟」的退路想好。

## 同類別在其他語言

這次的跨語言結論很乾脆：**沒有對應。**

| 語言 | 對應類別 | 說明 |
|---|---|---|
| Java（`lotus.domino.*`） | 無 | 後端 Java API 跑在伺服器端，伺服器沒有「使用者的位置」這個概念 |
| SSJS / XPages | 無 | 同理，定位是裝置端能力，不在伺服器端 JavaScript 的範圍 |

這其實點出 `NotesGPS` 的本質：它不是一個「資料處理」類別，而是一個**裝置能力的橋接**。它只在 Nomad 這種「LotusScript 跑在帶 GPS 的行動裝置上」的環境下才有意義。要在 XPages / 網頁端做定位，走的是瀏覽器原生的 Geolocation API，那是完全不同的一條路 — 跟 Domino class 無關。

換句話說，這是少數「LotusScript 在 Nomad 上反而比 Java / SSJS 更直接」的角落：因為它直接接到了裝置硬體。
