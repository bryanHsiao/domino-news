---
slug: certstore-getting-started
title: "Getting Started with Domino Certificate Management: CertMgr and certstore.nsf Instead of Scattered .kyr Keyrings"
lang: [zh-TW, en]
pubDate: 2026-09-02
status: staged
tags: [Admin, Security, Tutorial]
requester: 使用者 (bryan，主動提出想寫 certstore 主題，站上確認無專篇 → 定為三部曲)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；零必修（套了 2 個非阻擋改進）"
created: 2026-08-27
updated: 2026-08-27
---

# 研究軌跡 — certstore-getting-started

certstore 系列 **Part 1**（共三部曲）。使用者主動問「certstore 站上還沒有文章吧？想寫」，
grep 確認站上只有 trust-store／lotusscript-http-json／drapi-keycloak-oidc 三篇順帶提到
`certstore.nsf`、無專篇。使用者要三個角度全寫 → 定為系列：
- Part 1（9/02，本篇）Admin 導入指南
- Part 2（9/03）[[certstore-acme]] CertMgr + ACME 自動憑證
- Part 3（9/04）[[certstore-for-developers]] 開發者視角 + 14.5 cacerts.pem→Directory 遷移

Admin 是 coverage 的 0% 類別，價值高。

## 研究來源 (Research trail)

### NotebookLM（Domino Admin notebook，優先嘗試）
- notebook `2e2b3510-...`（Domino Admin，涵蓋 certstore/Security）。問了一題涵蓋六面向
  （是什麼／CertMgr task／TLS Credentials／匯入/建立/ACL/與 kyr 及 Internet Site 關係）。
- chat pairs=0（非污染），但**回答未被正確擷取**（卡在收合的「已搜尋你的來源…」區塊，
  script 沒抓到 answer body）——已知的擷取 UI 問題。→ 依 workflow fallback 到 WebFetch。
  已履行「NotebookLM first」。

### WebFetch — 官方 HCL Domino 14.5.1 Admin 文件（逐一驗證非 404）
- `secu_le_using_certificate_manager.html`（Managing TLS certificates with Certificate
  Manager）— 主頁。逐字：
  - 「HCL Domino 12 introduces a new server task, Certificate Manager (CertMgr), that works
    with a new database, Certificate Store (certstore.nsf) to manage TLS certificates」
  - certstore.nsf：「This database provides the interface to request, store, and distribute
    certificates in a secure way.」
  - 「The CertMgr task creates this database the first time it runs.」
  - TLS Credentials：「certificates generated through Certificate Manager are securely stored
    directly in TLS Credentials documents in certstore.nsf rather than in keyring files on disk」
  - 安全：「certstore.nsf is protected by the database ACL and private keys are protected by
    256 bit AES encryption」
  - 啟動：「Configure CertMgr to start automatically by adding `CertMgr` to the ServerTasks
    notes.ini setting or by scheduling it to run in a Program document.」
  - 章節地圖：Running CertMgr / Let's Encrypt CA / 第三方 CA 匯入 / micro CA / Exporting
    credentials / trusted roots / key rollover / tell commands…（micro CA 與 Let's Encrypt → Part 2）
- `conf_set_up_cred_and_cert_stores.html`（Setting up the stores）— stand-up 步驟逐字：
  「Create a certificate store on the server using the `load certmgr` console command. This
  starts the Certificate Manager task, which will create the certstore.nsf database.」→ 開啟
  certstore.nsf → 填 CA 文件(Basics)/root/TLS Credentials → 重啟 server。
- 第三方 CA 手動匯入步驟（WebSearch help.hcl-software.com 命中
  `wn_simplified_procedure_third_party_certs.html`）：Add TLS Credentials → Host names(+SAN) →
  Servers with access → Certificate Provider=**Manual** → Submit Request（產金鑰對+CSR，
  Status→Waiting）→ 複製 CSR 送 CA → 貼回簽署憑證。格式 **PEM（Base64-encoded DER）**。
- `conf_managingservercertificatesandcertificaterequests_t.html`（without CertMgr）— 佐證
  kyr 時代手動路徑至今仍有文件、用作對比連結。

### 矛盾檢查
各頁一致。certstore/CertMgr 一律歸 Domino 12（歷史事實、非「現在最新」措辭）。14.5 的
cacerts.pem→Directory 變化屬 NotesHTTPRequest（本篇僅在結尾點名、深入留 Part 3）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
指示查證：五處逐字引用是否 word-for-word、Domino 12 歸屬、`load certmgr` 建庫、第三方匯入
步驟與順序、PEM 格式、Servers-with-access 加密模型、hook 的 kyr/.sth/kyrtool/certsrv.nsf
歷史描述是否正確。

**VERDICT：PASS（零必修）。** 五處逐字引用全 word-for-word 確認、Domino 12 歸屬正確、
`load certmgr` 建庫正確、第三方匯入六步順序正確、PEM=Base64-encoded DER 正確、
Servers-with-access「私鑰只為指定 server 加密」模型正確（doc 逐字：「select the Domino
servers with which to encrypt the private key…so that they can read the private key and use
the certificates」）、hook 的 kyr/.sth/kyrtool/certsrv.nsf 歷史描述全部正確、無 paraphrase
假冒逐字、無 overstatement。
**套了 2 個非阻擋改進**：(a) 引用 1 補完整句尾「…in your Domino environment」（引用衛生）；
(b) 匯入步驟 6 補上「貼進 Certificates & Roots (PEM) 欄、再按一次 Submit Request 收尾」
（Tutorial 可照跑的完整性——reviewer 指出 doc 有這兩個更細的步驟）。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] 純入門定位：`Domino TLS 憑證管理入門：認識 CertMgr 與 certstore.nsf` — 最乾淨最好搜、
  系列開篇感強，但少了 kyr 對比的記憶點。
- [汰除] 問題先行：`別再每台 server 手動換 kyr 憑證：Domino certstore 入門` — 管理員痛點當鉤子、
  最有畫面，但把主題稍窄化成「痛點」。
- [汰除] 好處先行：`一個 task、一個資料庫，統一管好所有 Domino TLS 憑證：certstore 入門` — 強調
  收攏的好處，但「統一管好」略有承諾感。
- [選定] 入門 + kyr 對比：`Domino 憑證管理入門：用 CertMgr 與 certstore.nsf 取代滿地的 kyr keyring 檔`
  — 使用者拍板。入門定位 + 工具名齊 + kyr 對比 hook 三者都在，好搜也好記。
  en 鏡像：`Getting Started with Domino Certificate Management: CertMgr and certstore.nsf Instead of Scattered .kyr Keyrings`。

## 查證 checklist
- [x] 研究鏈：NotebookLM Admin notebook 優先（擷取失敗）→ WebFetch 官方 admin 文件 fallback
- [x] 官方三頁 + 匯入頁驗證非 404
- [x] 矛盾檢查（各頁一致；Domino 12 歷史歸屬；14.5 Directory 變化留 Part 3）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過（暫複製進 posts 驗 frontmatter，無裸 `""` 陷阱）
- [x] humanizer-zh-tw 自審（field-report 語氣、破折號承載真實 aside、rule-of-three 為引官方原文、無罐頭結論）
- [x] 獨立 fact-check（subagent）→ PASS（零必修；套 2 個非阻擋改進）

## 異動日誌
- 2026-08-27 NotebookLM Admin notebook 嘗試（擷取失敗）、WebFetch 官方 admin 文件、雙語草稿、
  diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-27 獨立 fact-check subagent → PASS（零必修）；套 2 個非阻擋改進（引用補句尾、
  匯入步驟收尾）（Opus 4.8）
