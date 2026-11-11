# Research trail — java-queryresultsprocessor (2026-11-18)

**Topic**: `lotus.domino.QueryResultsProcessor`(QRP,Java)—— 把多個來源
(DocumentCollection / ViewEntryCollection / DQL 查詢)**跨資料庫**合併、排序、
聚合、輸出成一個 results view 或 JSON。Release 12 新增。建立:`db.createQueryResultsProcessor()`
(class 頁 Creation 段寫 createQueryProcessor 是官方 typo,範例碼是 createQueryResultsProcessor)。
插旗 `coversClass: QueryResultsProcessor` ＋ `apiLang: java`。Path A,排程 #8(11/18)。

## 為什麼是這題

- map 缺口:QueryResultsProcessor 有 LS(notes-query-results-processor)缺 Java 旗。
- 現代、實用:QRP 是 R12 之後把「多來源結果合併」做在 server 端的正解,接 DQL 系列。
- SSJS 無直接對應(同 DQL,XPages 走 Java bean)→ relatedSsjs []。

## 官方 HCL 14.5.1（WebFetch 逐字驗;Java notebook 污染走 WebFetch）

- `.../basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html`(class,14.5.1 非 404)→
  **「Aggregates, computes, sorts, and formats collections of documents across
  any set of Domino databases.」**「This class is new with Release 12.0.」方法:
  addCollection / addDominoQuery / addColumn / addFormula / executeToJSON /
  executeToView / getMaxEntries / setMaxEntries / getTimeoutSec / setTimeoutSec /
  recycle。addColumn「Creates a single column of values to be returned when
  QueryResultsProcessor is executed.」executeToView「Saves QueryResultsProcesser
  results to a "results view" in a database.」
- `.../basic/H_ADDCOLLECTION_METHOD_JAVA.html`(addCollection,14.5.1 非 404)→
  「Adds a pre-created DocumentCollection or ViewEntryCollection of documents」;
  參數 collection(lotus.domino.Base:DocumentCollection 或 ViewEntryCollection)
  + referencename(String,「A unique name (to the QueryResultsProcessor instance)
  of the input collection」,用於結果與 addFormula 標識來源)。範例逐字:
  **`QueryResultsProcessor qrp = db.createQueryResultsProcessor();`**(在 Database 上)。
- `.../basic/H_EXECUTETOJSON_METHOD_JAVA.html`(executeToJSON,14.5.1 非 404)→
  `public String executeToJSON()` throws NotesException;「Processes the input
  collections in the manner specified by the Sort Columns.」結果在頂層 key
  「StreamedResults」下(範例頁拼成 StreamResults,官方頁兩處不一致);特殊 key
  「@nid」(NoteID)、「@DbPath」。

## identifier / 行為查核（逐字驗）

- 建立在 **Database**:`db.createQueryResultsProcessor()`(非 session;非 createQueryProcessor)。
- 輸入可多個且跨庫:每個 addCollection/addDominoQuery 給一個唯一 referencename。
- 輸出兩種:executeToView(實體化成 results view;搜尋結果:預設 24h 過期)、
  executeToJSON(回 JSON 字串,含 @nid/@DbPath)。
- 防爆:setMaxEntries / setTimeoutSec;用完 recycle。
- SSJS 無 createQueryResultsProcessor(同 DQL;XPages 經 Java bean 使用)。

## 矛盾檢查

- class 頁 Creation 段 createQueryProcessor vs 範例 createQueryResultsProcessor →
  以範例碼(addCollection 頁逐字 `db.createQueryResultsProcessor()`)為準,文章用正確者。
- JSON 頂層 key StreamedResults vs StreamResults(官方頁自身不一致)→ 文章引
  「StreamedResults」(正文描述用字),並標示官方頁有拼字出入,不替官方拍板。

## 交叉引用（內部）

- `/domino-news/posts/notes-query-results-processor/` — LS 的 QRP
- `/domino-news/posts/dql-production/` — DQL 上線實務(addDominoQuery 的輸入來源)
- `/domino-news/posts/java-recycle-memory/` — recycle

## 外部來源（diversity:每語言 3 不重複 URL，各 33%）

1. QueryResultsProcessor class (Java) — H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html
2. addCollection (QueryResultsProcessor - Java) — H_ADDCOLLECTION_METHOD_JAVA.html
3. executeToJSON (QueryResultsProcessor - Java) — H_EXECUTETOJSON_METHOD_JAVA.html

## 標題候選

- [汰除] 純功能:`Java 的 QueryResultsProcessor:合併結果` — 目錄。
- [選定] concept＋好處:`Java 的 QueryResultsProcessor:多來源結果跨庫合併排序,輸出 view 或 JSON`
  — 點出跨庫合併的價值、兩種輸出、好搜、不過度承諾。
  en 鏡像:`QueryResultsProcessor in Java: Merge and Sort Results Across Databases into a View or JSON`

## 驗證清單

- [x] map 缺口(QRP 缺 Java 旗)、不與 LS 文重疊
- [x] 官方逐字(class/addCollection/executeToJSON,14.5.1 非 404)
- [x] 建立方法名定奪(db.createQueryResultsProcessor)、兩種輸出、R12、SSJS 無對應
- [ ] coversClass: QueryResultsProcessor + apiLang: java / 3 URL < 40% / humanizer / build
