---
title: "NotesXMLProcessor: The Common Base for LotusScript XML Handling"
description: "NotesXMLProcessor is the abstract base class behind every LotusScript XML handler — DOMParser, SAXParser, DXLExporter, DXLImporter, and XSLTransformer all inherit from it. This guide covers the role it plays, the five derived classes and when to pick which, the inherited properties, the SetInput / SetOutput / Process trio, and the Release 6 / no-COM caveats that don't make it into most quick refs."
pubDate: 2026-05-06T07:30:00+08:00
lang: en
slug: notes-xml-processor
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesXMLProcessor (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html"
  - title: "NotesXMLProcessor.SetInput method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SETINPUT_METHOD_XMLPROCESSOR.html"
  - title: "NotesDXLExporter (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html"
cover: "/covers/notes-xml-processor.png"
coverStyle: "low-poly-3d"
---

## What NotesXMLProcessor actually is

[`NotesXMLProcessor`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html) is "a base class containing properties and methods common to all XML processing classes." The key thing — and the thing the docs put bluntly up front — is that **it is abstract**: "The NotesXMLProcessor class is abstract and you do not create NotesXMLProcessor objects." To use it at all, you go through one of the `NotesSession.Create*` methods to instantiate a derived class.

> **Version and platform**: introduced in Release 6; **not supported in COM** (LotusScript works, COM automation does not).

## The five derived classes — picking the right one

| Derived class | What it does | Created via |
|---|---|---|
| `NotesDOMParser` | Parses XML into a DOM tree (random-access, in-memory) | `session.CreateDOMParser` |
| `NotesSAXParser` | Streams XML as events (fits large files, no full load) | `session.CreateSAXParser` |
| `NotesDXLExporter` | Exports Domino data (DB / docs / view) as DXL (Domino XML) | `session.CreateDXLExporter` |
| `NotesDXLImporter` | Imports DXL back into Domino | `session.CreateDXLImporter` |
| `NotesXSLTransformer` | Transforms DXL through XSLT | `session.CreateXSLTransformer` |

Quick decision rule:

- Touching Domino design or data → DXLExporter / DXLImporter.
- Parsing third-party XML → DOMParser (small files, random access) or SAXParser (large files, streaming).
- Reshaping DXL into another XML dialect → XSLTransformer.

## Inherited properties

- `ExitOnFirstFatalError` (read-write Boolean) — stop on the first fatal error.
- `Log` (read-only String) — the warnings, errors, and fatal errors raised during processing, **as XML**.
- `LogComment` (read-write String) — a comment prepended to the log so you can identify the run later.

`Log` being XML rather than plain text is intentional — if you need to act on errors programmatically, parse it with a DOMParser.

## Inherited methods

- [`SetInput`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SETINPUT_METHOD_XMLPROCESSOR.html) — specifies the input. **Accepted types depend on the derived class**: DXLExporter takes `NotesDatabase` / `NotesDocumentCollection` / `NotesDocument`; DOMParser / SAXParser take `NotesStream` or a file-path string; DXLImporter takes DXL strings or a `NotesStream`.
- `SetOutput` — specifies the destination (again, varies — typically a `NotesStream` or a file-path string).
- `Process` — runs the conversion or parse. Synchronous: the call returns when processing finishes.

## Example: export the whole database to DXL

The most common starting case is using [`NotesDXLExporter`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html) to dump the current database to a DXL file:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' Open a NotesStream as the output sink
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Dim filename As String
    filename = "C:\dxl\" & Left(db.FileName, Len(db.FileName) - 3) & "xml"
    If Not stream.Open(filename) Then
        Messagebox "Cannot open " & filename, , "Error"
        Exit Sub
    End If
    Call stream.Truncate

    ' Create the DXL exporter (NotesXMLProcessor is abstract — go through a derived class)
    Dim exporter As NotesDXLExporter
    Set exporter = session.CreateDXLExporter

    ' Wire input and output
    Call exporter.SetInput(db)
    Call exporter.SetOutput(stream)

    ' Stop on fatal errors; tag the log so we can find this run later
    exporter.ExitOnFirstFatalError = True
    exporter.LogComment = "Exported by " & session.UserName

    ' Actually run it
    Call exporter.Process

    ' Surface any warnings / errors
    If Len(exporter.Log) > 0 Then
        Print "DXL export log:"
        Print exporter.Log
    End If

    Call stream.Close
    Messagebox "DXL export complete."
End Sub
```

Things worth noting in this snippet:

1. **NotesXMLProcessor is never `New`'d directly** — you always go through `session.CreateXxx`.
2. **`SetInput` / `SetOutput` on their own do nothing** — you must call `Process` to actually run.
3. **`Process` is synchronous** — for a big database, the Sub blocks until it finishes.
4. **`Log` is XML, not plain text** — feed it through a DOMParser if you want to act on errors programmatically.

## Common pairings worth knowing

Typical NSF XML workflows:

- **Backup / version-control of NSF design**: `DXLExporter` → file, then track in git.
- **Deploying DXL into NSFs**: `DXLImporter` ← from a trusted source, with ACL pre-verified.
- **Parsing third-party XML**: `DOMParser` (< 10 MB) or `SAXParser` (larger).
- **DXL → another XML dialect**: `DXLExporter` → DXL → `XSLTransformer` with an XSLT → target format.

## Summary

`NotesXMLProcessor` itself is unusable — the value is in the contract it defines: every derived class shares the same SetInput / SetOutput / Process triplet and the same Log mechanism. In real code, the work is just picking the right derived class and wiring up the I/O.
