---
title: "XPages 導覽分類視圖:先關掉父 view 的 IsAutoUpdate,不然 navigator 會壞"
description: "XPages 要走一個分類視圖:建一棵分類樹、把某個分類底下的文件撈出來、或快速算某分類有幾筆。你用 ViewNavigator。但有個會讓它「Entry not found in index」當掉的坑:父 view 的 IsAutoUpdate 一旦是 true,navigator 的 cache 會被關掉、child 物件還可能失效——官方要你明確設成 false。另外 get 和 goto 是兩回事:goto 只移動指標、不建 ViewEntry,純導覽/計數時用 goto 快很多。這篇講怎麼建(全選 vs 從分類)、get vs goto、IsAutoUpdate 這刀、分類怎麼走、以及 CacheSize/MaxLevel 的真實上限。"
pubDate: 2026-11-29T07:30:00+08:00
lang: zh-TW
slug: ssjs-viewnavigator
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesViewNavigator (JavaScript)（get vs goto、IsAutoUpdate 影響、CacheSize/MaxLevel）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator.html"
  - title: "createViewNavFromCategory (NotesView - JavaScript)（從一個分類建 navigator,分類本身不含）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View_createViewNavFromCategory.html"
  - title: "getNext (NotesViewNavigator - JavaScript)（get 會建 ViewEntry,對照 gotoNext 回 boolean）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator_getNext.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewNavigator"
apiLang: "ssjs"
---

