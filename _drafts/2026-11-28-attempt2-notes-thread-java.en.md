---
title: "Using NotesThread in Java: Proper Initialization and Termination of Domino Threads"
description: "Learn how to use the NotesThread class in Java to properly initialize and terminate Domino threads, ensuring application stability."
pubDate: "2026-11-28T12:35:44+08:00"
lang: "en"
slug: "notes-thread-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "NotesThread (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html"
  - title: "Java Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html"
  - title: "Running a Java program"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_COMPILING_AND_RUNNING_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-thread-java
-->

## Using NotesThread in Java: Proper Initialization and Termination of Domino Threads

When developing Java applications that interact with HCL Domino, proper thread management is crucial for ensuring application stability and performance. Domino provides the `NotesThread` class, specifically designed to handle local calls to Domino objects. This article will guide you on how to use `NotesThread` to correctly initialize and terminate threads.

### Why Use NotesThread?

The `NotesThread` class extends Java's `Thread` class, incorporating initialization and termination code specific to Notes/Domino. This is essential for Java programs making local calls, as it ensures proper interaction with Domino objects.

### Methods to Use NotesThread

There are three primary ways to use `NotesThread` in a Java program:

1. **Executing Threads Through Inheritance**

   To execute threads through inheritance, extend `NotesThread` and implement the `runNotes` method:

   ```java
   public class MyDominoThread extends NotesThread {
       public void runNotes() {
           // Your code
       }
   }
   ```

   Then, start it like any other thread:

   ```java
   MyDominoThread thread = new MyDominoThread();
   thread.start();
   ```

2. **Executing Threads Through the Runnable Interface**

   To execute threads through the `Runnable` interface, implement the `run` method:

   ```java
   public class MyDominoRunnable implements Runnable {
       public void run() {
           // Your code
       }
   }
   ```

   Then, use `NotesThread` to start the thread:

   ```java
   NotesThread thread = new NotesThread(new MyDominoRunnable());
   thread.start();
   ```

3. **Executing Threads Through Static Methods**

   If you prefer not to extend `NotesThread` or implement `Runnable`, you can use the static methods of `NotesThread`:

   ```java
   public class MyDominoApp {
       public static void main(String[] args) {
           try {
               NotesThread.sinitThread();
               // Your code
           } finally {
               NotesThread.stermThread();
           }
       }
   }
   ```

   In this approach, `sinitThread` initializes the thread, and `stermThread` terminates it. Ensure that each call to `sinitThread` has a corresponding `stermThread` call; it's recommended to place `stermThread` in a `finally` block.

### Multithreading Considerations

When using multithreading, keep the following guidelines in mind:

- **Avoid Sharing Domino Objects Across Threads**: Within a session, Domino objects are shared, synchronized, and recycled across threads. Using a different session on each thread requires explicit management of synchronization and recycling.

- **Avoid Using DbDirectory Across Threads**: The `DbDirectory` should not be shared across multiple threads.

- **Document Access**: Accessing an existing document on multiple threads is permissible, but restricting access to one thread simplifies memory management.

- **Document Deletion**: Ensure that documents needed for navigation by a view or collection on another thread are not deleted.

- **Parent-Child Thread Relationship**: When child objects are used on threads other than the parent, keep the parent thread alive until all child threads terminate.

By correctly utilizing `NotesThread`, you can ensure stable and efficient interaction between your Java application and HCL Domino. For more detailed information, refer to the [NotesThread (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html) and [Java Classes A-Z](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html) documentation.
