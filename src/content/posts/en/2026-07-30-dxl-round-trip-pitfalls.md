---
title: "DXL Round-Trip Pitfalls: Why Export-Then-Import Gives You Duplicates, Not the Same Documents"
description: "You export documents to DXL, import the DXL into another database, and end up with copies carrying brand-new UNIDs instead of the same documents updated in place — because the importer creates by default and only matches on UNID when you tell it to. A field report on the DXL round-trip: the DocumentImportOption that decides create-vs-replace, why default rich text isn't binary-identical (and when to switch to RAW), and the stale-handle trap that hides the whole thing."
pubDate: 2026-07-30T07:30:00+08:00
lang: en
slug: dxl-round-trip-pitfalls
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "DocumentImportOption (NotesDXLImporter, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTIMPORTOPTION_PROPERTY_IMPORTER.html"
  - title: "RichTextOption (NotesDXLExporter, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTOPTION_PROPERTY_EXPORTER.html"
  - title: "NotesDXLImporter (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
relatedJava: ["DxlExporter", "DxlImporter"]
relatedSsjs: ["DxlExporter", "DxlImporter"]
cover: "/covers/dxl-round-trip-pitfalls.webp"
coverStyle: "bw-grain"
---

The plan is simple: export a set of documents to DXL, move the file, import it into a second database, and now the two databases match. You run it, the import succeeds, no errors — and the target database has *twice* as many documents as you expected, or a fresh copy of everything you meant to update in place. Every imported document came in with a brand-new UNID, unrelated to the one it had in the source. The round-trip didn't move the documents; it cloned them.

That's not a bug, it's the default. This is a field report on making a DXL round-trip do what you meant — the one import option that decides create-versus-replace, the rich-text fidelity switch that most round-trips leave in the wrong position, and the stale-handle trap that makes the whole thing look like it worked when it didn't. It builds on the [`NotesDXLImporter`](/domino-news/en/posts/notes-dxl-importer) walk-through; this piece is about the round-trip specifically.

---

## TL;DR

- The [importer](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html) **creates new documents by default**, assigning new UNIDs even when the DXL's `<noteinfo>` carries the original. Export→import is a copy, not an update, until you say otherwise.
- Set `DocumentImportOption` to `DXLIMPORTOPTION_REPLACE_ELSE_CREATE` (or `UPDATE_ELSE_CREATE`) to match incoming documents to existing ones **by UNID** and replace them — the option that turns a clone into a real round-trip.
- Rich text exports as structured `<richtext>` by default (`DXLRICHTEXTOPTION_DXL`), which is readable but not guaranteed binary-identical. For an export whose only job is re-import, use `DXLRICHTEXTOPTION_RAW` — `<rawitemdata>`, Base64, byte-exact.
- After importing, **re-fetch the document** from the database. The document handle you had before the import doesn't reflect what the importer wrote.

## The duplicate-UNID trap

The DXL for a document carries its identity in a `<noteinfo>` element — the UNID, the sequence number, the dates. It's right there in the file, so it's natural to assume the importer uses it. It doesn't, not by default. As the documentation puts it, the importer "creates new documents even if a matching UNID exists unless the `DocumentImportOption` is set appropriately." The default is create, and create always mints a new UNID.

So the fix is to pick the [`DocumentImportOption`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTIMPORTOPTION_PROPERTY_IMPORTER.html) that matches your intent. The property "indicates the handling of incoming documents: create, ignore, replace, or update," and the compound constants are where round-trips live:

- `DXLIMPORTOPTION_REPLACE_ELSE_CREATE` — "replaces documents in the output database with documents in the incoming DXL that match [by UNID] and adds any new documents." This is the true round-trip: existing docs update in place, genuinely new ones get created.
- `DXLIMPORTOPTION_REPLACE_ELSE_IGNORE` — replace matches, silently drop anything with no match. Use when the DXL should only ever update, never introduce.
- `DXLIMPORTOPTION_UPDATE_ELSE_CREATE` / `_UPDATE_ELSE_IGNORE` — the update variants, for merging fields rather than wholesale replacement.
- `DXLIMPORTOPTION_CREATE` — the default; every incoming document is new. Correct for "seed a fresh database," wrong for "sync two."

```lotusscript
Dim importer As NotesDXLImporter
Set importer = session.CreateDXLImporter()
importer.DocumentImportOption = DXLIMPORTOPTION_REPLACE_ELSE_CREATE
Call importer.Import(dxlText, targetDb)   ' matches on UNID, updates in place
```

One line, and the clone becomes a round-trip. Leave it out and you get copies — the single most common DXL surprise.

## Rich text: readable or identical, pick one

The other fidelity switch is on the export side. By default the exporter writes rich text as a structured `<richtext>` element (`DXLRICHTEXTOPTION_DXL`) — the human-readable form, with paragraphs and runs spelled out in XML. That's the right choice when a human or another tool needs to read or transform the content. It is *not* guaranteed to be binary-identical on the way back.

When the DXL's only destination is another Domino database, flip [`RichTextOption`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTOPTION_PROPERTY_EXPORTER.html) to `DXLRICHTEXTOPTION_RAW`. The docs are explicit about the trade: RAW writes a `<rawitemdata>` element — the raw rich-text CD records, Base64-encoded — and "assures that the imported data will be precisely the same as the original." Byte-exact, and completely opaque; you can't read or edit it, only round-trip it. The rule of thumb: transforming or inspecting the content → DXL; faithfully moving it between databases → RAW. One caveat the reference calls out: for a *design* note, RAW alone gets you binary identity but "might not be functionally identical unless you also use note format" via the `ForceNoteFormat` property.

## The stale-handle trap

The pitfall that hides the other two: after an import, the in-memory objects you had before don't reflect what changed. If you export a document, import an edited DXL back over it, then read fields off the *original* `NotesDocument` handle, you'll see the old values and conclude the import didn't take — when it did, into the database, just not into your stale handle. Discard the pre-import handle and re-fetch the document (by UNID, now that you're preserving it) before you trust what you read. This is the trap that makes a correctly-configured round-trip *look* broken, and it costs an afternoon every time.

## A note on the DOCTYPE

One smaller export knob worth knowing, because it connects to a corner covered [elsewhere](/domino-news/en/posts/notes-dom-dtd-nodes): `OutputDOCTYPE` controls whether the exported DXL carries a `<!DOCTYPE>` line, and `DoctypeSYSTEM` sets its system identifier. For a round-trip between Domino databases it rarely matters — the importer doesn't need the DTD to read the DXL. It matters when the DXL is consumed by an outside XML tool that validates against the Domino DTD. If that's not your case, leaving the DOCTYPE out keeps the file smaller and simpler; it's not something a Domino-to-Domino round-trip depends on.

## What about Java and SSJS?

This one has direct counterparts, and they behave identically. Java's `DxlExporter` / `DxlImporter` and SSJS's `DxlExporter` / `DxlImporter` expose the same `DocumentImportOption` and `RichTextOption` with the same constants and the same defaults — so the duplicate-UNID trap and the RAW-vs-DXL choice are language-independent. The behaviour is a property of the DXL engine, not the LotusScript wrapper. If you're moving a migration routine to Java or an XPages job, carry the two settings across verbatim; the mistake to avoid is assuming a different language changed the create-by-default behaviour. It didn't.
