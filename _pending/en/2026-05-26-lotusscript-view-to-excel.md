---
title: "Exporting NotesView Data to Excel from LotusScript: Four Paths, CSV by Default, When to Reach for POI"
description: "'Export this view to Excel for the user' is one of the most common asks in Domino dev. Four paths — CSV via NotesStream (recommended default), HTML-as-xls (legacy formatting trick), OLE Excel.Application (client-only ad-hoc), Apache POI via Java agent (production-grade .xlsx) — each with its sweet spot. This article walks the trade-off table, a complete CSV implementation (with UTF-8 BOM, CSV escaping, and NotesViewNavigator 5-10x speedup), when to use HTML-as-xls / OLE / POI, the web-download pattern, and the three traps most people forget (missing BOM, wrong escape rules, using GetFirstDocument instead of ViewNavigator)."
pubDate: 2026-05-26T07:30:00+08:00
lang: en
slug: lotusscript-view-to-excel
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesStream class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "NotesViewNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesView class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
  - title: "Apache POI — Java library for Office formats"
    url: "https://poi.apache.org/"
  - title: "RFC 4180 — Common Format for CSV Files"
    url: "https://datatracker.ietf.org/doc/html/rfc4180"
relatedJava: []
relatedSsjs: []
cover: "/covers/lotusscript-view-to-excel.png"
coverStyle: "bw-grain"
---

## TL;DR

- "NotesView → Excel" has **four paths**: CSV / HTML-as-xls / OLE Excel / POI Java
- For 90% of cases, **default to CSV via [NotesStream](/en/posts/notes-stream/)**: cross-platform, no Excel dependency, runs in server agents / Linux Domino without issue
- **UTF-8 BOM is mandatory** (`EF BB BF`) — without it Excel reads the file in the system codepage and Chinese / other non-ASCII content turns into garbage
- **For large views, [`NotesViewNavigator`](/en/posts/notes-view-navigator/) is 5-10× faster than per-document `GetFirstDocument` iteration** — the former reads the view index, the latter deserializes whole documents
- **CSV escaping**: fields containing `,` / `"` / `\r\n` must be wrapped in double quotes, with internal `"` doubled to `""` ([RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180))
- For real .xlsx + formatting → Apache POI in a Java agent; client-only ad-hoc → OLE; want cell colors without POI → HTML-as-xls

---

## Four-path trade-off

| Path | Mechanism | Runs where | Good for | Not for |
|---|---|---|---|---|
| **1. CSV (recommended default)** | NotesStream writes .csv, Excel opens it natively | Anywhere (LS only) | Pure data dumps, scheduled reports, large volumes | Formatting / multiple sheets / formulas |
| **2. HTML-as-xls** | Write `<table>` HTML with .xls extension | Anywhere with LS | Simple cell colors / borders, one-off reports | Excel pops a "not really .xls" warning; Microsoft has deprecated this |
| **3. OLE Excel.Application** | `CreateObject("Excel.Application")` drives Excel directly | **Windows + Excel installed only** | Desktop ad-hoc scripts, pivot tables / charts | Server agents (Linux Domino, server with no Excel) |
| **4. Apache POI via Java agent** | Java agent uses POI to write real .xlsx, LS calls via LS2J | Server-side, production | Real .xlsx, formatting, large data, Linux Domino | Extra dependency, Java agent learning curve |

In practice CSV handles 90% of needs — only "needs formatting" / "needs real .xlsx" warrants upgrading to POI.

---

## Default path — CSV via NotesStream

Complete, runnable [NotesView](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) export function:

```lotusscript
Sub ExportViewToCSV(view As NotesView, outputPath As String)
    Dim session As New NotesSession
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Call stream.Open(outputPath, "UTF-8")
    Call stream.Truncate

    ' --- 1. UTF-8 BOM — without this Excel mangles non-ASCII ---
    Call stream.WriteByte(239)  ' EF
    Call stream.WriteByte(187)  ' BB
    Call stream.WriteByte(191)  ' BF

    ' --- 2. Header row (auto from view columns) ---
    Dim cols As Variant
    cols = view.Columns
    Dim headerLine As String
    ForAll c In cols
        headerLine = headerLine & CsvEscape(c.Title) & ","
    End ForAll
    Call stream.WriteText(Left$(headerLine, Len(headerLine) - 1) & Chr(13) & Chr(10))

    ' --- 3. Data rows — NotesViewNavigator is 5-10x faster than GetFirstDocument ---
    Dim nav As NotesViewNavigator
    Set nav = view.CreateViewNav()
    Dim entry As NotesViewEntry
    Set entry = nav.GetFirst()
    Do Until entry Is Nothing
        Dim line As String
        line = ""
        ForAll v In entry.ColumnValues
            line = line & CsvEscape(CStr(v)) & ","
        End ForAll
        Call stream.WriteText(Left$(line, Len(line) - 1) & Chr(13) & Chr(10))
        Set entry = nav.GetNext(entry)
    Loop

    Call stream.Close
End Sub

Function CsvEscape(s As String) As String
    ' RFC 4180: wrap in double quotes if field contains , " \r \n; escape internal " as ""
    If InStr(s, ",") > 0 Or InStr(s, """") > 0 _
       Or InStr(s, Chr(13)) > 0 Or InStr(s, Chr(10)) > 0 Then
        CsvEscape = """" & Replace(s, """", """""") & """"
    Else
        CsvEscape = s
    End If
End Function
```

