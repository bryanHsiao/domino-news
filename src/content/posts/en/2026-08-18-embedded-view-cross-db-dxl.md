---
title: "A Cross-DB Embedded View Won't Start in the Test Region? It's the Replica ID Baked into the DXL"
description: "A cross-database embedded view on a form worked fine in dev, then showed 'cannot start' the moment it reached the customer's test region. Nowhere in Designer's embedded-view UI is there a field to change the source database. Export the form to DXL and the reason shows up: the embeddedview element pins its source by the source database's replica ID — change environments and that ID no longer resolves. This is a field report: how to diagnose it, how to swap it in bulk with a NotesDXLExporter/Importer agent, and the faster way I found afterward — editing the DXL directly in Designer."
pubDate: 2026-08-18T07:30:00+08:00
lang: en
slug: embedded-view-cross-db-dxl
tags:
  - "LotusScript"
  - "Tutorial"
  - "Domino Designer"
  - "DevOps"
sources:
  - title: "embeddedview element (Domino DTD) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EMBEDDEDVIEW_ELEMENT_XML.html"
  - title: "NotesDXLImporter class — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
  - title: "NotesDXLExporter class — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
relatedJava: ["DxlExporter", "DxlImporter"]
relatedSsjs: ["DxlExporter", "DxlImporter"]
---

A form carried a **cross-database embedded view** — the data it shows lives in another database. It ran fine in dev, then got packaged for the customer's test region, and the first time someone opened the form, the embedded view was just a line reading "**VDataRetentionMgmtLog cannot start**," with "to try again, click this rectangle or press the space bar" underneath.

I went through Designer's "embedded view" properties panel top to bottom: name, target frame, display format (using Java Applet)… and **there's no field anywhere to set or change the source database**. So where is the source DB recorded? This is the field report from that day.

---

## TL;DR

- **An embedded view pins its source database by *replica ID*, baked into the form's DXL** — not a path, not a UNID. The official DTD says the `embeddedview` element's `database` attribute is "the database's replica ID."
- **Change environments and it breaks:** the same-named source DB in the test region is a different copy with a different replica ID; the embedded view still holds the old ID, can't resolve it, and the Java-applet version shows "cannot start."
- **Designer's UI has nowhere to change it** — you have to go through the DXL.
- **Fix A (automatable):** an agent that uses `NotesDXLExporter` to export the form → swaps the `database` attribute's value → `NotesDXLImporter` re-imports with `REPLACE_ELSE_IGNORE`.
- **Fix B (fastest for one element):** right-click the design element → **Edit With DXL**, change the attribute, save, and Designer re-imports it. I took A the long way before finding B.

---

## At the scene: the source DB isn't in the UI

An embedded view's properties panel doesn't offer much: a name, a target frame (single-click / double-click), and a "display" format — here it was **Java Applet**. And that "cannot start, press space to retry" line is exactly what the **Java-applet embedded view** shows when it fails to launch.

The problem: which database does the applet pull that view from? The panel never says. The source-DB information has to live somewhere else — in the form's design itself.

## Diagnosis: export the form to DXL

