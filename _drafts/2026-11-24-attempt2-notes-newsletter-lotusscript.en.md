---
title: "Implementing Newsletters with LotusScript's NotesNewsletter Class"
description: "A comprehensive guide on utilizing the NotesNewsletter class in LotusScript to create and send newsletters, including setup, adding documents, and sending procedures."
pubDate: "2026-11-24T14:49:51+08:00"
lang: "en"
slug: "notes-newsletter-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNewsletter (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html"
  - title: "NotesDocumentCollection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "NotesRichTextItem (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-newsletter-lotusscript
-->

## Introduction

In HCL Domino application development, LotusScript offers robust tools for various tasks. The `NotesNewsletter` class enables developers to create newsletters containing multiple documents, which is particularly useful when you need to send summaries or links of multiple documents to users.

## Setting Up NotesNewsletter

First, initialize the `NotesNewsletter` object, typically through the `NotesSession` object.

```lotusscript
Dim session As New NotesSession
Dim newsletter As NotesNewsletter
Set newsletter = session.CreateNewsletter("Newsletter Title")
```

In this code, the `CreateNewsletter` method creates a new newsletter with the specified title.

## Adding Documents to the Newsletter

You can add a `NotesDocument` or `NotesDocumentCollection` to the newsletter using the `AddDocument` method.

```lotusscript
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("Document UNID")
Call newsletter.AddDocument(doc)
```

For multiple documents, use `NotesDocumentCollection`:

```lotusscript
Dim collection As NotesDocumentCollection
Set collection = db.AllDocuments
Call newsletter.AddDocuments(collection)
```

## Sending the Newsletter

After assembling the newsletter content, send it to specified recipients using the `Send` method.

```lotusscript
Call newsletter.Send("recipient@example.com")
```

To specify multiple recipients, separate them with commas:

```lotusscript
Call newsletter.Send("user1@example.com,user2@example.com")
```

## Conclusion

The `NotesNewsletter` class provides a convenient way to create and send newsletters containing multiple documents in LotusScript. By following the steps outlined above, you can efficiently distribute summaries or links of multiple documents to users, enhancing information dissemination.

For more detailed information, refer to the [NotesNewsletter class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html) and [NotesDocumentCollection class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html).
