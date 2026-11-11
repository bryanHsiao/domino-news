# Research trail — java-viewentrycollection (2026-11-21)

**Topic**: `lotus.domino.ViewEntryCollection`(Java)—— 一批「view 排序的 document
entry」的**批次操作**(stampAll 一次改欄位)、**FTSearch 窄化**、**集合運算**
(intersect/merge/subtract 組合兩個查詢結果)、getNthEntry 依位置取。與 #4
(ViewNavigator 走訪大 view)、#5(SSJS ViewEntry 讀欄值)區隔。插旗
`coversClass: ViewEntryCollection` ＋ `apiLang: java`。Path A,排程 #11(11/21)。

## 為什麼是這題

- map 缺口:ViewEntryCollection 有 LS(notes-view-entry)缺 Java 旗。
- 與 #4/#5 區隔:#4 是 ViewNavigator 懶走訪 + 效能旋鈕(含 category 列);#5 是 SSJS
  讀欄值;這篇是 **Java 的集合批次 + 集合運算**(stampAll/FTSearch/intersect)。

## 官方 HCL 14.5.1（WebFetch 逐字驗;Java notebook 污染走 WebFetch）

- `.../basic/H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html`(class)→「Represents a
  collection of view entries **of type document** sorted in view order.」(不含
  category/total)。取得:View 的 getAllEntries / getAllEntriesByKey。屬性:Count
  (ro)、Parent(ro)、Query(ro,全文查詢字串)。導航:getFirstEntry / getLastEntry /
  getNextEntry / getPrevEntry / getNthEntry / getEntry(移動 current 指標)。集合/改:
  addEntry / deleteEntry / intersect / merge / subtract / contains / clone。文件動作:
  markAllRead / markAllUnread / putAllInFolder / removeAllFromFolder / removeAll /
  updateAll(標記為 agent 已處理)。**stampAll**「Replaces the value of a specified
  item in the documents of all the entries in a view entry collection.」**FTSearch**
  「Conducts a full-text search on all entries in a view entry collection and filters
  the collection」(之後 collection 只剩符合的)。auto-update 警告:會降效+使 entry
  失效(「Entry not found in index」)→ 設 IsAutoUpdate false、refresh。
- `.../basic/H_NOTESVIEW_CLASS_JAVA.html`(View,核心,getAllEntries/getAllEntriesByKey)。
- `.../basic/H_NOTESVIEWENTRY_CLASS_JAVA.html`(ViewEntry,collection 裡的元素,#4 已驗)。

## identifier / 行為查核（逐字驗）

- collection = document entries only(與 #5 SSJS 的觀察一致)。
- stampAll(itemName, value)= 一次改整批文件某欄,不用逐筆 save。
- FTSearch(query)= 對現有 collection 再全文搜尋、原地窄化(要有全文索引)。
- intersect / merge / subtract = 交集 / 聯集 / 差集,組合兩個查詢結果。
- getNthEntry(n)= 依位置取(view 排序下的第 n 筆)。
- 走訪前設 parent view 的 AutoUpdate=false(否則 Entry not found in index);Java 每個
  entry 用完 recycle。

## 矛盾檢查

- 無。

## 交叉引用（內部）

- `/domino-news/posts/java-viewnavigator/` — 走訪大 view 的另一條路(#4)
- `/domino-news/posts/ssjs-documentcollection/` — DocumentCollection 的 stampAll/removeAll
- `/domino-news/posts/java-recycle-memory/` — recycle

## 外部來源（diversity:每語言 3 不重複 URL，各 33%）

1. ViewEntryCollection class (Java) — H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html
2. View class (Java) — H_NOTESVIEW_CLASS_JAVA.html
3. ViewEntry class (Java) — H_NOTESVIEWENTRY_CLASS_JAVA.html

## 標題候選

- [汰除] 純功能:`Java 的 ViewEntryCollection:集合` — 目錄。
- [選定] concept＋好處:`Java 的 ViewEntryCollection:stampAll 一次改,FTSearch 窄化,集合運算組條件`
  — 點出三招、好搜、不過度承諾。
  en 鏡像:`ViewEntryCollection in Java: stampAll to Bulk-Edit, FTSearch to Narrow, Set Ops to Combine`

## 驗證清單

- [x] map 缺口(ViewEntryCollection 缺 Java 旗)、與 #4/#5 區隔
- [x] 官方逐字(ViewEntryCollection / View / ViewEntry,主頁 14.5.1 非 404)
- [x] stampAll/FTSearch/intersect/getNthEntry/autoupdate 查準、document-only
- [ ] coversClass: ViewEntryCollection + apiLang: java / 3 URL < 40% / humanizer / build
