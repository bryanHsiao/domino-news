---
slug: ssjs-mimeentity
title: "XPages 寄 HTML mail:先 setConvertMime(false),不然 MIME 會被轉成 rich text"
lang: zh-TW · en
pubDate: 2026-11-27T07:30:00+08:00
tags: ["XPages", "SSJS"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — ssjs-mimeentity (2026-11-27)

**Topic**: SSJS `NotesMIMEEntity`（XPages）—— 組 HTML mail。招牌坑:先
session.setConvertMime(false)(否則 MIME 於文件實例化被轉 rich text)、entity 必須
叫 Body 才寄得出去、charset=UTF-8 不然中文亂碼、handle 於 send/save 後失效。插旗
`coversClass: MIMEEntity` ＋ `apiLang: ssjs`。排程 #4（11/27）。

## 為什麼是這題

- map 缺口:MIMEEntity 有 Java 文（java-mimeentity）缺 SSJS 旗。
- SSJS 側實用:XPages 即時寄 HTML 通知信的日常需求。

## 研究來源

- **NotebookLM**：未用，走官方 SSJS reference。
- **WebFetch（web-fetch agent，含 404 校正 2 處）**：
  - `r_domino_MIMEEntity.html`（class）→「Represents an item of type MIME…」;失效條件
    「becomes invalid if … computeWithForm, encrypt, save, send, sign, or
    closeMIMEEntities.」;「Avoid processing items as both NotesItem and
    NotesMIMEEntity … concurrently.」
  - `r_domino_Session_IsConvertMIME.html`（convertMIME 開關）→「initially true」;
    「Changes … apply only to those items opened by the backend processor after the
    property has been changed.」;「restore it before exiting.」
  - `r_domino_Document_createMIMEEntity.html` → 預設 item 名 Body;「A MIME entity named
    Body (case insensitive) gets special support as a Domino mail message.」;「If you
    specify an item name other than Body, the containing document cannot be mailed.」
  - `r_domino_MIMEEntity_setContentFromText.html` → `(stream, contentType, encoding)`;
    contentType 產生 Content-Type;WriteText「defaults to US-ASCII」要 charset=UTF-8;
    ENC_NONE1725/QP1726/BASE64 1727/7BIT1728/8BIT1729/BINARY1730/EXTENSION1731。
  - `r_domino_MIMEEntity_createChildEntity.html`（真名 createChildEntity，404 校正自
    createChild）→「otherwise, multipart/mixed is imposed.」「parent entity should
    contain no content.」
  - `r_domino_MIMEEntity_createHeader.html` → createHeader(name)+setHeaderVal。
  - 官方範例（createMIMEEntity 頁）：setConvertMime(false)→createStream→createDocument
    →appendItemValue Form Memo→createMIMEEntity→createHeader/setHeaderVal→writeText→
    setContentFromText(...,ENC_NONE)→send→setConvertMime(true)。
- **矛盾檢查（紅旗）**：method reference 頁寫 `setConvertMIME`，官方範例用
  `setConvertMime`，SSJS 大小寫敏感 → 文章明標「以環境實測為準」。404 校正:
  createChild→createChildEntity、Session_convertMIME→Session_IsConvertMIME。

## 獨立審查 (review)

本篇未跑獨立審查模型;官方逐條查證 + 自我驗證清單。review 欄留空。

## 查證 checklist

- [x] map 缺口（MIMEEntity 缺 SSJS 旗）、不與 java-mimeentity 重疊
- [x] 官方逐字（web-fetch agent 7 URL 確認、校正 2 個錯檔名）
- [x] setConvertMime 時機/大小寫、Body 命名、charset、encoding 常數、handle 失效 查準
- [x] 矛盾檢查:setConvertMIME 大小寫不一致 → 文章標注
- [ ] coversClass: MIMEEntity + apiLang ssjs（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 3 URL 各 33%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`XPages 的 MIMEEntity:組 MIME` — 目錄。
- [選定] 招牌坑：`XPages 寄 HTML mail:先 setConvertMime(false),不然 MIME 會被轉成 rich text`
  — 點出最致命的 convert 時機坑，好搜、不過度承諾。
  en 鏡像：`Sending HTML Mail from XPages: setConvertMime(false) First, or Domino Turns Your MIME into Rich Text`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 研究官方 SSJS reference（含 404 校正、大小寫矛盾）/ 寫雙語草稿 / 進 _pending
