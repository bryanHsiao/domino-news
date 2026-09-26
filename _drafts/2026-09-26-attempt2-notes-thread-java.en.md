---
title: "Using NotesThread in Java: Multithreading with Domino Objects"
description: "Learn how to use the NotesThread class in Java to safely handle Domino objects, ensuring stability and performance in multithreaded environments."
pubDate: "2026-09-26T09:16:38+08:00"
lang: "en"
slug: "notes-thread-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "Supporting components"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SUPPORTING_COMPONENTS_JAVA.html"
  - title: "Writing LotusScript in the Programmer's pane"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITING_LOTUSSCRIPT_IN_THE_PROGRAMMER_S_PANE.html"
  - title: "Using the Objects tab"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_OBJECTS_TAB.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-thread-java" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SUPPORTING_COMPONENTS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-thread-java
-->

## Using NotesThread in Java: Multithreading with Domino Objects

When working with HCL Domino objects in Java, it's crucial to ensure thread safety. The Domino Java API is not thread-safe, so in multithreaded environments, the `NotesThread` class must be used to manage access to Domino objects.

### Why Use NotesThread?

The Domino Java API is designed to operate in a single-threaded environment. Directly accessing Domino objects from multiple threads can lead to unpredictable behavior or crashes. The `NotesThread` class provides a mechanism to safely initialize and terminate access to Domino objects in a multithreaded context.

### Steps to Use NotesThread

1. **Initialize NotesThread**: Before accessing any Domino objects, call the `NotesThread.sinitThread()` method. This initializes the current thread for safe interaction with Domino.

2. **Access Domino Objects**: After initialization, you can safely create and manipulate Domino objects.

3. **Terminate NotesThread**: Once done with Domino objects, call the `NotesThread.stermThread()` method to clean up resources.

### Example Code

Here's an example demonstrating how to safely access a Domino database in a multithreaded environment using `NotesThread`:

```java
import lotus.domino.*;

public class DominoThreadExample {
    public static void main(String[] args) {
        NotesThread.sinitThread();
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            if (db != null && db.isOpen()) {
                System.out.println("Successfully opened database: " + db.getTitle());
            } else {
                System.out.println("Unable to open database.");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            NotesThread.stermThread();
        }
    }
}
```

In this code:

- `NotesThread.sinitThread()` initializes the thread.
- `NotesFactory.createSession()` creates a session.
- The database is accessed and operations are performed.
- Finally, `NotesThread.stermThread()` terminates the thread.

### Important Considerations

- **Each Thread Must Call**: Every thread that needs to access Domino objects must call `sinitThread()` and `stermThread()`, even within the same application.

- **Avoid Nested Calls**: Do not nest calls to `sinitThread()` and `stermThread()` within the same thread, as this can lead to unpredictable behavior.

- **Resource Management**: Ensure all Domino objects are released before calling `stermThread()` to prevent memory leaks.

By properly using `NotesThread`, you can safely work with Domino objects in Java multithreaded environments, ensuring application stability and performance.

For more information, refer to [Supporting components](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SUPPORTING_COMPONENTS_JAVA.html) and [Writing LotusScript in the Programmer's pane](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITING_LOTUSSCRIPT_IN_THE_PROGRAMMER_S_PANE.html).
