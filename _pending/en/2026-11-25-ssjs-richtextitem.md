---
title: "Rich Text in XPages: appendText Won't Make Paragraphs — and the Save Boundary"
description: "XPages back-end code needs to build a formatted document body or a mail memo: a few lines of text, plus an attachment. You createRichTextItem, appendText line by line with \\n between them — and it all comes out as one run-on paragraph, because appendText ignores your newlines; to break paragraphs you call addNewLine yourself. Attachments go in via embedObject, whose second 'class' argument is an empty string (that trips people). And there's one more cut: rich text you changed isn't written until doc.save(), and in XPages that collides with the data-source save model. This covers creating/getting a rich text item, paragraphs, attachments, the save boundary, and reading it back as plain text."
pubDate: 2026-11-25T07:30:00+08:00
lang: en
slug: ssjs-richtextitem
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesRichTextItem (JavaScript) (appendText, addNewLine, embedObject, getUnformattedText) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem.html"
  - title: "appendText (NotesRichTextItem - JavaScript) (a newline is not a paragraph) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_appendText.html"
  - title: "embedObject (NotesRichTextItem - JavaScript) (EMBED_ATTACHMENT for file attachments) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_embedObject.html"
relatedJava: []
relatedSsjs: []
coversClass: "RichTextItem"
apiLang: "ssjs"
---

XPages back-end code needs to build a formatted document body: a heading, a few lines, and a freshly-generated report file attached. Or a mail memo. You open a rich text item with `createRichTextItem`, `appendText` your lines with `\n` between them — and it all comes out as **one run-on paragraph**, as if the newlines never happened.

Because `appendText` ignores the newlines in your string. And even once you've laid it out, forget `doc.save()` and **none of the rich text lands** — and in XPages that collides with the data-source save model.

This covers creating / getting a rich text item, breaking paragraphs properly, attaching files (the `embedObject` empty-string argument catches people), the save boundary, and reading rich text back as plain text.

---

## Creating / getting a rich text item

[`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem.html) is, in one line, "Represents an item of type rich text." — and it inherits from `NotesItem`. In SSJS:

```javascript
// create a new one
var rt:NotesRichTextItem = doc.createRichTextItem("Body");
// get an existing one → getFirstItem("Body")
```

The docs are blunt: "To create a new NotesRichTextItem object, use createRichTextItem in NotesDocument." and, to read one, "use getFirstItem in NotesDocument." Here `doc` is the back-end `NotesDocument` — in XPages often the one you pulled off the data source via `document1.getDocument(true)` (see [the XPages back-end NotesDocument piece](/domino-news/posts/ssjs-backend-document/)).

## The trap: appendText doesn't break paragraphs — addNewLine does

The one everyone hits. [`appendText`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_appendText.html) "Appends text to a rich text item." — but immediately after: "New lines (carriage returns) inserted in appended text do not cause new paragraphs. To create a new paragraph, use addNewLine."

Plainly: the `\n` / `\r` you put in the string **do not become paragraphs**. To break one, call `addNewLine()`:

```javascript
var rt:NotesRichTextItem = doc.createRichTextItem("Body");
rt.appendText("Order #12345 confirmed.");
rt.addNewLine();                 // no arg = one new line, and a paragraph by default
rt.appendText("Details attached.");
rt.addNewLine(2);                // two lines
rt.appendText("— sent automatically");
```

`addNewLine`'s second parameter `newparagraph` defaults to `true` — docs: "If true (default), forces the new line to be a paragraph separator." So a bare `addNewLine()` already starts a paragraph; pass `false` for a line break that isn't one. Also note `appendText`'s limit: "Paragraphs are restricted to approximately 35K of text and are automatically divided if this limit is exceeded."

## Attachments: embedObject

To attach a file into a rich text item, [`embedObject`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_embedObject.html), four arguments:

```javascript
rt.embedObject(NotesEmbeddedObject.EMBED_ATTACHMENT, "", "C:\\temp\\report.pdf", null);
//             type (attachment = 1454)               class  file path to attach   ref name (nullable)
```

- `type`: for a file, `EMBED_ATTACHMENT` (value 1454); there's also `EMBED_OBJECT` (1453, OLE/1 only).
- **The second `class` argument trips most people** — the docs say plainly "Specify an empty string ("")." Not a MIME type, not a class name. Empty string.
- Third is the file path to attach; fourth is a name to reference it by later, and can be `null`.
- One platform note: OLE embedding isn't supported on UNIX / Mac, but **file attachments are supported everywhere**.

## The save boundary: unsaved rich text is lost

This cut lands often in XPages. The docs, verbatim: "When you change the value of a NotesRichTextItem object, the change is not written to disk until you call save for the parent NotesDocument object." Everything you do to the rich text item **only lands when the parent `NotesDocument` is saved**.

```javascript
var rt:NotesRichTextItem = doc.createRichTextItem("Body");
rt.appendText("…"); rt.addNewLine(); rt.embedObject(…);
doc.save();     // without this line, all of the above is thrown away
```

In XPages there's a second layer: if you edit rich text on the **data source's back-end doc** and then let the data source save too, the two saves overwrite each other and can throw a save conflict — the same trap as [the XPages back-end NotesDocument piece](/domino-news/posts/ssjs-backend-document/). The rule: be clear which doc you're writing to and who owns the save; don't save on both sides.

(If the document is open in edit mode, rich text changes won't show immediately — docs: "You must close and reopen the document to see changes." That's expected, not a lost write.)

## Reading it back as text

Two ways to get a rich text item as a string:

- `getUnformattedText()` — as-is: "Tabs and carriage returns are left intact.", no wrapping.
- `getFormattedText(tabstrip, linelen, maxlen)` — controllable: `tabstrip` turns tabs into spaces, `linelen` (0 = 80 chars), `maxlen` (0 = default). Note it "strips out non-text data, such as bit maps and file attachments." — **attachments and bitmaps are dropped**, you get the text only.

## What about LotusScript and Java?

The same `RichTextItem`:

- **LotusScript**: `NotesRichTextItem`, with `AppendText` / `AddNewLine` / `EmbedObject` — same behaviour, same "AppendText doesn't break paragraphs", same need for `NotesDocument.Save`.
- **Java**: `RichTextItem`, same API, plus recycle; the full treatment is in [the Java RichTextItem piece](/domino-news/posts/java-richtextitem/).
- **What's SSJS-specific** isn't the API (the methods are shared) — it's the setting: building a body in an XPages button/event, attaching a file, then deciding who saves. The API is the back-end one; "how the save boundary meets the data source" is the part only XPages makes you think about.
