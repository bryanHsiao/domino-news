---
title: "NotesXSLTransformer: Transforming XML and DXL with XSLT in LotusScript"
description: "NotesXSLTransformer applies an XSLT stylesheet to XML or DXL and writes the transformed result — the last piece of Domino's XML toolkit alongside the DOM and SAX parsers. This article covers session.CreateXSLTransformer and its three sources, the stylesheet-must-be-a-stream rule, the pipelining model that chains DXL export → transform → import with no temp files, and the error handling that works through the Log property and On Error, not events."
pubDate: 2026-07-19T07:30:00+08:00
lang: en
slug: notes-xsl-transformer
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesXSLTransformer class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXSLTRANSFORMER_CLASS.html"
  - title: "CreateXSLTransformer method (NotesSession) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEXSLTRANSFORMER_METHOD_SESSION.html"
  - title: "Example: NotesXSLTransformer class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESXSLTRANSFORMER_CLASS.html"
relatedJava: ["XSLTransformer"]
relatedSsjs: ["XSLTransformer"]
---

You've got Domino data as XML — a DXL export of some documents, or an XML feed you pulled in — and you need it in a different shape: an HTML report, a CSV, a reformatted XML for another system. The tool for that is XSLT, and Domino runs it natively through [`NotesXSLTransformer`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXSLTRANSFORMER_CLASS.html) — "the transformation of DXL (Domino XML) data through XSLT." It's the last member of the LotusScript XML family, alongside the [DOM](/domino-news/en/posts/notes-dom-parser) and [SAX](/domino-news/en/posts/notes-sax-parser) parsers, and it slots into the same stream-based pipeline.

---

## TL;DR

- Create it from the session: [`Set xsl = session.CreateXSLTransformer(input, styleSheet, output)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEXSLTRANSFORMER_METHOD_SESSION.html) — all three arguments optional (set later with `SetInput` / `SetStyleSheet` / `SetOutput`), then call `Process`.
- **The stylesheet must be a `NotesStream`.** Input can be a String, `NotesStream`, or another XML processor (`NotesDOMParser` / `NotesSAXParser` / `NotesDXLExporter`); output can be a `NotesStream`, a parser, a `NotesDXLImporter`, or a `NotesRichTextItem`.
- **Don't read or write the file-backed streams yourself before handing them over** — "You cannot explicitly read or write a NotesStream object associated with a file prior to using it for XML input or output" (checking `Bytes` is fine).
- **Error handling is via `On Error` + the `lsxbeerr.lss` constants and the read-only `Log` property — there are no events.** (Unlike `NotesSAXParser`, which raises SAX event handlers.)
- **Pipelining:** the output of one XML process can be the input to the next, so you can chain `NotesDXLExporter` → `NotesXSLTransformer` → `NotesDXLImporter` with no temporary files. New in Release 6; not supported in COM.

## The three-stream pattern

The everyday shape is three `NotesStream`s — the XML input, the XSL stylesheet, and the output — wired into the transformer. This is the [official example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESXSLTRANSFORMER_CLASS.html) (reading `hello.xml`, applying `hello.xsl`, writing `hello.txt`):

```lotusscript
%INCLUDE "lsxbeerr.lss"

Sub Initialize
  On Error lsERR_NOTES_XSLT_INPUT_OBJECT GoTo err_IN
  On Error lsERR_NOTES_XSLT_OUTPUT_OBJECT GoTo err_OUT
  On Error lsERR_NOTES_XSLT_STYLESHEET_OBJECT GoTo err_SS

  Dim session As New NotesSession
  Dim XML_in As NotesStream, XSL_ss As NotesStream, XML_out As NotesStream

  Set XML_in = session.CreateStream
  If Not XML_in.Open("c:\dxl\hello.xml") Then Exit Sub
  If XML_in.Bytes = 0 Then Exit Sub          ' checking Bytes is allowed

  Set XSL_ss = session.CreateStream
  If Not XSL_ss.Open("c:\dxl\hello.xsl") Then Exit Sub   ' stylesheet MUST be a stream

  Set XML_out = session.CreateStream
  If Not XML_out.Open("c:\dxl\hello.txt") Then Exit Sub
  XML_out.Truncate                            ' clear stale output

  Dim transformer As NotesXSLTransformer
  Set transformer = session.CreateXSLTransformer(XML_in, XSL_ss, XML_out)
  transformer.Process
  Exit Sub
err_IN:
  MessageBox "XSL Input error",, "XSLTransformer" : Exit Sub
err_OUT:
  MessageBox "XSL Output error",, "XSLTransformer" : Exit Sub
err_SS:
  MessageBox "Style Sheet error",, "XSLTransformer" : Exit Sub
End Sub
```

The important habits are all here: open each file-backed stream but don't read or write it yourself (checking `Bytes = 0` to confirm the input exists is the one exception), `Truncate` the output stream so old content is cleared, and let a single `Process` run the whole transform.

## Errors go through Log, not events

This is where the class differs from its SAX sibling and where a wrong assumption wastes time: **`NotesXSLTransformer` has no event model.** There are no `XSLT_*` callbacks to wire up. Error handling is two things instead. First, `On Error` with the backend error constants that `%INCLUDE "lsxbeerr.lss"` brings in — `lsERR_NOTES_XSLT_INPUT_OBJECT`, `_OUTPUT_OBJECT`, `_STYLESHEET_OBJECT` — which is how the official example distinguishes an input problem from a stylesheet problem. Second, the read-only `Log` property, "an XML representation of warnings, errors, and fatal errors generated by the processor," which you can read after `Process` for detail; `ExitOnFirstFatalError` controls whether processing stops at the first fatal error. If you came expecting a SAX-style handler, that's the section to re-read.

## Pipelining: skip the temp files

The reason the transformer takes parsers and DXL objects as input/output, not just streams, is pipelining — "combine operations so that the output of one XML process becomes the input to another." Instead of exporting a document to a DXL file, transforming that file, and importing the result, you chain the objects directly:

- `NotesDXLExporter` (export documents to DXL) → **`NotesXSLTransformer`** (apply the stylesheet) → [`NotesDXLImporter`](/domino-news/en/posts/notes-dxl-importer) (write the transformed DXL into another database).

The stylesheet is still a `NotesStream`, but the XML input and output become live objects, and no intermediate files touch disk. `AddParameter` lets you pass top-level `<xsl:param>` values into the stylesheet, so one transform can be parameterised per run.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `session.CreateXSLTransformer(...)` → `NotesXSLTransformer` | `session.createXSLTransformer(...)` → `XSLTransformer` | `session.createXSLTransformer(...)` |

Java has an equivalent `lotus.domino.XSLTransformer`, but it isn't a 1:1 mirror — the Java DXL/XSLT path uses the JAXP-style result-target model (`XSLTResultTarget` built from a `FileOutputStream` or `StringWriter`) rather than the stream trio. SSJS reaches the same backend factory method through the session. The core idea — feed XML/DXL and a stylesheet, get transformed output, and prefer pipelining over temp files — carries across all three.
