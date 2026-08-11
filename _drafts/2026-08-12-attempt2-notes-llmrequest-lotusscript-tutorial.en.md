---
title: "Using NotesLLMRequest Class for AI Queries in LotusScript"
description: "Learn how to use the NotesLLMRequest class in LotusScript to send AI queries to a Domino server and retrieve responses."
pubDate: "2026-08-12T07:42:24+08:00"
lang: "en"
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

## Introduction

HCL Domino 14.5 introduces new LotusScript classes that enable developers to integrate AI capabilities into their applications. This article will guide you through using the `NotesLLMRequest` class to send AI queries to a Domino server and retrieve responses.

## Prerequisites

- HCL Domino 14.5 or later.
- Basic knowledge of LotusScript programming.

## Steps

### 1. Initialize NotesSession

First, initialize a `NotesSession` object:

```lotusscript
Dim session As New NotesSession
```

### 2. Create NotesLLMRequest Object

Next, create a `NotesLLMRequest` object:

```lotusscript
Dim llmRequest As NotesLLMRequest
Set llmRequest = session.CreateLLMRequest()
```

### 3. Set Query Parameters

Set the parameters for your query, such as the prompt and model name:

```lotusscript
llmRequest.Prompt = "Explain the basic concepts of quantum physics."
llmRequest.Model = "gpt-3.5-turbo"
```

### 4. Send Query and Retrieve Response

Send the query and retrieve a `NotesLLMResponse` object:

```lotusscript
Dim llmResponse As NotesLLMResponse
Set llmResponse = llmRequest.Send()
```

### 5. Process Response

Check the response status and process the response content:

```lotusscript
If llmResponse.Status = 200 Then
    Dim responseText As String
    responseText = llmResponse.Body
    MsgBox "AI Response: " & responseText
Else
    MsgBox "Query failed with status code: " & llmResponse.Status
End If
```

## Complete Example

Here is the complete example code:

```lotusscript
Sub QueryAI()
    Dim session As New NotesSession
    Dim llmRequest As NotesLLMRequest
    Set llmRequest = session.CreateLLMRequest()
    llmRequest.Prompt = "Explain the basic concepts of quantum physics."
    llmRequest.Model = "gpt-3.5-turbo"
    Dim llmResponse As NotesLLMResponse
    Set llmResponse = llmRequest.Send()
    If llmResponse.Status = 200 Then
        Dim responseText As String
        responseText = llmResponse.Body
        MsgBox "AI Response: " & responseText
    Else
        MsgBox "Query failed with status code: " & llmResponse.Status
    End If
End Sub
```

## Conclusion

By utilizing the `NotesLLMRequest` and `NotesLLMResponse` classes, developers can seamlessly send AI queries to a Domino server and process the responses within LotusScript, enabling the integration of powerful AI features into their applications. For more information, refer to the [HCL Domino Designer 14.5.1 documentation](https://help.hcl-software.com/dom_designer/14.5.1/index.html).
