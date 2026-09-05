---
slug: domino-iq-timeout-java-ssjs
title: "The Java Fix for Domino IQ Timeouts: LLMReq.completionStream, and How XPages SSJS Calls It"
lang: [zh-TW, en]
pubDate: 2026-09-06
status: staged
tags: [Domino IQ, Java, SSJS, Tutorial]
requester: 使用者 (bryan，要今天 LS 逾時篇的 Java companion + XPages SSJS 調 Java 示範，排一天發、雙向引用)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；零必修。巢狀型別名正確可編譯（doc import lotus.domino.LLMReq.* 佐證）、Java 匿名類別可編譯、importPackage 形式合法、SSJS=同一 Session 敘述準確"
created: 2026-09-05
updated: 2026-09-05
---

# 研究軌跡 — domino-iq-timeout-java-ssjs

[[domino-iq-timeout-streaming]]（9/05，LS 版）的 Java + SSJS 續篇。使用者要：Java 版怎麼寫、
XPages 上 SSJS 沒原生 class 時怎麼引用 Java、排一天發（9/06）、跟 LS 篇**雙向引用**。

## 研究來源 (Research trail)

### NotebookLM
本 session 對 NotebookLM 擷取穩定失敗（見 certstore 系列側車），Java LLM 類別在 Designer 文件精確，
直接 WebFetch/WebSearch help.hcl-software.com。

### WebFetch/WebSearch — HCL Domino Designer 14.5 文件（curl HEAD 200 驗證非 404）
- `H_NOTESLLMREQUEST_CLASS_JAVA.html`（LLMReq Java）：`LLMReq llmreq = session.createLLMRequest();`
  工廠；方法 completion / completionStream / IsCommandAvailable / GetAvailableCommands（Vector<String>）；
  LLMRes = completion 的回應類別。
- `H_CompletionstreamLLM_method_Java.html`（Java completionStream）逐字：
  - `public void completionStream(String server, String command, String userPrompt,
    CompletionStreamCallback callback) throws NotesException`
  - `public void completion(String server, String command, String userPrompt)`（同步）
  - callback 介面方法：`CompletionStreamAction callback(boolean LastResponse, String Content);`
    回傳 `CompletionStreamAction` 列舉（`Continue`／`Stop`）；回 `Stop` 取消串流。
- `H_10_NOTES_CLASSES_ATOZ_JAVA.html`：A-Z 只列 top-level `LLMReq`/`LLMRes`，**沒列**
  `CompletionStreamCallback`/`CompletionStreamAction` → 判定為 LLMReq 巢狀型別，程式寫
  `LLMReq.CompletionStreamCallback` / `LLMReq.CompletionStreamAction.Continue`（**交 reviewer 特別驗證確切限定名**）。
- `wpd_overview_xpages.html`（Understanding XPages）：SSJS 存取的 Domino 物件與 LS/Java 相同 →
  SSJS 的 `session` 即 `lotus.domino.Session`，`session.createLLMRequest()` 在 SSJS 直接可用。
- `H_USING_SCRIPT_LIBRARIES.html`：Java script library → SSJS `importPackage` 引用的機制來源。

### SSJS 敘事（避免發明）
- SSJS 無原生 Domino IQ class（relatedSsjs: []）。同步 `completion()` 因 session=同一 Java 物件可直接呼叫；
  串流需 `CompletionStreamCallback` 介面，SSJS 難乾淨實作 → 把串流包成 Java class、SSJS 引用（script
  library / managed bean）。這是誠實的推薦做法、非發明。

### 矛盾檢查
- Java 與 LS 機制一致（completion 同步撞逾時、completionStream 邊產邊收突破）；三語言差別只在「怎麼接串流」。
- 未重寫 [[notes-llm-request]] / [[domino-iq-timeout-streaming]]，交叉連結。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
重點指示：**巢狀型別 `LLMReq.CompletionStreamCallback`/`CompletionStreamAction` 的確切限定名（決定程式能否編譯）**、
completionStream 簽名、createLLMRequest 工廠、callback 回傳 Continue/Stop 取消、Java 匿名類別能否編譯、
SSJS session=lotus.domino.Session 的官方支持、importPackage 形式（`com.x` vs `Packages.com.x`）、SSJS 無原生 class。

**VERDICT：PASS（零必修）。**
- **巢狀型別名（最關鍵）正確**：completionStream Java doc 本身有 `import lotus.domino.LLMReq.*;` 且把
  callback 定義成 LLMReq 的巢狀 `interface CompletionStreamCallback { CompletionStreamAction callback(boolean, String); }`
  → 程式用 `LLMReq.CompletionStreamCallback` / `LLMReq.CompletionStreamAction.Continue`／`.Stop` 是正確可編譯形式。
- completionStream 簽名（4 參數 + throws NotesException）、`session.createLLMRequest()` camelCase 工廠、
  callback 回傳 Continue/Stop 取消（等同 LS CancelStream）、Java 匿名類別可編譯（`final StringBuilder` 擷取合法、
  `@Override` 非必需）全部確認。
- SSJS：Understanding XPages 逐字「These are the same Domino objects accessible also through LotusScript and
  Java.」→ 文章以「換句話說 session 就是 lotus.domino.Session」呈現為推論、未誤引；`importPackage(com.example.iq)`
  合法（`com` 是 Rhino 引擎預定義全域）；「SSJS 難乾淨實作 Java 介面 → 包成 Java script library」是公允標準說法。
- 「SSJS 無原生 LLM class」正確、relatedSsjs [] 適當；無杜撰、佔位符明顯。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] SSJS 誤會 hook：`SSJS 沒有 Domino IQ 的 class 怎麼辦？——Java 的 LLMReq.completionStream + 從 SSJS 引用`
  — 抓 SSJS 開發者痛點、有記憶點，但把 Java 主體壓成配角。
- [汰除] companion 對稱：`同一個 5 分鐘逾時，Java 與 XPages SSJS 怎麼解` — 姊妹篇感強，但工具名（LLMReq/completionStream）少了。
- [選定] 搜尋導向：`Domino IQ 逾時的 Java 解法：LLMReq.completionStream，以及 XPages SSJS 怎麼調用它`
  — 使用者拍板。工具名齊、跟 9/05 LS 篇對稱、好搜。
  en 鏡像：`The Java Fix for Domino IQ Timeouts: LLMReq.completionStream, and How XPages SSJS Calls It`。

## 查證 checklist
- [x] 研究鏈：WebFetch/WebSearch 官方 Designer 文件（Java LLMReq + XPages）
- [x] 四外部 URL 驗證非 404（curl HEAD 200）
- [x] 矛盾檢查（Java/LS 機制一致；未重寫既有文）
- [x] inline-link diversity 通過（4 個相異 URL 各 2 次 = 25%）
- [x] 雙語 build 通過（暫複製進 posts 驗 frontmatter）
- [x] humanizer-zh-tw 自審（承接語氣、無罐頭結論、but 書誠實沿用 LS 篇）
- [x] 雙向引用：LS 篇（9/05）cross-language 段已改為連本篇「續篇」；本篇連回 LS 篇
- [x] 獨立 fact-check（subagent）→ PASS（零必修）；巢狀型別名正確可編譯已確認

## 異動日誌
- 2026-09-05 WebFetch/WebSearch Java LLMReq/completionStream/callback + XPages SSJS、雙語草稿、
  diversity、標題 loop、改 LS 篇雙向引用、sidecar（Opus 4.8）
- 2026-09-05 獨立 fact-check subagent → PASS（零必修）；巢狀型別名正確可編譯、Java 匿名類別可編譯（Opus 4.8）
