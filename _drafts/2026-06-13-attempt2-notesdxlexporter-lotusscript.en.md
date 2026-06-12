---
title: "Exporting DXL with NotesDXLExporter: A LotusScript Tutorial"
description: "This tutorial introduces how to use the NotesDXLExporter class in LotusScript to export HCL Domino database content to DXL (Domino XML) format, with practical examples."
pubDate: "2026-06-13T07:38:49+08:00"
lang: "en"
slug: "notesdxlexporter-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDXLExporter (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
  - title: "Example: NotesDXLExporter class"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_EXAMPLES_NOTESDXLEXPORTER_CLASS.html"
  - title: "Using XML with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_USING_XML_WITH_LOTUSSCRIPT_METHODS_XML.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdxlexporter-lotusscript
-->

## Introduction

In HCL Domino development, DXL (Domino XML) is a format used to represent Domino data in XML. DXL allows developers to export and import Domino data in a standardized way, facilitating data exchange and backup.

LotusScript provides the `NotesDXLExporter` class, enabling developers to export Domino databases, documents, or document collections to DXL format. This article introduces how to use `NotesDXLExporter` for DXL export, with practical examples.

## Overview of `NotesDXLExporter` Class

The `NotesDXLExporter` class represents the process of converting Domino data to DXL. It inherits from `NotesXMLProcessor` and includes multiple properties and methods that allow developers to control the export behavior.

### Key Properties

- `AttachmentOmittedText`: Specifies the replacement text when attachments are omitted during export.
- `ConvertNotesBitmapsToGIF`: Indicates whether to convert Notes bitmaps to GIF format.
- `DoctypeSYSTEM`: Sets the DOCTYPE SYSTEM attribute of the DXL document.
- `ForceNoteFormat`: Indicates whether to force the use of Note format during export.
- `Log`: Returns the log of the export process.
- `MIMEOption`: Controls how MIME data is exported.
- `RichTextOption`: Controls how rich text is exported.

### Key Methods

- `SetInput`: Sets the Domino data to be exported.
- `SetOutput`: Sets the output target for the exported DXL data.
- `Process`: Initiates the export process.
- `Export`: Converts the specified Domino data to a DXL string.

## Example Usage

The following example demonstrates how to use `NotesDXLExporter` to export the current database to a DXL file.

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase

  ' Open an XML file named after the current database
  Dim stream As NotesStream
  Set stream = session.CreateStream
  filename$ = "c:\dxl\" & Left(db.FileName, Len(db.FileName) - 3) & "dxl"
  If Not stream.Open(filename$) Then
    Messagebox "Cannot open " & filename$,, "Error"
    Exit Sub
  End If
  Call stream.Truncate

  ' Export the current database as DXL
  Dim exporter As NotesDXLExporter
  Set exporter = session.CreateDXLExporter
  Call exporter.SetInput(db)
  Call exporter.SetOutput(stream)
  Call exporter.Process
End Sub
```

In this example, we first obtain the current database, then create a `NotesStream` object to save the exported DXL data. Next, we create a `NotesDXLExporter` object, set the input to the current database, the output to our created stream, and finally call the `Process` method to perform the export.

## Considerations

- Ensure that the output target (e.g., file path) is writable and has sufficient space to store the exported DXL data before exporting.
- When exporting data containing large attachments or rich text, you may need to adjust related properties, such as `OmitRichtextAttachments` or `OmitRichtextPictures`, to control the exported content.
- The exported DXL data can be used for backup, data exchange, or other scenarios requiring Domino data in XML format.

## Conclusion

The `NotesDXLExporter` class provides a convenient way to export Domino data to DXL format. By appropriately setting properties and calling methods, developers can flexibly control the export behavior to meet different needs. For more detailed information, refer to [NotesDXLExporter (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html) and [Using XML with LotusScript](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_USING_XML_WITH_LOTUSSCRIPT_METHODS_XML.html).
