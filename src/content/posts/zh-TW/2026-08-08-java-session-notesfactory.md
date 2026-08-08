---
title: "在 Java 裡拿到 Session：NotesFactory、local 與遠端"
description: "LotusScript 的 session 是個你從來不必建立的全域變數；Java 沒有它。碰任何一份文件之前，你得自己先取得一個 Session——而怎麼拿，取決於你的 code 跑在 agent、獨立程式，還是遠端。這篇拆解 NotesFactory 的三條取得路徑、local(JNI) 與遠端(DIIOP) 的差別、誰建誰收的 recycle 規則，以及位元數與每執行緒一個 session 這兩個常見地雷。"
pubDate: 2026-08-08T07:30:00+08:00
lang: zh-TW
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
cover: "/covers/java-session-notesfactory.webp"
coverStyle: "bw-grain"
---

寫 LotusScript 時，`session` 就在那裡。你從來沒建立過它，也不必——它是個全域變數，一開 agent 就能直接 `session.getUserName()`。這份「理所當然」跟著很多人一路帶進 Java，然後在第一支 Java 程式就撞牆：Java 裡**沒有**這個全域。碰任何一份文件之前，你得自己先拿到一個 `Session`。

麻煩的是，「怎麼拿」不只一種寫法，而是取決於你的 code 跑在哪裡。同一段邏輯，包成 agent、包成獨立的 `main()`、還是跑在另一台機器上遠端連進來，取得 Session 的方式完全不同，選錯的下場輕則啟動時 `UnsatisfiedLinkError`、`NoClassDefFoundError`，重則 agent 一跑就掛。

這篇只講一件事：在 Java 裡，你到底怎麼拿到那個 Session，以及每一種場景背後的取捨。

---

## 重點摘要

- **Java 沒有 LotusScript 的全域 `session`。** 入口是 `NotesFactory`——官方原文：「Applications call the `NotesFactory createSession` methods to create a `Session` object.」
- **三條取得路徑，看你的 code 在哪跑：**
  - **agent**：繼承 `AgentBase`、在 `NotesMain()` 裡用 `getSession()`。這個 Session 是環境給的，**別自己建、也別 recycle**。
  - **本機獨立程式 / servlet（JNI）**：先 `NotesThread` 初始化，再 `NotesFactory.createSession()`。這是你建的，**你要 recycle**。
  - **遠端（DIIOP）**：`NotesFactory.createSession(host, user, password)`，走網路。
- **local 與遠端用不同的 jar**：本機用 `Notes.jar` + JNI[^jni]；遠端用 `NCSO.jar` + 網路 socket，不需要 `NotesThread`，但 server 得開著 DIIOP[^diiop] task（預設 port 63148）。
- **誰建誰收**：agent 的 Session 不要 recycle；你自己 `createSession()` 出來的，一定要在 `finally` 裡 recycle，否則後端洩漏。
- **兩個常見地雷**：本機 JNI 時 JVM 位元數要跟 Domino 一致；一條執行緒只 `createSession()` 一次。

---

## LS 有全域 session，Java 沒有

差別的根源，跟 [recycle() 那篇](/domino-news/posts/java-recycle-memory)講的是同一件事：LotusScript 幫你把很多東西藏起來了。`session` 全域是其中一個——runtime 在 agent 啟動時就替你備好，你直接用。

Java 沒有這層代勞。[`NotesFactory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFACTORY_CLASS_JAVA.html) 是唯一的入口，官方把它的職責寫得很直白：

> Applications call the `NotesFactory createSession` methods to create a `Session` object.

`NotesFactory` 是一個工廠，它的 `createSession()` 有一長串多載，粗分成兩群：**本機呼叫**（用你的 Notes ID：`createSession()`、`createSessionWithFullAccess()`…）和**遠端呼叫**（指定主機：`createSession(host)`、`createSession(host, user, passwd)`…）。選哪一個，等於選你的執行場景。

## 三條取得路徑

### 1. Agent：`getSession()`，別碰它的生死

寫 agent 時你其實**不呼叫 `NotesFactory`**。[`AgentBase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_AGENTBASE_CLASS_JAVA.html) 幫你把 Session 準備好了——官方原文：「Notes/Domino agents must extend `AgentBase` and use `NotesMain()` as the entry point」。你在 `NotesMain()` 裡用 `getSession()` 拿到它，再 `getAgentContext()` 取得當前資料庫等執行脈絡。

關鍵是：這個 Session 是 Agent Manager 配給你的，它負責在 agent 結束時清掉。**你不要自己建、也不要 recycle 它**——自己 recycle 會把 server 預期要管的後端 handle 銷毀，讓 agent（甚至 Agent Manager 任務）當掉。

### 2. 本機獨立程式 / servlet：NotesThread + createSession

在 server 上跑一支獨立 `main()`、或 Tomcat/servlet 走本機 JNI 連 Domino 時，你得自己走完整套：先讓執行緒向 Domino 登記，再 `createSession()`。因為 Domino 的 C API 用 thread-local 儲存來追記憶體，這一步不能省——用 `NotesThread.sinitThread()` / `stermThread()`（後者放 `finally`），或改繼承 `NotesThread` 把邏輯放進 `runNotes()`。這是你建出來的 Session，收尾也是你的責任。

