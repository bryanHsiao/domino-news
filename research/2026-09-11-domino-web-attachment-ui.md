---
slug: domino-web-attachment-ui
title: "Classic Domino Web Attachment UI Tricks: $V2AttachmentOptions, custom list + delete"
lang: [zh-TW, en]
pubDate: 2026-09-11
status: staged
tags: [Domino Designer, Formula, Tutorial]
requester: 使用者 (bryan，做了陽春 web 附件儲存功能、想寫「美化傳統 web 附件 UI」的眉角；印象有個 $ 開頭 attachmentV2 欄位 → 求證)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) ISSUES → 1 必修（兩句藏附件 quote 掛錯頁）已改為改寫 → 其餘 verified（含 formula 可跑、正確排除）"
created: 2026-09-07
updated: 2026-09-07
---

# 研究軌跡 — domino-web-attachment-ui

附件系列第 4 篇。傳統（非 XPages）Domino web 附件 UI 的客製/美化眉角。承 [[domino-attachments-three-ways]] /
[[domino-attachments-bulk]] / [[notes-embedded-object]]。

## 使用者印象求證
使用者記得「一個 $ 開頭、attachmentV2 之類的欄位」→ 研究確認是 **`$V2AttachmentOptions`**，並**修正值**：
只有 `"0"`(藏)/`"1"`(顯示)，**沒有「2」**（使用者/我原本的猜測）。

## 研究（研究 subagent + 我 HEAD 驗）
**authority 分級（重要）**：本題多為社群長年知識、少現行官方文件。文章明白標「官方 vs 社群」。
- **`$V2AttachmentOptions`（社群，HCL 論壇）**：`developer.ds.hcl-software.com/t/v2attachmentoptions/63864`。
  值只有 0/1；逐字「If this field has a value of "0" (a text zero), then all V2 Style file attachments will
  be hidden from Web clients.」「Notes clients will still be able to see the attachments.」
  頭號雷「text value of "0"、非數字」；caveat「非安全：the web user could still download… if they knew the
  filenames」。type=Text、建議 Computed for Display；`@If(@IsDocBeingEdited;"1";"0")`。
- **`%%File`／`%%Detach`（社群，notesweb2）**：上傳 input name 以 `%%File` 開頭；刪除靠
  `<input name="%%Detach" value="檔名">`，submit 時 web 引擎自動刪、不需 agent。
- **下載 URL（官方）**：`H_ABOUT_URL_COMMANDS...OLE_OBJECTS.html`——`…/$File/name?OpenElement`。
- **美化手法**：`$V2AttachmentOptions="0"` 藏 → passthru HTML + `@AttachmentNames` 自畫下載清單
  （`@URLEncode("Domino"; name)` 處理空白）→ 自訂刪除（自吐 `%%Detach`，或 WebQuerySave + `Remove`）→
  動作列/儲存鈕自放 passthru HTML（通用手法、無單一權威）。

## 明確排除（研究標記為錯/無法證實，未寫進文章）
- 值「2」不存在（只 0/1）。
- `$KeepPrivate` 與附件無關（是防複製/轉寄）——不當附件控制寫。
- `RestrictAttachDelete` 不是 Domino 欄位（是 Odoo）——不用。
- CodeStore 具體程式（憑證過期抓不到）——不引具體 code。

## 附圖
使用者提供「陽春儲存表單（儲存 + 檔案上傳 + 標記要刪除的附件 + 3 附件）」截圖當 before——**ship 前需與使用者確認該
檔位置**（Downloads 未見對應新檔；17-52-11.png 實為 9/9 多選對話框圖，非本篇 before）。文字已寫好、圖待補。

## 獨立審查 (review)
指示：$V2AttachmentOptions 值/逐字/text-非數字/非安全、%%File/%%Detach 機制與 community 標示、下載 URL 官方、
**formula 程式碼可跑**（@AttachmentNames list 逐元素相接、@URLEncode 簽名、@WebDbName、@Implode）、
正確排除（無「2」/$KeepPrivate/RestrictAttachDelete）、authority 標示誠實。
**VERDICT：ISSUES（1 必修：引用掛錯頁）→ 修後 PASS。**
- **必修**：把「…hidden from Web clients」「Notes clients will still be able to see…」兩句標成「HCL 論壇 63864 逐字」，
  但那頁其實沒有這兩句（是更早 Notes.net/CodeStore 社群 lore）。→ **已改為改寫**（去掉「逐字」與引號），
  只保留確實在論壇頁上的唯一逐字「the web user could still download the file attachments if they knew the
  filenames」。「text value of 0」那句也去引號改敘述。
- **其餘全 verified**：只有 0/1 無「2」、text-非數字雷、%%File/%%Detach 機制（notesweb2、community 標示正確）、
  下載 URL 官方；**formula 全可跑**（@AttachmentNames list 逐元素相接成立、@URLEncode 2-arg 正確、@WebDbName 真、
  @Implode、`0/UNID` 慣用且已 hedge）；正確排除（無「2」/$KeepPrivate/RestrictAttachDelete）；authority 標示誠實。

## 標題候選
走標題優化 loop（ship 前跑）。暫用工作標題。

## 查證 checklist
- [x] 研究鏈：研究 subagent + HEAD 驗 4 URL 皆 200
- [x] authority 分級（官方 URL 命令 vs 社群 $V2/%%Detach，文章明白標）
- [x] 修正使用者印象（值只 0/1、非 2）
- [x] 正確排除（無 2 / 非 $KeepPrivate / 非 RestrictAttachDelete）
- [x] inline-link diversity 通過（3 相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（field-report、社群 lore 誠實標）
- [x] 未重寫系列前篇 / [[notes-embedded-object]]，交叉連結
- [x] before 截圖（使用者提供 `2026-09-07_17-56-28.png` → `domino-web-attachment-crude-default.png`，插進 hook）
- [x] 標題優化 loop（使用者選搜尋導向）
- [x] 獨立 fact-check（subagent）→ ISSUES（引用掛錯頁）→ 改寫修正 → PASS

## 異動日誌
- 2026-09-07 研究 subagent（傳統 web 附件 UI）、確認 $V2AttachmentOptions（修正值為 0/1）、雙語草稿、
  diversity、sidecar（Opus 4.8）
- 2026-09-07 派獨立 fact-check subagent（執行中）（Opus 4.8）
