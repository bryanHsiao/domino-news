---
title: "Multi-File Upload and Batch Delete in Domino: Classic Web, XPages 14.5.1, and Clearing Attachments in One Line"
description: "The last piece covered attaching one file three ways; this one goes to 'many at once': a classic web form uses the HTML5 multiple attribute to select several files, XPages only got native multi-select by default in 14.5.1 (before that it was OpenNTF community controls), and the rarely-covered batch delete — doc.RemoveItem(\"$FILE\") clears every attachment on a document in one line. With a figure showing how the selected files land in one rich text field."
pubDate: 2026-09-09T07:30:00+08:00
lang: en
slug: domino-attachments-bulk
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "XPages support for multiple file uploads — HCL Domino 14.5.1 What's new"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html"
  - title: "RemoveItem method (NotesDocument) — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVEITEM_METHOD.html"
  - title: "Remove method (NotesEmbeddedObject) — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVE_METHOD_OBJECT.html"
  - title: "Old-school Domino web dev — upload multiple files, just one word (Jesper Kiaer, nevermind.dk)"
    url: "https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word"
  - title: "XPages Multiple File Uploader (Mark Leusink) — OpenNTF"
    url: "https://www.openntf.org/internal/home.nsf/project.xsp?action=openDocument&name=XPages+Multiple+File+Uploader"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: []
---

The [last piece](/domino-news/en/posts/domino-attachments-three-ways) finished "attach **one** file in three contexts." Real needs usually go one step further: upload **many** files at once, and the reverse — clear **all** of a document's attachments in one go. Both have a recent wrinkle worth telling: XPages only got native multi-select in 14.5.1, and batch delete has a one-liner that's rarely mentioned.

Let's pin the conclusion with a figure first: however many files you pick, they all land in the same rich text field of the same document as multiple `$FILE` attachments — which is also why "clear them all" can be done in one shot.

![Multiple selected files all land in one Body rich text field on the document as multiple $FILE attachments; doc.RemoveItem("$FILE") removes all $FILE items at once, clearing every attachment on the document](/domino-news/post-images/domino-multi-file-attachments-en.svg)

---

## TL;DR

