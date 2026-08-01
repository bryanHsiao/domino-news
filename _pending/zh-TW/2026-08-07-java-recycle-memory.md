---
title: "recycle():Java 版 Domino API 的手動記憶體管理"
description: "同一段邏輯，LotusScript 跑一輩子都沒事，搬到 Java 版的 lotus.domino 卻會在幾萬份文件的迴圈裡把 agent 記憶體吃垮。原因是每個 Java 物件背後都連著一個垃圾回收看不到的後端 handle。這篇拆解機制、四條官方規則、迴圈洩漏樣式與安全寫法、NotesThread 的角色，以及 local 與遠端 session 的差異。"
pubDate: 2026-08-07T07:30:00+08:00
lang: zh-TW
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

你把一段跑了很多年的 LotusScript agent 改寫成 Java。邏輯一模一樣：開一個 view、抓出一批文件、逐份讀欄位、算一算、寫回去。測試環境幾百份文件，跑得又快又乾淨。上線那天，同一支程式對著五萬份文件的正式資料庫跑——跑到一半，agent 記憶體爆掉，server 主控台開始噴 out of memory，嚴重時整台 server 被拖垮。

程式碼從頭到尾看不出哪裡錯。用 LotusScript 的眼睛看，它甚至比原版更嚴謹。問題是：**LotusScript 從來不需要你清理物件，Java 版的 `lotus.domino` 需要，而且是你自己的責任。** 少的那一行叫 `recycle()`。

這篇講清楚三件事：為什麼同樣一套 Domino 物件，LS 不用管、Java 要管；`recycle()` 的兩個簽章與四條官方規則；還有最容易中的迴圈洩漏樣式、它的正確寫法，以及 `NotesThread`、遠端 session 這些會改變遊戲規則的細節。

---

## 重點摘要

- **每個 Java Domino 物件是「輕量前台 + 重量後台」的雙層結構。** 你手上的 Java 物件很小，它背後連著一個 C 寫的後端物件（透過一個 handle）。Java 的垃圾回收只看得到前台，看不到後台。
- **垃圾回收清不掉後端物件，只有 `recycle()` 收得掉。** 不呼叫 `recycle()`，後端 handle 就一直佔著，累積到一定量就是 out of memory 或 handle 耗盡。
- **四條官方規則**：只在不再需要時 recycle；在建立它的同一條執行緒裡 recycle；**recycle 父物件會連帶 recycle 所有子物件**；同一個 Domino 元素若有多個物件代表，recycle 一個等於全部 recycle。
- **迴圈是頭號災區。** `getNextDocument()` 每一圈都生一個新的後端 handle，不逐份 recycle 就是穩定洩漏。正解是「兩變數迴圈」：先抓下一份、處理完當份、recycle 當份、再前進。
- **`NotesThread` 決定「同一條執行緒」這條規則能不能成立。** agent（`AgentBase`）已經幫你處理好；獨立程式或 servlet 裡自己開執行緒，就得自己 `sinitThread` / `stermThread`。
- **遠端（DIIOP）session 差很多。** 這時 `recycle()` 是一次網路往返，緊迫迴圈裡逐份 recycle 會慢；改用 `recycle(Vector)` 批次收。

---

## 為什麼 LS 不用、Java 要用

LotusScript 和 Java 呼叫的其實是同一組 C 寫的 Domino 引擎。差別在「誰負責清後面那層」。

用 LotusScript 時，物件離開作用域，runtime 會替你把後端一起收掉——你從來不必想這件事。Java 不一樣。官方文件把話講得很直白：

> Java 對重量級的後端 Domino 物件一無所知，它只認得代表它們的輕量 Java 物件。除非你先明確 recycle，否則垃圾回收對 Domino 物件毫無作用。

