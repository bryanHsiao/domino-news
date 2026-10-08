---
title: "A Guide to File Operations Using the NotesStream Class"
description: "Explore how to utilize the NotesStream class in LotusScript for reading and writing files, including steps for creating, opening, reading, writing, and closing files."
pubDate: "2026-10-08T10:36:15+08:00"
lang: "en"
slug: "notes-stream-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesStream (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "Examples: Open method (NotesStream - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_OPEN_METHOD_STREAM.html"
  - title: "Examples: Write method"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_WRITE_METHOD_STREAM.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-stream-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESSTREAM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-stream-class
-->

## Introduction

In HCL Domino's LotusScript, the `NotesStream` class provides an efficient way to handle binary or text data streams. This is particularly useful for applications that require reading from or writing to files. This article will guide you through the process of using the `NotesStream` class for file operations.

## Creating and Opening a NotesStream

To use `NotesStream`, first create a new `NotesStream` object using the `CreateStream` method of the `NotesSession` object. Then, associate the stream with a specific file using the `Open` method.

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream
If Not stream.Open("C:\\example.txt", "UTF-8") Then
    MsgBox "Unable to open file."
    Exit Sub
End If
```

In the code above, the first parameter of the `Open` method is the full path to the file, and the second parameter is the character set of the file. If the file does not exist, the `Open` method will create it.

## Writing Data to the File

Once the file is successfully opened, you can write text to the stream using the `WriteText` method.

```lotusscript
Call stream.WriteText("This is a sample text.")
```

After writing, it's recommended to close the stream using the `Close` method to ensure all data is properly written to the file.

```lotusscript
Call stream.Close
```

## Reading File Content

To read the content of a file, use the `ReadText` method. First, ensure the stream's `Position` property is set to 0 to start reading from the beginning of the file.

```lotusscript
stream.Position = 0
Dim fileContent As String
fileContent = stream.ReadText
MsgBox fileContent
```

## Checking the Stream's Status

It's important to check the status of the stream during operations. The `IsEOS` property can be used to determine if the end of the stream has been reached.

```lotusscript
If stream.IsEOS Then
    MsgBox "End of file reached."
End If
```

## Conclusion

The `NotesStream` class provides a powerful tool in LotusScript for handling file read and write operations. By properly creating, opening, reading, writing, and closing streams, developers can effectively manage file operations within their applications. For more detailed information and examples, refer to the [official NotesStream class documentation](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESSTREAM_CLASS.html) and [Open method examples](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_OPEN_METHOD_STREAM.html).
