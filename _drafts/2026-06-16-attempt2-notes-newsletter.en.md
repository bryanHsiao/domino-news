---
title: "Creating a Domino Newsletter Using the NotesNewsletter Class"
description: "Learn how to use the NotesNewsletter class in LotusScript to create newsletters that compile summaries and links from multiple documents."
pubDate: "2026-06-16T07:39:34+08:00"
lang: "en"
slug: "notes-newsletter"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "Making a Domino newsletter"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_MAKING_A_NOTES_NEWSLETTER.html"
  - title: "FormatDocument (NotesNewsletter - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_FORMATDOCUMENT_METHOD.html"
  - title: "SubjectItemName (NotesNewsletter - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_SUBJECTITEMNAME_PROPERTY.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_MAKING_A_NOTES_NEWSLETTER.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-newsletter
-->

## Introduction

In HCL Domino, a newsletter is a document that compiles summaries and links from multiple documents, allowing users to quickly browse and access related content. Using the `NotesNewsletter` class in LotusScript, we can programmatically create such newsletters, consolidating information from various documents into a single document, which can optionally be sent to specific recipients.

## Steps to Create a Newsletter

1. **Create a NotesNewsletter Object**:

   Use the `CreateNewsletter` method of `NotesSession`, passing in a `NotesDocumentCollection` containing the target documents, to create a `NotesNewsletter` object.

   ```lotusscript
   Dim session As New NotesSession
   Dim db As NotesDatabase
   Dim collection As NotesDocumentCollection
   Dim newsletter As NotesNewsletter

   Set db = session.CurrentDatabase
   Set collection = db.AllDocuments
   Set newsletter = session.CreateNewsletter(collection)
   ```

2. **Set Newsletter Properties**:

   Configure the newsletter's properties as needed, such as whether to include subjects, relevance scores, etc.

   ```lotusscript
   newsletter.DoSubject = True
   newsletter.SubjectItemName = "Subject"
   newsletter.DoScore = False
   ```

   - `DoSubject`: Determines whether each document's subject is included in the newsletter.
   - `SubjectItemName`: Specifies the name of the item in each source document that contains the subject.
   - `DoScore`: Determines whether each document's relevance score is included in the newsletter.

3. **Format the Newsletter**:

   Use the `FormatMsgWithDoclinks` method to format the newsletter as a message containing document links.

   ```lotusscript
   Dim newsletterDoc As NotesDocument
   Set newsletterDoc = newsletter.FormatMsgWithDoclinks(db)
   ```

   This method creates a new document in the specified database containing links to each document in the collection.

4. **Send the Newsletter**:

   Set the recipients of the newsletter and use the `Send` method to send it.

   ```lotusscript
   newsletterDoc.Send False, "recipient@example.com"
   ```

   - The first parameter `False` indicates not to save a copy.
   - The second parameter is the recipient's email address, which can be a single address or an array.

## Considerations

- **Saving the Newsletter**: If you need to keep a copy of the newsletter, use the `Save` method before sending.

  ```lotusscript
  Call newsletterDoc.Save(True, False)
  ```

- **Choosing the Formatting Method**:

  - `FormatDocument`: Creates a newsletter containing the content of specified documents.
  - `FormatMsgWithDoclinks`: Creates a newsletter containing links to documents.

  Choose the appropriate method based on your requirements.

## Conclusion

By utilizing the `NotesNewsletter` class, we can programmatically create and send newsletters in HCL Domino, consolidating information from multiple documents into a single document for easy access and browsing. For more details, refer to [Making a Domino newsletter](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_MAKING_A_NOTES_NEWSLETTER.html) and the [FormatDocument method](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_FORMATDOCUMENT_METHOD.html).
