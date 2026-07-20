---
title: "Managing Replication Settings with NotesReplicationEntry Class"
description: "Explore how to use the NotesReplicationEntry class in LotusScript to manage database replication settings on HCL Domino servers, including configuring replication schedules, priorities, and other parameters."
pubDate: "2026-07-21T07:58:40+08:00"
lang: "en"
slug: "notes-replicationentry-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesReplicationEntry class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html"
  - title: "NotesReplication class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html"
  - title: "Replicating databases using LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html" was already cited by [notes-replication] on 2026-07-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html" was already cited by [notes-replication] on 2026-07-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLICATE_METHOD.html" was already cited by [notes-replication] on 2026-07-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-replicationentry-class
-->

In the HCL Domino environment, database replication is a crucial mechanism to ensure data consistency and availability across servers. The `NotesReplicationEntry` class in LotusScript allows developers to programmatically manage replication settings for databases, such as configuring replication schedules, priorities, and other parameters. This article provides a comprehensive guide on utilizing the `NotesReplicationEntry` class to manage replication settings, complete with implementation examples.

## What is NotesReplicationEntry?

The `NotesReplicationEntry` class represents the replication settings for a specific database on a Domino server. Each `NotesReplicationEntry` object contains information about the replication configuration between a source and a destination server, including the replication schedule, priority, and other settings. By leveraging this class, developers can read and modify these settings to meet specific business requirements.

## Steps to Use NotesReplicationEntry

1. **Obtain the NotesReplication Object**: First, retrieve the `NotesReplication` object from the `ReplicationInfo` property of a `NotesDatabase` object.

2. **Access Replication Entries**: Use the `GetEntry` method of the `NotesReplication` object to obtain a `NotesReplicationEntry` object for a specific destination server.

3. **Modify Replication Settings**: Adjust the replication schedule, priority, and other parameters using the properties and methods of the `NotesReplicationEntry` object.

4. **Save Changes**: Apply the changes by calling the `Save` method.

## Implementation Example

Below is an example of how to use LotusScript to modify the replication settings for a specific database:

```lotusscript
Sub UpdateReplicationSettings()
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim rep As NotesReplication
    Dim repEntry As NotesReplicationEntry
    
    ' Open the target database
    Set db = session.GetDatabase("ServerName", "database.nsf")
    If db Is Nothing Then
        MsgBox "Unable to open database"
        Exit Sub
    End If
    
    ' Get replication information
    Set rep = db.ReplicationInfo
    
    ' Get the replication entry for the specific server
    Set repEntry = rep.GetEntry("TargetServerName")
    If repEntry Is Nothing Then
        MsgBox "Replication entry not found"
        Exit Sub
    End If
    
    ' Set the replication schedule (e.g., daily at 1:00 AM)
    repEntry.ReplicationSchedule = "1:00 AM"
    
    ' Set the replication priority
    repEntry.Priority = 50
    
    ' Save changes
    Call repEntry.Save
    
    MsgBox "Replication settings updated"
End Sub
```

In this example, we first open the target database and retrieve its `NotesReplication` object. Using the `GetEntry` method, we obtain the replication entry for a specific destination server. We then set the replication schedule and priority before saving the changes.

## Important Considerations

- **Permissions**: Ensure that the user executing this code has the appropriate permissions to modify replication settings.

- **Error Handling**: Implement error handling mechanisms to manage potential exceptions and ensure robust code execution.

- **Testing Environment**: Always test the code in a development environment before deploying it to production to verify its correctness and effectiveness.

By utilizing the `NotesReplicationEntry` class, developers can effectively manage database replication settings on HCL Domino servers, ensuring data synchronization and consistency across the network. For more detailed information, refer to the official documentation on the [NotesReplicationEntry class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATIONENTRY_CLASS.html) and the [NotesReplication class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREPLICATION_CLASS.html).
