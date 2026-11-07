# Research trail — java-richtextitem (2026-11-08)

**Topic**: Java 的 `RichTextItem` —— 在 Java 碰 rich text 的兩個 Java 特有摩擦:
(1) `getFirstItem` 回的是 `Item`,要 **cast** 成 RichTextItem,而且 body 現在常是
**MIME 不是 rich text**(`getMIMEEntity`);(2) 要把 rich text 讀成純文字,
`getFormattedText` **會把附件/bitmap 等非文字內容丟掉**。插旗:`coversClass:
RichTextItem` ＋ `apiLang: java`。對應週 #5(11/08)。Path A(_pending)。

## 非重炒防呆

- LS 的 RichText 家族**已大量覆蓋**:notes-rich-text-item(22 方法目錄)、
  notes-rich-text-navigator / style / table / paragraph-style / doclink、
  notes-embedded-object。→ 本篇**不重列 22 方法、不重講 style/table**,聚焦
  **Java 的 cast + MIME + getFormattedText 掉附件 + 建立/append 基本**,
  深的交叉連結回那些 LS 文。
- recycle 只一句、引回 java-collection-iteration。

## NotebookLM(Java notebook 99039350-...)

- **這次無產出**:只回「已搜尋你的來源」、answer body 沒 render(auth state
  97 天舊、可能需重認證)。依 skill fallback 到官方 HCL Java 文件(方法清單本就
  以官方為準)。已記:NotebookLM 這輪未用。

## WebFetch（官方 HCL 14.5.1 Java,皆確認活頁、逐字驗）

- `.../basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html`（RichTextItem, Java）→
  「Represents an item of type rich text.」`public class RichTextItem extends
  Item`,由 Document 包含。方法含 appendText/addNewLine/addTab/appendDocLink/
  appendRTItem/appendStyle/appendParagraphStyle/beginInsert/endInsert/
  embedObject/getEmbeddedObject(s)/getFormattedText/getUnformattedText/
  createNavigator/createRange/**getMIMEEntity**/update/compact。建立:「To create
  a new RichTextItem object, use createRichTextItem in Document」;讀既有:
  「use getFirstItem on Document and **cast** the result to RichTextItem」。
- `.../basic/H_CREATERICHTEXTITEM_METHOD_JAVA.html`（Document.createRichTextItem）→
  「Creates a new rich-text item in a document」,參數 `String name`,回 RichTextItem。
- `.../basic/H_GETFORMATTEDTEXT_METHOD_JAVA.html`（RichTextItem.getFormattedText）→
  「Returns the contents of a rich text item as plain text.」
  `getFormattedText(boolean tabstrip, int linelen, int maxlen)`:tabstrip=tab 換空白;
  linelen=幾字換行(0=80);maxlen=最多幾字(0=預設)。**「removes non-text content
  such as bitmaps and file attachments」**(= 讀成文字會掉附件,核心坑)。
  （getUnformattedText 此頁只連結未描述 → 文章只輕描「更單純的版本」,不臆測細節。）

## identifier / 行為查核

- `getFirstItem` 回 `Item`、要 cast 成 RichTextItem(Java 特有;LS 的 Set 較寬鬆)。
- body 可能是 **MIME**:RichTextItem 有 `getMIMEEntity`(class doc 上有)→ 文章只
  點「body 可能是 MIME、那時走 MIME entity」,**不深入臆測 setConvertMime/cast 例外**
  (getMIMEEntity 的 Document 版 URL 我試過 404,不硬編)。
- `getFormattedText` 掉非文字內容 = 官方原文,可硬寫。

## 矛盾檢查

- 無(NotebookLM 無產出;官方頁之間一致)。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/notes-rich-text-item/` — LS 的 22 方法目錄(深度在那)
- `/domino-news/posts/notes-rich-text-doclink/` — doclink
- `/domino-news/posts/notes-embedded-object/` — 嵌入物件/附件
- `/domino-news/posts/java-database/` — #2 同週對照
- `/domino-news/posts/java-collection-iteration/` — recycle 全貌

## 外部來源(diversity:每語言 3 個不重複 URL,各 33%)

1. RichTextItem (Java) class — H_NOTESRICHTEXTITEM_CLASS_JAVA.html
2. createRichTextItem (Document, Java) — H_CREATERICHTEXTITEM_METHOD_JAVA.html
3. getFormattedText (Java) — H_GETFORMATTEDTEXT_METHOD_JAVA.html

## 標題候選（標題優化 loop）

- [汰除] 純功能:`Java 的 RichTextItem:建立、append、讀文字` — 像目錄、無 hook。
- [汰除] 只打附件:`getFormattedText 會吃掉你的附件` — hook 夠但沒點出 Java/rich text。
- [選定] cast + 兩個意外:`Java 讀 rich text:先 cast,再小心 MIME 和被丟掉的附件`
  — 點出 Java 特有(cast)+ 兩個坑(MIME body、getFormattedText 掉附件),好搜、不過度承諾。
  en 鏡像:`Reading Rich Text in Java: Cast First, Then Mind the MIME and the Dropped Attachments`

## 驗證清單

- [x] 既有覆蓋查核、鎖定不重疊(Java cast/MIME/文字抽取,非 LS 22 方法)
- [x] NotebookLM 先問(無產出)→ fallback 官方文件
- [x] WebFetch 3 頁確認活頁、逐字驗;MIME 保守、不臆測
- [x] identifier 查準(cast、getMIMEEntity、getFormattedText 掉非文字)
- [ ] coversClass: RichTextItem + apiLang: java（map-lang-report）
- [ ] 3 不重複外部來源,diversity < 40%
- [ ] humanizer pass
- [ ] 本地 build（Path A:暫移 posts/ 驗 frontmatter 或信任 schema)→ 進 _pending
