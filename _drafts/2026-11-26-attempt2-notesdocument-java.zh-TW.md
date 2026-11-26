---
title: "在 Java 中使用 NotesDocument：創建、讀取、更新和刪除文檔"
description: "深入探討如何在 Java 中使用 NotesDocument 類別進行文檔的創建、讀取、更新和刪除操作，並提供實用的程式碼範例。"
pubDate: "2026-11-26T12:44:32+08:00"
lang: "zh-TW"
slug: "notesdocument-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Designer"
sources:
  - title: "NotesDocument (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS_JAVA.html"
  - title: "NotesItem (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS_JAVA.html"
  - title: "NotesDatabase (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS_JAVA.html" was already cited by [java-acl] on 2026-11-19. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocument-java
-->

## 簡介

`NotesDocument` 類別是 HCL Domino Java API 中的核心組件，允許開發者在 Java 環境中對 Domino 資料庫中的文檔進行操作。本文將介紹如何使用 `NotesDocument` 進行文檔的創建、讀取、更新和刪除（CRUD）操作，並提供相應的程式碼範例。

## 創建新文檔

要在 Domino 資料庫中創建新文檔，首先需要獲取 `NotesDatabase` 對象，然後使用其 `createDocument` 方法創建 `NotesDocument`。

```java
import lotus.domino.*;

public class CreateDocumentExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            Document doc = db.createDocument();
            doc.replaceItemValue("Form", "MainForm");
            doc.replaceItemValue("Subject", "新文檔主題");
            doc.replaceItemValue("Body", "這是新文檔的內容。");
            doc.save();
            System.out.println("文檔已成功創建。");
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

在上述程式碼中，我們創建了一個新的文檔，設置了其表單類型、主題和內容，最後保存到資料庫中。

## 讀取現有文檔

要讀取現有文檔，可以使用 `NotesDatabase` 的 `getDocumentByUNID` 方法，通過文檔的唯一標識符（UNID）獲取文檔。

```java
import lotus.domino.*;

public class ReadDocumentExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            Document doc = db.getDocumentByUNID("UNID_STRING");
            if (doc != null) {
                String subject = doc.getItemValueString("Subject");
                String body = doc.getItemValueString("Body");
                System.out.println("主題: " + subject);
                System.out.println("內容: " + body);
            } else {
                System.out.println("未找到文檔。");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

此程式碼通過 UNID 獲取文檔，並讀取其主題和內容。

## 更新文檔

要更新現有文檔，可以獲取文檔對象，修改其項目值，然後保存更改。

```java
import lotus.domino.*;

public class UpdateDocumentExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            Document doc = db.getDocumentByUNID("UNID_STRING");
            if (doc != null) {
                doc.replaceItemValue("Subject", "更新後的主題");
                doc.replaceItemValue("Body", "這是更新後的內容。");
                doc.save();
                System.out.println("文檔已成功更新。");
            } else {
                System.out.println("未找到文檔。");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

此程式碼更新了文檔的主題和內容，並保存了更改。

## 刪除文檔

要刪除文檔，可以獲取文檔對象，然後調用其 `remove` 方法。

```java
import lotus.domino.*;

public class DeleteDocumentExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            Document doc = db.getDocumentByUNID("UNID_STRING");
            if (doc != null) {
                doc.remove(true);
                System.out.println("文檔已成功刪除。");
            } else {
                System.out.println("未找到文檔。");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

此程式碼刪除了指定的文檔。

## 注意事項

- **保存更改**：在創建、更新或刪除文檔後，必須調用 `save` 方法以確保更改被保存到資料庫中。
- **錯誤處理**：在操作文檔時，應適當處理可能出現的 `NotesException`，以確保程式的穩定性。

通過上述示例，開發者可以在 Java 環境中有效地使用 `NotesDocument` 類別對 HCL Domino 資料庫中的文檔進行 CRUD 操作。更多詳細信息，請參閱 [NotesDocument (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS_JAVA.html) 和 [NotesItem (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS_JAVA.html) 的官方文檔。
