---
title: "SSJS 的 DocumentCollection:stampAll 一次改全部,removeAll 一次刪全部"
description: "在 SSJS 從 search、FTSearch、或 view 依 key 查,拿到的是一個 NotesDocumentCollection。要對這一堆文件做事,第一反應是 getFirstDocument / getNextDocument 迴圈;但 collection 本身有批次操作:stampAll 一次把某個欄位改成同一值、removeAll 一次把整批永久刪掉,一行搞定、不用迴圈。威力很大,removeAll 尤其——它會精準地照你說的刪,而且是永久的。這篇講在 SSJS 怎麼拿到並走訪 collection(含 Count 是屬性不是 getCount 的小坑)、stampAll / removeAll 兩個批次招式與它們的風險、怎麼用 FTSearch 和 intersect/merge/subtract 組合 collection,以及這些操作用誰的權限跑。"
pubDate: 2026-11-09T07:30:00+08:00
lang: zh-TW
slug: ssjs-documentcollection
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesDocumentCollection (JavaScript)（走訪、Count、stampAll / removeAll / FTSearch / intersect）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DocumentCollection.html"
  - title: "NotesDatabase (JavaScript)（search / FTSearch 回傳 NotesDocumentCollection）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Database.html"
  - title: "Global objects and functions (JavaScript)（database 全域）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html"
relatedJava: []
relatedSsjs: []
coversClass: "DocumentCollection"
apiLang: "ssjs"
cover: "/covers/ssjs-documentcollection.webp"
coverStyle: "art-deco"
---

你在 SSJS 跑了一個 `database.search("Form = 'Order' & Status = 'Pending'")`,拿到一堆待處理訂單,現在要把它們全部標成「已處理」。第一反應:`getFirstDocument` / `getNextDocument` 一路跑,每份 `replaceItemValue` 再 `save`。

可以,但 [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DocumentCollection.html) 本身就有批次招式——**`stampAll` 一次把整批文件的某個欄位改成同一個值,一行、不用迴圈、不用逐份 save**:

```javascript
col.stampAll("Status", "Processed");   // 整個 collection 的 Status 都設成 Processed
```

而它還有一個更兇的兄弟:**`removeAll` 一次把整批文件永久刪掉**。威力很大,但 `removeAll` 尤其要小心——它會精準照你給的 collection 刪,而且是**永久的**。這篇就講怎麼拿到並走訪一個 collection、這兩個批次招式與風險、怎麼組合 collection,以及它們用誰的權限跑。

---

## 拿到與走訪:Count 是屬性,不是 getCount

SSJS 裡,[`database`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) 全域的 [`search(formula)` / `FTSearch(query)`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Database.html)、或 `view.getAllDocumentsByKey(key)`,回的都是 `NotesDocumentCollection`——官方定義就是「Represents a collection of documents from a database」。走訪照舊:

```javascript
var col = database.search("Form = 'Order'");
var doc = col.getFirstDocument();
while (doc != null) {
    // 處理 doc…
    doc = col.getNextDocument(doc);
}
```

一個小坑:**要數量是 `col.Count`(屬性)、不是 `getCount()`**。官方頁列的是 `Count` 這個唯讀屬性,沒有 `getCount` 方法——在 SSJS 寫 `col.getCount()` 會錯。要跳到第幾筆用 `getNthDocument(n)`。

## 兩個批次招式:stampAll 與 removeAll

這才是 collection 比「自己迴圈」值得學的地方——**不用把文件一份份拉出來、也不用逐份 save**:

- **`stampAll(itemName, value)`**:官方「Replaces an item's value in every document in the collection」。整個 collection 的某個欄位一次設成同一值。要把一批訂單全標成已處理、或蓋上處理時間,一行就好。
- **`removeAll`**:官方「Permanently deletes the collection's documents from the database」。整批**永久刪除**。

`removeAll` 的風險很具體:它刪的是**你手上這個 collection**——如果你的 search 公式寫太寬、或 collection 不是你以為的那批,它會一聲不響地把多的也刪掉,而且救不回來。動 `removeAll` 前,先用 `Count` 和抽查幾筆確認這個 collection 真的是你要刪的那批。

## 組合 collection:FTSearch 窄化、集合運算

拿到一個 collection 後,還能再加工:

- **`FTSearch(query)`**:對**現有** collection 再做一次全文搜尋、把它窄化成符合的子集(前提是有全文索引)。
- **`intersect` / `merge` / `subtract`**:集合運算——保留同時也在另一批的(交集)、把另一批併進來(聯集)、把另一批移除(差集)。要「A 查詢的結果裡,排除 B 查詢的」這種組合條件,比寫一條複雜公式乾淨。

## 誰的權限?stampAll / removeAll 都受 ACL 管

這些批次操作在 SSJS 裡走的是**當前使用者**的憑證——`stampAll` 改得動、`removeAll` 刪得掉,前提是這個使用者對那些文件有足夠權限(作者/編輯/刪除權)。一個一般使用者用 `removeAll` 刪不掉他沒權限的文件,這是對的。反過來,如果你要以更高權限做批次維護(例如清一批稽核紀錄),就得從 `sessionAsSigner.getDatabase(...)` 取庫再 search——這套 SSJS 權限模型見 [XPages 的 database 用誰的權限開](/domino-news/posts/ssjs-database/)。

另外在 XPages 裡,跑一個大 collection(尤其是迴圈逐份處理)別掛在每次 partial refresh 的路徑上——跟所有貴的後端操作一樣,放進事件、必要時快取。collection 的生命週期由 XPages request 管,你不像 Java standalone 那樣需要自己 recycle。

## 同類別在其他語言

同一個 `NotesDocumentCollection`:

- **LotusScript**:`NotesDocumentCollection`,`StampAll` / `RemoveAll` / `Intersect` 都在;LS 側的完整用法見 [NotesDocumentCollection 那篇](/domino-news/posts/notes-document-collection/)。
- **Java**:`DocumentCollection`,方法同名——但多一件事:collection、每份 document 用完要 `recycle()`。
- **SSJS 專屬的**不是 API(方法共用),而是**在 XPages 裡怎麼用**:批次操作走使用者權限、要提權走 `sessionAsSigner`、大 collection 別掛在 render path,而且不用自己 recycle。
