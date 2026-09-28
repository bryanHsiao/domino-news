---
title: "DXL in Java: Exporting and Importing Domino Data with DxlExporter / DxlImporter"
description: "To move design elements between databases, or snapshot documents as XML for diffing/backup, DXL is Domino's XML representation. In Java the two workhorses are DxlExporter (Domino→DXL, exportDxl returns a String) and DxlImporter (DXL→Domino, importDxl writes into a target DB). The catch: import isn't just 'load the XML' — you tell it how to handle design, documents, and ACL (create/replace/update/ignore) with setDesignImportOption / setDocumentImportOption / setAclImportOption, and whether the replica must match. This covers both classes, the import options, and the relationship to the LotusScript version."
pubDate: 2026-10-04T07:30:00+08:00
lang: en
slug: java-dxl-exporter-importer
tags:
  - "Java"
  - "Tutorial"
sources:
  - title: "Exporting and importing DXL (Java) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXPORTING_AND_IMPORTING_DXL_JAVA.html"
  - title: "DxlImporter (Java) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLIMPORTER_CLASS_JAVA.html"
  - title: "createDxlExporter (Session - Java) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_CREATEDXLEXPORTER_METHOD_SESSION_JAVA.html"
relatedJava: []
relatedSsjs: []
---

You need to move a set of design elements from a test DB to production, or snapshot a batch of documents as XML to diff, back up, or feed another system — **DXL (Domino XML) is the XML representation of Domino data and design**, and in Java the two workhorses for going in and out are `DxlExporter` and `DxlImporter`.

Going out is simple; **coming back is where the thought goes** — import isn't just "load the XML." You have to tell it how design, documents, and ACL are each handled: create, replace, update, or ignore. Get the policy wrong and things either don't land, or overwrite what they shouldn't.

This piece covers both classes and the import options that decide success.

---

## TL;DR

- **`DxlExporter` (Domino → DXL)**: create with `session.createDxlExporter()`; `exportDxl(...)` takes a `Database` / `Document` / `DocumentCollection` / `NoteCollection` and **returns a DXL String**.
- **`DxlImporter` (DXL → Domino)**: create with `session.createDxlImporter()`; `importDxl(...)` takes a `String` / `Stream` / `RichTextItem` and **writes into a target `Database`**; walk the imported notes with `getFirstImportedNoteID` / `getNextImportedNoteID` (the latter takes the current note ID).
- **Import is policy-driven**: `setDesignImportOption` (create/ignore/replace), `setDocumentImportOption` (create/ignore/replace/update), `setAclImportOption` (ignore/replace/update), `setReplaceDbProperties`, `setReplicaRequiredForReplaceOrUpdate`.
- **recycle** the exporter/importer and the backend objects along the way, per [the Java recycle discipline](/domino-news/en/posts/java-recycle-memory).
- **Round-trip has traps**: out-and-back isn't guaranteed identical — see [the DXL round-trip pitfalls piece](/domino-news/en/posts/dxl-round-trip-pitfalls).

## DxlExporter: Domino → DXL

The official [Exporting and importing DXL](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXPORTING_AND_IMPORTING_DXL_JAVA.html) is direct: "Use the createDxlExporter method in Session to create a DxlExporter object. Use the exportDxl method to perform the export. Input to exportDxl can be a Database, Document, DocumentCollection, or NoteCollection object. Output is a String object."

```java
DxlExporter exporter = session.createDxlExporter();
String dxl = exporter.exportDxl(doc);      // or a Database / DocumentCollection / NoteCollection
// …write dxl to a file, diff it, ship it…
exporter.recycle();
```

To control the output, the exporter has a set of options (whether to emit a DOCTYPE, how rich text is handled). Defaults are usually fine; reach for the exporter's setters when you need exact formatting.

## DxlImporter: DXL → Domino

Official: "Use the createDxlImporter method in Session to create a DxlImporter object. Input to DxlImporter can be a String, Stream, or NotesRichTextItem object. Output is to a Database object." After importing, "You can access these note IDs using the getFirstImportedNoteId and getNextImportedNoteId methods."

```java
DxlImporter importer = session.createDxlImporter();
importer.setDocumentImportOption(DxlImporter.DXLIMPORTOPTION_CREATE);
importer.importDxl(dxl, targetDb);          // writes into targetDb

String noteId = importer.getFirstImportedNoteID();
while (noteId != null) {
    // …handle each newly imported note…
    noteId = importer.getNextImportedNoteID(noteId);   // pass the current note ID to get the next
}
importer.recycle();
```

## Import is policy-driven: three ImportOptions

This is the step to think through. The target DB may already hold the same things, so you decide "what happens when it's already there." The official [DxlImporter](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLIMPORTER_CLASS_JAVA.html) options:

| Option | Controls | Choices |
|---|---|---|
| `setDesignImportOption` | how incoming **design elements** are handled | create / ignore / replace |
| `setDocumentImportOption` | how incoming **documents** are handled | create / ignore / replace / update |
| `setAclImportOption` | how incoming **ACL** entries are handled | ignore / replace / update |
| `setReplaceDbProperties` | whether the incoming DXL **replaces database properties** | yes / no |
| `setReplicaRequiredForReplaceOrUpdate` | whether the replica IDs must **match** for replace/update | yes / no |

A few practical notes:

- **Think about the replica condition before replace/update**: `setReplicaRequiredForReplaceOrUpdate` decides "must the DXL's replica ID match the target's." When you move design across databases that aren't replicas, this setting determines whether replace/update can happen at all.
- **update vs replace for documents differ**: `update` merges into the existing one; `replace` swaps it out — moving data vs overwriting it gives very different results.
- **Don't drag ACL in by accident**: importing DXL that contains ACL with `setAclImportOption` unset can change the target's permissions — usually not what you want when you're just moving design.

## recycle and round-trips

`DxlExporter` / `DxlImporter` are backend objects too — `recycle()` when done, per [the Java recycle piece](/domino-news/en/posts/java-recycle-memory). And DXL "out and back" isn't guaranteed byte-identical (some elements, rich text, and attachments have quirks) — the site's [DXL round-trip pitfalls](/domino-news/en/posts/dxl-round-trip-pitfalls) covers that, worth reading before you move production data.

## What about LotusScript and SSJS?

- **LotusScript**: the counterparts are `NotesDXLExporter` / `NotesDXLImporter`, with nearly the same shape (`CreateDXLExporter` / `CreateDXLImporter`, `Export` / `Import`, the same import options) — the site's [NotesDXLImporter (LS) piece](/domino-news/en/posts/notes-dxl-importer) covers the LS side. This one is the Java form.
- **SSJS**: you can reach the same classes through the Java API, but DXL in and out is more typically done in an agent / background job (Java or LS) than in front-end SSJS.
