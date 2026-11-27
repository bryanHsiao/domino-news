---
title: "Sending HTML Mail from XPages: setConvertMime(false) First, or Domino Turns Your MIME into Rich Text"
description: "XPages back-end code needs to send an HTML mail — formatted, with links and house styling — not plain rich text. You build it with MIMEEntity. But the first call isn't creating the document; it's session.setConvertMime(false), because Domino converts MIME to composite rich text on document instantiation by default, and if you don't turn that off first, the HTML you carefully built gets eaten. This covers the convert switch (including the docs' own casing inconsistency), the full sequence to build an HTML mail, why the MIME entity must be named Body to be mailable, keeping non-ASCII text from corrupting (charset=UTF-8), and that the entity handle goes invalid after send/save."
pubDate: 2026-11-27T07:30:00+08:00
lang: en
slug: ssjs-mimeentity
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesMIMEEntity (JavaScript) (createMIMEEntity, setContentFromText, createChildEntity, when the handle goes invalid) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity.html"
  - title: "createMIMEEntity (NotesDocument - JavaScript) (must be Body to be mailable) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document_createMIMEEntity.html"
  - title: "setContentFromText (NotesMIMEEntity - JavaScript) (contentType generates the Content-Type header, encoding constants) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity_setContentFromText.html"
relatedJava: []
relatedSsjs: []
coversClass: "MIMEEntity"
apiLang: "ssjs"
cover: "/covers/ssjs-mimeentity.webp"
coverStyle: "risograph"
---

XPages back-end code needs to send an **HTML** mail: formatted, with links and house styling, not flat plain text. That mail body is MIME, and you build it with [`MIMEEntity`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity.html).

But the first call **isn't** creating the document — it's `session.setConvertMime(false)`. Because Domino converts MIME to composite rich text when a document is instantiated, by default. Don't turn that off first and the HTML body you carefully assembled gets eaten, flattened into rich text.

This covers the convert switch (including the docs' own casing inconsistency), the full sequence for an HTML mail, why the MIME entity must be named `Body`, keeping non-ASCII text from corrupting, and that the entity handle goes invalid after send/save.

---

## The trap: setConvertMime(false) first, restore after

This is governed by the session's `IsConvertMIME`. The docs: the setting "is initially true", i.e. MIME is converted to rich text by default. So before touching MIME, turn it off, and turn it back on when you're done:

```javascript
session.setConvertMime(false);   // stop MIME→rich text conversion
// …build the MIME…
session.setConvertMime(true);    // docs: "you should restore it before exiting."
```

Timing matters: "Changes to this property apply only to those items opened by the backend processor after the property has been changed." It affects only items opened *after* you set it, so you **must set it before creating / getting the MIME entity**.

> One inconsistency the source check turned up: the method reference page spells it `setConvertMIME` (capital MIME), but the **official example code uses `setConvertMime`**. SSJS is case-sensitive, so the two aren't interchangeable — use whichever actually runs in your environment, don't copy the page heading blindly.

## The full sequence for an HTML mail

The official example's skeleton, switched to HTML:

```javascript
session.setConvertMime(false);
var stream:NotesStream = session.createStream();
stream.writeText("<h2>Order confirmed</h2><p>Your order #12345 is confirmed.</p>");

var doc:NotesDocument = database.createDocument();
doc.appendItemValue("Form", "Memo");
doc.appendItemValue("Subject", "Order confirmation");
doc.appendItemValue("SendTo", requestScope.to);

var body:NotesMIMEEntity = doc.createMIMEEntity();          // default item name = Body
body.setContentFromText(stream, "text/html;charset=UTF-8", NotesMIMEEntity.ENC_NONE);

doc.send();
stream.close();
session.setConvertMime(true);
```

The key move: **you don't open a Content-Type header yourself**. The docs: "The methods setContentFromBytes and setContentFromText generate Content-Type and Content-Transfer-Encoding headers." Pass `"text/html;charset=UTF-8"` as [`setContentFromText`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity_setContentFromText.html)'s second argument and it emits the `Content-Type: text/html` header for you. You only reach for `createHeader(name)` + `setHeaderVal(...)` for the likes of Subject / To.

Encoding (third argument) constants: `ENC_NONE` (1725, no Content-Transfer-Encoding header), `ENC_QUOTED_PRINTABLE` (1726), `ENC_BASE64` (1727), `ENC_IDENTITY_7BIT` (1728), `ENC_IDENTITY_8BIT` (1729), `ENC_IDENTITY_BINARY` (1730), `ENC_EXTENSION` (1731).

## createMIMEEntity must be "Body" to be mailable

Easy to miss. [`createMIMEEntity([itemName])`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document_createMIMEEntity.html) defaults the item name to `Body`. And the docs state: "A MIME entity named Body (case insensitive) gets special support as a Domino mail message." plus "If you specify an item name other than Body, the containing document cannot be mailed."

Plainly: **to mail it, the MIME entity has to be `Body`** (case-insensitive). Give it a tidier name like `HtmlBody` and the document simply won't mail — and "send() ran but no mail went out" is one of the harder ones to chase.

## Non-ASCII text corrupts without charset=UTF-8

A mandatory one for any non-English text. Docs' Usage: "If the NotesStream input is the result of NotesStream.WriteText, translation of the internal Unicode defaults to US-ASCII." Whatever `writeText` put in **lands as US-ASCII by default**, so accented or CJK characters become question marks. To store it right, the contentType must carry the charset: `"text/html;charset=UTF-8"`. Drop the charset and the text in the mail is a row of `?`.

## The entity handle goes invalid after send/save

The docs list the operations that kill a `NotesMIMEEntity`: "A valid NotesMIMEEntity object becomes invalid if any of the following methods are applied to the containing NotesDocument object: computeWithForm, encrypt, save, send, sign, or closeMIMEEntities."

So after `doc.send()` / `doc.save()`, the `body` variable is **dead** — don't go back to it to set a header or read content. The order is always: build it → set its content → then send / save, last. The docs also warn "Avoid processing items as both NotesItem and NotesMIMEEntity objects concurrently." — don't juggle the same item as both.

## Multipart: createChildEntity

For "HTML plus an attachment" style multipart mail, build child entities with `createChildEntity()`. Docs: "If the parent's content type is multipart, the existing content type/subtype is retained; otherwise, multipart/mixed is imposed." and "The parent entity should contain no content." — keep the parent empty, put content in the children. The multipart detail is beyond this piece; just know `createChildEntity` is the door.

## What about LotusScript and Java?

The same `MIMEEntity`:

- **LotusScript**: `NotesMIMEEntity`, with `CreateMIMEEntity` / `SetContentFromText`, `session.ConvertMIME = False`, and `CloseMIMEEntities` — same "turn conversion off first."
- **Java**: `MIMEEntity`, the same `setConvertMIME(false)` + `closeMIMEEntities`, plus recycle; the full treatment is in [the Java MIMEEntity piece](/domino-news/posts/java-mimeentity/).
- **What's SSJS-specific** isn't the API (the methods are shared) — it's the setting: assembling page content (even an `inputRichText`'s `getHTML()`) into an HTML mail inside an XPages event. The API is the back-end MIME one; the three cuts — `setConvertMime` timing, charset, the invalidated handle — are the ones XPages mail code hits most.
