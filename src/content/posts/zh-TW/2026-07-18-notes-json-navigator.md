---
title: "NotesJSONNavigator：LotusScript 原生 JSON 解析，不必再做字串手術"
description: "在 Domino 10.0.1 之前，用 LotusScript 解析 JSON 意味著 Evaluate 花招或手刻的字串手術。NotesJSONNavigator 用一個真正的 parser 取代了那些：session.CreateJSONNavigator 給你一棵可用 GetElementByName、GetNthElement、JSON Pointer 路徑導覽的型別化樹。本文說明 navigator、element/object/array 類別、型別常數，以及命名上的意外（是 GetFirstElement 不是 GetFirstItem；AppendElement 是 value 在前 name 在後）。"
pubDate: 2026-07-18T07:30:00+08:00
lang: zh-TW
slug: notes-json-navigator
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesJSONNavigator class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONObject class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONOBJECT_CLASS.html"
  - title: "NotesJSONArray class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-json-navigator.webp"
coverStyle: "art-deco"
---

如果你做 Domino 夠久，會記得用 LotusScript 解析 JSON 的苦法：`Evaluate` 配 `@Explode`、或一有值裡含逗號就爆掉的 regex 式字串手術。從 Domino 10.0.1 起有了正經的答案 — [`NotesJSONNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html)，「一個用來解析 JSON 資料的 LotusScript 類別」。它交給你一棵由物件、陣列、值組成的型別化樹，讓你直接導覽。API 很乾淨；唯一的摩擦是幾個跟你會猜的不一樣的命名。

---

## 重點摘要

- `Set nav = session.CreateJSONNavigator(jsonString$)` 把 JSON 解析成一棵可導覽的樹。輸入可以是空字串（用來建 JSON）、一個 JSON 字串、或一個 `NotesStream`（**只支援 UTF-8**）。**Domino 10.0.1** 引入。
- 用 `GetElementByName(name)`、`GetNthElement(index)`（**1-based**）、或 `GetElementByPointer("/path/to/value")`（JSON Pointer）導覽。每個都回傳一個 `NotesJSONElement`。
- 一個 `NotesJSONElement` 有 `Name`、`Type`、`Value`。當 `Type` 是 object 或 array，`.Value` **就是**一個 [`NotesJSONObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONOBJECT_CLASS.html) 或 [`NotesJSONArray`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html)，你接著迭代它。
- **命名意外 #1：** 迭代到處都是 `GetFirstElement` / `GetNextElement` — 不是 `GetFirstItem`/`GetItem`。
- **命名意外 #2：** 建 JSON 時，`AppendElement(value, name)` 是 **value 在前、name 在後**；用 `Stringify()` 序列化整棵樹。

## 解析與導覽

從一個 JSON 字串建 navigator，然後用名稱、JSON Pointer、或迭代來取值：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim nav As NotesJSONNavigator
    Dim el As NotesJSONElement
    Dim arr As NotesJSONArray
    Dim item As NotesJSONElement

    Dim testJSON As String
    testJSON = |{ "variable1":"value1", "variable2":"value2",| _
             & | "myarray":["An","array","of","strings"],| _
             & | "myobject":{"property1":"yourValue1"} }|

    Set nav = session.CreateJSONNavigator(testJSON)

    ' 用名稱 -> "value2"
    Set el = nav.GetElementByName("variable2")
    Print "variable2 = " & el.Value

    ' 用 JSON Pointer -> "yourValue1"
    Set el = nav.GetElementByPointer("/myobject/property1")
    Print "property1 = " & el.Value

    ' 下降進巢狀陣列：element 的 Value 就是 NotesJSONArray
    Set el = nav.GetElementByName("myarray")
    Set arr = el.Value
    Set item = arr.GetFirstElement()
    While Not (item Is Nothing)
        Print "array item = " & item.Value
        Set item = arr.GetNextElement()
    Wend
