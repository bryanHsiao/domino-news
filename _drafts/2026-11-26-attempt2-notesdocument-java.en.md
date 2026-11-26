---
title: "Working with NotesDocument in Java: Creating, Reading, Updating, and Deleting Documents"
description: "A comprehensive guide on using the NotesDocument class in Java to perform CRUD operations on documents within an HCL Domino database, complete with practical code examples."
pubDate: "2026-11-26T12:44:32+08:00"
lang: "en"
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

## Introduction

The `NotesDocument` class is a fundamental component of the HCL Domino Java API, enabling developers to interact with documents within a Domino database using Java. This article provides a detailed guide on performing Create, Read, Update, and Delete (CRUD) operations using the `NotesDocument` class, accompanied by practical code examples.

## Creating a New Document

To create a new document in a Domino database, first obtain a `NotesDatabase` object and then use its `createDocument` method to instantiate a `NotesDocument`.

```java
import lotus.domino.*;

public class CreateDocumentExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            Document doc = db.createDocument();
            doc.replaceItemValue("Form", "MainForm");
            doc.replaceItemValue("Subject", "New Document Subject");
            doc.replaceItemValue("Body", "This is the content of the new document.");
            doc.save();
            System.out.println("Document created successfully.");
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

In this code, a new document is created, its form type, subject, and content are set, and it is then saved to the database.

## Reading an Existing Document

To read an existing document, use the `getDocumentByUNID` method of `NotesDatabase` to retrieve the document by its Universal Note ID (UNID).

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
                System.out.println("Subject: " + subject);
                System.out.println("Body: " + body);
            } else {
                System.out.println("Document not found.");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

This code retrieves a document by its UNID and prints its subject and content.

## Updating a Document

To update an existing document, retrieve the document object, modify its item values, and then save the changes.

```java
import lotus.domino.*;

public class UpdateDocumentExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("server", "database.nsf");
            Document doc = db.getDocumentByUNID("UNID_STRING");
            if (doc != null) {
                doc.replaceItemValue("Subject", "Updated Subject");
                doc.replaceItemValue("Body", "This is the updated content.");
                doc.save();
                System.out.println("Document updated successfully.");
            } else {
                System.out.println("Document not found.");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

This code updates the subject and content of the specified document and saves the changes.

## Deleting a Document

To delete a document, retrieve the document object and call its `remove` method.

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
                System.out.println("Document deleted successfully.");
            } else {
                System.out.println("Document not found.");
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

This code deletes the specified document from the database.

## Important Considerations

- **Saving Changes**: After creating, updating, or deleting a document, you must call the `save` method to ensure that changes are committed to the database.
- **Error Handling**: Properly handle potential `NotesException` instances to maintain application stability.

By following these examples, developers can effectively use the `NotesDocument` class to perform CRUD operations on documents within an HCL Domino database using Java. For more detailed information, refer to the official documentation for [NotesDocument (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS_JAVA.html) and [NotesItem (Java)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS_JAVA.html).
