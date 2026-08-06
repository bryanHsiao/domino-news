---
title: "File Operations in Java Using the NotesStream Class"
description: "A comprehensive guide on utilizing the NotesStream class in HCL Domino for file read and write operations, complete with implementation examples."
pubDate: "2026-08-06T08:01:43+08:00"
lang: "en"
slug: "notes-stream-java-tutorial"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "Session (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS_JAVA.html"
  - title: "Java Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html"
  - title: "Running a Java program"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-stream-java-tutorial
-->

## Introduction

In HCL Domino's Java development environment, the `NotesStream` class offers a convenient way to handle file read and write operations. With `NotesStream`, developers can read and write text or binary data and interact with other Domino objects.

## Creating a NotesStream Object

To use `NotesStream`, you first need to create a new instance from the `Session` object. Here's an example of how to achieve this in Java:

```java
import lotus.domino.*;

public class StreamExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Stream stream = session.createStream();
            // Add your code here
            stream.close();
            session.recycle();
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            NotesThread.stermThread();
        }
    }
}
```

In this code, we initialize the Notes thread, create a `Session` object, and then create a `Stream` object through that `Session`. After completing the operations, it's important to close the `Stream` and recycle the `Session` object.

## Reading and Writing Data

`NotesStream` supports various data operations, including reading and writing text or binary data. Some commonly used methods include:

- `write(String data)`: Writes a string to the stream.
- `read(int numBytes)`: Reads a specified number of bytes.
- `readText()`: Reads text data from the stream.
- `setPosition(long position)`: Sets the current position of the stream.

Here's an example of writing and reading text data:

```java
// Writing text data
stream.writeText("This is a test string.");

// Resetting the stream position
stream.setPosition(0);

// Reading text data
String data = stream.readText();
System.out.println("Read data: " + data);
```

In this example, we use the `writeText` method to write a string to the stream, reset the stream's position to the beginning, and then read and output the text.

## Interacting with Other Domino Objects

`NotesStream` can interact with other Domino objects, such as reading from or writing to items in a `Document` object. Here's an example of writing data from the stream to a specific item in a `Document` object:

```java
Document doc = database.createDocument();
doc.replaceItemValue("Body", stream);
doc.save();
```

In this example, we create a new `Document` object, write the data from the `NotesStream` into an item named "Body," and then save the document.

## Conclusion

The `NotesStream` class provides powerful capabilities for file operations in HCL Domino. Through the examples above, developers can effectively read and write data and interact with other Domino objects. For more detailed information, refer to the [Session (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS_JAVA.html) and [Java Classes A-Z](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html) documentation.
