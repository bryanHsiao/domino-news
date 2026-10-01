---
title: "使用 NotesPropertyBroker 的 SetPropertyValue 方法進行組合應用程式通訊"
description: "深入探討如何在 LotusScript 中使用 NotesPropertyBroker 的 SetPropertyValue 方法，實現組合應用程式元件之間的通訊。"
pubDate: "2026-10-01T09:51:44+08:00"
lang: "zh-TW"
slug: "notespropertybroker-setpropertyvalue"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "SetPropertyValue (NotesPropertyBroker - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_PROPERTYBROKER_SETPROPERTYVALUE_METHOD.html"
  - title: "NotesPropertyBroker (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_NOTESPROPERTYBROKER_CLASS.html"
  - title: "Composite Applications - Design and Management"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPOSITE_APPLICATIONS_OVERVIEW.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_PROPERTYBROKER_SETPROPERTYVALUE_METHOD.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notespropertybroker-setpropertyvalue
-->

## 簡介

在 HCL Domino Designer 中，組合應用程式允許不同的元件互相通訊，以提供更豐富的使用者體驗。`NotesPropertyBroker` 類別在此扮演關鍵角色，透過其 `SetPropertyValue` 方法，開發者可以設定特定屬性的值，從而實現元件間的資料傳遞。

## `SetPropertyValue` 方法概述

`SetPropertyValue` 方法用於設定指定屬性的值。該屬性必須在 WSDL 中定義，且在設定後需要發佈，否則新值將會遺失。該方法的語法如下：

```lotusscript
Call notesPropertyBroker.SetPropertyValue(name, value)
```

- `name`：字串，表示要設定值的屬性名稱。
- `value`：字串，表示屬性的新的值。

需要注意的是，該方法僅適用於 Notes 標準配置，且在 Domino 伺服器上運行的應用程式或 Notes 基本配置中無法使用。

## 實作範例

以下範例展示如何在 LotusScript 中使用 `SetPropertyValue` 方法來設定屬性值，並發佈該屬性。

```lotusscript
Sub SetAndPublishProperty()
    Dim session As New NotesSession
    Dim workspace As New NotesUIWorkspace
    Dim propertyBroker As NotesPropertyBroker
    
    Set propertyBroker = workspace.PropertyBroker
    
    ' 設定屬性值
    Call propertyBroker.SetPropertyValue("Status", "Approved")
    
    ' 發佈屬性
    Call propertyBroker.Publish
End Sub
```

在此範例中，`SetPropertyValue` 方法將名為 "Status" 的屬性設定為 "Approved"，隨後透過 `Publish` 方法發佈該屬性，確保其他元件能夠接收到更新的值。

## 注意事項

- **屬性定義**：確保要設定的屬性已在 WSDL 中定義，否則可能導致錯誤。
- **發佈屬性**：在設定屬性值後，必須調用 `Publish` 方法，否則新值不會被其他元件接收。
- **執行環境**：`SetPropertyValue` 方法在 Domino 伺服器上運行的應用程式或 Notes 基本配置中無法使用，僅適用於 Notes 標準配置。

## 結論

透過 `NotesPropertyBroker` 類別的 `SetPropertyValue` 方法，開發者可以在 LotusScript 中實現組合應用程式元件之間的有效通訊。正確地設定和發佈屬性，能夠確保元件間的資料同步，提升應用程式的整體功能和使用者體驗。

更多資訊，請參閱 [SetPropertyValue 方法官方文件](https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_PROPERTYBROKER_SETPROPERTYVALUE_METHOD.html) 和 [NotesPropertyBroker 類別官方文件](https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_NOTESPROPERTYBROKER_CLASS.html)。
