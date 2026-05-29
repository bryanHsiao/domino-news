---
title: "NotesLLMRequest：4 行 LotusScript 把 LLM 接進 Domino app"
description: "Domino 14.5 引入 NotesLLMRequest / NotesLLMResponse 兩個 LotusScript class，把 LLM 推論能力以同步 API 形式給 app 開發者。本篇實戰：session.CreateLlmRequest() 工廠方法、Completion 三參數簽名、CompletionStream 串流模式、IsCommandAvailable / GetAvailableCommands 防禦性檢查、NotesLLMResponse 的 Content / FinishReason / Role 三個欄位。為什麼 API 設計用 commandName 而不是直接吃 prompt — Command document 抽離讓 admin 跟 dev 各自控制自己那層。附自動回信 + 摘要兩個實戰範例、跟 Java 對位 LLMReq / LLMRes。"
pubDate: 2026-05-23T07:30:00+08:00
lang: zh-TW
slug: notes-llm-request
tags:
  - "Domino IQ"
  - "AI"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesLLMRequest class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html"
  - title: "NotesLLMResponse class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMResponse_class.html"
  - title: "New LotusScript and Java classes for Domino IQ — 14.5 What's new"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_new_lotuscript_and_java_classes.html"
  - title: "Domino IQ — HCL Domino 14.5.1 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/domino_iq_server.html"
  - title: "Quick LLM Access via 4 Lines of Code — XPagesDeveloper.com"
    url: "https://www.xpagedeveloper.com/2025/quick-llm-access-via-4-lines-of-code"
relatedJava: ["LLMReq", "LLMRes"]
relatedSsjs: []
cover: "/covers/notes-llm-request.webp"
coverStyle: "minimalist-mono"
---

## 重點摘要

- **Domino 14.5 引入 [`NotesLLMRequest` / `NotesLLMResponse`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NotesLLMRequest_Class.html)** — LotusScript 直接把 prompt 送進 server-side LLM、拿回應、走 process 內 IPC、沒 HTTP latency
- **4 行起手式**：`session.CreateLlmRequest()` → `Completion(serverName, commandName, userPrompt)` → 讀 `.Content`
- API 設計把 **prompt 跟 command 分離** — `commandName` 引用 admin 在 `dominoiq.nsf` 預先建好的 Command document（含 system prompt + 模型參數）、app 開發者只送 user prompt
- 隨機應變的 helper：`IsCommandAvailable(name)` 跟 `GetAvailableCommands()` — production 前防禦性檢查
- 串流模式：`CompletionStream` + `CancelStream` — 給長回應 UI 即時 update 用
- 前置條件：server 已開啟 Domino IQ + 至少一個 Command document（架構 / 安裝細節見前篇 [Domino IQ 入門](/posts/domino-iq/)）

---

## 4 行起手式

server 已配好 Domino IQ + Command document 之後、整個呼叫流程：

```lotusscript
Dim session As New NotesSession
Dim llmreq As NotesLLMRequest
Dim llmresp As NotesLLMResponse

Set llmreq = session.Createllmrequest()
Set llmresp = llmreq.Completion(db.server, "StdReplyEmail", "客戶說：『請問退貨流程？』")
MsgBox llmresp.Content
```

注意點：

- **不是 `New NotesLLMRequest()`** — 用 `session.Createllmrequest()` 工廠方法（跟 `CreateRichTextItem` / `CreateDateTime` 等 NotesSession factory pattern 一致）
- `db.server` 預設為當前 db 所在 server name；想呼叫遠端 Domino IQ server 把它換成具體 server name 字串
- `"StdReplyEmail"` 是 Domino IQ 內建的 Command 之一、不用自己建
- 同步呼叫、`Completion` return 後 `llmresp.Content` 直接可讀

---

## NotesLLMRequest 全 API

工廠方法：

```lotusscript
Set llmreq = session.Createllmrequest()
```

`NotesLLMRequest` 提供 **5 個 method**：

### `Completion(serverName, commandName, userPrompt) → NotesLLMResponse`

同步發 chat completion 請求到 Domino IQ。三個參數都是 String：

