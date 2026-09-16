---
slug: domino-environment-variables
title: "notes.ini 環境變數：@SetEnvironment / SetEnvironmentVar"
lang: [zh-TW, en]
pubDate: 2026-09-22
status: staged（_pending）
tags: [Domino Designer, LotusScript, Formula]
requester: 使用者 (bryan，9/17–9/22 六篇批次；候選 6)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent) → PASS（@SetEnvironment/$ 前綴/isSystem/code sample 皆正確）；兩處 quote-fidelity 修：SetEnvironmentVar 改回準確語意（加「已含 $ 則不加」例外、去假逐字）、en「local notes.ini file」去引號改述。
created: 2026-09-16
updated: 2026-09-16
---

# 研究軌跡 — domino-environment-variables

9/22（第 6 篇，收尾）。coverage：無一般 env-var 專篇（只有特定的 notes-ini-multiple-http-response-headers）。TYPE 留白。

## 研究鏈（WebFetch/WebSearch 第一手）

- **@SetEnvironment**（[11.0.1 doc](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_SETENVIRONMENT.html)）逐字：「sets an environment variable stored in the user's notes.ini file (Windows and UNIX) or Notes Preferences file (Macintosh)」＋「prepends a dollar sign ($) to the variable name」。
- **SetEnvironmentVar / GetEnvironmentString**（[SetEnvironmentVar doc](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_SETENVIRONMENTVAR_METHOD.html)、[GetEnvironmentString doc](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_GETENVIRONMENTSTRING_METHOD.html)）逐字：「stored in the local notes.ini file」；「SetEnvironmentVar prepends a $ ... if the third parameter is false or omitted」；「$ distinguishes user environment variables (starts with $) and system environment variables」；Get 「prepend a $ if the second parameter is false or omitted, and do not prepend a $ if the second parameter is true」。
- 重點：per-machine（執行那台的 notes.ini）、不共享/不複寫；$ 前綴 user vs system；讀 notes.ini 原生設定要 isSystem/第二參數 True。
- 交叉連 [[profile-documents]]（共享狀態改用 profile/config）。

## 查證 checklist

- [x] 「寫執行那台 notes.ini」「$ 前綴規則」「isSystem/第二參數 True 讀原生設定」皆官方逐字
- [x] per-machine 不共享/不複寫（官方語意 + 通識）；共享狀態導向 profile/config
- [x] inline-link diversity：4 相異官方 URL + 內部連結
- [ ] 雙語 build 驗證
- [ ] 批次 fact-check（#4–6）

## 異動日誌

- 2026-09-16 WebFetch 驗 @SetEnvironment/SetEnvironmentVar/$ 前綴官方逐字、雙語 + LS 範例、sidecar；stage _pending 排 9/22（Opus 4.8）
