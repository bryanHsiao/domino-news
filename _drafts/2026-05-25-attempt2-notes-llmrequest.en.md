---
title: "NotesLLMRequest: Call an LLM from LotusScript in 4 Lines"
description: "Domino 14.5 introduces NotesLLMRequest and NotesLLMResponse classes in LotusScript, enabling developers to synchronously call Domino IQ's local LLM within applications. This article explores their usage with practical examples."
pubDate: "2026-05-25T07:26:33+08:00"
lang: "en"
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

In HCL Domino 14.5, HCL introduced two new LotusScript classes: NotesLLMRequest and NotesLLMResponse, allowing developers to directly call Domino IQ's local Large Language Model (LLM) within applications.

## Introduction to NotesLLMRequest and NotesLLMResponse

The NotesLLMRequest class is used to send generative AI queries to a Domino server, while the NotesLLMResponse class is used to receive responses from the server. These classes enable developers to seamlessly integrate AI capabilities into LotusScript applications.

## Example: Auto-Reply Agent

The following example demonstrates how to use NotesLLMRequest and NotesLLMResponse to create an auto-reply agent that generates responses based on the content of received emails.

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

    ' Construct the prompt
    prompt = "Please generate an appropriate reply based on the following email content: " & doc.GetItemValue("Body")(0)

    ' Create LLM request
    Set llmRequest = session.CreateLlmRequest()
    Set llmResponse = llmRequest.Completion("generate_reply", prompt, "")

    ' Create reply email
    Set reply = db.CreateDocument()
    reply.Form = "Memo"
    reply.SendTo = doc.From
    reply.Subject = "Re: " & doc.Subject(0)
    reply.Body = llmResponse.Content
    reply.Send False
End Sub
```

In this example, the agent extracts the content from the received email, constructs a prompt, then uses NotesLLMRequest to send the request and NotesLLMResponse to receive the generated reply content, finally sending the reply email to the original sender.

## Further Reading

- [NotesLLMRequest (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html)
- [NotesLLMResponse (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMResponse_class.html)
- [New LotusScript and Java classes for Domino IQ](https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html)
