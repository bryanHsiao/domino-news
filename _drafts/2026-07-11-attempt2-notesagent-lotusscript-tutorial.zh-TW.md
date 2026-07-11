---
title: "使用 LotusScript 操作 NotesAgent：深入指南"
description: "本文提供如何使用 LotusScript 操作 NotesAgent 的詳細指南，包括存取、執行、檢查狀態等，並附有實際範例。"
pubDate: "2026-07-11T08:00:41+08:00"
lang: "zh-TW"
slug: "notesagent-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesAgent (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html"
  - title: "Run (NotesAgent - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_RUN_METHOD_6415.html"
  - title: "Examples: LastRun property (NotesAgent - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_LASTRUN_PROPERTY_AGENT.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesagent-lotusscript-tutorial
-->

## 什麼是 NotesAgent？

`NotesAgent` 是 HCL Domino 中的物件，代表資料庫中的代理程式。代理程式可以是共享的或私有的，並可執行各種操作，如自動化任務、資料處理等。您可以透過 `NotesSession` 或 `NotesDatabase` 物件來存取 `NotesAgent`。

## 存取 NotesAgent

有三種方式可以存取代理程式：

1. **透過代理程式名稱存取**：

   ```lotusscript
   Dim db As NotesDatabase
   Dim agent As NotesAgent
   Set db = session.CurrentDatabase
   Set agent = db.GetAgent("AgentName")
   ```

2. **存取當前執行的代理程式**：

   ```lotusscript
   Dim agent As NotesAgent
   Set agent = session.CurrentAgent
   ```

3. **存取資料庫中的所有代理程式**：

   ```lotusscript
   Dim db As NotesDatabase
   Dim agent As NotesAgent
   Dim agentList As NotesAgent
   Set db = session.CurrentDatabase
   Set agentList = db.Agents
   ForAll agent In agentList
       ' 處理每個代理程式
   End ForAll
   ```

## 執行代理程式

您可以使用 `Run` 方法來執行代理程式：

```lotusscript
Dim status As Integer
status = agent.Run()
If status = 0 Then
    MsgBox "代理程式執行成功"
Else
    MsgBox "代理程式執行失敗，狀態碼：" & status
End If
```

`Run` 方法可選擇性地接受一個參數，該參數是要傳遞給代理程式的文件的 note ID。這在需要對特定文件執行操作時非常有用。

## 檢查代理程式狀態

您可以使用以下屬性來檢查代理程式的狀態：

- **`IsEnabled`**：指示代理程式是否啟用。

  ```lotusscript
  If agent.IsEnabled Then
      MsgBox "代理程式已啟用"
  Else
      MsgBox "代理程式未啟用"
  End If
  ```

- **`LastRun`**：返回代理程式上次執行的日期和時間。

  ```lotusscript
  Dim lastRunTime As Variant
  lastRunTime = agent.LastRun
  MsgBox "代理程式上次執行時間：" & CStr(lastRunTime)
  ```

- **`HasRunSinceModified`**：指示代理程式自上次修改後是否已執行。

  ```lotusscript
  If agent.HasRunSinceModified Then
      MsgBox "代理程式自上次修改後已執行"
  Else
      MsgBox "代理程式自上次修改後未執行"
  End If
  ```

## 結論

透過 `NotesAgent` 類別，您可以在 HCL Domino 中有效地管理和執行代理程式。理解如何存取、執行和檢查代理程式的狀態，將有助於您在應用程式開發中更靈活地自動化各種任務。

有關 `NotesAgent` 的更多詳細資訊，請參閱 [官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html)。
