---
title: "Tutorial on File Operations Using the NotesStream Class"
description: "This tutorial introduces how to use the NotesStream class in LotusScript to read and write files, providing practical examples of its application."
pubDate: "2026-09-23T09:19:40+08:00"
lang: "en"
slug: "notes-stream-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesStream class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "Open method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM.html"
  - title: "Write method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITE_METHOD_STREAM.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-stream-class
-->

## Introduction

In HCL Domino's LotusScript, the `NotesStream` class offers a convenient way to handle file reading and writing operations. With this class, developers can easily read file contents, write data to files, and manage text encoding. This article will introduce how to use the `NotesStream` class for basic file operations, providing practical examples to illustrate its application.

## Overview of the NotesStream Class

The `NotesStream` class allows developers to read and write text or binary data streams in LotusScript. It provides various methods and properties to control the behavior of data streams, such as opening and closing streams, reading and writing data, and setting encoding.

## Usage Examples

The following examples demonstrate how to use the `NotesStream` class to read and write files.

### Reading File Contents

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\example.txt", "UTF-8") Then
    Dim content As String
    content = stream.ReadText
    MsgBox "File content: " & content
    stream.Close
Else
    MsgBox "Unable to open file."
End If
```

In this example, we first create a `NotesStream` object and then use the `Open` method to open the specified file path with UTF-8 encoding. If the file is successfully opened, we use the `ReadText` method to read its content and finally close the stream.

### Writing Data to a File

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\output.txt", "UTF-8") Then
    stream.WriteText "This is a test content."
    stream.Close
    MsgBox "Data has been successfully written to the file."
Else
    MsgBox "Unable to open file."
End If
```

In this example, we create a `NotesStream` object and use the `Open` method to open or create the specified file path with UTF-8 encoding. Then, we use the `WriteText` method to write text to the file and finally close the stream.

## Considerations

- When using `NotesStream` for file operations, ensure that the file path is correct and that you have appropriate access permissions.
- When using the `Open` method, you can specify different encoding formats, such as "UTF-8" or "ASCII", depending on your needs.
- After completing file operations, always use the `Close` method to close the stream and release resources.

Through the above examples, developers can become familiar with how to use the `NotesStream` class in LotusScript to perform file reading and writing operations, thereby more effectively handling file data. For more detailed information, please refer to the official documentation for the [NotesStream class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html) and the [Open method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM.html).
