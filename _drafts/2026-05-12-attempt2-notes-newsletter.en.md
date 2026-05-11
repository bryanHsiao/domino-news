---
title: "Creating Newsletters with the NotesNewsletter Class"
description: "This tutorial explains how to use the NotesNewsletter class in HCL Domino to create and send newsletters, covering its properties, methods, and implementation examples."
pubDate: "2026-05-12T07:24:46+08:00"
lang: "en"
slug: "notes-newsletter"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "Java Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "HCL Notes and Domino Application Development wiki: Getting Started: Writing Code to Deal With Multivalued Data"
    url: "https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/Writing_Code_to_Deal_With_Multivalued_Data"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-newsletter
-->

## Introduction

In HCL Domino, the `NotesNewsletter` class allows developers to create newsletters that compile multiple documents into a single email for recipients. This is particularly useful when you need to provide a summary of related documents.

## Overview of the NotesNewsletter Class

The `NotesNewsletter` class provides the following key properties and methods:

- **AddDocument**: Adds a `NotesDocument` to the newsletter.
- **FormatDocument**: Sets the format for an individual document within the newsletter.
- **Send**: Sends the newsletter to specified recipients.

## Steps to Create a Newsletter

Here are the steps to create and send a newsletter using the `NotesNewsletter` class:

1. **Initialize the `NotesNewsletter` Instance**:

   ```lotusscript
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Set db = session.CurrentDatabase
   Dim newsletter As New NotesNewsletter(db)
   ```

2. **Add Documents to the Newsletter**:

   ```lotusscript
   Dim doc As NotesDocument
   Set doc = db.GetDocumentByUNID("<DocumentUNID>")
   Call newsletter.AddDocument(doc)
   ```

3. **Set Document Format** (Optional):

   ```lotusscript
   Call newsletter.FormatDocument(doc, "Title", "Summary", "Link")
   ```

4. **Send the Newsletter**:

   ```lotusscript
   Call newsletter.Send("recipient@example.com")
   ```

## Complete Example

Below is a complete LotusScript example demonstrating how to create and send a newsletter using the `NotesNewsletter` class:

```lotusscript
Sub SendNewsletter()
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Set db = session.CurrentDatabase
   
   Dim newsletter As New NotesNewsletter(db)
   
   ' Add the first document
   Dim doc1 As NotesDocument
   Set doc1 = db.GetDocumentByUNID("<DocumentUNID1>")
   Call newsletter.AddDocument(doc1)
   
   ' Add the second document
   Dim doc2 As NotesDocument
   Set doc2 = db.GetDocumentByUNID("<DocumentUNID2>")
   Call newsletter.AddDocument(doc2)
   
   ' Send the newsletter
   Call newsletter.Send("recipient@example.com")
End Sub
```

## Considerations

- Ensure that the `NotesNewsletter` class is available in your environment and that you have the appropriate permissions to access and send emails.
- When adding documents, verify that the document UNIDs are correct.

By following these steps, you can effectively create and send newsletters containing multiple documents in HCL Domino, facilitating the sharing of related information with recipients.
