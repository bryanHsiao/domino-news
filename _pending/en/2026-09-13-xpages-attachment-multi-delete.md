---
title: "Multi-Select Attachment Delete in XPages: Native Deletes One at a Time — Add 'Check Several, Delete on Save'"
description: "The XPages File Download control gives you one delete link per row — one attachment at a time — with no native 'check several, delete together.' Even a fully built production form lacks it. This piece first clears up something by testing: the native delete is actually 'commit on save' and well-behaved; then it adds multi-select batch delete with the same save-bounded official API (NotesXspDocument.removeAttachment), building a real check-mark, reversible, one-save implementation on a test server (Domino 12.0.2)."
pubDate: 2026-09-13T07:30:00+08:00
lang: en
slug: xpages-attachment-multi-delete
tags:
  - "Domino Designer"
  - "XPages"
  - "Tutorial"
sources:
  - title: "NotesXspDocument.removeAttachment — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/reference/r_wpdr_xsp_xspdocument_removeattachment_r.html"
  - title: "NotesXspDocument.getAttachmentList — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/reference/r_wpdr_xsp_xspdocument_getattachmentlist_r.html"
  - title: "File Download control allowDelete property — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_controls_pref_allowdelete.html"
  - title: "Creating save conflicts mixing DominoDocument and Document methods (community) — assono"
    url: "https://www.assono.de/en/blog/xpages-save-conflicts-mixing-methods"
  - title: "APAR LO68855: same-name attachment delete limitation (official support) — HCL"
    url: "https://www.ibm.com/support/pages/apar/LO68855"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: []
---

An XPages document holds several attachments and you want to drop a few of them. In the classic Notes client that's a couple of clicks, but on the XPages web the official [File Download control](https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_controls_pref_allowdelete.html) (`allowDelete="true"`) only gives you "one row, one delete link, one file at a time" — there is no native "check several, delete together." Search OpenNTF and the community and you'll find plenty of multi-file *upload* controls and read-only attachment lists, but a "select several attachments and delete them at once" is almost nowhere to be found. Even a fairly complete production XPages form I have on hand (custom upload button, hand-built download table) still has no multi-select batch delete in its list.

This piece fills that gap — and fills it the right way: **keep the "commit on save" behavior of the native XPages delete, and only add the missing multi-select.** It's the closer of the attachments series, after [multi-file upload and delete-by-criteria in LotusScript](/domino-news/en/posts/domino-attachments-bulk) and [the classic-web `%%Detach` checkbox delete](/domino-news/en/posts/domino-web-attachment-ui); this one is the XPages take.

## TL;DR

- **Native is one-at-a-time**: `xp:fileDownload`'s `allowDelete` is a per-row delete link, file by file — no multi-select batch. The community has almost nothing off-the-shelf for it either.
- **A counter-intuitive good thing**: the native XPages attachment delete actually **commits on save** (tested on Domino 12.0.2) — it's well-behaved, the opposite of a back-end LotusScript agent that changes the document before the user commits.
- **Add multi-select with the official API**: `NotesXspDocument.removeAttachment(field, name)` — the docs state "**you must save … for the change to take effect**," so it's save-bounded by design; pair it with `getAttachmentList` to enumerate.
- **Don't drop to the back end**: avoid `getDocument().getAttachment(name).remove()` — mixing the data source's save with back-end writes manufactures save conflicts.
- **Build it**: an `xp:repeat` over the attachment list + a per-row mark (collected in a `viewScope` map) + one "Save" button that commits new uploads and marked deletions **in a single save**.

## First: the native delete is actually well-behaved

Before building anything, clear up a likely misconception. You might assume the XPages attachment delete removes the file the instant you click — it doesn't. On my own box (Domino 12.0.2 FP8) I tested it: use the native File Download control to delete an attachment, then **don't save — just close and reopen the document**, and the file is still there. In other words, the native delete **commits together with the document's Save**.

That matters, because it's the opposite of the [back-end batch delete in the LotusScript piece](/domino-news/en/posts/domino-attachments-bulk): a back-end agent's `Remove` + `Save` **hits the back-end document directly and lands immediately**, changing what's on disk before the user has committed to anything. The native XPages path is well-behaved to begin with.

So the goal is clear: **keep that "commit on save" property and only add the missing multi-select** — not to rescue some correctness problem.

## The official foundation: `removeAttachment` and `getAttachmentList`

To add multi-select, use the XPages data source's (`xp:dominoDocument`) own API — no need to drop to the back end.

