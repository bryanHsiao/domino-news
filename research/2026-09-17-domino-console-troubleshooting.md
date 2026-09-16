---
slug: domino-console-troubleshooting
title: "Domino 伺服器 console 排錯指令"
lang: [zh-TW, en]
pubDate: 2026-09-17
status: staged（_pending）
tags: [Domino Server, Admin]
requester: 使用者 (bryan，9/17–9/22 六篇批次；候選 1，admin/維運方向)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent，與 9/18/9/19 併) → ISSUES（1）→ 修：`show tasks only <task>` 是我杜撰的語法（Show Tasks 官方頁不吃參數），已移除、改成「在 show tasks 輸出裡掃到那個 task」。其餘全 verbatim PASS。
created: 2026-09-16
updated: 2026-09-16
---

# 研究軌跡 — domino-console-troubleshooting

9/17（六篇 admin/troubleshooting 批的第 1 篇）。coverage：console 指令 slug 全無（grep `console|show tasks|dbcache` 皆無專篇）→ 確認新。
按「遇到什麼問題→用哪個指令」組織，非逐指令 reference。TYPE 留白（工具箱/reference，非 Tutorial）。

## 研究鏈（WebFetch 第一手；NotebookLM 本 session 卡登入）

- **Show Tasks**（[12.0.0 doc](https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html)）逐字：「the server name, the Domino program directory path, and the status of the active server tasks」、「Idle tasks are indicated」。
- **Tell**（[10.0.1 doc](https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html)）：「issue a command to a server program or task」；`tell task quit` 通用、其餘 task 專屬。
- **Dbcache Show/Flush/Disable**（[10.0.1 doc](https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html)）逐字：show=「the names of the databases currently in the cache」；flush=關掉釋放；disable=需獨佔時暫時關快取。
- **Using a console**（[11.0.1 doc](https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html)）：連法。
- 交叉連 [[domino-xspupload-upload-fail]]（那篇「每晚上下 HTTP」＝`tell http restart`）。

## 查證 checklist

- [x] 官方 URL 非 404、核心逐字（show tasks / dbcache show-flush-disable / tell 定義）
- [x] show server / show stat / show diskspace / show users 為通識常用指令，未逐字引但描述保守
- [x] 交叉連 xspupload；TYPE 留白；tags Domino Server + Admin
- [x] inline-link diversity：4 相異官方 URL + 內部連結
- [x] 修掉一個手誤（混入俄文 "можно"→可以）
- [ ] 雙語 build（暫拷 posts/ 驗）
- [ ] 批次 fact-check（與 9/18、9/19 併跑）

## 異動日誌

- 2026-09-16 WebFetch 驗 show tasks/tell/dbcache、雙語按場景組織、sidecar；stage _pending 排 9/17（Opus 4.8）
