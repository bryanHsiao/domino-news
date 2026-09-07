---
title: "File Attachments in Domino Three Ways: Notes Client, Classic Web Form, and XPages"
description: "Attaching a file in the Notes client is so easy it barely feels like a feature — drag it into a rich text field, done. But move that same need to the web, or into XPages, and 'how do users upload a file' becomes three different answers: the client uses a rich text field, a classic web form uses the File Upload Control embedded element, and XPages uses xp:fileUpload paired with xp:fileDownload. This piece lines up the three front-end upload mechanisms and points out the reassuring part — all three land as an attachment on the same rich text field of the document, so the backend code to list, extract, and delete them is shared."
pubDate: 2026-09-08T07:30:00+08:00
lang: en
slug: domino-attachments-three-ways
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "EmbedObject method (NotesRichTextItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EMBEDOBJECT_METHOD.html"
  - title: "Creating a file upload control (classic web) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html"
  - title: "File Upload control (xp:fileUpload) — HCL Domino Designer 14.5 XPages"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_fileupload.html"
  - title: "File Download control (xp:fileDownload) — HCL Domino Designer 14.5 XPages"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_filedownload.html"
  - title: "URL commands for opening image files, attachments, and OLE objects — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_IMAGE_FILES_ATTACHMENTS_AND_OLE_OBJECTS.html"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: []
---

How easy is attaching a file in the Notes client? Open a document, drag the file into a rich text field, let go. Done. So easy you wouldn't call it a "feature."

But the same need stops being self-evident the moment the scene changes. The boss says "this form needs to accept uploads in the browser too," or you're rewriting the app in XPages — and now "how do users upload a file" isn't one answer, it's three: one for the client, one for a classic web form, one for XPages.

The good news is that all three roads lead to the same place. Understand that "same place" and the three contexts tie together.

---

## TL;DR

- **Three front ends, one storage**: whether the user uploads from the client, a web form, or XPages, the file ends up as an attachment on a **rich text field** of the document (in LotusScript, a `NotesEmbeddedObject`).
- **Client**: a rich text field accepts attachments natively — drag one in or use the menu, no code.
- **Classic web form**: use an embedded element — the [File Upload Control](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html) (`Create - Embedded Element - File Upload Control`), which is a **web-only** control.
- **XPages**: use [`xp:fileUpload`](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_fileupload.html) to upload and `xp:fileDownload` to list and download, both **bound to the same rich text field**.
- **The backend is shared**: because everything lands in a rich text field, the LotusScript to list, extract to disk, and delete is identical across all three — the site's [LotusScript attachment handling](/domino-news/en/posts/notes-embedded-object) piece already walks it.

---

## The common ground: an attachment is an embedded object on a rich text field

Get the "same place" straight first, and the three contexts fall into line.

In Domino, an attachment isn't a loose file sitting somewhere on the document — it's a [`NotesEmbeddedObject`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EMBEDOBJECT_METHOD.html) hanging off a **rich text field**. The official definition of that class covers three things: "An embedded object, An object link, A file attachment." An attachment is one of them (`Type` = `EMBED_ATTACHMENT`). Its data is stored apart from the rich text content, but logically it lives under that field.

That's also why you can pull an attachment out over a single URL in the browser — Domino serves it under the `$File` element name:

```
http://Host/Database/View/Document/$File/Filename?OpenElement
```

Hold that model: **there are three upload front ends, but the destination is always "an attachment on some rich text field."** The three sections below are really three entrances to the same thing.

## Notes client: a rich text field, just drag it in

There's nothing to teach on the client path, and that's the point — **a rich text field accepts attachments natively**. In edit mode the user drags a file into the rich text field, or attaches it from the menu, and it's on — without you writing a line of code. That's the "so easy it isn't a feature" from the opening.

To do it in code (say, to auto-attach a generated report), you reach for [`NotesRichTextItem.EmbedObject`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EMBEDOBJECT_METHOD.html):

```lotusscript
Dim rt As NotesRichTextItem
Set rt = doc.GetFirstItem("Body")
Call rt.EmbedObject(EMBED_ATTACHMENT, "", "C:\reports\Q3.pdf")   ' EMBED_ATTACHMENT = 1454
Call doc.Save(True, False)
```

