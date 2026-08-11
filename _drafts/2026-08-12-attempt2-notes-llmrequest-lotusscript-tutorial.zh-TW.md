---
title: "使用 NotesLLMRequest 類別在 LotusScript 中進行 AI 查詢"
description: "學習如何在 LotusScript 中使用 NotesLLMRequest 類別向 Domino 伺服器發送 AI 查詢並獲取回應。"
pubDate: "2026-08-12T07:42:24+08:00"
lang: "zh-TW"
slug: "notes-llmrequest-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino IQ"
sources:
  - title: "New LotusScript and Java classes for Domino IQ"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html"
  - title: "HCL Domino Designer 14.5.1 documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/index.html"
  - title: "LotusScript Class Map v0.9 — HCL Domino 14.5.1 — OpenNTF"
    url: "https://www.openntf.org/ls-classmap/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-llmrequest-lotusscript-tutorial
-->

## 簡介

HCL Domino 14.5 引入了新的 LotusScript 類別，允許開發者在應用程式中整合 AI 功能。本文將介紹如何使用 `NotesLLMRequest` 類別向 Domino 伺服器發送 AI 查詢並獲取回應。

## 先決條件

- HCL Domino 14.5 或更新版本。
- 基本的 LotusScript 編程知識。

## 步驟

### 1. 初始化 NotesSession

首先，初始化 `NotesSession` 物件：

```lotusscript
Dim session As New NotesSession
```

### 2. 創建 NotesLLMRequest 物件

接下來，創建 `NotesLLMRequest` 物件：

```lotusscript
Dim llmRequest As NotesLLMRequest
Set llmRequest = session.CreateLLMRequest()
```

### 3. 設定查詢參數

設定查詢的參數，例如查詢內容和模型名稱：

```lotusscript
llmRequest.Prompt = "請解釋量子物理學的基本概念。"
llmRequest.Model = "gpt-3.5-turbo"
```

### 4. 發送查詢並獲取回應

發送查詢並獲取 `NotesLLMResponse` 物件：

```lotusscript
Dim llmResponse As NotesLLMResponse
Set llmResponse = llmRequest.Send()
```

### 5. 處理回應

檢查回應狀態並處理回應內容：

```lotusscript
If llmResponse.Status = 200 Then
    Dim responseText As String
    responseText = llmResponse.Body
    MsgBox "AI 回應: " & responseText
Else
    MsgBox "查詢失敗，狀態碼: " & llmResponse.Status
End If
```

## 完整範例

以下是完整的範例程式碼：

```lotusscript
Sub QueryAI()
    Dim session As New NotesSession
    Dim llmRequest As NotesLLMRequest
    Set llmRequest = session.CreateLLMRequest()
    llmRequest.Prompt = "請解釋量子物理學的基本概念。"
    llmRequest.Model = "gpt-3.5-turbo"
    Dim llmResponse As NotesLLMResponse
    Set llmResponse = llmRequest.Send()
    If llmResponse.Status = 200 Then
        Dim responseText As String
        responseText = llmResponse.Body
        MsgBox "AI 回應: " & responseText
    Else
        MsgBox "查詢失敗，狀態碼: " & llmResponse.Status
    End If
End Sub
```

## 結論

透過 `NotesLLMRequest` 和 `NotesLLMResponse` 類別，開發者可以在 LotusScript 中輕鬆地向 Domino 伺服器發送 AI 查詢並處理回應，從而在應用程式中整合強大的 AI 功能。更多資訊請參閱 [HCL Domino Designer 14.5.1 文件](https://help.hcl-software.com/dom_designer/14.5.1/index.html)。
