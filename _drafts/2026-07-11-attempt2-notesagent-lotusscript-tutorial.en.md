---
title: "Working with NotesAgent in LotusScript: A Comprehensive Guide"
description: "This article provides a detailed guide on how to work with NotesAgent in LotusScript, including accessing, running, and checking the status of agents, with practical examples."
pubDate: "2026-07-11T08:00:41+08:00"
lang: "en"
slug: "notesagent-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesAgent (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html"
  - title: "Run (NotesAgent - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_RUN_METHOD_6415.html"
  - title: "Examples: LastRun property (NotesAgent - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_LASTRUN_PROPERTY_AGENT.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesagent-lotusscript-tutorial
-->

## What is NotesAgent?

`NotesAgent` is an object in HCL Domino that represents an agent within a database. Agents can be shared or private and are used to perform various tasks such as automation and data processing. You can access `NotesAgent` through the `NotesSession` or `NotesDatabase` objects.

## Accessing NotesAgent

There are three ways to access an agent:

1. **Access by Agent Name**:

   ```lotusscript
   Dim db As NotesDatabase
   Dim agent As NotesAgent
   Set db = session.CurrentDatabase
   Set agent = db.GetAgent("AgentName")
   ```

2. **Access the Currently Running Agent**:

   ```lotusscript
   Dim agent As NotesAgent
   Set agent = session.CurrentAgent
   ```

3. **Access All Agents in a Database**:

   ```lotusscript
   Dim db As NotesDatabase
   Dim agent As NotesAgent
   Dim agentList As NotesAgent
   Set db = session.CurrentDatabase
   Set agentList = db.Agents
   ForAll agent In agentList
       ' Process each agent
   End ForAll
   ```

## Running an Agent

You can run an agent using the `Run` method:

```lotusscript
Dim status As Integer
status = agent.Run()
If status = 0 Then
    MsgBox "Agent ran successfully"
Else
    MsgBox "Agent failed to run, status code: " & status
End If
```

The `Run` method optionally accepts a parameter, which is the note ID of a document to pass to the agent. This is useful when you need the agent to act on a specific document.

## Checking Agent Status

You can check the status of an agent using the following properties:

- **`IsEnabled`**: Indicates whether the agent is enabled.

  ```lotusscript
  If agent.IsEnabled Then
      MsgBox "Agent is enabled"
  Else
      MsgBox "Agent is not enabled"
  End If
  ```

- **`LastRun`**: Returns the date and time when the agent last ran.

  ```lotusscript
  Dim lastRunTime As Variant
  lastRunTime = agent.LastRun
  MsgBox "Agent last ran on: " & CStr(lastRunTime)
  ```

- **`HasRunSinceModified`**: Indicates whether the agent has run since it was last modified.

  ```lotusscript
  If agent.HasRunSinceModified Then
      MsgBox "Agent has run since last modification"
  Else
      MsgBox "Agent has not run since last modification"
  End If
  ```

## Conclusion

By utilizing the `NotesAgent` class, you can effectively manage and execute agents within HCL Domino. Understanding how to access, run, and check the status of agents will help you automate various tasks more efficiently in your applications.

For more detailed information on `NotesAgent`, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html).
