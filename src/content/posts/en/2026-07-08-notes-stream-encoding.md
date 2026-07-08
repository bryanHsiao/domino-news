---
title: "NotesStream and Text Encoding: Charsets, the BOM, and the Byte-vs-Character Trap"
description: "NotesStream reads and writes files, but the moment your text isn't plain ASCII, three things bite: which charset you opened with, whether a byte-order mark got written, and the fact that Position is a byte offset with 'no special support for multi-byte characters.' This article covers Open's charset argument, the EOL constants, exactly when WriteText emits a BOM (UTF-16 yes, UTF-8 no), and why Bytes never equals Len()."
pubDate: 2026-07-08T07:30:00+08:00
lang: en
slug: notes-stream-encoding
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesStream class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "WriteText method (NotesStream) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM.html"
  - title: "Position property (NotesStream) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_POSITION_PROPERTY_STREAM.html"
relatedJava: ["Stream"]
relatedSsjs: ["Stream"]
cover: "/covers/notes-stream-encoding.webp"
coverStyle: "pencil-sketch"
---

You write a CSV export from an agent, it opens fine on your machine, and then a colleague reports the accented names come out as mojibake — or the file has a stray character at the very start that breaks their importer. Both are `NotesStream` encoding issues, and both are avoidable once you know three facts the class quietly assumes you understand: the charset you opened with, whether a byte-order mark got written, and that `Position` counts bytes, not characters.

---

## TL;DR

- Open with an explicit charset: `stream.Open(path$, "UTF-8")`. The default is `"System"` (the machine's ANSI code page) — rarely what you want for portable text. The `Charset` property is read-only; you set it *through* `Open`.
- **WriteText emits a BOM only for the UTF-16 family, never for UTF-8.** The docs: on an empty file with charset "Unicode, UTF-16, UTF-16BE, or UTF-16LE," it "writes byte order mark or signature bytes at the beginning of the stream." UTF-8 is deliberately absent from that list.
- **`Position` is a byte offset** — "No special support exists for multi-byte characters." Setting `Position = n` can land you *inside* a UTF-8/UTF-16 character.
- **`Bytes` never equals `Len(text)`** for non-ASCII, and it *excludes* the BOM: "The size excludes any detected Unicode signatures or byte order marks."
- Line endings are constants: `WriteText(text$, eol&)` defaults to `EOL_NONE` (5); `ReadText` defaults to `EOL_CRLF` (0). The asymmetry means round-tripping lines needs explicit constants.

## Opening with the right charset

A [`NotesStream`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html) — "a stream of binary or character data" — comes from the session, and the charset is an argument to `Open`:

```lotusscript
Dim session As New NotesSession
Dim s As NotesStream
Set s = session.CreateStream
If Not s.Open("c:\export\names.csv", "UTF-8") Then
  Print "Open failed" : Exit Sub
End If
```

The accepted charset names include `ASCII`, `ISO-8859-1` through `-15`, `Shift_JIS`, `Big5`, `GB2312`, `UTF-7`, `UTF-8`, `UTF-16`, `UTF-16BE`, `UTF-16LE`, the `Windows-125x` family, and `System` (the default — the OS ANSI code page). The read-only `Charset` property reports back whatever you opened with; you can't assign it directly. The asymmetry matters: `Open`'s argument decides how bytes on disk are encoded and decoded, and reopening the same file with a *different* charset mis-decodes it silently — the API won't warn you.

## The BOM: UTF-16 yes, UTF-8 no

This is the single most useful fact in the class. Per the [`WriteText`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM.html) docs:

> "If the stream is opened on an empty file and the character set is Unicode, UTF-16, UTF-16BE, or UTF-16LE, this method writes byte order mark or signature bytes at the beginning of the stream."

UTF-8 is not in that list — so a UTF-8 stream gets **no** BOM. That's usually what you want (most Unix tooling dislikes a UTF-8 BOM), but it means if some consumer *requires* a UTF-8 BOM, you have to write those bytes yourself. Conversely, a UTF-16 file gets a BOM automatically — but only when the file starts empty. And the BOM is invisible to `Bytes`: "The size excludes any detected Unicode signatures or byte order marks," so don't use `Bytes` to compute on-disk file size when a UTF-16 BOM is present.

## Position is bytes, not characters

The trap that produces corrupted reads. The [`Position`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_POSITION_PROPERTY_STREAM.html) property is an "offset from the beginning of the stream in bytes," and the docs add the crucial warning: "No special support exists for multi-byte characters." In UTF-8, an accented Latin character is two bytes and a CJK character is three; in UTF-16 everything is at least two. So `Position = 5` lands at byte 5, which may be the *middle* of a character. Seeking to a character boundary means knowing the byte widths yourself — there's no character-based seek.

The corollary is that `Bytes` (on-disk size) and `Len(text)` (character count) diverge for anything non-ASCII, which is the cleanest way to see the encoding at work:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim s As NotesStream
  Dim txt As String
  txt = "Héllo 世界"                     ' accents + CJK

  ' Write UTF-8 (no BOM), then compare byte size to character length
  Set s = session.CreateStream
  Call s.Open("c:\export\demo.txt", "UTF-8")
  Call s.Truncate                        ' ensure empty
  Call s.WriteText(txt, EOL_CRLF)
  Print "Charset:   " & s.Charset
  Print "Bytes:     " & s.Bytes          ' > Len(txt): é=2 bytes, 世/界=3 bytes each
  Print "Len(txt):  " & Len(txt)         ' character count
  Call s.Close

  ' Read back with the SAME charset
  Set s = session.CreateStream
  Call s.Open("c:\export\demo.txt", "UTF-8")
  s.Position = 0                         ' byte 0 = start (safe)
  Print "Round-trip: " & s.ReadText()
  Call s.Close
End Sub
```

*(Constructed from the documented `Open` / `WriteText` / `ReadText` / `Bytes` signatures to isolate the encoding behaviour, rather than a single verbatim HCL listing.)*

`Bytes` will report more than `Len(txt)` here — that gap *is* the multi-byte encoding, made visible. And because we read back with the same `"UTF-8"` we wrote with, the round-trip is clean; open it as `System` or `ISO-8859-1` instead and the accented characters mangle.

## Line endings

`WriteText`'s optional second argument is the end-of-line style, and the constants are worth pinning: `EOL_CRLF` (0), `EOL_LF` (1), `EOL_CR` (2), `EOL_PLATFORM` (3), `EOL_ANY` (4, read side — treats any of CR/LF/CRLF as a line break), `EOL_NONE` (5). The catch is the defaults differ by direction: `WriteText` defaults to `EOL_NONE` (it appends nothing), while `ReadText` defaults to `EOL_CRLF`. If you write lines without specifying an EOL and then read them line-by-line expecting CRLF, they won't split — pass the constants explicitly on both sides.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesStream` | `Stream` | `Stream` |

Java's `lotus.domino.Stream` and the SSJS `Stream` (both via `session.createStream()`) carry the same charset argument on `open`, the same `EOL_*` constants, and the same byte-based `Position`. The BOM behaviour and the bytes-vs-characters distinction are properties of the encoding, not the language, so every caveat here applies identically — the method names just lowercase to `writeText` / `readText`.
