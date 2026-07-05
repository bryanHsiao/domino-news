---
title: "Implementing XML Processing with NotesXMLProcessor"
description: "This guide provides a detailed walkthrough on using the NotesXMLProcessor class in LotusScript to parse and process XML data, covering both DOM and SAX parsers."
pubDate: "2026-07-05T08:03:49+08:00"
lang: "en"
slug: "notes-xml-processor"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesXMLProcessor class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html"
  - title: "NotesDOMParser class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html"
  - title: "NotesSAXParser class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXPARSER_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-xml-processor" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-xml-processor
-->

## Introduction

In HCL Domino development, handling XML data is a common requirement. LotusScript offers the `NotesXMLProcessor` class, enabling developers to parse and process XML data using either the DOM (Document Object Model) or SAX (Simple API for XML) methods. This article provides a comprehensive guide on utilizing `NotesXMLProcessor` in LotusScript for XML processing.

## What is NotesXMLProcessor?

`NotesXMLProcessor` is a LotusScript class that facilitates the parsing and processing of XML data. It supports two primary parsing methods:

- **DOM Parser**: Loads the entire XML document into memory, creating a tree structure that can be navigated and manipulated.
- **SAX Parser**: Reads the XML document sequentially, triggering events for processing, suitable for handling large XML files.

## Parsing XML with the DOM Parser

To parse XML using the DOM parser, follow these steps:

1. **Create an Instance of NotesDOMParser**:

   ```lotusscript
   Dim session As New NotesSession
   Dim domParser As NotesDOMParser
   Set domParser = session.CreateDOMParser()
   ```

2. **Set the Input for the Parser**:

   ```lotusscript
   Call domParser.SetInputFile("C:\path\to\your\file.xml")
   ```

3. **Parse the XML Document**:

   ```lotusscript
   Call domParser.Parse
   ```

4. **Access the DOM Tree**:

   ```lotusscript
   Dim docNode As NotesDOMDocumentNode
   Set docNode = domParser.Document
   ```

5. **Traverse the DOM Tree**:

   ```lotusscript
   Dim rootElement As NotesDOMElementNode
   Set rootElement = docNode.DocumentElement
   ' Add code here to traverse and process nodes
   ```

## Parsing XML with the SAX Parser

To parse XML using the SAX parser, follow these steps:

1. **Create an Instance of NotesSAXParser**:

   ```lotusscript
   Dim session As New NotesSession
   Dim saxParser As NotesSAXParser
   Set saxParser = session.CreateSAXParser()
   ```

2. **Set the Input for the Parser**:

   ```lotusscript
   Call saxParser.SetInputFile("C:\path\to\your\file.xml")
   ```

3. **Set the Event Handler**:

   ```lotusscript
   Dim handler As New SAXHandler
   Set saxParser.ContentHandler = handler
   ```

4. **Parse the XML Document**:

   ```lotusscript
   Call saxParser.Parse
   ```

5. **Implement the Event Handler**:

   ```lotusscript
   Class SAXHandler
   Public Sub StartElement(uri As String, localName As String, qName As String, attributes As NotesSAXAttributeList)
       ' Add code here to handle start of element
   End Sub

   Public Sub EndElement(uri As String, localName As String, qName As String)
       ' Add code here to handle end of element
   End Sub

   Public Sub Characters(chars As String)
       ' Add code here to handle character data
   End Sub
   End Class
   ```

## Conclusion

The `NotesXMLProcessor` class provides robust functionality for parsing and processing XML data within LotusScript. Depending on your specific requirements, you can choose between the DOM and SAX parsers to handle XML documents effectively. For more detailed information, refer to the official documentation for [NotesXMLProcessor class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html) and [NotesDOMParser class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html).
