---
title: "Stream in XPages: Build a Download with getContents, and Set the Charset Yourself"
description: "In XPages you want the user to click a button and download a report file you generate on the spot, or read a file they just uploaded and parse it. The back-end NotesStream (session.createStream) is the tool for that. It has one method that's especially handy in XPages: getContents pours the stream's contents straight into a java.io.OutputStream — which is exactly what the HTTP response's output stream is — so you can stream the generated file to the browser without landing a temp file on disk first. This covers building a download with Stream, reading an uploaded file via fileUpload, writeText's no-line-ending default, and the charset-defaults-to-System trap (the deep dive on that lives in the Java Stream piece; here it's just the fix)."
pubDate: 2026-11-12T07:30:00+08:00
lang: en
slug: ssjs-stream
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesStream (JavaScript) (create, getContents/setContents bridge java.io, thread limitation) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream.html"
  - title: "open (NotesStream - JavaScript) (pathname / charset parameters; charset defaults to System) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_open.html"
  - title: "writeText (NotesStream - JavaScript) (EOL constants; default EOL_NONE) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_writeText.html"
relatedJava: []
relatedSsjs: []
coversClass: "Stream"
apiLang: "ssjs"
---

In XPages you keep running into two things: the user clicks a button and wants to download a CSV or report you generate right then, or the user uploads a file and you need to read and parse it on the back end. Both go through the back-end [`NotesStream`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream.html) — you get one from `session.createStream()`, and the docs define it as "Represents a stream of binary or character data. The stream can be associated with a file."

What makes Stream especially handy in XPages is one method: `getContents` pours the stream's contents **straight into a `java.io.OutputStream`**. And the HTTP response's output stream is exactly a `java.io.OutputStream` — so you can stream the generated file to the browser without landing a temp file on disk first.

This covers building a download with Stream, reading an uploaded file, `writeText`'s line-ending trap, and the charset-defaults-to-System point that bites.

---

## A download: getContents straight into the response

A typical "export" button writes data into the stream in the event, then uses `getContents` to pour it into the response's output stream:

```javascript
var stream = session.createStream();
stream.open("/local/temp/export-" + session.getUserName() + ".csv", "UTF-8");
stream.writeText("Order,Status", NotesStream.EOL_CRLF);
stream.writeText("A001,Processed", NotesStream.EOL_CRLF);

// stream the file to the browser as a download
var ec = facesContext.getExternalContext();
var response = ec.getResponse();
response.setContentType("text/csv; charset=UTF-8");
response.setHeader("Content-Disposition", "attachment; filename=export.csv");
stream.getContents(response.getOutputStream());
stream.close();
facesContext.responseComplete();   // tell JSF: I've handled the response
```

The key line is `stream.getContents(response.getOutputStream())` — the docs say getContents "Copies contents to a java.io.OutputStream," and the response's output stream is that type. The data flows straight from Domino's stream to the browser.

## The charset defaults to System, not UTF-8

A trap tied to [`open`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_open.html) applies in XPages just the same: `open(path)` with no second argument defaults the charset to **System** (the server's platform encoding), not UTF-8. The docs say plainly "Defaults to System." If your CSV has non-ASCII text and you didn't specify a charset, it mojibakes on a server whose locale isn't UTF-8 — and a response header of `charset=UTF-8` only makes it worse, because the declared encoding won't match the bytes you actually wrote.

So always `open(path, "UTF-8")` when generating a file, and keep it consistent with the response's `setContentType("...; charset=UTF-8")`. The full story behind this charset default is in [the Java Stream piece](/domino-news/posts/java-stream/) — the same trap, reachable from both languages.

## writeText adds no line ending by default

Another small trap in [`writeText`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_writeText.html): the one-argument form uses `EOL_NONE` (the docs: "The default is NotesStream.EOL_NONE."), i.e. no line terminator. Write CSV line by line without the second argument and it all runs together on one line. To break lines, pass `NotesStream.EOL_CRLF` (0), `EOL_LF` (1), or `EOL_CR` (2). CSV convention is CRLF, which is why the example above uses `EOL_CRLF`.

## Reading an upload: fileUpload → temp file → open

The other direction — reading a file the user uploaded: the XPages `fileUpload` control stores the file as a server-side temp file; you take its path and open a Stream on it:

```javascript
// uploadedFile is the value bound to fileUpload (com.ibm.xsp.http.UploadedFile)
var path = uploadedFile.getServerFileName();   // server-side temp path
var stream = session.createStream();
stream.open(path, "UTF-8");
var line = stream.readText();                   // decoded by the charset
// …parse…
stream.close();
```

For pure byte work (hashing, copying a file through verbatim), `open(path, "Binary")`, after which the stream only does byte operations.

## One edge: thread confinement, don't stash it in a scope

The class page states "Use of a NotesStream object is limited to the thread in which is created." In XPages that means one concrete thing: **don't store a Stream object in `sessionScope` / `applicationScope` to reuse across requests** — the next request is likely a different thread, and that stream is already invalid. Create one with `session.createStream()` when you need it and `close` it when done. Its lifecycle follows the current request — you don't recycle it by hand the way you would in background Java — but it isn't something to persist across requests.

## What about LotusScript and Java?

The same `Stream`:

- **LotusScript**: `NotesStream`, with `Open` / `WriteText` / `ReadText`, but no `getContents` bridge straight into a `java.io.OutputStream` — that's only in Java and SSJS, which share the Java layer underneath.
- **Java**: `Stream`, identical API; the charset-defaults-to-System trap and the `getContents`/`setContents` details are in [the Java Stream piece](/domino-news/posts/java-stream/).
- **What's SSJS-specific** isn't the API (the methods are shared) — it's **how you wire it into XPages**: `getContents` into the `facesContext` response for a download, the `fileUpload` temp file as input, `responseComplete()`, and not stashing a thread-confined stream in a scope.
