---
title: "Working with NotesDatabase in LotusScript: A Comprehensive Guide"
description: "Explore how to utilize the NotesDatabase class in LotusScript to access and manage HCL Domino databases, including examples on creating, opening, copying, and deleting databases."
pubDate: "2026-06-08T07:28:35+08:00"
lang: "en"
slug: "notesdatabase-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDatabase (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Examples: NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html"
  - title: "Accessing Domino databases"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_WAYS_TO_ACCESS_NOTES_DATABASES.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdatabase-lotusscript
-->

## Introduction

In HCL Domino development, the `NotesDatabase` class in LotusScript serves as the primary means to access and manage Notes databases. This class enables developers to perform various operations such as opening existing databases, creating new ones, copying databases, and deleting them.

## Creating and Opening Databases

To access an existing database, you can use the `GetDatabase` method of `NotesSession` or directly instantiate a `NotesDatabase` object using the `New` method.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("ServerName", "DatabasePath")
If db.IsOpen Then
    ' Database successfully opened
Else
    ' Unable to open database
End If
```

In this code, `ServerName` and `DatabasePath` represent the server where the target database resides and the path to the database, respectively. If the database is local, `ServerName` can be an empty string ("").

## Creating a New Database

To create a new database, use the `Create` method of `NotesDatabase`.

```lotusscript
Dim session As New NotesSession
Dim db As New NotesDatabase("", "newdb.nsf")
If Not db.IsOpen Then
    Call db.Create("", "newdb.nsf", True)
    ' New database created
Else
    ' Database already exists
End If
```

This script creates a new database named `newdb.nsf` locally. If the database already exists, the `IsOpen` property will return `True`.

## Copying and Deleting Databases

To copy an existing database, use the `CreateCopy` method.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "existingdb.nsf")
If db.IsOpen Then
    Dim newDb As NotesDatabase
    Set newDb = db.CreateCopy("", "copydb.nsf")
    ' Database successfully copied
Else
    ' Unable to open original database
End If
```

To delete a database, use the `Remove` method.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "tobedeleted.nsf")
If db.IsOpen Then
    Call db.Remove
    ' Database deleted
Else
    ' Unable to open database
End If
```

## Accessing Documents in a Database

Through `NotesDatabase`, you can access collections of documents within the database.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "existingdb.nsf")
If db.IsOpen Then
    Dim docColl As NotesDocumentCollection
    Set docColl = db.AllDocuments
    Dim doc As NotesDocument
    Set doc = docColl.GetFirstDocument
    While Not doc Is Nothing
        ' Process document
        Set doc = docColl.GetNextDocument(doc)
    Wend
Else
    ' Unable to open database
End If
```

## Conclusion

The `NotesDatabase` class offers a comprehensive set of methods and properties that allow developers to effectively access and manage HCL Domino databases. With the examples provided above, you can begin working with databases in LotusScript and further develop applications based on your requirements.
