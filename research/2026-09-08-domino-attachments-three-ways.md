---
slug: domino-attachments-three-ways
title: "File Attachments in Domino Three Ways: Notes Client, Classic Web Form, and XPages"
lang: [zh-TW, en]
pubDate: 2026-09-08
status: staged
tags: [Domino Designer, LotusScript, Tutorial]
requester: 使用者 (bryan，「client 附件很容易、web notes form 也支援、XPages 也有方式，寫詳細文章」)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；零必修。四處逐字全 verbatim、EmbedObject 範例可跑、classic 控制項框定未過度、XSP 合法、relatedJava 正確。修一個 zh 錯字（決定使用者能不能刪附件）"
created: 2026-09-07
updated: 2026-09-07
---

# 研究軌跡 — domino-attachments-three-ways

跨情境附件上傳文：Notes client / 傳統 web form / XPages 三種前端，共同底層 = 富文本欄位上的
`NotesEmbeddedObject`。使用者要「詳細的文章」。

## 框架決策：不重寫既有後端文
站上已有 [[notes-embedded-object]]（7/07，EmbedObject/NotesEmbeddedObject/ExtractFile/GetAttachment/
移除、完整後端）與 [[notes-rich-text-item]]（4/30，富文本基礎）。→ 本文**不重寫後端**，聚焦三種
**前端上傳機制**的對照，後端一律交叉連結 7/07。這是避開重複、又補站上較缺的 web+XPages 上傳面的切法。

## 研究來源 (Research trail)

### NotebookLM
本 session 擷取穩定失敗（見前幾篇側車）→ 由研究 subagent 走 WebFetch 官方 Designer 文件（全部驗證非 404）。

### 研究 subagent（general-purpose）掃齊三支柱 + 逐字 + URL（皆 WebFetch 驗證非 404）
- **共同底層**：`NotesEmbeddedObject` 逐字「An embedded object, An object link, A file attachment.」；
  資料與富文本分開存；`$File` 名出現在 URL 命令 `.../$File/Filename?OpenElement`。
  ⚠️ **flag（已遵守）**：官方無「stored as a `$FILE` item」逐字；class 文件一律用 `NotesEmbeddedObject`，
  `$File` 只在 URL/REST 脈絡。→ 文章框成「富文本上的 NotesEmbeddedObject + `$File` URL 元素」，未把
  「$FILE item」當官方引用。
- **Pillar 1（client/LS）**：`EmbedObject(type%, class$, source$, [name$])`；`EMBED_ATTACHMENT`=1454
  （EMBED_OBJECT=1453/EMBED_OBJECTLINK=1452）；逐字「Attaches the file you specify to a rich text item.」；
  附檔時 class$ 傳 ""。（後端其餘連 7/07，不重寫。）URL: H_EMBEDOBJECT_METHOD.html。
- **Pillar 2（傳統 web）**：H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html——逐字「Choose Create - Embedded
  Element - File Upload Control.」；web 專用逐字「The file upload control is not supported in Notes」；
  需編輯模式；附到文件、伺服器需暫存目錄。
  ⚠️ **flag（已遵守）**：classic 控制項文件**未**說綁具名富文本欄位、也未說單/多檔 → 文章只寫「附到文件」，
  未過度宣稱 rich-text-field 綁定（那是 XPages 才有的）。
- **Pillar 3（XPages）**：`xp:fileUpload` 逐字「Uploads a file from the local file system.」、value
  「must be of type rich text」；`xp:fileDownload`「Downloads a file to the local file system.」、value 綁
  rich text、`rows`=最多顯示列數、`allowDelete`=可否刪。單檔（doc 用單數，未宣稱多檔）。
  URL: wpd_controls_cref_fileupload.html / _filedownload.html。

