---
title: "Domino IQ Requests Timing Out at 5 Minutes? No Setting to Raise — Switch to Streaming"
description: "You build a long-document summary on Domino IQ; in testing the prompts are short and it's instant. In production someone feeds in a huge thread on a modest GPU, and you hit a 'network processing did not complete in time' timeout. You go hunting for a timeout setting to raise — there isn't one. Domino IQ requests time out at about 5 minutes, by design, and it can't be changed. This piece walks a real scenario: why it times out, how to switch from Completion to CompletionStream to get past it, and one important caveat — streaming keeps it from timing out, but doesn't make it faster."
pubDate: 2026-09-05T07:30:00+08:00
lang: en
slug: domino-iq-timeout-streaming
tags:
  - "Domino IQ"
  - "AI"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Domino IQ requests time out (KB0133301) — HCL Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0133301"
  - title: "CompletionStream method (NotesLLMRequest) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_completionstreamLLM_method.html"
  - title: "NotesLLMRequest class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html"
relatedJava: ["LLMReq", "LLMRes"]
relatedSsjs: []
---

You built a long-document summary feature on Domino IQ: the user clicks a button, a long email thread or a big document goes to the LLM, and a summary comes back. In development you tested with short prompts — instant, no problem.

In production, someone feeds in a big chunk of content, the box's GPU is only modest — the screen hangs for a while, then this pops up:

```
The requested operation did not complete:
Network processing did not complete within a reasonable time. Please retry.
```

(The Japanese-client wording in the KB: "ネットワークの処理が適当な時間内に完了しませんでした。リトライしてください。")

Your first instinct is probably to find "the timeout setting I can raise." There **isn't one**. So this piece walks the scenario end to end: why it times out, what the actual fix is, and a caveat plenty of people miss.

---

## TL;DR

- **Domino IQ requests time out at about 5 minutes, by design, and it can't be changed.** The official KB0133301 states it plainly: requests time out at a "realistic time" of roughly 5 minutes, and this setting cannot be modified.
- **The usual root cause is an underspecced GPU**: the model runs slowly, can't finish a long response inside 5 minutes, and the synchronous call hits the ceiling.
- **The fix is streaming**: swap `Completion` for `CompletionStream`, and the response comes back chunk by chunk via the `LLMCompletionStreamNotify` event, so processing continues past 5 minutes.
- **But it's not a performance cure-all**: streaming keeps it from timing out — it does **not** make it faster. If requests routinely exceed 5 minutes, that's the hardware talking — consider a GPU upgrade.

---

## Why it times out: 5 minutes, hard-coded, not configurable

First, this isn't a bug and it isn't a setting you missed. [KB0133301](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0133301) (applies to Domino 14.5 and later) is blunt: Domino IQ requests time out at a "realistic time" of about 5 minutes, and **that timeout cannot be changed through configuration**.

When you hit it, it's usually because the GPU is underspecced: inference is slow, and a long response can't be produced within 5 minutes. Your original code — `session.CreateLLMRequest()` then `Completion(server, command, prompt)` — is **synchronous**: it sends the request and waits, all the way, until the LLM has produced the **entire** response before returning. That wait is the "network processing," and once it crosses the ~5-minute ceiling, you get that error.

So digging through notes.ini or the Command document for a timeout parameter is wasted effort — it doesn't exist. To get past 5 minutes, you need a call style that doesn't wait for the whole response at once.

## The fix: swap Completion for CompletionStream

The key is changing from "wait for the whole thing" to "receive as it's produced." [`CompletionStream`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_completionstreamLLM_method.html) takes the same parameters as `Completion` (server, command, user prompt — three Strings), but it **doesn't block waiting for a complete response**: each time the LLM produces a chunk, Domino IQ hands it back to you through the `LLMCompletionStreamNotify` event. Data keeps flowing, so there's no "sit idle for over 5 minutes," and processing continues past the ceiling.

It's three pieces: wire the event to a callback with `On Event`, call `CompletionStream`, and handle each chunk in the callback:

