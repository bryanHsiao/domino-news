---
title: "Reading MIME in Java: Without setConvertMIME(false), You're Not Reading MIME"
description: "Modern Domino mail stores the Body as MIME (multipart, with headers), not the classic composite rich text. Read it in Java with getFirstItem(\"Body\") and Domino, by default, converts the MIME to rich text before handing it over — so what you get is the converted thing, with the original MIME structure, headers, and per-part encodings flattened away. To get the real MIME, you first call session.setConvertMIME(false) to turn that conversion off, then getMIMEEntity. This covers the correct order for reading MIME, walking a multipart tree part by part, reading headers, and a biting invalidation rule: a MIMEEntity goes invalid once you apply save / computeWithForm / sign to the Document."
pubDate: 2026-11-13T07:30:00+08:00
lang: en
slug: java-mimeentity
tags:
  - "Java"
sources:
  - title: "MIMEEntity class (Java) (content/headers/navigation methods, the invalidation rule, Release 5.0.2) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEENTITY_CLASS_JAVA.html"
  - title: "Working with a MIME entity in Java classes (setConvertMIME(false) → getMIMEEntity → closeMIMEEntities flow) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS_JAVA.html"
  - title: "MIMEHeader class (Java) (name/value/parameters; RFC-822 / RFC-2045) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEHEADER_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "MIMEEntity"
apiLang: "java"
cover: "/covers/java-mimeentity.webp"
coverStyle: "risograph"
---

In Java you want to read a message's `Body`. The reflex: `doc.getFirstItem("Body")`, then read it as rich text. But modern Domino mail stores the Body as **MIME** — multipart, a pile of headers, each part with its own content type and encoding — not the classic composite rich text.

The problem is that reading it that way means Domino, **by default, converts the MIME to rich text before handing it over.** After the conversion, the original MIME structure, headers, and per-part encodings are flattened; what you get is something that looks like a body, but it isn't the original MIME. To get the real MIME, you first turn that conversion off.

That turning-off is the step people most often miss with [`MIMEEntity`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEENTITY_CLASS_JAVA.html). This covers the correct order for reading MIME, walking a multipart tree, reading headers, and a biting invalidation rule.

---

## The correct order for reading MIME

The official [Working with a MIME entity](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS_JAVA.html) page states the order plainly, and step one is turning conversion off:

1. "**First call Session.setConvertMIME(false)** to override normal conversion of MIME items to rich text." — turn off MIME→rich-text conversion.
2. "Then call Document.getMIMEEntity." — get the top-level entity (or `getFirstItem` then `Item.getMIMEEntity`).
3. When you're done reading and want to go back to Item access: "call Document.closeMIMEEntities."
4. "Before exiting your code, call **Session.setConvertMIME(true)** (or restore the original setting)."

Skip step 1 and everything after is wrong — Domino has already converted the MIME to rich text before your `getMIMEEntity`. Note the Java spelling is `setConvertMIME` (uppercase MIME). The flag is session-level and affects the whole session, so always restore it when done — don't let it leak into other code.

## Reading content and walking a multipart tree

With the entity in hand, content comes two ways: `getContentAsText` returns text, `getContentAsBytes` returns the raw bytes (use that for attachments and binary parts). The type information is read-only: `ContentType`, `ContentSubtype`, `Charset`, `Encoding`.

A multipart message (e.g. `multipart/alternative` carrying both a plain-text and an HTML version) is a tree: step into the first part with `getFirstChildEntity`, move along with `getNextSibling`:

```java
MIMEEntity child = entity.getFirstChildEntity();
while (child != null) {
    String type = child.getContentType() + "/" + child.getContentSubtype();
    // e.g. pick the text/html part to process
    MIMEEntity next = child.getNextSibling();
    child = next;
}
```

## Reading headers

Each part's headers are represented by [`MIMEHeader`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEHEADER_CLASS_JAVA.html) — the docs define it as "A MIME header consists of a name, value, and parameters as defined in RFC-822 and RFC-2045." For one header use `getNthHeader("Content-Type")`, for all of them `getHeaderObjects`, and for the whole header block as a string `getHeaders`. This is where you read `From` / `Subject` / `Content-Disposition`.

## The biting invalidation rule

This is the easiest trap to hit. The class page states that a valid MIMEEntity "becomes invalid if any of the following methods are applied to the containing Document object" — those methods being `computeWithForm`, `encrypt`, `save`, `send`, `sign`, `closeMIMEEntities`.

In plain terms: **once you `save` that Document (or `computeWithForm`, `sign`…), the MIMEEntity handle you're holding is invalid**, and reading from it fails. So order it right: finish reading or writing the MIME first, and `save` last — don't drop a `doc.save()` into the middle of a MIME-reading loop.

A related caution: **don't use Item access and MIMEEntity access on the same document at the same time.** To switch from MIME mode back to ordinary Item operations, `closeMIMEEntities` first.

When done, the MIMEEntity and the document are back-end handles — `recycle()` them in Java; the full discipline is in [the Java recycle blow-up piece](/domino-news/posts/java-recycle-memory/).

## A complete example

Pull the `text/plain` part out of a message:

```java
String plain = null;
session.setConvertMIME(false);               // 1. turn off conversion first
try {
    MIMEEntity root = doc.getMIMEEntity();   // 2. get the entity
    if (root != null) {
        if ("multipart".equalsIgnoreCase(root.getContentType())) {
            MIMEEntity child = root.getFirstChildEntity();
            while (child != null) {
                if ("text".equalsIgnoreCase(child.getContentType())
                        && "plain".equalsIgnoreCase(child.getContentSubtype())) {
                    plain = child.getContentAsText();
                    break;
                }
                child = child.getNextSibling();
            }
        } else {
            plain = root.getContentAsText();
        }
    }
    doc.closeMIMEEntities();                  // 3. close MIME processing
} catch (NotesException e) {
    e.printStackTrace();
} finally {
    session.setConvertMIME(true);             // 4. restore the setting
}
```

## What about LotusScript and SSJS?

The same `MIMEEntity`:

- **LotusScript**: `NotesMIMEEntity`, with the same `NotesSession.ConvertMIME = False` (or the method) then `GetMIMEEntity` — identical flow; the full usage is in [the NotesMIMEEntity piece](/domino-news/posts/notes-mime-entity/).
- **SSJS / XPages**: `NotesMIMEEntity`, same `session.setConvertMIME(false)` first; comes up when reading inbound mail or assembling a MIME reply in XPages.
- **The Java-specific part** isn't the API (the methods are shared) — it's the two things Java developers most often miss: the `setConvertMIME` spelling and its session-level side effect (restore it when done), and that strong typing won't catch "the handle is invalid after save" — the code compiles whether or not that MIMEEntity is still valid.
