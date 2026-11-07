---
title: "Attachments in Java: Stream with getInputStream, and Two Traps That Bite"
description: "In Java you want an attachment's bytes — to stream to a browser, hash it, push it to object storage. The reflex is to extractFile to a temp file and read that back; but EmbeddedObject in Java has getInputStream, which reads the attachment's content straight as a stream, no temp file at all. This covers the streaming approach and two traps the docs state plainly but people still hit: extractFile throws on anything that isn't a file attachment (embedded objects / object links), and Document.getEmbeddedObjects doesn't return file attachments at all — you get those off the RichTextItem. Plus a platform reality: UNIX/Mac Domino only supports file attachments, not embedded objects."
pubDate: 2026-11-10T07:30:00+08:00
lang: en
slug: java-embeddedobject
tags:
  - "Java"
sources:
  - title: "EmbeddedObject class (Java) (three types; getInputStream / getType; UNIX/Mac limitation) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html"
  - title: "extractFile (EmbeddedObject - Java) (writes a file attachment; throws on non-attachments) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD_JAVA.html"
  - title: "RichTextItem class (Java) (embedObject / getEmbeddedObjects, the attachment entry point) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "EmbeddedObject"
apiLang: "java"
---

In Java you want an attachment's content — to stream it to a browser download, take a SHA-256, or push it to S3. The reflex: `extractFile` it to a temp file, then read that file back.

You don't have to make that round trip. [`EmbeddedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html) in Java has `getInputStream` — it reads the attachment's content straight as an `InputStream`, with no temp file landing on disk. For "read it and hand it straight on" cases, that's a lot cleaner.

This covers the streaming approach, plus two traps the docs state plainly but people still walk into.

---

## Three kinds of EmbeddedObject — know which one you have

By the official definition, an `EmbeddedObject` represents one of three things: an **embedded object (an OLE object)**, an **object link**, or a **file attachment**. `getType` tells you which.

One platform reality many people don't know, stated right in the docs' Note: **embedded objects and object links are not supported on UNIX and Macintosh — only file attachments are.** So on your Linux / AIX Domino server, the `EmbeddedObject` you meet is almost always a **file attachment**; embedded OLE objects simply don't exist there. That actually simplifies things: server-side Java is usually just dealing with attachments.

## Reading content: getInputStream doesn't land, extractFile does

Two paths; picking the right one saves a lot:

- **`getInputStream` (or `getReader`) — no landing.** Read the attachment's content as a stream and pipe it straight into your output (an HTTP response, a hasher, an upload). No temp file, nothing to clean up.

```java
EmbeddedObject eo = rt.getEmbeddedObject("report.pdf");
try (InputStream in = eo.getInputStream()) {
    in.transferTo(response.getOutputStream());   // streamed, nothing on disk
}
```

- **[`extractFile(path)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD_JAVA.html) — lands on disk.** The docs: "Writes a file attachment to storage." It writes the attachment to the `path` you give. Note that path is **server-side** — the back-end Java (agent or server code) runs on the Domino host and writes the host's filesystem, not the user's machine. Reach for it only when you genuinely need a file on disk (to hand to an external process, say).

And here's **trap one**: `extractFile` only works on a **file attachment**; call it on an embedded object or an object link and the docs say plainly it **throws an exception**. So `getType` first and confirm it's an attachment — don't assume every `EmbeddedObject` can be extracted.

## Trap two: Document.getEmbeddedObjects doesn't return attachments

To get a document's attachments you'd reach for `doc.getEmbeddedObjects()`, right? **No.** The docs are explicit: `Document`'s `getEmbeddedObjects` **does not return file attachments** (nor objects created in Notes R3). It returns embedded objects and links — and quietly leaves out the attachments you most often want.

Attachments come off the **RichTextItem**:

```java
RichTextItem rt = (RichTextItem) doc.getFirstItem("Body");   // cast first (see the RichTextItem piece)
Vector<?> objs = rt.getEmbeddedObjects();                     // this one includes attachments
```

Or, if you know the name, `rt.getEmbeddedObject("report.pdf")` directly. `RichTextItem`'s [`getEmbeddedObjects` / `embedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html) is the front door for attachments; the cast of `Body` to RichTextItem, and the MIME caveat, are in [the Java rich text piece](/domino-news/posts/java-richtextitem/).

## What about recycle?

`EmbeddedObject`, the `RichTextItem` it belongs to, and the collections in your loop are all back-end handles — `recycle()` them when done in Java, and don't free a parent too early. The full discipline is in [the Java recycle blow-up piece](/domino-news/posts/java-collection-iteration/); not repeated here.

## What about LotusScript and SSJS?

The same `EmbeddedObject`, in each language:

- **LotusScript**: `NotesEmbeddedObject`, with `ExtractFile` to write an attachment to disk; no `getInputStream`-style streaming read, and no recycle. The full catalogue is in [the NotesEmbeddedObject piece](/domino-news/posts/notes-embedded-object/).
- **SSJS / XPages**: `NotesEmbeddedObject`, with the same `extractFile` / `getType`; the XPages request manages the lifecycle.
- **The Java-specific part** is this piece: `getInputStream` lets you read an attachment without landing it, and strong typing makes the two traps — `extractFile`'s exception and `Document.getEmbeddedObjects` skipping attachments — bite sooner and surface faster. The broader attachment strategy is in [attachments three ways](/domino-news/posts/domino-attachments-three-ways/).
