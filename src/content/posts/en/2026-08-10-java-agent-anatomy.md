---
title: "Anatomy of a Java Agent: Triggers, Rights, Output, Debugging"
description: "The first three pieces assume the agent is already running — you can recycle, you have a Session, you run DQL. But how does a Java agent get triggered, whose rights does it run with, where does System.out go, and how do you debug it? This fills in the step before NotesMain(): the AgentBase skeleton, Trigger and unprocessedDocuments, the signer that decides an agent's rights, restricted vs unrestricted, and the System.out-to-log.nsf debugging path."
pubDate: 2026-08-10T07:30:00+08:00
lang: en
slug: java-agent-anatomy
tags:
  - "Java"
sources:
  - title: "AgentContext class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENTCONTEXT_CLASS_JAVA.html"
  - title: "Agent class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS_JAVA.html"
  - title: "AgentBase class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_AGENTBASE_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
---

The first three pieces share an assumption: the agent is already running. You can [recycle](/domino-news/en/posts/java-recycle-memory), you [have a Session](/domino-news/en/posts/java-session-notesfactory), you [run DQL](/domino-news/en/posts/java-dql-dominoquery) — but all of that starts from the moment `NotesMain()` has been called. The step before that is the part nobody covers: how does a Java agent get triggered? Whose rights does it run with? Where does `System.out` go? When it breaks, how do you debug it?

None of that is logic inside a method — it's the rules of the agent container itself. This piece fills in the skeleton: the `AgentBase` structure, triggers and processing scope, the rights decided by the signer, and the real paths for output and debugging.

---

## TL;DR

- **The skeleton is fixed:** extend `AgentBase`, put your logic in `NotesMain()`. Designer generates the template (`getSession()` + `getAgentContext()`).
- **Trigger decides "when it runs":** the `Agent` class's `Trigger` property is defined simply as "indicates when this agent runs" — scheduled, event-driven (e.g. before new mail arrives), or manual.
- **A scheduled agent lives on unprocessedDocuments:** `agentContext.getUnprocessedDocuments()` gives you only the documents new or modified since the last run that this agent hasn't processed yet; call `updateProcessedDoc()` to mark one, and the next run won't pick it up again.
- **An agent runs with the *signer's* rights:** the `Agent` class's `Owner` is "the name of the person who last modified and saved an agent." Whoever last saved it is the signer, and the agent runs as that identity.
- **Restricted vs unrestricted:** a restricted agent can only touch Domino databases; an unrestricted one can reach the server's file system, network, and threads. Set in the agent's security settings, and bounded by the ECL[^ecl] on the workstation side.
- **`System.out` goes to log.nsf:** for scheduled / `runOnServer` agents, `System.out` writes to `log.nsf`'s "Miscellaneous Events"; run manually from the client, it goes to the local Java Debug Console.

---

## The skeleton: AgentBase and NotesMain

A Java agent's shape is fixed — extend [`AgentBase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_AGENTBASE_CLASS_JAVA.html) and put your code in `NotesMain()` ([the 8/8 piece](/domino-news/en/posts/java-session-notesfactory) covered how `getSession()` lives here). Create a Java agent in Designer and it hands you exactly this template: a `Session`, an `AgentContext`, and the rest left blank.

You can choose "Java written in Designer" or "imported Java" (compiled elsewhere — the fit when you have an existing build and want to pull in external jars). The skeleton is the same; only where the source lives and how it's compiled differs.

## Trigger and processing scope

When an agent runs and which documents it touches is decided by agent properties, not code. The [`Agent`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS_JAVA.html) class's `Trigger` property is one line in the docs:

> Read-only. Indicates when this agent runs.

The common triggers: **scheduled** (hourly / daily…), **event** (e.g. before new mail arrives), and **manual** (from an action menu or the agent list). Paired with it is the processing scope — all documents, selected documents, or "new/modified since the last run."

That last scope is the soul of a scheduled agent, and it rests on two `AgentContext` methods:

- `getUnprocessedDocuments()`: returns only the documents in this agent's scope that it hasn't processed yet.
- `updateProcessedDoc(doc)`: marks a document as processed by this agent, so the next `getUnprocessedDocuments()` won't return it.

Together they make "run hourly, process only this hour's new orders" clean — you don't track "where did I get to last time," Domino does.

## AgentContext: the agent's running context

[`AgentContext`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENTCONTEXT_CLASS_JAVA.html) is defined as "represents the agent environment of the current program, if an agent is running it" — the whole context of the run. Beyond the pair above, the common ones:

