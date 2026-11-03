# Research trail — java-database (2026-11-05)

**Topic**: Java `lotus.domino.Database` —— 怎麼在 Java 取得/持有一個 Database
handle、`getDatabase` 不回 null 卻沒開成的陷阱、Database 級方法巡覽、以及
Database 在 recycle 父子鏈的位置。插旗:`coversClass: Database` ＋
`apiLang: java`(給 Database 節點補**第一支 Java 旗**)。「Java/SSJS
對應週」第 2 篇(11/05)。

## 非重炒防呆(動筆前先查既有覆蓋)

站上 Java 文已成群,以下主題**已有專文、本篇只點到並交叉引用、不重講**:
- recycle / 記憶體機制(四條官方規則、迴圈洩漏)→ `java-recycle-memory`(8/07)
- 取得 Session / NotesFactory 三條路、local vs remote → `java-session-notesfactory`(8/08)
- NotesThread 背景執行緒、sinitThread/stermThread、一執行緒一 session
  → `java-notesthread`(9/30)
- DocumentCollection 迴圈 + recycle 順序、ViewNavigator → `java-collection-iteration`(8/16)
- DQL / DominoQuery(Java)→ `java-dql-dominoquery`(8/09)
- Java agent 骨架 / 權限 → `java-agent-anatomy`(8/10)

→ 本篇獨有地盤 = **「取得並持有 Database handle」**:開庫路徑、isOpen 陷阱、
Database 級操作巡覽、Database 在 handle 鏈的位置。Java `Database` 本身**尚無專文**
(apiLang:java 清單裡沒有 java-database),題目成立、是新旗。

## NotebookLM

- Notebook: Java back-end API
  `https://notebooklm.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b`
- **結果:無產出。** 登入正常(成功開 notebook、拿到回應),但連問三題(完整題、
  收斂題、極簡 "what is recycle()" 探針)都回「Gemini Notebook 無法回答這個問題,
  請換個說法」。是**拒答**不是跨主題污染(chat pairs 當時 4→6)。依 CLAUDE.md:
  此情況視 NotebookLM 為不可用、改 WebFetch 官方頁,並已告知使用者。未自行清
  chat(需使用者授權、且拒答清了未必有用)。

## WebFetch（官方 HCL 14.5.1,皆確認真頁、非 404）

- `.../H_NOTESDATABASE_CLASS_JAVA.html`（Database class, Java）
  → 標題 "Database (Java™)";`public class Database extends Base`;intro
  「Represents a Notes® database.」;contained by **AgentContext / DbDirectory /
  Session**。取得:Session.getDatabase / getURLDatabase / getAddressBooks;
  AgentContext.getCurrentDatabase;DbDirectory.openDatabaseByReplicaID /
  openMailDatabase / openDatabase / openDatabaseIfModified / createDatabase;
  createCopy / createFromTemplate / createReplica。方法:getView、
  getDocumentByUNID、createDocument、search、FTSearch、createDominoQuery、open
  (「Opens a database.」)、remove(「Permanently deletes a database.」)。屬性:
  ACL、AllDocuments、Title(RW)、FileName、IsOpen。「most of the time the class
  library opens a database automatically, with exceptions covered under isOpen」。
  recycle 在方法清單:「The recycle method unconditionally destroys an object and
  returns its memory to the system.」無程式碼(另有 Examples: Database class 頁)。
  **此頁未提 getFirstDatabase**(LS DbDirectory 有、Java 這頁沒列)→ 文中只用
  已確認的 Java 方法名。
- `.../H_GETDATABASE_METHOD_JAVA.html`（getDatabase, Session - Java）→ 標題
  "getDatabase (Session - Java™)"。簽名(逐字):
  - `public Database getDatabase(String server, String db) throws NotesException`
  - `public Database getDatabase(String server, String db, boolean createonfail) throws NotesException`
  語意(逐字):「If true or omitted, creates a Database object even if the
  specified database cannot be opened.」「If false, returns null if the database
  cannot be opened.」「If the database cannot be opened and createonfail is true
  or omitted, isOpen is false for the Database object.」「It will create the
  in-memory object that refers to the non-existent database.」「opens the
  database, if possible.」
  → **本篇核心陷阱**:兩參數版(createonfail 預設 true)回**非 null** 物件,庫沒開時
  `isOpen()` 為 false。不能只 null-check;要嘛 isOpen-check、要嘛用三參數版傳 false
  拿乾淨的 null。
