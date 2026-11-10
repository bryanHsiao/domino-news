# Research trail — java-viewnavigator (2026-11-14)

**Topic**: `lotus.domino.ViewNavigator`(Java)—— 讀大 view 的 scalable 方式。
三個效能旋鈕:**IsAutoUpdate=false**(自動更新會降效、使 entry 失效)、
**CacheSize**(遠端 IIOP 時設快取、減少 server 往返)、**goto* vs get***
(「a goto method does not create a ViewEntry object」→ 只走訪/計數用 goto 較輕)。
插旗 `coversClass: ViewNavigator` ＋ `apiLang: java`。Path A,排程 #4(11/14)。

## 為什麼是這題

- map 缺口:ViewNavigator 有 LS(notes-view-navigator)缺 Java 旗。
- 接 java-view(11/07,getView/setAutoUpdate),但角度不同:java-view 講 View
  本身與 ViewEntryCollection;這篇講 **ViewNavigator 走訪大 view 的效能三旋鈕**。

## 官方 HCL 14.5.1（WebFetch 逐字驗;Java notebook 污染走 WebFetch）

- `.../basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html`(class)→「Represents a view
  navigator. A view navigator provides access to all or a subset of the entries
  in a view.」建立(View 的方法):createViewNav / createViewNavFrom /
  createViewNavFromAllUnread / createViewNavFromCategory /
  createViewNavFromChildren / createViewNavFromDescendants / createViewNavMaxLevel。
  **效能**:「a goto method does not create a ViewEntry object」(只走訪用 goto);
  遠端「ViewNavigator caches entries」,current-pointer 導航用 cache、entry-relative
  不用;「You can set the cache size and should set it to try to minimize server
  access.」(CacheSize);自動更新「degrade performance and may invalidate entries
  in the navigator」→ 建議 IsAutoUpdate=false、必要時 refresh。屬性:CacheSize(rw)
  / Count(ro)/ MaxLevel(rw)/ ParentView(ro)。方法:getFirst/gotoFirst、
  getNext/gotoNext、getPrev、getLast、getNextSibling、getChild、getParent、
  getCurrent、getNth/gotoPos、markAllRead。
- `.../basic/H_NOTESVIEWENTRY_CLASS_JAVA.html`(ViewEntry,14.5.1 非 404)→
  「Represents a view entry. A view entry describes a row in a view.」ColumnValues
  「Read-only. The value of each column in the view entry.」;「Documents retrieved
  from view entries do not have ColumnValues, FTSearchScore, or ParentView set.」
  三種 entry type:document / category / total(IsDocument / IsCategory / IsTotal)。
- `.../basic/H_NOTESVIEW_CLASS_JAVA.html`(View,核心類別,createViewNav* 家族在此)。

## identifier / 行為查核（逐字驗）

- 效能旋鈕是 **CacheSize**(不是 BufferMaxEntries,那個名稱在此類別無此屬性)。
- `get*` 建 ViewEntry 物件、`goto*` 不建 → 只需移動指標/計數時 goto 較省。
- IsAutoUpdate 預設 true;大 view 走訪前設 false,否則背景更新會使 navigator 的
  entry 失效 + 降效。
- ColumnValues 是 view 索引層的欄值(row 資料),讀 entry 的欄值不必逐筆開 Document
  ——但官方沒明寫「不開 document」四字,所以文章用「欄值來自索引、不必開文件」的
  實務框架,不杜撰保證句。
- category / total 列不是 document:走訪時用 IsDocument/IsCategory 判斷,別把分類列
  當文件處理。

## 矛盾檢查

- 無。

## 交叉引用（內部）

- `/domino-news/posts/java-view/` — View 本身與 setAutoUpdate(同系列 11/07)
- `/domino-news/posts/notes-view-navigator/` — LS 的 NotesViewNavigator
- `/domino-news/posts/java-recycle-memory/` — 每個 entry 要 recycle

## 外部來源（diversity:每語言 3 不重複 URL，各 33%）

1. ViewNavigator class (Java) — H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html
2. ViewEntry class (Java) — H_NOTESVIEWENTRY_CLASS_JAVA.html
3. View class (Java) — H_NOTESVIEW_CLASS_JAVA.html

## 標題候選

- [汰除] 純功能:`Java 的 ViewNavigator:走訪 view` — 目錄、無 hook。
- [汰除] 好處先行:`Java 讀大 view:ViewNavigator 三旋鈕` — 「三旋鈕」稍虛。
- [選定] 問題＋concept:`Java 的 ViewNavigator:讀大 view 要關 autoupdate、設 CacheSize`
  — 點出確切旋鈕、好搜、不過度承諾(goto vs get 留內文)。
  en 鏡像:`ViewNavigator in Java: for Big Views, Turn Off autoupdate and Set CacheSize`

## 驗證清單

- [x] map 缺口(ViewNavigator 缺 Java 旗)、與 java-view 區隔
- [x] 官方逐字(ViewNavigator / ViewEntry / View 三頁;前兩頁 14.5.1 非 404)
- [x] CacheSize(非 BufferMaxEntries)、goto vs get、IsAutoUpdate、entry type 查準
- [ ] coversClass: ViewNavigator + apiLang: java
- [ ] 3 不重複外部來源 < 40% / humanizer / temp-copy build
