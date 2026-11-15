---
title: "Working with NotesStream in Java: A Practical Guide to Reading and Writing Files"
description: "Explore how to utilize the NotesStream class in Java to read and write files, covering steps to create, open, read, write, and close streams, with implementation examples."
pubDate: "2026-11-15T10:26:54+08:00"
lang: "en"
slug: "notesstream-java-tutorial"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "Stream (Java)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESSTREAM_CLASS_JAVA.html"
  - title: "Open (NotesStream - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-open-notesstream"
  - title: "ReadText (NotesStream - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-readtext-notesstream"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesstream-java-tutorial
-->

In HCL Domino's Java API, the `NotesStream` class provides a means to handle streams of binary or character data, allowing developers to read from and write to files. This article will guide you through using `NotesStream` in Java to perform file operations, complete with implementation examples.

## Creating and Opening a NotesStream

First, create an instance of `NotesStream` using the `createStream` method from the `Session` object:

```java
Session session = NotesFactory.createSession();
Stream stream = session.createStream();
```

Next, open or create a file and associate it with the stream using the `open` method:

```java
boolean isOpened = stream.open("C:\\path\\to\\file.txt", "UTF-8");
if (!isOpened) {
    System.out.println("Unable to open file.");
    return;
}
```

In this code, the first parameter of the `open` method is the full path to the file, and the second parameter is the optional character set, defaulting to "System". If the file does not exist, the `open` method will create it.

## Writing Data to the File

To write data to the file, use the `writeText` method:

```java
stream.writeText("This is a test line.", Stream.EOL_CRLF);
stream.writeText("This is another line.", Stream.EOL_CRLF);
```

The first parameter of the `writeText` method is the text to write, and the second parameter is the end-of-line character(s). Here, `Stream.EOL_CRLF` represents the end-of-line sequence for Windows platforms.

## Reading File Content

To read content from the file, use the `readText` method:

```java
stream.setPosition(0);
String content = stream.readText();
System.out.println("File content:\n" + content);
```

Before reading, set the stream's position to the beginning of the file using `setPosition(0)`. The `readText` method reads the entire file content and returns it as a string.

## Closing the Stream

After completing read and write operations, close the stream using the `close` method to release resources:

```java
stream.close();
```

## Important Considerations

- The use of a `NotesStream` object is limited to the thread in which it is created.
- Ensure that the stream is closed after operations to prevent resource leaks.
- When handling files, pay attention to the character set to ensure correct reading and writing of content.

By following these steps, developers can effectively use the `NotesStream` class in Java to perform file read and write operations.