- `.../H_RECYCLE_METHOD_JAVA.html`（recycle, Java）→ 逐字:「Garbage collection
  has no effect on Domino® Objects unless you first explicitly recycle them.」
  「Java™ has no knowlege of the heavyweight back-end Domino® Objects.」
  「Recycling a parent recycles all the children.」「Recycle an object in the same
  thread in which it is created.」「In Session, call recycle() only after all other
  threads exit.」「Loops enumerating documents or items are good candidates for
  recycling.」→ 本篇只取「父子鏈」與「同執行緒」兩點點到,深入交叉引用
  java-recycle-memory。
- `.../H_NOTESTHREAD_CLASS_JAVA.html`（NotesThread, Java）→ 逐字:
  「Call stermThread() exactly one time for each call to sinitThread(); putting
  stermThread in a finally block is recommended.」「do not use DbDirectory across
  threads.」within a session objects「shared, synchronized, and recycled across
  threads」。→ 本篇只取「DbDirectory 別跨執行緒」點到,深入交叉引用 java-notesthread。

## 矛盾檢查

- NotebookLM 無產出,無跨源矛盾可對。
- recycle 頁與 NotesThread 頁對「同執行緒回收 / session 內跨執行緒共享」彼此一致、無衝突。
- getDatabase 頁的 createonfail/isOpen 語意與 Database class 頁「class library opens
  automatically, exceptions under isOpen」一致。

## 交叉引用（內部,不計 diversity 上限）

- `/domino-news/posts/java-session-notesfactory/` — 先拿到 Session 才有 getDatabase
- `/domino-news/posts/java-recycle-memory/` — recycle 四規則與迴圈洩漏(深入)
- `/domino-news/posts/java-notesthread/` — 背景執行緒 / 一執行緒一 session(深入)
- `/domino-news/posts/java-collection-iteration/` — 讀文件的 recycle 迴圈慣例
- `/domino-news/posts/java-dql-dominoquery/` — createDominoQuery 之後(深入)
- `/domino-news/posts/notes-db-directory/` — DbDirectory（LS 視角）
- `/domino-news/posts/ssjs-backend-document/` — SSJS 的 database global 與後端文件

## 標題候選（標題優化 loop）

- [汰除] 純概念:`Java 的 Database handle:取得、isOpen、recycle 鏈` — 清楚但像目錄、無 hook。
- [汰除] 只打陷阱:`Java 的 getDatabase 回了物件不代表庫開了` — hook 夠、但窄化成只講 isOpen,涵蓋不到開庫路徑與 recycle 鏈。
- [選定] 路徑＋陷阱合併:`Java 開 Notes Database:路有很多條,陷阱只有一個`
  — 涵蓋全篇(多路徑＋isOpen 陷阱)、有 hook、好搜(Java / Notes Database)、不過度承諾。
  en 鏡像:`Opening a Notes Database in Java: Many Paths, One Trap`

## 驗證清單

- [x] 既有覆蓋查核(coverage 內既有 Java 文),鎖定不重疊地盤
- [ ] NotebookLM 先問 — 無產出(拒答),已轉 WebFetch 並告知使用者
- [x] WebFetch 補 class/method/recycle/thread,每頁確認真頁非 404
- [x] 矛盾檢查
- [x] coversClass: Database + apiLang: java（stage 前跑 map-lang-report 確認插旗）
- [ ] 3 個不重複外部來源 + 內部交叉連結,diversity < 40%（寫完再驗）
- [ ] humanizer pass
- [ ] temp-copy build 驗 frontmatter
