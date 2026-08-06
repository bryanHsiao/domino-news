---
title: "使用 NotesStream 類別進行 Java 檔案操作"
description: "深入探討如何在 HCL Domino 中使用 Java 的 NotesStream 類別進行檔案讀寫操作，並提供實作範例。"
pubDate: "2026-08-06T08:01:43+08:00"
lang: "zh-TW"
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

## 簡介

在 HCL Domino 的 Java 開發中，`NotesStream` 類別提供了一種方便的方式來處理檔案的讀寫操作。透過 `NotesStream`，開發者可以讀取和寫入文字或二進位資料，並與其他 Domino 物件進行互動。

## 創建 NotesStream 物件

要使用 `NotesStream`，首先需要從 `Session` 物件中創建一個新的 `NotesStream` 實例。以下是如何在 Java 中實現這一操作的範例：

```java
import lotus.domino.*;

public class StreamExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Stream stream = session.createStream();
            // 在此處添加您的代碼
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

在上述程式碼中，我們首先初始化了 Notes 執行緒，然後創建了一個 `Session` 物件，接著透過該 `Session` 創建了一個 `Stream` 物件。完成操作後，記得關閉 `Stream` 並回收 `Session` 物件。

## 讀取和寫入資料

`NotesStream` 支援多種資料操作方法，包括讀取和寫入文字或二進位資料。以下是一些常用的方法：

- `write(String data)`: 將字串寫入流中。
- `read(int numBytes)`: 讀取指定數量的位元組。
- `readText()`: 讀取流中的文字資料。
- `setPosition(long position)`: 設定流的當前位置。

以下是寫入和讀取文字資料的範例：

```java
// 寫入文字資料
stream.writeText("這是一段測試文字。");

// 重置流的位置
stream.setPosition(0);

// 讀取文字資料
String data = stream.readText();
System.out.println("讀取的資料: " + data);
```

在這個範例中，我們首先使用 `writeText` 方法將一段文字寫入流中，然後將流的位置重置為起始位置，最後讀取並輸出該文字。

## 與其他 Domino 物件的互動

`NotesStream` 可以與其他 Domino 物件進行互動，例如讀取或寫入 `Document` 物件的項目。以下是將流中的資料寫入 `Document` 物件中特定項目的範例：

```java
Document doc = database.createDocument();
doc.replaceItemValue("Body", stream);
doc.save();
```

在這個範例中，我們創建了一個新的 `Document` 物件，然後將 `NotesStream` 中的資料寫入名為 "Body" 的項目中，最後保存該文件。

## 結論

`NotesStream` 類別為在 HCL Domino 中進行檔案操作提供了強大的功能。透過上述範例，開發者可以更有效地讀取和寫入資料，並與其他 Domino 物件進行互動。更多詳細資訊，請參閱 [Session (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS_JAVA.html) 和 [Java Classes A-Z](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html)。
