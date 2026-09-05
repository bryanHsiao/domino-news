---
title: "Domino IQ 逾時的 Java 解法：LLMReq.completionStream，以及 XPages SSJS 怎麼調用它"
description: "昨天那篇用 LotusScript 的 CompletionStream 突破了 Domino IQ 的 5 分鐘逾時；如果你的程式是 Java（agent、bean）或 XPages（SSJS），撞到的是同一個逾時。這篇給 Java 版：LLMReq.completionStream 搭配 CompletionStreamCallback 介面（回傳 Continue／Stop 控制串流），以及一個關鍵事實——SSJS 沒有原生的 LLM class，但 SSJS 的 session 就是 lotus.domino.Session，所以你可以直接調用 Java API，或把串流包成 Java class 再從 SSJS 引用。附三種語言一張對照表。"
pubDate: 2026-09-06T07:30:00+08:00
lang: zh-TW
slug: domino-iq-timeout-java-ssjs
tags:
  - "Domino IQ"
  - "Java"
  - "SSJS"
  - "Tutorial"
sources:
  - title: "LLMReq (Java) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESLLMREQUEST_CLASS_JAVA.html"
  - title: "CompletionStream method (LLMReq - Java) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CompletionstreamLLM_method_Java.html"
  - title: "Using Script Libraries — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_SCRIPT_LIBRARIES.html"
  - title: "Understanding XPages（SSJS 存取的 Domino 物件與 LS/Java 相同）— HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_overview_xpages.html"
relatedJava: ["LLMReq", "LLMRes"]
relatedSsjs: []
---

[昨天那篇](/domino-news/posts/domino-iq-timeout-streaming)講了 LotusScript 怎麼用 `CompletionStream` 突破 Domino IQ 的 5 分鐘逾時。那個逾時是 Domino IQ 這一側的設計，跟你用哪種語言呼叫無關——所以如果你的程式是 **Java**（背景 agent、或一個 bean）或跑在 **XPages** 上（SSJS），你會撞到一模一樣的牆。

這篇補上另外兩種語言：Java 的 `LLMReq.completionStream` 怎麼寫，以及一個很多人卡住的問題——**SSJS 沒有原生的 LLM class，那 XPages 上到底怎麼用？**

---

## 重點摘要

- **Java 版工廠一樣在 Session**：`LLMReq llmreq = session.createLLMRequest();`，同步用 `completion(...)`、串流用 `completionStream(...)`。
- **Java 的串流靠一個 callback 介面**：`completionStream(server, command, prompt, callback)` 的第四個參數是 [`LLMReq.CompletionStreamCallback`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CompletionstreamLLM_method_Java.html)，它的 `callback(boolean lastResponse, String content)` 每產一塊被呼叫一次。
- **回傳值就是「取消鍵」**：callback 回傳 `CompletionStreamAction` 列舉——`Continue` 續跑、`Stop` 中止（等同 LS 的 `CancelStream`）。
- **SSJS 沒有原生 LLM class，但不必發明**：XPages 的 `session` 就是 `lotus.domino.Session`，所以同步呼叫可以直接 `session.createLLMRequest().completion(...)`；要串流突破逾時，就把它包成一個 Java class、從 SSJS 引用。

---

## Java 版：LLMReq.completionStream + CompletionStreamCallback

Java 這邊的物件模型跟 LotusScript 對得起來：[`LLMReq`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESLLMREQUEST_CLASS_JAVA.html) 由 `Session` 用 `createLLMRequest()` 產生，同步請求用 `completion(server, command, userPrompt)`（會受 5 分鐘逾時限制），串流用 `completionStream(...)`。

差別在串流怎麼收。LotusScript 是 `On Event` 把事件接到一個 Sub；**Java 則是傳一個 callback 物件進去**——`completionStream` 的第四個參數是 `LLMReq.CompletionStreamCallback` 介面，它只有一個方法：

```java
import lotus.domino.*;

public class DominoIQSummarizer {

    // 傳入現成的 Session（agent、bean、或從 SSJS 呼叫時都拿得到）
    public String summarize(Session session, String prompt) throws NotesException {
        LLMReq llmreq = session.createLLMRequest();
        final StringBuilder out = new StringBuilder();

        // 串流:每產出一塊就進 callback，資料持續流、就不會乾等超過 5 分鐘
        llmreq.completionStream("DominoIQ server/Org", "stdSummary", prompt,
            new LLMReq.CompletionStreamCallback() {
                public LLMReq.CompletionStreamAction callback(boolean lastResponse, String content) {
                    out.append(content);                     // content 是這一塊新產出的文字
                    // lastResponse 在最後一塊為 true;要中途取消就 return ...Stop
                    return LLMReq.CompletionStreamAction.Continue;
                }
            });

        return out.toString();
    }
}
```