### 3. 遠端：createSession(host, user, password)

Java 跑在另一台 JVM、透過網路連進 Domino 時，用帶主機的多載：`createSession(host, user, passwd)`。這條路[跑法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html)不一樣：用 `NCSO.jar`（不是 `Notes.jar`），透過標準網路 socket 溝通，所以**不需要 `NotesThread` 初始化**。前提是 server 正在跑 DIIOP task、而且 DIIOP port（預設 63148）有開。

## local 與遠端：不只是換個方法名

這兩條路的差別是整條技術堆疊：

| | 本機（JNI） | 遠端（DIIOP） |
|---|---|---|
| 方法 | `createSession()` | `createSession(host, user, passwd)` |
| jar | `Notes.jar` | `NCSO.jar` |
| 溝通 | JNI 直呼原生 C 二進位 | 網路 socket（IIOP） |
| `NotesThread` | 必要 | 不需要 |
| 前提 | classpath 有 `Notes.jar`、OS 的 `PATH`(Windows)/`LD_LIBRARY_PATH`(Linux) 指到 Domino 執行檔目錄 | server 開 DIIOP task、port 63148 通 |

本機那條最容易漏的是環境：JVM 要能載到 `nnotes.dll` / `libnotes.so`，classpath 和系統路徑兩個都得對，否則就是啟動時 `UnsatisfiedLinkError`。

## 誰建誰收

Session 的 recycle 規則就一句話，**看你是不是它的擁有者**：

- **自己 `createSession()` 建的**（獨立程式）：你擁有它，要在 `finally` 裡 `session.recycle()`，在執行緒結束前收掉，否則後端嚴重洩漏。
- **`getSession()` 拿的**（agent）：server 擁有它，你不要 recycle。

這跟 [recycle() 那篇](/domino-news/posts/java-recycle-memory)的「你 new / get 出來的自己收，環境給的交給環境」是同一條原則，Session 只是它最頂層的例子。

## 兩個常見地雷

- **位元數要一致**：本機 JNI session，JVM 的位元數必須跟 Domino 安裝完全對上（64-bit JVM 配 64-bit Domino）。不一致就是載不到原生程式庫。
- **一條執行緒一個 session**：`createSession()` 一條執行緒只該呼叫一次。在同一條本機執行緒重複建 session 會很快耗盡資源。

## 兩段完整範例

獨立 `main()`（本機 JNI）——注意 `NotesThread` 包在最外層、Session 在 `finally` 收掉：

```java
import lotus.domino.*;

public class StandaloneApp {
    public static void main(String[] args) {
        NotesThread.sinitThread();                 // 1. 初始化 Domino 執行緒脈絡
        Session session = null;
        try {
            session = NotesFactory.createSession(); // 2. 用 NotesFactory 建 Session
            System.out.println("Running as: " + session.getUserName());
            // ...業務邏輯...
        } catch (NotesException e) {
            e.printStackTrace();
        } finally {
            try {
                if (session != null) session.recycle();  // 3. 收掉「你建的」Session
            } catch (NotesException ne) { ne.printStackTrace(); }
            NotesThread.stermThread();              // 4. 結束執行緒脈絡
        }
    }
}
```

agent（繼承 `AgentBase`）——沒有 `NotesThread`、也**沒有** `recycle()`：

```java
import lotus.domino.*;

public class JavaAgent extends AgentBase {
    public void NotesMain() {
        try {
            Session session = getSession();                     // 環境給的，別自己建
            AgentContext ctx = session.getAgentContext();
            Database db = ctx.getCurrentDatabase();
            System.out.println("In database: " + db.getTitle());
            // ...業務邏輯...
        } catch (Exception e) {
            e.printStackTrace();
        }
        // 沒有 session.recycle()：Agent Manager 會自己收 Session 與執行緒
    }
}
```

## 同類別在其他語言

「怎麼拿 Session」這件事，其實只有 Java 需要你動腦：

| 語言 | 怎麼拿 Session |
|---|---|
| **LotusScript** | 全域 `session` 直接用；或需要時 `New NotesSession` |
| **SSJS / XPages** | 全域 `session`（與 `database`）由容器備好，直接用 |
| **Java（`lotus.domino`）** | 沒有全域，一律得經 `NotesFactory`（或 agent 的 `getSession()`），還要分 local / 遠端 |

如果你是從 LotusScript 過來的，這是繼 `recycle()` 之後第二個要改的直覺：Session 不會自己出現，你得先決定「code 在哪跑」，再挑對應的取得方式。想看這些類別彼此怎麼串，可參考站上的[類別地圖](/domino-news/map)。

[^jni]: JNI（Java Native Interface）是 Java 呼叫原生 C/C++ 程式庫的橋接介面。本機 session 透過 JNI 直接呼叫 Domino 的 C 引擎（`nnotes.dll` / `libnotes.so`），所以需要 `Notes.jar` 加上正確的系統路徑。

[^diiop]: DIIOP（Domino IIOP）是 Domino server 上的一個任務，讓遠端 Java 程式透過 IIOP（CORBA 的網路協定）連進來存取 Domino 物件。用它就不必把 Java 跑在 server 本機，代價是多一層網路。
