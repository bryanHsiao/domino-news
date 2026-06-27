---
title: "NotesPropertyBroker / NotesProperty：Composite Applications 的元件溝通機制"
description: "Composite Applications 是 Notes 8.x 時代的功能 — 把多個元件（Notes 元件、Java/Eclipse 元件）拼在同一個畫面上、讓它們互相傳值。NotesPropertyBroker 就是中間那個傳遞層，NotesProperty 是被傳遞的單一屬性。本文老實交代這組類別的定位（偏 legacy）、GetPropertyBroker 怎麼取得、GetPropertyValue / SetPropertyValue / Publish / HasProperty 各方法、InputPropertyContext，以及它在今天的實際意義。"
pubDate: 2026-06-27T07:30:00+08:00
lang: zh-TW
slug: notes-property-broker
tags:
  - "LotusScript"
sources:
  - title: "NotesPropertyBroker class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTYBROKER_CLASS.html"
  - title: "NotesProperty class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTY_CLASS.html"
  - title: "NotesSession class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
relatedJava: ["PropertyBroker", "Property"]
relatedSsjs: []
cover: "/covers/notes-property-broker.webp"
coverStyle: "paper-craft"
---

先把定位講清楚：**Composite Applications 是 Notes 8.x 時代的功能**。它讓你把好幾個元件 —— 幾個 Notes 表單／view、加上 Java/Eclipse 元件 —— 拼在同一個 Notes client 畫面上，並讓它們**互相傳值**（在 A 元件選一筆，B 元件跟著變）。這在今天偏 legacy、新專案很少用，但它對應的兩個類別還在 catalogue 裡，這篇把它補完、也說清楚它到底在做什麼。

中間負責傳值的就是 [`NotesPropertyBroker`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTYBROKER_CLASS.html)。官方定義：「Mediates communication between components of a composite application, allowing communication between multiple Notes components, or between Notes and Java components.」而被傳遞的單一資料，就是 [`NotesProperty`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTY_CLASS.html)。

---

## 重點摘要

- **Composite Applications**（Release 8 起）：多元件拼在同畫面、靠「屬性」互傳資料的框架。今天偏 legacy。
- `NotesPropertyBroker` 是元件之間的**傳遞中介**；`NotesProperty` 是被傳遞的**單一屬性**（官方：「data transmitted to or from the Property Broker」）。
- 從 [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) 取得 broker：`session.GetPropertyBroker()`。
- 讀寫屬性：`GetProperty` / `GetPropertyValue` / `SetPropertyValue` / `HasProperty`。
- `InputPropertyContext` —— 唯讀，這次傳進來的 input 屬性陣列。
- `Publish` —— 把改過的屬性值發佈出去給其他元件；`ClearProperty` —— 清掉發佈前暫存的修改。

## 運作的心智模型

把它想成元件之間的一個「佈告欄」：

```text
元件 A  --(SetPropertyValue + Publish)-->  PropertyBroker  --(觸發)-->  元件 B 收到 input
```

- 使用者在 A 元件做了動作 → A 用 `SetPropertyValue` 改某個屬性、再 `Publish` 發佈。
- broker 把這個變更路由到「有 wire 連到這個屬性」的其他元件。
- B 元件被觸發、從它的 `InputPropertyContext` 讀到傳進來的值，做對應反應。

元件之間怎麼「連線」（wiring）是在 composite application 的設計層配的，程式這端只負責讀 input、寫 output、發佈。

## 取得與讀寫

```lotusscript
Dim session As New NotesSession
Dim broker As NotesPropertyBroker
Set broker = session.GetPropertyBroker()

' 讀這次傳進來的 input 屬性
If broker.HasProperty("CustomerId") Then
    Dim v As Variant
    v = broker.GetPropertyValue("CustomerId")
    ' ...用 v 去查資料、更新自己的顯示
End If

' 改一個 output 屬性並發佈給其他元件
Call broker.SetPropertyValue("SelectedOrder", orderNo)
Call broker.Publish()
```

| 成員 | 作用 |
|---|---|
| `GetProperty(name)` | 取得某屬性的 `NotesProperty` 物件 |
| `GetPropertyValue(name)` | 直接取屬性值 |
| `SetPropertyValue(name, value)` | 設屬性值 |
| `HasProperty(name)` | 該屬性是否存在 |
| `InputPropertyContext` | 唯讀，這次的 input 屬性陣列 |
| `Publish()` | 發佈改過的值給其他元件 |
| `ClearProperty()` | 清掉尚未發佈的暫存修改 |

`NotesProperty` 本身則是「一個屬性」的描述（名稱、命名空間、型別、值），由 broker 的 `GetProperty` 回傳。

## 它在今天的意義

老實說：如果你在開新系統，多半不會用 Composite Applications —— 現代化前端走的是 XPages、或站上前面聊過的 [DRAPI 接外部框架](/domino-news/posts/openntf-home-drapi-jakarta/) 那條路。`NotesPropertyBroker` 主要出現在**還在維護的 8.x 時代 composite app**：你接手這種系統、要看懂或微調元件間怎麼傳值時，才會碰到這組類別。

把它補進來，是為了「看懂舊系統」這個目的 —— 不是建議你在新專案用它。

## 同類別在其他語言

| 語言 | 對應類別 | 說明 |
|---|---|---|
| Java（`lotus.domino.*`） | `PropertyBroker` / `Property` | composite app 也支援 Java 元件，property broker 兩端可以是 Notes 或 Java |
| SSJS / XPages | 無 | Composite Applications 是 Notes client 的框架，不在 XPages 範圍 |

這也呼應前面 UI 類別那篇的結論：凡是綁定 Notes client 框架的東西（UI 類別、composite app），到了伺服器端 / Web 端就沒有對應 —— 因為它們的存在前提就是「Notes client 這個容器」。
