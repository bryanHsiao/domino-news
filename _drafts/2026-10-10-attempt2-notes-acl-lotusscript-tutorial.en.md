---
title: "Managing Notes ACL with LotusScript: A Comprehensive Guide"
description: "This tutorial delves into using LotusScript to manipulate the Notes Access Control List (ACL), including viewing, modifying, and managing ACL entries to effectively control database access permissions."
pubDate: "2026-10-10T10:10:16+08:00"
lang: "en"
slug: "notes-acl-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
  - "Admin"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing ACLs with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MANAGING_ACLS_WITH_LOTUSSCRIPT.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-acl-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl-lotusscript-tutorial
-->

## Introduction

In the HCL Domino environment, the Access Control List (ACL) is a crucial component for managing database security. Through the ACL, you can control which users or groups have access to a database and the level of access they possess. LotusScript provides robust classes and methods that allow developers to programmatically view and modify the ACL, thereby automating security management.

## Prerequisites

Before you begin, ensure you have the following:

- Familiarity with HCL Domino and Notes environments.
- Basic knowledge of LotusScript programming.
- Appropriate access permissions to the target database.

## Viewing ACL Entries

To view the ACL entries of a database, you can use the `ACL` property of the `NotesDatabase` class, which returns a `NotesACL` object. Here's an example of how to list all ACL entries:

```lotusscript
Sub ListACLEntries
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Set entry = acl.GetFirstEntry
    Do Until entry Is Nothing
        Print "Name: " & entry.Name & ", Level: " & entry.Level
        Set entry = acl.GetNextEntry(entry)
    Loop
End Sub
```

In this code, the `GetFirstEntry` and `GetNextEntry` methods are used to iterate through the ACL entries. Each entry's name and access level are printed out.

## Modifying ACL Entries

You can retrieve a specific ACL entry using the `GetEntry` method of the `NotesACL` class and then modify its access level. Here's an example of how to set a specific user's access level to Manager:

```lotusscript
Sub SetAdminAccess(userName As String)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Set entry = acl.GetEntry(userName)
    If Not entry Is Nothing Then
        entry.Level = ACLLEVEL_MANAGER
        acl.Save
        Print "Access level for " & userName & " set to Manager."
    Else
        Print "User " & userName & " not found in ACL."
    End If
End Sub
```

In this code, `ACLLEVEL_MANAGER` is a constant representing the Manager access level. Note that after modifying the ACL, you need to call the `Save` method to apply the changes.

## Adding ACL Entries

To add a new ACL entry, you can use the `CreateACLEntry` method of the `NotesACL` class. Here's an example of how to add a new user with Reader access:

```lotusscript
Sub AddReaderAccess(userName As String)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Set entry = acl.CreateACLEntry(userName, ACLLEVEL_READER)
    acl.Save
    Print "Added " & userName & " with Reader access."
End Sub
```

In this code, `ACLLEVEL_READER` is a constant representing the Reader access level.

## Removing ACL Entries

To remove an ACL entry, you can use the `RemoveACLEntry` method of the `NotesACL` class. Here's an example of how to remove a specific user's ACL entry:

```lotusscript
Sub RemoveACLEntry(userName As String)
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    
    Set db = session.CurrentDatabase
    Set acl = db.ACL
    
    Call acl.RemoveACLEntry(userName)
    acl.Save
    Print "Removed " & userName & " from ACL."
End Sub
```

Again, after removing an ACL entry, you need to call the `Save` method to apply the changes.

## Conclusion

By leveraging LotusScript, you can programmatically manage the ACL of HCL Domino databases, thereby automating security management processes. This not only enhances efficiency but also ensures consistency in access control. For more detailed information, refer to the official documentation for the [NotesACL class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) and the [NotesACLEntry class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html).
