---
title: "Managing NotesACL with LotusScript: A Comprehensive Guide"
description: "This guide provides detailed instructions on using LotusScript to manipulate NotesACL, including steps to read, modify, and manage access control lists, with practical examples."
pubDate: "2026-06-14T07:30:19+08:00"
lang: "en"
slug: "notes-acl"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl
-->

## Introduction

In HCL Domino, the Access Control List (ACL) determines who can access a database and what permissions they have. Using LotusScript, developers can programmatically read and modify the ACL to automate administrative tasks. This article provides a comprehensive guide on how to manipulate NotesACL using LotusScript, including steps to read, modify, and manage ACLs, with practical examples.

## Obtaining the NotesACL Object

To manipulate a database's ACL, you first need to obtain the NotesACL object. This can be achieved through the `ACL` property of the NotesDatabase class.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

In this code, `session.CurrentDatabase` retrieves a reference to the current database, and its `ACL` property provides access to the database's ACL.

## Reading ACL Entries

Once you have the NotesACL object, you can iterate through all entries in the ACL using the `GetFirstEntry` and `GetNextEntry` methods.

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetFirstEntry

While Not entry Is Nothing
    Print "Name: " & entry.Name & ", Level: " & entry.Level
    Set entry = acl.GetNextEntry(entry)
Wend
```

This script lists each entry's name and access level in the ACL.

## Modifying ACL Entries

To modify an existing ACL entry, use the `GetEntry` method to retrieve the specific entry and then change its properties.

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("John Doe")

If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_EDITOR
    Call acl.Save
Else
    Print "The specified ACL entry was not found."
End If
```

In this example, the access level of the entry named "John Doe" is changed to Editor, and the changes are saved.

## Adding ACL Entries

To add a new ACL entry, use the `CreateACLEntry` method.

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("Jane Doe", ACLLEVEL_AUTHOR)
Call acl.Save
```

This adds a new ACL entry for "Jane Doe" with Author access level.

## Removing ACL Entries

To remove an ACL entry, use the `RemoveACLEntry` method.

```lotusscript
Call acl.RemoveACLEntry("Jane Doe")
Call acl.Save
```

This removes the ACL entry for "Jane Doe".

## Setting ACL Properties

The NotesACL object also provides various properties to control ACL behavior, such as the `UniformAccess` property.

```lotusscript
acl.UniformAccess = True
Call acl.Save
```

This sets the uniform access property of the ACL.

## Conclusion

By manipulating NotesACL with LotusScript, developers can programmatically manage the access control lists of HCL Domino databases, enabling automated security management. This guide provides a comprehensive overview, from reading and modifying to managing ACLs, to help you effectively control database access permissions.

For more information, refer to the official documentation for the [NotesACL class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) and [NotesACLEntry class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html).
