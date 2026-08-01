---
title: "recycle(): Manual Memory Management in the Java Domino API"
description: "The same logic runs forever in LotusScript, then blows up the agent's memory the first time you loop it over tens of thousands of documents in Java. The reason is that every Java Domino object is backed by a native handle the garbage collector can't see. A field report on the mechanism, the four official rules, the loop leak pattern and its fix, NotesThread's role, and how local vs remote sessions change the cost."
pubDate: 2026-08-07T07:30:00+08:00
lang: en
slug: java-recycle-memory
tags:
  - "Java"
  - "Performance"
sources:
  - title: "recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
  - title: "NotesThread class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html"
  - title: "Running a Java program — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html"
relatedJava: []
relatedSsjs: []
---

You rewrite a LotusScript agent that's run for years into Java. The logic is identical: open a view, pull a batch of documents, read fields, compute, write back. In the test database — a few hundred documents — it runs fast and clean. On launch day the same code runs against the production database of fifty thousand documents, and partway through, the agent runs out of memory, the server console starts printing out-of-memory errors, and on a bad day it drags the whole server down with it.

Nothing in the code looks wrong. Read with LotusScript eyes it's arguably tidier than the original. The catch is this: **LotusScript never asked you to clean up your objects; the Java `lotus.domino` API does, and it's your job.** The missing line is `recycle()`.

This piece covers three things: why the same Domino objects are hands-off in LS but your responsibility in Java; the two signatures and four official rules of `recycle()`; and the loop leak pattern you're most likely to hit, its correct form, and the details — `NotesThread`, remote sessions — that change the rules.

---

## TL;DR

- **Every Java Domino object is a lightweight front paired with a heavyweight back end.** The Java object in your hand is small; behind it sits a C back-end object reached through a handle. Java's garbage collector sees only the front, never the back.
- **The garbage collector cannot free the back-end object — only `recycle()` can.** Skip `recycle()` and the back-end handle stays allocated; enough of them and you hit out-of-memory or handle exhaustion.
- **Four official rules:** recycle only when the object is no longer needed; recycle on the same thread that created it; **recycling a parent recycles all its children**; if several objects represent the same Domino element, recycling one recycles all.
- **Loops are the number-one hazard.** `getNextDocument()` mints a fresh back-end handle every iteration; not recycling each one is a steady leak. The fix is the two-variable loop: grab the next document, process the current one, recycle it, then advance.
- **`NotesThread` is what makes the "same thread" rule hold.** Agents (`AgentBase`) handle it for you; a thread you spin up yourself in a servlet or standalone app needs `sinitThread` / `stermThread`.
- **Remote (DIIOP) sessions change the math.** There `recycle()` is a network round-trip, so recycling one-by-one in a tight loop is slow — batch it with `recycle(Vector)` instead.

---

## Why LS doesn't need it and Java does

LotusScript and Java call into the same C-written Domino engine. The difference is who cleans up the layer behind it.

In LotusScript, when an object goes out of scope the runtime tears the back end down with it — you never think about it. Java doesn't work that way. The documentation states it plainly:

> Java has no knowlege of the heavyweight back-end Domino Objects, only the lightweight Java objects representing them. Garbage collection has no effect on Domino Objects unless you first explicitly recycle them.

So the `Document` you get back from `db.getDocumentByUNID(...)` is a small Java front object; the thing that actually holds the data and the memory is the C back-end object behind it. Java's garbage collector can see and eventually free that small front — but **it cannot see the back end at all**, so the handle is orphaned until the process exits. Ten documents, a hundred, and you never notice; fifty thousand, and the orphaned handles pile into a mountain long before GC would have run. That's why it passes in test and dies in production.

This isn't a bug — it's the inherent cost of Java reaching into a native library[^jni]: the JVM's memory management stops at the boundary and can't touch the C heap on the other side. `recycle()` is your only way to hand that back-end memory back to the system by hand.

## `recycle()`: two signatures, four rules

The [official `recycle()` reference](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) is short, but every line reads like it was written after stepping on the mine. The method "unconditionally destroys an object and returns its memory to the system," and every `lotus.domino` class carries two versions:

```java
public void recycle()
public void recycle(java.util.Vector objects)
```

The second recycles a whole Vector of objects at once — a real win for remote calls, more on that below.

The four official rules, read the way they bite in practice:

1. **Recycle only when the object is no longer needed.** A recycled object's handle is dead; touching it afterward means reaching into a destroyed back end — an exception at best, undefined behaviour at worst.
2. **Recycle on the same thread that created it.** The back-end handle is tied to the thread-local storage of the thread that made it; recycling across threads breaks. This rule is what pulls in the `NotesThread` section below.
3. **Recycling a parent recycles all its children.** Recycle a `Database` and its `View`, `Document`, and `Item` objects go with it. That's your friend at cleanup time and your trap inside a loop — see below.
4. **Several representations of one element recycle together.** `View v1 = db.getView("All"); View v2 = db.getView("All");` — two Java objects, one back-end view; after `v1.recycle()`, `v2` is dead too.

