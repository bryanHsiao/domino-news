---
title: "NotesAgent: Calling One Agent from Another (Run vs RunOnServer)"
description: "You have a heavy processing agent and want another agent — or a button — to fire it on demand, not on a schedule but straight from code. NotesAgent is the class for that: db.GetAgent() gets the agent, then Run or RunOnServer executes it. This article unpacks the crucial difference between the two (runs on the client vs on the server), how to pass a document to the called agent via noteID, the IsEnabled / Trigger / Target properties, and the four constraints: no recursion, no debugging, no user interaction, output goes only to the Domino log."
pubDate: 2026-06-12T07:30:00+08:00
lang: en
slug: notes-agent
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesAgent class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html"
  - title: "Run method (NotesAgent) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUN_METHOD_6415.html"
  - title: "RunOnServer method (NotesAgent) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUNONSERVER_METHOD_5924_ABOUT.html"
relatedJava: ["Agent"]
relatedSsjs: ["Agent"]
cover: "/covers/notes-agent.webp"
coverStyle: "pencil-sketch"
---

You have a heavy batch agent — one run takes several minutes. Now the requirement shifts: when a user clicks a button on a form, it should fire that agent "right now"; or another agent, partway through, needs to hand work off to it. The point is — you don't want to wait for a schedule, you want to trigger it **from code**.

That's what [`NotesAgent`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html) is for. The official definition is "Represents an agent" — it stands for an agent design element in a database, lets you inspect its settings, and lets you **run it from code**. And "run it" has two methods: `Run` and `RunOnServer` — pick wrong and your code runs on the wrong machine, or does nothing useful. This article makes that decision clear.

---

## TL;DR

- Get a `NotesAgent` with `db.GetAgent("agentName")`, or all of them with `db.Agents`
- **`Run`** executes the agent in the **current (client)** context; **`RunOnServer`** executes it **on the server hosting the database**
- Both return an `Integer` status — **`0` means success** — and both take an optional `noteID$`
- `noteID$` is passed to the called agent's **`ParameterDocID`** property — the standard way to say "act on this document"
- Properties expose the agent's settings: `IsEnabled` (read-write), `Trigger`, `Target`, `LastRun`, `ServerName`, `IsWebAgent` / `IsNotesAgent`, `Owner`
- Four constraints: **no recursive self-call, no debugging the called agent, no direct user interaction, output goes to the Domino log**

---

## Getting an agent

Agents belong to a database, so you get one from `NotesDatabase`:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

Dim agent As NotesAgent
Set agent = db.GetAgent("DailyCleanup")
If agent Is Nothing Then
    ' No agent by that name in this db
    Exit Sub
End If
```

To list every agent in a database, use `db.Agents` (returns an array). Note the docs' warning about `Name`: "Within a database, the name of an agent may not be unique" — there can be more than one agent with the same name, and `GetAgent` returns one of them.

## Run vs RunOnServer: the decision that matters

Both methods "run the agent", but **which machine they run on** is completely different:

| | [`Run`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUN_METHOD_6415.html) | [`RunOnServer`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RUNONSERVER_METHOD_5924_ABOUT.html) |
|---|---|---|
| Runs where | the current client context | the **server** hosting the database |
| Signature | `status = agent.Run([noteID$])` | `status = agent.RunOnServer([noteID$])` |
| Returns | `Integer`, `0` = success | same |
| Typical case | interactive, client-side trigger | offload heavy work to the server |

Why does the choice matter? Picture that "several minutes" batch agent: with `Run`, it executes on the user's Notes Client and the user is frozen waiting for it; with `RunOnServer`, the work goes to the server and the client gets control back immediately. **Heavy work should be `RunOnServer`.**

One exception to remember, verbatim: "On a local database, the RunOnServer method works like the Run method, that is, runs the agent on the local computer." If the database is local, `RunOnServer` degrades into `Run` and runs locally — no server, nowhere to "offload" to.

Both methods "run any agent regardless of source language (simple action, formula, LotusScript, Java)" — the called agent can be written in anything.

## Passing a document to the called agent

The optional `noteID$` parameter of `Run` / `RunOnServer`, per the docs: "The note ID of a document. This value is passed to the ParameterDocID property of the called agent."

In other words, it's the standard channel for the caller to tell the callee "act on this document":

```lotusscript
' Caller: pass a document's NoteID
Call agent.RunOnServer(doc.NoteID)
```

```lotusscript
' Inside the called agent: fetch the document from its own ParameterDocID
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = db.GetDocumentByID(session.CurrentAgent.ParameterDocID)
```

The called agent reads its own [`ParameterDocID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARAMETERDOCID_PROPERTY_AGENT.html) (docs: "the note ID of a document passed to the agent by Run or RunOnServer", read-only, new in Release 5.02), then uses `GetDocumentByID` to retrieve the document. Far cleaner than a global scratch field.

## Knowing the agent: common properties

You don't just run it — you can inspect its settings (most read-only):

| Property | Holds |
|---|---|
| `IsEnabled` | read-write, "whether an agent is able to run or not" — enable/disable in code |
| `Trigger` | when the agent fires (scheduled / event …) |
| `Target` | which documents it acts on |
| `LastRun` | the date it last ran |
| `ServerName` | read-write, the server it's set to run on (a property of the design element, not of this run) |
| `IsNotesAgent` / `IsWebAgent` | can it run in the Notes client / a web browser |
| `IsPublic` | shared or private |
| `Owner` | the person who last modified and saved it |

`IsEnabled` being writable is genuinely useful — disable a scheduled agent in code during maintenance and re-enable it afterward, writing the change back with `Save()`.

## A few constraints

Calling agents isn't unlimited; the docs list some hard rules:

- **No recursion**: "You cannot run an agent recursively (cannot call it from itself)."
- **No debugging**: "You cannot debug a called agent." One fired via `Run` / `RunOnServer` won't enter the debugger.
- **No user interaction**: "The user cannot interact directly with a called agent." Don't put dialogs in a called agent — nobody can click them.
- **Output goes to the log**: "User output goes to the Domino log." `Print` and the like land in the Domino log, not in front of the user. To record a called agent's progress, the [`NotesLog`](/domino-news/posts/notes-log/) class covered earlier is the more controllable route.

## What about Java and SSJS?

`NotesAgent` exists in all three languages, with the same name:

| Language | Counterpart | Obtained via |
|---|---|---|
| Java (`lotus.domino.*`) | `Agent` | `db.getAgent(name)` |
| SSJS / XPages | `Agent` | `database.getAgent(name)` |

The `run` / `runOnServer` and `ParameterDocID` concepts are consistent across all three. Triggering a back-end agent from an XPages button with SSJS is a very common pattern, and it runs through this same `runOnServer` — offloading heavy work back to the server, exactly the logic in this article.
