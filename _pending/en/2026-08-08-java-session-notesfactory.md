---
title: "Getting a Session in Java: NotesFactory, Local, and Remote"
description: "LotusScript's session is a global you never create; Java has no such thing. Before you touch a single document you have to obtain a Session yourself — and how you get one depends on whether your code runs as an agent, a standalone program, or remotely. A field report on NotesFactory's three paths, local (JNI) vs remote (DIIOP), the who-creates-recycles rule, and the two traps: JVM bitness and one session per thread."
pubDate: 2026-08-08T07:30:00+08:00
lang: en
slug: java-session-notesfactory
tags:
  - "Java"
sources:
  - title: "NotesFactory class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFACTORY_CLASS_JAVA.html"
  - title: "AgentBase class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_AGENTBASE_CLASS_JAVA.html"
  - title: "Running a Java program — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html"
relatedJava: []
relatedSsjs: []
---

In LotusScript, `session` is just there. You never created it and you never had to — it's a global, and the moment an agent starts you can call `session.getUserName()`. That "of course it's there" travels with a lot of people into Java, and then the first Java program walks straight into a wall: Java has **no** such global. Before you touch a single document, you have to obtain a `Session` yourself.

The awkward part is that there isn't one way to get it — there are several, and which one you use depends on where your code runs. The same logic packaged as an agent, as a standalone `main()`, or reaching in remotely from another machine each obtains its Session differently, and the wrong choice means an `UnsatisfiedLinkError` or `NoClassDefFoundError` at startup, or an agent that crashes the moment it runs.

This piece is about one thing: how you actually get a Session in Java, and the trade-off behind each scenario.

---

## TL;DR

- **Java has no LotusScript-style global `session`.** The entry point is `NotesFactory` — in the docs' own words: "Applications call the `NotesFactory createSession` methods to create a `Session` object."
- **Three paths, depending on where your code runs:**
  - **Agent:** extend `AgentBase`, call `getSession()` inside `NotesMain()`. That Session is handed to you by the environment — **don't create it, don't recycle it.**
  - **Standalone / servlet (JNI):** initialize with `NotesThread`, then `NotesFactory.createSession()`. You created it, so **you recycle it.**
  - **Remote (DIIOP):** `NotesFactory.createSession(host, user, password)`, over the network.
- **Local and remote use different jars:** local is `Notes.jar` + JNI[^jni]; remote is `NCSO.jar` + network sockets, needs no `NotesThread`, but the server must run the DIIOP[^diiop] task (default port 63148).
- **Who creates, recycles:** never recycle the agent's Session; always recycle one you created with `createSession()`, in a `finally` block, or you leak the back end.
- **Two common traps:** for local JNI, the JVM's bitness must match Domino's; call `createSession()` only once per thread.

---

## LS has a global session, Java doesn't

The root of the difference is the same one the [recycle() piece](/domino-news/en/posts/java-recycle-memory) describes: LotusScript hides a lot for you. The `session` global is one of those things — the runtime has it ready when the agent starts, and you just use it.

Java doesn't do that for you. [`NotesFactory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFACTORY_CLASS_JAVA.html) is the one entry point, and the docs state its job plainly:

> Applications call the `NotesFactory createSession` methods to create a `Session` object.

`NotesFactory` is a factory, and its `createSession()` has a long list of overloads that split into two groups: **local calls** (using your Notes ID: `createSession()`, `createSessionWithFullAccess()`…) and **remote calls** (naming a host: `createSession(host)`, `createSession(host, user, passwd)`…). Picking one is really picking your execution context.

## The three paths

### 1. Agent: `getSession()`, and don't touch its lifecycle

In an agent you actually **don't call `NotesFactory`**. [`AgentBase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_AGENTBASE_CLASS_JAVA.html) has the Session ready for you — the docs: "Notes/Domino agents must extend `AgentBase` and use `NotesMain()` as the entry point." Inside `NotesMain()` you call `getSession()` to get it, then `getAgentContext()` for the running context like the current database.

The key point: this Session is provisioned by the Agent Manager, which clears it when the agent ends. **Don't create it yourself and don't recycle it** — recycling it destroys the back-end handles the server expects to manage, and takes the agent (or even the Agent Manager task) down with it.

### 2. Standalone / servlet: NotesThread + createSession

Running a standalone `main()` on the server, or a Tomcat/servlet talking to Domino locally over JNI, you do the whole dance yourself: register the thread with Domino, then `createSession()`. Domino's C API tracks memory in thread-local storage, so this step isn't optional — use `NotesThread.sinitThread()` / `stermThread()` (the latter in a `finally`), or extend `NotesThread` and put your logic in `runNotes()`. This Session is yours to create and yours to clean up.

