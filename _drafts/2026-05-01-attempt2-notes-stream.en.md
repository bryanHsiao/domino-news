---
title: "A Guide to File Operations Using NotesStream"
description: "Explore how to perform file read and write operations in LotusScript using the NotesStream class, with practical examples."
pubDate: "2026-05-01T07:23:50+08:00"
lang: "en"
slug: "notes-stream"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesStream class (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html"
  - title: "OpenNTF: File Operations in LotusScript"
    url: "https://openntf.org/main.nsf/project.xsp?r=project/File%20Operations%20in%20LotusScript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-stream
-->

## Introduction

In HCL Domino's LotusScript, the `NotesStream` class provides an efficient way to handle file read and write operations. With `NotesStream`, developers can read from and write to text or binary files, which is particularly useful for applications that need to process external files.

## Overview of the NotesStream Class

The `NotesStream` class allows developers to read and write file contents within LotusScript. It offers various methods and properties to control file operations, such as opening, closing, reading, and writing.

## Usage Example

Below is an example of using the `NotesStream` class to read the contents of a text file:

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\example.txt") Then
    Dim content As String
    content = stream.ReadText
    MsgBox content
    stream.Close
Else
    MsgBox "Unable to open file."
End If
```

In this example, the `CreateStream` method is used to create a new `NotesStream` instance, the `Open` method opens the specified file path, the `ReadText` method reads the file content, and finally, the `Close` method closes the stream.

## Advanced Operations

`NotesStream` also supports reading and writing binary files. Below is an example of writing to a binary file:

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\output.bin", "w") Then
    Dim data(3) As Byte
    data(0) = 72
    data(1) = 101
    data(2) = 108
    data(3) = 108
    stream.Write(data)
    stream.Close
    MsgBox "File written successfully."
Else
    MsgBox "Unable to open file."
End If
```

In this example, the second parameter "w" in the `Open` method indicates opening the file in write mode, and the `Write` method is used to write binary data.

## Considerations

- Ensure that the `NotesStream` is closed after operations to release system resources.
- Handle potential errors when reading or writing files, such as file not found or access denied.

## Conclusion

The `NotesStream` class provides a flexible and powerful way to handle file operations in LotusScript. By familiarizing yourself with its methods and properties, developers can effectively implement various file read and write functionalities within their applications.

For more detailed information on the `NotesStream` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html).
