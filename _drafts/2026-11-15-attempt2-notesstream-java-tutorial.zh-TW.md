---
title: "使用 Java 操作 NotesStream：讀取與寫入檔案的實作指南"
description: "深入探討如何在 Java 中使用 NotesStream 類別來讀取和寫入檔案，涵蓋建立、開啟、讀取、寫入和關閉流的步驟，並提供實作範例。"
pubDate: "2026-11-15T10:26:54+08:00"
lang: "zh-TW"
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

在 HCL Domino 的 Java API 中，`NotesStream` 類別提供了一種處理二進位或文字資料流的方式，允許開發者讀取和寫入檔案內容。本文將介紹如何在 Java 中使用 `NotesStream` 來讀取和寫入檔案，並提供實作範例。

## 建立與開啟 NotesStream

首先，透過 `Session` 物件的 `createStream` 方法來建立 `NotesStream` 實例：

```java
Session session = NotesFactory.createSession();
Stream stream = session.createStream();
```

接著，使用 `open` 方法開啟或建立檔案，並將其與流關聯：

```java
boolean isOpened = stream.open("C:\\path\\to\\file.txt", "UTF-8");
if (!isOpened) {
    System.out.println("無法開啟檔案。");
    return;
}
```

在上述程式碼中，`open` 方法的第一個參數是檔案的完整路徑，第二個參數是可選的字元集，預設為 "System"。如果檔案不存在，`open` 方法將建立新檔案。

## 寫入資料到檔案

要將資料寫入檔案，可以使用 `writeText` 方法：

```java
stream.writeText("這是一行測試文字。", Stream.EOL_CRLF);
stream.writeText("這是另一行文字。", Stream.EOL_CRLF);
```

`writeText` 方法的第一個參數是要寫入的文字，第二個參數是行結束符號，這裡使用 `Stream.EOL_CRLF` 表示 Windows 平台的行結束符號。

## 讀取檔案內容

要從檔案讀取內容，可以使用 `readText` 方法：

```java
stream.setPosition(0);
String content = stream.readText();
System.out.println("檔案內容：\n" + content);
```

在讀取之前，使用 `setPosition(0)` 方法將流的位置設置到檔案開頭。`readText` 方法讀取整個檔案內容並返回字串。

## 關閉流

完成讀寫操作後，應使用 `close` 方法關閉流，以釋放資源：

```java
stream.close();
```

## 注意事項

- `NotesStream` 物件的使用限制在其創建的執行緒內。
- 確保在完成操作後關閉流，以避免資源洩漏。
- 處理檔案時，請注意字元集的選擇，以確保讀寫內容的正確性。

透過上述步驟，開發者可以在 Java 中有效地使用 `NotesStream` 類別來讀取和寫入檔案內容。
