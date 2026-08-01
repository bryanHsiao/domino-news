---
title: "Manipulating NotesDocument with JavaScript: A Comprehensive Guide"
description: "Explore how to use JavaScript in HCL Domino Designer to create, read, update, and delete documents using the NotesDocument class."
pubDate: "2026-08-01T08:03:52+08:00"
lang: "en"
slug: "notesdocument-javascript-tutorial"
tags:
  - "Tutorial"
  - "JavaScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument (JavaScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/reference/r_domino_Document.html"
  - title: "NotesURL (NotesDocument - JavaScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Document_NotesURL.html"
  - title: "Lock (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_LOCK_METHOD_DOC.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdocument-javascript-tutorial
-->

In HCL Domino Designer, the `NotesDocument` class allows developers to manipulate documents within a database using JavaScript. This guide covers creating, reading, updating, and deleting documents, complete with practical examples.

## Creating a New Document

To create a new document, first obtain a reference to the target database and then use the `createDocument` method:

```javascript
var db:NotesDatabase = session.getDatabase("serverName", "databasePath");
var doc:NotesDocument = db.createDocument();
doc.replaceItemValue("Form", "FormName");
doc.replaceItemValue("FieldName", "Value");
doc.save();
```

In this example, `replaceItemValue` sets the document's field values, and `save` commits the document to the database.

## Reading an Existing Document

To read an existing document, use the `getDocumentByID` method with the document's NoteID:

```javascript
var doc:NotesDocument = db.getDocumentByID("NoteID");
var fieldValue = doc.getItemValueString("FieldName");
```

Here, `getItemValueString` retrieves the value of the specified field.

## Updating a Document

To update a document, modify its field values and save the changes:

```javascript
doc.replaceItemValue("FieldName", "NewValue");
doc.save();
```

## Deleting a Document

To delete a document, use the `remove` method:

```javascript
doc.remove(true);
```

The `true` parameter forces deletion even if the document has been modified by another user after being opened.

## Locking a Document

In multi-user environments, to prevent conflicts from simultaneous edits, use the `lock` method:

```javascript
var isLocked = doc.lock();
if (isLocked) {
    // Perform editing operations
    doc.unlock();
} else {
    // Handle inability to lock the document
}
```

In this example, `lock` attempts to lock the document, returning `true` if successful.

## Retrieving the Document's URL

Use the `getNotesURL` method to obtain the document's Notes URL:

```javascript
var notesURL = doc.getNotesURL();
```

This method returns the document's URL using the Notes protocol.

By utilizing these methods, developers can effectively manipulate `NotesDocument` objects in HCL Domino Designer using JavaScript, enabling comprehensive document management within applications.
