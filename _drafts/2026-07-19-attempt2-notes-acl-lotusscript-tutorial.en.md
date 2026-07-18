---
title: "Managing NotesACL with LotusScript: A Comprehensive Guide"
description: "This tutorial delves into using LotusScript to manipulate NotesACL and NotesACLEntry, covering reading, modifying, and managing access control lists with practical examples."
pubDate: "2026-07-19T07:56:04+08:00"
lang: "en"
slug: "notes-acl-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Security"
  - "Domino Server"
sources:
  - title: "NotesACL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACLEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "Managing the ACL with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MANAGING_THE_ACL_WITH_LOTUSSCRIPT.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-acl-lotusscript-tutorial
-->

## Introduction

In HCL Domino, the Access Control List (ACL) determines who can access a database and their permissions. Using LotusScript, developers can programmatically read and modify the ACL to automate security management. This article explores how to work with the NotesACL and NotesACLEntry classes in LotusScript, providing practical examples.

## Accessing the NotesACL

To access a database's ACL, first obtain a NotesDatabase object, then use its `ACL` property to get the NotesACL object.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

## Reading ACL Entries

Use the `GetFirstEntry` and `GetNextEntry` methods of NotesACL to iterate through all entries in the ACL.

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetFirstEntry

While Not entry Is Nothing
    Print "Name: " & entry.Name & ", Level: " & entry.Level
    Set entry = acl.GetNextEntry(entry)
Wend
```

## Modifying ACL Entries

To modify an existing ACL entry, such as changing a user's access level, use the `Level` property of NotesACLEntry.

```lotusscript
Set entry = acl.GetEntry("John Doe")
If Not entry Is Nothing Then
    entry.Level = ACLLEVEL_EDITOR
    Call acl.Save
End If
```

## Adding ACL Entries

To add a new ACL entry, use the `CreateACLEntry` method of NotesACL.

```lotusscript
Set entry = acl.CreateACLEntry("Jane Doe", ACLLEVEL_AUTHOR)
Call acl.Save
```

## Deleting ACL Entries

To delete an ACL entry, use the `DeleteACLEntry` method of NotesACL.

```lotusscript
Call acl.DeleteACLEntry("Jane Doe")
Call acl.Save
```

## Setting ACL Options

NotesACL provides various options, such as enforcing reader fields, allowing anonymous access, etc. These options can be set through corresponding properties.

```lotusscript
acl.ForceUserToChangePassword = True
acl.Save
```

## Conclusion

By leveraging LotusScript, developers can effectively manage the ACL of HCL Domino databases, enabling automated security management. For more detailed information, refer to the official documentation for [NotesACL class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) and [NotesACLEntry class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html).