### 3. Remote: createSession(host, user, password)

When Java runs in a separate JVM and reaches Domino over the network, use the host overload: `createSession(host, user, passwd)`. This path [runs](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html) differently: it uses `NCSO.jar` (not `Notes.jar`) and talks over standard network sockets, so it needs **no `NotesThread`** initialization. The prerequisite is that the server is running the DIIOP task and the DIIOP port (default 63148) is open.

## Local vs remote: more than a method name

The two paths differ all the way down the stack:

| | Local (JNI) | Remote (DIIOP) |
|---|---|---|
| Method | `createSession()` | `createSession(host, user, passwd)` |
| jar | `Notes.jar` | `NCSO.jar` |
| Transport | JNI straight to native C | network sockets (IIOP) |
| `NotesThread` | required | not needed |
| Prerequisite | `Notes.jar` on the classpath; the OS `PATH` (Windows) / `LD_LIBRARY_PATH` (Linux) pointing at the Domino binary directories | server running the DIIOP task; port 63148 open |

The thing most often missed on the local path is the environment: the JVM has to be able to load `nnotes.dll` / `libnotes.so`, which means both the classpath and the system path have to be right — get it wrong and you get an `UnsatisfiedLinkError` at startup.

## Who creates, recycles

The rule for recycling a Session is one line, and it's about **ownership**:

- **Created with `createSession()`** (standalone): you own it; call `session.recycle()` in a `finally` block before the thread ends, or you leak the back end badly.
- **Obtained with `getSession()`** (agent): the server owns it; leave it alone.

This is the same principle as the [recycle() piece](/domino-news/en/posts/java-recycle-memory) — "what you new or get, you recycle; what the environment hands you, the environment keeps" — with the Session as its top-level case.

## Two common traps

- **Bitness must match.** For a local JNI session, the JVM's bitness has to match the Domino install exactly (a 64-bit JVM for 64-bit Domino). Mismatch and the native library won't load.
- **One session per thread.** Call `createSession()` only once per thread; creating multiple sessions on the same local thread exhausts resources fast.

## Two full examples

Standalone `main()` (local JNI) — note `NotesThread` wraps the outside and the Session is recycled in `finally`:

```java
import lotus.domino.*;

public class StandaloneApp {
    public static void main(String[] args) {
        NotesThread.sinitThread();                 // 1. initialize the Domino thread context
        Session session = null;
        try {
            session = NotesFactory.createSession(); // 2. create the Session via NotesFactory
            System.out.println("Running as: " + session.getUserName());
            // ...business logic...
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            try {
                if (session != null) session.recycle();  // 3. recycle the one YOU created
            } catch (NotesException ne) { ne.printStackTrace(); }
            NotesThread.stermThread();              // 4. end the thread context
        }
    }
}
```

Agent (extending `AgentBase`) — no `NotesThread`, and **no** `recycle()`:

```java
import lotus.domino.*;

public class JavaAgent extends AgentBase {
    public void NotesMain() {
        try {
            Session session = getSession();                     // handed to you; don't create it
            AgentContext ctx = session.getAgentContext();
            Database db = ctx.getCurrentDatabase();
            System.out.println("In database: " + db.getTitle());
            // ...business logic...
        } catch (Exception e) {
            e.printStackTrace();
        }
        // no session.recycle(): the Agent Manager recycles the Session and tears the thread down
    }
}
```

## What about LotusScript and SSJS?

Getting a Session is the one thing only Java makes you think about:

| Language | How you get a Session |
|---|---|
| **LotusScript** | the `session` global, ready to use; or `New NotesSession` when you need one |
| **SSJS / XPages** | the `session` global (and `database`) are set up by the container; just use them |
| **Java (`lotus.domino`)** | no global — always through `NotesFactory` (or an agent's `getSession()`), and you split local vs remote |

If you're coming from LotusScript, this is the second instinct to unlearn after `recycle()`: the Session doesn't just appear. You decide where the code runs first, then pick the matching way to get it. For how these classes connect, see the [class map](/domino-news/en/map).

[^jni]: JNI (Java Native Interface) is the bridge Java uses to call native C/C++ libraries. A local session calls straight into Domino's C engine (`nnotes.dll` / `libnotes.so`) through JNI, which is why it needs `Notes.jar` plus the right system path.

[^diiop]: DIIOP (Domino IIOP) is a Domino server task that lets remote Java programs connect over IIOP (CORBA's network protocol) to reach Domino objects. It saves you from running the Java on the server itself, at the cost of a network hop.
