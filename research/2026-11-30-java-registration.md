---
slug: java-registration
title: "Java 的 Registration:先把 CertifierIDFile 等屬性設好,再 registerNewUser"
lang: zh-TW · en
pubDate: 2026-11-30T07:30:00+08:00
tags: ["Java"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — java-registration (2026-11-30)

**Topic**: `lotus.domino.Registration`（Java）—— 程式化註冊使用者/certifier/server。
招牌坑:屬性先設再呼叫、registerNewUser 回 boolean 不丟例外、createRegistration 不能
跑 IIOP。插旗 `coversClass: Registration` ＋ `apiLang: java`。排程 #7（11/30，收尾）。

## 為什麼是這題

- map 缺口:Registration 在 Java gap 清單、無對應文。
- Java 側實用:後端批次入職 / 腳本化佈建的正解;且是 admin 自動化少見但有份量的題。

## 研究來源

- **NotebookLM**：未用，走官方文件。
- **WebFetch（web-fetch agent，含 404 校正 1 處）**：
  - `H_NOTESREGISTRATION_CLASS_JAVA.html`（class）→「Represents the creation or
    administration of an ID file.」;「The properties are intended to be set before
    calling the methods.」
  - `H_CREATEREGISTRATION_METHOD_JAVA.html`（404 校正自 _SESSION_JAVA）→ 無參數回
    Registration;「illegal for remote (IIOP) calls.」
  - `H_REGISTERNEWUSER_METHOD_JAVA.html` →「Creates a user ID…」;回 boolean「True if
    the operation is successful; false otherwise.」;多 overload;範例 11 參數(certpw=
    憑證密碼、userpw=使用者密碼);Expiration 預設 2 年(new with 6.0.3)。
  - `H_CERTIFIERIDFILE_PROPERTY_JAVA.html` →「Set this property before calling
    crossCertify, recertify, registerNewCertifier, registerNewServer, or registerNewUser.」
  - `H_REGISTERNEWCERTIFIER_METHOD_JAVA.html`（org 100 年「cannot be changed」）、
    `H_CROSSCERTIFY_METHOD_JAVA.html`（「requires that CertifierIDFile be set」,10 年）、
    `H_GETUSERINFO_METHOD_JAVA.html`（「parameters, except for the first, are return
    values.」out-param StringBuffer/Vector）。
  - 範例（H_EXAMPLE_REGISTERNEWUSER…）：createRegistration→setRegistrationServer→
    setCertifierIDFile→setIDType(ID_HIERARCHICAL)→setMinPasswordLength→registerNewUser(...)。
- **矛盾檢查**：無 ID vault/CA/ESCROW 提及（憑證 .id+密碼模型）→ 文章不宣稱 CA。
  MailInternetAddress getter/setter 名不一致（doc quirk，未寫入文章）。

## 獨立審查 (review)

本篇未跑獨立審查模型;官方逐條查證 + 自我驗證清單。review 欄留空。

## 安全/敏感度註記

本文為 Registration **API 的技術說明**，不執行任何註冊動作。文中強調憑證 ID + 密碼
屬機敏、且 registration 不該放 XPages 前端 —— 與站上一貫的安全觀一致。

## 查證 checklist

- [x] map 缺口（Registration 無 Java 旗）、不重疊
- [x] 官方逐字（web-fetch agent，ls_classes.json 校正錯檔名、1 處 404 校正）
- [x] 屬性先設、boolean 回傳、certpw vs userpw、IIOP 限制、Expiration 預設 查準
- [x] 矛盾檢查:不宣稱 CA/vault;doc quirk 不寫入
- [ ] coversClass: Registration + apiLang java（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 3 URL 各 33%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`Java 的 Registration:註冊使用者` — 目錄。
- [選定] 招牌節奏：`Java 的 Registration:先把 CertifierIDFile 等屬性設好,再 registerNewUser`
  — 點出「屬性先設再呼叫」這個與眾不同的用法節奏，好搜、不過度承諾。
  en 鏡像：`Registration in Java: Set the Properties (CertifierIDFile and Friends) First, Then registerNewUser`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 研究官方文件（含 404 校正）/ 寫雙語草稿 / 進 _pending
