---
title: "Managing NotesACL with LotusScript"
description: "A comprehensive guide on using LotusScript to manage HCL Domino's NotesACL, covering access control list fundamentals, key methods, and implementation examples."
pubDate: "2026-05-04T07:21:09+08:00"
lang: "en"
slug: "notes-acl"
tags:
  - "Domino Server"
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing Access Control Lists in LotusScript"
    url: "https://www.ibm.com/docs/en/notes/9.0.1?topic=ssw-9-0-1-composite-applications-dev-managing-access-control-lists-in-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl
-->

## Introduction

In HCL Domino, the Access Control List (ACL) determines which users or groups can access a database and their respective permissions. Using LotusScript, developers can programmatically manage the ACL to automate security configurations or dynamically adjust access rights.

## Overview of the NotesACL Class

The `NotesACL` class represents a database's ACL and provides various methods to view and modify it. Key methods include:

- `CreateACLEntry`: Adds a new ACL entry.
- `GetEntry`: Retrieves a specific user's or group's ACL entry.
- `RemoveACLEntry`: Removes a specific ACL entry.
- `Save`: Saves changes made to the ACL.

For more details, refer to the [NotesACL class](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html).

## Overview of the NotesACLEntry Class

The `NotesACLEntry` class represents an individual entry in the ACL, allowing the setting of specific permissions for users or groups. Key methods and properties include:

- `Level`: Sets or retrieves the access level (e.g., Reader, Author, Manager).
- `Roles`: Sets or retrieves assigned roles.
- `IsPerson`, `IsGroup`, `IsServer`: Determines the entry type.

For more details, refer to the [NotesACLEntry class](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html).

## Implementation Example: Adding an ACL Entry

The following example demonstrates how to use LotusScript to add a new ACL entry and set its access level and roles:

```lotusscript
Sub AddUserToACL(db As NotesDatabase, userName As String, accessLevel As Integer, roles As Variant)
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set acl = db.ACL
    Set entry = acl.CreateACLEntry(userName, accessLevel)
    entry.Roles = roles
    acl.Save
End Sub
```

In this example, `db` is the target database, `userName` is the name of the user to be added, `accessLevel` is the access level (e.g., `ACLLEVEL_AUTHOR`), and `roles` is an array of roles to be assigned.

## Implementation Example: Modifying an Existing ACL Entry

The following example demonstrates how to modify an existing user's ACL entry to change their access level:

```lotusscript
Sub ModifyUserAccessLevel(db As NotesDatabase, userName As String, newAccessLevel As Integer)
    Dim acl As NotesACL
    Dim entry As NotesACLEntry
    
    Set acl = db.ACL
    Set entry = acl.GetEntry(userName)
    If Not entry Is Nothing Then
        entry.Level = newAccessLevel
        acl.Save
    Else
        MsgBox "User not found in ACL."
    End If
End Sub
```

In this example, `newAccessLevel` is the new access level, such as `ACLLEVEL_EDITOR`.

## Implementation Example: Removing an ACL Entry

The following example demonstrates how to remove a specific user's ACL entry:

```lotusscript
Sub RemoveUserFromACL(db As NotesDatabase, userName As String)
    Dim acl As NotesACL
    
    Set acl = db.ACL
    Call acl.RemoveACLEntry(userName)
    acl.Save
End Sub
```

## Considerations

- Ensure you have sufficient permissions before modifying the ACL.
- Always call the `Save` method after making changes to the ACL to persist them.
- When processing a large number of ACL changes, it's advisable to call `Save` once after all changes are made to improve performance.

By utilizing the methods above, developers can effectively manage the Access Control List of HCL Domino databases using LotusScript, ensuring both security and flexibility within the system.