End Sub
```

這段展示兩件事。第一，`GetElementByPointer` 用 JSON Pointer 語法（`/myobject/property1`）直接跳到一個巢狀值 — 比一個節點一個節點下降乾淨太多。第二，你往深處走的方式是 `element.Value`：當一個 element 的 `Type` 是 object 或 array，它的 `Value` 不是純量 — 是你接著走訪的 `NotesJSONObject` / `NotesJSONArray`。

## Element 型別系統

每個 `NotesJSONElement` 回報一個 `Type`，你拿它跟 `JSONELEM_TYPE_*` 常數比對：

| 常數 | 值 | 意義 |
|---|---|---|
| `JSONELEM_TYPE_OBJECT` | 1 | 一個 JSON 物件（`Value` 是 `NotesJSONObject`）|
| `JSONELEM_TYPE_ARRAY` | 2 | 一個 JSON 陣列（`Value` 是 `NotesJSONArray`）|
| `JSONELEM_TYPE_STRING` | 3 | 字串 |
| `JSONELEM_TYPE_NUMBER` | 4 | 數字 |
| `JSONELEM_TYPE_BOOLEAN` | 5 | 布林 |
| `JSONELEM_TYPE_UTF8_BYTEARRAY` | 6 | UTF-8 位元組陣列 |
| `JSONELEM_TYPE_EMPTY` | 64 | 空 / null |

注意沒有獨立的 `null` 型別 — JSON `null` 對映到 `JSONELEM_TYPE_EMPTY`。讀 `Value` 之前先依 `Type` 分支，這樣你才知道拿到的是純量還是容器：

```lotusscript
Select Case el.Type
Case JSONELEM_TYPE_STRING, JSONELEM_TYPE_NUMBER, JSONELEM_TYPE_BOOLEAN
    Print el.Name & " = " & el.Value
Case JSONELEM_TYPE_OBJECT
    Dim obj As NotesJSONObject
    Set obj = el.Value        ' 下降
Case JSONELEM_TYPE_ARRAY
    Dim arr As NotesJSONArray
    Set arr = el.Value
End Select
```

`NotesJSONObject` 與 `NotesJSONArray` 各自提供 `Size`（元素數量）加上同一套 `GetFirstElement` / `GetNextElement` / `GetNthElement` 迭代器 — 整個家族一致。

## 建 JSON — 注意參數順序

navigator 除了消費 JSON 也產生 JSON。從一個空 navigator 開始、append、再 `Stringify`：

```lotusscript
Dim nav As NotesJSONNavigator
Set nav = session.CreateJSONNavigator("")
Call nav.AppendElement("value1", "variable1")   ' AppendElement(value, name) — value 在前
Call nav.AppendElement(123, "count")
Print nav.Stringify()                            ' => {"variable1":"value1","count":123}
```

陷阱是參數順序：`AppendElement(value, name)` — value 在前、name 在後，跟多數人第一次會打的相反。`AppendArray(name)` 與 `AppendObject(name)` 回傳一個新的 `NotesJSONArray` / `NotesJSONObject`，你用同樣方式填。做完 `Stringify()` 把整棵樹序列化回 JSON 字串（沒有 `ToJSONString`/`GetJSONString` — 方法是 `Stringify`）。

## 同類別在其他語言

Domino API 裡**沒有直接對應物**，這點值得直說。`lotus.domino` 沒有 `JSONNavigator` 類別 — Java 開發者會拿標準函式庫（`com.google.gson`、`org.json`、或 `com.ibm.commons.util.io.json`）。SSJS/XPages 也沒有 `JSONNavigator` 物件；它用全域的 `fromJson()` / `toJson()` 輔助函式。所以這裡 `relatedJava` 與 `relatedSsjs` 留空 — `NotesJSONNavigator` 是 LotusScript 的便利、沒有 1:1 對映，這也是對慣常「LS 是窮親戚」框架的一個漂亮反轉：在 JSON 這塊，LotusScript 拿到了一個專門打造的原生 parser，另外兩個反而靠通用函式庫。（本文是 [JSON element/array/object 深度文](/domino-news/zh-TW/posts/notes-json-array-element-object)的姊妹篇。）
