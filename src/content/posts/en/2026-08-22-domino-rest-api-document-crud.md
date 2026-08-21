---
title: "Creating a Document in the Domino REST API: Why It Needs a Form Field and a dataSource"
description: "The door is open (schema + scope); this part does the real work: create/read/update/delete NSF documents over REST. Create is POST /document with a required Form field in the body, and the response @meta carries a unid; read is GET /document/{unid}/{mode}. Every CRUD call carries dataSource — and that value is the scope name you made last part. It also covers two things that give Domino developers pause: why the Form field is required, and what a mode is. Part four of the DRAPI series."
pubDate: 2026-08-22T07:30:00+08:00
lang: en
slug: domino-rest-api-document-crud
tags:
  - "Domino REST API"
  - "Tutorial"
sources:
  - title: "Domino REST API — Enable a database (CRUD)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html"
  - title: "Domino REST API — Using the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API — Quickstart"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
cover: "/covers/domino-rest-api-document-crud.webp"
coverStyle: "risograph"
---

[The last part](/domino-news/en/posts/domino-rest-api-scope-schema) opened the door — a schema decides what's exposed, a scope gives it a name. This part does the real work: create, read, update, and delete documents in an NSF over REST, all in JSON. (If you haven't stood DRAPI up yet, walk the official [quickstart](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) first.)

Coming from LotusScript, you'll pause here: no `NotesDocument`, no `ReplaceItemValue`, no `.Save`. A document is a blob of JSON, and one HTTP verb is one operation. But two Domino-specific things need recognizing first: **`dataSource`** (your scope name) and the **`Form` field**.

---

## TL;DR

- **Every CRUD call carries a `dataSource` query param,** whose value is the **scope name** you made [last part](/domino-news/en/posts/domino-rest-api-scope-schema) — the [docs are explicit](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html) that the scope name is the `dataSource` value used across all CRUD operations.
- **Create:** `POST /api/v1/document?dataSource=<scope>`, the body a JSON blob that **must include a `Form` field** naming the kind of document. The response `@meta` carries `unid` and `noteid`.
- **Read:** `GET /api/v1/document/{unid}/{mode}?dataSource=<scope>`.
- **Update / delete:** `PATCH` (partial), `PUT` (full replace), `DELETE`, all against `/api/v1/document/{unid}` with `dataSource`.
- **`mode` is a DRAPI-specific concept:** a form can have several modes (`default`, `odata`, `dql`…), each defining which fields you can see/write. Create uses the first, `default`, mode.

---

## Create: POST /document

Creating a document is packing the fields into JSON, POSTing to the [document endpoint](https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html), and naming the scope in the query string:

```bash
curl -X POST "http://localhost:8880/api/v1/document?dataSource=customers" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "Form": "Customer",
        "first_name": "Madison",
        "last_name": "Branthwaite",
        "email": "mbranthwaite0@nba.com"
      }'
```

Two very Domino details:

- **`dataSource=customers`:** `customers` is your **scope name**, not a file path and not a replica ID. DRAPI uses the scope to find the NSF behind it and apply its schema.
- **The `Form` field is required:** it names which form the document uses — DRAPI uses it to look up the corresponding mode (fields and access rules) in the schema. It's the same `Form` item a Domino document always had, only now you write it explicitly in the JSON.

On success the returned JSON gains an `@meta` object carrying the new document's identifiers:

```json
{
  "@meta": { "unid": "A1B2...C3D4", "noteid": 2458, "...": "..." },
  "Form": "Customer",
  "first_name": "Madison"
}
```

That `unid` is the handle you'll use to read, update, or delete this document later.

## Read: GET /document/{unid}/{mode}

With the `unid` in hand, read the document back:

```bash
curl "http://localhost:8880/api/v1/document/A1B2...C3D4/default?dataSource=customers" \
  -H "Authorization: Bearer <token>"
```

The `default` in the path is the **mode** (it's optional; omit it and you get `default`). The returned JSON is the document's fields — Domino items become JSON keys, multi-value fields become JSON arrays — plus an `@meta`.

## Update and delete

Update and delete take the same `/document/{unid}` path with a different HTTP verb:

- **`PATCH /api/v1/document/{unid}?dataSource=<scope>`:** a partial update — the body carries only the fields you're changing, the rest untouched.
- **`PUT /api/v1/document/{unid}?dataSource=<scope>`:** full replace.
- **`DELETE /api/v1/document/{unid}?dataSource=<scope>`:** delete it.

From a LotusScript angle, `PATCH` is probably the one you'll reach for most — it maps to the everyday "open a document, change a few fields, save," except you no longer open or save yourself; one request does it.

## The thing that gives you pause: mode

`mode` is DRAPI-specific — classic Domino has no equivalent — and worth its own section. The design: a form's schema can define **several modes**, each a set of rules for "from this angle, which fields you can see/write, and under what access conditions."

- Creating a document uses the first mode, called **`default`**.
- Reading, you name in the path which mode to project the document through.
- Some modes have built-in purposes — OData access needs one named `odata`, for instance.

In other words, **the same document can expose different subsets of fields through different modes.** This is how DRAPI does field-level exposure control in the schema — you don't dump the whole document out indiscriminately; the mode decides how much shows this time.

## Wrap-up

A Domino document, on the REST side, is a blob of JSON with a `@meta`; `POST` / `GET` / `PATCH` / `DELETE` are create / read / update / delete; `dataSource` is always your scope name, the `Form` field names the document type on create, and `mode` decides which fields show. The next part reaches **querying** — when you want not a single document but "the batch that matches," how you run DQL over REST and read views.
