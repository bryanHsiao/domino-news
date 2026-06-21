---
title: "Manipulating Notes MIMEEntity with Java: Reading and Modifying Email Content"
description: "This tutorial demonstrates how to use Java to interact with the MIMEEntity class in HCL Domino, enabling the reading and modification of email MIME content, including accessing MIMEEntity, reading content, modifying content, and saving changes."
pubDate: "2026-06-22T07:34:21+08:00"
lang: "en"
slug: "notes-mime-entity-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "MIMEEntity (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_MIMEENTITY_CLASS_JAVA.html"
  - title: "Item (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_ITEM_CLASS_JAVA.html"
  - title: "Document (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_DOCUMENT_CLASS_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_MIMEENTITY_CLASS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-mime-entity-java
-->

In HCL Domino, email content is typically stored in MIME (Multipurpose Internet Mail Extensions) format. Using Java's `MIMEEntity` class, developers can read and modify these MIME contents. This article will guide you through accessing, reading, modifying, and saving changes to a `MIMEEntity` using Java.

## Accessing MIMEEntity

To access the MIME content of an email, first obtain the corresponding `Document`, then access the `MIMEEntity` through the `Item` object.

```java
import lotus.domino.*;

public class MIMEEntityExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("ServerName", "mailfile.nsf");
            Document doc = db.getDocumentByUNID("DocumentUNID");
            Item item = doc.getFirstItem("Body");
            if (item != null && item.getType() == Item.RICHTEXT) {
                MIMEEntity mimeEntity = item.getMIMEEntity();
                // Operate on MIMEEntity here
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

In this code, the `getFirstItem` method retrieves the "Body" `Item`, and its type is checked to ensure it's `RICHTEXT`. If so, the `getMIMEEntity` method obtains the `MIMEEntity` object.

## Reading MIMEEntity Content

Once you have the `MIMEEntity`, you can read its content. For example, to read the main part of the MIME content:

```java
Stream stream = session.createStream();
if (mimeEntity != null) {
    mimeEntity.getContentAsText(stream);
    String content = stream.readText();
    System.out.println("MIME Content: " + content);
}
```

This code uses a `Stream` object to read the text content of the `MIMEEntity` and outputs it to the console.

## Modifying MIMEEntity Content

To modify the content of a `MIMEEntity`, use the `setContentFromText` method:

```java
String newContent = "This is the new MIME content.";
mimeEntity.setContentFromText(stream, newContent, "text/plain; charset=UTF-8");
```

This code sets the `MIMEEntity` content to new text and specifies the content type and character set.

## Saving Changes

After modifying the `MIMEEntity`, save the changes:

```java
doc.save();
```

This saves all changes to the `Document`, including modifications to the `MIMEEntity`.

## Conclusion

Using Java's `MIMEEntity` class, developers can efficiently read and modify the MIME content of emails in HCL Domino. This is particularly useful for applications that need to process email content automatically. For more detailed information, refer to the official documentation for [MIMEEntity (Java)](https://help.hcl-software.com/dom_designer/14.5.1/Java/H_MIMEENTITY_CLASS_JAVA.html) and [Item (Java)](https://help.hcl-software.com/dom_designer/14.5.1/Java/H_ITEM_CLASS_JAVA.html).
