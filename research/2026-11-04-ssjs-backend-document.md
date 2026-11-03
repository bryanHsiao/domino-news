# Research trail — ssjs-backend-document (2026-11-04)

**Topic**: 後端 NotesDocument 在 SSJS 怎麼用,以及它跟 XPages document data
source（NotesXspDocument / `document1`）的分界。插旗:`coversClass: Document`
＋ `apiLang: ssjs`（給 Document 節點補 SSJS 旗,與既有 Java 旗 java-document-items
湊成雙旗）。「Java/SSJS 對應週」第 1 篇(11/04)。

## NotebookLM

- Notebook: SSJS / XPages reference
  `https://notebooklm.google.com/notebook/0c88f101-7fb7-4ce2-b35e-37a87d3547ec`
- 問題:一題問到底,涵蓋 (1) 後端 NotesDocument 是什麼 (2) SSJS 怎麼取得
  (database.getDocumentByUNID / view.getDocumentByKey / document1.getDocument)
  (3) 與 NotesXspDocument 的關係與差異(getDocument(applyChanges)、
  replaceItemValue vs setValue、save 語意) (4) 方法屬性清單 (5) 版本註記
  (6) 混用後端 save + 資料源 save 的 save conflict 坑 (7) 完整 SSJS 範例。
- **答到**:切題,未污染。給了 getDocument 橋接、save-conflict 的 sequence
  number / 版本戳記成因、以及一段完整 view.getDocumentByKey → replaceItemValue
  → computeWithForm → save(true,false) 範例。版本註記 14.5.1、頁面有
  "This version is no longer supported." 警語。
- **Missing Information**:method-level 布林參數型態(save(force, makeResponse)、
  computeWithForm 的參數)未逐一詳列 → 轉 WebFetch。

## WebFetch（補 method-level 語法,皆驗證非 404）

- `https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_r.html`
  → NotesXspDocument（資料源）:「Represents a document associated with the XPage
  context…」;全域變數 `document1`…、`currentDocument`;方法含 getDocument、
  getValue/setValue、getItemValue/replaceItemValue、save、isEditable、isNewNote、
  isResponse、hasItem、removeItem、附件方法。官方指向「直接操作資料庫請用
  NotesDocument」。**無** isDirty。
- `https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html`
  → `getDocument()` / `getDocument(applyChanges: boolean)`:「Gets the document as
  a NotesDocument object.」applyChanges:「true applies any changes made to the
  data store; false (default) does not apply changes.」官方對「是否 flush 前端
  待套編輯」措辭模糊 → 實測細節交叉引用既有文 xpages-getdocument-applychanges
  (已在 12.0.2 / 14.5.1 實測)。
- 後端 NotesDocument 方法頁(API 與 LS/Java 共用,驗活):
  - `.../14.5.1/basic/H_NOTESDOCUMENT_CLASS.html`（NotesDocument class）
  - `.../14.5.1/basic/H_REPLACEITEMVALUE_METHOD.html`（ReplaceItemValue）
  - `.../14.5.1/basic/H_COMPUTEWITHFORM_METHOD.html`（ComputeWithForm）
  - （`H_SAVE_METHOD_74ACTUAL.html` 猜錯 slug,404,未採用。）

## 矛盾檢查

- NotebookLM 與 WebFetch 對 getDocument(applyChanges) 一致(true 套用改動、
  false 預設不套)。無衝突。save-conflict 成因(混用兩邊 save、版本戳記)與
  既有 xpages-save-conflicts 文的實測一致。

## 交叉引用(內部,不計 diversity 上限)

- `/domino-news/posts/xpages-getdocument-applychanges/` — getDocument(true) 深入
- `/domino-news/posts/xpages-save-conflicts/` — 混用 save 的衝突實測
- `/domino-news/posts/java-document-items/` — 同節點的 Java 旗(跨語言對照)

## 標題候選（標題優化 loop）

- [汰除] 概念 hook：`document1 是包裝,NotesDocument 才是本體` — 好記但「好搜」弱,搜尋者多半打 ssjs document / getDocument,標題無這些字。
- [汰除] 好處先行：`document1.getDocument() 之後:後端 NotesDocument 在 SSJS 怎麼用` — 清晰但冗、像副標。
- [選定] 問題＋概念合併：`XPages 裡其實有兩個 document,別改錯邊`
  — 清晰(點出「兩個 document」核心)、好記(有 hook)、好搜(含 XPages/document)、不過度承諾(本文確實講分界＋混用的坑)。
  en 鏡像：`XPages Has Two Documents — Don't Edit the Wrong One`

## 驗證清單

- [x] NotebookLM 先問(SSJS notebook)、切題未污染
- [x] WebFetch 補 method-level、每個 URL 驗證非 404（SPA title 檢查）
- [x] 矛盾檢查
- [x] coversClass: Document + apiLang: ssjs（stage 前跑 map-lang-report 確認插旗）
- [x] 3 個不重複外部來源 + 內部交叉連結,diversity < 40%
