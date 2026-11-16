---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "本教學將指導您如何在 LotusScript 中使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。"
pubDate: "2026-11-16T10:36:20+08:00"
lang: "zh-TW"
slug: "notes-jsonarray-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesJSONArray class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONElement class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonarray-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-11-13. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-11-13. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-11-13. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 14.5.1 引入了 NotesJSONArray 類別，讓開發者能夠在 LotusScript 中輕鬆處理 JSON 陣列。本教學將指導您如何使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。

## 建立 JSON 陣列

要在 LotusScript 中建立 JSON 陣列，您需要使用 NotesSession 的 CreateJSONArray 方法。以下是建立包含數字的 JSON 陣列的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

Call jsonArray.AppendElement(1)
Call jsonArray.AppendElement(2)
Call jsonArray.AppendElement(3)

MsgBox jsonArray.ToString
```

此程式碼將輸出 `[1,2,3]`。

## 解析 JSON 陣列

如果您有一個 JSON 字串並希望將其解析為 NotesJSONArray，您可以使用 NotesSession 的 CreateJSONNavigator 方法，然後使用 GetArray 方法獲取陣列：

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Dim jsonArray As NotesJSONArray

Set jsonNav = session.CreateJSONNavigator("[1,2,3]")
Set jsonArray = jsonNav.GetArray

MsgBox jsonArray.ToString
```

此程式碼將輸出 `[1,2,3]`。

## 操作 JSON 陣列

您可以使用 NotesJSONArray 的方法來操作陣列，例如獲取元素、插入元素或移除元素。

### 獲取元素

要獲取特定索引的元素，您可以使用 GetElementByIndex 方法：

```lotusscript
Dim element As NotesJSONElement
Set element = jsonArray.GetElementByIndex(1)
MsgBox element.Value
```

此程式碼將輸出 `2`。

### 插入元素

要在特定位置插入元素，您可以使用 InsertElement 方法：

```lotusscript
Call jsonArray.InsertElement(1, 4)
MsgBox jsonArray.ToString
```

此程式碼將輸出 `[1,4,2,3]`。

### 移除元素

要移除特定索引的元素，您可以使用 RemoveElementByIndex 方法：

```lotusscript
Call jsonArray.RemoveElementByIndex(2)
MsgBox jsonArray.ToString
```

此程式碼將輸出 `[1,4,3]`。

## 結論

透過使用 NotesJSONArray 類別，您可以在 LotusScript 中輕鬆地建立、解析和操作 JSON 陣列。這使得在 HCL Domino 應用程式中處理 JSON 資料變得更加方便和高效。欲了解更多資訊，請參閱 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) 和 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html)。
