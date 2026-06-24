---
title: "Programmatic Replication Using the NotesReplication Class"
description: "Learn how to programmatically control HCL Domino database replication using the NotesReplication class in LotusScript."
pubDate: "2026-06-25T07:30:34+08:00"
lang: "en"
slug: "notes-replication"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesReplication class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html"
  - title: "Replicate method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html"
  - title: "NotesReplicationEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-replication" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-replication
-->

In HCL Domino development, replication is a crucial mechanism for ensuring database synchronization. Using the `NotesReplication` class in LotusScript, developers can programmatically control database replication behavior. This article will guide you through managing replication using the `NotesReplication` class.

## Obtaining a NotesReplication Object

To begin using `NotesReplication`, first obtain the replication settings from a `NotesDatabase` object:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim replication As NotesReplication

Set db = session.CurrentDatabase
Set replication = db.ReplicationInfo
```

In this code, `db.ReplicationInfo` returns a `NotesReplication` object representing the replication information for the database.

## Setting Replication Options

The `NotesReplication` class provides several properties to configure replication behavior, such as:

- `CutoffInterval`: Sets the cutoff interval for replication.
- `CutoffDate`: Sets the cutoff date for replication.
- `Disabled`: Enables or disables replication.

The following example demonstrates how to set these properties:

```lotusscript
replication.CutoffInterval = 30 ' Set cutoff interval to 30 days
replication.Disabled = False ' Enable replication
```

## Performing Replication

To programmatically perform replication, use the `Replicate` method of the `NotesDatabase` class. This method requires the name of the target server as a parameter:

```lotusscript
Dim success As Boolean
success = db.Replicate("ServerName")
If success Then
    MsgBox "Replication successful"
Else
    MsgBox "Replication failed"
End If
```

In this example, the `db.Replicate` method attempts to replicate the current database with the specified server and returns a Boolean indicating success or failure.

## Managing Replication Entries

The `ReplicationEntries` property of the `NotesReplication` class returns a collection of `NotesReplicationEntry` objects, representing all replication entries for the database. You can iterate through these entries to view or modify specific replication settings:

```lotusscript
Dim entry As NotesReplicationEntry
Forall entry In replication.ReplicationEntries
    MsgBox "Server: " & entry.Destination
    ' Modify entry properties here
End Forall
```

By utilizing these methods, developers can programmatically manage HCL Domino database replication, ensuring data synchronization across servers. For more detailed information, refer to the official documentation for the [NotesReplication class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html) and the [Replicate method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html).
