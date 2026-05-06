---
title: "OpenNTF's LotusScript Class Map: 97 Classes on One Interactive Page, Open-Source Data Behind It"
description: "OpenNTF released a LotusScript Class Map for HCL Domino 14.5.1 in 2026 — 97 classes, 1,001 properties, 997 methods, 72 events laid out on one interactive visual map, every node clickable through to the HCL docs. This piece covers what the tool does, the open-source license and JSON data behind it, and why it's useful for picking topics, planning learning paths, and exploring the API surface."
pubDate: 2026-05-08T07:30:00+08:00
lang: en
slug: openntf-lotusscript-class-map
tags:
  - "Community"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "LotusScript Class Map (live demo) — OpenNTF"
    url: "https://openntf.org/ls/index.html"
  - title: "OpenNTF/ls-classmap — GitHub repo"
    url: "https://github.com/OpenNTF/ls-classmap"
  - title: "OpenNTF — open community for Notes/Domino"
    url: "https://openntf.org/"
---

## All 97 LotusScript classes on one canvas

[OpenNTF](https://openntf.org/) released the [LotusScript Class Map v0.9](https://openntf.org/ls/index.html) in 2026 — every LotusScript class in HCL Domino 14.5.1 visualised on a single interactive page. The inspiration is the 1997 Lotus poster *Domino Objects for LotusScript/COM/OLE*, basically the same idea moved from a wall-sized print to the web.

Specs:

- **97 classes** (NotesSession / NotesDocument / NotesView / NotesRichTextItem / the lot)
- **1,001 properties**
- **997 methods**
- **72 events**

Click a node and you get its full list of properties, methods, and events. Every individual entry links straight through to the HCL documentation page for that property or method.

## Why this tool earns its place

**Interactive vs flat docs**: the HCL docs are organised hierarchically — to follow `session.GetDatabase → db.GetView → view.GetEntryByKey → entry.Document → doc.Items → item.IsReaders`, you navigate one page at a time. The Class Map puts the whole relationship graph on one canvas; hovering one node highlights its neighbours plus the connecting edges, and the **shape of the API** clicks into focus immediately.

Key interactions:

- **Search** — filters the sidebar list and highlights matching nodes on the canvas at the same time
- **Filter by type** — show only UI classes, only Backend classes, or only classes with events
- **Hover a node** — direct neighbours light up, everything else dims
- **Hover an edge** — reveals the method or property name that creates that relationship (visible above 60% zoom)
- **Drag-arrange** — your layout is saved to localStorage and restored next visit
- **Konami code** (↑↑↓↓←→←→BA) — homage to the original 1997 poster

## Under the hood: source data + license

**Source**: HCL Domino Designer 14.5.1 documentation (`https://help.hcl-software.com/dom_designer/14.5.1/`) — the same reference base most articles on this site cite.

**License**: Apache 2.0 for the application code, with HCL's documentation metadata embedded as reference data. The whole thing is a static, client-side web app — no backend; all data is fetched from a single JSON file.

**The JSON is reusable on its own**: in the [ls-classmap repo](https://github.com/OpenNTF/ls-classmap), `src/main/resources/WebContent/data/ls_classes.json` (1.6 MB) is the structured reference data for all 97 classes:

```json
{
  "nodes": [
    {
      "id": "NotesDocument",
      "name": "NotesDocument",
      "isUI": false,
      "description": "...",
      "docUrl": "https://help.hcl-software.com/.../H_NOTESDOCUMENT_CLASS.html",
      "props": [ ... ],
      "methods": [ ... ],
      "events": [ ... ]
    },
    ...
  ]
}
```

In other words — if you want this data for your own tooling, **just `curl` the file**. No need to scrape the HCL docs. Apache 2.0 allows integrating it into your own project.

## Running it

**Online**: just open `https://openntf.org/ls/index.html` — recommended in Chrome or Firefox (Safari is unsupported because of [WebKit bug #23113](https://bugs.webkit.org/show_bug.cgi?id=23113), which affects how `foreignObject` renders scrollable HTML inside SVG).

**Self-hosted**: clone the repo and serve it from any static web server (it can't run from a `file://` URL because the `fetch()` for `ls_classes.json` won't work):

```bash
# Built-in Python
cd src/main/resources/WebContent
python3 -m http.server 8080

# Or via Node
npx serve src/main/resources/WebContent
```

## Who gets the most out of it

A few typical use cases:

1. **New Domino developers**: instead of reading Designer help cover-to-cover, you get a "big picture → details" entry path — work top-down from the architecture instead of bottom-up from individual pages.
2. **API discovery**: you know what you're trying to do but not which class — search for a keyword ("mime", "stream", "query") and the relevant classes light up directly on the map.
3. **Planning a learning path**: filter to "Backend", look at the connection graph, prioritise from there (NotesSession is the hub — start there).
4. **Picking topics for content / tutorials**: pull the JSON down, diff against what your site has already covered, and you have a precise list of classes still untouched — no more guessing what's next.

## Bonus — what else the JSON can do

For people interested in `ls_classes.json` itself:

- Scan your own LS codebase for class usage (grep class names against the reference)
- Power autocomplete in an IDE / editor extension
- Auto-generate a class-index page for tutorials or blogs (markdown tables)
- Build a test-coverage report (which classes have unit tests, which don't)

Apache 2.0 license + structured + each entry already aligned with the official `docUrl` — this dataset is unusually reusable for its niche.

## The takeaway

The Class Map's value comes in two layers: **for users**, a faster way to wrap your head around LotusScript's full surface; **for developers**, a structured, open-source, doc-aligned JSON dataset that the community can build other tools on top of. The first layer makes daily work easier, the second lets the community keep building outward.

Comparing the 1997 Lotus poster to the 2026 web app — same goal, almost 30 years apart, the underlying problem hasn't changed: **Notes/Domino's API surface is too big to internalise from prose docs alone, and a full picture is more useful than a thousand pages of reference**.