也就是說，你 `db.getDocumentByUNID(...)` 拿到的那個 `Document`，是一個很小的 Java 前台物件，真正裝資料、佔記憶體的是它背後那個 C 後端物件。Java 的垃圾回收看得到前台這一小塊、時候到了會清掉它——但**後台那塊它完全看不到**，於是那個 handle 就這樣孤兒化，直到 process 結束。跑個十份、一百份，你不會察覺；跑五萬份，孤兒 handle 在垃圾回收還沒動作前就已經堆成一座山。這就是為什麼「測試沒事、上線爆掉」。

這不是 bug，是 Java 存取原生程式庫[^jni]的先天代價：JVM 的記憶體管理管不到 process 另一頭的 C heap。`recycle()` 就是你手動把後端那塊還給系統的唯一方式。

## `recycle()`：兩個簽章、四條規則

[`recycle()` 的官方說明](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) 很短，但每一句都是踩過雷才寫得出來的。方法本身「無條件銷毀一個物件、把它的記憶體還給系統」，所有 `lotus.domino` 類別都有兩個版本：

```java
public void recycle()
public void recycle(java.util.Vector objects)
```

後者一次收掉整個 Vector 裡的物件——對遠端呼叫特別划算，等一下會講。

官方列的四條規則，實務上是這樣讀：

1. **只在不再需要時才 recycle。** recycle 過的物件 handle 已經失效，再去碰它就是存取已銷毀的後端——輕則例外，重則不可預期。
2. **在建立它的同一條執行緒裡 recycle。** 後端 handle 綁在建立它的那條執行緒的 thread-local 儲存上，跨執行緒收會出事。這條規則直接牽出下面 `NotesThread` 的段落。
3. **recycle 父物件會連帶 recycle 所有子物件。** recycle 掉 `Database`，它底下的 `View`、`Document`、`Item` 全部一起沒了。這是收尾時的好朋友，也是迴圈裡的陷阱（後面會說明）。
4. **同一元素的多個代表，recycle 一個等於全部。** `View v1 = db.getView("All"); View v2 = db.getView("All");` 兩個 Java 物件指向同一個後端 view，`v1.recycle()` 之後 `v2` 也一起失效。

## 迴圈：頭號災區

九成的 Java Domino 記憶體問題都長同一個樣子——在集合上迴圈、卻沒收當份文件：

```java
// 洩漏版：每一圈都生一個新後端 handle，卻全被丟給垃圾回收（而它收不到）
Document doc = collection.getFirstDocument();
while (doc != null) {
    // ...處理 doc...
    doc = collection.getNextDocument(doc);  // 舊 doc 的後端 handle 就這樣孤兒化
}
```

問題在 `getNextDocument()`：它每一圈都實體化一個新的 Java 物件**和一個新的後端 handle**，而上一圈那個 `Document` 被直接覆蓋、丟給垃圾回收——但垃圾回收清不到它的後端。規則三（recycle 父物件連帶子物件）救不了你，因為 `collection` 要到整段跑完才 recycle，屆時幾萬個孤兒 handle 早就把記憶體塞爆了。

正解是「兩變數迴圈」：先抓下一份的參照，再收掉當份：

```java
public void processDocuments(DocumentCollection collection) throws NotesException {
    Document doc = collection.getFirstDocument();
    Document nextDoc = null;
    while (doc != null) {
        nextDoc = collection.getNextDocument(doc);   // 1. 先握住下一份
        // 2. 處理當份 doc
        // System.out.println(doc.getItemValueString("Subject"));
        doc.recycle();                                // 3. 收掉當份的後端 handle
        doc = nextDoc;                                // 4. 前進
    }
}
```

順手的兩個習慣：`recycle()` 之後把變數設成 `null`，避免不小心又去碰失效的 handle；以及在迴圈外包一層 `try/finally`，例外中斷時仍能把手上的 `doc` / `nextDoc` 收乾淨。還有一個惡名昭彰的細節：`DateTime` 和 `DateRange` 特別會漏，如果你在迴圈裡抽日期，抽完立刻 recycle。

## `NotesThread`：為什麼「同一條執行緒」成立

