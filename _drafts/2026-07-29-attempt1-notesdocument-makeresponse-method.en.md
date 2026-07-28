---
title: "Creating Response Documents Using NotesDocument.MakeResponse Method"
description: "A detailed guide on utilizing the NotesDocument.MakeResponse method in LotusScript to create response documents and its applications in HCL Domino applications."
pubDate: "2026-07-29T07:59:29+08:00"
lang: "en"
slug: "notesdocument-makeresponse-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument class - LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "MakeResponse method - NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html"
  - title: "NotesDocumentCollection class - LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" was already cited by [notes-document-computewithform] on 2026-07-15. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html" was already cited by [notes-document-save-conflict] on 2026-07-27. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: notesdocument-makeresponse-method
-->

In HCL Domino application development, response documents are specialized documents that establish a hierarchical relationship with parent documents. This structure is particularly useful for organizing and managing related data. This article explores how to use the `MakeResponse` method of the `NotesDocument` class in LotusScript to create response documents and discusses its applications.

## Overview of the `MakeResponse` Method

The `MakeResponse` method is part of the `NotesDocument` class and is used to create a new response document linked to an existing parent document. The syntax is as follows:

```lotusscript
Set responseDoc = parentDoc.MakeResponse()
```

Here, `parentDoc` is the existing parent document, and `responseDoc` is the newly created response document.

## Usage Example

The following example demonstrates how to use the `MakeResponse` method to create a response document:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim parentDoc As NotesDocument
Dim responseDoc As NotesDocument

Set db = session.CurrentDatabase
Set parentDoc = db.GetDocumentByUNID("UNID of the parent document")

If Not parentDoc Is Nothing Then
    Set responseDoc = parentDoc.MakeResponse()
    responseDoc.Form = "ResponseForm"
    responseDoc.Subject = "This is a response document"
    Call responseDoc.Save(True, False)
End If
```

In this example, the code first retrieves the current database and then fetches the parent document using its UNID. It then uses the `MakeResponse` method to create a response document, sets its form and subject, and finally saves the response document.

## Important Considerations

- **Hierarchical Relationship**: Response documents created using the `MakeResponse` method automatically establish a hierarchical relationship with the parent document, which can be visually represented in views.

- **Form Assignment**: After creating a response document, it's essential to set its form to ensure it aligns with the application's design requirements.

- **Saving the Document**: After making necessary settings to the response document, remember to call the `Save` method to persist the document.

## Applications

Response documents are particularly useful in scenarios such as:

- **Discussion Threads**: In discussion applications, response documents can represent replies to topics.

- **Workflow Processes**: In workflow applications, response documents can record approvals or comments on specific requests.

By utilizing the `MakeResponse` method, developers can effectively create and manage response documents in HCL Domino applications, facilitating more flexible data organization and presentation.

For more information on the `NotesDocument` class and the `MakeResponse` method, refer to the [NotesDocument class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) and the [MakeResponse method documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html).
