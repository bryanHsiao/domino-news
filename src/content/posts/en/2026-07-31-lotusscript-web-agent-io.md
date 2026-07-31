---
title: "The LotusScript Web Agent I/O Model: Print Is Your Response, DocumentContext Is Your Request"
description: "A LotusScript web agent has no request object and no response object — it has Print, whose output becomes the HTTP body, and DocumentContext, a special document holding the CGI variables. A field report on the two halves: how the first Print line sets Content-Type so you can return JSON instead of HTML, how to read the query string and POST body from DocumentContext, the CGI-fields gotcha that leaves them empty, and how it all fits with a top-level error handler."
pubDate: 2026-07-31T07:30:00+08:00
lang: en
slug: lotusscript-web-agent-io
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Web agents (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html"
  - title: "DocumentContext property (NotesSession) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTCONTEXT_PROPERTY.html"
  - title: "NotesSession (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
relatedJava: []
relatedSsjs: []
---

Come to a LotusScript web agent from any modern web framework and the first thing you'll look for is the request object and the response object. There isn't one of either. A Domino web agent — the kind you invoke with `?OpenAgent` to build a small JSON endpoint or serve a dynamic fragment — has two much older seams instead: `Print`, whose accumulated output *is* the HTTP response body, and `DocumentContext`, a special in-memory document whose fields *are* the CGI variables of the request. Learn those two and the whole model falls into place; miss how they work and you get an agent that returns HTML when you wanted JSON, or reads an empty query string and can't tell why.

This is a field report on the web agent's I/O model — the output side, the input side, and the two traps on each. It pairs with the [error-handling piece](/domino-news/en/posts/lotusscript-error-handling); together they're most of what a hand-written Domino web endpoint needs.

---

## TL;DR

- **Output is `Print`.** The reference is blunt: "Domino accumulates print statements and creates a page with their contents after the agent runs." Whatever you `Print` is the response body.
- **Set the content type with the first `Print`.** To return JSON instead of the default HTML, the first line you print is the header — `Content-Type: application/json` — followed by a blank line, then the body. That blank line is the HTTP header/body separator; skip it and the header bleeds into your JSON.
- **Input is `Session.DocumentContext`** — a `NotesDocument` carrying the request's CGI variables. GET arguments are in its `Query_String` item; a POST body is in `Request_Content`.
- **The CGI-fields gotcha:** for a form-triggered agent (WebQueryOpen/Save), CGI values only appear if the form has a field named for each one. A standalone `?OpenAgent` agent gets them on `DocumentContext` directly.

## The output side: Print is the body

There is no `response.write`. There is `Print`, and Domino's contract for it is exactly one sentence: "Domino accumulates print statements and creates a page with their contents after the agent runs." Every `Print` appends to one buffer, and that buffer is flushed to the browser as the response when the agent finishes.

By default that response is served as `text/html`. To serve anything else — JSON for an API, CSV for a download, plain text — you set the header yourself, and the mechanism is a small HTTP convention rather than a property: the **first** thing you print is the header line, then a blank line, then the body.

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Print "Content-Type: application/json"    ' the header — must be first
    Print ""                                   ' blank line: end of headers
    Print "{""status"":""ok"",""count"":42}"   ' the body
End Sub
```

Two failure modes live here. If the `Content-Type` line isn't the very first output — even a stray `Print` or a leading space ahead of it — Domino has already begun an HTML response and your header becomes visible text at the top of the page. And if you forget the blank line, the header and the first line of the body run together and the browser can't parse the response. First line, blank line, body: that order is the whole protocol.

## The input side: DocumentContext is the request

The request arrives as [`DocumentContext`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTCONTEXT_PROPERTY.html) on the [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html). For a `?OpenAgent` call there's no real document being edited, so Domino hands you a synthetic one whose items are the CGI variables — the same `Query_String`, `Request_Content`, `Remote_Addr`, `Remote_User` you'd read from any CGI environment, as document fields.

For a GET, the arguments are in `Query_String`; you read and parse it yourself:

```lotusscript
Dim ctx As NotesDocument
Set ctx = session.DocumentContext
Dim qs As String
qs = ctx.Query_String(0)              ' e.g. "OpenAgent&id=1024&fmt=json"
```

For a POST, the body is in `Request_Content`:

```lotusscript
Dim body As String
body = ctx.Request_Content(0)         ' the raw POST payload — parse as form or JSON
```

There's no automatic query parsing and no automatic JSON binding; you get the raw strings and split them yourself (or feed the JSON body to [`NotesJSONNavigator`](/domino-news/en/posts/notes-json-navigator)). That's the price of the model's age, and it's also why it's predictable — nothing is decoded behind your back.

## The gotcha: CGI values aren't always there

The [web agents page](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html) warns about the input side in a way that catches people: "CGI values are available but not automatically. The form backing up the current document must contain a field named after each desired CGI variable." That applies to agents triggered from a form — WebQueryOpen or WebQuerySave — where `DocumentContext` is the form's own document. In that case reading `ctx.Query_String(0)` returns empty unless the form design actually has a `Query_String` field to receive it. Add the CGI fields to the form, or the values silently aren't there.

A standalone `?OpenAgent` agent doesn't have this problem — its `DocumentContext` is the synthetic CGI document and the variables are present directly. So the same `ctx.Query_String(0)` line works out of the box in an `?OpenAgent` endpoint and returns empty in a form agent whose form lacks the field. Knowing which kind of agent you're in tells you whether to expect the CGI values for free.

## Putting the two halves together

A hand-written JSON endpoint is just the two sides plus a guard: read the request off `DocumentContext`, do the work, print the `Content-Type` and the JSON body — and wrap it in the top-level handler from the [error-handling piece](/domino-news/en/posts/lotusscript-error-handling) so a failure prints a clean JSON error instead of a truncated response. Read, work, print, guard. That's the whole shape of a Domino web agent, and once the two seams are clear it's a surprisingly direct way to stand up a small endpoint without XPages or the REST API in the picture.

## What about Java and SSJS?

The model has cousins, not twins. A Java agent doesn't use `Print` — it calls `AgentBase.getAgentOutput()` to get a `PrintWriter` and writes the response through that, but the "first line is the `Content-Type` header, then a blank line" convention is identical, because it's an HTTP convention, not a language one. Java reads the request the same way, off `getDocumentContext()`. SSJS in XPages is a different world entirely: there's a real request/response through `facesContext.getExternalContext()`, with proper parameter maps and no CGI-field ceremony — which is exactly the upgrade you feel when you move a JSON endpoint from a web agent to XPages. The LotusScript agent is the most bare-metal of the three, and for a one-file endpoint that's a feature.
