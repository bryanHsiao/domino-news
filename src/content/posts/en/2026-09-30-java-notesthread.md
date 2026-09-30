---
title: "NotesThread: The Rules for Background Threads in Domino — init Each Thread, Give It Its Own Session"
description: "Want to run Domino local calls on a background thread in Java? A plain new Thread won't do — it has no Notes runtime. You either extend NotesThread and override runNotes(), implement Runnable handed to NotesThread, or call sinitThread()/stermThread() yourself. And every thread needs its own Session and its own recycle — you can't share across threads. This covers the three NotesThread patterns, the sinitThread/stermThread pairing rule, the one-session-per-thread law, and why a background thread can't get sessionAsSigner."
pubDate: 2026-09-30T07:30:00+08:00
lang: en
slug: java-notesthread
tags:
  - "Java"
  - "Tutorial"
sources:
  - title: "NotesThread (Java) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESTHREAD_CLASS_JAVA.html"
  - title: "Running a Java program — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPILING_AND_RUNNING_JAVA.html"
  - title: "NotesFactory (Java) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESFACTORY_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
---

You want a background thread in Java to run some code that makes Domino local calls — so you `new Thread(...)` it, and it can't get the Notes runtime; the first `lotus.domino` call blows up.

The reason: **for Domino local calls, not any old `java.lang.Thread` will do — it has to be initialized by Notes first.** That's `NotesThread`'s job. This piece lays out the three ways to use `NotesThread`, the init/terminate pairing rule, and the "one `Session` per thread" law.

---

## TL;DR

- **Why `NotesThread`**: HCL states it "extends java.lang.Thread to include special initialization and termination code for Notes/Domino," and "This extension to Thread is required to run Java programs that make local calls to the Notes/Domino classes." A plain `Thread` isn't Notes-initialized, so local calls fail.
- **Three patterns**: (1) extend `NotesThread` and override `runNotes()`; (2) implement `Runnable` handed to `NotesThread`; (3) call the static `sinitThread()` / `stermThread()` yourself.
- **The pairing law**: call `stermThread()` exactly once per `sinitThread()`; HCL recommends putting `stermThread` in a `finally`.
- **One `Session` per thread**: every thread making local calls initializes itself and builds its own `Session` via `NotesFactory.createSession()`; **you can't share a Session or Domino object across threads.**
- **A background thread has no faces context**: so it can't get the XPages `sessionAsSigner` — it can only `createSession()` / `createSessionWithFullAccess()` on its own.

## Why a plain Thread won't do

HCL's [NotesThread (Java)](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESTHREAD_CLASS_JAVA.html) is blunt:

> The NotesThread class extends java.lang.Thread to include special initialization and termination code for Notes/Domino. This extension to Thread is required to run Java programs that make local calls to the Notes/Domino classes.

And [Running a Java program](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPILING_AND_RUNNING_JAVA.html) adds the law: "Each thread of an application making local calls must initialize a NotesThread object." — **every** thread that makes local calls must be initialized first. Call `lotus.domino` classes without that init, and there's no runtime to serve them.

## The three patterns

**(1) Extend `NotesThread`, override `runNotes()`** — the entry point is `runNotes()`, not `run()`:

```java
public class MyJob extends NotesThread {
    public void runNotes() {
        try {
            Session s = NotesFactory.createSession();
            // …work with s…
        } catch (NotesException e) { e.printStackTrace(); }
    }
}
new MyJob().start();
```

**(2) Implement `Runnable`, hand it to `NotesThread`** — write `run()` as you would for any threaded class, wrapped in a `NotesThread`.

**(3) Call the static `sinitThread()` / `stermThread()` yourself** — for when your thread **can't inherit** from `NotesThread` (e.g. a listener thread). HCL: "Listener threads must use the static methods because they cannot inherit from NotesThread."

```java
NotesThread.sinitThread();
try {
    Session s = NotesFactory.createSession();
    // …work with s…
} finally {
    NotesThread.stermThread();   // exactly once per sinitThread
}
```

## The pairing law: sinitThread ↔ stermThread

The static approach's most common mistake is not pairing them. HCL's words:

> Call stermThread() exactly one time for each call to sinitThread(); putting stermThread in a finally block is recommended.

Miss `stermThread`, or call it a mismatched number of times, and the thread's Notes resources don't get cleaned up — the `finally` block is HCL's recommended safeguard.

## One Session per thread — don't share across threads

This is the same discipline as [recycling on the Java side](/domino-news/en/posts/java-recycle-memory): **each thread has its own init and its own `Session`** (built with [`NotesFactory.createSession()`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESFACTORY_CLASS_JAVA.html); details in [the Java Session / NotesFactory piece](/domino-news/en/posts/java-session-notesfactory)). **Don't** build a `Session`, `Database`, or `Document` on thread A and use it on thread B — backend objects are bound to the Notes runtime of the thread that created them, and sharing across threads crashes or corrupts data. To work on several threads, each builds its own, recycles its own, and terminates its own.

## A background thread can't get sessionAsSigner

A practical reality: the XPages `sessionAsSigner` (see [the sessionAsSigner piece](/domino-news/en/posts/xpages-sessionassigner)) is bound to the **faces runtime**. When you spin up a separate `NotesThread`, that thread **has no faces context** and can't get `sessionAsSigner`. Background work can only use `NotesFactory.createSession()` (the current effective/server identity) or `createSessionWithFullAccess()`. If you need the background job to act on someone's behalf, pass in the information it needs (target DB, the UNIDs to process) — you can't rely on the XPages signer session there.

## What about LotusScript and SSJS?

`NotesThread` is a **Java-only** concern:

- **LotusScript**: an LS agent runs single-threaded — there's no "spin up a thread," and therefore no `NotesThread` / init burden. For concurrency you schedule multiple agents or use the server's scheduler, not in-language threads.
- **SSJS/XPages**: likewise there's no mechanism to hand-start a Notes thread; for background work you drop to Java (with `NotesThread`) or a server-side agent, not an SSJS-started thread.
