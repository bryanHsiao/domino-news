---
slug: ssjs-viewnavigator
title: "XPages 導覽分類視圖:先關掉父 view 的 IsAutoUpdate,不然 navigator 會壞"
lang: zh-TW · en
pubDate: 2026-11-29T07:30:00+08:00
tags: ["XPages", "SSJS"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — ssjs-viewnavigator (2026-11-29)

**Topic**: SSJS `NotesViewNavigator`（XPages）—— 導覽分類視圖。招牌坑:父 view
IsAutoUpdate=true 會關 cache、使 entry 失效（Entry not found in index）;get 建
ViewEntry、goto 不建。插旗 `coversClass: ViewNavigator` ＋ `apiLang: ssjs`。排程 #6（11/29）。

## 為什麼是這題

- map 缺口:ViewNavigator 有 Java 文（java-viewnavigator）缺 SSJS 旗。
- SSJS 側實用:XPages 分類視圖樹 / 清單 / 計數的日常。

## 研究來源

- **NotebookLM**：未用，走官方 SSJS reference。
- **WebFetch（web-fetch agent，10 頁全 200；回報用俄文但內容無誤）**：
  - `r_domino_ViewNavigator.html`（class）→「provides access to all or a subset of the
    entries in a view.」;「A `goto` method is favored over a `get` method ... does not
    create a NotesViewEntry object.」;「The cache is turned off if IsAutoUpdate is true
    for the parent view」;「may invalidate entries in child objects ("Entry not found in
    index")」;「Avoid automatically updating ... setting IsAutoUpdate to false」。
  - `r_domino_View_createViewNavFromCategory.html` →「The category entry itself is
    excluded.」;巢狀用反斜線 "Asia\\Korea"。
  - `r_domino_ViewNavigator_getNext.html`（get→ViewEntry）/ `_gotoNext.html`（goto→boolean）。
  - `r_domino_ViewNavigator_CacheSize.html` → 0–**128**（預設上限;**修正**我原估 ~400）;
    「Applies only to remote (IIOP) operations.」;current-pointer 走吃 cache、帶 entry 不吃。
  - `r_domino_ViewNavigator_MaxLevel.html` → 0（頂層）–30（預設）;「cannot be less than
    the minimum implied by the navigator type」。
  - `r_domino_ViewNavigator_getChild.html` + Count（getCount():int）;分類「documents are
    children of categories」、isCategory/isDocument/isTotal、getFirstDocument「skipping any
    category entries」、grand total 是 category entry。
- **矛盾檢查**：CacheSize 上限 128（修正 ~400）。recycle 在 SSJS 是否必需—官方範例有
  entry.recycle() 但未定論；文章依 XPages 慣例述「不用手動 recycle」。

## 獨立審查 (review)

本篇未跑獨立審查模型;官方逐條查證 + 自我驗證清單。review 欄留空。

## 查證 checklist

- [x] map 缺口（ViewNavigator 缺 SSJS 旗）、不與 java-viewnavigator 重疊
- [x] 官方逐字（web-fetch agent 10 URL 全 200）
- [x] get/goto 差異、IsAutoUpdate 關 cache+失效、CacheSize 128/IIOP、MaxLevel 30、分類走法 查準
- [x] 矛盾檢查:CacheSize 上限修正
- [ ] coversClass: ViewNavigator + apiLang ssjs（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 3 URL 各 33%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`XPages 的 ViewNavigator:走視圖` — 目錄。
- [選定] 招牌坑：`XPages 導覽分類視圖:先關掉父 view 的 IsAutoUpdate,不然 navigator 會壞`
  — 點出最會當掉的 IsAutoUpdate 坑，好搜、不過度承諾。
  en 鏡像：`Navigating Categorized Views in XPages: Turn Off the Parent View's IsAutoUpdate, or the Navigator Breaks`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 研究官方 SSJS reference / 寫雙語草稿 / 進 _pending
