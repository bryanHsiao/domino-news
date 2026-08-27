---
slug: certstore-acme
title: "Wiring Domino CertMgr to Let's Encrypt: Automatic TLS Certificate Requests and Renewals over ACME"
lang: [zh-TW, en]
pubDate: 2026-09-03
status: staged
tags: [Admin, Security, Tutorial]
requester: 使用者 (bryan，certstore 三部曲之 Part 2)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) ISSUES → 1 個小必修（引用 #1 不夠逐字）已修 → 其餘 10 項 verified；續期天數確認官方無、不杜撰為正確判斷"
created: 2026-08-27
updated: 2026-08-27
---

# 研究軌跡 — certstore-acme

certstore 系列 **Part 2**（共三部曲）。承 [[certstore-getting-started]]（Part 1 收攏 + 手動匯入），
本篇講 ACME/Let's Encrypt 自動化。續 [[certstore-for-developers]]（Part 3 開發者視角）。

## 研究來源 (Research trail)

### NotebookLM（Domino Admin notebook，優先嘗試）
- 同 notebook `2e2b3510-...`。問 ACME/Let's Encrypt/micro CA/ECDSA/key rollover 一題。
- **回答仍未被正確擷取**（同 Part 1 的收合區塊擷取失敗，非污染）→ WebFetch fallback。
  已履行「NotebookLM first」。（此擷取問題本 session 對此 notebook 穩定重現，Part 3 起
  預設直接 WebFetch 並在此註明。）

### WebFetch / WebSearch — 官方 HCL Domino 14.5.1 Admin 文件（逐一驗證非 404，含 curl HEAD 200）
- `secu_le_using_certificate_manager.html`（主頁）逐字：
  - 「CertMgr...provides the ability to automatically request, configure, and renew free, widely
    trusted TLS certificates from the Let's Encrypt CA using the ACME protocol」
  - micro CA：「A quick and easy way to generate TLS certificates for testing and development
    purposes is by creating and using a microCA」＋「Certificates from a microCA are not intended
    for production use」
  - ECDSA：「CertMgr supports Elliptic Curve Digital Signature Algorithm (ECDSA) using the NIST
    P-256 and NIST P-384 curves for ACME accounts and for TLS 1.2 host keys」
  - key rollover：「TLS host key rollover (more typical) or an ACME account key rollover」
- `secu_le_configuring_acme_accounts.html`：兩個 profile `LetsEncryptProduction` /
  `LetsEncryptStaging`，各填 email + 同意 Let's Encrypt 條款。
- `secu_le_requesting_a_certificate_2.html`：申請步驟（HTTP task → Add TLS Credentials →
  provider=ACME → Host names（多個/wildcards 限 DNS-01/最多 30 SAN）→ Servers with access →
  Submit）；submit 後自動六步（金鑰對→CSR→challenge→ACME poll 取回鏈→寫回文件→產 keyfile 部署到
  data 目錄）。Global Settings：provider=ACME、Key algorithm 預設 RSA、key size 預設 4096、
  ACME account 選 Staging/Production。
- `secu_le_managing-certs_from_LE.html`：HTTP-01（port 80/443，most typically used）vs DNS-01。

### 矛盾檢查與缺口
- 各頁一致。micro CA 明確定位「testing and development…not intended for production」——文章據此
  框定，未誇成「內部/私有 hostname 都能用」。
- **缺口（誠實標示，未杜撰）**：官方頁未見「到期前 N 天觸發自動續期」的確切數字。文章只寫「自動
  renew」（有逐字支持），並在文中明講「官方沒標數字、本文不替它填」。→ 已交 reviewer 確認是否
  真的無此數字（見下）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
指示查證：三處逐字引用、兩個 ACME profile、Global Settings 預設、申請步驟與 submit 後自動序列、
HTTP-01/DNS-01、ECDSA、key rollover、**續期天數是否真的官方未標**、Staging 限流/不受信框定是否過度。

**VERDICT：ISSUES（1 個小必修）→ 修後 PASS。**
- **必修（引用衛生）**：TL;DR 引用 #1 不夠逐字——`providing`→`provides`（時態）、又靜默刪了
  「certificate authority」。→ **已改為引用官方完整逐字句**：「CertMgr simplifies and secures
  Domino web server operations by providing the ability to automatically request, configure, and
  renew free, widely trusted TLS certificates from the Let's Encrypt certificate authority (CA)
  using the ACME protocol」（僅去掉 ® 商標符號）。
- **其餘 10 項全 verified 正確**：micro CA 兩處逐字、兩個 ACME profile、Global Settings（RSA/4096
  逐字確認於 secu_le_requesting_a_certificate.html）、申請步驟（含逐字「up to 30 SANs」「Start the
  HTTP server task」）、submit 後自動序列、HTTP-01/DNS-01（逐字「Wildcards are not supported for
  HTTP-01 challenges」）、ECDSA、key rollover 全逐字對上。
- **續期天數（Claim 9）**：reviewer 查四頁 + managing-certs 頁，**官方確實無「到期前 N 天」數字**
  （唯一時間數字是無關的 health check「every 30 minutes」）→ 不杜撰是正確判斷、非缺漏。
- **低優先（已順手改）**：「Servers with access」原寫「能解私鑰」（decrypt），官方動詞是 encrypt；
  已改為「私鑰會針對它們加密」與 Part 1 同框定。
- 註：HTTP-01 的「port 80/443」非 HCL 頁逐字、屬一般 ACME 行為（HTTP-01 起於 80、可能轉 443），
  reviewer 判定 defensible，保留。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] 痛點解除 hook：`再也不用半夜換憑證：Domino CertMgr 用 ACME 自動申請與續期 Let's Encrypt`
  — 管理員痛點當鉤子、有畫面、工具名齊，但比選定版少一點「TLS 憑證」這個好搜詞。
- [汰除] 系列明標：`certstore 系列 Part 2：CertMgr + ACME 讓 Let's Encrypt 憑證全自動` — 系列感最強，
  但 Part 1 標題沒放「系列 Part N」，放了不一致。
- [選定] 搜尋導向：`Domino CertMgr 串接 Let's Encrypt：用 ACME 協定自動申請與續期 TLS 憑證`
  — 使用者拍板。工具名（CertMgr/Let's Encrypt/ACME）+ 動作（自動申請與續期）+ 物件（TLS 憑證）
  全在，最好搜。
  en 鏡像：`Wiring Domino CertMgr to Let's Encrypt: Automatic TLS Certificate Requests and Renewals over ACME`。

## 查證 checklist
- [x] 研究鏈：NotebookLM 優先（擷取失敗）→ WebFetch/WebSearch 官方 admin 文件
- [x] 四頁 14.5.1 驗證非 404（含 curl HEAD 200）
- [x] 矛盾檢查（各頁一致；micro CA 未誇大；續期天數缺口誠實標示未杜撰）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過（暫複製進 posts 驗 frontmatter）
- [x] humanizer-zh-tw 自審（field-report 語氣、破折號承載 aside、無罐頭結論）
- [x] 獨立 fact-check（subagent）→ ISSUES（1 小必修：引用 #1）→ 修後 PASS；續期天數確認官方無

## 異動日誌
- 2026-08-27 NotebookLM 嘗試（擷取失敗）、WebFetch/WebSearch 官方 admin 文件、雙語草稿、
  diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-27 獨立 fact-check subagent → ISSUES（引用 #1 不夠逐字）→ 改為完整逐字句；順手改
  encrypt 框定 → 修後 PASS（Opus 4.8）