兩個重點：

- **callback 的兩個參數**跟 LS 的事件對得起來——`boolean lastResponse`（最後一塊為 `true`，用來收尾）、`String content`（這一塊新產出的文字）。
- **回傳值就是控制流**：回 `CompletionStreamAction.Continue` 讓串流繼續，回 `CompletionStreamAction.Stop` 就中止——這一個回傳值就把 LS 需要另一個 `CancelStream` method 才能做的事收進來了。

機制跟昨天 LS 篇一樣：`completion` 是一次等整段、會撞 5 分鐘；`completionStream` 邊產邊收、資料持續流，處理就能延續過那個上限。

## XPages SSJS 怎麼調用：沒有原生 class，就引用 Java

SSJS 這邊常見的第一個誤會是「找不到 `createLLMRequest` 之類的 SSJS LLM API」。對——**SSJS 沒有為 Domino IQ 準備原生的 class**。但你不需要它：官方講明，[XPages 的 Server JavaScript 存取的 Domino 物件，跟 LotusScript、Java 用的是同一組](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_overview_xpages.html)——換句話說，SSJS 裡的 `session` 就是一個 `lotus.domino.Session`。所以：

**同步呼叫**可以直接在 SSJS 寫（`session` 就是那個 Java 物件）：

```javascript
// SSJS(XPages):session 就是 lotus.domino.Session,直接呼叫 Java API
var llmreq = session.createLLMRequest();
llmreq.completion("DominoIQ server/Org", "stdSummary", promptValue);
// 同步、簡單,但一樣受 5 分鐘逾時限制
```

**但串流不一樣**：`completionStream` 要你傳一個 `CompletionStreamCallback` 介面的實作，這種「在 SSJS 裡實作一個 Java 介面」的寫法在 XPages SSJS 並不乾淨、也不好維護。這時候正確的做法是**把串流那段放進 Java、再從 SSJS 引用**——也就是上面那個 `DominoIQSummarizer` class。把它放進一個 Java script library，SSJS 就能引用：

```javascript
// SSJS:引用你放在 Java script library 裡的 class
importPackage(com.example.iq);          // 你的 Java 套件名

var helper = new DominoIQSummarizer();
var summary = helper.summarize(session, promptValue);   // 把 SSJS 的 session 傳進去
// summary 是串流組完的完整字串,已突破 5 分鐘逾時
```

（把 Java 邏輯放進 [script library](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_SCRIPT_LIBRARIES.html) 再從 SSJS 引用，是 XPages 最直接的「用 Java 補 SSJS 做不到的事」的方式；用 managed bean 讓 EL／SSJS 呼叫也是常見選擇。）關鍵是那個 `session`——因為 SSJS 的 `session` 就是 `lotus.domino.Session`，直接傳給 Java 方法就能用，不必在 Java 裡另外開一個 session。

## 三種語言，同一件事

| | 建立請求 | 串流 | 「取消」怎麼做 |
| --- | --- | --- | --- |
| **LotusScript** | `session.CreateLLMRequest()` | `On Event LLMCompletionStreamNotify` → callback Sub | 呼叫 `CancelStream` |
| **Java** | `session.createLLMRequest()` | 傳 `LLMReq.CompletionStreamCallback` 物件 | callback 回傳 `CompletionStreamAction.Stop` |
| **XPages SSJS** | （沒有原生 class）用 `session.createLLMRequest()` 走 Java API | 串流包成 Java class、SSJS 引用 | 由那個 Java class 內部處理 |

三者底層是同一個 Domino IQ 請求、同一個 5 分鐘逾時；差別只在「怎麼把邊產邊收的回應接住」的語言慣用寫法。

## 小結

Domino IQ 的 5 分鐘逾時不分語言。Java 用 `LLMReq.completionStream` 搭配 `CompletionStreamCallback`（callback 回傳 `Continue`／`Stop` 控制串流）突破它；XPages 上雖然 SSJS 沒有原生 LLM class，但 `session` 就是 `lotus.domino.Session`，同步呼叫直接寫、串流則把邏輯包成 Java class 再引用。想看這一切的起點——為什麼是 5 分鐘、逾時設定在哪、串流為什麼能突破——回昨天的 [LotusScript 版](/domino-news/posts/domino-iq-timeout-streaming)。

而那個「不變快、只是不逾時」的但書，Java 與 SSJS 一樣適用：串流讓長請求跑得完，但真的動輒超過 5 分鐘，該升級的還是 GPU。
