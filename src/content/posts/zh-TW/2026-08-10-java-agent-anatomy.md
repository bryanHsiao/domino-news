---
title: "Java agent 的骨架：觸發、權限、輸出、除錯"
description: "前三篇都假設「agent 已經在跑」——會 recycle、拿到 Session、跑 DQL。但一個 Java agent 到底怎麼被觸發、用誰的權限執行、System.out 跑去哪、怎麼 debug？這篇補上最前面那一步：AgentBase/NotesMain 骨架、Trigger 與 unprocessedDocuments、agent signer 決定的權限、restricted/unrestricted，以及 System.out 進 log.nsf 的除錯路徑。"
pubDate: 2026-08-10T07:30:00+08:00
lang: zh-TW
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
cover: "/covers/java-agent-anatomy.webp"
coverStyle: "ukiyo-e"
---

前三篇有個共同的前提：agent 已經在跑。你[會 recycle](/domino-news/posts/java-recycle-memory)、[拿得到 Session](/domino-news/posts/java-session-notesfactory)、[跑得動 DQL](/domino-news/posts/java-dql-dominoquery)——但這些都從「`NotesMain()` 已經被呼叫」那一刻開始。往前一步的問題反而沒人講：一個 Java agent 是怎麼被觸發的？它用**誰的權限**跑？`System.out` 印出去的東西跑到哪裡？出錯了怎麼 debug？

這些不是寫在某個方法裡的邏輯，而是 agent 這個容器本身的規則。這篇把骨架補完：從 `AgentBase` 的結構，到 Trigger 與處理範圍、簽章決定的權限、以及輸出與除錯的實際路徑。

---

## 重點摘要

- **骨架固定**：繼承 `AgentBase`、把邏輯放進 `NotesMain()`。Designer 幫你產好模板（`getSession()` + `getAgentContext()`）。
- **Trigger 決定「何時跑」**：`Agent` 的 `Trigger` 屬性官方定義就是「indicates when this agent runs」——排程、事件觸發（如新郵件到達）、或手動。
- **排程 agent 的核心是 unprocessedDocuments**：`agentContext.getUnprocessedDocuments()` 只給你這個 agent 上次跑之後新增/修改、還沒處理過的文件；處理完呼叫 `updateProcessedDoc()` 標記，下次就不會再撿到它。
- **agent 用「簽章者」的權限跑**：`Agent` 的 `Owner` 官方定義是「the name of the person who last modified and saved an agent」。誰最後存檔簽章，agent 就用誰的身分與權限執行。
- **restricted vs unrestricted**：restricted agent 只能碰 Domino 資料庫；unrestricted 才能碰 server 檔案系統、網路、執行緒。這在 agent 安全性設定裡決定，也受 ECL[^ecl] 約束。
- **`System.out` 進 log.nsf**：排程 / `runOnServer` 的 agent，`System.out` 寫到 `log.nsf` 的「Miscellaneous Events」；手動從 client 跑則進本機 Java Debug Console。

---

## 骨架：AgentBase 與 NotesMain

