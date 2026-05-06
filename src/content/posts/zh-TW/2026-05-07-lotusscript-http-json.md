---
title: "LotusScript 的對外 HTTP / JSON 工具鏈：NotesHTTPRequest + NotesJSONNavigator"
description: "Domino V12 起 LotusScript 內建 NotesHTTPRequest 跟 NotesJSONNavigator 兩個 class，可以直接從 LS 打外部 REST API 拿 JSON 回來解析 — 不再需要 ActiveX 或 shell 出去呼叫 curl。本文整理兩個 class 的 method、屬性、PreferJSONNavigator 把兩者串起來的官方途徑、完整範例，跟 Java / SSJS 的對位差異。"
pubDate: 2026-05-07T07:30:00+08:00
lang: zh-TW
slug: lotusscript-http-json
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesHTTPRequest class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html"
  - title: "NotesJSONNavigator class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesHTTPRequest.PreferJSONNavigator property — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_preferjsonnavigator_property_HTTPRequest.html"
cover: "/covers/lotusscript-http-json.png"
coverStyle: "risograph"
---

## Domino V12 起，LS 終於有像樣的 HTTP / JSON 工具

V12 之前，LotusScript 要打外部 REST API 通常要：

- 走 COM/ActiveX 借 IE / WinHTTP 物件
- 用 `Shell` 呼叫 curl 再讀檔案
- 寫 Java agent 套 Java 標準 HTTP API

Domino V12 起 LS 內建兩個 class — [`NotesHTTPRequest`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html) 跟 `NotesJSONNavigator` — 把「打 HTTP → 拿 JSON → 解析欄位」這件事完全留在 LS 裡，沒有外掛、不用呼叫外部行程。

## NotesHTTPRequest：對外打 HTTP

### 建立物件

從 `NotesSession` 上拿：

```lotusscript
Dim session As New NotesSession
Dim req As NotesHTTPRequest
Set req = session.CreateHTTPRequest()
```

### 方法

對應五個常見 HTTP 動詞 + header / proxy 操作：

| 方法 | 用途 |
|---|---|
| `Get(url)` | GET 請求 |
| `Post(url, body)` | POST 請求 |
| `Put(url, body)` | PUT 請求 |
| `Patch(url, body)` | PATCH 請求 |
| `DeleteResource(url)` | DELETE 請求（避開 LS 保留字 `Delete`，所以叫 `DeleteResource`） |
| `SetHeaderField(name, value)` | 設一個 request header |
| `ResetHeaders` | 清空所有已設的 header |
| `Setproxy(url)` / `Setproxyuser(user, pwd)` / `Resetproxy` | 走 HTTP proxy 時用 |
| `GetResponseHeaders()` | 取回應的 header（response 之後呼叫） |

### 屬性

| 屬性 | 用途 |
|---|---|
| `Maxredirects` | 允許跳幾次 redirect |
| `Timeoutsec` | 請求 timeout 秒數 |
| `Responsecode`（唯讀）| HTTP status code（200 / 404 / 500…） |
| `Preferstrings` | 控制國際字元輸出格式 |
| `PreferUTF8` | UTF-8 字串處理（依其他屬性自動設） |
| `PreferJSONNavigator` | **本文重點**：response 是否直接回 `NotesJSONNavigator` 物件 |

## NotesJSONNavigator：parse JSON

### 建立物件

```lotusscript
Dim nav As NotesJSONNavigator
' 三種 input 都接受：空、字串、NotesStream
Set nav = session.CreateJSONNavigator()                 ' 空，給後面 Append 用
Set nav = session.CreateJSONNavigator(jsonString)       ' 從字串 parse
Set nav = session.CreateJSONNavigator(notesStream)      ' 從 stream parse
```

### 訪問 JSON 樹的方法

| 方法 | 用途 |
|---|---|
| `GetElementByName(name)` | 依名稱取一個 `NotesJSONElement` |
| `GetElementByPointer(pointer)` | 用 [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) 語法（如 `/items/0/title`）取深層 element |
| `GetFirstElement()` / `GetNextElement()` | 走訪所有 element |
| `GetNthElement(n)` | 依索引取 element |
| `Stringify()` | 轉回 JSON 字串 |
| `AppendElement` / `AppendArray` / `AppendObject` | 動態構造 JSON |

### 配套 class

NotesJSONNavigator 處理整棵樹，但個別節點對應到三種 class：

- `NotesJSONElement` — 一個 name/value pair
- `NotesJSONArray` — 陣列節點
- `NotesJSONObject` — 物件節點

導覽方法回傳這些 class 的 instance，再從上面取值。

## 把兩個串起來：PreferJSONNavigator