- `getCurrentDatabase()`: the database the agent runs in.
- `getDocumentContext()`: the document that triggered this run (a web agent's submitted form, or the selected document).
- `getEffectiveUserName()`: the identity this run executes as.
- `getSavedData()`: defined as "a document that an agent uses to store information between invocations" — where you keep state across runs. To remember "which cursor I reached" or "how many I've tallied," write it to that document and read it back next time.

## Whose rights it runs with: the signer

This is the trap most easily missed: **an agent runs not with the rights of whoever triggered it, but with the rights of its signer.** The `Agent` class's `Owner` property is defined as:

> Read-only. The name of the person who last modified and saved an agent.

In other words, **whoever last saved it is the signer**, and the agent executes with that person's identity and ACL rights. Save an agent on your dev machine, deploy it to production, and it runs as *you* — if you lack the rights in production, it fails; conversely, an agent signed by a high-privilege account carries that privilege wherever it's deployed.

There are two more gates on rights:

- **ACL:** `ACLEntry`'s `IsCanCreateLSOrJavaAgent` property decides whether a person "is allowed to create LotusScript or Java agents."
- **Restricted vs unrestricted:** in the agent's security settings, a restricted agent can only do Domino database operations; an unrestricted one can reach the server's file system, network, and threads. To read/write server files or call an external service the agent must be unrestricted, and the signer must be authorized on the server to run unrestricted agents. On the workstation side, the ECL[^ecl] applies as well.

## Where System.out goes, and how to debug

The most common Java-agent puzzle — "I printed something and saw nothing" — depends on how it was triggered:

- **Scheduled / `runOnServer`:** `System.out` writes to the `log.nsf` on the machine it runs on, visible in the "Miscellaneous Events" view. `e.printStackTrace()` stacks land there too.
- **Run manually from the Notes client:** `System.out` goes to the local Java Debug Console.

For more structured records, use the `Log` class's `logAction()` / `logError()` to write straight into an agent log. When chasing a scheduled agent on a production server, making exceptions land in `log.nsf` beats guessing.

## A full example: a scheduled agent processing new orders

Putting it together, here's the skeleton of a typical scheduled agent, processing only unprocessed documents and cleaning up per the [recycle discipline](/domino-news/en/posts/java-recycle-memory):

```java
import lotus.domino.*;

public class ProcessNewOrders extends AgentBase {
    public void NotesMain() {
        try {
            Session session = getSession();
            AgentContext ctx = session.getAgentContext();

            DocumentCollection dc = ctx.getUnprocessedDocuments();  // only new/modified
            Document doc = dc.getFirstDocument();
            Document next = null;
            while (doc != null) {
                next = dc.getNextDocument(doc);
                // ...process the current doc...
                ctx.updateProcessedDoc(doc);   // mark processed; next run skips it
                doc.recycle();                 // recycle each (see the recycle piece)
                doc = next;
            }
        } catch (Exception e) {
            e.printStackTrace();               // scheduled → log.nsf Miscellaneous Events
        }
        // no session.recycle(): the agent's Session is the Agent Manager's to recycle
    }
}
```

Note the ending: as [the 8/8 piece](/domino-news/en/posts/java-session-notesfactory) covered, the agent's Session is handed to you, so **don't recycle it**; but the `Document`s you pull in the loop are yours to recycle.

## What about LotusScript and SSJS?

The "agent skeleton" differs quite a bit by language:

| Language | What an agent looks like |
|---|---|
| **LotusScript** | code goes straight in the `Initialize` event — no `AgentBase`/`NotesMain` wrapper; `session`, `unprocessedDocuments`, etc. are directly available |
| **SSJS / XPages** | traditional agents are used less; scheduled logic tends to move to XPages or external schedulers |
| **Java (`lotus.domino`)** | always the `AgentBase` + `NotesMain()` skeleton, with `AgentContext` from `getSession().getAgentContext()` |

Coming from LotusScript, the biggest shift is that `AgentBase`/`NotesMain()` wrapper: LS's `Initialize` becomes Java's `NotesMain()`, `session` becomes `getSession()`. The rest — triggers, scope, signer rights, log.nsf — is the same across languages; Java just makes you see it more explicitly. For how these classes connect, see the [class map](/domino-news/en/map).

[^ecl]: The ECL (Execution Control List) is the Notes workstation-side security mechanism that, based on the *signer*, decides whether a piece of code may perform sensitive operations on that workstation (file access, calling external programs, etc.). It's a separate gate from the server-side restricted/unrestricted setting.
