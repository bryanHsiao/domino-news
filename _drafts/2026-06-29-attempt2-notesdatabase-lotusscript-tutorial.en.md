---
title: "NotesDatabase: A Guide to Database Operations in LotusScript"
description: "Explore how to use the NotesDatabase class in LotusScript to access and manipulate HCL Domino databases, including creating, opening, querying, and managing documents with practical examples."
pubDate: "2026-06-29T07:29:00+08:00"
lang: "en"
slug: "notesdatabase-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDatabase (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Examples: NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html"
  - title: "CreateDocument (NotesDatabase - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_CREATEDOCUMENT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — 1 critical fact issue(s)
attempt: 2
slug: notesdatabase-lotusscript-tutorial
topicOverlap: false
issues:
  [critical] Set collection = db.Search("[Subject] CONTAINS 'keyword'", Nothing, 0)
      problem: The query string '[Subject] CONTAINS 'keyword'' is not valid @Formula syntax. NotesDatabase.Search takes an @Formula string, not a full-text or SQL-style query. A correct @Formula would be something like '@Contains(Subject; "keyword")' or '@Like(Subject; "%keyword%")'. The CONTAINS operator shown is FTSearch syntax, not @Formula syntax. Using it in Search() will produce a formula-evaluation error at runtime.
      fix:     Replace the query string with valid @Formula syntax, e.g. db.Search("@Contains(Subject; \"keyword\")", Nothing, 0). Also add a note that FTSearch() should be used if full-text search is intended, and that DQL (db.FTDomainSearch / NotesSession.CreateQueryEngine) is a modern alternative.
  [major] Querying Documents — the article presents Search() as the way to query documents without mentioning alternatives
      problem: The article says 'to query documents within a database, you can use the Search method' as if it is the primary or only approach. NotesDatabase has several well-known retrieval paths: (1) View lookups via NotesView.GetDocumentByKey / GetAllDocumentsByKey, (2) NotesDatabase.FTSearch for full-text indexed databases, (3) DQL via NotesSession.CreateQueryEngine / NotesQueryResultsProcessor (Domino 10+). Omitting these is misleading to a developer choosing a strategy, especially since FTSearch is what the code example is actually trying to demonstrate.
      fix:     Add a short paragraph or bullet list acknowledging the other retrieval methods (view lookups, FTSearch, DQL) and when each is appropriate. At minimum, note that FTSearch exists and is preferable when a full-text index is present.
  [major] Set db = session.GetDatabase("", "names.nsf")
      problem: GetDatabase does not raise an error and does not return Nothing when the database cannot be opened in all cases — the returned NotesDatabase object's IsOpen property may be False rather than the object being Nothing. Checking 'If db Is Nothing' is therefore unreliable; a database that exists but cannot be opened (wrong ACL, not yet opened) will pass the Nothing check yet fail on subsequent calls. The correct guard is to check db.IsOpen after the call.
      fix:     Change the guard to check db.IsOpen: 'If Not db.IsOpen Then ... End If', or call db.Open explicitly and check its Boolean return value. Add a sentence explaining the distinction.
  [major] Set entry = acl.CreateACLEntry("Username", ACLLEVEL_EDITOR) / Call acl.Save
      problem: The example creates an ACL entry but never sets the entry type (NotesACLEntry.UserType). Without setting UserType the entry defaults to ACL_TYPE_UNSPECIFIED, which can cause access problems or unexpected behaviour, especially in hierarchical Domino environments. This is a commonly missed step that will mislead readers.
      fix:     Add 'entry.UserType = ACLTYPE_PERSON' (or the appropriate constant) after CreateACLEntry, and briefly explain the UserType property.
  [minor] References — https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html
      problem: This URL references Domino Designer 10.0.1 documentation while the primary reference targets 14.5.0 and the CreateDocument reference targets 11.0.1. Mixing three different version anchors for what is presented as current documentation looks inconsistent and the older version URLs may not reflect current API behaviour.
      fix:     Normalise all three reference URLs to the same (latest) documentation version, e.g. 14.5.0.
  [minor] Call doc.Save(True, False)
      problem: The two Boolean parameters to NotesDocument.Save are (force, makeResponse). The article does not explain what they mean, leaving readers to guess. 'True' for force means the save proceeds even if another user has modified the document — this is a meaningful choice that should be documented.
      fix:     Add a brief inline comment or sentence explaining the Save parameters: Save(force As Boolean, makeResponse As Boolean, [markRead As Boolean]).
  [minor] Article title and conclusion: 'A Guide to Database Operations'
      problem: The article covers only four narrow operations (open, create document, search, ACL). Titling it 'A Guide to Database Operations' overpromises scope — readers expecting coverage of replication, compaction, design access, or even db.AllDocuments will be disappointed. The NotesDatabase class has dozens of methods and properties not mentioned.
      fix:     Narrow the title and introduction to match what is actually covered, e.g. 'NotesDatabase: Opening Databases, Creating Documents, Querying, and Managing the ACL in LotusScript'.
