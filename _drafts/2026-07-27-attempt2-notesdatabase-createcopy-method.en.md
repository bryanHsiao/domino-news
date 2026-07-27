---
title: "Using the NotesDatabase.CreateCopy Method to Create Database Copies"
description: "A comprehensive guide on utilizing the NotesDatabase.CreateCopy method in LotusScript to create empty copies of databases, including syntax, parameters, usage considerations, and practical examples."
pubDate: "2026-07-27T08:02:41+08:00"
lang: "en"
slug: "notesdatabase-createcopy-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "CreateCopy (NotesDatabase - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=lotusscript-createcopy-notesdatabase"
  - title: "Examples: CreateCopy method"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-examples-createcopy-method"
  - title: "NotesDatabase class"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesdatabase-class"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=lotusscript-createcopy-notesdatabase, https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-examples-createcopy-method, https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesdatabase-class
attempt: 2
slug: notesdatabase-createcopy-method
-->

## Introduction

In HCL Domino development, there are scenarios where you need to create a copy of an existing database for testing, backup, or other purposes. LotusScript provides the `CreateCopy` method in the `NotesDatabase` class, allowing you to create an empty copy of a database. This article delves into the usage of this method.

## Syntax and Parameters

The syntax for the `CreateCopy` method is as follows:

```lotusscript
Set notesDatabaseNew = notesDatabase.CreateCopy(newServer$, newDbFile$ [, maxsize%])
```

- `newServer$`: The name of the server where the new database resides. Use an empty string ("") to create a copy on the current computer.
- `newDbFile$`: The file name of the new copy.
- `maxsize%` (optional): The maximum size (in gigabytes) to assign to the new database. This parameter applies only to Release 4 databases or those created on a server that has not been upgraded to Release 5. Entering an integer greater than 4 generates a runtime error.

## Usage Considerations

- If a database with the specified file name already exists at the `newServer$` and `newDbFile$` location, error number 4005 ("File already exists") occurs.
- The copy contains the design elements of the current database, an identical access control list (ACL), and an identical title but does not contain any documents.
- The copy is not a replica.
- The ACL of the original database gets copied to the new database, but you may want to modify the copy's ACL. For example, you may want Manager access to the copy for yourself even if you're not a manager of the original. Use the `GrantAccess` and `RevokeAccess` methods to modify the copy's ACL.

## Practical Example

The following example demonstrates how to use the `CreateCopy` method to create an empty copy of a database:

```lotusscript
Dim db As NotesDatabase, archiveDb As NotesDatabase
Set db = New NotesDatabase("Athens", "purchase.nsf")
Set archiveDb = db.CreateCopy("Athens", "archive\purchase.nsf")
```

In this example, the code creates an empty copy of the "purchase.nsf" database on the "Athens" server, with the copy's path set to "archive\purchase.nsf".

## References

- [CreateCopy Method (NotesDatabase - LotusScript)](https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=lotusscript-createcopy-notesdatabase)
- [Examples: CreateCopy Method](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=lotusscript-examples-createcopy-method)
- [NotesDatabase Class](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=classes-notesdatabase-class)