Usage:

```lotusscript
Dim view As NotesView
Set view = db.GetView("ByDate")
Call ExportViewToCSV(view, "C:\temp\report.csv")
```

A 50K-row view runs in about 5-15 seconds on a mid-range server.

---

## Three things most people forget

### 1. The UTF-8 BOM is mandatory

Without the BOM, Excel reads the file in the OS codepage (often Big5 on Windows Chinese editions, CP1252 elsewhere). UTF-8 Chinese text interpreted as Big5 = garbage. **Three bytes (`EF BB BF`) at the start fixes it.**

Don't use `stream.WriteText("﻿")` — that might get encoded as the three UTF-8 bytes correctly, but it might also get treated as content rather than a BOM marker. Direct `WriteByte` is most reliable.

### 2. CSV escape rules — RFC 4180

Fields containing **commas, double quotes, or newline characters** need to be wrapped in double quotes, and internal double quotes need to be doubled:

```
Hello, World      → "Hello, World"
She said "hi"     → "She said ""hi"""
Line1\nLine2      → "Line1\nLine2"
Plain text        → Plain text (no wrapping needed)
```

Forget to wrap and Excel ends up with shifted columns.

### 3. Large views REQUIRE NotesViewNavigator

The performance gap between the two iteration styles is huge:

```lotusscript
' ❌ Slow — deserializes the full document (with all items) per row
Dim doc As NotesDocument
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    Print doc.GetItemValue("FieldA")(0)  ' only reading one field, but LS loaded the whole doc
    Set doc = view.GetNextDocument(doc)
Loop

' ✅ Fast — only reads the ColumnValues from the view index
Dim nav As NotesViewNavigator
Set nav = view.CreateViewNav()
Dim entry As NotesViewEntry
Set entry = nav.GetFirst()
Do Until entry Is Nothing
    Print entry.ColumnValues(0)  ' direct from the view index, no doc load
    Set entry = nav.GetNext(entry)
Loop
```

The gap: [the `NotesViewNavigator` article](/en/posts/notes-view-navigator/) measured **5-10×** on 50K rows.

The one exception: if you need fields that **aren't in the view columns**, you have to fall back to `doc = entry.Document` and pay the per-doc deserialization cost anyway. So designing your view to include all export fields as columns up front is the highest-impact optimization.

---

## Path 2: HTML-as-xls — cell colors without POI

Write HTML `<table>`, save with `.xls` extension, Excel opens it through its HTML viewer:

```lotusscript
Sub ExportViewAsHtmlXls(view As NotesView, outputPath As String)
    Dim session As New NotesSession
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Call stream.Open(outputPath, "UTF-8")
    Call stream.Truncate

    ' UTF-8 BOM
    Call stream.WriteByte(239)
    Call stream.WriteByte(187)
    Call stream.WriteByte(191)

    Call stream.WriteText("<html><head><meta charset='UTF-8'></head><body><table border='1'>")

    ' Header (with background color)
    Call stream.WriteText("<tr style='background:#cce5ff;font-weight:bold'>")
    ForAll c In view.Columns
        Call stream.WriteText("<th>" & c.Title & "</th>")
    End ForAll
    Call stream.WriteText("</tr>")

    ' Data
    Dim nav As NotesViewNavigator
    Set nav = view.CreateViewNav()
    Dim entry As NotesViewEntry
    Set entry = nav.GetFirst()
    Do Until entry Is Nothing
        Call stream.WriteText("<tr>")
        ForAll v In entry.ColumnValues
            Call stream.WriteText("<td>" & CStr(v) & "</td>")
        End ForAll
        Call stream.WriteText("</tr>")
        Set entry = nav.GetNext(entry)
    Loop

    Call stream.WriteText("</table></body></html>")
    Call stream.Close
End Sub
```

**Things to watch out for**:

- Excel will pop a "the file extension doesn't match content" warning on open — clicking Yes works fine, but it spooks first-time users
- HTML-special characters (`<`, `>`, `&`) inside cells need to be escaped to `&lt;`, `&gt;`, `&amp;`, otherwise they get parsed as HTML tags
- This isn't real .xlsx — on save, Excel asks if you want to convert to .xlsx to preserve formatting
- Microsoft deprecated this path back in Office 2007; not recommended long-term

Use case: **internal use, one-off, needs simple formatting**. Don't put it in production.

---

## Path 3: OLE Excel.Application — Windows desktop only

`CreateObject("Excel.Application")` drives Excel directly. Full functionality, but **Excel must be installed on the machine running the agent**:

```lotusscript
Sub ExportViewViaOLE(view As NotesView, outputPath As String)
    Dim xlApp As Variant
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False

    Dim wb As Variant
    Set wb = xlApp.Workbooks.Add
    Dim ws As Variant
    Set ws = wb.ActiveSheet

    ' Header
    Dim colIdx As Integer
    colIdx = 1
    ForAll c In view.Columns
        ws.Cells(1, colIdx).Value = c.Title
        ws.Cells(1, colIdx).Font.Bold = True
        colIdx = colIdx + 1
    End ForAll

    ' Data
    Dim rowIdx As Integer
    rowIdx = 2
    Dim nav As NotesViewNavigator
    Set nav = view.CreateViewNav()
    Dim entry As NotesViewEntry
    Set entry = nav.GetFirst()
    Do Until entry Is Nothing
        colIdx = 1
        ForAll v In entry.ColumnValues
            ws.Cells(rowIdx, colIdx).Value = v
            colIdx = colIdx + 1
        End ForAll
        rowIdx = rowIdx + 1
        Set entry = nav.GetNext(entry)
    Loop

    ' Save as .xlsx (51 = xlOpenXMLWorkbook constant)
    Call wb.SaveAs(outputPath, 51)
    Call wb.Close()
    Call xlApp.Quit()
    Set xlApp = Nothing
End Sub
```

**Fits / doesn't fit**:

- ✅ Desktop client agents, user machines with Excel installed, pivot tables / charts / complex formulas needed
- ❌ Server agents (Linux Domino doesn't have Excel; Windows servers usually don't either)
- ❌ High-frequency or high-volume — OLE call overhead is high, 10K rows can take 30+ seconds
- ❌ Excel process leak risk — if `xlApp.Quit()` doesn't run (e.g. exception thrown), the process stays alive in Task Manager

---

## Path 4: Apache POI via Java agent — production-grade .xlsx

For real .xlsx output and production-grade stability: **Java agent + [Apache POI](https://poi.apache.org/)**.

LS side calls a Java agent via LS2J, or just runs it as a separate Java agent. The Java side uses POI's `XSSFWorkbook` / `SXSSFWorkbook` (the former loads everything in memory, the latter streams writes — better for large data):

```java
// Java agent — concept sketch; real impl wires NotesView traversal + POI workbook writes
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.ss.usermodel.*;

public void NotesMain() {
    SXSSFWorkbook wb = new SXSSFWorkbook(100);  // keep 100 rows in memory
    Sheet sheet = wb.createSheet("Export");
    
    // Pull entries from NotesView, push into sheet.createRow(...).createCell(...).setCellValue(...)
    // Full implementation: see the POI quick guide
    
    wb.write(new FileOutputStream("output.xlsx"));
    wb.close();
}
```

**Why this fits production**:

- Real .xlsx — Excel opens without warnings; formatting / formulas / multiple sheets all preserved
- Cross-platform — runs on Linux Domino too
- Large-data friendly — `SXSSFWorkbook` streams writes, doesn't blow memory
- Mature community, bugs get fixed quickly

**Cost of entry**:

- POI .jar needs to be uploaded into the Domino agent's jar resources
- Java agent talking to LS via LS2J or run-agent mode — debugging is harder than pure LS
- LS-primarily teams pick up another language

In practice, production-grade reports converge on this path — painful setup once, reusable forever.

---

## Bonus: web download pattern

Trigger a download from a web app — write a REST-style agent, stream CSV to the response, add a `Content-Disposition` header to make the browser save it:

```lotusscript
' Web Query Open agent — print straight to the response
Print "Content-Type: text/csv; charset=UTF-8"
Print "Content-Disposition: attachment; filename=""report.csv"""
Print ""  ' blank line between headers and body

Print Chr(239) & Chr(187) & Chr(191)  ' UTF-8 BOM
Print "Name,Date,Amount"

' ...loop through CSV rows, Print them...
```

Hit `https://yourserver/yourdb.nsf/yourview?OpenAgent` and the browser triggers a `report.csv` download — user double-clicks to open in Excel.

---

## Quick selection table

| Your need | Pick |
|---|---|
| Plain data, scheduled, cross-platform | **CSV via NotesStream** |
| Simple cell colors, internal use, one-off | HTML-as-xls |
| Desktop ad-hoc, Excel installed, pivot/chart needed | OLE Excel.Application |
| Real .xlsx, production-grade, formatting / multi-sheet | Apache POI Java agent |
| Web-triggered, browser download | REST agent + CSV + Content-Disposition |

90% of cases CSV solves it. Start with CSV, escalate to POI only when you hit "needs formatting" — don't reach for OLE / POI on day one.

---

## What about Java and SSJS?

| Language | Equivalent |
|---|---|
| LotusScript | NotesStream writing CSV, or OLE Excel.Application |
| Java | Apache POI (`XSSFWorkbook` / `SXSSFWorkbook`) — industry standard, production .xlsx routes through here |
| SSJS / XPages | Use [POI](https://poi.apache.org/) or ExtLib's ExcelReader / ExcelWriter, or push xlsx generation to the frontend (SheetJS) — no server load |

For SSJS in particular, a modern pattern is to skip server-side xlsx generation entirely: the server REST endpoint returns JSON, and the browser uses SheetJS to generate the xlsx client-side and trigger the download. CPU lands on the client, server stays lean. Domino REST API since 14.5 produces clean JSON responses that play well with this pattern.