XPages 要走一個**分類視圖**:建一棵分類樹給使用者展開、把某個分類底下的文件撈出來、或快速數某分類有幾筆。你用 [`ViewNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator.html) —— 官方「provides access to all or a subset of the entries in a view.」。

但有個會讓它直接「Entry not found in index」當掉的坑,跟 navigator 本身無關,而在**父 view**:只要 `IsAutoUpdate` 是 true,navigator 的 cache 會被關掉、底下的 entry 物件還可能失效。官方明講要你把它設成 false。另外 `get` 跟 `goto` 是兩回事 —— 純導覽/計數用 `goto` 快很多。

這篇講怎麼建(全選 vs 從分類)、`get` vs `goto`、`IsAutoUpdate` 這刀、分類怎麼走、以及 `CacheSize` / `MaxLevel` 的真實上限。

---

## 怎麼建:全選 vs 從分類

navigator 從 `NotesView` 建,幾個常用的:

- `view.createViewNav()` —— 官方「Creates a view navigator for all entries in a view.」,全部 entry。空 view 就得到空 navigator,「All navigation methods return null.」。
- [`view.createViewNavFromCategory(categoryName)`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View_createViewNavFromCategory.html) —— 只要某個分類底下的 entry。兩個細節:官方「The category entry itself is excluded.」(**分類那一列本身不含在內**);巢狀分類用反斜線,例如 `"Asia\\Korea"`。
- `createViewNavFromChildren(entry)` / `createViewNavFromDescendants(entry)` —— 綁在某個 entry 上,分別是「直接子代」和「全部後代」。
- `createViewNavMaxLevel(level)` —— 只到某一層。

在 XPages 做「某分類的清單」或「可展開的樹」,`createViewNavFromCategory` 通常是最省的入口 —— 不用把整個 view 拉進來。

## get vs goto:只導覽就用 goto

這是效能關鍵。官方類別頁白紙黑字:「A `goto` method is favored over a `get` method for navigation-only purposes because a `goto` method does not create a NotesViewEntry object.」

- [`getNext()`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator_getNext.html) 回一個 `NotesViewEntry`(沒有就 null),並移動指標 —— 你要讀 entry 的欄位才用它。
- `gotoNext()` 回 `boolean`(true/false),只移動指標、**不建 ViewEntry 物件**。

```javascript
// 只是要數 / 定位到第 N 筆 → 用 goto，不浪費在建 entry
var nav:NotesViewNavigator = view.createViewNav();
nav.gotoFirst();
var n = 0;
while (nav.gotoNext()) { n++; }        // 只移動指標，不建 ViewEntry

// 要讀欄位 → 才用 get
var e:NotesViewEntry = nav.getFirst();
while (e != null) {
  print(e.getColumnValues().get(0));
  e = nav.getNext();                   // get 會建 ViewEntry
}
```

一個 navigator 維護一個「current pointer」(官方:「the most recent entry you get or go to」),get 和 goto 都在動這個指標。純計數、純跳位用 goto,省掉一堆 ViewEntry 的建立成本。

## 招牌坑:父 view 的 IsAutoUpdate 要關

這是最會咬人的一刀,而且症狀嚇人。官方類別頁:

- 「A refresh of the parent view affects the view navigator.」—— navigator 跟父 view 綁在一起。
- 「The cache is turned off if IsAutoUpdate is true for the parent view; caching is resumed if IsAutoUpdate is set to false.」—— 父 view `IsAutoUpdate` 為 true 時,**navigator 的 cache 直接被關掉**。
- 「Automatic updates degrade performance and may invalidate entries in child objects ("Entry not found in index").」—— 自動更新不只慢,還可能讓底下的 entry **失效**,丟出那句惡名昭彰的 `Entry not found in index`。

所以官方的建議很直接:「Avoid automatically updating the view by explicitly setting IsAutoUpdate to false especially if the view is a base for navigators or entry collections.」—— 拿 view 當 navigator 的底之前,先 `view.setAutoUpdate(false)`。在 XPages 裡 view 常常是即時的,這刀特別容易中:走到一半資料被更新、指標指向的 entry 不見了,就炸 `Entry not found in index`。

## 分類視圖怎麼走

分類視圖的結構:官方「In a categorized view, documents are children of categories.」—— 文件是分類的子代。走法:

- `getFirst()` 從頂層開始(第一層通常是分類列);`getChild(entry)` 往下進一個 entry 的子代(「Returns the first child」,沒有就 null);`getNextSibling(entry)` 走同層的下一個。
- 判斷現在停在哪種列:`entry.isCategory()` / `entry.isDocument()` / `entry.isTotal()`。官方:「A child of a category entry can be a category or document entry.」(分類底下可能還是分類)。
- 只要文件、想跳過分類列:`getFirstDocument()` ——「skipping any category entries.」。
- 有總計時:「the grand total is considered a category entry, and getLast returns that entry.」,小計「available in the columnValues of category entries.」。

建一棵樹的典型邏輯就是:先試 `getChild`、沒有子代就試 `getNextSibling`、再沒有就往上一層試 sibling。

## CacheSize / MaxLevel:真實上限

- `CacheSize` ——「The size of the navigator cache in view entries.」,**0(不快取)到 128(預設上限)**。注意官方:`createViewNav` 的 cacheSize 參數「Applies only to remote (IIOP) operations.」—— 快取主要是**遠端(IIOP)**才有意義;本機 / 伺服器端代理用處有限。
- `MaxLevel` ——「The navigator's maximum level of navigation.」,**0(頂層)到 30(預設)**。但「The maximum cannot be less than the minimum implied by the navigator type」—— 從 children / descendants 建的 navigator,MaxLevel 不能低於它本身隱含的層數。
- 還有一個 cache 細節:「Methods that navigate using the current pointer take advantage of the cache while methods that navigate relative to a specified entry do not.」—— 用 current pointer 走(`getNext()`)吃得到 cache,帶明確 entry 走(`getNext(entry)`)吃不到。

## 同類別在其他語言

同一個 `ViewNavigator`:

- **LotusScript**:`NotesViewNavigator`,`CreateViewNav` / `CreateViewNavFromCategory`、`GetNext` / `GotoNext`、`CacheSize` / `MaxLevel` 全在,一樣「goto 不建 entry」「父 view 要關 AutoUpdate」。
- **Java**:`ViewNavigator`,同樣的 API + recycle(每個 entry 用完 recycle);完整版見 [Java 的 ViewNavigator 那篇](/domino-news/posts/java-viewnavigator/)。
- **SSJS 專屬的**不是 API(方法共用),而是場景:XPages 裡 view 預設即時,拿它當 navigator 的底時 `setAutoUpdate(false)` 幾乎是必做;而且 XPages 不用手動 recycle 每個 entry。「IsAutoUpdate 關掉」+「純導覽用 goto」這兩條,是 XPages 用 navigator 不炸、不慢的關鍵。
