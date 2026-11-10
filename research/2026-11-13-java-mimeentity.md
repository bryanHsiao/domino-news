# Research trail — java-mimeentity (2026-11-13)

**Topic**: `lotus.domino.MIMEEntity`(Java)—— 讀/寫 MIME 郵件內容。招牌坑:
**讀 MIME 前一定要 `session.setConvertMIME(false)`**,否則 Domino 會把 MIME
自動轉成 rich text,你拿到的就不是原本的 MIME;加上 MIMEEntity 在 Document 做
save/computeWithForm/sign/closeMIMEEntities 後會**失效**、別跟 Item 存取混用。
插旗 `coversClass: MIMEEntity` ＋ `apiLang: java`。Path A,排程 #3(11/13)。

## 為什麼是這題

- map 缺口:MIMEEntity 有 LS(notes-mime-entity)缺 Java 旗。
- Java 側有很硬的獨特坑(setConvertMIME 的時機、失效規則),現代 Domino mail
  body 多半是 MIME 不是 composite rich text,這題實用。不與 LS 文重疊。

## 官方 HCL 14.5.1（WebFetch 逐字驗;Java notebook 本 session 污染，走 WebFetch）

- `.../basic/H_MIMEENTITY_CLASS_JAVA.html`(class)→「an item of type MIME
  (Multipurpose Internet Mail Extensions)」;contained by Item/Document;新增於
  **Release 5.0.2**。內容:getContentAsText / getContentAsBytes /
  setContentFromText / setContentFromBytes / decodeContent / encodeContent。
  headers:getHeaders / getNthHeader / getSomeHeaders / HeaderObjects /
  createHeader。唯讀型別:ContentType / ContentSubtype / Charset / Encoding。
  走訪:getFirstChildEntity / getNextEntity / getNextSibling / getPrevEntity /
  getParentEntity。結構:createChildEntity / createParentEntity / Preamble /
  BoundaryStart / BoundaryEnd / remove。還有 InputStream / Reader。
  **失效警告**:MIMEEntity 「becomes invalid if any of the following methods
  are applied to the containing Document object」= computeWithForm / encrypt /
  save / send / sign / closeMIMEEntities。並勸告別在同一份文件同時用 Item 與
  MIMEEntity 存取。
- `.../basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS_JAVA.html`(官方 how-to,14.5.1
  確認非 404)→ 逐字流程:「First call Session.setConvertMIME(false) to override
  normal conversion of MIME items to rich text.」→「Then call
  Document.getMIMEEntity.」/「Or call Document.getFirstItem followed by
  Item.getMIMEEntity.」→ 寫:「To create an item in MIME format, call
  Document.createMIMEEntity.」→「To close MIME processing... call
  Document.closeMIMEEntities.」→「Before exiting your code, call
  Session.setConvertMIME(true) (or restore the original setting).」
- `.../basic/H_MIMEHEADER_CLASS_JAVA.html`(MIMEHeader,sibling,14.5.1 非 404)→
  「A MIME header consists of a name, value, and parameters as defined in
  RFC-822 and RFC-2045.」取得:getHeaderObjects / getNthHeader / createHeader。

## identifier / 行為查核（逐字驗）

- Java 正確拼法是 **`setConvertMIME`**(大寫 MIME),不是 setConvertMime。
- 順序:setConvertMIME(false) → getMIMEEntity/createMIMEEntity → 讀/寫 →
  closeMIMEEntities → setConvertMIME(true)。
- 失效:做 save/computeWithForm/sign/encrypt/send/closeMIMEEntities 後,手上的
  MIMEEntity handle 失效 → 讀完再 save,別拿失效的 handle。
- 別同一文件同時 Item + MIMEEntity 存取。

## 矛盾檢查

- 無(class 頁與 how-to 頁一致)。

## 交叉引用（內部）

- `/domino-news/posts/notes-mime-entity/` — LS 的 NotesMIMEEntity
- `/domino-news/posts/java-richtextitem/` — Body 是 MIME 時的 getMIMEEntity 伏筆
- `/domino-news/posts/java-recycle-memory/` — recycle

## 外部來源（diversity:每語言 3 不重複 URL，各 33%）

1. MIMEEntity class (Java) — H_MIMEENTITY_CLASS_JAVA.html
2. Working with a MIME entity in Java classes — H_WORKING_WITH_A_MIME_ENTITY_STEPS_JAVA.html
3. MIMEHeader class (Java) — H_MIMEHEADER_CLASS_JAVA.html

## 標題候選

- [汰除] 純功能:`Java 的 MIMEEntity:讀寫 MIME` — 目錄、無 hook。
- [選定] 問題＋concept:`Java 讀 MIME:不先 setConvertMIME(false),你讀到的就不是 MIME`
  — 點出確切前置動作、好搜、不過度承諾。
  en 鏡像:`Reading MIME in Java: Without setConvertMIME(false), You're Not Reading MIME`

## 驗證清單

- [x] map 缺口(MIMEEntity 缺 Java 旗)、不與 LS 文重疊
- [x] 官方逐字(class / how-to / MIMEHeader,三頁 14.5.1 非 404)
- [x] setConvertMIME 拼法、順序、失效規則查準
- [ ] coversClass: MIMEEntity + apiLang: java
- [ ] 3 不重複外部來源 < 40% / humanizer / temp-copy build