- **Classic web form**: selecting multiple files at once comes from the HTML5 `multiple` attribute — [the blogger's "one word"](https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word). Add it to the File Upload control and the picker goes from single to multi-select.
- **XPages**: **native only since Domino 14.5.1** — "[The XPages file upload UI now supports multiple selections by default](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)." Before that, multi-file was the domain of OpenNTF community controls.
- **Batch delete has a one-liner**: `Call doc.RemoveItem("$FILE")` removes every item named `$FILE` at once — i.e. clears all of a document's attachments; the other route is looping `EmbeddedObjects` and calling `Remove`.
- **One honest caveat**: whether the classic-web trick stores each of the multiple files as its own separate `$FILE` isn't backed by an official doc — only the author's field claim. If you rely on it, test it in your own environment.

## Multi-file upload (1): the classic-web "one word"

A classic web form's File Upload Control is one file at a time by default. [Jesper Kiaer of nevermind.dk](https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word) points out a one-word old-school fix: add the HTML5 **`multiple`** attribute to the upload control (the `<input type="file">` it generates), and the picker switches from single to multi-select. He also flags a small Designer quirk — **the attribute renders correctly only when inserted from the Designer menu**; cut-and-pasting the upload control can render it wrong.

`multiple` is pure browser behavior — it lets the user pick several files and submit them together. **But here's the honest part**: whether each of those submitted files actually lands as its own separate `$FILE` attachment on the document is **not something HCL's docs confirm** — the evidence is the author's field claim. So if you're building a production feature on this, test it in your own environment first: upload three files, then check with LotusScript whether `rtitem.EmbeddedObjects` really holds three. The trick is lightweight and worth knowing, but don't treat "each one stores as a `$FILE`" as documented.

## Multi-file upload (2): XPages got it built-in in 14.5.1

The XPages path is more interesting because it has a clear before/after.

**Before 14.5.1**: `xp:fileUpload` took one file at a time. For multi-select you reached for a community control — OpenNTF has carried a few for years, such as Mark Leusink's [XPages Multiple File Uploader](https://www.openntf.org/internal/home.nsf/project.xsp?action=openDocument&name=XPages+Multiple+File+Uploader) (early on using Flash/SWFUpload for multi-file selection and progress bars), and later Julian Buss's HTML5 multi-file upload control. These filled the official gap for a long time.

**Since 14.5.1**: HCL finally built it in. The 14.5.1 What's new says it in one line — "The XPages file upload UI now supports multiple selections by default." Note it's a change to the **default behavior**, not a new property (which is why `xp:fileUpload`'s property list didn't change) — you don't touch your XSP; upgrade and it's there. That page is terse (one sentence plus two screenshots); after multi-selecting, the files attach to the rich text field the control is bound to (the same model as a single file). The screenshots and finer detail are on [that page](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html).

So the advice today is simple: **on 14.5.1+, use the built-in multi-select**; only reach back for the OpenNTF community controls if you're on an older release and need multi-file.

## Batch delete: the rarely-mentioned one-liner

Upload done — now the reverse: how do you delete **all** of a document's attachments at once? Most tutorials only show removing one; batch is rarely covered. There are two routes.

**Route 1: clear in one line (`RemoveItem`).** Attachments live on the document as items named `$FILE`, and [`RemoveItem`'s docs state](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVEITEM_METHOD.html): "If more than one item has the specified name, all items with this name are deleted." — same-named items go all at once. So:

```lotusscript
Call doc.RemoveItem("$FILE")   ' removes every $FILE at once, clearing the document's attachments
Call doc.Save(True, False)
```

One line, no loop, and no "delete-while-iterating" skip problem. One detail to know: `$FILE` is the attachment body; if the rich text content still holds icon references pointing at attachments, deleting just `$FILE` may leave icons on screen (this is a common community caution, not verbatim official — verify for your case).

**Route 2: pick and remove (`GetAttachment` + `Remove`).** When you want to do something before deleting (back up first, or delete specific files by name), take this route. Get the attachment with `doc.GetAttachment(name)`, `Remove` it — and [the docs note](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVE_METHOD_OBJECT.html) "After calling the Remove method, you must call the Save method in NotesDocument to save the change that you made" — save after removing for it to take:

```lotusscript
Dim eo As NotesEmbeddedObject
Set eo = doc.GetAttachment("report.pdf")          ' pick one specific attachment
If Not eo Is Nothing Then
    Call eo.ExtractFile("C:\backup\report.pdf")   ' back it up first (optional)
    Call eo.Remove
    Call doc.Save(True, False)                     ' save after Remove for it to take
End If
```

When you need to **delete several by criteria**, there's a trap to avoid: **removing while iterating `EmbeddedObjects` with `ForAll` is widely considered to skip elements** (you mutate the collection, the cursor jumps). So the safe way to delete many is to **collect the file names first, then `GetAttachment(...).Remove` each**, or just use Route 1's `RemoveItem` to clear them all. That "delete-while-iterating skips" point is community consensus, not verbatim HCL, but enough people have hit it to avoid it by default. As for Formula, there's no clean "batch-delete attachments" @Command — for batch, use the LotusScript above.

## Wrap-up

"Many at once" has a recent story on both ends in Domino: on upload, classic web uses HTML5 `multiple` (lightweight — just verify the per-file `$FILE` storage yourself), and XPages got **native multi-select by default only in 14.5.1** (OpenNTF before that); on delete, `doc.RemoveItem("$FILE")` clears every attachment in one line, or `EmbeddedObjects` + `Remove` handles them one by one (just don't delete while iterating). For the "one file, three contexts" basics, see the [previous piece](/domino-news/en/posts/domino-attachments-three-ways); for the backend list/extract details, see [LotusScript attachment handling](/domino-news/en/posts/notes-embedded-object).
