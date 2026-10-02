---
slug: xpages-ssjs-runonserver-stale-document
title: "XPages SSJS runOnServer 後 stale document + contextDocument 替代暫存文件"
lang: [zh-TW, en]
pubDate: 2026-10-10
status: staged（_pending，排 2026-10-10，Path A）
tags: [XPages, JavaScript]（TYPE 留白：gotcha 解說 + pattern，非純 hands-on tutorial）
requester: 使用者（給 xred《為什麼呼叫 RunOnServer 代理程式後無法取得文件的新值?》+ 自己的 SSJS 截圖；指「xred 示範偏 notesclient、ssjs 也一樣、另可用 contextDocument 取代暫存文件」）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-10
updated: 2026-10-10
---

# 研究軌跡 — xpages-ssjs-runonserver-stale-document

SSJS/XPages gotcha 型。xred 原文是 LotusScript/Notes client 版「runOnServer 後讀到舊值」；本篇寫 SSJS/XPages 版同一陷阱 + 用 document data source（contextDocument）取代暫存文件。獨立寫、不引 xred；以官方 method 文件 + 使用者第一手 SSJS 截圖為據。

## 獨立性（不引用 xred）

- xred 主題 = runOnServer 後 in-memory 文件 stale、要 Set Nothing + GetDocumentByID 重抓（LotusScript/Notes client）。本篇不引用它。
- 本篇據：**使用者真實 SSJS 程式碼**（截圖：tmpdoc.save→getNoteID→recycle→runOnServer→getDocumentByID 重讀 Selected_Reviewer/NextSigner）為第一手範例；**官方 method 文件**鎖 API。
- 新貢獻（xred 沒有）：SSJS 版機制敘述 + **contextDocument 替代暫存文件**（`document1.getDocument(true)`）這條。

## 站上涵蓋確認

grep runOnServer/contextDocument/recycle/getDocument：相關的有 notes-agent(6/12 class 介紹)、agent-run-as-identity(8/3)、java-recycle-memory(8/7)、xpages-save-conflicts(9/16)、ssjs-vector-multivalue(8/12)、xpages-scope-variables(9/27)——但「SSJS runOnServer stale value + contextDocument 替代」這個具體角度**沒寫過**。內部深連 java-recycle-memory(8/7)。

## NotebookLM 不可用（已 fallback，透明記錄）

依 CLAUDE.md 研究流程 SSJS 文先跑 NotebookLM（SSJS notebook 0c88f101-…）。但 **ask_question.py 失敗**：browser state 62 天舊、頁面 overlay（cdk-overlay-container）攔截點擊、ElementHandle.click 逾時——需互動式 re-auth，不自行處理（呼應 [[reference_notebooklm_repair]] 授權邊界）。
→ Fallback：以官方 HCL method 文件為準（method 級本就是 notebook 的弱項、WebFetch 更權威），+ 使用者第一手程式碼。此為 CLAUDE.md 允許的 WebFetch fallback。已向使用者說明。

## 官方 API 事實（WebFetch 逐字）

