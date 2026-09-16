---
slug: domino-unread-marks
title: "未讀標記（unread marks）每人一份 + 預設不複寫"
lang: [zh-TW, en]
pubDate: 2026-09-21
status: staged（_pending）
tags: [Domino Designer, LotusScript]
requester: 使用者 (bryan，9/17–9/22 六篇批次；候選 5；developer 坑)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent) → PASS（每人一份/不複寫/MarkRead 逐字皆對、code 正確）；trap 3 屬性名稱精確化為「Don't maintain unread marks」（Advanced 頁）。
created: 2026-09-16
updated: 2026-09-16
---

# 研究軌跡 — domino-unread-marks

9/21（第 5 篇）。coverage：無專篇（MarkRead 只在 notes-view-navigator/notes-document 順帶提到）。developer 坑。TYPE 留白。

## 研究鏈（WebFetch 第一手）

- **Identifying unread documents**（[14.5.0 doc](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html)）逐字：「A set of unread marks are maintained for each user, so even if one person has read a particular document, the asterisk still appears for other users who haven't read it yet.」→ 每人一份。
- **Replicating unread marks**（[11.0.0 doc](https://help.hcl-software.com/domino/11.0.0/admin/admn_replicatingunreadmarks_c.html)）逐字：「Unread marks can be replicated for selected databases, most notably mail databases, by using the advanced database properties…」＋「replicated along with the database according to your established replication schedule」；非 mail 高活動庫不建議、開前先同步 → 預設不複寫、不同 replica 未讀不一。
- **MarkRead/MarkUnread**（[MarkRead doc](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_MARKREAD_DOCUMENT.html)、[MarkUnread doc](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MARKUNREAD_DOCUMENT.html)）：可帶 username 替他人標、省略＝當前身分。`db.UnreadDocuments`＝當前使用者未讀集合（通識）。
- 坑三「Don't maintain unread marks」DB 屬性為通識，保守陳述。

## 查證 checklist

- [x] 每人一份、預設不複寫（只建議 mail）皆官方逐字
- [x] MarkRead 省略名字＝當前身分（agent 替錯人）＝官方語意 + 通識
- [x] inline-link diversity：4 相異官方 URL
- [ ] 雙語 build 驗證
- [ ] 批次 fact-check（#4–6：ECL / unread / notes.ini）

## 異動日誌

- 2026-09-16 WebFetch 驗每人一份/不複寫官方逐字、雙語 + LS 範例、sidecar；stage _pending 排 9/21（Opus 4.8）
