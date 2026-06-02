---
title: "NotesReplication + NotesReplicationEntry: Managing Database Replication Settings with LotusScript"
description: "Every Domino NSF carries a replication configuration — the same Replication Info you see in the database properties dialog. LotusScript's NotesReplication class lets you read and write that configuration programmatically: pause and resume replication, adjust priority, set cutoff filters, clear replication history. NotesReplicationEntry manages per-server-pair selective replication rules. This article covers obtaining the object (db.ReplicationInfo), the IsDisabled / Priority / Abstract properties, ClearHistory for forcing a full resync, GetEntry for per-pair rules, and why Save is non-negotiable."
pubDate: 2026-06-06T07:30:00+08:00
lang: en
slug: notes-replication
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesReplication class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS_1289.html"
  - title: "NotesReplicationEntry class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html"
  - title: "ReplicationInfo property (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATIONINFO_PROPERTY_DB.html"
relatedJava: ["Replication", "ReplicationEntry"]
relatedSsjs: []
---

You're preparing a maintenance window across a Domino environment with dozens of NSFs. You need to pause replication on all of them beforehand, and restore it cleanly afterward — without opening Admin Client for each one. Or you're building a deployment tool that adjusts replication priority on dev environments before pushing changes.

Every NSF has exactly one replication configuration. [`NotesReplication`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS_1289.html) is the LotusScript interface to that configuration — the same settings you see on the Replication Info tab in database properties.

---

## TL;DR

- Every `NotesDatabase` has exactly one `NotesReplication` object, obtained via `db.ReplicationInfo`
- **You must call [`Save()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_REPLICATION.html) after every property change** — unlike most LotusScript classes, modifications stay in memory until explicitly saved
- `IsDisabled`: pause or resume replication
- `Priority`: replication priority (`REPLICATION_PRIORITY_LOW` / `MED` / `HIGH`)
- `Abstract`: truncate large documents and strip attachments on replication (bandwidth saving)
- `ClearHistory()`: clears replication history, forcing a full resync on the next replication cycle
- [**`NotesReplicationEntry`**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html): per-server-pair rules (selective replication formulas, etc.)

---

## Getting the NotesReplication object

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

' Every database has exactly one replication settings object
Dim repl As NotesReplication
Set repl = db.ReplicationInfo

Print "Replication disabled: " & repl.IsDisabled
Print "Priority: " & repl.Priority
```

---

## Pausing and resuming replication

```lotusscript
' Pause replication on this database
repl.Disabled = True
Call repl.Save()
Print "Replication paused"

' Resume
repl.Disabled = False
Call repl.Save()
Print "Replication resumed"
```

**`Save()` is mandatory.** Unlike most LotusScript property changes that persist automatically, `NotesReplication` changes only live in memory until you call `Save()` — skip it and nothing actually changes in the NSF.

---

## Adjusting replication priority

```lotusscript
' Set to low priority (common for dev/test environments)
repl.Priority = REPLICATION_PRIORITY_LOW
Call repl.Save()

' Set to high priority (critical databases)
repl.Priority = REPLICATION_PRIORITY_HIGH
Call repl.Save()
```

Priority constants:

| Constant | Meaning |
|---|---|
| `REPLICATION_PRIORITY_LOW` | Low priority |
| `REPLICATION_PRIORITY_MED` | Medium (default) |
| `REPLICATION_PRIORITY_HIGH` | High priority |
| `REPLICATION_PRIORITY_NOTSET` | Not configured |

---

## Abstract — reduce bandwidth by truncating documents

```lotusscript
' Enable Abstract: large documents are truncated, attachments stripped
' Useful for bandwidth-constrained replication, not for normal business NSFs
repl.Abstract = True
Call repl.Save()
```

`Abstract` tells Domino to truncate large documents and remove attachments during replication. Useful in low-bandwidth scenarios where you need metadata sync but not full document content. Not appropriate for most production business databases.

---

## ClearHistory — force a full resync

```lotusscript
' Clear replication history → next replication will be a full scan
Call repl.ClearHistory()
' ClearHistory doesn't need a separate Save() call
Print "Replication history cleared"
```

Use cases: after database repair following corruption, or when forcing a full resync between two servers after maintenance. Note: the next replication after `ClearHistory` will scan every document in the database — expensive on large NSFs. See the [`ClearHistory` method documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CLEARHISTORY_METHOD_REPLICATION.html) for details.

---

## Reset — discard pending changes

```lotusscript
' Changed your mind mid-way? Reset reverts all property changes
' back to the last saved state (the opposite of Save)
Call repl.Reset()
```

---

## NotesReplicationEntry — per-server-pair rules

[`NotesReplicationEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html) manages the rules for replication between a specific pair of servers:

```lotusscript
' Get the entry for the SourceServer → TargetServer pair
Dim entry As NotesReplicationEntry
Set entry = repl.GetEntry("SourceServer/ACME", "TargetServer/ACME")

If Not (entry Is Nothing) Then
    Print "Replication enabled to target: " & entry.IsEnabled
    Print "Selective formula: " & entry.Formula
    ' Modify and save
    entry.Formula = "Type = ""Order"""
    Call entry.Save()
End If

' List all entries
Dim entries As Variant
entries = repl.GetEntries()
If IsArray(entries) Then
    Dim i As Integer
    For i = 0 To UBound(entries)
        Print "Entry: " & entries(i).Source & " → " & entries(i).Destination
    Next
End If
```

---

## In practice: batch-pause replication across a server

```lotusscript
Sub PauseAllReplication(serverName As String)
    Dim session As New NotesSession
    Dim dbDir As NotesDbDirectory
    Set dbDir = session.GetDbDirectory(serverName)

    Dim db As NotesDatabase
    Set db = dbDir.GetFirstDatabase(DATABASE)

    Dim count As Integer
    count = 0
    Do Until db Is Nothing
        If db.IsOpen Then
            Dim repl As NotesReplication
            Set repl = db.ReplicationInfo
            If Not repl.IsDisabled Then
                repl.Disabled = True
                Call repl.Save()
                count = count + 1
            End If
        End If
        Set db = dbDir.GetNextDatabase()
    Loop

    Print "Paused replication on " & count & " databases"
End Sub
```

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesReplication` / `NotesReplicationEntry` |
| Java | `lotus.domino.Replication` / `ReplicationEntry` (drop the `Notes` prefix; `.recycle()` when done) |
| SSJS | No direct equivalent — replication management in XPages is typically done via the Domino REST API or server console commands |