-->

## Introduction

In HCL Domino development, the `NotesDatabase` class is central to accessing and manipulating databases using LotusScript. This class enables developers to create, open, query, and manage documents within a database. This article provides an overview of how to utilize the `NotesDatabase` class in LotusScript, accompanied by practical examples.

## Creating and Opening a Database

To access an existing database in LotusScript, you can use the `GetDatabase` method of the `NotesSession` class. The following example demonstrates how to open the local `names.nsf` database:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "names.nsf")
If db Is Nothing Then
    MsgBox "Unable to open database"
Else
    MsgBox "Successfully opened database: " & db.Title
End If
```

In this example, the first parameter of the `GetDatabase` method is the server name; an empty string indicates the local environment. The second parameter is the database file name.

## Creating a New Document

You can create a new document in the database using the `CreateDocument` method of the `NotesDatabase` class. The following example shows how to create and save a new document:

```lotusscript
Dim doc As NotesDocument
Set doc = db.CreateDocument
Call doc.ReplaceItemValue("Form", "Memo")
Call doc.ReplaceItemValue("Subject", "New Document Subject")
Call doc.ReplaceItemValue("Body", "This is the content of the new document.")
Call doc.Save(True, False)
MsgBox "New document has been created and saved."
```

In this example, the `ReplaceItemValue` method sets the field values of the document, and the `Save` method saves the document to the database.

## Querying Documents

To query documents within a database, you can use the `Search` method of the `NotesDatabase` class. The following example demonstrates how to search for documents with a subject containing a specific keyword:

```lotusscript
Dim collection As NotesDocumentCollection
Set collection = db.Search("[Subject] CONTAINS 'keyword'", Nothing, 0)
Dim doc As NotesDocument
Set doc = collection.GetFirstDocument
While Not doc Is Nothing
    MsgBox "Found document: " & doc.GetItemValue("Subject")(0)
    Set doc = collection.GetNextDocument(doc)
Wend
```

In this example, the first parameter of the `Search` method is the query syntax, and the `GetFirstDocument` and `GetNextDocument` methods are used to iterate through the search results.

## Managing Database ACL

The `ACL` property of the `NotesDatabase` class allows developers to access and modify the Access Control List (ACL) of the database. The following example demonstrates how to set access permissions for a specific user:

```lotusscript
Dim acl As NotesACL
Set acl = db.ACL
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("Username")
If entry Is Nothing Then
    Set entry = acl.CreateACLEntry("Username", ACLLEVEL_EDITOR)
    Call acl.Save
    MsgBox "Added Editor access for the user."
Else
    MsgBox "User already exists in the ACL."
End If
```

In this example, the `GetEntry` method checks if the user already exists in the ACL, and the `CreateACLEntry` method adds a new ACL entry if necessary.

## Conclusion

The `NotesDatabase` class enables developers to effectively access and manipulate HCL Domino databases using LotusScript. This article covered how to create and open databases, create new documents, query documents, and manage the database's ACL. We hope these examples help you better understand and apply the `NotesDatabase` class.

References:

- [NotesDatabase (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS.html)
- [CreateDocument (NotesDatabase - LotusScript)](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_CREATEDOCUMENT_METHOD.html)
- [Examples: NotesDatabase class](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html)
