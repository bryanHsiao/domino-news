---
title: "NotesJSONArray / Element / Object：LotusScript parse + build JSON 的三個 building block"
description: "前一篇 lotusscript-http-json 介紹了 NotesHTTPRequest + NotesJSONNavigator 把『打 REST API 拿 JSON』完整收進 LS。本篇接續寫 navigator 下面的 3 個 building block — NotesJSONElement（name/value pair）、NotesJSONObject（物件節點）、NotesJSONArray（陣列節點）— 詳細 method、屬性、parse 時怎麼走 tree、反向 build JSON 怎麼用 Append* 系列 + Stringify、64K 限制版本敏感的三層解法（含 10.0.1 FP2 SPR# DCONB8VMAV / ASHEB95LFR 修補、跟 14.5 還活著的 element value > 64K 隱形地雷），跟一個完整 round-trip 範例（POST body + parse response）。"
pubDate: 2026-05-24T07:30:00+08:00
lang: zh-TW
slug: notes-json-array-element-object
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesJSONElement class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
  - title: "NotesJSONObject class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONOBJECT_CLASS.html"
  - title: "NotesJSONArray class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJsonNavigator / Element / Array / Object example — eknori.de"
    url: "https://www.eknori.de/2019-01-01/notesjsonnavigator-notesjsonelement-notesjsonarray-notesjsonobject-example/"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-json-array-element-object.png"
coverStyle: "paper-craft"
---

## 重點摘要

- 接續[前一篇 lotusscript-http-json](/posts/lotusscript-http-json/) — 把 `NotesJSONNavigator` 底下的 3 個 building block 講透
- **3 個 class 對應 JSON 的 3 種 node**：
  - `NotesJSONElement` — 葉節點（name/value pair）
  - `NotesJSONObject` — 物件 `{}` 節點
  - `NotesJSONArray` — 陣列 `[]` 節點
- **每個都同時支援 parse + build**：parse 用 `GetFirstElement` / `GetNextElement` / `GetNthElement` 走、build 用 `AppendElement` / `AppendArray` / `AppendObject` 組
- **反向 build JSON 的起手**：`session.Createjsonnavigator("")` 拿空 navigator、append 完用 `.Stringify()` 取 JSON 字串
- **64K 限制版本敏感** — parse 端 64K 限制跟「不吃 CRLF」**都在 10.0.1 FP2 修了**（SPR# DCONB8VMAV / ASHEB95LFR）；14.5 環境唯一還活著的隱形地雷是「**單一 element value > 64K 仍會亂**」（LS String 底層限制、不是 class 能繞的）

---

## 三個 class 的關係

對應到 JSON 的結構是這樣：

```json
{                              ← 整個是一個 Object
  "name": "Bryan",             ← Element：name="name", value="Bryan"
  "tags": ["Domino", "AI"]     ← Element：name="tags", value=Array
}
```

| Class | 對應 JSON 結構 | 取值方式 | 子節點 |
|---|---|---|---|
| `NotesJSONObject` | `{...}` | 依名稱（`GetElementByName`）或順序（`GetNthElement`）| 任意混合 Element / Object / Array |
| `NotesJSONArray` | `[...]` | 依索引（`GetNthElement`）— 沒有名稱 | 任意混合 Element / Object / Array |
| `NotesJSONElement` | `"name": value` | 直接讀 `.Name` / `.Value` / `.Type` | 葉節點、無子節點 |

`NotesJSONNavigator` 是整棵樹的 entry point — 從它拿到 root（通常是 Object 或 Array）後、就走這 3 個 class 的方法走完整棵樹。

---

## NotesJSONElement — 葉節點

最簡單、3 個 property + 1 個 method：

| 成員 | 用途 |
|---|---|
| `.Name` | element 名稱（在 Object 裡才有意義；在 Array 裡是空）|
| `.Type` | 常數、標示 `.Value` 的型別（string / number / boolean / null / object / array）|
| `.Value` | 值本身 |
| `.Copy(otherEl)` | 把另一個 element 的值複製進來 |

