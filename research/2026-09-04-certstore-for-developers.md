---
slug: certstore-for-developers
title: "Put the CA in certstore and Everything Trusts It? DRAPI's Outbound Actually Uses the JVM Truststore, Not certstore"
lang: [zh-TW, en]
pubDate: 2026-09-04
status: staged
tags: [Domino REST API, Security]
requester: 使用者 (bryan，certstore 三部曲之 Part 3；並主動提供自己的 drapi-oidc-keycloak 實測 repo)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；零必修。採納 editorial 提醒拿掉 Tutorial tag（本篇為概念釐清+田野報告、非動手 arc）"
created: 2026-08-27
updated: 2026-08-27
---

# 研究軌跡 — certstore-for-developers

certstore 系列 **Part 3（完結）**。承 [[certstore-getting-started]] / [[certstore-acme]]。
開發者視角：DRAPI 怎麼吃 certstore 憑證發 HTTPS、以及對外呼叫的信任其實不在 certstore。

**這篇的差異化 = 使用者的第一手實測。** 使用者寫作到一半主動提供自己的
[drapi-oidc-keycloak repo](https://github.com/bryanHsiao/drapi-oidc-keycloak)（環境 Domino 12.0.2、
DRAPI v1.1.7、Let's Encrypt `*.domino.com.tw`），內容直接印證並補強本篇論點——把「照文件講」升級成
「作者親手測過」的田野報告。經使用者同意公開連結該 repo 當延伸閱讀。

## 研究來源 (Research trail)

### 避免重複既有文
站上 [[notes-httprequest-14-5-trust-store]]（5/10）已**完整擁有** NotesHTTPRequest 14.5
cacerts.pem→Domino Directory 的變化。本篇**不重寫**、只交叉連結，並把重心放在 DRAPI 與「三個信任庫
分清楚」這個既有文沒涵蓋的角度。

### NotebookLM
本 session 對 Admin notebook 的擷取穩定失敗（見 [[certstore-getting-started]] / [[certstore-acme]]
側車），本篇 DRAPI 內容主要在 opensource.hcltechsw.com（不在 notebook 來源清單），直接 WebFetch。

### WebFetch / WebSearch — 官方文件（驗證非 404，含 curl HEAD 200）
- DRAPI `dominohttps.html`（opensource.hcltechsw.com）：**權威 config**——`{notesdata}/keepconfig.d`
  放 JSON、`{ "TLSCertStore": true }`；`TLSCertStoreName` 字串或陣列、多名走 SNI、支援萬用；不指定就
  抓 server 文件的「Fully qualified Internet host name」。
  ⚠️ **關鍵陷阱**：WebSearch 摘要一度給錯的 `JWTCertStore`/`JWTCertStoreName`；WebFetch 權威頁確認
  正確是 **`TLSCertStore`/`TLSCertStoreName`**（TLS 前綴、非 JWT）。→ 這就是「treat contradictions as
  red flags、以權威頁為準」的實例。
- `secu_le_using_certificate_manager.html`：trusted roots 逐字「Trusted root certificates allow web
  servers to accept the trusted root certificates from connecting clients. Trusted root certificates
  are also useful for automatically completing partial certificate chains presented by CAs.」（inbound）
- `conf_config_certstore_for_tls.html`（14.5.1，curl HEAD 200）：web server 用 certstore 當 TLS 來源。

### 使用者第一手實測（drapi-oidc-keycloak repo，親手驗證）
- **DRAPI inbound(8880)✅**：`tls.json = { "TLSCertStore": true, "TLSCertStoreName": ["*.domino.com.tw"] }`，
  萬用即可（因 DRAPI「你指名」）。
- **Domino HTTP inbound(443)✅但有條件**：credential 的 Host names **必須含本機 FQDN**（`ldat05.domino.com.tw`），
  只有萬用 → 443 握手失敗；加 FQDN → 正常（因 Domino HTTP「拿 FQDN 去查」）。接上後 server document 的
  「TLS 金鑰檔名」欄位可留空。
- **DRAPI outbound❌**：把 IdP 的 CA 只放 certstore Trusted Root、從 JVM cacerts 移除、重啟 → DRAPI 仍
  不信任（provider 從 idpList 消失）；keytool 匯入 `<Domino>\jvm\lib\security\cacerts` → 立刻通。
  → **DRAPI 對外走 JSSE、只讀 JVM truststore**；症狀 `Error fetching token`；`curl` vs `curl -k` 診斷。

### 矛盾檢查
- 使用者實測（certstore outbound 不行、只吃 JVM truststore）與官方（trusted roots 定位 inbound）**一致**，
  互相佐證。
- 環境註記：使用者環境 12.0.2；DRAPI outbound=JVM cacerts 與版本無關（Keep 是 Java）；14.5 的
  NotesHTTPRequest→Directory 是另一個消費者（LS）、與 DRAPI 無關——文章已分清、未混談。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
指示查證：TLSCertStore/TLSCertStoreName（非 JWT）、trusted roots 逐字、FQDN 查找、DRAPI outbound=JSSE/
JVM truststore 的技術合理性、keytool 語法與 `changeit` 預設、`Error fetching token`、curl -k 診斷、
三信任庫表、是否誤把 certstore 當 NotesHTTPRequest 的 outbound 來源。

**VERDICT：PASS（零必修）。** 官方claims 全 verified：`TLSCertStore`/`TLSCertStoreName`（非 JWT，
逐字對 dominohttps.html 兩個 JSON 例）、trusted roots 逐字、FQDN 查找（citation 掛在較軟的敘述、FQDN
差異以「田野實測」呈現，合理）；實測claims 全技術合理：DRAPI/Keep 是 Java(Vert.x)→JSSE 讀 JVM
truststore、keytool 語法對、`changeit` 為預設、`Error fetching token` 合理、`curl -k` 診斷正確；
三信任庫表每列正確且與 5/10 [[notes-httprequest-14-5-trust-store]] 一致；無 certstore↔Directory 混談；
「結論很硬」正確 scope 在 12.0.2。
**採納一個非阻擋 editorial 提醒**：`Tutorial` TYPE tag——本篇主軸是「三個信任庫」概念釐清 + 田野報告，
config／keytool 為輔證，非 step-by-step 動手 arc → 依 CLAUDE.md TYPE-tag 精準規則**拿掉 Tutorial、TYPE
留白**（不過度承諾）。tags 定為 `Domino REST API` / `Security`。
非矛盾註：本篇 JVM cacerts 路徑 `<Domino>\jvm\lib\security\cacerts` 是 Domino 現行 layout 的正解；
5/10 舊文寫 `$JAVA_HOME/jre/lib/security/` 指同一個 Domino JVM truststore、非矛盾。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] 搜尋導向 how-to：`DRAPI 用 certstore.nsf 憑證發 HTTPS，以及三個信任庫（certstore／Directory／JVM cacerts）怎麼分`
  — 跟前兩篇一致的好搜風格，但沒把「誤會」這個最有記憶點的鉤子放出來。