## Loops: the number-one hazard

Nine out of ten Java Domino memory problems have the same shape — looping over a collection without recycling the current document:

```java
// Leaky: a fresh back-end handle every iteration, all handed to a GC that can't collect them
Document doc = collection.getFirstDocument();
while (doc != null) {
    // ...process doc...
    doc = collection.getNextDocument(doc);  // the old doc's back-end handle is now orphaned
}
```

The culprit is `getNextDocument()`: each iteration instantiates a new Java object **and a new back-end handle**, while the previous `Document` is overwritten and left to the garbage collector — which can't reach its back end. Rule three (parent recycles children) won't save you, because `collection` isn't recycled until the whole run finishes, by which point tens of thousands of orphaned handles have already filled memory.

The fix is the two-variable loop: grab the reference to the next document before you recycle the current one:

```java
public void processDocuments(DocumentCollection collection) throws NotesException {
    Document doc = collection.getFirstDocument();
    Document nextDoc = null;
    while (doc != null) {
        nextDoc = collection.getNextDocument(doc);   // 1. hold the next one
        // 2. process the current doc
        // System.out.println(doc.getItemValueString("Subject"));
        doc.recycle();                               // 3. recycle the current back-end handle
        doc = nextDoc;                               // 4. advance
    }
}
```

Two habits worth keeping: set the variable to `null` after `recycle()` so you can't accidentally touch a dead handle; and wrap the loop in `try/finally` so an exception mid-loop still recycles whatever `doc` / `nextDoc` you're holding. And one notorious detail — `DateTime` and `DateRange` are especially leaky, so if you pull dates inside a loop, recycle them the moment you're done.

## `NotesThread`: what makes "same thread" hold

Rule two says "recycle on the same thread that created it" — which only works if that thread has registered with the Domino engine first. That's the job of [`NotesThread`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html): it provides the special initialization and termination Notes/Domino needs, and it's required to run code that makes local calls to the Domino classes.

The good news is you usually don't touch it. The `AgentBase` you extend for an agent, and the `AppletBase` for an applet, already wrap thread initialization inside — your code just runs. Two cases still need handling yourself:

- **Extending `NotesThread`:** put your logic in `runNotes()` (not the usual `run()`); initialization and teardown happen automatically.
- **Spinning up your own thread** (servlet, standalone app): call `NotesThread.sinitThread()` at the start and `NotesThread.stermThread()` in a `finally` block, exactly one to one.

Either way the official bottom line is: **every Domino object created on a thread must be recycled before that thread ends**, or you leak at the OS level.

## Local vs remote: DIIOP rewrites the cost

The same Java API [runs](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html) in two contexts, and recycling costs differently in each:

- **Local (JNI):** Java runs directly on the Domino server or Notes client, calling the native C binaries (`nnotes.dll` / `libnotes.so`) through JNI. Handle limits are strict; a leak takes the local server down. Agents are this kind.
- **Remote (CORBA/DIIOP[^diiop]):** Java runs in a separate JVM and talks to the Domino HTTP task over TCP/IP. Here `recycle()` not only destroys the local Java stub, it sends a network message telling the server to release the back-end object. Round-trips have latency, so recycling one-by-one in a tight loop is visibly slow — which is exactly where `recycle(Vector)` earns its keep: collect a batch and recycle it in a single round-trip.

## What not to recycle

The rule runs the other way too: some objects are handed to you by the Domino environment, which cleans them up itself — recycle them yourself and you break things. The common ones are the **`Session`, `AgentContext`, and `DocumentContext`** the agent environment provides; the runtime clears those when the agent finishes, so leave them alone. What you recycle is what you created: the `Document` pulled in a loop, the `View` you opened for the job, the `DateTime` you extracted.

One line for the whole piece: **what you new or get, you recycle; what the environment hands you, the environment keeps.**

## What about LotusScript and SSJS?

There's no "LotusScript version" or "SSJS version" of this piece to point to — because `recycle()` simply doesn't exist on those sides, and that absence *is* the point:

| Language | Memory management |
|---|---|
| **LotusScript** | the runtime frees back-end objects automatically; there is no `recycle`, and you never think about it |
| **SSJS / XPages** | likewise automatic; the container manages the `lotus.domino` objects for you |
| **Java (`lotus.domino`)** | the only one that asks you to `recycle()` by hand — the cost of the JVM not reaching the native C heap |

If you're coming from LotusScript, this is the instinct to unlearn: the "it goes out of scope, so it's fine" safety you had in LS does not hold in the Java Domino API. For how these classes relate to one another, see the [class map](/domino-news/en/map).

[^jni]: JNI (Java Native Interface) is the bridge Java uses to call native C/C++ libraries. Domino's core engine is written in C, and the Java API calls into it through JNI — the JVM's memory management ends on the Java side and can't reach the memory allocated on the C side.

[^diiop]: DIIOP (Domino IIOP) is the Domino server task that lets remote Java programs reach Domino objects over IIOP (Internet Inter-ORB Protocol, CORBA's network protocol). Compared with a local JNI call, it adds a network round-trip.
