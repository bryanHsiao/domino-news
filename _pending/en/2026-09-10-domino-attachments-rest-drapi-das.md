---
title: "Domino Attachments over REST: DRAPI and DAS Both Have Attachment Endpoints — the Difference Is Modern vs Legacy"
description: "The earlier pieces were about users uploading from a UI; sometimes you move attachments programmatically over REST. Domino has two REST APIs: DRAPI (modern, KEEP) and DAS (legacy, Extension Library). A common misconception is 'DAS is read-only' — not so: DAS has its own dedicated attachment endpoints to create, read, update, and delete. The real difference is modern vs legacy, plus a DAS-specific trap: don't push a whole document with embedded attachment data through create/update (it returns 400) — use the dedicated attachment endpoint. This piece lines up both APIs' endpoints and differences."
pubDate: 2026-09-10T07:30:00+08:00
lang: en
slug: domino-attachments-rest-drapi-das
tags:
  - "Domino REST API"
  - "DevOps"
relatedJava: []
relatedSsjs: []
---

The earlier pieces were all about a **user** attaching a file from a UI — the client's rich text field, the web File Upload Control, XPages' `xp:fileUpload`. But there's a whole other class of need where a **program** moves attachments over REST: an external system fetching files, a SPA front end uploading a file to a document, an integration deleting old attachments.

Domino has two REST APIs that can do this — **DRAPI** (the Domino REST API, formerly Project KEEP) and **DAS** (Domino Access Services). DAS has a "sending attachments through the document body returns 400" limitation that's easy to read as "it's read-only, it can't upload" — but look at the actual DAS spec and it has its own set of dedicated attachment endpoints to create, read, update, and delete. The real difference between the two isn't "can it or can't it," it's **modern vs legacy** — plus one DAS-specific document-round-trip trap that's easy to hit.

---

## TL;DR

- **Both APIs have attachment endpoints with full CRUD.** DAS can upload attachments too — the "read-only" impression comes from misreading the 400 limitation below.
- **DRAPI (modern / KEEP)**: `POST /attachments/{unid}` to upload, `GET /attachments/{unid}/{attachmentName}` to download, `DELETE` to remove; attachments are addressed by name, with a `dataSource` scope.
- **DAS (legacy / Extension Library)**: `POST …/documents/unid/{docUnid}/{itemName}` (`multipart/form-data`) to add, `GET`/`PUT`/`DELETE …/{itemName}/{fileName}` to read/update/delete; attachments hang off a named rich text **item**.
- **The DAS trap (the truth behind the 400)**: pushing a whole document — one you GET'd, with base64 attachment data embedded — back through create/update returns **HTTP 400**, which is why the docs say to "remove any attachment data" when round-tripping, and to use the dedicated attachment endpoints instead. It's not "DAS can't upload," it's "don't smuggle attachments through the document body."
- **Which to use**: new work → **DRAPI** (actively developed, with Swagger / WOPI / Office Round Trip); DAS still works but is the legacy generation.

---

## DRAPI: attachment endpoints, addressed by name

[DRAPI](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/richtext/index.html) gives attachments a dedicated set of endpoints (all needing a `dataSource` query parameter to name the scope):

