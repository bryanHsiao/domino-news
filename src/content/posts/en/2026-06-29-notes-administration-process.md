---
title: "NotesAdministrationProcess: Filing AdminP Requests from LotusScript"
description: "Renaming a user, deleting one cleanly, recertifying, moving a mail file, changing an Internet password — these are AdminP jobs you'd normally click through in the Administration client. NotesAdministrationProcess files those same requests from code into admin4.nsf. This article covers session.CreateAdministrationProcess, the request methods and their note-ID return value, the certifier properties, and the three things that trip people up: it needs unrestricted rights, it's asynchronous, and '*' means 'no change'."
pubDate: 2026-06-29T07:30:00+08:00
lang: en
slug: notes-administration-process
tags:
  - "LotusScript"
  - "Admin"
  - "Tutorial"
sources:
  - title: "NotesAdministrationProcess class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESADMINISTRATIONPROCESS_CLASS.html"
  - title: "RenameNotesUser method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RENAMENOTESUSER_METHOD_ADMINP.html"
  - title: "DeleteUser method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DELETEUSER_METHOD_ADMINP.html"
relatedJava: ["AdministrationProcess"]
relatedSsjs: []
---

A user gets married and changes their last name. In the Administration client you'd open the person document, pick Rename, and let the Administration Process (AdminP) ripple the change through every database's ACL, Reader/Author fields, and group memberships over the next few hours. Now imagine you need to do that for 200 users from an HR feed. Clicking is not the answer.

[`NotesAdministrationProcess`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESADMINISTRATIONPROCESS_CLASS.html) is the LotusScript door to AdminP. It doesn't *do* the administrative work itself — it files a request into the Administration Requests database (`admin4.nsf`), and the AdminP server task picks it up and executes it later. The class description is a one-liner — "Represents the administration process" — but what it gives you is the ability to script the routine directory and server chores you'd otherwise do by hand.

---

## TL;DR

- Get the object from the session: `Set adminp = session.CreateAdministrationProcess(server$)` — `server$` is the server holding `admin4.nsf`, and an **empty string means the local machine**.
- Each request method (`RenameNotesUser`, `DeleteUser`, `RecertifyUser`, `MoveMailUser`, `ChangeHTTPPassword`, …) **files a request and returns the note ID** of the request document — not a completion signal.
- It's **asynchronous**: your code enqueues; the AdminP server task does the work later. The returned note ID is your handle on the request, nothing more.
- It needs **unrestricted agent / server rights** — a normal user agent can't file these.
- In `RenameNotesUser`, a name part of **`*` means "leave unchanged"**.
- Certifier-issuing requests (like `RecertifyUser`) need a certifier set first — either `CertifierFile` + `CertifierPassword`, or route through the CA with `UseCertificateAuthority`.
- **New with Release 6.**

## Getting the object

There's no constructor — you ask the session for it, naming the server whose `admin4.nsf` should receive the requests:

```lotusscript
Dim session As New NotesSession
Dim adminp As NotesAdministrationProcess
' "" = this server's admin4.nsf; pass a server name to target a remote one
Set adminp = session.CreateAdministrationProcess("")
```

## Filing requests

Every request method enters a document into `admin4.nsf` and hands back its note ID. The ones you'll reach for most:

| Method | What it files |
|---|---|
| `RenameNotesUser` | A request to rename a Notes user |
| `DeleteUser` | A request to delete a user (with mail-file and ID-vault handling) |
| `RecertifyUser` | A request to recertify a user (needs a certifier) |
| `MoveMailUser` | A request to move a user's mail file to a new home server |
| `ChangeHTTPPassword` | A change to a user's Internet (HTTP) password |

The docs describe each in the same shape — e.g. [`RenameNotesUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RENAMENOTESUSER_METHOD_ADMINP.html) "Enters a request in the Administration Requests database to rename a user." The pattern is always *file now, execute later*.

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim adminp As NotesAdministrationProcess
  Dim noteID As String
  Set adminp = session.CreateAdministrationProcess("")

  ' Rename: change only the last name; "*" leaves the other parts as they are
  noteID = adminp.RenameNotesUser("CN=Jane Doe/O=Acme", "Smith", "*", "*", "*")
  Print "Rename request filed: " & noteID

  ' Change a user's Internet (HTTP) password
  noteID = adminp.ChangeHTTPPassword("CN=Jane Doe/O=Acme", "oldPass!", "newPass!")
  Print "HTTP password request filed: " & noteID
End Sub
```

*(The official pages don't ship a complete worked example for this class, so the snippet above is assembled from the verified method signatures — every call and parameter is doc-grounded.)*

`RenameNotesUser`'s `*`-means-no-change convention is worth internalising: you always pass the full name-part list, using `*` for the parts you're leaving alone. [`DeleteUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DELETEUSER_METHOD_ADMINP.html) takes a mail-file action (`MAILFILE_DELETE_NONE` / `_HOME` / `_ALL`) and an ID-vault action so you control whether the mail file and vaulted ID are removed alongside the person.

## Certifiers and the CA

Requests that issue or renew certificates — recertifying a user, for instance — need a certifier identity first. Two routes:

```lotusscript
' Route 1: a certifier ID file on disk
adminp.CertifierFile = "c:\domino\data\cert.id"
adminp.CertifierPassword = "certPassword"
Call adminp.RecertifyUser("CN=Jane Doe/O=Acme")

' Route 2: the Certificate Authority process
adminp.UseCertificateAuthority = True
adminp.CertificateAuthorityOrg = "Acme"
Call adminp.RecertifyUser("CN=Jane Doe/O=Acme")
```

When the CA processes a request, the method returns an **empty string** instead of a note ID — the request is handled by the CA flow rather than landing as a normal admin request document, so don't treat the empty return as a failure.

## Three things that trip people up

**1. Unrestricted rights are mandatory.** Every method requires unrestricted agent / server access. A scheduled agent that files admin requests must be signed by an ID with that privilege, or the calls fail. This is by design — filing a rename or delete is a privileged operation.

**2. It's asynchronous — the note ID is not "done".** The method returns the moment the request document is written. The actual rename/delete/move happens whenever the AdminP server task next runs and processes that request (and many requests cascade into follow-up requests over hours). If you need to confirm completion, you watch the request document's status in `admin4.nsf`, not the return value.

**3. `server$` empty means local.** Pass `""` to file into the current server's `admin4.nsf`; pass a server name to target a remote one. Getting this wrong files requests into the wrong queue.

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| LotusScript | `NotesAdministrationProcess` | `session.CreateAdministrationProcess(server)` |
| Java | `lotus.domino.AdministrationProcess` | `session.createAdministrationProcess(server)` |
| SSJS / XPages | (same back-end class via `session`) | `session.createAdministrationProcess(server)` |

The Java back-end API mirrors this class method-for-method (`renameNotesUser`, `deleteUser`, …). There's no distinct SSJS wrapper — XPages code reaches the same Domino back-end object through the session, so in practice it's the Java surface. Either way, the same rule holds: you're filing requests for AdminP to execute, not performing the administration inline.
