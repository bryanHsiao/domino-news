---
slug: domino-deletion-stubs
title: "Deletion stubs / purge interval / 刪掉又回來"
lang: [zh-TW, en]
pubDate: 2026-09-19
status: staged（_pending）
tags: [Domino Server, Admin]
requester: 使用者 (bryan，9/17–9/22 六篇批次；候選 3；replication 經典坑)
author_model: claude-opus-4-8
review_model: (待批次 fact-check)
created: 2026-09-16
updated: 2026-09-16
---

# 研究軌跡 — domino-deletion-stubs

9/19（第 3 篇）。coverage：無專篇（deletion stub/purge interval 只在 notes-note-collection/notes-document 順帶提到）。有官方專頁「Deleted documents reappear」。

## 研究鏈（WebFetch 第一手）

- **Deleted documents reappear**（[dom_designer 12.0.2 doc](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html)）逐字：
  - stub：「When a document is deleted, it leaves behind a deletion stub. When the database replicates, Notes uses the deletion stub to identify and delete the same document in the replica.」
  - 原因一：「If Notes purges the deletion stubs before they replicate, deleted documents can reappear after the next replication.」
  - 原因二（edit>delete）：「...the edited document takes precedence because it underwent the greatest number of changes, even if the deletion was the most recent change.」／「...the edit overrides the deletion because both documents were updated once and the edit occurred after the deletion.」
- **Limiting the contents of a replica**（[12.0.0 doc](https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html)）逐字：stub 定義、預設 90 天、1/3 週期（30 天）檢查、清 90 天以上；「be sure to replicate more frequently than the purge interval; otherwise, deleted documents can be replicated back to the replica.」
- Deleting inactive documents 頁（離線 replica 帶回舊文件的關聯）。
- 交叉連 [[notes-replication]]。

## 查證 checklist

- [x] 兩個復活原因皆官方逐字（purge-before-replicate、edit-over-delete）
- [x] purge interval 預設 90 / 1/3 檢查 / 90 天以上清 逐字
- [x] 避法「複寫要比 purge interval 頻繁」官方逐字
- [x] inline-link diversity：3 相異官方 URL + 內部連結
- [ ] 雙語 build 驗證
- [ ] 批次 fact-check（#1–3）

## 異動日誌

- 2026-09-16 WebFetch 驗 reappear/purge interval 官方逐字、雙語、sidecar；stage _pending 排 9/19（Opus 4.8）
