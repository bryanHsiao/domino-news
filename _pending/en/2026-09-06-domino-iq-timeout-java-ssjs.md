---
title: "The Java Fix for Domino IQ Timeouts: LLMReq.completionStream, and How XPages SSJS Calls It"
description: "Yesterday's piece used LotusScript's CompletionStream to get past Domino IQ's 5-minute timeout; if your code is Java (an agent, a bean) or XPages (SSJS), you hit the same timeout. This is the Java version: LLMReq.completionStream with the CompletionStreamCallback interface (return Continue/Stop to control the stream), plus a key fact — SSJS has no native LLM class, but SSJS's session IS a lotus.domino.Session, so you call the Java API directly or wrap the streaming in a Java class and reference it from SSJS. With a three-language comparison table."
pubDate: 2026-09-06T07:30:00+08:00
lang: en
slug: domino-iq-timeout-java-ssjs
tags:
  - "Domino IQ"
  - "Java"
  - "SSJS"
  - "Tutorial"
sources:
  - title: "LLMReq (Java) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESLLMREQUEST_CLASS_JAVA.html"
  - title: "CompletionStream method (LLMReq - Java) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CompletionstreamLLM_method_Java.html"
  - title: "Using Script Libraries — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_SCRIPT_LIBRARIES.html"
  - title: "Understanding XPages (SSJS accesses the same Domino objects as LS/Java) — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_overview_xpages.html"
relatedJava: ["LLMReq", "LLMRes"]
relatedSsjs: []
---

