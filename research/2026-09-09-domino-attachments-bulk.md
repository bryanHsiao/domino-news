---
slug: domino-attachments-bulk
title: "Bulk Attachments in Domino: multi-file upload + batch delete"
lang: [zh-TW, en]
pubDate: 2026-09-09
status: staged
tags: [Domino Designer, LotusScript, Tutorial]
requester: 使用者 (bryan，附件系列延伸：多檔批次上傳 + 批次刪除「一起寫」；要求附圖)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) ISSUES → 2 個 must-fix（引用掛錯頁 + 做法二迴圈自相矛盾）已修 → 其餘 verified"
created: 2026-09-07
updated: 2026-09-07
---

# 研究軌跡 — domino-attachments-bulk

附件系列第二篇（2 篇規劃之一；REST 那篇另計）。承 [[domino-attachments-three-ways]]（9/08，單檔三情境）
與 [[notes-embedded-object]]（後端）。使用者分組訊號：多檔上傳 + 批次刪除「一起寫」。

## 研究（3 個平行研究 subagent + 使用者指路 + 矛盾解決）

### 關鍵矛盾與解決（重要）
- 初查（研究 subagent + 我）在 **designer/xpageuser 路徑**查不到 14.5.1 官方多檔功能，一度誤判「官方沒有」。
- WebSearch 摘要又聲稱「12.0.2 已實作多檔」——我讀 **12.0.2 xp:fileUpload doc 頁**確認屬性清單無 `multiple`、
  「New in V12.0.2」只講上傳/儲存/刪除控制，非多選 → 該摘要為誤讀（以權威 doc 頁為準）。
- **使用者指路** admin 路徑的 What's new：`wn_xpages_support_for_multiple_file_uploads.html`——逐字
  「The XPages file upload UI now supports multiple selections by default.」→ **14.5.1 確實官方支援多選**
  （在 admin What's new，不在 designer 控制項路徑，故先前漏查）。已據此改寫、並公開更正先前「查不到」。

### 傳統 web「一個字」
- nevermind.dk（Jesper Kiaer）：HTML5 `multiple` 屬性；逐字「You just need to add 'multiple' to the upload
  control」；Designer 小雷「從選單插入才正確」。
- ⚠️ **未獲官方背書**：多選檔是否各存獨立 `$FILE`，只有作者實測宣稱、無 HCL 文件 → 文章明白 hedge、建議實測。

### XPages 社群前世
- OpenNTF：Mark Leusink「XPages Multiple File Uploader」（Flash/SWFUpload）、Julian Buss HTML5 版（專案頁已驗證存在）。

### 批次刪除（研究 subagent）
- `RemoveItem` 官方逐字「If more than one item has the specified name, all items with this name are deleted.」
  → `doc.RemoveItem("$FILE")` 一次清空所有附件。
- 迴圈版：官方 EmbeddedObjects 範例（`EMBED_ATTACHMENT` + `Remove` + 逐字「you must call the Save method」）。
- ⚠️ **社群共識非官方**：邊 ForAll 迭代邊 Remove 會漏刪（反向或先收集）；刪 `$FILE` 後 rich text 可能殘留 icon。
- Formula 無乾淨批次刪 @Command（查無、措辭保守）。

## 附圖
自製 SVG 概念圖（無版權疑慮、官方截圖不轉載）：`public/post-images/domino-multi-file-attachments.svg`（zh）
與 `-en.svg`（en）——多選檔 → 同一 Body 富文本欄位的多個 `$FILE` → `RemoveItem("$FILE")` 一次清空。
瀏覽器實測渲染乾淨。

## 獨立審查 (review)
**審查模型**：獨立 fact-check subagent。重點：14.5.1 逐字與「預設行為非新屬性」框定、RemoveItem 逐字與清空、
EmbeddedObjects 迴圈可跑、「邊迭代邊刪」的社群 vs 官方層級、`multiple` 的誠實 hedge、OpenNTF Leusink 存在。
**VERDICT：ISSUES（2 個 must-fix）→ 修後 PASS。**
- **MF1（引用掛錯頁）**：「After calling the Remove method, you must call the Save method」不在 EmbeddedObjects
  範例頁、在 **Remove method 頁**（H_REMOVE_METHOD_OBJECT.html）。→ 已改引用該頁、並引全句
  「…in NotesDocument to save the change that you made」。sources 也換成 Remove method 頁。
- **MF2（做法二自相矛盾）**：原「做法二」用 `ForAll EmbeddedObjects` 邊迭代邊 `Remove`，正是文章自己警告會漏刪的
  寫法。→ 已改成**挑著刪**（`GetAttachment(name)` + `Remove`，單一附件、無漏刪問題），「刪多個」的 collect-first
  建議移到 prose；清空全部一律導向做法一 `RemoveItem`。
- 其餘 headline 全 verified：14.5.1 逐字 + 「預設行為非新屬性」框定（page 另有「Any selected file or files will
  be uploaded」）、RemoveItem 逐字與清空、「邊迭代邊刪＝社群非官方」層級正確、`multiple`/Kiaer/Designer 小雷、
  OpenNTF Leusink/Buss 存在，皆正確；「files attach to bound rich text field」為已標示的合理推論。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：
- [汰除] 14.5.1「終於內建」hook：`XPages 多檔上傳終於內建（14.5.1）——順手講傳統 web 的一個字與一行清空附件`
  — 情緒點強，但工具/情境名少了。
