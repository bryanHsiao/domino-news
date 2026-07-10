---
title: "Parsing and Generating Domino URLs with the NotesURL Class"
description: "Explore the NotesURL class to learn how to parse and generate HCL Domino URLs, with practical examples demonstrating its application in LotusScript."
pubDate: "2026-07-10T08:07:29+08:00"
lang: "en"
slug: "notes-url-class"
tags:
  - "Domino Server"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesURL class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESURL_CLASS.html"
  - title: "NotesURL properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTESURL.html"
  - title: "NotesURL methods"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_METHODS_NOTESURL.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESURL_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-url-class
-->

In HCL Domino development, handling URLs is a common requirement. The `NotesURL` class provides a powerful tool for developers to parse and generate Domino URLs, facilitating efficient management and manipulation of documents, views, and other resources.

## What is the NotesURL Class?

The `NotesURL` class in HCL Domino allows developers to parse and construct URLs that conform to the Domino format. With this class, you can decompose a URL into its constituent parts or assemble a complete URL from individual components.

## Key Properties of NotesURL

- **Database**: Represents the database portion of the URL.
- **View**: Represents the view portion of the URL.
- **Document**: Represents the document portion of the URL.
- **Action**: Represents the action portion of the URL.
- **Navigator**: Represents the navigator portion of the URL.

These properties enable developers to access and modify different segments of a URL, allowing for flexible manipulation of Domino resources.

## Parsing a URL with NotesURL

Here's an example of using the `NotesURL` class to parse a Domino URL:

```lotusscript
Dim session As New NotesSession
Dim notesURL As NotesURL
Set notesURL = session.CreateURL("notes://ServerName/DatabaseName/ViewName/DocumentUNID")

Print "Database: " & notesURL.Database
Print "View: " & notesURL.View
Print "Document: " & notesURL.Document
```

In this example, we create a `NotesURL` object and parse a given Domino URL, then output its database, view, and document components.

## Generating a URL with NotesURL

The `NotesURL` class can also be used to generate new Domino URLs. Here's an example:

```lotusscript
Dim session As New NotesSession
Dim notesURL As NotesURL
Set notesURL = session.CreateURL("")

notesURL.Server = "ServerName"
notesURL.Database = "DatabaseName"
notesURL.View = "ViewName"
notesURL.Document = "DocumentUNID"

Dim fullURL As String
fullURL = notesURL.GetURL()
Print "Generated URL: " & fullURL
```

In this example, we create an empty `NotesURL` object, set its server, database, view, and document components, and then generate the complete URL.

## Conclusion

The `NotesURL` class provides HCL Domino developers with a robust tool for parsing and generating Domino URLs. By understanding its properties and methods, developers can more effectively manage and manipulate Domino resources, enhancing the flexibility and maintainability of their applications.

For more detailed information, refer to the [NotesURL class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESURL_CLASS.html) and [NotesURL properties](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTESURL.html).
