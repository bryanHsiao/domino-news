---
title: "Managing Domino Database Access with the NotesACL Class"
description: "A comprehensive guide on using the NotesACL class in LotusScript to programmatically manage access control lists in HCL Domino databases, including adding, modifying, and removing ACL entries."
pubDate: "2026-06-07T07:27:55+08:00"
lang: "en"
slug: "notes-acl-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing database access with NotesACL"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MANAGING_DATABASE_ACCESS_WITH_NOTESACL.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl-class
-->

In HCL Domino, the Access Control List (ACL) is a fundamental component for managing database security. Using the `NotesACL` class in LotusScript, developers can programmatically control who has access to a database and what level of access they possess. This article provides a detailed guide on managing ACLs using the `NotesACL` and `NotesACLEntry` classes.

## Accessing the NotesACL Object

To manage a database's ACL, you first need to obtain the `NotesACL` object. This can be achieved through the `ACL` property of the `NotesDatabase` class:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

## Adding an ACL Entry

To add a new entry to the ACL, use the `CreateACLEntry` method. The following example demonstrates how to add a reader access level for a user:

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("John Doe", ACLLEVEL_READER)
acl.Save
```

## Modifying an Existing ACL Entry

To modify an existing ACL entry, first retrieve the entry using the `GetEntry` method, then set the desired access level:

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("John Doe")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_EDITOR
    acl.Save
End If
```

## Removing an ACL Entry

To remove an entry from the ACL, use the `RemoveACLEntry` method:

```lotusscript
Call acl.RemoveACLEntry("John Doe")
acl.Save
```

## Setting ACL Properties

The `NotesACL` class provides various properties to configure ACL behavior, such as:

- `UniformAccess`: Controls whether uniform access is enforced.
- `AdminNames`: Specifies users with administrative privileges.

The following example demonstrates how to set these properties:

```lotusscript
acl.UniformAccess = True
acl.AdminNames = "Admin1, Admin2"
acl.Save
```

## Conclusion

By leveraging the `NotesACL` and `NotesACLEntry` classes, developers can programmatically manage access control in HCL Domino databases, ensuring data security and proper access permissions. For more detailed information, refer to the official documentation for the [NotesACL class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) and [NotesACLEntry class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html).
