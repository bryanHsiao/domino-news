---
slug: notes-view-autoupdate
title: "NotesView AutoUpdate=False 效能雷（迴圈裡改文件）"
lang: [zh-TW, en]
pubDate: 2026-09-15
status: staged（_pending，cron 9/15 promote）
tags: [Domino Designer, LotusScript, Performance]
requester: 使用者 (bryan，補 9/15 空檔；coverage 確認無 AutoUpdate 效能專篇，僅 notes-view-navigator 提過)
author_model: claude-opus-4-8
review_model: (官方 doc 逐字錨定；WebFetch 第一手)
created: 2026-09-14
updated: 2026-09-14
---

# 研究軌跡 — notes-view-autoupdate

9/15 補空檔。coverage：`AutoUpdate` 在 `notes-view-navigator` 提過 6 次、但**無專門講「迴圈改文件效能坑」的篇**→ 角度收在
效能/pitfall、與 navigator 那篇區隔並交叉連。站上另發現**無任何 perf 專篇**，本篇掛 TOPIC 標籤 `Performance`。

## 研究鏈（NotebookLM 不可用 → WebFetch 第一手驗官方）

- **AutoUpdate property**（[14.0 doc](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html)）逐字：
  - 「True (default) indicates that the view is automatically refreshed.」
  - 「It is best to avoid automatically updating the view by explicitly setting this property to False especially if the view is a
    base for navigators or entry collections. Automatic updates degrade performance and may invalidate entries in child objects.」
  - 「This property only addresses refreshes by the currently running code. Other code, such as running the Updall task... will
    update the view index... regardless of the value of this property.」
  - 「If this property is False, you must call Refresh to navigate to an update.」
  - 「Entry not found in index」錯誤在 navigator/entry collection base 上易發（官方點名）。
- **Refresh method**（[12.0.2 doc](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_REFRESH_METHOD_VIEW.html)）：關掉自動刷新後手動刷新。
- 「先抓 next handle 再改 current」為 LS 走訪的實務通則（mutate-while-navigate 保護），文中標為實務寫法。

## 查證 checklist

- [x] 官方 URL 非 404、核心 claim 逐字（degrade performance / Entry not found / currently running code / must call Refresh）
- [x] 與 notes-view-navigator 區隔（效能主軸）並交叉連
- [x] TYPE 留白（pitfall/reference，非 Tutorial）；掛 TOPIC `Performance`
- [x] inline-link diversity：3 相異官方 URL（AutoUpdate 多次、Refresh、NotesView class）+ 內部連結，<40%
- [ ] 雙語 build（暫拷 posts/ 驗）→ 移回
- [ ] humanizer 自審
- [ ] 獨立 fact-check（與 9/14 notes-document-ids 併一支跑）
- [ ] stage _pending + 9/15 sanity check（cron skip 風險）

## 異動日誌

- 2026-09-14 WebFetch 驗官方 AutoUpdate/Refresh、雙語 + 「先抓下一個再改」pattern、sidecar；stage _pending 排 9/15（Opus 4.8）
