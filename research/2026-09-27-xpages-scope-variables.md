---
slug: xpages-scope-variables
title: "XPages 四個 scope 生命週期"
lang: [zh-TW, en]
pubDate: 2026-09-27
status: staged（_pending，排 2026-09-27，Path A）
tags: [SSJS, XPages, Tutorial]
requester: 使用者（LS 100% 滿→轉寫 Formula/Java/SSJS；SSJS 最薄；AskUserQuestion 選定「XPages scope 變數生命週期」）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent，對照官方 + DDWiki）→ PASS。官方四 scope 壽命定義 verbatim、DDWiki 序列化/SSJS function/Notes 物件 toxic 引用 verbatim、resolution order 正確標為 JSF 行為非官方引用、code SSJS API 全對。修 2：①NotSerializableException 引用補全 `: 'some object type'`；②「C 層 handle 序列化後還原不回來」原為推論 → 改「C 層物件、無自動 GC、對 JSF/記憶體有毒；不可序列化故序列化也過不了」，貼合 DDWiki 用詞。
created: 2026-09-27
updated: 2026-09-27
---

# 研究軌跡 — xpages-scope-variables

SSJS/XPages 概念 deep-dive。LS 類別 100% 覆蓋後轉跨語言（Plan C），SSJS 為三語最薄。

## 標題候選

- [汰除] 概念+具體雷尾：`XPages 的四個 scope：壽命、名稱解析，與把 NotesDocument 塞進去就爆的雷` — 清楚好搜、雷尾好記，但偏長。
- [汰除] 問題先行：`為什麼把 NotesDocument 塞進 viewScope 遲早會爆？——XPages 四個 scope 的壽命與序列化` — 以症狀發問、搜 NotSerializableException 會中，但更長。
- [選定] 精簡好搜：`XPages 四個 scope：各活多久、該放什麼、什麼會爆`
  en 鏡像：`The Four XPages Scopes: How Long Each Lives, What to Put in Each, and What Blows Up`
- [汰除] 概念 hook：`scope 不是變數袋：XPages 四個 scope 的壽命與序列化雷` — 有記點，但「變數袋」自造詞、搜尋度差。

（使用者當下選「精簡好搜」；並指示：之後標題優化 loop 由我自決一版、不再逐次詢問，需改再說 → 見 [[feedback_title_self_decide]]。）

## 研究（NotebookLM 決策 + 第一手 doc）

- **未跑 NotebookLM**：scope 生命週期是 JSF/XPages 平台行為、SSJS 參考 notebook 多為 class 層、對此通常 thin；加本 session NotebookLM 卡登入。依 CLAUDE.md 逃生口改第一手官方 doc WebFetch。
- **官方 Server-side scripting**（[dom_designer 12.0.0](https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html)）：四 scope 壽命 verbatim（one service request / one session (until logout) / life of the application / life of the view page）。
- **DDWiki Do's and Do Not's**（[HCL](https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/Dos_and_Do_Nots_for_XPages_Scoped_Variables)）：序列化到磁碟 → NotSerializableException；SSJS function 最常見；Notes 物件 toxic → 存 UNID/view 名/db 路徑；Keep pages on disk 8.5.2 起預設。
- **Intec（Paul Withers）**：scoped variables 補充（resolution、per-NSF ClassLoader 佐證）。
- resolution order（tightest-first）與 per-NSF ClassLoader 標為「XPages/JSF 行為」，非官方逐字。

## 查證 checklist

- [x] 四 scope 壽命對官方 verbatim
- [x] 序列化/SSJS function/Notes 物件 toxic 對 DDWiki verbatim
- [x] resolution order、per-NSF ClassLoader 標為行為非官方引用
- [x] code SSJS API 全對（put/get/remove/clear、dot 語法、getDocumentByUNID）
- [x] 跨語言段：Java-in-XPages 同 scope、LS agent 無對應
- [x] TYPE=Tutorial（有可照跑 SSJS 範例：讀寫各 scope + 序列化正解 do/don't）
- [x] inline-link diversity：3 相異外部（官方 / DDWiki / Intec）+ 內部 save-conflict 連
- [x] 雙語 temp-build（exit 0、兩版 render）
- [x] fact-check PASS（2 minor 已修）

## 異動日誌

- 2026-09-27 選題（SSJS scope 生命週期）→ WebFetch 官方+DDWiki+Intec → 雙語 hook-first 成稿 → temp-build → fact-check PASS（修 2 minor）→ 標題自決「精簡好搜」→ stage _pending 排 9/27。（Opus 4.8）