[Yesterday's piece](/domino-news/en/posts/domino-iq-timeout-streaming) covered how LotusScript uses `CompletionStream` to get past Domino IQ's 5-minute timeout. That timeout is on the Domino IQ side, by design, independent of which language calls it — so if your code is **Java** (a background agent, or a bean) or runs on **XPages** (SSJS), you hit the exact same wall.

This piece fills in the other two languages: how Java's `LLMReq.completionStream` is written, and a question plenty of people get stuck on — **SSJS has no native LLM class, so how do you actually use it on XPages?**

---

## TL;DR

- **The Java factory is on Session too**: `LLMReq llmreq = session.createLLMRequest();`, synchronous via `completion(...)`, streaming via `completionStream(...)`.
- **Java streaming uses a callback interface**: the fourth parameter of [`completionStream(server, command, prompt, callback)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CompletionstreamLLM_method_Java.html) is an `LLMReq.CompletionStreamCallback`, whose `callback(boolean lastResponse, String content)` fires once per chunk.
- **The return value is the "cancel button"**: the callback returns a `CompletionStreamAction` enum — `Continue` to keep going, `Stop` to abort (the equivalent of LS's `CancelStream`).
- **SSJS has no native LLM class, but you don't need one**: XPages' `session` IS a `lotus.domino.Session`, so a synchronous call is just `session.createLLMRequest().completion(...)`; to stream past the timeout, wrap it in a Java class and reference that from SSJS.

---

## The Java version: LLMReq.completionStream + CompletionStreamCallback

The Java object model lines up with LotusScript: [`LLMReq`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESLLMREQUEST_CLASS_JAVA.html) is created by `Session` via `createLLMRequest()`, a synchronous request uses `completion(server, command, userPrompt)` (subject to the 5-minute timeout), and streaming uses `completionStream(...)`.

The difference is how you receive the stream. LotusScript wires an event to a Sub with `On Event`; **Java passes a callback object instead** — `completionStream`'s fourth parameter is the `LLMReq.CompletionStreamCallback` interface, which has a single method:

```java
import lotus.domino.*;

public class DominoIQSummarizer {

    // Take an existing Session (available in an agent, a bean, or when called from SSJS)
    public String summarize(Session session, String prompt) throws NotesException {
        LLMReq llmreq = session.createLLMRequest();
        final StringBuilder out = new StringBuilder();

        // Streaming: each chunk lands in the callback; data keeps flowing, so no idle wait past 5 min
        llmreq.completionStream("DominoIQ server/Org", "stdSummary", prompt,
            new LLMReq.CompletionStreamCallback() {
                public LLMReq.CompletionStreamAction callback(boolean lastResponse, String content) {
                    out.append(content);                     // content is the newly produced chunk
                    // lastResponse is true on the final chunk; to abort early, return ...Stop
                    return LLMReq.CompletionStreamAction.Continue;
                }
            });

        return out.toString();
    }
}
```

Two things to note:

- **The callback's two parameters** map to the LS event — `boolean lastResponse` (`true` on the final chunk, for finalizing) and `String content` (the newly produced chunk).
- **The return value is the control flow**: return `CompletionStreamAction.Continue` to keep streaming, `CompletionStreamAction.Stop` to abort — that single return value folds in what LS needs a separate `CancelStream` method to do.

The mechanism is the same as yesterday's LS piece: `completion` waits for the whole response at once and hits the 5-minute ceiling; `completionStream` delivers chunks as they're produced, data keeps flowing, and processing continues past that limit.

## How XPages SSJS calls it: no native class, so reference Java

The first misconception on the SSJS side is "there's no SSJS LLM API like `createLLMRequest`." Correct — **SSJS has no native class for Domino IQ.** But you don't need one: the docs are explicit that [XPages Server JavaScript accesses the same Domino objects that LotusScript and Java use](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_overview_xpages.html) — in other words, the `session` in SSJS is a `lotus.domino.Session`. So:

A **synchronous call** can be written straight in SSJS (`session` is that Java object):

```javascript
// SSJS (XPages): session is a lotus.domino.Session, so call the Java API directly
var llmreq = session.createLLMRequest();
llmreq.completion("DominoIQ server/Org", "stdSummary", promptValue);
// synchronous and simple, but still subject to the 5-minute timeout
```

**Streaming is different**: `completionStream` wants you to pass an implementation of the `CompletionStreamCallback` interface, and "implement a Java interface from inside SSJS" is neither clean nor maintainable in XPages SSJS. The right move here is to **put the streaming in Java and reference it from SSJS** — the `DominoIQSummarizer` class above. Drop it into a Java script library, and SSJS can reference it:

```javascript
// SSJS: reference the class you placed in a Java script library
importPackage(com.example.iq);          // your Java package name

var helper = new DominoIQSummarizer();
var summary = helper.summarize(session, promptValue);   // pass SSJS's session in
// summary is the fully assembled streamed result, past the 5-minute timeout
```

(Putting the Java logic in a [script library](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_SCRIPT_LIBRARIES.html) and referencing it from SSJS is the most direct way to "use Java for what SSJS can't do" in XPages; a managed bean callable from EL/SSJS is another common choice.) The key is that `session` — because SSJS's `session` is a `lotus.domino.Session`, you pass it straight into the Java method, no need to open a separate session inside the Java code.

## Three languages, one job

| | Create the request | Stream | How you "cancel" |
| --- | --- | --- | --- |
| **LotusScript** | `session.CreateLLMRequest()` | `On Event LLMCompletionStreamNotify` → callback Sub | call `CancelStream` |
| **Java** | `session.createLLMRequest()` | pass an `LLMReq.CompletionStreamCallback` object | callback returns `CompletionStreamAction.Stop` |
| **XPages SSJS** | (no native class) use `session.createLLMRequest()` via the Java API | wrap streaming in a Java class, reference from SSJS | handled inside that Java class |

Underneath, all three are the same Domino IQ request against the same 5-minute timeout; the only difference is the language-idiomatic way of catching a response that arrives chunk by chunk.

## Wrap-up

Domino IQ's 5-minute timeout is language-agnostic. Java gets past it with `LLMReq.completionStream` plus a `CompletionStreamCallback` (whose return value, `Continue`/`Stop`, controls the stream); on XPages, even though SSJS has no native LLM class, `session` is a `lotus.domino.Session`, so a synchronous call is written directly and streaming is wrapped in a Java class you reference. For where all of this starts — why it's 5 minutes, where the timeout lives, why streaming gets past it — see yesterday's [LotusScript version](/domino-news/en/posts/domino-iq-timeout-streaming).

And that "doesn't make it faster, just keeps it from timing out" caveat applies to Java and SSJS just the same: streaming lets a long request finish, but if you're routinely over 5 minutes, the thing to upgrade is still the GPU.