- [汰除] 問題先行：`一次上傳很多檔、一次清光附件：Domino 的批量附件實作` — 從「批量」需求切，但比較平。
- [選定] 搜尋導向：`Domino 多檔上傳與批次刪除：傳統 web、XPages 14.5.1、一行清空附件`
  — 使用者拍板。三個重點名齊、好搜、與系列一致。
  en 鏡像：`Multi-File Upload and Batch Delete in Domino: Classic Web, XPages 14.5.1, and Clearing Attachments in One Line`。

## 查證 checklist
- [x] 研究鏈：3 平行研究 subagent + 使用者指路 admin What's new + 我讀 12.0.2 doc 解矛盾
- [x] 官方 URL 驗證非 404（14.5.1 wn / RemoveItem / EmbeddedObjects 範例）
- [x] 矛盾解決（14.5.1 官方多檔＝admin 路徑 What's new；「12.0.2 已實作」為 WebSearch 誤讀已排除）
- [x] 兩個 flag 遵守（`multiple` 多檔存 `$FILE` 未背書→hedge；邊迭代邊刪＝社群非官方）
- [x] inline-link diversity 通過（5 相異 URL，最高 ~28%）
- [x] 雙語 build 通過；SVG 附圖渲染確認
- [x] humanizer-zh-tw 自審（誠實 hedge、無罐頭結論）
- [x] 未重寫 [[domino-attachments-three-ways]] / [[notes-embedded-object]]，交叉連結
- [x] 標題優化 loop（使用者選搜尋導向）
- [x] 獨立 fact-check（subagent）→ ISSUES（2 must-fix：引用頁 + 做法二迴圈）→ 修後 PASS

## 異動日誌
- 2026-09-07 3 平行研究 subagent（傳統web+批次刪 / XPages官方+OpenNTF / DRAPI+DAS）、解 14.5.1 矛盾
  （使用者指路 admin What's new）、雙語草稿、自製 SVG 附圖、diversity、sidecar（Opus 4.8）
- 2026-09-07 獨立 fact-check subagent → ISSUES（引用掛錯頁 + 做法二迴圈自相矛盾）→ 改引 Remove method 頁、
  做法二改 GetAttachment 挑著刪 → 修後 PASS（Opus 4.8）
- 2026-09-07/08 f3b26d2：加使用者 3 張實測截圖（multiple 在 HTML 屬性「其他」欄、多選對話框、「3 個檔案」），
  升級 hedge（機制與多選已實測，僅 per-file $FILE 儲存待確認）（Opus 4.8）
- 2026-09-09 使用者提供**欄位檢視器截圖**（3 檔→3 個獨立 `$FILE`）→ **per-file $FILE 儲存從「待確認/自己驗」升級成
  「實測確認」**，加該截圖 `domino-multiple-three-files-inspector.png`（TL;DR、body、小結 三處都改）。
- 2026-09-10 **加「刪除時機／存檔邊界」caveat（使用者洞見）**：使用者指出後端 `EmbeddedObjects` 迴圈 `Remove`+`Save` 是「使用者還沒確定存檔、底層就已被改」——會踩取消後附件已消失（無 undo）、與使用者存檔撞衝突、不可回復。補一段「這段要在哪裡跑」：① 無人開檔的批次／排程場景才是後端迴圈歸宿（先 `doc.Lock`、`ExtractFile` 備份再 `Remove`）；② 使用者互動編輯要走「跟著存檔才生效」的路（傳統 web 的 `%%Detach` 勾選框、交叉連 [[domino-web-attachment-ui]]；XPages 走官方附件控制項經資料來源存檔生命週期，勿背後 `doc.Save`）。並點名「XPages 勾選框多選、一次刪選中那幾個」官方沒有現成控制項＝真空地帶，導向**另開一篇專講（研究中）**。雙語同步、build 通過。（Opus 4.8）
- 2026-09-09 **重寫刪除段（使用者兩點回饋）**：(1) 拿掉「之前這裡錯套…特此更正」的自我指涉——讀者沒看過舊版、不知我方修訂過程，文章只該直接講對的事實，改成純讀者向的中性澄清（「邊迭代邊刪會漏」只對活的集合、EmbeddedObjects 快照不受影響）。(2) 重排重點：使用者指出「一次清全部」情境少、**真正常見是「挑著刪」**，且依條件刪參考最少——遂把「依條件刪好幾個」升為主戲，補一段可照跑範例（迭代 `EmbeddedObjects`、`.Type=EMBED_ATTACHMENT` 過濾、依 `.Source` 條件 `Remove`、`removed>0` 才 `Save`，對齊官方 EmbeddedObjects 範例），一行版 `RemoveItem` 退為少見的全清；TL;DR／小結／雙語同步。build 通過。（Opus 4.8）
- 2026-09-09 **重大更正（使用者質疑來源）**：原「邊迭代 EmbeddedObjects 邊 Remove 會漏刪＝社群共識」**無可靠來源、
  且與 HCL 官方範例矛盾**——[官方 EmbeddedObjects 範例](H_EXAMPLES_EMBEDDEDOBJECTS_PROPERTY_RTITEM.html)本身就是
  「ForAll 迭代、迴圈內逐一 Remove 並 Save」。`EmbeddedObjects` 是**陣列快照**、迭代中移除安全。→ 刪除段改為：迭代
  EmbeddedObjects 逐一 Remove 是官方寫法、安全；並明白更正「那個『漏刪』通則只對活的集合（NotesDocumentCollection/
  NotesView）才要小心、不適用快照陣列」，撤下「社群共識」的錯誤歸因。這是本 session 第 3 次「把 folklore 當共識」被使用者
  抓到（前有 DAS 唯讀、$V2 值），教訓見 [[feedback_no_vague_community_consensus]]。（9/9 已上線 → 直接改 posts、重新 deploy）