Java agent 的外形是固定的——繼承 [`AgentBase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_AGENTBASE_CLASS_JAVA.html)、把程式放進 `NotesMain()`（[8/8 那篇](/domino-news/posts/java-session-notesfactory)講過 `getSession()` 就在這裡拿）。在 Designer 裡新建一個 Java agent 時，它會直接給你這個模板：一個 `Session`、一個 `AgentContext`，其餘留白給你填。

你可以選「在 Designer 裡直接寫 Java」，或「匯入編譯好的 Java」（imported Java，適合有既有 build 流程、要引用外部 jar 的情況）。骨架一樣，差別只在原始碼放哪、怎麼編。

## Trigger 與處理範圍

一個 agent「什麼時候跑、跑哪些文件」，是 agent 屬性決定的，不是程式碼。[`Agent`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS_JAVA.html) 類別的 `Trigger` 屬性，官方定義就一句：

> Read-only. Indicates when this agent runs.

常見的觸發：**排程**（每小時 / 每天…）、**事件**（例如新郵件到達前）、**手動**（從動作選單或 agent 清單）。搭配的是「處理範圍」——全部文件、選取的文件、或「上次跑之後新增/修改的」。

最後那個範圍，是排程 agent 的靈魂，靠 `AgentContext` 的兩個方法撐起來：

- `getUnprocessedDocuments()`：只回傳「符合這個 agent 範圍、且還沒被它處理過」的文件集合。
- `updateProcessedDoc(doc)`：把某份文件標記成「已由這個 agent 處理」，下次 `getUnprocessedDocuments()` 就不會再撿到它。

這一對讓「每小時跑一次、只處理這小時內的新單」變得乾淨——你不必自己記「上次跑到哪」，Domino 幫你記。

## AgentContext：agent 的執行脈絡

[`AgentContext`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENTCONTEXT_CLASS_JAVA.html) 官方定義是「represents the agent environment of the current program, if an agent is running it」——它就是 agent 執行當下的整個脈絡。除了上面那對，常用的還有：

- `getCurrentDatabase()`：agent 所在的資料庫。
- `getDocumentContext()`：觸發這次執行的文件（例如 web agent 收到的表單、或選取的那份）。
- `getEffectiveUserName()`：這次執行「以誰的身分」進行。
- `getSavedData()`：官方定義是「a document that an agent uses to store information between invocations」——跨執行存狀態的地方。要記「上次處理到哪個游標」「累計了多少」，寫進這份文件，下次讀回來。

## 用誰的權限跑：簽章者

這是 agent 最容易踩雷、也最容易被忽略的一環：**agent 不是用「觸發它的人」的權限跑，而是用「簽章者」的權限。** `Agent` 的 `Owner` 屬性官方定義是：

> Read-only. The name of the person who last modified and saved an agent.

也就是說，**誰最後存檔、誰就是簽章者**，agent 就帶著那個人的身分與 ACL 權限執行。你在開發機存了一個 agent、部署到正式機，它會用「你」的身分跑——如果你在正式機沒有足夠權限，agent 就會失敗；反過來，用高權限帳號簽章的 agent 部署出去，等於把那份權限一起帶出去了。

權限還有兩層閘門：

- **ACL**：`ACLEntry` 的 `IsCanCreateLSOrJavaAgent` 屬性決定一個人「能不能建立 LotusScript 或 Java agent」。
- **restricted vs unrestricted**：在 agent 的安全性設定裡，restricted agent 只能做 Domino 資料庫操作；unrestricted 才能碰 server 的檔案系統、網路、開執行緒。要讀寫伺服器上的檔案、呼叫外部服務，agent 得是 unrestricted，而簽章者也得被 server 授權能跑 unrestricted agent。工作站端則另受 ECL[^ecl] 約束。

## System.out 跑去哪、怎麼 debug

Java agent 最常見的「我 print 了怎麼什麼都沒看到」，答案取決於它怎麼被觸發：

- **排程 / `runOnServer`**：`System.out` 寫進**執行所在那台**的 `log.nsf`，在「Miscellaneous Events」檢視裡看得到。`e.printStackTrace()` 的例外堆疊也在這。
- **手動從 Notes client 跑**：`System.out` 進本機的 **Java Debug Console**。

要更結構化的紀錄，用 `Log` 類別的 `logAction()` / `logError()` 直接寫進 agent 的 log。排查正式機上的排程 agent，養成「例外進 `log.nsf`」的習慣，比到處猜有效得多。

## 完整範例：排程 agent 處理新單

把上面串起來，就是一個典型排程 agent 的骨架，只處理未處理過的文件，並照 [recycle 紀律](/domino-news/posts/java-recycle-memory)收乾淨：

```java
import lotus.domino.*;

public class ProcessNewOrders extends AgentBase {
    public void NotesMain() {
        try {
            Session session = getSession();
            AgentContext ctx = session.getAgentContext();

            DocumentCollection dc = ctx.getUnprocessedDocuments();  // 只撿新的/改過的
            Document doc = dc.getFirstDocument();
            Document next = null;
            while (doc != null) {
                next = dc.getNextDocument(doc);
                // ...處理當份 doc...
                ctx.updateProcessedDoc(doc);   // 標記已處理，下次不再撿
                doc.recycle();                 // 逐份收（見 recycle 那篇）
                doc = next;
            }
        } catch (Exception e) {
            e.printStackTrace();               // 排程時進 log.nsf 的 Miscellaneous Events
        }
        // 沒有 session.recycle()：agent 的 Session 由 Agent Manager 收
    }
}
```

注意結尾：如同 [8/8 講的](/domino-news/posts/java-session-notesfactory)，agent 的 Session 是環境給的，**不要自己 recycle**；但迴圈裡自己撈的 `Document` 要收。

## 同類別在其他語言

「agent 骨架」這件事，各語言差滿多的：

| 語言 | agent 長怎樣 |
|---|---|
| **LotusScript** | 直接在 `Initialize` 事件寫程式，沒有 `AgentBase`/`NotesMain` 這層包裝；`session`、`unprocessedDocuments` 等直接可用 |
| **SSJS / XPages** | 較少用傳統 agent；排程邏輯多改走 XPages 或外部排程 |
| **Java（`lotus.domino`）** | 一律 `AgentBase` + `NotesMain()` 骨架，`AgentContext` 從 `getSession().getAgentContext()` 取得 |

從 LotusScript 過來，最大的轉換是那層 `AgentBase`/`NotesMain()` 包裝：LS 的 `Initialize` 換成 Java 的 `NotesMain()`，`session` 換成 `getSession()`。其餘（Trigger、範圍、簽章權限、log.nsf）其實跨語言一致，只是 Java 讓你把它們看得更清楚。想看這些類別彼此怎麼串，可參考站上的[類別地圖](/domino-news/map)。

[^ecl]: ECL（Execution Control List，執行控制清單）是 Notes 工作站端的安全機制，依「簽章者」決定一段程式能不能在該工作站做敏感操作（存取檔案、呼叫外部程式等）。與 server 端的 restricted/unrestricted 設定是兩套獨立的閘門。
