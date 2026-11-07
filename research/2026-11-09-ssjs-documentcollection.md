# Research trail — ssjs-documentcollection (2026-11-09)

**Topic**: SSJS 的 `NotesDocumentCollection` —— 從 search/FTSearch/view 拿到一堆
文件後,除了迴圈,還有**批次操作**:`stampAll` 一次改全部一個欄位、`removeAll`
一次(永久)刪全部;加 `FTSearch` 窄化、`intersect/merge/subtract` 組合。插旗:
`coversClass: DocumentCollection` ＋ `apiLang: ssjs`。**填 11/09 空檔**(原 #6 SSJS
DominoQuery 取消後;SSJS 確定有 DocumentCollection,不像 DQL)。Path A(_pending)。

## 為什麼是這題

- map 缺口:`NotesDocumentCollection` 是 LS ● Java ● **SSJS ·**(缺 SSJS 旗)。
- SSJS **確定有**(`database.search()` / `FTSearch()` 回的就是它)——已逐字驗方法清單,
  不重蹈 DQL(SSJS 沒 createDominoQuery)覆轍。
- 既有:notes-document-collection(LS)、notes-note-collection(LS)已覆蓋 LS;
  SSJS 側沒文深講 collection。ssjs-backend-document 是 XSP document 資料源、
  ssjs-database 是 database 權限——都不是 collection。不重疊。

## 官方 HCL 14.5.1（WebFetch,DNS 已恢復,逐字驗）

- `.../reference/r_domino_DocumentCollection.html`（NotesDocumentCollection, SSJS)→
  「Represents a collection of documents from a database.」方法/屬性:
  getFirstDocument / getNextDocument / getNthDocument / getDocument(走訪);
  **`Count`(唯讀屬性,不是 getCount)**;**`FTSearch`**(對現有 collection 做全文搜尋、
  窄化);**`stampAll`**(「Replaces an item's value in every document in the
  collection」= 一次改全部一個欄位);**`removeAll`**(「Permanently deletes the
  collection's documents from the database」= 永久刪全部);`putAllInFolder`、
  `markAllRead`;**集合運算 `intersect` / `merge` / `subtract`**。
- `.../reference/r_domino_Database.html`（NotesDatabase, SSJS —— 前面驗 createDominoQuery
  時已確認活頁)→ `search`(formula)、`FTSearch` 回 NotesDocumentCollection。
- `.../reference/r_wpdr_globals_r.html`（SSJS globals —— `database` 全域,已用過)。

## identifier / 行為查核（吸取 DQL 教訓,逐字驗)

- `Count` 是**屬性**、不是 `getCount()`(官方頁明列 Count 屬性、無 getCount)。
- `stampAll` = 改每份文件一個欄位;`removeAll` = **永久刪**(危險,強調先確認 collection)。
- SSJS 的 collection 批次操作走**當前使用者權限**(SSJS session)→ removeAll/stampAll
  受 ACL 限制、也可能刪/改到超出預期;接 ssjs-database 的權限模型。
- lifecycle:XPages request 管,不像 Java standalone 要手動 recycle(SSJS 不強調)。

## 矛盾檢查

- 無(官方頁一致)。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/notes-document-collection/` — LS DocumentCollection
- `/domino-news/posts/ssjs-database/` — SSJS 用誰的權限(stampAll/removeAll 的身分)
- `/domino-news/posts/ssjs-backend-document/` — SSJS 後端文件

## 外部來源(diversity:每語言 3 個不重複 URL,各 33%)

1. NotesDocumentCollection (SSJS) — r_domino_DocumentCollection.html
2. NotesDatabase (SSJS)（search/FTSearch 回 collection）— r_domino_Database.html
3. Global objects（database）— r_wpdr_globals_r.html

## 標題候選（標題優化 loop）

- [汰除] 純功能:`SSJS 的 DocumentCollection:走訪與批次` — 目錄、無 hook。
- [選定] 批次兩招(含危險):`SSJS 的 DocumentCollection:stampAll 一次改全部,removeAll 一次刪全部`
  — 點出 collection 的威力(一次改/刪全部、不用迴圈)+ 隱含危險,好搜、不過度承諾。
  en 鏡像:`DocumentCollection in SSJS: stampAll Updates Them All, removeAll Deletes Them All`

## 驗證清單

- [x] map 缺口確認（NotesDocumentCollection 缺 SSJS）、既有不重疊
- [x] **先驗 SSJS 真有此類別與方法**（r_domino_DocumentCollection 逐字驗）— 不重蹈 DQL
- [x] identifier 查準（Count 是屬性非 getCount、stampAll/removeAll 語意、權限）
- [ ] coversClass: DocumentCollection + apiLang: ssjs（map-lang-report → SSJS 燈）
- [ ] 3 不重複外部來源,diversity < 40%
- [ ] humanizer pass
- [ ] temp-copy build 驗 frontmatter → 進 _pending
