---
title: "在 Java 中使用 NotesThread：正確初始化和終止 Domino 執行緒"
description: "學習如何在 Java 程式中使用 NotesThread 類別，正確初始化和終止 Domino 執行緒，確保應用程式穩定運行。"
pubDate: "2026-11-28T12:35:44+08:00"
lang: "zh-TW"
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

## 在 Java 中使用 NotesThread：正確初始化和終止 Domino 執行緒

在開發與 HCL Domino 互動的 Java 應用程式時，正確管理執行緒是確保應用程式穩定性和效能的關鍵。Domino 提供了 `NotesThread` 類別，專為處理與 Domino 物件的本地呼叫而設計。本文將介紹如何使用 `NotesThread` 來正確初始化和終止執行緒。

### 為何使用 NotesThread？

`NotesThread` 類別擴展了 Java 的 `Thread` 類別，包含了特定於 Notes/Domino 的初始化和終止代碼。這對於執行本地呼叫的 Java 程式至關重要，因為它確保了與 Domino 物件的正確互動。

### 使用 NotesThread 的方法

有三種主要方法可以在 Java 程式中使用 `NotesThread`：

1. **透過繼承執行執行緒**

   若要透過繼承來執行執行緒，請擴展 `NotesThread` 並實作 `runNotes` 方法：

   ```java
   public class MyDominoThread extends NotesThread {
       public void runNotes() {
           // 您的代碼
       }
   }
   ```

   然後，像其他執行緒一樣啟動它：

   ```java
   MyDominoThread thread = new MyDominoThread();
   thread.start();
   ```

2. **透過實作 Runnable 介面**

   若要透過實作 `Runnable` 介面來執行執行緒，請實作 `run` 方法：

   ```java
   public class MyDominoRunnable implements Runnable {
       public void run() {
           // 您的代碼
       }
   }
   ```

   然後，使用 `NotesThread` 來啟動執行緒：

   ```java
   NotesThread thread = new NotesThread(new MyDominoRunnable());
   thread.start();
   ```

3. **透過靜態方法執行執行緒**

   若不想擴展 `NotesThread` 或實作 `Runnable`，可以使用 `NotesThread` 的靜態方法：

   ```java
   public class MyDominoApp {
       public static void main(String[] args) {
           try {
               NotesThread.sinitThread();
               // 您的代碼
           } finally {
               NotesThread.stermThread();
           }
       }
   }
   ```

   在此方法中，`sinitThread` 用於初始化執行緒，`stermThread` 用於終止執行緒。確保每次呼叫 `sinitThread` 都有相應的 `stermThread` 呼叫，建議將 `stermThread` 放在 `finally` 區塊中。

### 多執行緒注意事項

在使用多執行緒時，請注意以下事項：

- **避免跨執行緒共享 Domino 物件**：在同一個執行緒內，共享、同步和回收 Domino 物件是安全的。但在不同執行緒中使用不同的會話，您需要明確管理同步和回收。

- **避免跨執行緒使用 DbDirectory**：`DbDirectory` 不應在多個執行緒間共享。

- **文件存取**：在多個執行緒中存取現有文件是允許的，但限制在一個執行緒中存取可以簡化記憶體管理。

- **文件刪除**：確保不刪除其他執行緒正在使用的文件。

- **父子執行緒關係**：當子執行緒使用父執行緒的物件時，確保父執行緒在所有子執行緒終止之前保持活動。

透過正確使用 `NotesThread`，您可以確保 Java 應用程式與 HCL Domino 的互動穩定且高效。更多詳細資訊，請參閱 [NotesThread (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html) 和 [Java Classes A-Z](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html)。
