---
slug: java-directory
title: "Java 查 Domino Directory:Directory 給你的不是清單,是三層導覽"
lang: zh-TW · en
pubDate: 2026-11-24T07:30:00+08:00
tags: ["Java"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — java-directory (2026-11-24)

**Topic**: `lotus.domino.Directory` / `DirectoryNavigator`（Java）—— 從 Domino
Directory(NAB)程式查名字/欄位。招牌坑:lookupNames 回的是三層游標
(名字×比對×欄位)不是清單。插旗 `coversClass: [Directory, DirectoryNavigator]`
＋ `apiLang: java`。排程 #1（11/24）。

## 為什麼是這題

- map 缺口:Directory/DirectoryNavigator 在 Java gap 清單內、無對應文。
- Java 側實用:後端/排程 agent 批次查目錄(對帳、通知、權限同步)的正解。

## 研究來源

- **NotebookLM**：未用 —— Java notebook 本輪沿用「污染」判斷，直接走官方文件。
- **WebFetch（web-fetch agent 逐一驗證，含 404 校正）**：
  - `H_NOTESDIRECTORY_CLASS_JAVA.html`（Directory class）→「Represents the Notes
    directories on a specific server or local computer, each of which is
    associated with one or more directory navigators to allow directory lookups.」
    Creation 用 getDirectory in Session。屬性 LimitMatches（「limited to fifty
    entries」）、PartialMatches、Server…；方法 createNavigator、freeLookupBuffer。
  - `H_NOTESDIRECTORYNAVIGATOR_CLASS_JAVA.html`（DirectoryNavigator）→「Allows
    lookups of a specific associated Notes directory…」。三層:findFirstName/
    findNextName(回 match 數)、findFirstMatch/findNextMatch、getFirstItemValue/
    getNextItemValue;狀態 CurrentName/CurrentMatches/NameLocated/MatchLocated/
    CurrentView。
  - `H_GETDIRECTORY_METHOD_JAVA.html`（Session.getDirectory）→
    `public Directory getDirectory([String server])`;無參＝本機、""＝當前電腦、
    server 名需 Trusted 關係;**new with Release 8.5**。
  - `H_LOOKUPNAMES_METHOD_DIRECTORY_JAVA.html` →「Looks up designated Items for
    specified Names contained in the specified View.」四個 overload 全回
    DirectoryNavigator;items「For best performance, use column names」;new R8。
  - `H_LOOKUPALLNAMES_METHOD_DIRECTORY_JAVA.html` →「Large results will be limited
    by the system, according to settings in Notes.ini. This method is intended for
    views with limited scopes.」;lookupAllNames 無 names 所以 CurrentName 為空。
- **矛盾檢查（紅旗）**：官方 `H_EXAMPLES_NOTESDIRECTORY_CLASS_JAVA.html` 的 agent
  用 `DirEntryCollection`/`DirEntry`/`getFirstEntry()`/`dir.getName()` —— 這些在
  Directory/DirectoryNavigator class 文件**都不存在**,return type 文件寫
  DirectoryNavigator、屬性是 Server 非 getName()。判定為未跟 API 更新的舊樣本
  (連分號都漏)。文章明寫「別照抄官方範例」,以 DirectoryNavigator 三層為準。

## 獨立審查 (review)

本篇未跑獨立審查模型;以官方文件逐條查證 + 自我驗證清單為準。review_model /
review_result 欄位留空（how-its-made 會誠實留白）。

## 查證 checklist

- [x] map 缺口（Directory/DirectoryNavigator 無 Java 旗）、不與既有文重疊
- [x] 官方逐字（web-fetch agent 確認 6 個 URL 非 404、校正 3 個錯檔名）
- [x] 三層導覽方法名/順序、getDirectory 參數與版本、LimitMatches 50 上限查準
- [x] 矛盾檢查:官方範例與 class 文件不符 → 文章明標別照抄
- [ ] coversClass: [Directory, DirectoryNavigator] + apiLang java（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 ≥2、單一 URL < 40%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`Java 的 Directory:查 Domino 目錄` — 目錄、看不出重點。
- [選定] 場景＋招牌坑：`Java 查 Domino Directory:Directory 給你的不是清單,是三層導覽`
  — 點出「不是清單是三層游標」這個最容易踩的坑，好搜、不過度承諾。
  en 鏡像：`Looking Up the Domino Directory in Java: Directory Hands You a Three-Level Navigator, Not a List`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 研究官方文件（含 404 校正）/ 寫雙語草稿 / 進 _pending
