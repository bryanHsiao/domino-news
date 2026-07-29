---
title: "LotusScript Error Handling: On Error Is Per-Procedure, and Resume Next Is Not 'Ignore Errors'"
description: "Two habits sink most LotusScript error handling: treating On Error as if it were global (it's per-procedure, and uncaught errors climb the call stack), and reaching for On Error Resume Next as a blanket 'ignore errors' switch (it hides the bug, it doesn't handle it). A field report on doing it deliberately — the per-procedure scope, the Err / Error$ / Erl lifecycle, the difference between Resume, Resume Next, and Resume label, and the clean-error pattern a web agent actually needs."
pubDate: 2026-07-29T07:30:00+08:00
lang: en
slug: lotusscript-error-handling
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "On Error statement (LotusScript Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ON_ERROR_STATEMENT.html"
  - title: "Resume statement (LotusScript Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_RESUME_STATEMENT.html"
  - title: "Error statement (LotusScript Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ERROR_STATEMENT.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/lotusscript-error-handling.webp"
coverStyle: "risograph"
---

Two habits quietly wreck most LotusScript error handling, and they're the two things the language makes easiest to get wrong. The first is treating `On Error Goto` as if it protected your whole program — it doesn't; it protects the procedure it's written in, and nothing else. The second is reaching for `On Error Resume Next` whenever something throws, as a blanket "make the error go away" switch — which it does, in the worst possible sense: it doesn't handle the error, it hides the bug that caused it.

This is a field report on doing LotusScript error handling on purpose: where a handler's protection actually reaches, how errors climb the call stack when they aren't caught, the lifecycle of the `Err` / `Error$` / `Erl` trio, and the difference between the three `Resume` forms — ending with the clean-error pattern a web agent needs so a failure returns something a browser can read instead of a raw crash.

---

## TL;DR

- [`On Error Goto label`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ON_ERROR_STATEMENT.html) is **per-procedure**. The handler catches errors in *that* Sub or Function only. An error in a Sub it calls, if that Sub has no handler of its own, propagates *up* to the caller's handler.
- `On Error Resume Next` is not "ignore errors." It skips to the next statement and leaves `Err` set — useful only when you check `Err` right after the risky line. Used as a blanket wrapper, it turns a crash into silent wrong behaviour.
- Inside the handler, `Err` is the error number, `Error$` the message, `Erl` the line. They describe the current error until a `Resume` resets them.
- `Resume` retries the failing line (an infinite loop if the cause persists), `Resume Next` continues after it, `Resume label` jumps to a recovery point. Pick deliberately.
- Raise your own with `Error errNumber, "message"`, and catch it in the caller like any built-in error.

## On Error protects one procedure, not your program

The handler you declare with `On Error Goto` is scoped to the procedure it lives in. This is the single most misunderstood thing about LotusScript error handling, because the syntax reads like a global guard and behaves like a local one.

```lotusscript
Sub Main
    On Error Goto Handler
    Call DoWork()            ' if DoWork errors and has no handler, control comes HERE
    Exit Sub
Handler:
    Print "Main caught: " & Err & " — " & Error$ & " at line " & Erl
    Exit Sub
End Sub

Sub DoWork
    ' no On Error here — an error raised in DoWork is not handled locally
    Dim db As New NotesDatabase("", "nope.nsf")   ' fails
    Call db.Open("", "")
End Sub
```

`DoWork` has no handler, so when it errors the runtime unwinds to its caller and runs `Main`'s handler instead. That propagation is the useful half of the per-procedure rule: you don't need a handler in every Sub, you need one at the level where you can actually do something about the failure. The dangerous half is assuming the reverse — that a handler in `Main` will also catch errors from code you `Exit Sub`'d past, or from a *later* procedure. It won't. The handler is armed only while execution is inside its own procedure, after the `On Error` line has run.

## Resume Next is a scalpel, not a blanket