正常想法是「`req.Get(url)` 回字串 → 把字串塞給 `CreateJSONNavigator` parse」 — 但這條路有個雷：**HTTPRequest 的字串輸出有 64K 上限**。一個 JSON response 超過 64K 就會被截斷。

[`PreferJSONNavigator` 屬性](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_preferjsonnavigator_property_HTTPRequest.html)解決這件事 — 設成 `True`，`Get` / `Post` 等方法**直接回傳 `NotesJSONNavigator` 物件**（沒有字串中間步驟）：

```lotusscript
req.PreferJSONNavigator = True
Dim nav As NotesJSONNavigator
Set nav = req.Get("https://api.example.com/items")
' 直接走樹
Dim el As NotesJSONElement
Set el = nav.GetElementByPointer("/items/0/title")
```

`NotesJSONNavigator` 內部沒有 64K 限制 — 這就是文件原文寫「JSONNavigator has no 64k limit unlike HTTPRequest strings」的意思。**只要 response 是 JSON，永遠用 `PreferJSONNavigator = True`**，不要拿字串再 parse。

## 完整範例：GET 外部 API、抽出某個欄位

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim req As NotesHTTPRequest
    Set req = session.CreateHTTPRequest()

    ' 設好 header（例如 API key、Accept JSON）
    Call req.SetHeaderField("Authorization", "Bearer YOUR-TOKEN")
    Call req.SetHeaderField("Accept", "application/json")

    ' Timeout、redirect
    req.Timeoutsec = 30
    req.Maxredirects = 3

    ' 關鍵：直接拿 NotesJSONNavigator
    req.PreferJSONNavigator = True

    Dim nav As NotesJSONNavigator
    Set nav = req.Get("https://api.example.com/v1/users/me")

    ' 檢查 status code
    If req.Responsecode <> 200 Then
        Print "API error, code = " & req.Responsecode
        Exit Sub
    End If

    ' 用 JSON Pointer 取深層欄位
    Dim emailEl As NotesJSONElement
    Set emailEl = nav.GetElementByPointer("/profile/email")
    If Not emailEl Is Nothing Then
        Print "User email: " & emailEl.Value
    End If
End Sub
```

四個值得看的點：

1. **`SetHeaderField` 在送 request 之前呼叫** — 順序敏感
2. **`Responsecode` 在 `Get()` 之後可讀** — 用來判斷成敗
3. **`PreferJSONNavigator = True` 在送 request 之前設** — 否則拿到的是 string
4. **`GetElementByPointer` 路徑找不到時回 Nothing** — 一定要 `Is Nothing` 檢查

## 同類別在其他語言

Domino 的 **Java API 跟 SSJS 都沒有對位的「內建 HTTP client + 內建 JSON parser」class** — 換個角度說，LotusScript 在這方面反而「比 Java/SSJS 更便利」：

| 語言 | 對外 HTTP 怎麼打 | JSON 怎麼解析 |
|---|---|---|
| LotusScript V12+ | `NotesHTTPRequest`（內建） | `NotesJSONNavigator`（內建） |
| Java agent | `java.net.http.HttpClient` 或 Apache HttpClient | Gson / Jackson / `org.json` |
| SSJS（XPages） | 透過 Java imports 用 Java HttpClient | 同上，或 SSJS `JSON.parse` |

對 Domino 既有 LS codebase 來說，這對 class 補上了「以前要 hack Java agent 才能做的事」。

## 注意事項

1. **64K 字串上限** — response body 超過 64K 字串模式會被截斷。永遠 `PreferJSONNavigator = True`，或處理非 JSON 大 response 時用 `NotesStream` 接。
2. **TLS** — 預設透過 Domino server 的 TLS stack；外接受信任的 CA 走 `certstore.nsf` 配置（這個跟 NotesHTTPRequest 是分開的 server 級設定）。
3. **同步呼叫** — `Get` / `Post` 等是 blocking call，整個 agent 會等到 response 回來。長 timeout 場景請設好 `Timeoutsec`。
4. **Proxy** — 公司網路走 proxy 用 `Setproxy` / `Setproxyuser`。離開 proxy 環境記得 `Resetproxy`。

## 結論

`NotesHTTPRequest` + `NotesJSONNavigator` + `PreferJSONNavigator = True` 這個組合是 V12 之後「LS 打外部 REST API」的官方建議路線。比起 V11 之前要靠 ActiveX 或 Java agent，現在可以全 LS 寫完。對既有 Domino 應用要整合外部 SaaS（Slack / Teams / 銀行 API / 政府 API 等）來說，這對 class 把 entry barrier 拉到地板。
