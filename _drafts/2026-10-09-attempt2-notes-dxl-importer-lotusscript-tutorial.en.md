---
title: "LotusScript Tutorial: Importing DXL Using NotesDXLImporter"
description: "This tutorial guides you through using the NotesDXLImporter class in LotusScript to import DXL (Domino XML) data into an HCL Domino database."
pubDate: "2026-10-09T10:50:33+08:00"
lang: "en"
slug: "notes-dxl-importer-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDXLImporter class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
  - title: "NotesDXLExporter class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
  - title: "ImportDxl method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IMPORTDXL_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-dxl-importer-lotusscript-tutorial
-->

## Introduction

HCL Domino's DXL (Domino XML) provides a way to represent Domino database content in XML format. With DXL, developers can export and import database design elements and documents, facilitating data backup, transfer, and synchronization. In LotusScript, the `NotesDXLImporter` class is used to import DXL data into a Domino database.

## Prerequisites

- Familiarity with LotusScript programming.
- Basic knowledge of HCL Domino Designer.
- Understanding of the DXL format.

## Step 1: Create a DXL File

First, you need a DXL file containing the data to be imported. This file can be exported from an existing Domino database or created manually. Below is a simple DXL document example containing a form and a document:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dxl>
  <database>
    <form name="TestForm">
      <field name="Subject" type="text"/>
      <field name="Body" type="richtext"/>
    </form>
    <document form="TestForm">
      <item name="Subject">
        <text>Test Subject</text>
      </item>
      <item name="Body">
        <text>This is the test content.</text>
      </item>
    </document>
  </database>
</dxl>
```

## Step 2: Use NotesDXLImporter in LotusScript

In Domino Designer, create a new agent and add the following LotusScript code:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim importer As NotesDXLImporter
    Dim stream As NotesStream
    
    ' Get the current database
    Set db = session.CurrentDatabase
    
    ' Initialize DXLImporter
    Set importer = session.CreateDXLImporter
    Set stream = session.CreateStream
    
    ' Open the DXL file
    If Not stream.Open("C:\path\to\your\file.dxl") Then
        MsgBox "Unable to open DXL file."
        Exit Sub
    End If
    
    ' Set import options
    importer.ReplaceDesign = True
    importer.DocumentImportOption = DXLIMPORTOPTION_CREATE
    
    ' Perform the import
    Call importer.Import(stream, db)
    
    ' Close the stream
    Call stream.Close
    
    MsgBox "DXL import completed."
End Sub
```

### Code Explanation

1. **Initialize Objects**:
   - `session`: The current `NotesSession`.
   - `db`: The current `NotesDatabase`.
   - `importer`: The `NotesDXLImporter` object used to perform the DXL import.
   - `stream`: The `NotesStream` object used to read the DXL file.

2. **Open the DXL File**:
   - Use the `stream.Open` method to open the DXL file at the specified path.

3. **Set Import Options**:
   - `ReplaceDesign`: Set to `True` to replace existing design elements if they exist.
   - `DocumentImportOption`: Set to `DXLIMPORTOPTION_CREATE` to create new documents.

4. **Perform the Import**:
   - Use the `importer.Import` method to import the DXL data into the database.

5. **Close the Stream**:
   - Use the `stream.Close` method to close the stream.

## Considerations

- Ensure the DXL file path is correct and the file is readable.
- Before performing the import, it's advisable to back up the target database to prevent accidental data loss.
- Adjust import options such as `ReplaceDesign` and `DocumentImportOption` as needed to suit different import requirements.

## Conclusion

By using the `NotesDXLImporter` class, you can efficiently import DXL data into HCL Domino databases using LotusScript. This provides a flexible and powerful solution for data backup, transfer, and synchronization. For more detailed information, refer to the [NotesDXLImporter class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html) and [ImportDxl method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IMPORTDXL_METHOD.html).
