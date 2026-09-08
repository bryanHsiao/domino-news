---
slug: domino-xspupload-upload-fail
title: "XPages File Upload Failing: the xspupload Temp Folder Wiped by Windows cleanmgr"
lang: [zh-TW, en]
pubDate: 2026-09-12
status: staged
tags: [Domino Designer, Domino Server]
requester: 使用者 (bryan，提供 3 個 KB + SO + dreamjtech blog；R11 實務用「每晚上下 http」band-aid，要整理成一篇)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；零必修（採納提醒拿掉 Tutorial tag）"
created: 2026-09-08
updated: 2026-09-08
---

# 研究軌跡 — domino-xspupload-upload-fail

XPages 檔案上傳靜默失敗的 troubleshooting 文，源自使用者提供的來源 + R11 實務經驗（每晚重啟 http）。
接續附件系列（承 [[domino-attachments-three-ways]] 的「temp 目錄」前提）。

## 研究來源（KB 是 JS 頁 → Claude Browser 讀全文）
- **KB0106430（官方 defect article）**：`?sysparm_article=KB0106430`。XPages file upload 用 OS Temp 下的
  `xspupload` 夾（`notesXXXXXX\xspupload`）；被刪 → 上傳失敗，console 逐字
  `com.ibm.xsp.http.fileupload.FileUploadBase$IOFileUploadException: … \xspupload\upload_XXX.tmp
  (The system cannot find the path specified)`。應自動重建但（<14.0）不會。**Resolved 14.0，SPR ASHECU5DHW**。適用 9.0.x+。
- **KB0078234（官方 troubleshooting）**：Windows `cleanmgr.exe` 在 Domino 執行中清 temp、連 xspupload 一起 →
  所有 app 上傳失敗。逐字 cause「Windows cleanmgr.exe task deleted all the temp files…」；三個 workaround
  逐字（restart HTTP／`notes_tempdir` 指新夾／停用 cleanmgr 排程）。適用 9.0.x/10.0.x/11.0.x+。
- **dreamjtech（社群）**：`dreamjtech.com/5816/`——onStart 檢查 `com.ibm.xsp.upload.tmp.dir`（預設 'xspupload'）、
  不存在就 `mkdirs`+set 權限。⚠️ **已 hedge**：真實路徑在 `NOTES_TEMPDIR`/%TEMP% 下，`new File('xspupload')`
  相對路徑會解到 JVM 工作目錄非 temp 夾（reviewer 佐證），套用前要確認解析路徑。
- **SO（社群症狀）**：`.../66161300/xpages-file-upload-control-does-nothing-in-11-0-1`——Claude Code 擋 SO 抓不到，
  **只用其標題/症狀連結、未引任何 answer 內容**（誠實）。

## 矛盾檢查
兩 KB 同一個 IOFileUploadException 錯；KB0106430 講「夾不見」、KB0078234 講「誰刪的（cleanmgr）」，互補一致。
`notes_tempdir` 為真 notes.ini（reviewer 佐證）。

## 獨立審查 (review)
**VERDICT：PASS（零必修）。** 兩 KB 逐字全對、版本/SPR/適用版一致；dreamjtech snippet 妥善 hedge、未過度背書；
SO 無杜撰；notes_tempdir 為真。**非阻擋提醒採納**：`Tutorial` tag → 本篇為 troubleshooting/診斷+選項、非動手 arc
→ 依 TYPE-tag 精準規則**拿掉 Tutorial、TYPE 留白**，tags 定 `Domino Designer`／`Domino Server`。

## 標題候選（AskUserQuestion，使用者拍板）
- [汰除] 問題先行 hook：`XPages 上傳按了沒反應？不是控制項壞了，是 xspupload 暫存夾被 cleanmgr 清掉`
- [汰除] 實務故事線：`從「每晚重啟 http」到根治：XPages 上傳失效的 xspupload 暫存夾問題`
- [選定] 搜尋導向：`XPages 檔案上傳失效：xspupload 暫存夾被 Windows cleanmgr 清掉的根源與解法（含 14.0 修復）`
  en：`XPages File Upload Failing: The xspupload Temp Folder Wiped by Windows cleanmgr — Root Cause and Fixes (Including the 14.0 Fix)`

## 查證 checklist
- [x] 研究鏈：Claude Browser 讀 3 KB 全文 + WebFetch dreamjtech；SO 擋（只用標題）
- [x] 4 外部 URL 驗證（KB JS 頁、dreamjtech、SO）
- [x] 矛盾檢查（兩 KB 互補一致；notes_tempdir 為真）
- [x] dreamjtech 社群 code 妥善 hedge（相對路徑陷阱已標）
- [x] SO 未杜撰（只引標題/症狀）
- [x] inline-link diversity 通過（4 相異 URL 各 2 次 = 25%；初稿 KB0078234 43% 已配平）
- [x] 雙語 build 通過
- [x] TYPE-tag 精準：拿掉 Tutorial
- [x] 未重寫系列前篇，交叉連結
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-09-08 Claude Browser 讀 3 KB、WebFetch dreamjtech、雙語草稿、配平 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-09-08 獨立 fact-check subagent → PASS；採納提醒拿掉 Tutorial tag（Opus 4.8）