Enumerate attachments with `getAttachmentList(fieldName)`; the [docs](https://help.hcl-software.com/dom_designer/12.0.0/reference/r_wpdr_xsp_xspdocument_getattachmentlist_r.html) return a `java.util.List` whose elements are `NotesEmbeddedObject`:

```javascript
var atts = doc.getAttachmentList("Body");   // List<NotesEmbeddedObject>
// The official example iterates it and reads .getName() on each element
```

Delete one with `removeAttachment(fieldName, attachmentName)`; it returns a boolean, and the [doc page](https://help.hcl-software.com/dom_designer/11.0.1/reference/r_wpdr_xsp_xspdocument_removeattachment_r.html) is blunt about timing: "**You must save the document for the change to take effect in the data store.**"

```javascript
doc.removeAttachment("Body", "report.pdf");   // needs doc.save() to actually land
```

See that "must save … to take effect"? That's exactly what we want: `removeAttachment` is **save-bounded by design** — the same "commit on save" semantics as the native delete and as the classic-web `%%Detach`. Using it to add multi-select extends the good property rather than breaking it.

**One trap to avoid**: don't drop to the back end with `doc.getDocument().getAttachment(name).remove()` for convenience. [assono has a write-up](https://www.assono.de/en/blog/xpages-save-conflicts-mixing-methods) that spells it out — mixing the XPages **data source's save with back-end `Document` writes** on the same document lets the runtime's timestamp comparison store the difference as a **save-conflict document**. Staying at the data-source layer with `removeAttachment` avoids the conflict.

## Building it: check several, delete on one save

The UI is simple: an `xp:repeat` over `getAttachmentList`, a "Delete" button per row acting as a mark, marked filenames collected in a `viewScope` map; then one "Save" button that submits new uploads and the marked deletions **in a single save**.

The core delete logic (inside that save button's action):

```javascript
var del = viewScope.del;             // key = filename, value = Boolean (what the user marked)
var it = del.keySet().iterator();
while (it.hasNext()) {
  var nm = it.next();
  if (del.get(nm).toString() == "true") {
    doc.removeAttachment("Body", nm);   // remove each marked one
  }
}
doc.save();   // new uploads + deletions land in the same save
```

A few design points:

- **Marks live in `viewScope`, nothing deletes on the spot**: clicking "Delete" just marks the filename (the row strikes through and offers "Undo") — nothing touches disk until you hit "Save." That's how the native save-bounded behavior carries over to multi-select.
- **Uploads ride the same save**: the file chosen in `xp:fileUpload` is applied to `doc.Body` during the submit's Update Model phase, so that one `doc.save()` persists the new upload along with the deletions.
- **Clear the upload control after each upload**: if you don't reset `fileUpload`'s value after it uploads, the next submit re-attaches the same file and Domino renames the duplicate `-2` — a trap we actually hit and spent a while chasing. Clearing the file input's `value` in the upload's `onComplete` (a little client JS) fixes it.

Built as a minimal XPage, this runs on a test database (Domino 12.0.2). Here's the result — two marked (struck through, buttons now read "Undo"), one left normal; nothing is actually deleted until "Save changes":

![The XPages multi-select attachment delete in action: a custom "Choose file" upload button at top; an attachment list of three rows, two struck through and greyed with their buttons reading "Undo" (marked for deletion), one normal with a blue filename and a red-outlined "Delete" button; a dark green "Save changes" button at the bottom right](/domino-news/post-images/xpages-attachment-multi-delete-demo.png)

## Two limitations to know

- **Same-name files delete together**: `removeAttachment` matches by **filename**. [APAR LO68855](https://www.ibm.com/support/pages/apar/LO68855) notes the native control, when a document holds two attachments with the same name, deletes **both** when you remove one; our approach matches by name too, so same-name attachments need handling by internal identity instead. Duplicate names are uncommon in practice, but worth knowing up front.
- **No undo**: once "Save" lands the `removeAttachment`, the attachment is really gone (recoverable only from a replica/backup). So "mark now, reversible until you save" isn't just cosmetic — it's a real chance for the user to change their mind.

## Wrap-up

The native XPages attachment delete is actually not bad — **save-bounded and well-behaved** — it just **deletes one at a time**. The missing "check several, delete at once" isn't shipped by HCL and is almost absent from the community, but adding it isn't hard: the data-source-layer `removeAttachment` (save-bounded too) plus `getAttachmentList`, an `xp:repeat` with a mark, and one save button — and you get multi-select batch delete **without breaking the save boundary or manufacturing save conflicts.**

That closes the attachments series: from [multi-file upload and delete-by-criteria in LotusScript](/domino-news/en/posts/domino-attachments-bulk), to [the classic-web `%%Detach` checkbox delete](/domino-news/en/posts/domino-web-attachment-ui), to this XPages "HCL didn't ship it, so build it" multi-select. Three stacks, one principle: **deletion follows the user's save.**
