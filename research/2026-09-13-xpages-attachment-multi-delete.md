---
slug: xpages-attachment-multi-delete
title: "XPages 附件多選批次刪除（官方沒給、自己刻）"
lang: [zh-TW, en]
pubDate: 2026-09-13
status: staged
tags: [Domino Designer, XPages, Tutorial]
requester: 使用者 (bryan，附件系列收尾；SSJS/XPages 多選批次刪；含使用者實環境 live demo + 規劃開源 repo)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent) → PASS（5 源全驗、無 404、commit-on-save 誠實標為實測）；2 個 attribution 微調已修
created: 2026-09-11
updated: 2026-09-11
---

# 研究軌跡 — xpages-attachment-multi-delete

附件系列第 5～6 篇的收尾（XPages/SSJS 角度）。承 [[domino-attachments-bulk]]（9/09，LotusScript 後端批次/依條件刪）與
[[domino-web-attachment-ui]]（9/11，傳統 web `%%Detach` 勾選刪）。使用者洞見驅動：多選批次刪是官方真空地帶。
見 [[project_xpages_attachment_multidelete]]。

## 核心論點（依實測收斂）

- 原本想強調「存檔邊界難、大家做錯」；**使用者實測後修正**：原生 `xp:fileDownload allowDelete` 刪除是 **commit-on-save**
  （點刪除、不存檔、重開，檔還在）→ 原生單筆刪除本來就守規矩。故缺口**只在「多選批次 UX」，不是正確性**。
- 解法延續 save-bounded：`NotesXspDocument.removeAttachment` 官方明寫「must save … to take effect」＝同樣存檔才生效；
  別掉到後端 `getDocument().remove()`（assono：混用 datasource+後端寫入 → 存檔衝突）。

## 研究鏈（NotebookLM 失敗 → WebFetch fallback）

- **NotebookLM（SSJS/XPages notebook `0c88f101-...`）此次不可用**：ask_question.py 自動化被 `cdk-overlay-container` overlay 擋住送出鈕
  （非 chat 污染型 [[reference_notebooklm_repair]]），且登入 state 40 天舊、疑似要重登；重登需互動式手動 Google 登入，未自作主張動。
  → 依 CLAUDE.md fallback 用 WebFetch 直驗官方頁。
- **WebFetch 第一手驗證（皆非 404）**：
  - `removeAttachment`（11.0.1 reference）：逐字「Removes an attachment in the document.」/ 簽章
    `removeAttachment(fieldName:string, attachmentName:string) : boolean` /「You must save the document for the change to take
    effect in the data store.」
  - `getAttachmentList`（12.0.0 reference）：`getAttachmentList(fieldName) : java.util.List`，元素 `NotesEmbeddedObject`，
    官方附 iterator + `.getName()` 範例。
- **研究 subagent（9/10，WebSearch/WebFetch）補強**（見對話全文）：
  - `xp:fileDownload allowDelete` 一句話定義、逐檔刪、filename-only；APAR LO68855（同名檔刪一個會全刪）、LO58738/LO81814
    （刪除走 submit 生命週期、錯誤發生在存檔時）→ 佐證 commit-on-save。
  - 社群/OpenNTF **基本上沒有現成多選附件刪控制項**（只有多檔上傳、唯讀清單：OpenNTF Multi Attachment CC、werelostinthecode
    nested repeats、Wissel attachment URLs）。
  - assono 存檔衝突（混用 DominoDocument + 後端 Document）。

## 使用者實環境驗證（重要，實證驅動）

- **ldat05 `FFH/doc.nsf` XPage `mdTest.xsp`（Domino 12.0.2 FP8）**：我給最小 XPage → 使用者貼進測試庫，一路共同 debug/美化到跑通：
  - 修 `xp:dominoDocument` 無 documentId 每次整頁載入開新空白 doc → 存檔後 `redirectToPage` 帶 documentId 停在同一份。
  - `fileUpload` 上傳未清空 → 重複 `-2`；`onComplete` client JS 清 input value 修好（文章有寫這個雷）。
  - UX：checkbox 藏起來改「刪除/復原」標記（`viewScope` Map）、partial refresh；一顆「儲存變更」removeAttachment loop + `doc.save()` 一次落地。
  - 上傳鈕自訂（藏原生 input、自訂 teal 鈕觸發、SVG 迴紋針避免 emoji 亂碼——emoji 在 astral plane，Designer 存檔會變 `�`）。
  - **實測結論**：多選勾選刪成功、中文檔名可刪；文件屬性欄位檢視器可見 `Body` 富文本一排 `$FILE`（後端佐證，同 9/09）。
- **一銀 FCB `EForm.nsf` XF079007M.xsp（生產）觀察**：做得很完整的表單（自訂上傳鈕 + `.ibmmodres/OpenAttachment` 下載表格、
  欄位 `Attachment`）**仍無多選批次刪** → 佐證缺口真實。（只觀察、未動正式表單。）

## 附圖

`public/post-images/xpages-attachment-multi-delete-demo.png`：使用者實環境截圖——自訂上傳鈕、附件清單三列（兩列標記劃掉+「復原」、
一列正常）、深綠「儲存變更」。雙語共用。emoji 全移除、無亂碼。

## 待辦 / 開源 repo（使用者規劃）

- 使用者要把此 XPage 範例**另開 GitHub repo 開源、文章附下載連結**。→ 需準備 repo（README 設定步驟 + LICENSE Apache-2.0 建議 +
  cleaned `mdTest.xsp` + 表單需求說明），拿到 URL 後**回填雙語文章的下載連結**（retrofit）。

## 查證 checklist

- [x] 研究鏈：WebFetch 第一手驗官方 `removeAttachment`/`getAttachmentList`（NotebookLM 不可用，已註明 fallback）
- [x] 官方 URL 非 404（removeAttachment / getAttachmentList / allowDelete）
- [x] 核心 claim 有官方逐字（must save to take effect / java.util.List NotesEmbeddedObject）
- [x] 反直覺點（原生 commit-on-save）**使用者實測**、非臆測
- [x] 缺口（無原生/社群多選刪）有 subagent 搜尋佐證 + 生產表單觀察
- [x] 存檔衝突警告有社群出處（assono）；同名檔限制有 APAR（LO68855）
- [x] inline-link diversity：5 相異 URL、各 1 次（雙語各 ~20%，遠低於 40%）
- [ ] 雙語 build 驗證（_pending 不被本地 build 讀 → 暫拷 posts/ build 再移回）
- [x] humanizer-zh-tw 自審（實證語氣、無罐頭結論；保留有據的第一人稱實測）
- [x] 獨立 fact-check subagent → **PASS**（5 源全驗、無 404）；2 個微調已修：(1) `allowDelete` doc 只寫「Allows users to delete attached files or not」，不背書「一次刪一個」→ 改為「實際跑起來每列一個、一次刪一個」（觀察，非 doc 主張）；(2) LO68855 是 8.5.3 回報、後續可能已修 → 同名檔限制改成主打 `removeAttachment` name-based 先天限制（與版本無關），APAR 只當歷史前例並註明未在 12.0.2 再測。
- [ ] 開源 repo（`domino-xpages-multi-attachment-delete`, Apache-2.0）建好 → 回填雙語下載連結

## 異動日誌

- 2026-09-11 研究鏈（NotebookLM 失敗→WebFetch fallback 驗官方兩 API）、與使用者在其實環境共同做出 live demo（12.0.2）、
  雙語草稿 + 自製 demo 截圖、sidecar（Opus 4.8）。**待**：build 驗證、humanizer、獨立 fact-check、開源 repo 回填連結。
