---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "學習如何在 LotusScript 中使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。"
pubDate: "2026-10-12T10:09:24+08:00"
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
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 14.5.1 引入了 NotesJSONArray 類別，讓開發者能夠在 LotusScript 中輕鬆處理 JSON 陣列。本文將介紹如何使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。

## 建立 JSON 陣列

要在 LotusScript 中建立 JSON 陣列，首先需要初始化 NotesSession，然後使用 CreateJSONArray 方法來建立新的 JSON 陣列。

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray
```

接下來，可以使用 AppendValue 方法將值新增到陣列中。

```lotusscript
Call jsonArray.AppendValue("第一個元素")
Call jsonArray.AppendValue(123)
Call jsonArray.AppendValue(True)
```

## 解析 JSON 陣列

如果有一個 JSON 陣列的字串表示，可以使用 NotesJSONNavigator 來解析它，然後存取其中的元素。

```lotusscript
Dim jsonString As String
jsonString = "[\"第一個元素\", 123, true]"

Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator(jsonString)

Dim jsonArray As NotesJSONArray
Set jsonArray = jsonNav.GetJSONArray
```

## 存取和修改 JSON 陣列元素

可以使用 GetElementByIndex 方法來存取特定索引的元素，並使用 SetValueByIndex 方法來修改元素的值。

```lotusscript
Dim element As NotesJSONElement
Set element = jsonArray.GetElementByIndex(1)

' 檢查元素類型
If element.ValueType = JSONTYPE_NUMBER Then
    ' 修改元素值
    Call jsonArray.SetValueByIndex(1, 456)
End If
```

## 刪除 JSON 陣列元素

要刪除陣列中的元素，可以使用 RemoveElementByIndex 方法。

```lotusscript
Call jsonArray.RemoveElementByIndex(0)
```

## 將 JSON 陣列轉換為字串

最後，可以使用 ToString 方法將 JSON 陣列轉換為字串表示。

```lotusscript
Dim jsonString As String
jsonString = jsonArray.ToString
```

## 結論

透過 NotesJSONArray 類別，開發者可以在 LotusScript 中方便地建立、解析和操作 JSON 陣列。這使得在 HCL Domino 應用程式中處理 JSON 資料變得更加直觀和高效。更多詳細資訊，請參閱 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) 和 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 的官方文件。