`.Type` 的常數實際值看 [Designer help 的 NotesJSONElement class 條目](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html)。Production 邏輯通常用 `.Type` 先判型再取 `.Value`：

```lotusscript
Dim el As NotesJSONElement
Set el = obj.GetElementByName("age")
If el.Type = JSON_TYPE_NUMBER Then  ' 常數實際名稱看 Designer help
    Print "Age is " & CStr(el.Value)
End If
```

---

## NotesJSONObject — `{}` 節點

帶名稱的 key/value 集合。**Size + 4 個 navigation + 3 個 append + Copy**：

| 成員 | 用途 |
|---|---|
| `.Size` | 元素數量 |
| `.GetElementByName(name)` | **最常用** — 依名稱直取 |
| `.GetFirstElement()` / `.GetNextElement()` | 走完整個 object（順序未保證 strict、但通常是插入順序）|
| `.GetNthElement(n)` | 依插入順序的索引取（從 1 開始或 0 開始要查 doc 確認）|
| `.AppendElement(el)` | 加一個葉節點 |
| `.AppendArray(arr)` | 加一個 array 子節點 |
| `.AppendObject(obj)` | 加一個 object 子節點 |
| `.Copy(otherObj)` | 整個 object 拷貝 |

注意 `AppendElement` / `AppendArray` / `AppendObject` 三個分開、不是 overload — append 什麼型別呼對應的 method。

---

## NotesJSONArray — `[]` 節點

跟 Object 幾乎一樣、但**沒有 `GetElementByName`**（陣列無名）：

| 成員 | 用途 |
|---|---|
| `.Size` | 陣列長度 |
| `.GetFirstElement()` / `.GetNextElement()` | 走完整個陣列 |
| `.GetNthElement(n)` | 依索引取 |
| `.AppendElement(el)` / `.AppendArray(arr)` / `.AppendObject(obj)` | 加元素 / 子陣列 / 子物件 |
| `.Copy(otherArr)` | 整個陣列拷貝 |

JSON 標準允許陣列裡混型別（`[1, "two", {"three": 3}]`）— 三個 Append 方法各自獨立就是為了支援這個。

---

## Parse 場景：從 navigator 走進去

[前一篇](/posts/lotusscript-http-json/)示範了「HTTP `Get` + `PreferJSONNavigator = True` 直接拿 navigator」。拿到 navigator 後實務上的 3 種走法：

### 1. 直接抓特定欄位（Object 路徑）

```lotusscript
Dim root As NotesJSONObject
Set root = nav.GetElementByName("data").Value  ' 假設 data 是 object
Dim emailEl As NotesJSONElement
Set emailEl = root.GetElementByName("email")
Print emailEl.Value
```

### 2. 走完整個物件

```lotusscript
Dim el As NotesJSONElement
Set el = obj.GetFirstElement()
Do Until el Is Nothing
    Print el.Name & " = " & CStr(el.Value)
    Set el = obj.GetNextElement()
Loop
```

### 3. 巡陣列 + 對每個 item 抓欄位

```lotusscript
Dim arr As NotesJSONArray
Set arr = root.GetElementByName("users").Value  ' users: [...]
Dim i As Integer
For i = 1 To arr.Size
    Dim user As NotesJSONObject
    Set user = arr.GetNthElement(i).Value
    Print user.GetElementByName("name").Value
Next i
```