規則二說「在建立它的同一條執行緒裡 recycle」，前提是那條執行緒得先向 Domino 引擎登記過——這是 [`NotesThread`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTHREAD_CLASS_JAVA.html) 的工作。它替 Notes/Domino 準備專屬的初始化與收尾，是「在本機直接呼叫 Domino 類別」的必要條件。

好消息是，多數情況你不必自己碰它。寫 agent 時繼承的 `AgentBase`、寫 applet 時的 `AppletBase`，都已經把執行緒初始化包在裡面——你的程式碼直接用就好。要自己處理的是這兩種場景：

- **繼承 `NotesThread`**：把邏輯放進 `runNotes()`（而不是一般的 `run()`），初始化與收尾自動幫你做。
- **自己開執行緒**（例如 servlet、獨立程式）：在開頭呼叫 `NotesThread.sinitThread()`、並在 `finally` 區塊呼叫 `NotesThread.stermThread()`，兩者要一對一配對。

不論哪種，官方的底線是：**那條執行緒上建立的 Domino 物件，都要在執行緒結束前 recycle**，否則會在 OS 層面造成嚴重洩漏。

## local 與遠端：DIIOP 改寫成本結構

同一套 Java API，跑的場景有兩種，[執行方式](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPILING_AND_RUNNING_JAVA.html)不同、recycle 的成本也不同：

- **本機（JNI）**：Java 直接跑在 Domino server 或 Notes client 上，透過 JNI 呼叫原生 C 二進位檔（`nnotes.dll` / `libnotes.so`）。handle 上限很嚴，一漏就是拖垮本機。agent 就是這一類。
- **遠端（CORBA/DIIOP[^diiop]）**：Java 跑在另一台 JVM，透過 TCP/IP 跟 Domino 的 HTTP 任務通訊。這時 `recycle()` 除了銷毀本地的 Java stub，還會送一則網路訊息叫 server 釋放後端物件。網路往返有延遲，緊迫迴圈裡逐份 recycle 會明顯變慢——這正是 `recycle(Vector)` 的用武之地：把一批物件收集起來，一次網路往返批次收掉。

## 什麼不要 recycle

規則反過來也要記：有些物件是 Domino 環境給你的、由它負責收，你自己去 recycle 反而會出事。最常見的是 agent 環境提供的 **`Session`、`AgentContext`、`DocumentContext`**——agent 結束時 runtime 會自己清，你不要碰。你該收的是「自己建出來的」那些：迴圈裡抓的 `Document`、臨時開的 `View`、抽出來的 `DateTime`。

一句話收斂整篇：**你 new / get 出來的，就是你要 recycle 的；環境給你的，交給環境。**

## 同類別在其他語言

這篇沒有「LotusScript 版」或「SSJS 版」可對照，因為 `recycle()` 在那兩邊根本不存在——而這個「不存在」正是重點：

| 語言 | 記憶體管理 |
|---|---|
| **LotusScript** | runtime 自動收後端物件，沒有 `recycle`，你不必想 |
| **SSJS / XPages** | 同樣自動管理；XPages 的 `lotus.domino` 物件由容器代管 |
| **Java（`lotus.domino`）** | 唯一要你手動 `recycle()` 的，代價來自 JVM 管不到原生 C heap |

如果你是從 LotusScript 跨過來的，這是最需要改掉的直覺：在 LS 世界「物件離開作用域就沒事」的安全感，到了 Java 版 Domino API 這裡不成立。想看這些類別彼此怎麼關聯，可以參考站上的[類別地圖](/domino-news/map)。

[^jni]: JNI（Java Native Interface）是 Java 呼叫 C/C++ 等原生程式庫的橋接介面。Domino 的核心引擎是 C 寫的，Java API 透過 JNI 呼叫它——JVM 的記憶體管理止於 Java 這一側，管不到 C 那側配置的記憶體。

[^diiop]: DIIOP（Domino IIOP）是 Domino server 上讓遠端 Java 程式透過 IIOP（Internet Inter-ORB Protocol，CORBA 的網路協定）存取 Domino 物件的任務。相對於本機 JNI 直呼，它多了一層網路往返。
