---
title: "Your DQL Is Correct but Returns Nothing? The Form Is Missing a dql Mode"
description: "Last part fetched a single document by unid. What you usually want is 'the batch that matches' — all incomplete todos, all customers in a region. DRAPI gives two paths: GET /lists/{view} to read a view/folder, or POST /query to run DQL. DQL even supports parameterized queries (?VAR + variables, injection-safe). But there's a trap that follows from the last part's modes: a form without a dql mode is completely invisible to DQL. This part covers both query paths, pagination, the mode trap, and DQL access control. Part five of the DRAPI series."
pubDate: 2026-08-23T07:30:00+08:00
lang: en
slug: domino-rest-api-query-dql
tags:
  - "Domino REST API"
  - "DQL"
  - "Tutorial"
sources:
  - title: "Domino REST API — Reserved Form Mode names"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/modenames.html"
  - title: "Domino REST API — Enable a database (query & lists)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html"
  - title: "Domino REST API — DQL query tutorial"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/todo/dataAccess/query.html"
cover: "/covers/domino-rest-api-query-dql.webp"
coverStyle: "low-poly-3d"
---

[The last part](/domino-news/en/posts/domino-rest-api-document-crud) fetched a single document by `unid`. But most of the time you don't want one document, you want **the batch that matches** — all incomplete todos, every customer in a region, all orders from this month.

DRAPI gives you two paths to a batch: read an existing **view/folder** (`/lists`), or run **DQL** (`/query`). This part walks both, and adds a trap that follows straight from the last part's mode concept — **a form without a `dql` mode is completely invisible to DQL**.

---

## TL;DR

- **Read a view / folder:** `GET /api/v1/lists/{viewname}?dataSource=<scope>`, paginated with `count` and `start`.
- **Run DQL:** `POST /api/v1/query?action=execute&dataSource=<scope>`, the body carrying a `query` string.
- **DQL supports parameters:** use `?VAR` placeholders in the query and a `variables` object for the values — don't concatenate user input into DQL.
- **The mode trap:** DQL only sees forms that have a `dql` mode — a form without one returns zero documents to DQL.
- **DQL is opt-in:** the schema needs `dqlAccess: true`, and you can add a `dqlFormula` (a Notes formula that must evaluate to `@True`) to restrict who may use it.

---

## Read a view: /lists

If the data you want happens to have an existing view or folder, the easiest route is to read it directly:

```bash
curl "http://localhost:8880/api/v1/lists/Customers?dataSource=demo&count=25&start=0" \
  -H "Authorization: Bearer <token>"
```

`Customers` is the view name, and `dataSource` is your [scope name](/domino-news/en/posts/domino-rest-api-document-crud) as always (this `/lists/{view}` endpoint also accepts `db=` as an alias for `dataSource` — the official tutorial writes it that way; both work). Back comes a batch of entries from that view. Paginate with `count` (how many at once) and `start` (which entry to start from) — always paginate a big view rather than pulling it all at once.

This route is fast and reuses the view's existing sort and selection; the limit is that you only get the view's columns, and you're bound to whatever views already exist.

## Run DQL: /query

For more flexible conditional queries, run [DQL](https://opensource.hcltechsw.com/domino-keep-tutorials/pages/todo/dataAccess/query.html). It's a `POST` with the query in the body:

```bash
curl -X POST "http://localhost:8880/api/v1/query?action=execute&dataSource=todorest" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "query": "form = '\''todo'\'' and completed = ?STATUS",
        "variables": { "STATUS": "false" },
        "maxScanDocs": 500000,
        "timeoutSecs": 300,
        "noViews": false
      }'
```

Back comes the batch of documents matching the DQL. Fields worth knowing:

- **`query`**: the DQL string itself.
- **`variables`**: the important one — DQL supports **parameterized queries**. Use a `?STATUS`-style placeholder in the query and put the actual value in the `variables` object. **Don't concatenate user input straight into `query`**; `?VAR` + `variables` is the safe form, the same reasoning as a SQL prepared statement.
- **`maxScanDocs` / `timeoutSecs`**: guardrails on DQL scanning and timeout, so one bad query can't drag the server down.
- **`noViews`**: whether DQL may use view indexes to speed itself up.

`/query` also takes `count` / `start` for pagination, like `/lists`.

## The trap: DQL only sees forms with a dql mode

This is the easiest trap to hit, and it follows straight from [the last part's mode concept](/domino-news/en/posts/domino-rest-api-document-crud). You may already have a `default` mode on a form (so CRUD works), then run DQL and get **zero documents of that form** — not because the DQL is wrong, but because that form has **no `dql` mode**.

The docs are blunt:

> If a form does not include a `dql` mode, no data for that form will be returned in DQL queries.

`dql` is one of DRAPI's [five reserved modes](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/modenames.html) (`default` / `dql` / `odata` / `raw` / `vsheet`), and it's not just a switch — **the `dql` mode also decides which fields DQL returns**. So to let a form be queried by DQL and control what it returns, you add a `dql` mode for it in the schema.

## DQL is opt-in, and a formula can gate it

Even with a `dql` mode on the form, the DQL capability itself is enabled at the schema level: set `dqlAccess: true`. And you can add a `dqlFormula` — a Notes formula that must evaluate to `@True` for DQL to be allowed ([the docs](https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html) default it to `@True`, i.e. no restriction). That gives you a gate, written in familiar @formula, over who may run DQL and under what conditions.

## Choosing between the two

- **An existing view whose columns are enough** → `/lists/{view}`. Fastest and leanest, reusing the view's sort and selection.
- **Flexible conditions, cross-field, dynamic** → `/query` with DQL, and parameterize it.
- Both paginate (`count` / `start`), and both need the right mode: `/lists` uses `default` (or whichever you name on read), `/query` requires `dql`.

The next part closes the series: **error handling and security** — what errors look like on the REST side, whether Readers fields still count over DQL and lists, and the ports to close before you go live.
