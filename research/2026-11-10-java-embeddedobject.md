# Research trail — java-embeddedobject (2026-11-10)

**Topic**: Java 的 `EmbeddedObject` —— 核心是「在 Java 要附件的 bytes,不必先
extractFile 落地」:`getInputStream` 直接串流讀。外加兩個會咬人的坑:extractFile
對非附件丟例外、`Document.getEmbeddedObjects` 不回附件;還有平台現實(UNIX/Mac 只
支援 file attachment)。插旗:`coversClass: EmbeddedObject` ＋ `apiLang: java`。
對應週 #7(11/10)。Path A(_pending)。

## ⚠️ 研究用內建瀏覽器做(WebFetch/Bash DNS 當掉)

- 本輪 **WebFetch 與 Bash 的對外 DNS 全斷**(ENOTFOUND / nslookup 無回應 / curl
  google 也 000)——是**工具環境**的網路問題,使用者自己瀏覽器正常。
- → 改用**內建瀏覽器**(`mcp__Claude_Browser__navigate` + `get_page_text`,走使用者
  網路)抓 HCL 官方頁,逐字驗過。NotebookLM 這輪也因 DNS 無法用(net::ERR_NAME_NOT_RESOLVED)。

## 非重炒防呆

- LS/附件家族已覆蓋:notes-embedded-object(LS class 目錄)、notes-rich-text-item、
  domino-attachments-three-ways / bulk、xpages-attachment-multi-delete。→ 本篇走
  **Java 專屬**(getInputStream 串流、extractFile server 路徑+丟例外、
  Document.getEmbeddedObjects 不回附件、平台限制),深連結回那些。
- recycle 只一句、引回 java-collection-iteration。

## 官方 HCL 14.5.1（內建瀏覽器逐字驗）

- `.../basic/H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html`（EmbeddedObject, Java)→
  「Represents any one of the following: An embedded object / An object link /
  A file attachment.」`extends Base`,由 **Document 和 RichTextItem** 包含。
  **Note:「Embedded objects and object links are not supported for UNIX and the
  Macintosh. File attachments are.」** 屬性:ClassName、FileSize、**InputStream
  (getInputStream)**、**Reader(getReader)**、Name、Object、Source、**Type
  (getType)**、Verbs。方法:activate、doVerb、**extractFile**、recycle、remove、
  parseXML、transformXML。建立:RichTextItem.embedObject。存取:RichTextItem 的
  getEmbeddedObject(name)/getEmbeddedObjects;**Document.getEmbeddedObjects「does
  not return file attachments」**(+不回 Notes R3 建的)。
- `.../basic/H_EXTRACTFILE_METHOD_JAVA.html`（extractFile, Java)→「Writes a file
  attachment to storage.」`public void extractFile(String path)`(path=存檔路徑;
  server 端 Java/agent 跑在伺服器上,路徑即伺服器端)。**「For embedded objects and
  object links, this method throws an exception.」**(extractFile 只對附件有效)。
- `.../basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html`（RichTextItem, Java —— #5 已驗)→
  embedObject / getEmbeddedObject(s)(附件/物件存取入口)。

## identifier / 行為查核（都官方逐字,不臆測)

- `getInputStream`(InputStream 屬性)/`getReader`(Reader 屬性)= 串流讀,不落地。
- `extractFile` 只對 **file attachment**;對 object/link 丟例外。
- `Document.getEmbeddedObjects` **不回附件**;附件要走 RichTextItem 或 Document.getAttachment。
- getType 三種:embedded object / object link / file attachment(常數 EMBED_* 未在頁上
  逐字列 → 文章只講「三種、getType 告訴你是哪種」,不硬列常數名)。
- 平台:UNIX/Mac 只支援 file attachment、不支援 embedded object/link(官方 Note)。

## 矛盾檢查

- 無(官方頁之間一致;NotebookLM 本輪無產出)。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/notes-embedded-object/` — LS EmbeddedObject class(目錄)
- `/domino-news/posts/domino-attachments-three-ways/` — 附件三種拿法
- `/domino-news/posts/java-richtextitem/` — #5,Java RichTextItem(embedObject 入口)
- `/domino-news/posts/java-collection-iteration/` — Java recycle 全貌

## 外部來源(diversity:每語言 3 個不重複 URL,各 33%)

1. EmbeddedObject (Java) class — H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html
2. extractFile (Java) — H_EXTRACTFILE_METHOD_JAVA.html
3. RichTextItem (Java) class — H_NOTESRICHTEXTITEM_CLASS_JAVA.html

## 標題候選（標題優化 loop）

- [汰除] 純功能:`Java 的 EmbeddedObject:getType、extractFile、getInputStream` — 目錄、無 hook。
- [汰除] 只打串流:`用 getInputStream 讀附件不落地` — hook 夠但沒點出兩個坑。
- [選定] 串流 + 兩坑:`Java 讀附件:用 getInputStream 不落地,還有兩個會咬你的坑`
  — 點出 Java 特有(串流讀)+ 兩個官方坑(extractFile 丟例外 / Document 不回附件),好搜、不過度承諾。
  en 鏡像:`Attachments in Java: Stream with getInputStream, and Two Traps That Bite`

## 驗證清單

- [x] 既有覆蓋查核、鎖定不重疊(Java 串流/平台/兩坑,非 LS 目錄)
- [x] NotebookLM 先問(DNS 當、無產出)→ fallback 官方(內建瀏覽器逐字驗)
- [x] 3 頁官方逐字驗;平台/例外/不回附件全官方,不臆測
- [x] identifier 查準(getInputStream、extractFile 只對附件、Document 不回附件)
- [ ] coversClass: EmbeddedObject + apiLang: java（map-lang-report)
- [ ] 3 不重複外部來源,diversity < 40%
- [ ] humanizer pass
- [ ] temp-copy build 驗 frontmatter → 進 _pending
- [ ] push:若 Bash DNS 仍當,commit 先留本地、網路回來再推
