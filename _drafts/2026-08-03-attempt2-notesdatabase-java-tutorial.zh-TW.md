---
title: "使用 Java 操作 NotesDatabase：從連線到事務管理"
description: "本教程介紹如何在 Java 中使用 NotesDatabase 類別，涵蓋連線、讀取、寫入和事務管理等操作。"
pubDate: "2026-08-03T08:03:34+08:00"
lang: "zh-TW"
slug: "notesdatabase-java-tutorial"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "NotesDatabase class (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Accessing Domino databases"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WAYS_TO_ACCESS_NOTES_DATABASES.html"
  - title: "Transaction methods for LotusScript and Java Database classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/wn_database_transaction_methods.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESDATABASE_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdatabase-java-tutorial
-->

## 簡介

在 HCL Domino 開發中，`NotesDatabase` 類別是操作資料庫的核心。透過 Java，開發者可以連線到 Domino 資料庫，執行讀取、寫入和事務管理等操作。本文將介紹如何在 Java 中使用 `NotesDatabase` 類別，並提供實際範例。

## 連線到資料庫

要在 Java 中連線到 Domino 資料庫，首先需要建立一個 `Session` 物件，然後使用 `getDatabase` 方法取得 `Database` 物件。

```java
import lotus.domino.*;

public class DominoDatabaseExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("伺服器名稱", "資料庫路徑");
            if (db.isOpen()) {
                System.out.println("成功連線到資料庫：" + db.getTitle());
            } else {
                System.out.println("無法開啟資料庫。");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            NotesThread.stermThread();
        }
    }
}
```

在上述程式碼中，`NotesThread.sinitThread()` 和 `NotesThread.stermThread()` 用於初始化和終止 Notes 執行緒，確保多執行緒環境下的安全性。

## 讀取和寫入文檔

連線到資料庫後，可以讀取和寫入文檔。以下範例展示如何創建新文檔並讀取其內容。

```java
import lotus.domino.*;

public class DocumentExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("伺服器名稱", "資料庫路徑");
            if (db.isOpen()) {
                // 創建新文檔
                Document doc = db.createDocument();
                doc.replaceItemValue("Form", "表單名稱");
                doc.replaceItemValue("Subject", "這是主題");
                doc.save();
                System.out.println("文檔已保存，UNID：" + doc.getUniversalID());

                // 讀取文檔
                Document readDoc = db.getDocumentByUNID(doc.getUniversalID());
                System.out.println("讀取文檔主題：" + readDoc.getItemValueString("Subject"));
            } else {
                System.out.println("無法開啟資料庫。");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            NotesThread.stermThread();
        }
    }
}
```

## 事務管理

從 HCL Domino 12 開始，`NotesDatabase` 類別新增了事務管理方法，包括 `transactionBegin`、`transactionCommit` 和 `transactionRollback`。這些方法允許開發者在資料庫操作中使用事務，確保操作的原子性。

```java
import lotus.domino.*;

public class TransactionExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("伺服器名稱", "資料庫路徑");
            if (db.isOpen()) {
                db.transactionBegin();
                try {
                    Document doc1 = db.createDocument();
                    doc1.replaceItemValue("Form", "表單名稱");
                    doc1.replaceItemValue("Subject", "第一個文檔");
                    doc1.save();

                    Document doc2 = db.createDocument();
                    doc2.replaceItemValue("Form", "表單名稱");
                    doc2.replaceItemValue("Subject", "第二個文檔");
                    doc2.save();

                    db.transactionCommit();
                    System.out.println("事務已提交。");
                } catch (NotesException e) {
                    db.transactionRollback();
                    System.out.println("事務已回滾。");
                    e.printStackTrace();
                }
            } else {
                System.out.println("無法開啟資料庫。");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            NotesThread.stermThread();
        }
    }
}
```

在此範例中，`transactionBegin` 方法開始一個事務，`transactionCommit` 方法提交事務，`transactionRollback` 方法在發生異常時回滾事務。

## 結論

透過 Java 使用 `NotesDatabase` 類別，開發者可以有效地連線到 HCL Domino 資料庫，執行讀取、寫入和事務管理等操作。熟悉這些方法將有助於開發高效且可靠的 Domino 應用程式。

有關更多資訊，請參閱 [NotesDatabase 類別](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESDATABASE_CLASS.html) 和 [事務方法](https://help.hcl-software.com/dom_designer/12.0.0/basic/wn_database_transaction_methods.html)。
