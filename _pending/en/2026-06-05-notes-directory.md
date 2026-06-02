---
title: "NotesDirectory + NotesDirectoryNavigator: Querying the Domino Directory from LotusScript"
description: "The Domino Directory is the source of truth for every user, group, and server in your Notes environment. LotusScript's NotesDirectory provides a high-level query API — no need to open names.nsf yourself and walk a view. This article covers obtaining the object via session.GetDirectory, LookupNames for targeted field lookups, LookupAllNames for full scans, GetMailInfo for retrieving mail server information, CreateNavigator for walking cached results with NotesDirectoryNavigator, and the SearchAllDirectories / LimitMatches properties that control performance and result count."
pubDate: 2026-06-05T07:30:00+08:00
lang: en
slug: notes-directory
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDirectory class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS.html"
  - title: "NotesDirectoryNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS.html"
  - title: "GetDirectory method (NotesSession) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDIRECTORY_METHOD.html"
relatedJava: ["Directory", "DirectoryNavigator"]
relatedSsjs: []
---

Your agent needs to look up a user's mail server, check group membership, or verify that a Notes name exists. The instinct is `db.GetView("($Users)")` and scan — but that means opening names.nsf manually, managing view caching, and accounting for multiple directory sources (primary + extended + LDAP).

LotusScript's [`NotesDirectory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS.html) handles all that transparently. It's a high-level directory query API available since Notes 7 — the server may have one directory or ten, and this class abstracts the structure away.

---

## TL;DR

- `NotesDirectory` is the high-level directory query API — no need to open names.nsf yourself
- **Entry point**: [`session.GetDirectory(serverName)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDIRECTORY_METHOD.html) — empty string `""` means local
- **`LookupNames(view, names, items)`** — specify a view, a batch of names, and which fields to fetch; results are cached in the object
- **`LookupAllNames`** — scans every name in a view
- **[`GetMailInfo(name)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETMAILINFO_METHOD.html)** — retrieves mail server and mail file path for a user in one call
- **Walk results with `NotesDirectoryNavigator`** — `FindFirstName` / `FindNextName` / `GetFirstItemValue`
- `LimitMatches = True` caps results at 50 (performance guard); `SearchAllDirectories = True` searches all configured directories

---

## Getting a NotesDirectory object

```lotusscript
Dim session As New NotesSession

' Query the local server's directory
Dim dir As NotesDirectory
Set dir = session.GetDirectory("")

' Query a specific server's directory
Set dir = session.GetDirectory("MailServer/ACME")

Print "Directory server: " & dir.Server
```

---

## LookupNames — fetch specific fields for named entries

```lotusscript
' Look up FullName, MailServer, MailFile for two people
Dim names(1) As String
names(0) = "John Smith"
names(1) = "Alice Chen"

Dim items(2) As String
items(0) = "FullName"
items(1) = "MailServer"
items(2) = "MailFile"

' LookupNames caches the results in the dir object
Call dir.LookupNames("($Users)", names, items)

' Build a navigator to walk the results
Dim nav As NotesDirectoryNavigator
Set nav = dir.CreateNavigator()

If nav.FindFirstName() Then
    Do
        Print "Name: " & nav.GetFirstItemValue()
        If nav.FindFirstItem("MailServer") Then
            Print "Mail server: " & nav.GetFirstItemValue()
        End If
        If nav.FindFirstItem("MailFile") Then
            Print "Mail file: " & nav.GetFirstItemValue()
        End If
    Loop While nav.FindNextName()
End If
```

---

## GetMailInfo — fast mail routing lookup

Instead of a manual `LookupNames`, `GetMailInfo` retrieves a user's mail configuration in one call:

```lotusscript
Dim mailInfo As Variant
mailInfo = dir.GetMailInfo("John Smith")

' mailInfo(0) = MailServer (e.g. "MailServer/ACME")
' mailInfo(1) = MailFile   (e.g. "mail/jsmith.nsf")
' mailInfo(2) = MailDomain
' mailInfo(3) = MailSystem (constant: MAIL_NOTES_TYPE = 1)

If Not IsNull(mailInfo) Then
    Print "Mail server: " & mailInfo(0)
    Print "Mail file: " & mailInfo(1)
End If
```

This is the most practical method in day-to-day use — any time you need to open a user's mail.nsf, auto-forward, or look up routing info, `GetMailInfo` saves the manual lookup.

---

## LookupAllNames — scan a whole view

```lotusscript
Dim items(0) As String
items(0) = "FullName"

' Scan every entry in $Users
Call dir.LookupAllNames("($Users)", items)

Dim nav As NotesDirectoryNavigator
Set nav = dir.CreateNavigator()

Dim count As Integer
count = 0
If nav.FindFirstName() Then
    Do
        count = count + 1
    Loop While nav.FindNextName()
End If
Print "Directory has " & count & " users"
```

Note: when `LimitMatches = True`, only the first 50 results are returned. Set `dir.LimitMatches = False` before a full scan, but be aware of the performance cost on large directories.

---

## Walking results with NotesDirectoryNavigator

[`NotesDirectoryNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS.html) is the cursor for walking the cached `LookupNames` results:

| Method | Description |
|---|---|
| `FindFirstName()` | Move to the first name (resets position) |
| `FindNextName()` | Move to the next name |
| `FindFirstItem(itemName)` | Under the current name, move to a named item |
| `FindNextItem()` | Move to the next occurrence of the same item (multi-value fields) |
| `GetFirstItemValue()` | Return the current item's first value |
| `GetNextItemValue()` | Return the next value of the current item |

---

## Two key properties

```lotusscript
' Search all configured directories (primary + extended + LDAP)
dir.SearchAllDirectories = True

' Cap LookupNames results at 50 per call (default True)
' Set to False for full scans — but watch the performance impact
dir.LimitMatches = False
```

`SearchAllDirectories = False` (default) queries only the primary Domino Directory — faster. `True` includes all configured auxiliary directories.

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesDirectory` / `NotesDirectoryNavigator` |
| Java | `lotus.domino.Directory` / `DirectoryNavigator` (drop the `Notes` prefix; `.recycle()` when done) |
| SSJS | No direct equivalent — directory lookups in XPages are typically done via the Domino REST API |
