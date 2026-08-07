---
title: "Using NotesNewsletter in LotusScript: A Practical Guide to Creating Newsletters"
description: "Explore how to utilize the NotesNewsletter class in LotusScript to create and format newsletters, including implementation steps and example code."
pubDate: "2026-08-07T09:42:27+08:00"
lang: "en"
slug: "notes-newsletter-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNewsletter (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html"
  - title: "CreateNewsletter (NotesSession - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_CREATENEWSLETTER_METHOD.html"
  - title: "FormatDocument (NotesNewsletter - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_FORMATDOCUMENT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-newsletter-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-newsletter-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, the **NotesNewsletter** class offers an efficient way for developers to compile multiple documents into a newsletter and format them for readability. This is particularly useful when there's a need to aggregate content from various documents and present it to users in a consolidated manner.

## Creating a NotesNewsletter

To create a new NotesNewsletter object, you can use the **CreateNewsletter** method of the **NotesSession** class. This method requires a **NotesDocumentCollection** as a parameter, which contains the documents you wish to include in the newsletter.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim docCollection As NotesDocumentCollection
Dim newsletter As NotesNewsletter

Set db = session.CurrentDatabase
Set docCollection = db.AllDocuments
Set newsletter = session.CreateNewsletter(docCollection)
```

In the code above, we first retrieve all documents from the current database and then use these documents to create a new newsletter object.

## Formatting the Newsletter

Once the newsletter is created, you can use the **FormatDocument** method to format a specific document. This method creates a new document in the specified database containing a rendering of the selected document.

```lotusscript
Dim targetDb As NotesDatabase
Dim formattedDoc As NotesDocument

Set targetDb = session.GetDatabase("", "target.nsf")
Set formattedDoc = newsletter.FormatDocument(targetDb, 1)

Call formattedDoc.Save(True, True)
```

In this snippet, we specify the target database and format the first document in the newsletter. Note that the second parameter of the **FormatDocument** method is an integer indicating the position of the document in the collection.

## Setting the Subject Line

If you want to include a subject line in the newsletter, you can use the **SubjectItemName** property to specify the name of the item to be used as the subject. This should be used in conjunction with the **DoSubject** property.

```lotusscript
newsletter.DoSubject = True
newsletter.SubjectItemName = "Subject"
```

Here, we set **DoSubject** to True and specify "Subject" as the name of the subject item. This ensures that the newsletter includes the content of each document's "Subject" item as the subject line.

## Conclusion

By leveraging the **NotesNewsletter** class, developers can effectively create and format newsletters from multiple documents, customizing their content and format as needed. This provides a powerful tool to enhance the functionality and user experience of HCL Domino applications.

For more detailed information, refer to the [official documentation on the NotesNewsletter class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html).
