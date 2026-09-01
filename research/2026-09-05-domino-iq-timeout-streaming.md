---
slug: domino-iq-timeout-streaming
title: "Domino IQ Requests Timing Out at 5 Minutes? No Setting to Raise — Switch to Streaming"
lang: [zh-TW, en]
pubDate: 2026-09-05
status: staged
tags: [Domino IQ, AI, LotusScript, Tutorial]
requester: 使用者 (bryan，提供 HCL KB0133301 連結，要求「別單純介紹 KB、寫情境把解法用上」)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) ISSUES → 1 個程式必修（uidoc 跨 Sub 作用域 bug）已修 → 其餘全 PASS"
created: 2026-08-27
updated: 2026-08-27
---

# 研究軌跡 — domino-iq-timeout-streaming

情境式 troubleshooting 文，源自使用者提供的 HCL KB0133301（Domino IQ 請求逾時）。使用者明確要
「別單純介紹 KB、用情境把相關解法串起來」→ 以「長文摘要上線後撞 5 分鐘逾時」為情境開場。

## 研究來源 (Research trail)

### 主來源：HCL Support KB0133301（JS 動態載入、用內建瀏覽器讀取全文）
- WebFetch 只拿到標題（ServiceNow portal 是 JS stub）→ 改用 Claude Browser navigate + get_page_text 讀到全文。
- 逐字關鍵：「Domino IQ では、リクエストは現実的な時間として約 5 分でタイムアウトする設計になっており、
  設定を変更することはできません。」（約 5 分逾時、設計如此、不可調）
- 逾時訊息：「ネットワークの処理が適当な時間内に完了しませんでした。リトライしてください。」
- 解法：處理若 5 分內不完，用串流（CompletionStream）可超過逾時繼續。
- 但書逐字：「処理は継続することはできますが、処理時間が短縮できるわけではありません」→ 建議升級 GPU。
- 適用：Domino 14.5+。
- KB 附的 LotusScript 範例與官方 Designer 範例一致（見下）。

### WebFetch/WebSearch — HCL Domino Designer 14.5 文件（方法/事件簽名）
- `H_NotesLLMRequest_Class.html`：CompletionStream / Completion / CancelStream / IsCommandAvailable 方法描述。
- `H_completionstreamLLM_method.html`：CompletionStream 三參數（server$ / command$ / userPrompt$，同 Completion）。
- `H_completionstreamLLM_example.html`：官方範例 `On Event LLMCompletionStreamNotify From llmreq Call
  ProcessResponse` + `CompletionStream("DominoIQ server/Org", "stdMailSummaryThread", sMailThread)`；
  callback 簽名 `(Source As NotesLLMRequest, Byval lastResponse As Boolean, Byval content As String)`，
  lastResponse 標記最後一塊。→ 與 KB 範例、本文程式一致。
- Java：`H_CompletionstreamLLM_method_Java.html` 存在 → LLMReq 有 streaming completion（cross-lang 段據此）。

### 矛盾檢查
- KB（逾時 5 分、串流可續但不變快）與 Designer 文件（串流為 incremental）一致、互補。
- 5 分逾時只在 KB、Designer 文件未提 → KB 為該事實唯一權威來源，未替它加杜撰數字（只寫「約 5 分」）。

### 避免重複既有文
站上 [[notes-llm-request]]（5/23）已介紹 NotesLLMRequest，且提過 CompletionStream，但角度是「UI 打字機/
長回應 UX、多數 backend 不需要」。本文**不重寫機制**、只交叉連結，並提出全新角度：**串流是突破 5 分鐘
硬逾時的必要手段**（正好是 5/23 那句「多數 backend 不需要 streaming」的例外）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
指示查證：CompletionStream 三參數、LLMCompletionStreamNotify 事件簽名、Completion 同步阻塞、CancelStream、
LotusScript 範例語法、「串流突破逾時」機制是否過度、Java LLMReq 有 streaming、SSJS 無、串流不變快是否守住
KB 但書、有無杜撰數字。KB 逾時事實請以合理性/一致性判斷（KB 為 JS 渲染、reviewer 未必讀得到，prompt 已附逐字）。

**VERDICT：ISSUES（1 個程式必修）→ 修後 PASS。**
- **必修（程式跑不動）**：範例把官方單一 `Sub` 拆成「按鈕 handler + callback」後，`uidoc` 在 `Click` 裡
  `Set`、卻在 `ProcessResponse` 用——LotusScript 未宣告變數是**程序內區域**，callback 的 `uidoc` 是另一個
  `Nothing`，`FieldAppendText` 會 `Object variable not set`（開 `Option Declare` 更會編譯期就擋）。
  → **已修**：把 `Dim uidoc As NotesUIDocument` 提到 **(Declarations)** 模組層級，並加一段把這個「拆 Sub 才會
  踩到的雷」寫成教學點（含 `Option Declare` 建議）。
- **其餘全 PASS**：CompletionStream 三參數、callback 簽名 `(Source, lastResponse, content)` 與 `On Event`
  逐字對官方範例、`Completion` 同步阻塞、`CancelStream`、`CreateLLMRequest`、機制解釋不過度、Java
  `LLMReq.completionStream` 存在、SSJS 無、串流「不變快」守住 KB 但書、無杜撰數字（一律「約 5 分」）。
- KB 使用內部一致（設計逾時~5 分/不可調、根因慢推論、解法串流、但書不加速/升 GPU 四點忠實重現）。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] 搜尋導向 how-to：`Domino IQ 長請求逾時怎麼解：把 Completion 換成 CompletionStream 突破 5 分鐘`
  — 工具名齊、最好搜，但比較平。
- [汰除] 反直覺 hook：`Domino IQ 逾時不是你設定漏了：5 分鐘寫死，串流才是唯一解` — 有記憶點但稍長。
- [選定] 問題先行+解法：`Domino IQ 請求 5 分鐘就逾時？沒有設定可調——改用串流突破`
  — 使用者拍板。讀者症狀 + 反直覺的「沒設定可調」+ 解法都在，好搜也好記。
  en 鏡像：`Domino IQ Requests Timing Out at 5 Minutes? No Setting to Raise — Switch to Streaming`。

## 查證 checklist
- [x] 研究鏈：KB0133301 全文（瀏覽器讀）+ WebFetch Designer 文件（方法/事件/Java）
- [x] KB 用 Claude Browser 讀到全文（WebFetch 只得 JS stub）
- [x] 三外部 URL 驗證非 404
- [x] 矛盾檢查（KB 與 Designer 一致；5 分逾時只在 KB、未加杜撰數字）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 KB 60% 已配平）
- [x] 雙語 build 通過（暫複製進 posts 驗 frontmatter）
- [x] humanizer-zh-tw 自審（情境開場、field-report 語氣、KB 但書誠實、無罐頭結論）
- [x] 未重寫既有 [[notes-llm-request]]、只交叉連結（提出「突破逾時」新角度）
- [x] 獨立 fact-check（subagent）→ ISSUES（uidoc 跨 Sub 作用域 bug）→ 修後 PASS

## 異動日誌
- 2026-08-27 Claude Browser 讀 KB0133301 全文、WebFetch Designer 方法/事件/Java、雙語草稿（情境式）、
  配平 diversity（KB 60%→33%）、標題 loop、sidecar（Opus 4.8）
- 2026-08-27 獨立 fact-check subagent → 必修：uidoc 跨 Sub 作用域 bug → 提到模組層級 + 寫成教學點
  → 修後 PASS（Opus 4.8）
