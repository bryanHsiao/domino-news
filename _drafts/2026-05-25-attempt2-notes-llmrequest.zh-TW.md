---
title: "NotesLLMRequest：在 LotusScript 中調用 LLM 的 4 行代碼"
description: "Domino 14.5 引入了 NotesLLMRequest 和 NotesLLMResponse 兩個 LotusScript 類，開發者可透過這些類在應用程式中同步調用 Domino IQ 的本地 LLM。本文將介紹這些類的使用方法，並提供實際範例。"
pubDate: "2026-05-25T07:26:33+08:00"
lang: "zh-TW"
slug: "notes-llmrequest"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino IQ"
sources:
  - title: "New LotusScript and Java classes for Domino IQ"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html"
  - title: "NotesLLMRequest (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html"
  - title: "NotesLLMResponse (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMResponse_class.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html" was already cited by [notes-llm-request] on 2026-05-23. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html" was already cited by [notes-llm-request] on 2026-05-23. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMResponse_class.html" was already cited by [notes-llm-request] on 2026-05-23. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 2
slug: notes-llmrequest
-->

在 HCL Domino 14.5 中，HCL 引入了 NotesLLMRequest 和 NotesLLMResponse 兩個新的 LotusScript 類，讓開發者能夠在應用程式中直接調用 Domino IQ 的本地大型語言模型（LLM）。

## NotesLLMRequest 和 NotesLLMResponse 簡介

NotesLLMRequest 類用於向 Domino 伺服器發送生成式 AI 查詢，而 NotesLLMResponse 則用於接收伺服器返回的回應。這些類的引入使得開發者能夠在 LotusScript 中輕鬆整合 AI 功能。

## 使用範例：自動回覆代理程式

以下範例展示了如何使用 NotesLLMRequest 和 NotesLLMResponse 來建立一個自動回覆代理程式，根據收到的郵件內容生成回覆。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim doc As NotesDocument
    Dim llmRequest As NotesLLMRequest
    Dim llmResponse As NotesLLMResponse
    Dim prompt As String
    Dim reply As NotesDocument

    Set db = session.CurrentDatabase
    Set doc = db.GetDocumentByID(session.CurrentAgent.ParameterDocID)

    ' 構建提示詞
    prompt = "請根據以下郵件內容生成一個適當的回覆：" & doc.GetItemValue("Body")(0)

    ' 創建 LLM 請求
    Set llmRequest = session.CreateLlmRequest()
    Set llmResponse = llmRequest.Completion("generate_reply", prompt, "")

    ' 創建回覆郵件
    Set reply = db.CreateDocument()
    reply.Form = "Memo"
    reply.SendTo = doc.From
    reply.Subject = "Re: " & doc.Subject(0)
    reply.Body = llmResponse.Content
    reply.Send False
End Sub
```

在此範例中，代理程式從收到的郵件中提取內容，構建提示詞，然後使用 NotesLLMRequest 發送請求，並通過 NotesLLMResponse 接收生成的回覆內容，最後將回覆郵件發送給原始發件人。

## 進一步閱讀

- [NotesLLMRequest (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html)
- [NotesLLMResponse (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMResponse_class.html)
- [新 LotusScript 和 Java 類別用於 Domino IQ](https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html)
