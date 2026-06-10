---
title: "Mastering NotesDocument in LotusScript: A Comprehensive Guide"
description: "Explore how to utilize the NotesDocument class in LotusScript to create, read, update, and delete documents within HCL Domino databases."
pubDate: "2026-06-11T07:36:55+08:00"
lang: "en"
slug: "notesdocument-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html"
  - title: "Accessing a document in LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ACCESSING_A_DOCUMENT_STEPS_NOTESDATABASE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 2
slug: notesdocument-lotusscript
topicOverlap: false
issues:
  [critical] Cited source: https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENT_CLASS.html
      problem: The primary API reference link points to Domino Designer 9.0.1 documentation — a version that is over a decade old and long superseded. Linking readers to 9.0.1 docs for a 'comprehensive guide' is actively misleading; API details, property lists, and examples may differ from current 14.x behaviour.
      fix:     Replace with the 14.5.1 equivalent URL, e.g. https://help.hcl-software.com/dom_designer/14.5.1/appdev/H_NOTESDOCUMENT_CLASS.html
  [critical] ## Introduction — 'The NotesDocument class is central to this'... entire article
      problem: The article is extremely thin — it covers only New NotesDocument, GetDocumentByUNID, ReplaceItemValue, Save, and Remove. It omits the vast majority of the NotesDocument API: GetItemValue, GetFirstItem/GetNextItem, AppendItemValue, CopyToDatabase, MakeResponse/IsResponse (response hierarchy), SendTo/Send (mail routing), EmbedObject/Attachments, ComputeWithForm, HasItem/RemoveItem, Sign/Encrypt/Decrypt/IsEncrypted/IsSigned, the UniversalID vs NoteID vs NOTEID distinction, parent database/view context, IsNewNote, IsDeleted, IsProfile, Responses, and the critical SaveOptions/MailOptions/SignOnSend flags. Billing this as a 'Comprehensive Guide' or 'Mastering' piece when it covers perhaps 5% of the class is a serious accuracy/framing problem.
      fix:     Either retitle the article as an introductory primer (e.g. 'NotesDocument Basics: Creating, Reading, Updating, and Deleting') or substantially expand coverage to justify 'Comprehensive' and 'Mastering' in the title.
  [major] ## Accessing an Existing Document — 'retrieve it using its Universal ID (UNID) or NoteID'
      problem: The article mentions NoteID as an access method but provides no code example using GetDocumentByID (NoteID). A reader unfamiliar with the distinction between UNID and NoteID will be confused. More importantly, the article ignores the other primary ways to obtain a NotesDocument: navigating a NotesView (GetFirstDocument/GetNextDocument), AllDocuments collection, FTSearch, db.Search, DQL/NotesQueryResultsProcessor, and GetDocumentByURL — all of which are how documents are obtained in the vast majority of real agents.
      fix:     Either add a brief section covering view-based and search-based document retrieval, or explicitly scope the article to 'direct lookup by UNID/NoteID' and note that other retrieval methods are covered in companion articles.
  [major] ## Deleting a Document — `Call doc.Remove(True)`
      problem: The article does not explain what the Boolean parameter means (True = force delete even if document is not saved; also relevant: soft-delete behaviour when a database has soft-deletes enabled). It also does not mention db.Remove on a NotesDocumentCollection (RemoveAll) as the preferred bulk-delete mechanism, nor the distinction between Remove (permanent) and soft-delete / move-to-trash behaviour controlled by database settings.
      fix:     Explain the force parameter. Add a note about soft-delete databases and point to RemoveAll for bulk operations.
  [major] ## Updating a Document — only ReplaceItemValue shown
      problem: The update section shows only ReplaceItemValue. It omits AppendItemValue (multi-value items), GetFirstItem / NotesItem for typed access (rich text, numbers, date-times), and ComputeWithForm — which is often required when business logic or field validation is embedded in the form. A developer following this guide will produce incomplete documents that bypass all form-level logic.
      fix:     Add a note about ComputeWithForm and at least mention GetFirstItem/NotesItem for retrieving and manipulating typed item values.
  [major] Call doc.Save(True, True)
      problem: The two Boolean parameters to Save (force, makeResponse) are never explained. The second parameter (makeResponse) silently changes the document's relationship in the hierarchy if set incorrectly. Using Save(True, True) as a copy-paste pattern without explanation is dangerous.
      fix:     Document what each parameter means: first = force save even if another user has modified the document; second = makeResponse (create as response document). In most CRUD scenarios Save(True, False) is the correct call.
  [minor] ## Creating a New Document — `Set doc = New NotesDocument(db)`
      problem: The article does not mention that db.CreateDocument is the equally valid and arguably more idiomatic alternative to New NotesDocument(db), and that the new document is not persisted until Save is called — a common beginner trap.
      fix:     Add a one-line note: 'Alternatively use db.CreateDocument. The document is not stored in the database until Save is called.'
  [minor] ## Introduction — 'LotusScript serves as a powerful tool'
      problem: Minor style/franding: 'LotusScript' as a brand name is fine, but the introduction does not mention the alternative agent/script contexts (scheduled agents, web agents, buttons, actions) where NotesDocument is used, giving no orientation to new readers.
      fix:     Add one sentence contextualising where LotusScript NotesDocument code typically runs.
-->

## Introduction

In HCL Domino development, LotusScript serves as a powerful tool, enabling developers to programmatically interact with various elements within a database. The `NotesDocument` class is central to this, representing a single document within a database. Through this class, developers can create, read, update, and delete documents, as well as manipulate their internal items.

## Creating a New Document

To create a new document in the current database, you can use the following code:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)

' Set the document's subject
Call doc.ReplaceItemValue("Subject", "New Document")

' Save the document
Call doc.Save(True, True)
```

In this example, the `ReplaceItemValue` method is used to set or update the value of an item within the document. For more information on the `ReplaceItemValue` method, refer to the [NotesDocument class](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENT_CLASS.html).

## Accessing an Existing Document

To access an existing document, you can retrieve it using its Universal ID (UNID) or NoteID:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' Operate on the document
End If
```

For more details on accessing documents, see [Accessing a document in LotusScript](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ACCESSING_A_DOCUMENT_STEPS_NOTESDATABASE_CLASS.html).

## Updating a Document

To update an existing document's item value, use the `ReplaceItemValue` method:

```lotusscript
Call doc.ReplaceItemValue("Status", "Completed")
Call doc.Save(True, True)
```

## Deleting a Document

To delete a document, use the `Remove` method:

```lotusscript
Call doc.Remove(True)
```

## Conclusion

The `NotesDocument` class offers a rich set of methods and properties, allowing developers to programmatically manage documents within HCL Domino databases. By mastering these methods, developers can effectively handle and manipulate database content. For additional examples and detailed information, refer to the [Examples: NotesDocument class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html).