- [汰除] 開發者視角（平）：`certstore 的開發者視角：DRAPI 吃憑證發 HTTPS、對外信任卻走 JVM cacerts（實測）`
  — 平衡、點出實測，但比較平。
- [選定] 誤會破除 hook：`把 CA 放進 certstore 就到處都信任了？DRAPI 對外其實走 JVM truststore、不是 certstore`
  — 使用者拍板。反直覺、由實測撐腰、最有記憶點；工具名（certstore/DRAPI/JVM truststore）齊。
  en 鏡像：`Put the CA in certstore and Everything Trusts It? DRAPI's Outbound Actually Uses the JVM Truststore, Not certstore`。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方（DRAPI + admin）+ 使用者第一手實測 repo
- [x] DRAPI config 權威頁確認 `TLSCertStore`（非 WebSearch 誤給的 JWTCertStore）
- [x] 四外部 URL 驗證非 404（含 curl HEAD 200）
- [x] 矛盾檢查（使用者實測與官方互相佐證；certstore vs Directory 未混談）
- [x] inline-link diversity 通過（4 個相異 URL 各 2 次 = 25%）
- [x] 雙語 build 通過（暫複製進 posts 驗 frontmatter）
- [x] humanizer-zh-tw 自審（field-report 語氣、實測第一人稱為 earned voice、無罐頭結論）
- [x] 未重寫既有 [[notes-httprequest-14-5-trust-store]]、只交叉連結
- [x] TYPE-tag 精準：拿掉 Tutorial（概念釐清+田野報告、非動手 arc）
- [x] 獨立 fact-check（subagent）→ PASS（零必修）

## 異動日誌
- 2026-08-27 WebFetch 官方（DRAPI dominohttps / CertMgr / certstore-for-tls）、雙語草稿、diversity、
  標題 loop、sidecar（Opus 4.8）
- 2026-08-27 使用者提供 drapi-oidc-keycloak 實測 repo → 融入三個第一手發現（DRAPI inbound 指名吃萬用、
  Domino HTTP 要 FQDN、DRAPI outbound=JVM truststore）＋經同意連結 repo；重寫雙語（Opus 4.8）
- 2026-08-27 獨立 fact-check subagent → PASS（零必修）；採納 editorial 提醒拿掉 Tutorial tag（Opus 4.8）
