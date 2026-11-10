---
title: "Files in Java with Stream: the Default Charset Is System, Not Unicode"
description: "In Java you want to write a document's text out to a file, or read a file in. Domino's Stream (session.createStream) is the path that's integrated with Domino's own encoding, and it's what MIMEEntity and attachments use underneath. But it has a trap that quietly mojibakes non-ASCII text: a freshly created Stream reports its Charset as Unicode, yet open(path) with no charset argument defaults to System — the server's platform encoding — not Unicode. This covers getting a Stream, the open charset trap, writeText defaulting to no line ending (EOL_NONE), binary mode and bridging to java.io with getContents/setContents, and the two edges that bite: thread confinement and recycle."
pubDate: 2026-11-11T07:30:00+08:00
lang: en
slug: java-stream
tags:
  - "Java"
sources:
  - title: "Stream class (Java) (create, Charset/Position properties, open/readText/writeText/getContents methods, thread limitation) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS_JAVA.html"
  - title: "open (Stream - Java) (pathname / charset parameters; charset defaults to System; Binary and Unicode values) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM_JAVA.html"
  - title: "writeText (Stream - Java) (EOL_CRLF / EOL_LF / EOL_CR / EOL_NONE constants; default EOL_NONE) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "Stream"
apiLang: "java"
---

In Java you want to write a document's `Body` out to a `.txt`, or read a file in and drop it into a field. The reflex is `java.io.FileWriter`. But if this code runs inside Domino there's another path: [`Stream`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS_JAVA.html) — you get one from `session.createStream()`, and the docs define it as "Represents a stream of binary or character data." It's integrated with Domino's encoding, and it's the stream `MIMEEntity` and attachments use underneath.

The trouble is a very quiet trap. A freshly created Stream reports its `Charset` as Unicode, and you'd reasonably assume non-ASCII text is safe. But the thing that actually decides the encoding is the moment you `open` — and `open(path)` with no charset argument **defaults to "System," not Unicode.** System is the server's platform encoding; your UTF-8 text gets written in the server's locale encoding, and you open the file to find garbage, with no error raised.

This covers getting and using a Stream, the `open` charset trap, `writeText` defaulting to no line ending, binary mode and bridging to `java.io`, and the two edges that bite: thread confinement and recycle.

---

## Getting a Stream, and the open charset trap

A Stream comes from `session`, not from a database:

```java
Stream stream = session.createStream();
stream.open("/local/export/body.txt", "UTF-8");   // always pass the second arg
```

A just-created Stream has `Charset` Unicode, `Bytes` 0, `Position` 0. But [`open`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM_JAVA.html) has two forms: `open(String pathname)` and `open(String pathname, String charset)`. The docs are blunt about the charset: "The character set used by the file... **Defaults to "System."**"

So the point isn't "what's the default on a new Stream" — it's "did you specify a charset at open time":

- `open(path)` → uses **System** (the server's platform encoding). On a Domino server whose locale isn't UTF-8, that's where mojibake comes from.
- `open(path, "UTF-8")` → explicitly UTF-8, consistent across platforms.

Valid charset values include `UTF-8`, `UTF-16` (equivalent to `Unicode`), `UTF-16BE` / `UTF-16LE`, `ISO-8859-1` through `ISO-8859-9`, `Shift-JIS`, and `Binary` (byte operations only — more below). **Make passing the second argument a habit** so System doesn't hand you different results on different hosts.

One more thing: `open` creates the file if it doesn't exist, but it returns `false` (rather than throwing) if the stream is already open, already has content, or the charset is invalid — so check the return value.

## writeText adds no line ending by default; readText reads text

Write text with [`writeText`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM_JAVA.html), which returns the number of characters written. Here's another default-value trap:

```java
stream.writeText(doc.getItemValueString("Body"));                 // no line ending
stream.writeText(doc.getItemValueString("Body"), Stream.EOL_CRLF); // appends CRLF
```

The one-argument form uses `EOL_NONE` — the docs say "Stream.EOL_NONE (5) appends nothing. Default." So if you write line after line without the second argument, they all run together on one line. To break lines, pass an EOL constant: `EOL_CRLF` (0, CR+LF), `EOL_LF` (1, LF), `EOL_CR` (2, CR), `EOL_PLATFORM` (3, follows the current platform).

Read it back with `readText`; the text is decoded using the stream's charset, so getting the charset right at `open` matters just as much on the way in.

## Binary vs text: Binary mode and bridging java.io

Stream isn't only for text. After `open(path, "Binary")`, the stream works at the byte level — `read` / `write` move bytes — which is what you want to hash a file, copy one through verbatim, or avoid any encoding conversion.

The Java flavour also adds two conveniences LotusScript doesn't have, bridging straight to `java.io.*`:

- `getContents(OutputStream)` / `getContents(Writer)` — pour the stream's contents into a `java.io.OutputStream` or `Writer` (e.g. straight to an HTTP response).
- `setContents(InputStream)` / `setContents(Reader)` — fill the stream from a `java.io.InputStream` / `Reader`.

That lets Domino's Stream interoperate cleanly with standard Java I/O — one corner where pure-Java is more comfortable than LotusScript.

## Two edges that bite: thread confinement and recycle

The class page states a sentence that's easy to skim past: "**Use of a Stream object is limited to the thread in which is created.**" You can't create a stream on one thread and use it on another — in a multi-threaded Java agent or an XPages background job, that becomes a hard-to-trace bug. Create the stream on the thread that uses it.

Stream is also a back-end handle: `recycle()` it when done, and release it per file rather than letting it pile up across a loop. The full recycle discipline is in [the Java recycle blow-up piece](/domino-news/posts/java-recycle-memory/).

## A complete example

Write the selected document's `Body` to a file in UTF-8, one line per field with CRLF:

```java
Stream stream = null;
try {
    stream = session.createStream();
    if (!stream.open("/local/export/" + doc.getNoteID() + ".txt", "UTF-8")) {
        throw new RuntimeException("stream open failed (path or charset?)");
    }
    stream.truncate();   // clear any existing content, write from the top
    stream.writeText(doc.getItemValueString("Subject"), Stream.EOL_CRLF);
    stream.writeText(doc.getItemValueString("Body"),    Stream.EOL_CRLF);
    stream.close();
} catch (NotesException e) {
    e.printStackTrace();
} finally {
    try { if (stream != null) stream.recycle(); } catch (NotesException e) {}
}
```

The load-bearing piece is that `"UTF-8"`: drop it and the same code writes a differently-encoded file on servers with different locales.

## What about LotusScript and SSJS?

The same `Stream`:

- **LotusScript**: `NotesStream`, with `Open` / `WriteText` / `ReadText`; the charset and encoding details are in [the NotesStream encoding piece](/domino-news/posts/notes-stream-encoding/). LS has the same charset-default issue, but no `getContents` / `setContents` bridge to `java.io`.
- **SSJS / XPages**: `NotesStream`, same `session.createStream()`; in XPages it's often used to build a file to stream for download, with the request managing the lifecycle.
- **The Java-specific part** is this piece's two points: `getContents` / `setContents` let Domino's Stream interoperate with standard Java I/O, and strong typing won't save you from the charset default — leave one argument off `open` and non-ASCII text quietly goes out in System encoding.
