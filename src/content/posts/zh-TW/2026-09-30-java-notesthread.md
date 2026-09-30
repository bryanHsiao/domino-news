---
title: "NotesThread：在 Domino 開背景執行緒的規矩——每條 thread 要 init、要自己的 session"
description: "在 Java 裡想開一條背景執行緒去跑 Domino 的 local 呼叫，直接 new Thread 是不行的——會拿不到 Notes 執行環境。要嘛繼承 NotesThread 覆寫 runNotes()、要嘛實作 Runnable 交給 NotesThread、要嘛自己在頭尾呼叫 sinitThread()／stermThread()。而且每條 thread 要有自己的 Session、自己 recycle，不能跨執行緒共用。這篇整理 NotesThread 的三種寫法、sinitThread/stermThread 的配對規則、每執行緒一個 session 的鐵律，以及背景執行緒裡拿不到 sessionAsSigner 的現實。"
pubDate: 2026-09-30T07:30:00+08:00
lang: zh-TW
slug: java-notesthread
tags:
  - "Java"
  - "Tutorial"
sources:
  - title: "NotesThread (Java) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESTHREAD_CLASS_JAVA.html"
  - title: "Running a Java program — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPILING_AND_RUNNING_JAVA.html"
  - title: "NotesFactory (Java) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESFACTORY_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-notesthread.webp"
coverStyle: "low-poly-3d"
---

你在 Java 裡想開一條背景執行緒,去跑一段會呼叫 Domino local API 的程式——直接 `new Thread(...)` 跑起來,卻拿不到 Notes 的執行環境、一呼叫 `lotus.domino` 就出事。

原因是:**對 Domino local 呼叫來說,執行緒不是隨便一條 `java.lang.Thread` 都行——它得先被 Notes 初始化過**。這件事由 `NotesThread` 負責。這篇講清楚 `NotesThread` 的三種寫法、頭尾初始化的配對規則,以及「每條 thread 一個自己的 `Session`」這條鐵律。

---

## 重點摘要

- **為什麼要 `NotesThread`**:官方明講它「extends java.lang.Thread to include special initialization and termination code for Notes/Domino」,而且「This extension to Thread is required to run Java programs that make local calls to the Notes/Domino classes」。一般 `Thread` 沒被 Notes init 過,local 呼叫會失敗。
- **三種寫法**:① 繼承 `NotesThread`、覆寫 `runNotes()`;② 實作 `Runnable` 交給 `NotesThread`;③ 自己呼叫 static 的 `sinitThread()`／`stermThread()`。
- **配對鐵律**:`stermThread()` 對每個 `sinitThread()` **只能呼叫一次**,官方建議把 `stermThread` 放 `finally`。
- **每條 thread 一個 Session**:每條做 local 呼叫的執行緒都要自己 init、並用 `NotesFactory.createSession()` 建自己的 `Session`;**Session 與 Domino 物件不能跨執行緒共用**。
- **背景執行緒沒有 faces context**:所以拿不到 XPages 的 `sessionAsSigner`——背景 thread 只能 `createSession()`／`createSessionWithFullAccess()` 自建 session。

## 為什麼一般 Thread 不行

官方 [NotesThread (Java)](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESTHREAD_CLASS_JAVA.html) 講得很直接:

> The NotesThread class extends java.lang.Thread to include special initialization and termination code for Notes/Domino. This extension to Thread is required to run Java programs that make local calls to the Notes/Domino classes.

而 [Running a Java program](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPILING_AND_RUNNING_JAVA.html) 補上鐵律:「Each thread of an application making local calls must initialize a NotesThread object.」——**每一條**要做 local 呼叫的執行緒,都得先初始化。沒 init 就呼叫 `lotus.domino` 類別,就是拿不到執行環境。

## 三種寫法

**① 繼承 `NotesThread`、覆寫 `runNotes()`**——進入點不是 `run()` 而是 `runNotes()`:

```java
public class MyJob extends NotesThread {
    public void runNotes() {
        try {
            Session s = NotesFactory.createSession();
            // …用 s 做事…
        } catch (NotesException e) { e.printStackTrace(); }
    }
}
new MyJob().start();
```

**② 實作 `Runnable`、交給 `NotesThread`**——照一般 threading 寫 `run()`,包進 `NotesThread`。

**③ 自己呼叫 static `sinitThread()`／`stermThread()`**——當你的執行緒**無法繼承** `NotesThread`(例如 listener thread)時用這招。官方:「Listener threads must use the static methods because they cannot inherit from NotesThread.」

```java
NotesThread.sinitThread();
try {
    Session s = NotesFactory.createSession();
    // …用 s 做事…
} finally {
    NotesThread.stermThread();   // 每個 sinitThread 對應剛好一次
}
```

## 配對鐵律:sinitThread ↔ stermThread

用 static 那套時最容易出錯的是**沒配對**。官方原話:

> Call stermThread() exactly one time for each call to sinitThread(); putting stermThread in a finally block is recommended.

漏了 `stermThread`、或呼叫次數對不上,執行緒的 Notes 資源就收不乾淨——放 `finally` 是官方建議的保險寫法。

## 每條 thread 一個 Session,別跨緒共用

這條跟 [Java 端要 recycle](/domino-news/posts/java-recycle-memory) 是同一種紀律:**每條執行緒有自己的 init、自己的 `Session`**(用 [`NotesFactory.createSession()`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESFACTORY_CLASS_JAVA.html) 建,細節見 [Java Session 與 NotesFactory 那篇](/domino-news/posts/java-session-notesfactory))。**不要**把一個 `Session`、`Database` 或 `Document` 建在 A 執行緒、拿去 B 執行緒用——backend 物件綁著建立它的執行緒的 Notes 環境,跨緒共用會 crash 或壞資料。要在多條 thread 做事,就各自建、各自 recycle、各自 term。

## 背景執行緒拿不到 sessionAsSigner

一個實務現實:XPages 裡的 `sessionAsSigner`(見 [sessionAsSigner 那篇](/domino-news/posts/xpages-sessionassigner))是綁在 **faces 執行環境**上的。你另開一條 `NotesThread` 背景執行緒時,那條 thread **沒有 faces context**,拿不到 `sessionAsSigner`。背景工作只能用 `NotesFactory.createSession()`(當前 effective id／伺服器身分)或 `createSessionWithFullAccess()` 自建 session——想在背景以某人身分跑,得自己把需要的資訊(如目標 DB、要處理的 UNID)傳進去,不能指望 XPages 的簽章者 session。

## 同類別在其他語言

`NotesThread` 是 **Java 專屬**的問題:

- **LotusScript**:LS agent 是**單執行緒**執行模型,沒有「自己開 thread」這回事,自然也沒有 `NotesThread`/init 的負擔。要並行,靠的是排多支 agent 或 server 的排程,不是語言內開執行緒。
- **SSJS／XPages**:同樣沒有讓你手動開 Notes 執行緒的機制;要背景處理,走的是 Java(用 `NotesThread`)或 server 端 agent,不是 SSJS 自己開 thread。
