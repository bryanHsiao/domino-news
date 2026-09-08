---
title: "XPages File Upload Failing: The xspupload Temp Folder Wiped by Windows cleanmgr — Root Cause and Fixes (Including the 14.0 Fix)"
description: "The XPages file upload control does nothing — no client-side error, the page is fine, the file just doesn't upload — while the server console throws IOFileUploadException 'The system cannot find the path specified'. The root cause: Domino's upload temp folder xspupload is gone, often because Windows Disk Cleanup (cleanmgr) wiped the temp files while Domino was running. This piece ties the official KBs to real practice: the symptom and root cause, why the folder disappears, and the fixes — from the 'cycle HTTP every night' band-aid to notes_tempdir, a programmatic check-and-recreate, and upgrading to 14.0 where the defect is fixed."
pubDate: 2026-09-12T07:30:00+08:00
lang: en
slug: domino-xspupload-upload-fail
tags:
  - "Domino Designer"
  - "Domino Server"
sources:
  - title: "Attachment upload fail in Xpage when 'xspupload' temp folder doesn't exist (KB0106430, defect) — HCL Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0106430"
  - title: "Windows Cleanmgr deletes temporary application files interrupting HTTP uploads (KB0078234) — HCL Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0078234"
  - title: "XPages file upload temp folder auto-recreate (community) — dreamjtech"
    url: "https://www.dreamjtech.com/5816/"
relatedJava: []
relatedSsjs: []
---

There's a particularly maddening way for XPages uploads to break: the file upload control **seems to do nothing** — no error on the client, the page is fine, the file just doesn't go up. You check the server console and find a Java exception:

```
com.ibm.xsp.http.fileupload.FileUploadBase$IOFileUploadException:
Processing of multipart/form-data request failed.
…\notesXXXXXX\xspupload\upload_XXX_XXX.tmp (The system cannot find the path specified)
```

