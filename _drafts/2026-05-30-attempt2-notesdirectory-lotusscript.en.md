---
title: "NotesDirectory: Directory Queries in LotusScript"
description: "Explore the NotesDirectory class to learn how to query and manipulate Notes directories in LotusScript, enabling efficient directory searches and user information retrieval."
pubDate: "2026-05-30T07:33:48+08:00"
lang: "en"
slug: "notesdirectory-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDirectory (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDIRECTORY_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notes-item] on 2026-05-21. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesdirectory-lotusscript
-->

## Introduction

In HCL Domino development, the **NotesDirectory** class provides a powerful means for developers to query and manipulate Notes directories using LotusScript. This is essential for applications that require user information retrieval, validation, or other directory-related operations.

## Overview of the NotesDirectory Class

The **NotesDirectory** class represents the Notes directories on a specific server or local computer. Each directory is associated with one or more directory navigators to facilitate directory lookups.

### Key Properties

- **AvailableItems**: Read-only. An array of summary data items that have been looked up and cached.
- **AvailableNames**: Read-only. An array of names that have been looked up and cached.
- **AvailableView**: Read-only. The view name that has been looked up and cached.

### Key Methods

- **CreateNavigator**: Creates a new directory navigator.
- **FreeLookupBuffer**: Releases the lookup buffer.
- **GetMailInfo**: Retrieves mail information.
- **LookupAllNames**: Looks up all names.
- **LookupNames**: Looks up specific names.

## Usage Example

The following example demonstrates how to use the **NotesDirectory** class to query mail information for a specific user.

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim directory As NotesDirectory
    Dim navigator As NotesDirectoryNavigator
    Dim entry As NotesDirectoryEntry
    
    ' Create a directory object pointing to the current server
    Set directory = session.GetDirectory("")
    
    ' Create a directory navigator
    Set navigator = directory.CreateNavigator
    
    ' Look up mail information for a specific user
    If directory.LookupNames("Users", "John Doe") Then
        Set entry = navigator.GetFirstEntry
        Do While Not entry Is Nothing
            Print "User Name: " & entry.GetItemValue("FullName")(0)
            Print "Email Address: " & entry.GetItemValue("InternetAddress")(0)
            Set entry = navigator.GetNextEntry
        Loop
    Else
        Print "User information not found."
    End If
End Sub
```

In this example, we first create a **NotesDirectory** object pointing to the current server. Then, we create a directory navigator using the **CreateNavigator** method. Next, we use the **LookupNames** method to query information for a user named "John Doe" and iterate through the results using the navigator, printing the user's full name and email address.

## Considerations

- **Directory Permissions**: Ensure that the user executing the query has appropriate directory access permissions.
- **Performance**: For large directories, queries may consume significant resources. It is advisable to cache query results to improve performance.

## Conclusion

The **NotesDirectory** class offers LotusScript developers an efficient way to query and manipulate Notes directories. By understanding its properties and methods, developers can implement various directory-related functionalities to meet application requirements.

For more information on the **NotesDirectory** class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDIRECTORY_CLASS.html).
