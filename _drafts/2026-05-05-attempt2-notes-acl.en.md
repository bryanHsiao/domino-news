---
title: "Managing NotesACL with LotusScript"
description: "A comprehensive guide on using LotusScript to manipulate the NotesACL class in HCL Domino, covering reading, modifying, and managing ACLs to ensure database security and access control."
pubDate: "2026-05-05T07:23:28+08:00"
lang: "en"
slug: "notes-acl"
tags:
  - "Domino Server"
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "NotesACL class - HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class - HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing Access Control Lists (ACLs) in LotusScript"
    url: "https://www.ibm.com/docs/en/notes/9.0.1?topic=ssw-9-0-1-composite-application-developer-managing-access-control-lists-acls-in-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl
-->

## Introduction

In HCL Domino, the Access Control List (ACL) determines which users or groups can access a database and their respective permissions. Using the `NotesACL` class in LotusScript, developers can programmatically read and modify the ACL, effectively managing database security.

## Reading the ACL

To access a database's ACL, first obtain a `NotesDatabase` object, then use its `ACL` property to get the `NotesACL` object.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

## Adding an ACL Entry

To add a new user or group to the ACL, use the `CreateACLEntry` method. The following example demonstrates how to add a user with "Editor" access.

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("newuser", ACLLEVEL_EDITOR)
acl.Save
```

## Modifying an Existing ACL Entry

To modify the access level of an existing user or group, first retrieve the `NotesACLEntry` object using the `GetEntry` method, then modify its properties.

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("existinguser")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_MANAGER
    acl.Save
End If
```

## Removing an ACL Entry

To remove a user or group from the ACL, use the `RemoveACLEntry` method.

```lotusscript
acl.RemoveACLEntry("userToRemove")
acl.Save
```

## Setting ACL Options

The `NotesACL` class provides various properties to configure ACL behavior, such as the `UniformAccess` property, which controls whether uniform access is enforced.

```lotusscript
acl.UniformAccess = True
acl.Save
```

## Conclusion

By leveraging the `NotesACL` class in LotusScript, developers can programmatically manage the access control of HCL Domino databases, ensuring data security and proper access permissions. For more detailed information, refer to the [NotesACL class official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACL_CLASS.html) and the [NotesACLEntry class official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESACLENTRY_CLASS.html).
