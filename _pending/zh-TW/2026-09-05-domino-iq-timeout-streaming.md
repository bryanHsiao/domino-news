---
title: "Domino IQ 請求 5 分鐘就逾時？沒有設定可調——改用串流突破"
description: "用 Domino IQ 做長文摘要，測試時 prompt 短、秒回；一上正式環境餵進一大串內容、GPU 又普通，就撞上「網路處理未在適當時間內完成」的逾時。你去找可以加大的 timeout 設定——沒有這個東西。Domino IQ 的請求約 5 分鐘逾時、而且設計上寫死不能調。這篇用一個真實情境走一遍：為什麼會逾時、怎麼把 Completion 換成 CompletionStream 串流突破它，以及一個很重要的但書——串流讓你「不逾時」、但不會讓它「變快」。"
pubDate: 2026-09-05T07:30:00+08:00
lang: zh-TW
slug: domino-iq-timeout-streaming
tags:
  - "Domino IQ"
  - "AI"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Domino IQ のリクエストがタイムアウトする（KB0133301）— HCL Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0133301"
  - title: "CompletionStream method (NotesLLMRequest) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_completionstreamLLM_method.html"
  - title: "NotesLLMRequest class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html"
relatedJava: ["LLMReq", "LLMRes"]
relatedSsjs: []
---

你用 Domino IQ 做了一個長文摘要的功能：使用者按一個按鈕，把一長串郵件 thread 或一份長文件丟給 LLM，回一段摘要。開發時你拿短短的 prompt 測，秒回，沒問題。

上了正式環境，某個使用者把一大串內容丟進去、那台機器的 GPU 又只是普通規格——畫面卡了一陣子，然後跳出這個：

```
要求された操作は完了しませんでした。：
ネットワークの処理が適当な時間内に完了しませんでした。リトライしてください。
```

（「要求的操作未完成:網路處理未在適當時間內完成，請重試。」）

你第一個反應大概是去找「那個可以加大的 timeout 設定」。結果——**沒有這個東西**。這篇就從這個情境走一遍：為什麼會逾時、真正的解法是什麼、以及一個很多人會忽略的但書。

---

## 重點摘要

- **Domino IQ 的請求約 5 分鐘逾時，而且設計上寫死、不能調。** 官方 KB0133301 講明：請求以「現實的時間」約 5 分鐘逾時，這個設定不能改。
- **逾時的根因常是 GPU 規格不足**：模型跑得慢、5 分鐘內產不完整段回應，同步呼叫就到點斷線。
- **解法是改用串流**：把 `Completion` 換成 `CompletionStream`，回應邊產生邊透過 `LLMCompletionStreamNotify` 事件回來，處理就能超過 5 分繼續。
- **但這不是效能萬靈丹**：串流讓你「不逾時」、**不會讓它「變快」**。真的動輒超過 5 分鐘，那是硬體在跟你講話——該考慮升級 GPU。

---

## 為什麼會逾時：5 分鐘、寫死、不能調

先講清楚這不是 bug、也不是你設定漏了什麼。[KB0133301](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0133301)（適用 Domino 14.5 以上）把話說死：Domino IQ 的請求「以現實的時間、約 5 分鐘逾時」，而且**這個逾時時間不能透過設定變更**。

會踩到，多半是因為 GPU 規格不足：模型推論慢，一段長回應在 5 分鐘內產不完。而你原本的寫法——`session.CreateLLMRequest()` 之後直接呼叫 `Completion(server, command, prompt)`——是**同步**的：程式送出請求後就一路等，等到 LLM 把**整段**回應產完才 return。中間這段等待就是「網路處理」，一超過那個約 5 分鐘的上限，就是你看到的那個錯誤。

所以去翻 notes.ini、翻 Command document 找 timeout 參數是白費工——它不存在。要繞過 5 分鐘，得換一種「不要一次等整段」的呼叫方式。

## 解法：把 Completion 換成 CompletionStream

關鍵是從「等整段」改成「邊產邊收」。[`CompletionStream`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_completionstreamLLM_method.html) 的參數跟 `Completion` 一模一樣（server、command、user prompt 三個 String），差別在它**不會卡著等完整回應**：LLM 每產出一塊，Domino IQ 就透過 `LLMCompletionStreamNotify` 事件把那一塊回給你。資料持續在流，就不會有「乾等超過 5 分鐘」這件事，處理因此能延續過那個上限。

寫法是三塊：用 `On Event` 把事件接到一個 callback、呼叫 `CompletionStream`、在 callback 裡處理每一塊：

