---
title: "NotesLLMRequest: Call an LLM from LotusScript in 4 Lines"
description: "Domino 14.5 introduced NotesLLMRequest and NotesLLMResponse — two LotusScript classes that expose Domino IQ's local LLM as a synchronous API for app developers. This article walks the full surface: the session.CreateLlmRequest() factory method, the Completion three-parameter signature, the CompletionStream streaming variant, the IsCommandAvailable / GetAvailableCommands defensive helpers, and the Content / FinishReason / Role fields on NotesLLMResponse. Why the API takes a commandName rather than a raw prompt — the Command document abstraction lets admins and devs each control their own layer. Includes two practical examples (auto-reply agent + conditional summarization) and the Java mapping to LLMReq / LLMRes."
pubDate: 2026-05-23T07:30:00+08:00
lang: en
slug: notes-llm-request
tags:
  - "Domino IQ"
  - "AI"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesLLMRequest class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html"
  - title: "NotesLLMResponse class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMResponse_class.html"
  - title: "New LotusScript and Java classes for Domino IQ — 14.5 What's new"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html"
  - title: "Domino IQ — HCL Domino 14.5.1 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/domino_iq_server.html"
  - title: "Quick LLM Access via 4 Lines of Code — XPagesDeveloper.com"
    url: "https://www.xpagedeveloper.com/2025/quick-llm-access-via-4-lines-of-code"
relatedJava: ["LLMReq", "LLMRes"]
relatedSsjs: []
cover: "/covers/notes-llm-request.png"
coverStyle: "minimalist-mono"
---

## TL;DR

- **Domino 14.5 introduced [`NotesLLMRequest` / `NotesLLMResponse`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html)** — LotusScript sends a prompt to the server-side LLM and reads the response. The call goes through in-process IPC, so no HTTP latency.
- **4-line minimum**: `session.CreateLlmRequest()` → `Completion(serverName, commandName, userPrompt)` → read `.Content`.
- The API design **separates prompt from command** — `commandName` references a Command document pre-built by the admin in `dominoiq.nsf` (containing the system prompt + model parameters); the app developer only supplies the user prompt.
- Defensive helpers: `IsCommandAvailable(name)` and `GetAvailableCommands()` for production sanity checks.
- Streaming mode: `CompletionStream` + `CancelStream` for long responses you want to surface incrementally in a UI.
- Prerequisite: Domino IQ enabled on the server + at least one Command document (architecture / installation in the earlier [Domino IQ intro](/en/posts/domino-iq/)).

---

## 4-line minimum

Once the server has Domino IQ configured and a Command document, the entire call flow is:

```lotusscript
Dim session As New NotesSession
Dim llmreq As NotesLLMRequest
Dim llmresp As NotesLLMResponse

Set llmreq = session.Createllmrequest()
Set llmresp = llmreq.Completion(db.server, "StdReplyEmail", "Customer said: 'How do I return this?'")
MsgBox llmresp.Content
```

Things to notice:

- **Not `New NotesLLMRequest()`** — use the `session.Createllmrequest()` factory method (same NotesSession factory pattern as `CreateRichTextItem` / `CreateDateTime`).
- `db.server` resolves to the current database's server name; pass a different server name string to target a remote Domino IQ server.
- `"StdReplyEmail"` is one of the Commands shipped with Domino IQ — no need to create it yourself.
- Synchronous call — once `Completion` returns, `llmresp.Content` is ready.

---

## The full NotesLLMRequest surface

Factory method:

```lotusscript
Set llmreq = session.Createllmrequest()
```

`NotesLLMRequest` exposes **five methods**:

### `Completion(serverName, commandName, userPrompt) → NotesLLMResponse`

Synchronous chat completion request to Domino IQ. All three parameters are strings:

