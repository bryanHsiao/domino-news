---
title: "Reading Rich Text in Java: Cast First, Then Mind the MIME and the Dropped Attachments"
description: "To touch a rich text field like Body in Java, getFirstItem hands you an Item, and you have to cast it to RichTextItem before you can do anything — and that cast hides two surprises: a modern Body is often MIME, not classic rich text (so you go through getMIMEEntity); and when you read the content to plain text with getFormattedText, it quietly drops the attachments and images. This covers getting at it in Java (the cast and the MIME case), reading rich text to plain text (getFormattedText's three parameters and what it throws away), and building one with createRichTextItem."
pubDate: 2026-11-08T07:30:00+08:00
lang: en
slug: java-richtextitem
tags:
  - "Java"
sources:
  - title: "RichTextItem class (Java) (extends Item; getMIMEEntity / getFormattedText) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html"
  - title: "createRichTextItem (Document - Java) (creates a rich-text item) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATERICHTEXTITEM_METHOD_JAVA.html"
  - title: "getFormattedText (RichTextItem - Java) (to plain text; tabstrip / linelen / maxlen; removes non-text content) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFORMATTEDTEXT_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "RichTextItem"
apiLang: "java"
cover: "/covers/java-richtextitem.webp"
coverStyle: "paper-craft"
---

You want to read a document's `Body` as plain text — to index it, preview it, drop it into an email. In LotusScript you more or less just read it. In Java, `doc.getFirstItem("Body")` hands you an `Item`, and you have to cast it to `RichTextItem` before you can call `getFormattedText()`.

That cast is where the surprises live.

First, that `Body` **may well not be classic rich text at all — it may be MIME** (modern mail and HTML content is usually stored as MIME). Second, even when it is rich text, `getFormattedText` reading it to plain text will **quietly drop the attachments and images — the non-text content** — and the docs say so in as many words. This piece covers getting at it in Java (the cast and the MIME case), reading it to text (and what it throws away), and building one.

---

## Getting it: cast — but think about whether it's MIME first

[`RichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html) is defined as "Represents an item of type rich text," and `public class RichTextItem extends Item` — it's a subtype of `Item`. So to read an existing one, the documented path is: **`getFirstItem` gives you an `Item`, then cast it to `RichTextItem`.**

```java
Item item = doc.getFirstItem("Body");
if (item instanceof RichTextItem) {
    RichTextItem rt = (RichTextItem) item;
    // ... use rt
}
```

Note the `instanceof` guard — don't cast blind. A `Body` field is often stored as **MIME** these days, and then it isn't a classic rich text item: you go through `getMIMEEntity` (it's a method on RichTextItem) rather than the rich-text append/read methods. LotusScript's `Set rtitem = doc.GetFirstItem(...)` is looser about type; Java's hard cast forces the question into the open — which is a good thing, because it makes you confirm what you're actually holding.

## Reading to plain text: getFormattedText, and what it drops

To read rich text into a `String`, use [`getFormattedText`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFORMATTEDTEXT_METHOD_JAVA.html). The docs: "Returns the contents of a rich text item as plain text." All three parameters matter:

```java
String text = rt.getFormattedText(true, 0, 0);
//                               tabstrip linelen maxlen
```

- **`boolean tabstrip`**: `true` replaces tabs with spaces.
- **`int linelen`**: wrap width in characters (inserts CR/LF); **`0` means 80**.
- **`int maxlen`**: maximum characters returned; `0` means the default.

One behaviour you have to know, stated plainly in the docs: **it removes non-text content such as bitmaps and file attachments.** So if you `getFormattedText` and then wonder where the attachment went — it didn't go anywhere; this method only ever gives you the text. For the attachments, use `getEmbeddedObjects` (or see [attachments three ways](/domino-news/posts/domino-attachments-three-ways/)); for plain text without the wrapping-and-tabs treatment, there's the simpler `getUnformattedText`.

## Building one: createRichTextItem + append

Going the other way, to build a rich text field in Java, use [`createRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATERICHTEXTITEM_METHOD_JAVA.html) (on `Document`), then append in order:

```java
RichTextItem rt = doc.createRichTextItem("Body");
rt.appendText("Order shipped. Tracking: ");
rt.appendText(trackingNo);
rt.addNewLine(1);
rt.appendDocLink(orderDoc, "Open the order");   // a doclink
doc.save(true, true);                            // save after appending
```

The `append*` calls stack **in the order you call them**: `appendText` then `appendDocLink` comes out in that order. To embed a file use `embedObject`; for tables, paragraph styles, and fonts there are many more methods — but that's the 22-method catalogue the LotusScript [NotesRichTextItem piece](/domino-news/posts/notes-rich-text-item/) already grouped and listed, and Java is the same names and concepts, so I won't repeat it; the doclink details are in [the doclink piece](/domino-news/posts/notes-rich-text-doclink/). The one thing not to forget: **`doc.save()` after appending**, or nothing is written.

## What about recycle?

`RichTextItem`, `EmbeddedObject`, and friends are all back-end handles — `recycle()` them when done in Java, and mind the recycle chain in loops so you don't free a parent too early. The full discipline is in [the Java recycle blow-up piece](/domino-news/posts/java-collection-iteration/); not repeated here.

## What about LotusScript and SSJS?

The same rich text item, in each language:

- **LotusScript**: `NotesRichTextItem`, inheriting `NotesItem`; the full 22-method catalogue is in [the NotesRichTextItem piece](/domino-news/posts/notes-rich-text-item/). No cast step, no recycle.
- **SSJS / XPages**: `NotesRichTextItem`, with the same `getFormattedText`, `embedObject`, and `getMIMEEntity`; the XPages request manages the lifecycle.
- **The Java-specific part** is this piece: `getFirstItem` returns an `Item` you cast yourself, which forces you to face "is this rich text or MIME?" — and the recycle chain is Java's extra chore.