To see design the UI hides, the most direct route is to export the design element to [DXL](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html) (Domino's XML representation). Export this form, and there in the design XML is the embedded view:

```xml
<embeddedview name='VDataRetentionMgmtLog'
    widthtype='fitwindow' width='90%' height='2in'
    database='48258DCC002E9502'>
  <code event='showsinglecategory'><formula>@Text(@DocumentUniqueID)</formula></code>
</embeddedview>
```

`database='48258DCC002E9502'` — there's the answer. Compare it against the source DB's properties panel: its **replica ID** is `48258DCC:002E9502`; apart from the colon the UI adds, they're identical. The [official DTD](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EMBEDDEDVIEW_ELEMENT_XML.html) defines the attribute plainly:

> Database containing the view being embedded. Can be the database's replica ID or one of the keywords defined in the %named.element.link.databases; entity…

So **an embedded view identifies its source database by replica ID.** That's why it broke on a change of environment: the dev source DB and the test source DB, despite identical names and design, are **not replicas of each other** — they're separately made copies, each with its own replica ID. (Two databases that genuinely *are* replicas share a replica ID; the trouble is that these aren't.) The form's DXL still names the dev ID, the test region has no database with that replica ID, and the Java applet fails to start.

## Fix A: an agent that swaps the replica ID in the DXL

Since the source ID sits in the DXL, export the form, replace that `database` value with the test region's source replica ID, and import it back over the original. `NotesDXLExporter` and [`NotesDXLImporter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html) do it end to end:

```lotusscript
Const TARGET_FORM_NAME = "embeddedview_TEST"
Const EMBEDDED_VIEW_NAME = "VDataRetentionMgmtLog"
Const TARGET_DB_PATH = "TestBryan/SampleCode.nsf"

Sub Initialize
    Dim s As New NotesSession
    Dim db As NotesDatabase
    Dim targetDb As NotesDatabase
    Dim form As NotesForm
    Dim nc As NotesNoteCollection
    Dim exporter As NotesDXLExporter
    Dim importer As NotesDXLImporter
    Dim dxl As String, newDxl As String, replicaId As String

    Set db = s.CurrentDatabase

    ' 1. Open the test region's source DB, take its replica ID
    Set targetDb = s.GetDatabase(db.Server, TARGET_DB_PATH, False)
    replicaId = targetDb.ReplicaID          ' 16 hex chars, no colon — the DXL format exactly

    ' 2. Put the form to modify into a NoteCollection
    Set form = db.GetForm(TARGET_FORM_NAME)
    Set nc = db.CreateNoteCollection(False)
    Call nc.Add(form)

    ' 3. Export the form's DXL
    Set exporter = s.CreateDXLExporter
    dxl = exporter.Export(nc)

    ' 4. Swap only that embedded view's database attribute value
    newDxl = ReplaceEmbeddedViewDatabase(dxl, EMBEDDED_VIEW_NAME, replicaId)
    If newDxl = "" Then
        MessageBox "Embedded view not found: " & EMBEDDED_VIEW_NAME, 16, "Failed"
        Exit Sub
    End If

    ' 5. Import back over the current database
    Set importer = s.CreateDXLImporter
    importer.DesignImportOption = DXLIMPORTOPTION_REPLACE_ELSE_IGNORE
    Call importer.Import(newDxl, db)
End Sub
```

Step 5's `DXLIMPORTOPTION_REPLACE_ELSE_IGNORE` is the key: the docs say `DesignImportOption` decides whether incoming design elements are created, ignored, or replaced, and this option means "replace one that already exists, ignore it otherwise" — exactly what "update an existing form" wants, with no risk of creating a duplicate design.

The actual surgery is in `ReplaceEmbeddedViewDatabase`. It uses **no regex and no XML parser** — just string boundaries, step by step: find `<embeddedview`, bound it to its `>`, confirm the tag contains the `name=` we want, then find `database=` **within that tag**, grab the quote, and replace the value between the quotes:

```lotusscript
Function ReplaceEmbeddedViewDatabase(dxl As String, viewName As String, _
    replicaId As String) As String

    Dim tagStart As Long, tagEnd As Long, dbPos As Long
    Dim valueStart As Long, valueEnd As Long
    Dim tagText As String, quoteChar As String, pos As Long
    Dim searchName1 As String, searchName2 As String

    ReplaceEmbeddedViewDatabase = ""
    ' recognize both single- and double-quote spellings
    searchName1 = "name='" & viewName & "'"
    searchName2 = |name="| & viewName & |"|

    pos = 1
    Do
        tagStart = InStr(pos, dxl, "<embeddedview")
        If tagStart = 0 Then Exit Do
        tagEnd = InStr(tagStart, dxl, ">")
        If tagEnd = 0 Then Exit Do
        tagText = Mid$(dxl, tagStart, tagEnd - tagStart + 1)

        ' is this the embedded view we want?
        If InStr(tagText, searchName1) > 0 Or InStr(tagText, searchName2) > 0 Then
            dbPos = InStr(tagStart, dxl, "database=")
            If dbPos = 0 Or dbPos > tagEnd Then Exit Function   ' database= not inside this tag

            valueStart = dbPos + Len("database=")
            quoteChar = Mid$(dxl, valueStart, 1)                ' ' or "
            If quoteChar <> "'" And quoteChar <> |"| Then Exit Function

            valueStart = valueStart + 1
            valueEnd = InStr(valueStart, dxl, quoteChar)
            If valueEnd = 0 Or valueEnd > tagEnd Then Exit Function

            ' replace the old replica ID between the quotes
            ReplaceEmbeddedViewDatabase = _
                Left$(dxl, valueStart - 1) & replicaId & Mid$(dxl, valueEnd)
            Exit Function
        End If
        pos = tagEnd + 1
    Loop
End Function
```

A few deliberate choices look worth it in hindsight: `targetDb.ReplicaID` returns the **colonless** 16-char hex — exactly the format the DXL attribute wants, no conversion; `name=` is matched against both single and double quotes because DXL can use either; and every step guards with `> tagEnd` so the value replaced belongs to **this** `<embeddedview>`'s own `database`, never a string outside the tag.

String-boundary parsing is enough — and simplest — for "swap one attribute value." But a caveat: it's less robust than real XML parsing. The day you need nested elements, escaped characters, or several interleaved attributes, reach for `NotesDOMParser` instead. The site's [DXL round-trip pitfalls](/domino-news/en/posts/dxl-round-trip-pitfalls) piece covers that line. This agent's export/import skeleton is the same one behind the [NotesDXLImporter](/domino-news/en/posts/notes-dxl-importer) and [NotesNoteCollection](/domino-news/en/posts/notes-note-collection) pieces.

## Fix B: you can just "Edit With DXL"

The agent solved it in a few minutes. But after wrapping up I found out — **Designer can edit a design element's DXL directly.**

In Designer's design-element list, right-click the form, and the menu has an **Edit With DXL** item. Click it and Designer opens this element's DXL as plain text for you to edit; find the `database='...'` line, change the replica ID to the test region's, save, and Designer re-imports the edited DXL into the design.

For a one-off change to a single element, this is the fastest route — no code, no agent, just open–edit–save.

## So which one, when?

Both change the same thing (the `database` attribute in the DXL); they differ only in scale and repeatability:

- **Once, one element** → Edit With DXL directly. Fastest.
- **Repeated, in bulk, part of a pipeline** → write the agent. Something like "every time the app ships to a new environment, automatically point every cross-DB embedded view at that environment's source DB" — a repeatable action like that isn't worth clicking through the DXL editor by hand; the agent is the right tool.

I hit A before I stumbled on B, but keeping both is no loss: B for a quick fix, A folded into the delivery script.

## What about Java and SSJS?

DXL export/import isn't a LotusScript monopoly. The Java back-end API has the equivalent `DxlExporter` and `DxlImporter` (`session.createDXLExporter()` / `createDXLImporter()`), and SSJS / XPages call the same set — so this "export the design, edit the DXL, import it back" agent is nearly identical in Java or SSJS. As for the "Edit With DXL" right-click, that's a feature of the Designer tool itself, independent of language.