`EmbedObject`, in the docs' words: "Attaches the file you specify to a rich text item." The first argument is `EMBED_ATTACHMENT` (value 1454), the second (`class$`) is an empty string for attachments, the third is the file to attach. How you then list, extract, and remove attachments is covered fully in the site's [LotusScript attachment handling](/domino-news/en/posts/notes-embedded-object) piece, so it isn't repeated here.

## Classic web form: the File Upload Control

Put that same form in a browser and "drag into a rich text field" is off the table — the browser has no such interaction. What Domino gives a classic web form is an **embedded element**: the [File Upload Control](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html). The Designer step is direct:

> Choose Create - Embedded Element - File Upload Control.

A few things to know:

- **It's web-only**: the docs say plainly "The file upload control is not supported in Notes" — put one on the form and it does nothing in the Notes client; it renders as a file-picker only in the browser.
- **Edit mode required**: users attach a file when they "create a form or open a document in Edit mode" — same as the client, no uploading in read mode.
- **The file attaches to the document**: on submit the file becomes an attachment on the document (the same model as the client), and the server needs a configured temp directory for the attachment to land in.

To process the upload server-side (validate, rename, move to another field, notify), hang a **WebQuerySave** agent on the form and use the exact same backend API as the client — `doc.HasEmbedded`, `doc.GetAttachment(name)`, the rich text field's `EmbeddedObjects`, `ExtractFile`. To let users download an attachment back, hand them the `$File/Filename?OpenElement` [URL](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_IMAGE_FILES_ATTACHMENTS_AND_OLE_OBJECTS.html).

## XPages: xp:fileUpload with xp:fileDownload

XPages splits upload and download into two core controls used as a pair — and, crucially, both **bind to the same rich text field** of the document.

- **[`xp:fileUpload`](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_fileupload.html)**: the docs define it as "Uploads a file from the local file system." Its `value` "binds a control to a data element or other value which must be of type rich text" — i.e. a rich text field.
- **[`xp:fileDownload`](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_filedownload.html)**: "Downloads a file to the local file system." Bound to the same rich text field, it lists the attached files for the user to click and download; `rows` sets how many rows to show, and `allowDelete` decides whether users can delete attachments.

The typical shape is both controls on one XPage, `value` pointing at the same rich text field of the same document data source:

```xml
<xp:fileUpload id="fileUpload1" value="#{document1.body}" />

<xp:fileDownload id="fileDownload1" value="#{document1.body}"
    rows="30" allowDelete="true" />
```

When the user picks a file and saves the document, `xp:fileUpload` attaches it to the `body` rich text field; `xp:fileDownload` reads the list from that same field, offering download and (with `allowDelete`) removal. Binding both to the *same* field is what makes them the same set of attachments — and it's the easiest thing to wire wrong on the XPages path.

## The three contexts at a glance

| | Upload mechanism | Bound to | Delete | Backend processing |
| --- | --- | --- | --- | --- |
| **Notes client** | rich text field (drag / menu attach) | rich text field | delete in the client | shared ([7/07 piece](/domino-news/en/posts/notes-embedded-object)) |
| **Classic web form** | File Upload Control (embedded element, web-only) | attaches to the document | WebQuerySave / URL | shared |
| **XPages** | `xp:fileUpload` | rich text field (`value`) | `xp:fileDownload`'s `allowDelete` | shared |

The "upload mechanism" column differs three ways, but the last column is the same — because the destination is always an attachment on the same rich text field.

## What about Java and SSJS?

On the Java side this maps to `RichTextItem` and `EmbeddedObject` (the same "an attachment is an embedded object on a rich text item" model, with method names that line up). The XPages / SSJS side doesn't use a class for this — it uses the two controls above (`xp:fileUpload` / `xp:fileDownload`) bound to a rich text field.

## Wrap-up

"How do users upload a file" has three entrances in Domino: the client's rich text field (native, easiest), the classic web form's File Upload Control (a web-only embedded element), and XPages' `xp:fileUpload` + `xp:fileDownload` (bound to the same rich text field). Three front-end mechanisms, one destination — an attachment on a rich text field of the document. Which is why the LotusScript to list, extract, and delete afterward is one shared set across all three; the details of that set are in [LotusScript attachment handling](/domino-news/en/posts/notes-embedded-object). For a deeper look at the rich text field itself, see [Getting started with NotesRichTextItem](/domino-news/en/posts/notes-rich-text-item).