- `runOnServer()`/`runOnServer(noteID)`（[官方](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Agent_runOnServer.html)）：runs agent on server containing DB；回 int、0=success；noteID→called agent 的 `ParameterDocID`；任何語言 agent 皆可；local DB 等同 run()；output→Domino log。（文件未明示同步/非同步→文中不宣稱「synchronous」，只說「回來後再讀」。）
- `getDocument()`/`getDocument(applyChanges)`（[官方](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html) + [DominoDocument JavaDoc](https://public.dhe.ibm.com/software/dw/lotus/Domino-Designer/JavaDocs/DesignerAPIs/com/ibm/xsp/model/domino/wrapped/DominoDocument.html)）：回內層 `NotesDocument`；`applyChanges` true=「applies any changes made to the data store」、false(預設)=不套用。data source 預設變數 document1/2…
- stale 機制：呼叫端 backend 文件物件＝載入當下快照、不隨磁碟自動同步 → recycle + getDocumentByID 重抓。（框成「物件性質/行為」，不深入內部實作。）

## 標題候選

- [汰除] 好處先行：`不想為了呼叫 agent 建暫存文件:用 contextDocument 傳參數讀結果` — 點出替代法但沒帶出「拿到舊值」這個主症狀（最會被搜）。
- [汰除] 概念窄：`in-memory 文件是快照` — 太抽象、不好搜。
- [選定] 問題先行＋替代：`XPages 呼叫 runOnServer 後文件還是舊值?in-memory 文件是快照——解法與用 contextDocument 省掉暫存文件`
  — 症狀（runOnServer 後舊值、好搜）＋真因（快照）＋替代法（contextDocument）全包；標題自決（使用者已授權）。
  en 鏡像：`After runOnServer in XPages the Document Is Still Stale — the Fix, and Using the contextDocument Instead of a Temp Doc`

## 查證 checklist

- [x] runOnServer 回 0=success、noteID→ParameterDocID、getParameterDocID：官方
- [x] getDocument(applyChanges) 回內層 NotesDocument、true=套用改動：官方
- [x] save 於 runOnServer 前必要（agent 讀磁碟、新文件存後才有穩定 note id）
- [x] stale 機制框成「載入當下快照、不自動同步」，不過度宣稱內部實作
- [x] contextDocument 替代（getDocument(true)→save→runOnServer）+ 讀結果仍要重抓的 caveat
- [x] inline-link diversity：3 相異官方 URL 各 33%（移除 TL;DR 多餘的 runOnServer link 後）；每語 3 外部
- [x] TYPE 留白；tags XPages + JavaScript
- [x] 雙語 temp-build 通過
- [x] humanizer 自審 ~45/50（field-report；code block 為正當結構）
- [x] fact-check（獨立 subagent）→ **FAIR、零錯誤、無必改項**。三官方源逐字確認：runOnServer 0=success/noteID→ParameterDocID；getDocument(applyChanges) 回內層 NotesDocument、true 套用改動；**DominoDocument JavaDoc 確證 getDocument(true) 只「apply changes to the wrapped document」、不存檔 → 我寫的 explicit save() 必要、非冗餘**；stale 機制、contextDocument caveat(e)、save-before(b) 全對。兩 optional hedge：synchronicity 雖未文件化但文中未宣稱「文件說」、只用 0-gate（合法）；「快照」措辭已框成物件性質。採一項：補「runOnServer 同步/blocks 到 agent 完成」一句（行為框架），讓「回來即讀」邏輯完整。

## 補強：run-as-web-user + runWithDocumentContext（使用者問題觸發）

使用者指出「印象中用 contextDocument 要搭配 agent 勾『以 Web 使用者身分執行』才取得到值」，問要不要驗證。查官方：
- **核心主張被官方 wiki 逐字確認**：HCL App Dev wiki「XPages and Calling Agents Using an In-Memory Document」明寫「Domino Server-based Agent code must run in an Agent with 'Run as Web user' selected on the Security tab」。→ 使用者記憶正確、**官方文件就夠、不需實測**（LDAT05 可選做 toggle 失敗模式確認，未必要）。
- 查證過程還挖到**正解** `agent.runWithDocumentContext(doc)`（8.5.2+）：傳 in-memory 文件（存/未存皆可）給 agent 的 `DocumentContext`，agent 就地改、回 XPage 直接讀新值、**免 getDocumentByID 重抓**（官方 wiki 逐字）。一次解掉本文「存檔 + stale handle」兩個麻煩，代價＝run-as-web-user。
- 「Run as web user」＝web 登入身分當 **effective user**（決定 ACL 存取），否則以 **signer** 跑；能做哪些**操作**仍看 signer（[Web agents 官方](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html)）。
- 措辭分寸：**runWithDocumentContext 寫成「硬性要求 run-as-web-user」（官方）**；**runOnServer+getDocumentByID 路徑寫成「條件式」**（取決於文件有無 Readers／ACL 擋 signer），不過度宣稱「一定要」。+ 伺服器 Security 要允許「sign to run on behalf of the invoker」。
- 動作：新增 runWithDocumentContext 一節 + contextDocument 段加身分 caveat + TL;DR/描述/wrap 收束；frontmatter 加 wiki + Web agents 兩官方源（diversity 升到 5 URL 各 20%）。雙語 temp-build 通過。
- 這塊聚焦 fact-check → **FAIR、零錯誤、無必改**：runWithDocumentContext 行為/簽名/8.5.2/run-as-web-user 硬性要求全對官方 wiki 逐字；runOnServer 路徑「條件式」分寸正確（有 if guard、未宣稱一定要）；伺服器設定名「Sign agents or XPages to run on behalf of the invoker」確認為 Security 分頁 Programmability Restrictions 真實欄位；兩路徑未混談。採 optional 補強：加「effective user 決定 ACL 存取、但能做哪些**操作**仍看 signer」另一半（避免讀者誤解 run-as-web-user 改變可執行操作）。

## 補強二：截圖 + 跨語言指引節（使用者觸發）

- **截圖**：使用者給 agent「安全性」分頁（「以 Web 使用者身分執行」勾選）截圖 → 複製到 `public/post-images/xpages-agent-run-as-web-user.png`，插在 runWithDocumentContext 節「你截圖那個勾選」處（雙語）。慣例：內文圖放 `public/post-images/`、引 `/domino-news/post-images/<name>.png`。
- **跨語言節**：使用者點出「LS 技術文結尾都帶 SSJS/Java 對照，這篇 SSJS 也該補其他角度」→ 加「其他語言：LotusScript 與 Java」短節（照「不深入、點到」慣例）：
  - LotusScript：stale 解法同（Set Nothing + GetDocumentByID）；`RunWithDocumentContext(doc, noteid)` LS 也有（8.5.2+，agent 端 `session.DocumentContext`）；contextDocument 對應 `uidoc.Document`。兩 client 專屬差別：①「以 Web 使用者身分執行」是 web agent 設定、client 不吃（agent 以當前 Notes 使用者跑）；② `uidoc.Reload` 看不到「編輯 session 外」（agent/他人）的改動、官方說要關閉重開（[Reload 官方](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_RELOAD_METHOD.html) 逐字 WebFetch 確認）→ 仍走 backend GetDocumentByID 重抓。
  - Java：同組 API（runOnServer/runWithDocumentContext/getDocumentContext），SSJS 幾乎一比一對應。
  - relatedJava/relatedSsjs 仍 []（非單一 class，跨語言以「節」呈現、非 frontmatter class 名）。
  - diversity 升到 6 URL 各 ~17%；雙語 temp-build（含圖）通過。
  - 這節聚焦 fact-check → **FAIR、零錯誤、無必改**：LS `RunWithDocumentContext(doc,noteid) As Integer`（8.5.2+，8.5.1 無此法）+ agent 端 `session.DocumentContext` 確認；`uidoc.Document`＝開啟文件的 backend NotesDocument 確認；`uidoc.Reload` caveat 逐字對官方；run-as-web-user 僅 web、client 以當前 Notes 使用者跑的框架正確（未誤導 client 要勾）；Java `runOnServer`/`runWithDocumentContext(doc,noteid)`/`AgentContext.getDocumentContext()` 皆存在。側記（無需改）：官方提醒勿對 `uidoc.Document` 取得的 doc 直接 `.Save`（文中未叫讀者這樣做）；Java `runWithDocumentContext` 回 void（文中未斷言 Java 回傳型別）。

## 補強三 → 修正：getDocument(true) 是過度使用，範例改用 save()（使用者兩次觸發）

第一次：使用者指出「`getDocument(true)` 印象中抓畫面值、不是後端存的；我們常只用 `getDocument()` + `getComponent().getValue()` 抓畫面」。我先補了 `()` vs `(true)` 的澄清。
第二次（關鍵）：使用者說「這個想單獨寫一篇」＋「再確認你的情境真的需要 `(true)` 嗎?」。**重新確認後：我的情境其實不需要 `(true)`。**
- **生命週期**：XPages JSF 送出時，**Update Model Values（phase 4）在按鈕 SSJS（Invoke Application, phase 5）之前**就把 bound 畫面值寫進 data source 的文件了。所以一般送出事件裡，`document1.getDocument()` 本來就已帶畫面現值，`(true)` 多半多餘。（`immediate=true` 跳過 Update Model Values 的才兩樣，走 `getComponent().getValue()`。）
- **最乾淨的存檔路徑**＝`document1.save()`（data source 的 save 會 flush 畫面值進文件）→ 傳 NoteID，完全繞過 `getDocument(true)` 爭議。
- 處置：① 把 `()` vs `(true)` 的深入說明**整段拿掉**（使用者要單獨寫一篇，之後雙向連結，文中留一句 deferral 指向）；② 範例改乾淨——存檔路徑用 `document1.save()` + `getDocument().getNoteID()`；runWithDocumentContext 用 `document1.getDocument()`（送出事件已含畫面值）；③ 「好處」段與 wrap-up 不再掛 `getDocument(true)`。
- 教訓：被社群/原文帶著用 `getDocument(true)` 當「取畫面值」的慣用寫法，但在「按鈕事件 + document1.save()」情境其實非必要；使用者的實務（getDocument() + getComponent 分工 / 或直接 save()）更準。這題本身夠料、確實值得使用者單獨成篇。

## 異動日誌

- 2026-10-10 新建。官方 method 文件 + 使用者第一手 SSJS 截圖；NotebookLM 不可用（62 天舊 state + overlay）已 fallback 並告知；不引 xred；深連 java-recycle-memory；排 10/10 Path A。（Opus 4.8）
