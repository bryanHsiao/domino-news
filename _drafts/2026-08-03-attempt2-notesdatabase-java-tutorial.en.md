---
title: "Working with NotesDatabase in Java: From Connection to Transaction Management"
description: "This tutorial introduces how to use the NotesDatabase class in Java, covering operations such as connecting, reading, writing, and transaction management."
pubDate: "2026-08-03T08:03:34+08:00"
lang: "en"
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

## Introduction

In HCL Domino development, the `NotesDatabase` class is central to database operations. Using Java, developers can connect to Domino databases, perform read and write operations, and manage transactions. This article will guide you through using the `NotesDatabase` class in Java with practical examples.

## Connecting to a Database

To connect to a Domino database in Java, first create a `Session` object, then use the `getDatabase` method to obtain a `Database` object.

```java
import lotus.domino.*;

public class DominoDatabaseExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("ServerName", "DatabasePath");
            if (db.isOpen()) {
                System.out.println("Successfully connected to database: " + db.getTitle());
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

In the code above, `NotesThread.sinitThread()` and `NotesThread.stermThread()` are used to initialize and terminate the Notes thread, ensuring thread safety in a multi-threaded environment.

## Reading and Writing Documents

After connecting to the database, you can read and write documents. The following example demonstrates how to create a new document and read its content.

```java
import lotus.domino.*;

public class DocumentExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("ServerName", "DatabasePath");
            if (db.isOpen()) {
                // Create a new document
                Document doc = db.createDocument();
                doc.replaceItemValue("Form", "FormName");
                doc.replaceItemValue("Subject", "This is the subject");
                doc.save();
                System.out.println("Document saved, UNID: " + doc.getUniversalID());

                // Read the document
                Document readDoc = db.getDocumentByUNID(doc.getUniversalID());
                System.out.println("Read document subject: " + readDoc.getItemValueString("Subject"));
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

## Transaction Management

Starting with HCL Domino 12, the `NotesDatabase` class introduced transaction management methods, including `transactionBegin`, `transactionCommit`, and `transactionRollback`. These methods allow developers to use transactions in database operations, ensuring atomicity.

```java
import lotus.domino.*;

public class TransactionExample {
    public static void main(String[] args) {
        try {
            NotesThread.sinitThread();
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("ServerName", "DatabasePath");
            if (db.isOpen()) {
                db.transactionBegin();
                try {
                    Document doc1 = db.createDocument();
                    doc1.replaceItemValue("Form", "FormName");
                    doc1.replaceItemValue("Subject", "First document");
                    doc1.save();

                    Document doc2 = db.createDocument();
                    doc2.replaceItemValue("Form", "FormName");
                    doc2.replaceItemValue("Subject", "Second document");
                    doc2.save();

                    db.transactionCommit();
                    System.out.println("Transaction committed.");
                } catch (NotesException e) {
                    db.transactionRollback();
                    System.out.println("Transaction rolled back.");
                    e.printStackTrace();
                }
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

In this example, the `transactionBegin` method starts a transaction, the `transactionCommit` method commits the transaction, and the `transactionRollback` method rolls back the transaction in case of an exception.

## Conclusion

By using the `NotesDatabase` class in Java, developers can effectively connect to HCL Domino databases, perform read and write operations, and manage transactions. Familiarity with these methods will aid in developing efficient and reliable Domino applications.

For more information, refer to the [NotesDatabase class](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESDATABASE_CLASS.html) and [Transaction methods](https://help.hcl-software.com/dom_designer/12.0.0/basic/wn_database_transaction_methods.html).