`On Error Resume Next` tells the runtime: when a statement errors, carry on at the next statement, run no handler. That's genuinely useful in exactly one shape — a single risky call you immediately test:

```lotusscript
On Error Resume Next
Set item = doc.GetFirstItem("MaybeMissing")
On Error Goto 0                      ' turn the blanket back off immediately
If Err <> 0 Then
    ' handle the specific expected failure
End If
```

Note the `On Error Goto 0` right after — that disables the active handler so the blanket covers one line, not the rest of the procedure. Used the other way — `On Error Resume Next` at the top of a Sub and never turned off — it swallows *every* error for the whole procedure. The `NotesDatabase` that failed to open returns Nothing, the next line dereferences Nothing, that errors too and is skipped, and you end up with a document half-written and no sign anything went wrong. A crash is a bad afternoon; a silently wrong save is a bad quarter. Reserve `Resume Next` for the narrow "I expect this specific line to sometimes fail and I'll check" case, and turn it off the moment you're past that line.

## The Err / Error$ / Erl lifecycle

Inside a handler these three tell you what happened: `Err` is the numeric code, `Error$` is the message text, `Erl` is the source line the error came from. They stay valid — describing the *current* error — for as long as you're in the handler, and a [`Resume`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_RESUME_STATEMENT.html) resets them. So read what you need (log it, branch on `Err`) before you resume, not after.

You can also raise errors yourself with the [`Error`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ERROR_STATEMENT.html) statement — `Error 1000, "Order total below zero"` — and it behaves exactly like a built-in error: the current procedure's handler catches it, or it propagates to the caller's. That's how you turn a business-rule violation into something the same `On Error` machinery handles, instead of threading a boolean return up through five call layers. Pick numbers above the built-in range so they don't collide.

## The three Resume forms

`Resume` on its own retries the statement that errored. It's the right call only when the handler *fixed the cause* — created the missing directory, re-authenticated — otherwise the same line fails, the handler runs again, and you have an infinite loop. `Resume Next` continues at the statement after the failing one, the "log it and move on" choice inside a loop over many documents where one bad record shouldn't stop the batch. `Resume label` jumps to a named recovery point — usually a single cleanup-and-exit block. Most robust handlers end in `Resume` a cleanup label rather than falling off the end, so open streams and back-end objects get released on the error path too.

## The web-agent clean-error pattern

An unhandled error in a LotusScript web agent is worse than in the client: there's no debugger dialog, just a broken or truncated response, and the browser shows a raw server error. The fix is a handler that owns the output. Because a web agent's response is whatever it `Print`s, the handler's job is to `Print` a clean error — a readable page, or a JSON error object for an API endpoint — instead of letting the agent die mid-stream:

```lotusscript
Sub Initialize
    On Error Goto Handler
    Print "Content-Type: application/json"
    ' ... build and Print the real JSON response ...
    Exit Sub
Handler:
    Print "{""error"":""" & Error$ & """,""code"":" & Err & "}"
    Exit Sub
End Sub
```

The caller (the browser) gets a structured failure it can act on, your logs get `Err` / `Erl`, and the agent exits cleanly instead of emitting half a document. That single top-level handler in `Initialize` is the difference between a web endpoint that fails legibly and one that fails as a mystery.

## What about Java and SSJS?

Here LotusScript is the outlier, and it's worth naming why. Java and SSJS use structured `try` / `catch` / `finally` — an exception is an object, it carries its own stack trace, and `finally` guarantees cleanup. LotusScript's `On Error` / `Resume` is the older line-and-goto model: no exception object, state carried in the global `Err` / `Error$` / `Erl`, and cleanup you arrange by hand with a `Resume` to a label. There's no Domino class to line up here because this is language machinery, not API — so `relatedJava` and `relatedSsjs` are empty. When you move error-handling logic from a LotusScript agent to a Java or XPages one, you're not translating `On Error` to `try` line by line; you're rebuilding it in a model that finally gives you the exception object and the `finally` block LotusScript never had.
