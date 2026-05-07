---
title: "Mastering NotesACLEntry: Managing Access Control in Domino Databases"
description: "This article provides a comprehensive guide on using the NotesACLEntry class in LotusScript to manage access control lists (ACLs) in HCL Domino databases, including steps to add, modify, and remove ACL entries."
pubDate: "2026-05-08T07:23:24+08:00"
lang: "en"
slug: "notes-acl-entry"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html"
  - title: "NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDATABASE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-acl-entry
-->

## What is NotesACLEntry?

In HCL Domino, the Access Control List (ACL) determines who can access a database and what actions they can perform. The `NotesACLEntry` class represents a single entry in the ACL, allowing developers to manage these entries programmatically using LotusScript.

## Managing ACL Entries with NotesACLEntry

Below are the steps to add, modify, and remove ACL entries using the `NotesACLEntry` class.

### 1. Accessing the Database's ACL

First, obtain the ACL object of the target database.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

In this code, `session.CurrentDatabase` retrieves the current database, and `db.ACL` gets its ACL.

### 2. Adding an ACL Entry

To add a new ACL entry, use the `CreateACLEntry` method.

```lotusscript
Dim entry As NotesACLEntry

Set entry = acl.CreateACLEntry("John Doe", ACLLEVEL_EDITOR)
entry.IsPerson = True
entry.CanCreateDocuments = True
entry.CanDeleteDocuments = False

acl.Save
```

This code adds a user named "John Doe" with Editor access level, allowing document creation but not deletion. The `acl.Save` method saves the changes.

### 3. Modifying an Existing ACL Entry

To modify an existing ACL entry, retrieve and update it.

```lotusscript
Dim entry As NotesACLEntry

Set entry = acl.GetEntry("John Doe")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_MANAGER
    entry.CanDeleteDocuments = True
    acl.Save
Else
    MsgBox "ACL entry for 'John Doe' not found."
End If
```

This code elevates "John Doe" to Manager access level and allows document deletion.

### 4. Removing an ACL Entry

To remove an ACL entry, use the `RemoveACLEntry` method.

```lotusscript
acl.RemoveACLEntry("John Doe")
acl.Save
```

This code removes the ACL entry for "John Doe" and saves the changes.

## Important Considerations

- Ensure you have sufficient permissions before modifying the ACL.
- Always call `acl.Save` after making changes to persist them.
- Refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html) for more detailed information on the `NotesACLEntry` class.

By following these steps, you can effectively manage the access control lists of HCL Domino databases using LotusScript, ensuring proper security and access configurations.
