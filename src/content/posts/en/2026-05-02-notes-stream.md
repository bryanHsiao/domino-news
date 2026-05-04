---
title: "A Practical Guide to LotusScript NotesStream: Files Done Right"
description: "NotesStream is the LotusScript abstraction for reading and writing files from a Notes/Domino agent. This guide walks through the real Open signature, the Truncate-before-write pattern, text vs binary I/O, and the gotchas the official documentation actually warns about."
pubDate: "2026-05-02T07:00:00+08:00"
lang: "en"
slug: "notes-stream"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesStream class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html"
  - title: "NotesStream.Open method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_OPEN_METHOD_STREAM.html"
  - title: "NotesStream.Truncate method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_TRUNCATE_METHOD_STREAM.html"
cover: "/covers/notes-stream.png"
coverStyle: "paper-craft"
---

## What NotesStream actually is

`NotesStream` is the LotusScript abstraction for reading and writing a file from inside a Notes/Domino agent or script library. You construct one through `NotesSession.CreateStream`, point it at a file with `Open`, and then read or write — either as text (with an optional charset) or as raw bytes.

It is **not** a generic "fopen with a mode flag." There is no `"r"`, `"w"`, or `"a"`. The closest thing to a write mode is the explicit `Truncate` call described later.

## Creating and opening a stream

`CreateStream` takes no arguments and returns a fresh, empty stream:

```lotusscript
Dim session As New NotesSession
Dim s As NotesStream
Set s = session.CreateStream
```

`Open` has exactly two parameters — and the second one is **charset**, not a mode:

```lotusscript
If Not s.Open("C:\reports\sales.txt", "UTF-8") Then
    Error 1, "Cannot open file"
End If
```

The signature is `flag = notesStream.Open(pathname$ [, charset$])`. `charset$` is optional and defaults to `"System"`. Valid values include `ASCII`, `UTF-8`, `UTF-16`, `Big5`, `Shift_JIS`, and the special `"Binary"` for byte-only streams. If the file does not exist, `Open` creates it. The full charset list is on the [NotesStream.Open method reference](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_OPEN_METHOD_STREAM.html).

`Open` returns `False` when the path is invalid, the stream is already open, the stream already has buffered content, or the charset is unrecognised.

## Reading: text vs bytes

There are two read methods, and they are not interchangeable:

| Method | Returns | Use when |
|---|---|---|
| `ReadText([oneLine&], [eol&])` | `String` | Reading text with a known charset |
| `Read([length&])` | `Variant` byte array | Reading binary content |

`ReadText` reads the whole stream (up to 2 GB) by default, but you can pass `STMREAD_LINE` to read one line at a time. `Read` is capped at **65 535 bytes per call** — for larger binary files, loop and accumulate until `IsEOS` is True.

## Writing text

```lotusscript
Set s = session.CreateStream
If Not s.Open("C:\out.txt", "UTF-8") Then Error 1, "open failed"
Call s.Truncate
Call s.WriteText("Hello, Domino", EOL_CRLF)
Call s.Close
```

Two things worth noticing:

1. **`Truncate` is how you get "write-from-scratch" semantics.** Per the [NotesStream.Truncate reference](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_TRUNCATE_METHOD_STREAM.html), it deletes the stream contents and resets `Bytes` to 0, `Position` to 0, and `IsEOS` to True. Call it after `Open` when you want to overwrite an existing file.
2. **`WriteText` quietly writes a BOM** when the charset is `Unicode` / `UTF-16` / `UTF-16BE` / `UTF-16LE` and the stream is empty at the moment of the write. The `Bytes` property reported afterwards explicitly excludes that BOM.

`WriteText(text$, [eol&])` accepts up to 2 GB per call. `eol&` controls the line terminator: `EOL_CRLF` (default), `EOL_CR`, `EOL_LF`, `EOL_LFCR`, or `EOL_NONE`.

## Writing binary

For binary I/O, `Write` takes a `Variant` byte array — capped at **65 535 bytes per call**:

```lotusscript
Dim s As NotesStream
Dim buf(0 To 3) As Byte
buf(0) = 72   ' H
buf(1) = 101  ' e
buf(2) = 108  ' l
buf(3) = 108  ' l

Set s = session.CreateStream
If Not s.Open("C:\out.bin", "Binary") Then Error 1, "open failed"
Call s.Truncate
Call s.Write(buf)
Call s.Close
```

The `"Binary"` charset tells the stream to treat the file as raw bytes with no encoding translation. `Write` returns the number of bytes written as a `Long`.

## Position and IsEOS

`Position` is a read/write `Long` — the byte offset from the start of the stream. Set it to `0` to rewind, or to any value beyond the size to jump straight to end-of-stream. Reads consume from the current `Position`; writes always update `Position` to end-of-stream regardless of where you set it.

`IsEOS` becomes `True` after `Truncate`, after any `Write` / `WriteText`, or when reading has consumed everything. It is the canonical "are we done?" check inside a read loop.

> Documented caveat: setting `Position` to a non-zero value has no special handling for multi-byte characters — you can land mid-character.

## Three gotchas the docs spell out

### 1. Closing a zero-byte stream deletes the file

Per the [NotesStream class reference](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html), *"Closing a stream with zero bytes deletes the associated file."* If you `Open` + `Truncate` + `Close` without writing anything, the file is gone.

### 2. `Read` / `Write` are capped at 65 535 bytes per call

For larger binary payloads, loop on `Read(length&)` until `IsEOS`, or chunk your `Write` calls.

### 3. `Open` is not idempotent

`Open` fails if the stream is already open or if it still has buffered content. Call `Close` first when you want to reuse a stream object for a different file.

## Closing well

The reference says streams close implicitly at end of scope, but always call `Close` explicitly. It releases the file lock, flushes pending state, and — combined with the zero-byte rule above — makes the file lifecycle predictable instead of "whenever LotusScript decides to clean up."