> **GetElementByPointer 補充**：navigator 還有 [`GetElementByPointer`](https://www.eknori.de/2019-01-02/notesjsonnavigator-getelementbypointer-example/)（JSON Pointer RFC 6901 語法）給深層 path 直取 — `nav.GetElementByPointer("/data/users/0/email")` 比一層層 GetElementByName 簡潔。

---

## Build 場景：反向組 JSON

前一篇沒提的、**這 3 個 class 也能反過來組 JSON**。起手：

```lotusscript
Dim session As New NotesSession
Dim nav As NotesJSONNavigator

' 空 object 起手
Set nav = session.Createjsonnavigator("")
' 或空 array 起手：
' Set nav = session.Createjsonnavigator("[]")
```

然後用 `Append*` 加結構：

```lotusscript
Dim root As NotesJSONObject
Set root = nav.GetFirstElement().Value  ' 取 root object

' 加葉節點
Dim nameEl As NotesJSONElement
Set nameEl = nav.AppendElement("Bryan")  ' 文字
nameEl.Name = "name"
Call root.AppendElement(nameEl)

' 加 array
Dim tagsArr As NotesJSONArray
Set tagsArr = nav.AppendArray()  ' 取空 array
Call root.AppendArray(tagsArr)
' 然後對 tagsArr 用同樣 Append* 加 items

' 序列化回 JSON 字串
Dim jsonStr As String
jsonStr = nav.Stringify()
```

實際 API 細節（`AppendElement` 取的是值還是已建好的 element 物件？index 從 0 還 1？）建議參考 [eknori 2019 的完整範例](https://www.eknori.de/2019-01-01/notesjsonnavigator-notesjsonelement-notesjsonarray-notesjsonobject-example/) — 是社群裡最完整的 build-side 示範。

---

## 完整 round-trip：POST + parse response

把 user input 組成 JSON、POST 到外部 API、parse 回應：

```lotusscript
Sub PostAndParse
    Dim session As New NotesSession
    Dim http As NotesHTTPRequest
    Dim navOut As NotesJSONNavigator
    Dim navIn As NotesJSONNavigator
    Dim root As NotesJSONObject

    ' 1. Build request JSON
    Set navOut = session.Createjsonnavigator("")
    Set root = navOut.GetFirstElement().Value

    Dim el As NotesJSONElement
    Set el = navOut.AppendElement("hello world")
    el.Name = "message"
    Call root.AppendElement(el)

    ' 2. POST it
    Set http = session.CreateHTTPRequest()
    http.PreferJSONNavigator = True
    http.ContentType = "application/json"
    Set navIn = http.Post("https://api.example.com/echo", navOut.Stringify())

    ' 3. Parse response
    Dim respRoot As NotesJSONObject
    Set respRoot = navIn.GetFirstElement().Value
    Dim statusEl As NotesJSONElement
    Set statusEl = respRoot.GetElementByName("status")
    Print "API returned status: " & statusEl.Value
End Sub
```

完整 HTTP 範例（含 error handling、headers、TLS trust store）在 [`lotusscript-http-json`](/posts/lotusscript-http-json/) 跟 [`notes-httprequest-14-5-trust-store`](/posts/notes-httprequest-14-5-trust-store/)。

---

## 64K 限制 — 版本敏感、分層看

這個議題版本演進有點細、值得分層講：

| 版本 | parse 端 64K 行為 |
|---|---|
| **10.0.1 GA 以前** | `Createjsonnavigator(string)` 字串參數上限 64K、超過必須走 NotesStream overload |
| **10.0.1 FP2 以後** | 整包 JSON > 64K 沒問題（**SPR# DCONB8VMAV** 修了）、但**單一 element value > 64K 仍會亂掉** |
| **任何版本** | NotesStream overload 直接傳 stream **物件**最穩 — **不要先 `.ReadText()` 變字串再傳**（會撞回字串 64K 限制）|

對 14.5 環境（多數讀者應該是這條）來說：原本的「parse 端 64K 限制」7 年前就修了、「不吃 CRLF」也同版本順手修了（**SPR# ASHEB95LFR**）。**剩下唯一還活著的隱形地雷**是 ↓

### ⚠️ 單一 element value > 64K — 14.5 還在的隱形地雷

[eknori 2019/05/30 follow-up 實測](https://www.eknori.de/2019-01-01/notesjsonnavigator-notesjsonelement-notesjsonarray-notesjsonobject-example/)：升 10.0.1 FP2 之後整包 > 64K 沒事、但**某個 element 的 value 超過 64K**（譬如 JSON 裡塞一坨 base64 編碼的 PDF）、`NotesJSONElement` 取出來會「strange results」。

根因：LotusScript String 本身的底層限制（跟 NotesItem 的 32K text、64K summary 是同源問題）、**不是 JSON class 能繞的**。實務上 payload 結構是「meta + 一坨 base64 attachment」的話：

- attachment 拆走另一個 HTTP call（multipart 或 binary stream）
- 或拆成 array of chunks（每塊 < 60K）在應用層重組

### NotesStream 用法 — 重點是傳 stream **物件**、不要 `ReadText`

[Designer help 的 NotesJSONNavigator 條目](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html)列了三種 overload：no input / string / NotesStream。NotesStream 版正確用法：

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Dim nav As NotesJSONNavigator

Set stream = session.CreateStream
Call stream.Open("c:\temp\big.json", "UTF-8")  ' UTF-8 強制
stream.Position = 0
Set nav = session.Createjsonnavigator(stream)  ' ← 直接餵 stream 物件
Call stream.Close  ' navigator 建好後 stream 就可以關
```

**常見錯誤** — 先 `ReadText` 變字串再傳：

```lotusscript
Set nav = session.Createjsonnavigator(stream.ReadText)  ' ❌ 字串 64K 限制照樣撞
```

eknori 那篇文章留言區就有人踩過這個坑：原本 `stream.Position = 0; Set jsnav = session.CreateJSONNavigator(stream.ReadText);` 一直 error、後來才發現必須直接傳 stream 物件、不是 `ReadText` 出來的字串。

順帶：`stream.Open` 第二個參數帶 `"UTF-8"`、原本對「UTF-8 only」的擔心也順手解（從 stream 進的字串強制就是 UTF-8）。Help 文件另外提一句「The NotesStream must be opened when creating the navigator and can be closed as soon as the navigator is created」、navigator 建好後 stream 隨時 close。

### Build / POST side 大 payload — 也是 FP2 解的

`navigator.Stringify()` 回的 String 本身沒上限（LS String 可達 2GB）、問題會出在下一步 — `NotesHTTPRequest.Post(url, body)` 在 10.0.1 之前也撞 64K（**SPR# JCORBB2KWU**、跟 parse side 同版本一起修）。14.5 環境同樣不用擔心。

撞到舊版又要 POST 大 payload — 傳統解法是退回去用 Java agent 或 LS2J 包 Apache HttpClient（V12 之前 NotesHTTPRequest 的 HTTP stack 還相對陽春）。

---

## 跟前一篇的關係

| 主題 | 哪篇 |
|---|---|
| 怎麼打 HTTP、`PreferJSONNavigator` 怎麼設、navigator 是什麼 | [lotusscript-http-json](/posts/lotusscript-http-json/) |
| **本篇：navigator 下面 3 個 building block 怎麼用 + 反向 build** | 你在看的這篇 |
| HTTPS trust store 細節（V14.5+） | [notes-httprequest-14-5-trust-store](/posts/notes-httprequest-14-5-trust-store/) |

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesJSONElement` / `NotesJSONObject` / `NotesJSONArray` |
| Java | `JsonJavaArray` / `JsonJavaObject` / `JsonJavaFactory`（Domino Java API、概念對位）|
| SSJS | 用 JS 原生 `JSON.parse` / `JSON.stringify` — XPages 跑 SSJS 本來就有完整 JSON 支援、不需要 Notes 專屬 class |

SSJS 場景反過來：因為 JS 對 JSON 是 first-class、沒人會用 Domino 專屬 class、直接用 native `JSON.parse(http.responseText)` 就行。LotusScript 之所以有這 3 個 class、是因為 LS 本身沒 JSON literal 語法、需要 class 來表達 JSON 結構。
