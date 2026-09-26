---
slug: xpages-sessionassigner
title: "XPages sessionAsSigner 提權與簽章者身分"
lang: [zh-TW, en]
pubDate: 2026-09-28
status: staged（_pending，排 2026-09-28，Path A；9/28–10/05 批次 #1）
tags: [SSJS, XPages, Security]
requester: 使用者（LS 100% 後轉跨語言批次 9/28–10/05；SSJS 最薄優先）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。三 session 定義對官方 verbatim、簽章者逐元件/script library 有據、setConvertMime 準、full access 需啟用正確框成行為、code API 全有效、跨語言準。修 1 minor：MIME 回 null 的對照從「用一般 database 物件」改「用當前使用者 session 讀」（更精確）。nit（® 省略、混簽情境為合理延伸）不改。
created: 2026-09-28
updated: 2026-09-28
---

# 研究軌跡 — xpages-sessionassigner

SSJS/XPages 安全 deep-dive。批次 #1。

## 標題候選（自決，不再逐次問使用者——見 [[feedback_title_self_decide]]）

- [汰除] 概念三兄弟：`sessionAsSigner 三兄弟：session／sessionAsSigner／…WithFullAccess` — 好記但沒點出痛點。
- [選定] 精簡好搜：`sessionAsSigner：XPages 用簽章者身分提權，簽章算誰、會踩什麼雷`
  en 鏡像：`sessionAsSigner: Running XPages Code as the Signer — Who the Signer Is, and Where It Bites`
- [汰除] 問題先行：`為什麼同一個按鈕有時提權成功、有時失敗？` — 太隱晦、搜尋度差。

## 研究（第一手 doc + 社群 gotcha）

- **官方 Global objects**（[dom_designer 14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html)）：session / sessionAsSigner / sessionAsSignerWithFullAccess 三者身分定義 verbatim。
- **sessionAsSigner Oddities Part 1**（xpagesandme）：簽章者=逐元件最後簽的人、script library 各自算、上線前用 admin ID 全簽；`setConvertMime(false)` 修 getMIMEEntity 回 null。
- **HCL XPages 論壇**（Java sessionAsSigner）：Java 端等價，當跨語言段參考。
- 未跑 NotebookLM（SSJS 平台 API + 社群 gotcha，notebook 對此 thin；本 session 卡登入）。
- full access 需 server/DB 允許：標為已知行為、非官方逐字。

## 查證 checklist

- [x] 三 session 定義對官方 verbatim
- [x] 簽章者逐元件/script library、setConvertMime 對 oddities blog
- [x] full access 需啟用標為行為非官方引用
- [x] SSJS code API 有效（getDatabase/createDocument/replaceItemValue/save/setConvertMime）
- [x] 跨語言：LS agent 預設以簽章者跑、Java-in-XPages 同 session
- [x] TYPE：Security（不掛 Tutorial，偏安全概念+範例）
- [x] inline-link diversity：3 相異外部（globals / oddities / forum）
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-09-28 批次 #1；WebFetch globals+oddities；雙語 hook-first；標題自決；temp-build；stage 排 9/28。（Opus 4.8）
