---
title: "Java 的 ViewEntryCollection:stampAll 一次改,FTSearch 窄化,集合運算組條件"
description: "你用 view.getAllEntries() 或 getAllEntriesByKey(key) 拿到一批照 view 排序的文件 entry,接下來要對它們做事:把某個欄位全部改成同一值、把範圍再用全文搜尋縮小、或把「A 查詢的結果」扣掉「B 查詢的結果」。第一反應是迴圈、每筆 getDocument 再 save——但 ViewEntryCollection 本身就有批次與集合運算:stampAll 一次改整批某個欄位、FTSearch 原地把集合窄化成符合的子集、intersect/merge/subtract 做交集聯集差集。這篇講這三招、getNthEntry 依位置取、以及走訪前要把 view 的 autoupdate 關掉(否則會 Entry not found in index)和每個 entry 要 recycle。"
pubDate: 2026-11-21T07:30:00+08:00
lang: zh-TW
slug: java-viewentrycollection
tags:
  - "Java"
sources:
  - title: "ViewEntryCollection class (Java)（stampAll/FTSearch/intersect/merge/subtract、Count、getNthEntry）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html"
  - title: "View class (Java)（getAllEntries / getAllEntriesByKey 取得 collection）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html"
  - title: "ViewEntry class (Java)（collection 裡每個 entry 的欄值與型別）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewEntryCollection"
apiLang: "java"
---

你用 `view.getAllEntries()` 或 `getAllEntriesByKey(key)` 拿到一批照 view 排序的文件 entry,接下來要對它們做事:把某個欄位全部改成同一個值、把範圍再用全文搜尋縮小、或把「A 查詢的結果」扣掉「B 查詢的結果」。

第一反應是走迴圈,每筆 `getDocument()` 再 `replaceItemValue` 再 `save`。可以,但 [`ViewEntryCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html) 本身就有批次與集合運算,很多情況一行就夠。官方定義它是「Represents a collection of view entries of type document sorted in view order.」——注意「of type document」:它只含文件列,沒有 category 或 total 列。

這篇講 stampAll、FTSearch、集合運算三招,以及走訪的兩個邊界。

---

## stampAll:一次改整批的某個欄位

要把一批 entry 背後的文件某個欄位全部設成同一值,不用自己迴圈 save——`stampAll` 一行搞定。官方「Replaces the value of a specified item in the documents of all the entries in a view entry collection.」:

```java
view.setAutoUpdate(false);
ViewEntryCollection vec = view.getAllEntriesByKey("Pending");
vec.stampAll("Status", "Processed");   // 整批 Status 設成 Processed
```

跟 `NotesDocumentCollection` 的 stampAll 是同一招,只是來源是 view entry 的集合。要把一批照某個 key 選出來的文件統一改狀態、蓋處理時間,這比迴圈乾淨得多。

## FTSearch:把集合原地窄化

拿到一個 collection 之後,還能再用全文搜尋把它縮小。`FTSearch` 官方「Conducts a full-text search on all entries in a view entry collection and filters the collection.」——它是**原地**的:搜完之後,這個 collection 就只剩符合查詢的那些 entry(前提是資料庫有全文索引)。搜完的查詢字串會留在 `Query` 屬性裡。

```java
ViewEntryCollection vec = view.getAllEntries();
vec.FTSearch("urgent");     // vec 現在只剩內文含 urgent 的
```

## 集合運算:組合兩個查詢

這是 ViewEntryCollection 比 DocumentCollection 更順手的地方——`intersect` / `merge` / `subtract` 讓你把兩批結果組起來:

- `intersect`——交集,只留同時也在另一批的。
- `merge`——聯集,把另一批併進來。
- `subtract`——差集,把另一批移除。

要「今年的訂單裡,排除已經歸檔的」這種組合條件,先各自選出兩批、再 `a.subtract(b)`,比寫一條複雜 key 或公式乾淨。要依位置取第幾筆用 `getNthEntry(n)`(在 view 排序下),要數量用 `Count`(屬性,不是方法)。每個 entry 裡的欄值怎麼讀(不開文件),見 [ViewEntry](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html) 的說明。

## 兩個邊界:autoupdate 與 recycle

走訪或批次操作一個 collection 前,**先把 [`view`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html) 的 `setAutoUpdate(false)`**。官方警告自動更新會降效、還會讓你手上的 entry 失效,報「Entry not found in index」——你一邊處理、別人一邊改 view,就中這個。需要最新資料自己 `refresh`。

另外在 Java 裡,collection 走訪出來的每個 `ViewEntry` 用完都要 `recycle()`,否則大集合會把 C 層 handle 累爆;紀律見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-recycle-memory/)。要懶走訪一個超大 view(含 category 列、要效能旋鈕),那是 `ViewNavigator` 的場,見 [Java 的 ViewNavigator 那篇](/domino-news/posts/java-viewnavigator/)。

## 同類別在其他語言

同一個 `ViewEntryCollection`:

- **LotusScript**:`NotesViewEntryCollection`,`StampAll` / `FTSearch` / `Intersect` / `GetNthEntry` 都在,行為一致但不用 recycle;見 [NotesViewEntry 那篇](/domino-news/posts/notes-view-entry/)。
- **SSJS / XPages**:`NotesViewEntryCollection`,同樣的 stampAll / 集合運算;生命週期由 request 管不用 recycle。DocumentCollection 版的批次操作見 [SSJS 的 DocumentCollection 那篇](/domino-news/posts/ssjs-documentcollection/)。
- **Java 專屬的**不是 API(方法共用),而是記憶體紀律:`stampAll` / 集合運算雖然是一行,但如果你改走逐筆迴圈,每個 entry 都要自己 recycle——強型別不會提醒你這件事。