### 矛盾檢查
三情境一致收斂到富文本上的附件；後端 API 共用。未與 [[notes-embedded-object]] 重複（該篇講後端、本篇講前端）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
重點指示：EmbedObject 範例可否跑、NotesEmbeddedObject/$File 逐字、**傳統 File Upload Control 有無被過度宣稱
綁具名富文本欄位/單多檔**、xp:fileUpload/Download value=rich text/rows/allowDelete、XSP 片段是否合法、
$FILE 框定是否過度、relatedJava 名稱。

**VERDICT：PASS（零必修）。** 四處逐字引用全 verbatim（EmbedObject「Attaches the file you specify to a
rich text item.」、NotesEmbeddedObject 三項、classic「not supported in Notes」+「Create - Embedded Element -
File Upload Control」、xp:fileUpload/Download 定義與 value=rich text、`$File?OpenElement`）；`EMBED_ATTACHMENT`
=1454 正確、LotusScript 範例可跑；**classic 控制項「附到文件」框定正確、未過度宣稱綁具名富文本欄位**；
XSP 片段合法（id/value/rows/allowDelete 皆真屬性）；`$File` 只當 URL 元素、未宣稱「$FILE item」為官方引用；
relatedJava EmbeddedObject/RichTextItem 為正確 lotus.domino 名。
**非阻擋（已修）**：zh 一個贅字「決定使不使用者能刪附件」→「決定使用者能不能刪附件」。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] 概念 hook：`Domino 上傳附件的三種前端，最後都落在同一個富文本欄位` — 帶「共同儲存」洞察、有記憶點，
  但工具/情境名少了。
- [汰除] 問題先行：`client 拖進去就好，web 與 XPages 呢？Domino 三種情境的附件上傳` — 從「client 很容易」對比切入，
  但比較長。
- [選定] 搜尋導向：`Domino 附件的三種上傳法：Notes client、傳統 web form、XPages`
  — 使用者拍板。三情境名齊、好搜，跟近期幾篇一致風格。
  en 鏡像：`File Attachments in Domino Three Ways: Notes Client, Classic Web Form, and XPages`。

## 查證 checklist
- [x] 研究鏈：研究 subagent WebFetch 官方 Designer 文件（三支柱皆驗證非 404）
- [x] 五外部 URL 驗證非 404
- [x] 矛盾檢查（三情境收斂富文本；未重寫 7/07）
- [x] 兩個 flag 都遵守（$FILE 未當引用；classic 控制項未過度宣稱綁定/多檔）
- [x] inline-link diversity 通過（5 個相異 URL，最高 4/16 = 25%）
- [x] 雙語 build 通過（暫複製進 posts 驗 frontmatter）
- [x] humanizer-zh-tw 自審（情境開場、「容易到不像功能」earned voice、無罐頭結論）
- [x] 未重寫 [[notes-embedded-object]] / [[notes-rich-text-item]]，交叉連結
- [x] 獨立 fact-check（subagent）→ PASS（零必修）；修一個 zh 贅字

## 異動日誌
- 2026-09-07 研究 subagent 掃三支柱、雙語草稿（前端對照、後端連 7/07）、diversity、標題 loop、sidecar（Opus 4.8）
- 2026-09-07 獨立 fact-check subagent → PASS（零必修）；修 zh 贅字（Opus 4.8）
- 2026-09-07 使用者要求把下載 URL 特別寫清楚 → 抽成獨立一節「取回附件：$File 的下載 URL」，
  逐段拆解（Host/Database/View/Document/$File/Filename/?OpenElement）+ 官方實例
  `.../By+Part+Number/SN156/$File/spec.txt?OpenElement` + 逐字「makes it impractical to create these URLs
  manually」+ 三情境怎麼拿到 URL。內容全釘在 H_ABOUT_URL_COMMANDS_..._OLE_OBJECTS.html（本輪重新 WebFetch
  確認 segment 拆解與逐字）；UNID 用法以「實務也常見」hedge、未宣稱官方逐字。diversity 仍 25%、build 過（Opus 4.8）
