---
title: "使用 Java 操作 NotesRichTextNavigator：深入解析"
description: "本教程深入探討如何在 Java 中使用 NotesRichTextNavigator 類別，以有效地遍歷和操作 HCL Domino 中的富文本內容。"
pubDate: "2026-06-28T07:27:15+08:00"
lang: "zh-TW"
slug: "notes-rich-text-navigator-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Designer"
sources:
  - title: "Java Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html"
  - title: "Java/CORBA Classes"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_JAVA_NOTES_CLASSES_JAVA.html"
  - title: "Supporting components"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SUPPORTING_COMPONENTS_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_JAVA_NOTES_CLASSES_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-rich-text-navigator-java
-->

## 簡介

在 HCL Domino 應用程式開發中，富文本（Rich Text）是常見的資料類型。Java 開發者可以利用 `NotesRichTextNavigator` 類別來遍歷和操作富文本內容。本文將詳細介紹如何在 Java 中使用 `NotesRichTextNavigator`，並提供實際範例。

## 什麼是 NotesRichTextNavigator？

`NotesRichTextNavigator` 是 HCL Domino Java API 中的一個類別，允許開發者在 `NotesRichTextItem` 中導航，並存取其內容的不同元素，如段落、表格、附件等。透過此類別，開發者可以精確地控制和操作富文本內容。

## 初始化環境

在開始之前，請確保您的開發環境已正確配置，並包含必要的庫檔案。您需要將 `notes.jar` 添加到您的 Java 專案中，該檔案通常位於 HCL Notes 安裝目錄下的 `jvm/lib/ext` 資料夾中。

## 創建 NotesRichTextNavigator

以下是如何在 Java 中創建並使用 `NotesRichTextNavigator` 的範例：

```java
import lotus.domino.*;

public class RichTextNavigatorExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("", "example.nsf");
            Document doc = db.getDocumentByUNID("YOUR_DOCUMENT_UNID");
            RichTextItem rtItem = (RichTextItem) doc.getFirstItem("Body");
            RichTextNavigator rtNavigator = rtItem.createNavigator();

            // 遍歷富文本內容
            if (rtNavigator.findFirstElement(RichTextItem.RTELEM_TYPE_TABLE)) {
                do {
                    // 處理表格元素
                    System.out.println("找到一個表格。");
                } while (rtNavigator.findNextElement());
            }

            session.recycle();
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            NotesThread.stermThread();
        }
    }
}
```

在此範例中，我們：

1. 初始化 Notes 環境並創建會話。
2. 打開指定的資料庫和文件。
3. 獲取名為 "Body" 的富文本項目。
4. 創建 `NotesRichTextNavigator` 來遍歷富文本內容。
5. 查找並處理所有的表格元素。

## 常用方法

- `findFirstElement(int type)`: 查找指定類型的第一個元素。
- `findNextElement()`: 查找下一個元素。
- `getElement()`: 獲取當前元素。

## 注意事項

- 確保在使用完 `NotesRichTextNavigator` 後，適當地回收資源以避免記憶體洩漏。
- 在多線程環境中，請使用 `NotesThread` 來管理 Notes API 的線程安全性。

## 結論

透過 `NotesRichTextNavigator`，Java 開發者可以有效地遍歷和操作 HCL Domino 中的富文本內容。熟悉此類別的使用將有助於開發更強大和靈活的 Domino 應用程式。

更多資訊，請參閱 [Java/CORBA Classes](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_JAVA_NOTES_CLASSES_JAVA.html) 和 [Supporting components](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SUPPORTING_COMPONENTS_JAVA.html)。
