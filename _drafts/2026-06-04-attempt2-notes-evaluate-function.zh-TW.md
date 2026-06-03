---
title: "使用 LotusScript 中的 Evaluate 函數執行 Notes/Domino 公式"
description: "本教程介紹如何在 LotusScript 中使用 Evaluate 函數執行 Notes/Domino 公式，並提供實際範例。"
pubDate: "2026-06-04T07:37:15+08:00"
lang: "zh-TW"
slug: "notes-evaluate-function"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "Using the Evaluate statement"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_EVALUATE_STATEMENT.html"
  - title: "Formula Language Rules"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=language-formula-rules"
  - title: "Formula Language @Functions A-Z"
    url: "https://www.ibm.com/support/knowledgecenter/de/SSVRGU_9.0.0/com.ibm.designer.domino.main.doc/H_7_FORMULAS_FUNCTION_REFERENCE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-evaluate-function
-->

## 簡介

在 HCL Domino 開發中，LotusScript 提供了強大的功能來執行 Notes/Domino 公式語言。透過 `Evaluate` 函數，開發者可以在程式碼中執行公式，並獲取其結果。這對於需要動態計算或根據特定條件執行公式的應用程式非常有用。

## `Evaluate` 函數的語法

```lotusscript
result = Evaluate(notesFormula [, notesObject])
```

- `notesFormula`：一個字串，包含要執行的 Notes/Domino 公式。
- `notesObject`（可選）：提供公式的上下文，例如，如果公式需要存取特定文件的欄位，則此參數應該是該 `NotesDocument` 物件。

`Evaluate` 函數返回一個陣列，其中包含公式執行的結果。對於單一值，結果將存儲在陣列的第一個元素中。

## 使用範例

### 範例 1：執行簡單的公式

以下範例展示如何在 LotusScript 中執行一個簡單的公式，該公式返回當前日期。

```lotusscript
Dim session As New NotesSession
Dim result As Variant

result = Evaluate("@Today")
MsgBox "Today's date is: " & result(0)
```

在此範例中，`@Today` 公式返回當前日期，並透過 `Evaluate` 函數執行。結果存儲在 `result` 陣列的第一個元素中，並顯示在訊息框中。

### 範例 2：在特定文件的上下文中執行公式

如果公式需要存取特定文件的欄位，則需要提供該文件作為上下文。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim result As Variant

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("YOUR_DOCUMENT_UNID")

result = Evaluate("@UpperCase(FieldName)", doc)
MsgBox "Uppercase value: " & result(0)
```

在此範例中，`@UpperCase` 公式將指定文件中 `FieldName` 欄位的值轉換為大寫。`doc` 物件作為上下文提供給 `Evaluate` 函數。

## 注意事項

- 某些影響使用者介面的 `@` 函數（例如 `@Command`、`@Prompt`）無法在 `Evaluate` 函數中使用。詳細資訊請參閱 [使用 Evaluate 語句](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_EVALUATE_STATEMENT.html)。

- `Evaluate` 函數返回的結果通常是陣列，即使公式只返回單一值。因此，建議使用變體類型來接收結果，並存取陣列的第一個元素以獲取單一值。

透過在 LotusScript 中使用 `Evaluate` 函數，開發者可以靈活地執行 Notes/Domino 公式，從而增強應用程式的功能和動態性。