- **Download**: `GET /attachments/{unid}/{attachmentName}` — spec summary "Retrieve a document's attachment"; returns the raw binary.
- **Delete**: `DELETE /attachments/{unid}/{attachmentName}` — summary "Removes an attachment"; takes an optional `fieldName` to say which rich text field to remove it from.
- **Upload**: `POST /attachments/{unid}` — the official [Round Trip how-to](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/roundtrip.html) says verbatim: "You can use the `POST /attachments/{unid}` endpoint in the Swagger UI to add the file as attachment." (Confirm the exact multipart shape against that endpoint's definition in the Swagger UI.)

To **list** attachments, fetch the document with a form mode that includes the virtual field **`$FILES`** (case sensitive) and the names show up. Rich text itself can be fetched with `GET /richtext/mime/{unid}` or `GET /richtext/markdown/{unid}`, using `richTextAs=` (`html`/`mime`/`md`/`plain`) — DRAPI holds attachments in a **MIME / multipart** structure rather than Notes' native CD rich text.

## DAS: it has attachment endpoints too, hung off a rich text item

[DAS](https://github.com/OpenNTF/das-api-specs) ships with the XPages Extension Library (the Data service since Domino 8.5.3; the spec version on OpenNTF is 9.0.1). It has its own set of **dedicated attachment endpoints** — just addressed differently, hung off a document's rich text **item name**:

- **Add**: `POST …/api/data/documents/unid/{docUnid}/{itemName}` — `consumes: multipart/form-data`, summary "Adds an attachment to an item in a document.", returns **201**. **This is DAS's attachment-upload endpoint.**
- **Read**: `GET …/documents/unid/{docUnid}/{itemName}/{fileName}` — "Reads an attachment."
- **Update**: `PUT …/{itemName}/{fileName}` — `consumes: application/octet-stream`, "Updates an attachment."
- **Delete**: `DELETE …/{itemName}/{fileName}` — "Deletes an attachment."

When you GET the whole document (`GET …/api/data/documents/unid/{UNID}`), attachments appear **inline as base64** inside the rich text field's JSON by default; you can also add `attachmentlinks=true` to have the response give a link per attachment — "access the attachment as a separate resource" — instead of the data inline.

## The DAS trap: don't push attachment data back through the document body

So where does the "DAS returns 400" story come from? It's real, but narrow, and worth spelling out — because it's exactly what makes people read DAS as "can't upload."

DAS's documented limitation is that **you can't smuggle attachments through the create/update-document path** — trying to create/update a document with attachments or embedded objects in the rich text field returns **HTTP 400 (Bad Request)**. So the docs advise: if you take the data from a GET (which carries base64 attachment data) and reuse it to update/create, "remove any attachment data" first.

In other words, the 400 isn't "DAS won't let you upload attachments" — it's "attachments don't go through the document body." To upload, use the dedicated `POST …/{itemName}` endpoint from the previous section. Keep those two paths separate and DAS's attachment behavior makes sense.

(These DAS limitation details come from older DAS docs; the endpoints and parameters are from OpenNTF's das-api-specs (v9.0.1). If you're going to depend on them in production, verify against the Domino version you're on.)

## Which one to use

| | DRAPI (modern / KEEP) | DAS (legacy / Ext. Library) |
| --- | --- | --- |
| Attachment CRUD | ✅ dedicated endpoints | ✅ dedicated endpoints too |
| Addressing | `/attachments/{unid}/{name}` + `dataSource` | `…/documents/unid/{unid}/{itemName}[/{fileName}]` |
| Upload | `POST /attachments/{unid}` | `POST …/{itemName}` (multipart) |
| Attachment in a doc GET | rich text as MIME / multipart | base64 inline, or a link via `attachmentlinks` |
| Trap to avoid | — | don't round-trip a document with attachment data (returns 400) |
| Positioning | actively developed — Swagger / WOPI / Office Round Trip | legacy, ships with the Extension Library (v9.0.1) |

Both can upload, download, and delete; **for new projects use DRAPI** (modern, maintained, broader feature set), while DAS still works but is the older generation. If you do work attachments over DAS, use the dedicated endpoints — not the document body.

## Wrap-up

So "DAS is read-only" isn't accurate — it has create/read/update/delete attachment endpoints just the same. The DRAPI-vs-DAS difference isn't about whether you can upload, it's **modern vs legacy**: DRAPI (KEEP) is the actively developed line, addressing attachments as `/attachments/{unid}/{name}`; DAS is the older Extension Library line, hanging attachments off a rich text item, with one trap to avoid — don't round-trip a document with attachment data in it, or you'll get a 400. The layer underneath hasn't changed — whichever REST API, the attachment is still that attachment on a rich text field in Domino, the same through-line from [the three upload methods](/domino-news/en/posts/domino-attachments-three-ways) to [multi-file and batch delete](/domino-news/en/posts/domino-attachments-bulk).
