# Research trail — ssjs-viewentry (2026-11-15)

**Topic**: `NotesViewEntry`(SSJS/XPages)—— 在 XPages 讀 view 的**欄值**
(`getColumnValues`,索引層資料)建自訂輸出(typeahead/JSON/輕量 repeat),
不必逐筆開 Document。關鍵區分:`getAllEntries` 回的 ViewEntryCollection 是
**只含 document 列**,category/total 列要用 ViewNavigator(接 #4 java-viewnavigator)。
XPages request 管生命週期、不用 recycle(對比 Java #4)。插旗
`coversClass: ViewEntry` ＋ `apiLang: ssjs`。Path A,排程 #5(11/15)。

## 為什麼是這題

- map 缺口:ViewEntry 缺 SSJS 旗(LS ● / Java 有 ViewNavigator 但 ViewEntry 節點
  本身…;此處掛 SSJS ViewEntry 旗)。
- 與 #4(java-viewnavigator)區隔:#4 講 Java 走訪大 view 的效能旋鈕 + recycle;
  這篇講 **XPages 怎麼讀欄值、category 列的處理、collection vs navigator 的差別**。

## 官方 HCL 14.5.1（SSJS reference，WebFetch 逐字驗）

- `.../reference/r_domino_ViewEntry.html`(NotesViewEntry,非 404)→「A view entry
  describes a row in a view. The three types of view entries are document,
  category, and total.」ColumnValues「Read-only. The value of each column in the
  view entry.」。取得:ViewEntryCollection / ViewNavigator 的 get 方法、或
  `NotesView.getEntryByKey`。屬性:ColumnValues / Document / IsDocument /
  IsCategory / IsTotal / IsConflict / NoteID / UniversalID / ChildCount /
  DescendantCount / IndentLevel / FTSearchScore;方法 getPosition / getRead。
- `.../reference/r_domino_ViewEntryCollection.html`(非 404)→「Represents a
  collection of view entries **of type document** sorted in view order.」取得:
  `NotesView.getAllEntries`(及 getAllEntriesByKey / getAllReadEntries /
  getAllUnreadEntries)。方法:Count(ro)、getFirstEntry / getNextEntry /
  getNthEntry / getEntry、stampAll、FTSearch。→ **只含 document 列**(無 category)。
- `.../reference/r_domino_View.html`(NotesView,核心,getAllEntries 在此)。

## identifier / 行為查核（逐字驗）

- `getColumnValues()` 回該列每一欄的值(索引層),顯示用資料若都在 view 欄位裡,
  整趟不開 Document。需要真正的文件才 `getDocument()`。
- **collection(getAllEntries)= document-only** vs **navigator = 含 category/total**。
  要處理分類列走 ViewNavigator(#4),不是 getAllEntries。
- SSJS 用 getter 形式(getColumnValues / getDocument / isCategory)皆可;屬性名為
  ColumnValues / Document / IsCategory。
- XPages request 管生命週期,**不用 recycle**(對比 Java #4 要手動 recycle)。

## 矛盾檢查

- 無。ViewEntryCollection「of type document」與 ViewEntry 有三型別不矛盾:前者是
  getAllEntries 這個集合的內容限定,後者是 ViewEntry 這個類別能代表的種類。

## 交叉引用（內部）

- `/domino-news/posts/java-viewnavigator/` — Java 走訪(含 category 列)與效能(#4)
- `/domino-news/posts/java-view/` — View 本身
- `/domino-news/posts/ssjs-documentcollection/` — SSJS 的集合批次(stampAll 同族)

## 外部來源（diversity:每語言 3 不重複 URL，各 33%）

1. NotesViewEntry (SSJS) — r_domino_ViewEntry.html
2. NotesViewEntryCollection (SSJS) — r_domino_ViewEntryCollection.html
3. NotesView (SSJS) — r_domino_View.html

## 標題候選

- [汰除] 純功能:`XPages 的 ViewEntry:讀 view 列` — 目錄。
- [選定] concept＋好處:`XPages 的 ViewEntry:用 getColumnValues 讀 view,不開每份文件`
  — XPages hook、好搜、不過度承諾。
  en 鏡像:`ViewEntry in XPages: Read the View with getColumnValues, Without Opening Each Document`

## 驗證清單

- [x] SSJS 真有 ViewEntry/ViewEntryCollection(逐字驗)、與 #4 區隔
- [x] 官方逐字(ViewEntry / ViewEntryCollection / View)、collection=document-only
- [x] getColumnValues 不開文件(索引層)、category 走 navigator、不用 recycle
- [ ] coversClass: ViewEntry + apiLang: ssjs / 3 URL < 40% / humanizer / build
