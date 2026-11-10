---
title: "XPages 的 ViewEntry:用 getColumnValues 讀 view,不開每份文件"
description: "在 XPages 你要列一批資料——一個 typeahead 清單、一段 JSON、一個自訂的 repeat。資料都在某個 view 的欄位裡。直覺是走訪 view、每一列 getDocument 再讀欄位,但那等於把每份文件都開一次,大 view 很慢。NotesViewEntry 讓你直接讀索引層的欄值:getColumnValues 回的是這一列在 view 裡每一欄的值,整趟可以一份文件都不開。這篇講在 XPages 怎麼拿 ViewEntry、getColumnValues 怎麼用、一個容易混淆的點(getAllEntries 回的集合只含 document 列,分類列要改用 ViewNavigator),以及 XPages 不像 Java 要自己 recycle。"
pubDate: 2026-11-15T07:30:00+08:00
lang: zh-TW
slug: ssjs-viewentry
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesViewEntry (JavaScript)（ColumnValues、document/category/total 三型別、Document/IsCategory）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntry.html"
  - title: "NotesViewEntryCollection (JavaScript)（getAllEntries;只含 document 列;Count/getFirstEntry）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntryCollection.html"
  - title: "NotesView (JavaScript)（getAllEntries / getEntryByKey 等取得 entry 的方法）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewEntry"
apiLang: "ssjs"
---

在 XPages 你要列一批資料——一個 typeahead 清單、一段要回給前端的 JSON、一個自訂樣式的 repeat。要顯示的欄位,其實某個 view 裡都排好了。直覺的寫法是走訪那個 view、每一列 `getDocument()` 再 `getItemValueString(...)`。

問題是那樣等於把每份文件都開一次。一個欄位要顯示的清單有幾千列,你就開幾千份文件——大 view 會明顯慢。而這些值其實在 view 的索引裡就有了,根本不必開文件。

讀索引層欄值的那個東西,就是 [`NotesViewEntry`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntry.html)。官方定義「A view entry describes a row in a view.」——它代表 view 裡的一列,`getColumnValues` 直接給你這一列每一欄的值。這篇講在 XPages 怎麼拿 ViewEntry、欄值怎麼讀、一個容易混淆的集合差別,以及 recycle 的事。

---

## 拿 entry 與讀欄值

在 XPages 後端,最常見的取法是從 view 拿一整個集合 [`getAllEntries`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View.html),再一列一列走:

```javascript
var view = database.getView("byCustomer");
var col = view.getAllEntries();           // NotesViewEntryCollection
var entry = col.getFirstEntry();
var out = [];
while (entry != null) {
    var vals = entry.getColumnValues();   // 這一列每一欄的值(索引層,不開文件)
    out.push({ name: vals[0], total: vals[2] });
    var next = col.getNextEntry(entry);
    entry = next;
}
```

`getColumnValues` 回的是官方說的「The value of each column in the view entry.」——照 view 欄位的順序排好的一個陣列,`vals[0]` 是第一欄、`vals[2]` 是第三欄。要顯示的東西如果 view 欄位裡都有,整趟走訪一份文件都不用開。真的需要背後的文件(例如要讀 view 沒放的欄位)才 `entry.getDocument()`,那時才付開文件的成本。

## 一個容易混淆的點:集合只含 document 列

這裡有個很多人被咬過的細節。`getAllEntries` 回的 [`NotesViewEntryCollection`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntryCollection.html),官方定義是「Represents a collection of view entries **of type document** sorted in view order.」——**它只含 document 列**。

但一個 view 的列其實有三種:document、category、total。如果你的 view 是分類式的、你想連 category 列(分類標題)一起處理——`getAllEntries` 給不了你,它把 category 和 total 都濾掉了。要走到 category 列,得改用 `ViewNavigator`,它會給你全部三種;那時用 `isCategory()` / `isDocument()` 判斷每一列是哪種。ViewNavigator 的走訪與效能,見 [Java 的 ViewNavigator 那篇](/domino-news/posts/java-viewnavigator/)(SSJS 的 `NotesViewNavigator` 建立與走訪方式一樣)。

一句話記法:**要清單(只要文件列)用 `getAllEntries`;要連分類標題一起處理,用 ViewNavigator。**

## XPages 不用自己 recycle

如果你讀過 Java 版的走訪,會記得每個 `ViewEntry` 用完都要 `recycle()`,否則 C 層 handle 爆掉。**在 XPages 的 SSJS 裡不用**——這些物件的生命週期由 XPages request 管,request 結束時一起收。你專心把走訪寫對就好。

但有一點仍要注意:大 view 的整趟走訪是個重操作,別把它掛在每次 partial refresh 都會重跑的路徑上。放進明確的事件、或把結果快取起來,跟所有貴的後端操作一樣。

## 同類別在其他語言

同一個 `ViewEntry`:

- **LotusScript**:`NotesViewEntry`,`ColumnValues`、`GetDocument`、`IsCategory` 都在,行為一致。
- **Java**:`ViewEntry`,API 相同,但每個 entry 用完要手動 `recycle()`;走大 view 的效能細節(`goto` vs `get`、CacheSize)見 [Java 的 ViewNavigator 那篇](/domino-news/posts/java-viewnavigator/)。
- **SSJS 專屬的**不是 API(方法共用),而是**在 XPages 怎麼用**:直接讀 `getColumnValues` 組 typeahead / JSON 不開文件、生命週期由 request 管不用 recycle,還有別把大 view 走訪掛在 partial refresh 的路徑上。