| 參數 | 意義 |
|---|---|
| `serverName` | 要打哪台 Domino IQ server。當前 db 所在 server 用 `db.server`；可指定其他 server 名 |
| `commandName` | 預先在 `dominoiq.nsf` 建好的 [Command document](https://help.hcl-software.com/domino/14.5.1/admin/conf_add_llm_command_document.html) 名稱、包含 system prompt + token 上限 + temperature 等模型參數 |
| `userPrompt` | 使用者輸入的 prompt 文字。會跟 Command 裡的 system prompt 合併後送進 LLM |

### `CompletionStream(...)` — 串流模式

跟 `Completion` 同概念、但回應**邊產生邊回**、適合 UI 顯示「打字機效果」或長回應不想讓使用者乾等。

### `CancelStream()`

`CompletionStream` 進行中、call 這個 method 中斷它（使用者按取消、或 UI close 了）。

### `IsCommandAvailable(commandName) → Boolean`

檢查指定 Command document 是否存在於目前 server 的 `dominoiq.nsf`。**Production 必備** — 避免 admin 改名 / 刪掉 command 後 app 在 production 才炸。

```lotusscript
If Not llmreq.IsCommandAvailable("MyCustomSummary") Then
    Print "Command 不存在、無法繼續"
    Exit Sub
End If
```

### `GetAvailableCommands() → Variant array`

回所有在當前 server 可用的 Command 名稱 array。用途：UI 提供 dropdown 讓 user 選 command；或 startup 時 sanity check。

```lotusscript
Dim cmds As Variant
cmds = llmreq.GetAvailableCommands()
ForAll c In cmds
    Print c
End ForAll
```

---

## NotesLLMResponse 三個欄位

回應物件結構**很扁**、只有三個 property：

### `.Content As String`

LLM 生成的回應文字本體。**90% 的 use case 你只需要這個**。

### `.FinishReason As String`

LLM 為什麼停止生成。常見值（跟 OpenAI 對齊的 vocabulary）：

| 值 | 意義 |
|---|---|
| `stop` | 正常結束（LLM 認為話講完了）|
| `length` | 撞到 Command document 設的 `Maximum tokens` 上限被截斷 |
| `content_filter` | 觸發 guard model 過濾（如果有設）|

**重要**：`FinishReason = "length"` 表示**回應沒寫完**、不能當完整答案處理。Production code 該檢查：

```lotusscript
Select Case llmresp.FinishReason
Case "stop"
    ' OK 正常處理
Case "length"
    Print "警告：回應被截斷、考慮升 Maximum tokens 或拆 prompt"
Case "content_filter"
    Print "Guard model 攔截了這次回應"
End Select
```

### `.Role As String`

訊息角色、`Completion` method 回來的物件**幾乎一定**是 `"assistant"`。不同模型可能有變化、但 90% case 不會用到這欄位。

---

## 為什麼 API 設計 `commandName` 而不是直接吃 prompt

第一次看到 `Completion(server, commandName, userPrompt)` 簽名會奇怪：為什麼 system prompt 不能在 LotusScript 裡寫？要在 server 端先建 Command document？

這個設計刻意把 **dev 跟 admin 的關注點分離**：

| 層 | 誰負責 | 控制什麼 |
|---|---|---|
| **Command document**（admin / `dominoiq.nsf`） | Admin / Domino IQ owner | system prompt、模型選擇、temperature、max tokens、是否走 guard model |
| **App code**（LotusScript） | App 開發者 | user prompt 內容、何時呼叫、結果怎麼處理 |

帶來幾個好處：

1. **修 prompt 不用改 code**：admin 在 Notes client 改 system prompt、5 分鐘 cache 過後生效、app 不用重新部署
2. **多 app 共用同一 command**：「客服回信」這個 Command 給 mail、CRM、ticket system 三個 app 共用
3. **集中治理**：要把所有 LLM call 換成新模型 / 加 guard model、只動 Command document、不動 app code
4. **版本控管**：dev 改 user prompt 邏輯走 app code 部署流程；改 LLM behavior 走 Domino DB document 變更流程、兩者各自 audit trail

---

## 實戰範例 1：自動回信 agent

scheduled agent 把收件夾的 mail 用 LLM 草擬回信、存草稿：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim mailDb As NotesDatabase
    Dim docs As NotesDocumentCollection
    Dim doc As NotesDocument
    Dim llmreq As NotesLLMRequest
    Dim llmresp As NotesLLMResponse

    Set mailDb = session.CurrentDatabase
    Set llmreq = session.Createllmrequest()

    ' Production 防禦：command 不存在就不繼續
    If Not llmreq.IsCommandAvailable("StdReplyEmail") Then
        Print "StdReplyEmail command 不存在於本 server"
        Exit Sub
    End If

    ' 抓未處理的收件信件
    Set docs = mailDb.UnprocessedDocuments
    Set doc = docs.GetFirstDocument()

    Do Until doc Is Nothing
        Set llmresp = llmreq.Completion(mailDb.Server, "StdReplyEmail", doc.Body(0))

        If llmresp.FinishReason = "stop" Then
            doc.DraftReply = llmresp.Content
            Call doc.Save(True, False)
            Call session.UpdateProcessedDoc(doc)
        End If

        Set doc = docs.GetNextDocument(doc)
    Loop
End Sub
```

---

## 實戰範例 2：條件式摘要

把長度超過 1000 字的 document 摘要成短文、其他原文回：

```lotusscript
Function SummarizeIfLong(doc As NotesDocument) As String
    Dim session As New NotesSession
    Dim llmreq As NotesLLMRequest
    Dim llmresp As NotesLLMResponse
    Dim bodyText As String

    bodyText = doc.GetItemValue("Body")(0)
    If Len(bodyText) < 1000 Then
        SummarizeIfLong = bodyText  ' 不夠長、原文回
        Exit Function
    End If

    Set llmreq = session.Createllmrequest()
    Set llmresp = llmreq.Completion( _
        doc.ParentDatabase.Server, _
        "StdSummarize", _
        bodyText _
    )

    Select Case llmresp.FinishReason
    Case "stop"
        SummarizeIfLong = llmresp.Content
    Case "length"
        ' 摘要本身被截斷、退回原文比較安全
        SummarizeIfLong = bodyText
    Case Else
        SummarizeIfLong = bodyText
    End Select
End Function
```

`"StdSummarize"` 是內建 Command 之一。或你可以在 `dominoiq.nsf` 建自己的、譬如 `"MyCustomTechSummary"` 設特定 system prompt 讓 LLM 用技術文章口吻摘要。

---

## CompletionStream：何時值得切過去

`Completion` 同步等到完整回應 — 簡單、但長 prompt 可能等好幾秒、UI 卡住。

`CompletionStream` 邊產生邊回 chunk、適合：

- Web UI 顯示「打字機」效果
- 長文章生成（讓 user 早點看到開頭、可以早點按取消）
- 後台 streaming pipeline 到別的服務

但代價是 LotusScript 的 callback 模型沒 JS 那麼方便、要自己組 buffer + UI partial update — 複雜度比 `Completion` 高很多。多數 backend agent 場景不需要 streaming、`Completion` 簡單夠用。

---

## 跟其他 IQ 文章的關係

| 主題 | 哪篇 |
|---|---|
| Domino IQ 是什麼、為什麼跑本地 LLM、怎麼裝 | [Domino IQ 入門](/posts/domino-iq/) |
| 進階：把 NSF 當 vector source 做 RAG | [Domino IQ RAG](/posts/domino-iq-rag/) |
| **本篇：從 LotusScript 怎麼呼叫** | 你在看的這篇 |

社群實戰補充：[XPagesDeveloper 的「4 行 LLM 範例」](https://www.xpagedeveloper.com/2025/quick-llm-access-via-4-lines-of-code) 是這個 API 簡潔感的最佳示範。

---

## 同類別在其他語言

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesLLMRequest` / `NotesLLMResponse` |
| Java | `LLMReq` / `LLMRes`（API surface 邏輯一致、命名走 Java 縮寫風格）|
| SSJS / XPages | 無原生對應 — 走 LS agent / Java agent / REST API 觸發 |

SSJS 沒有 Domino IQ 對應 class — 傳統做法是寫個 LS agent 跑 IQ 邏輯、SSJS 用 `lotusScript:` 觸發；或用 Domino REST API endpoint 包一層。
