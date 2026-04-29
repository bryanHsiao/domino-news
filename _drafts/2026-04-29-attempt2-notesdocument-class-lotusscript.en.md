---
title: "Practical Guide to Using the NotesDocument Class in LotusScript"
description: "Explore how to utilize the NotesDocument class in LotusScript, covering document creation, modification, saving, and mailing, with practical examples."
pubDate: "2026-04-29T18:54:46+08:00"
lang: "en"
slug: "notesdocument-class-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdocument-class-lotusscript
-->

## Introduction

In HCL Domino development, the `NotesDocument` class is fundamental for handling documents within a database. Using LotusScript, developers can create, read, update, and delete documents. This guide provides a detailed walkthrough on utilizing the `NotesDocument` class, accompanied by practical examples.

## Creating a New Document

To create a new document in the current database, first obtain a reference to the current database, then use the `New NotesDocument` method.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
```

In this example, `session.CurrentDatabase` returns a reference to the current database, and `New NotesDocument(db)` creates a new document within that database.

## Setting Document Properties

After creating the document, you can set its properties, such as the subject and body.

```lotusscript
doc.Form = "Memo"
doc.Subject = "Meeting Notice"
doc.Body = "Please be informed that a department meeting is scheduled for 10 AM tomorrow."
```

Setting the `Form` property to "Memo" ensures that the document is displayed as an email in the user interface.

## Saving the Document

Once the properties are set, save the document.

```lotusscript
Call doc.Save(True, True)
```

The `Save` method's first parameter indicates whether to perform an automatic save, and the second parameter specifies whether to force the save.

## Mailing the Document

To send the document as an email, use the `Send` method.

```lotusscript
Call doc.Send(False, "Recipient Name")
```

The first parameter of this method indicates whether to save a copy, and the second parameter is the recipient's name or address.

## Conclusion

The `NotesDocument` class offers robust functionality, enabling developers to efficiently manage documents within HCL Domino databases using LotusScript. By following the steps outlined above, you can create, set properties, save, and mail documents to meet various application requirements.

For more detailed information, refer to the [NotesDocument (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) and [Examples: NotesDocument class](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html).
