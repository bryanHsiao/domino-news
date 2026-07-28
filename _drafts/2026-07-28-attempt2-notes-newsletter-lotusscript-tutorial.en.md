---
title: "Using NotesNewsletter in LotusScript: Creating Newsletters with Document Links"
description: "Learn how to use the NotesNewsletter class in LotusScript to create newsletters containing links to multiple documents, enabling users to access related content efficiently."
pubDate: "2026-07-28T08:04:48+08:00"
lang: "en"
slug: "notes-newsletter-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNewsletter (LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-notesnewsletter-lotusscript"
  - title: "IsDoScore (NotesNewsletter - JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-isdoscore"
  - title: "formatDocument (NotesNewsletter - JavaScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-formatdocument"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-notesnewsletter-lotusscript, https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-isdoscore, https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-formatdocument
attempt: 2
slug: notes-newsletter-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, you may need to send newsletters to users that contain links to multiple documents. LotusScript provides the `NotesNewsletter` class, which allows you to create newsletters from a collection of documents, enabling users to access related content efficiently.

## Overview of the `NotesNewsletter` Class

The `NotesNewsletter` class enables you to create newsletters from a `NotesDocumentCollection`. These newsletters can contain either renderings of documents or links to them. The class includes the following key methods:

- **`FormatDocument`**: Creates a new document containing a rendering of a specified document in the collection.
- **`FormatMsgWithDoclinks`**: Creates a newsletter document containing links to each document in the collection.

Additionally, the class has the following properties:

- **`DoScore`**: Indicates whether the newsletter includes the relevance score for each document.
- **`DoSubject`**: Indicates whether the newsletter includes a string describing the subject of each document.
- **`SubjectItemName`**: Specifies the name of the item containing the text to use as a subject line.

## Creating a Newsletter with Document Links Using `NotesNewsletter`

Here are the steps to create a newsletter containing links to multiple documents using the `NotesNewsletter` class:

1. **Obtain the Document Collection**:

   ```lotusscript
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Dim view As NotesView
   Dim docCollection As NotesDocumentCollection

   Set db = session.CurrentDatabase
   Set view = db.GetView("YourViewName")
   Set docCollection = view.AllDocuments
   ```

2. **Create the `NotesNewsletter` Object**:

   ```lotusscript
   Dim newsletter As New NotesNewsletter(docCollection)
   ```

3. **Set Newsletter Properties** (Optional):

   ```lotusscript
   newsletter.DoScore = True
   newsletter.DoSubject = True
   newsletter.SubjectItemName = "Subject"
   ```

4. **Format the Newsletter and Send**:

   ```lotusscript
   Dim mailDb As NotesDatabase
   Dim mailDoc As NotesDocument

   Set mailDb = session.GetDatabase("", "mail\yourmailfile.nsf")
   Set mailDoc = newsletter.FormatMsgWithDoclinks(mailDb)

   mailDoc.Send False, "recipient@example.com"
   ```

In the code above, we first obtain a collection of documents from a specified view. We then create a `NotesNewsletter` object using this collection. Next, we set the newsletter's properties to include relevance scores and subject descriptions. Finally, we format the newsletter with document links and send it to the specified recipient.

## Important Considerations

- **`DoScore` Property**: This property applies only to newsletters with sorted collections, such as those produced by a call to the `FTSearch` method. If the collection is unsorted, this property has no effect.

- **`FormatDocument` Method**: This method creates a new document containing a rendering of a specified document in the collection, similar to forwarding a document.

- **`FormatMsgWithDoclinks` Method**: This method creates a newsletter document containing links to each document in the collection, allowing users to access related documents efficiently.

By utilizing the `NotesNewsletter` class, you can effectively create newsletters in LotusScript that provide users with convenient access to multiple related documents, enhancing user experience and information dissemination.

References:

- [NotesNewsletter (LotusScript)](https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-notesnewsletter-lotusscript)
- [IsDoScore (NotesNewsletter - JavaScript)](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-isdoscore)
- [formatDocument (NotesNewsletter - JavaScript)](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=newsletter-formatdocument)