| Parameter | Meaning |
|---|---|
| `serverName` | Which Domino IQ server to hit. Use `db.server` for the current database's server; pass an explicit server name for remote. |
| `commandName` | The name of a [Command document](https://help.hcl-software.com/domino/14.5.1/admin/conf_add_llm_command_document.html) pre-built in `dominoiq.nsf`, holding the system prompt + token cap + temperature + other model parameters. |
| `userPrompt` | The user's prompt text. Gets merged with the system prompt from the Command before being sent to the LLM. |

### `CompletionStream(...)` — streaming mode

Same semantics as `Completion`, but the response is **delivered incrementally as it's generated** — useful for "typewriter effect" UIs or long responses you don't want users staring at a spinner for.

### `CancelStream()`

Aborts an in-progress `CompletionStream` (user clicked cancel, the UI was closed, etc.).

### `IsCommandAvailable(commandName) → Boolean`

Checks whether the named Command document exists in the current server's `dominoiq.nsf`. **Essential for production** — avoids the app blowing up if an admin renames or deletes a command.

```lotusscript
If Not llmreq.IsCommandAvailable("MyCustomSummary") Then
    Print "Command missing — cannot proceed"
    Exit Sub
End If
```

### `GetAvailableCommands() → Variant array`

Returns an array of all Command names available on the current server. Useful for: populating a UI dropdown where the user picks a command, or doing a startup sanity check.

```lotusscript
Dim cmds As Variant
cmds = llmreq.GetAvailableCommands()
ForAll c In cmds
    Print c
End ForAll
```

---

## NotesLLMResponse — three fields

The response object is **flat** — just three properties:

### `.Content As String`

The LLM's generated response text. **90% of use cases only need this.**

### `.FinishReason As String`

Why the LLM stopped generating. Common values (aligned with the OpenAI vocabulary):

| Value | Meaning |
|---|---|
| `stop` | Normal end (the model thought it was done) |
| `length` | Hit the `Maximum tokens` cap set in the Command document, response was truncated |
| `content_filter` | Tripped the guard model filter (if one is configured) |

**Important**: `FinishReason = "length"` means **the response is incomplete** — don't treat it as a final answer. Production code should branch:

```lotusscript
Select Case llmresp.FinishReason
Case "stop"
    ' OK, process normally
Case "length"
    Print "Warning: response truncated — bump Maximum tokens or split the prompt"
Case "content_filter"
    Print "Guard model blocked the response"
End Select
```

### `.Role As String`

The role of the message — almost always `"assistant"` when returned by `Completion`. Different models may vary, but 90% of cases don't touch this field.

---

## Why the API takes `commandName` instead of a raw prompt

Seeing `Completion(server, commandName, userPrompt)` for the first time raises a question: why can't the system prompt just live in LotusScript? Why must a Command document be pre-built on the server?

The design deliberately **separates dev and admin concerns**:

| Layer | Owner | Controls |
|---|---|---|
| **Command document** (admin / `dominoiq.nsf`) | Admin / Domino IQ owner | System prompt, model choice, temperature, max tokens, guard model toggle |
| **App code** (LotusScript) | App developer | User prompt content, when to call, how to handle the result |

Concrete payoffs:

1. **Tweak the prompt without changing code**: an admin edits the system prompt in Notes client, the 5-minute cache expires, the new prompt is live — no app redeploy.
2. **Multiple apps share a command**: one "customer-reply" Command serves the mail, CRM, and ticketing apps.
3. **Centralised governance**: switching all LLM calls to a new model or enabling a guard model is a Command-document change, not an app code change.
4. **Separate audit trails**: dev changes to user prompt logic go through the app deployment pipeline; LLM behavior changes go through Domino DB document changes — different change-tracking flows.

---

## Practical example 1: auto-reply agent

A scheduled agent that drafts LLM replies for the inbox and saves them as drafts:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim mailDb As NotesDatabase
    Dim docs As NotesDocumentCollection
    Dim doc As NotesDocument
    Dim llmreq As NotesLLMRequest
    Dim llmresp As NotesLLMResponse

    Set mailDb = session.CurrentDatabase
    Set llmreq = session.Createllmrequest()

    ' Production defense: bail if the command isn't there
    If Not llmreq.IsCommandAvailable("StdReplyEmail") Then
        Print "StdReplyEmail command not available on this server"
        Exit Sub
    End If

    ' Pull unprocessed inbox messages
    Set docs = mailDb.UnprocessedDocuments
    Set doc = docs.GetFirstDocument()

    Do Until doc Is Nothing
        Set llmresp = llmreq.Completion(mailDb.Server, "StdReplyEmail", doc.Body(0))

        If llmresp.FinishReason = "stop" Then
            doc.DraftReply = llmresp.Content
            Call doc.Save(True, False)
            Call session.UpdateProcessedDoc(doc)
        End If

        Set doc = docs.GetNextDocument(doc)
    Loop
End Sub
```

---

## Practical example 2: conditional summarization

Summarize documents over 1000 characters; return the original otherwise:

```lotusscript
Function SummarizeIfLong(doc As NotesDocument) As String
    Dim session As New NotesSession
    Dim llmreq As NotesLLMRequest
    Dim llmresp As NotesLLMResponse
    Dim bodyText As String

    bodyText = doc.GetItemValue("Body")(0)
    If Len(bodyText) < 1000 Then
        SummarizeIfLong = bodyText  ' Short enough — return as-is
        Exit Function
    End If

    Set llmreq = session.Createllmrequest()
    Set llmresp = llmreq.Completion( _
        doc.ParentDatabase.Server, _
        "StdSummarize", _
        bodyText _
    )

    Select Case llmresp.FinishReason
    Case "stop"
        SummarizeIfLong = llmresp.Content
    Case "length"
        ' Summary itself got truncated — safer to fall back to original
        SummarizeIfLong = bodyText
    Case Else
        SummarizeIfLong = bodyText
    End Select
End Function
```

`"StdSummarize"` is one of the built-in Commands. Or build your own in `dominoiq.nsf` — e.g. `"MyCustomTechSummary"` with a specific system prompt that makes the LLM summarize in technical-article voice.

---

## CompletionStream: when it's worth switching

`Completion` blocks until the full response is ready — simple, but a long prompt may take several seconds and the UI stalls.

`CompletionStream` delivers chunks as they're generated, useful for:

- Web UIs that want a "typewriter" effect
- Long-form generation (let the user see the start early and cancel if it's heading the wrong way)
- Backend streaming pipelines forwarding to another service

The cost: LotusScript's callback model isn't as ergonomic as JavaScript's — you assemble your own buffer + handle partial UI updates. Complexity is meaningfully higher than `Completion`. For most backend agent scenarios, you don't need streaming — `Completion` is plenty.

---

## Relationship to other IQ articles

| Topic | Article |
|---|---|
| What Domino IQ is, why local LLM, how to install | [Domino IQ intro](/en/posts/domino-iq/) |
| Advanced: NSF as a vector source for RAG | [Domino IQ RAG](/en/posts/domino-iq-rag/) |
| **This article: how to call it from LotusScript** | You're reading it |

Community supplement: [XPagesDeveloper's "Quick LLM Access via 4 Lines of Code"](https://www.xpagedeveloper.com/2025/quick-llm-access-via-4-lines-of-code) is the cleanest demo of how compact this API really is.

---

## What about Java and SSJS?

| Language | Equivalent classes |
|---|---|
| LotusScript | `NotesLLMRequest` / `NotesLLMResponse` |
| Java | `LLMReq` / `LLMRes` (same logical surface, Java's abbreviated naming style) |
| SSJS / XPages | No direct equivalent — invoke an LS or Java agent, or wrap it behind a REST endpoint |

SSJS has no Domino IQ class. The standard workaround is to write an LS agent that does the IQ work and trigger it from SSJS via `lotusScript:`, or expose the call as a Domino REST API endpoint.