```lotusscript
' In (Declarations), at module level, so Click and ProcessResponse share the same uidoc
Dim uidoc As NotesUIDocument

Sub Click(Source As Button)
    Dim session As New NotesSession
    Dim workspace As New NotesUIWorkspace
    Dim llmreq As NotesLLMRequest
    Dim prompt As String

    Set uidoc = workspace.CurrentDocument
    prompt = uidoc.FieldGetText("Prompt")

    Set llmreq = session.CreateLLMRequest()
    ' Wire the stream-notify event to ProcessResponse
    On Event LLMCompletionStreamNotify From llmreq Call ProcessResponse
    ' Same three parameters as Completion: server, command, user prompt
    Call llmreq.CompletionStream("DominoIQ server/Org", "stdSummary", prompt)
End Sub

' Called once per chunk; lastResponse is True on the final chunk
Sub ProcessResponse(Source As NotesLLMRequest, Byval lastResponse As Boolean, Byval content As String)
    Call uidoc.FieldAppendText("Results", content)
End Sub
```

The callback signature is a fixed three parameters: `Source As NotesLLMRequest`, `Byval lastResponse As Boolean`, `Byval content As String`. `content` is the newly produced chunk, which you append to a field (or a buffer); `lastResponse` is `True` on the **final** chunk, so use it to finalize (save, unlock the UI). To abort mid-stream (the user cancels), call `CancelStream` (the full method and event definitions are in the [`NotesLLMRequest` class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html)).

⚠️ A trap you only hit once you split the Sub: `uidoc` must be declared at the **(Declarations)** module level, not just `Set` inside `Click`. The official example keeps everything in one `Sub` so it never surfaces; but once you split into a button handler + a callback like this, any object the two need to share (here, `uidoc`) has to live at module level — otherwise `ProcessResponse`'s `uidoc` is a separate, never-`Set` variable, and the first `FieldAppendText` throws `Object variable not set`. (Get in the habit of `Option Declare`, and a missing declaration like this is caught at compile time.)

Against the synchronous version, the only difference is "one return of the whole response" becoming "several callbacks, one chunk each" — logically an extra event handler, but that's exactly what lets it break past the 5-minute wall.

## But it's not a performance cure-all (the honest caveat)

Here's the point most likely to be skipped and most worth stating. The KB is candid: streaming "lets processing continue, but does **not** mean processing time is shortened."

In other words, `CompletionStream` solves "**will it get cut off at 5 minutes**," not "**how fast is it**." An inference that takes 8 minutes still takes 8 minutes with streaming — it just isn't killed at the 5-minute mark. If your requests routinely approach or exceed 5 minutes, that's not a coding problem, it's the **hardware talking**: the KB explicitly suggests considering a GPU (or other hardware) upgrade in that case.

So the right order of judgment is: first confirm the delay is even reasonable (is the prompt too long, can the command's system prompt be trimmed, is the model oversized); if the work genuinely is that heavy, use streaming to let it finish while you plan the GPU upgrade — don't treat streaming as magic that "makes Domino IQ fast," because it isn't.

## Choosing between streaming and synchronous

This also corrects an easy impression. When the site introduced [`NotesLLMRequest`](/domino-news/en/posts/notes-llm-request), it noted that streaming's callback model is more complex than `Completion`, and most backend cases are fine with `Completion`. That still holds — **but this piece is the exception**: when a single inference might approach 5 minutes, streaming stops being an optional "typewriter UI effect" and becomes a necessity to avoid being timed out.

- **Short, fast, certain to finish within 5 minutes** (most backend agents, short-prompt summaries) → `Completion`, simple.
- **Long, slow, might approach or exceed 5 minutes** (big documents, big threads, a modest GPU) → `CompletionStream`, past the timeout.

## Wrap-up

When Domino IQ hits a timeout, don't go looking for the setting that doesn't exist: requests time out at about 5 minutes, hard-coded and non-configurable (KB0133301). The fix is swapping `Completion` for `CompletionStream`, receiving chunks via the `LLMCompletionStreamNotify` event so processing continues past 5 minutes. But keep the caveat in view: streaming lets it **finish**, it doesn't make it **fast**; if you're routinely over 5 minutes, the thing to upgrade is the GPU, not the search for another setting.

## What about Java and SSJS?

Domino IQ's LLM API maps to `LLMReq` / `LLMRes` on the Java side (`LLMReq` has both completion and a streaming completion). SSJS has no counterpart class today. Java streaming likewise uses an event/callback model to get past the same timeout; the details are for a future Java-specific piece.