```lotusscript
' 放在 (Declarations)：模組層級，讓 Click 與 ProcessResponse 共用同一個 uidoc
Dim uidoc As NotesUIDocument

Sub Click(Source As Button)
    Dim session As New NotesSession
    Dim workspace As New NotesUIWorkspace
    Dim llmreq As NotesLLMRequest
    Dim prompt As String

    Set uidoc = workspace.CurrentDocument
    prompt = uidoc.FieldGetText("Prompt")

    Set llmreq = session.CreateLLMRequest()
    ' 把串流通知事件接到 ProcessResponse
    On Event LLMCompletionStreamNotify From llmreq Call ProcessResponse
    ' 三個參數跟 Completion 一樣：server、command、user prompt
    Call llmreq.CompletionStream("DominoIQ server/Org", "stdSummary", prompt)
End Sub

' 每產出一塊就被呼叫一次；lastResponse 在最後一塊為 True
Sub ProcessResponse(Source As NotesLLMRequest, Byval lastResponse As Boolean, Byval content As String)
    Call uidoc.FieldAppendText("Results", content)
End Sub
```

callback 的簽名是固定的三個參數：`Source As NotesLLMRequest`、`Byval lastResponse As Boolean`、`Byval content As String`。`content` 是這一塊新產出的文字，你把它接到欄位（或 buffer）上；`lastResponse` 在**最後一塊**為 `True`，要在結束時做收尾（例如存檔、解鎖 UI）就看它。中途想中斷（使用者按取消）則呼叫 `CancelStream`（完整的方法與事件定義見 [`NotesLLMRequest` 類別文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html)）。

⚠️ 一個拆 Sub 才會踩到的雷：`uidoc` 一定要宣告在 **(Declarations)** 模組層級，不能只在 `Click` 裡 `Set`。官方範例把所有東西塞在同一個 `Sub` 裡所以沒事；一旦你像這樣拆成「按鈕 handler + callback」兩個 Sub，兩邊要共用的物件（這裡是 `uidoc`）就得提到模組層級——否則 `ProcessResponse` 裡的 `uidoc` 會是另一個沒被 `Set` 過的空變數，一 `FieldAppendText` 就 `Object variable not set`。（養成開 `Option Declare` 的習慣，這種漏宣告會在編譯期就被抓出來。）

跟同步版對照，差別只在「一次 return 整段」變成「多次 callback、每次一塊」——邏輯上多了一個事件處理，但這正是它能突破 5 分鐘的原因。

## 但這不是效能萬靈丹（誠實的但書）

這裡是最容易被忽略、卻最該講的一點。KB 的原話很老實：串流「可以讓處理繼續下去，但**並不代表處理時間縮短**」。

換句話說，`CompletionStream` 解決的是「**會不會被 5 分鐘砍掉**」，不是「**跑多快**」。一份要跑 8 分鐘的推論，串流之後還是跑 8 分鐘——只是不會在第 5 分鐘被逾時中斷而已。如果你的請求動不動就逼近或超過 5 分鐘，那不是程式寫法的問題，是**硬體在跟你講話**：KB 直接建議，這種情況該考慮升級 GPU 之類的硬體。

所以正確的判斷順序是：先確認這個延遲是不是合理（prompt 是不是過長、command 的 system prompt 是不是可以精簡、模型是不是選太大）；真的是「工作量就是這麼大」，那就用串流讓它跑完、同時把 GPU 升級排進計畫——別把串流當成「讓 Domino IQ 變快」的魔法，它不是。

## 跟同步版怎麼選

這也順帶修正一個容易有的印象。站上先前介紹 [`NotesLLMRequest`](/domino-news/posts/notes-llm-request) 時提過：串流的 callback 模型比 `Completion` 複雜，多數後台場景 `Completion` 簡單夠用。那句話仍然成立——**但這篇就是那個例外**：當單次推論可能逼近 5 分鐘，串流不再是「UI 打字機效果」的選配，而是「不被逾時砍斷」的必需品。

- **短、快、確定 5 分鐘內完成**（大部分後台 agent、短 prompt 摘要）→ `Completion`，簡單。
- **長、慢、可能逼近或超過 5 分鐘**（大文件、大 thread、普通 GPU）→ `CompletionStream`，突破逾時。

## 小結

Domino IQ 撞逾時，先別找那個不存在的 timeout 設定：請求約 5 分鐘逾時、寫死不可調（KB0133301）。解法是把 `Completion` 換成 `CompletionStream`，用 `LLMCompletionStreamNotify` 事件邊產邊收，處理就能延續過 5 分。但記住那個但書：串流讓它**跑得完**、不讓它**跑得快**；真的常常超過 5 分鐘，該升級的是 GPU，不是再找一個設定。

## 同類別在其他語言

Domino IQ 的 LLM API 在 Java 端對應 `LLMReq` / `LLMRes`（`LLMReq` 一樣有 completion 與 streaming completion）；SSJS 目前沒有對位的類別。Java 版的串流一樣是走事件/回呼模型突破同一個逾時，細節留待日後單獨的 Java 篇。