The community hit the same wall on 11.0.1 ([StackOverflow: xpages file upload control does nothing in 11.0.1](https://stackoverflow.com/questions/66161300/xpages-file-upload-control-does-nothing-in-11-0-1)). If you met this on R11 and ended up keeping it alive by "cycling HTTP up and down every night" — this piece is about what that actually is, and the fixes that beat a nightly restart.

---

## TL;DR

- **Root cause**: XPages uploads use a temp folder named **`xspupload`** under the OS Temp dir (a path like `…\notesXXXXXX\xspupload`). If that folder goes missing, uploads fail and the console throws `IOFileUploadException … The system cannot find the path specified`.
- **It's a defect**: per KB0106430, before 14.0 Domino does **not** auto-recreate the folder once it's deleted; it's **fixed in Domino 14.0** (SPR ASHECU5DHW).
- **Why the folder disappears**: a common culprit is Windows **Disk Cleanup `cleanmgr.exe`**, which deletes the temp files while Domino is running, taking `xspupload` with them (KB0078234).
- **Fixes, light to heavy**: restart the HTTP task (recreates the folder — that's the "restart HTTP nightly") → point `notes_tempdir` at a folder cleanmgr won't touch → disable the cleanmgr scheduled task → programmatically check-and-recreate on startup → upgrade to 14.0 and be done.

---

## Symptom and root cause: the `xspupload` temp folder is gone

Start with how the defect is officially described. [KB0106430](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0106430) (applies to Domino 9.0.x and later) is clear: when you upload via the file upload control in XPages, Domino creates an `xspupload` temp folder under the OS Temp dir (e.g. `notesXXXXXX\xspupload`); **delete that `xspupload` folder and the attachment won't upload**, with the console showing:

```
com.ibm.xsp.http.fileupload.FileUploadBase$IOFileUploadException:
Processing of multipart/form-data request failed.
C:\Windows\TEMP\notesXXXXXX\xspupload\upload_XXX_XXX.tmp (The system cannot find the path specified)
```

The KB also spells out the "should, but doesn't" behavior: **Domino ought to recreate the folder automatically when it's missing** — but (before 14.0) it doesn't, so once the folder is deleted, uploads jam. The KB's workaround is a single line: "Recreate 'xspupload' folder." This defect (SPR ASHECU5DHW) is **fixed in Release 14.0**: from 14.0, Domino recreates the folder when needed.

## Why the folder disappears on its own: Windows `cleanmgr`

The folder was fine — so why does it vanish? The most common culprit is Windows' built-in Disk Cleanup, **`cleanmgr.exe`**. [KB0078234](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0078234) (applies to Domino 9.0.x, 10.0.x, 11.0.x and later) nails the cause:

> "Windows cleanmgr.exe task deleted all the temp files from the Domino temp folder. These include temporary application files as well which will cause all the applications to fail."

That is: the `cleanmgr` scheduled task, **while Domino is still running**, clears out the Domino temp folder — **taking the in-use `xspupload` with it** — so every app's uploads break. The console shows the same `IOFileUploadException … The system cannot find the path specified` as KB0106430; this one just names who deleted it.

## Fixes: from "restart nightly" to a real cure

One illness, several medicines, crudest to most thorough:

**1. Restart the HTTP task (band-aid).** KB0078234 says it plainly: "Restarting the HTTP task will recreate the application when it is loaded again and will workaround the issue." — restarting HTTP recreates the folder. **The R11 "cycle HTTP up and down every night" is exactly this**: it works, but it treats the symptom — it just puts the folder back before the next cleanmgr run.

**2. Move temp somewhere cleanmgr won't touch with `notes_tempdir`.** The same KB's second workaround: "create a new folder and use the notes_tempdir parameter to point tmp files to that folder." — make a folder, set `notes_tempdir` in notes.ini to point at it, so Domino's temp files don't sit in the system Temp that cleanmgr sweeps.

**3. Disable the cleanmgr task outright.** If you'd rather not touch the Domino side, the KB offers it too: disable the `cleanmgr.exe` scheduled task on the Windows server. Remove the source and the folder stops being deleted.

**4. Self-heal in code: check on startup, recreate if missing.** Once you know the root cause, the app can look after itself. The [community approach](https://www.dreamjtech.com/5816/) is to check, at the XPages app's startup (e.g. `onStart`), whether the upload temp folder exists and `mkdirs` it (plus read/write/execute permissions) if not:

```groovy
import java.io.File
def tmpDirPath = context.getServletContext()
        .getInitParameter('com.ibm.xsp.upload.tmp.dir') ?: 'xspupload'
def tmpDir = new File(tmpDirPath)
if (!tmpDir.exists()) {
    tmpDir.mkdirs()
    tmpDir.setExecutable(true, false)
    tmpDir.setReadable(true, false)
    tmpDir.setWritable(true, false)
}
```

The idea is simple: **test whether the folder exists, recreate it if not.** One caveat: the real `xspupload` path lives under `NOTES_TEMPDIR` (or the system %TEMP%) as `notesXXXXXX\xspupload`, and the snippet above is one community way to hang the recreate on the app lifecycle — before adopting it, confirm in your environment that the path it resolves to really is that upload folder.

**5. The permanent cure: upgrade to 14.0.** This was a defect all along, and from 14.0 Domino recreates the folder automatically (KB0106430). If you can upgrade, you stop playing cat-and-mouse with cleanmgr.

## Wrap-up

An XPages upload that "does nothing" is nine times out of ten not a broken control — it's that the `xspupload` temp folder it needs got wiped, often by Windows `cleanmgr` sweeping it up while Domino ran. The order of diagnosis: recognize the `IOFileUploadException … The system cannot find the path specified` in the console to confirm the illness; short term, keep it alive with an HTTP restart or a programmatic recreate; medium term, cut the source with `notes_tempdir` or by disabling cleanmgr; and if you can upgrade, go to 14.0 for the real fix. This is the flip side of a prerequisite the [series opener](/domino-news/en/posts/domino-attachments-three-ways) noted for the File Upload Control — **the server needs a working temp directory** for attachments to land in; this piece is the full troubleshooting for when that directory goes wrong.
