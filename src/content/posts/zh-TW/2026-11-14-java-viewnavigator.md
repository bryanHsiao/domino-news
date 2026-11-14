---
title: "Java 的 ViewNavigator:讀大 view 要關 autoupdate、設 CacheSize"
description: "一個十幾萬筆的 view,你在 Java 要走過每一列做點事。用 getAllDocuments 會先把整批拉進記憶體,大 view 直接撐爆。ViewNavigator 不一樣——它沿著 view 的索引一列一列走,拿到的是 ViewEntry(索引層的 row 資料),不必逐筆開 Document。但要它真的快,有三個旋鈕得自己調:把 IsAutoUpdate 設成 false(背景自動更新會降效、還會讓 navigator 手上的 entry 失效),遠端操作時設 CacheSize 減少 server 往返,還有只需要移動指標、計數時用 goto 系列而不是 get 系列(官方明說 goto 不會建立 ViewEntry 物件)。這篇講怎麼建對走訪範圍、這三個效能旋鈕,以及走訪時每個 entry 要 recycle 的記憶體紀律。"
pubDate: 2026-11-14T07:30:00+08:00
lang: zh-TW
slug: java-viewnavigator
tags:
  - "Java"
sources:
  - title: "ViewNavigator class (Java)（createViewNav* 家族、CacheSize、goto vs get、IsAutoUpdate）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html"
  - title: "ViewEntry class (Java)（ColumnValues、document/category/total 三種 entry）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html"
  - title: "View class (Java)（createViewNav 等建立 navigator 的方法）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewNavigator"
apiLang: "java"
---

一個十幾萬筆的 view,你在 Java 要走過每一列做點事。直覺是 `view.getAllDocuments()` 一把抓——然後大 view 直接把你的 heap 撐爆,因為它會先把整批文件拉進記憶體。

[`ViewNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html) 走的是另一條路。官方定義「Represents a view navigator. A view navigator provides access to all or a subset of the entries in a view.」——它沿著 view 的索引一列一列走,每一列是一個 `ViewEntry`,拿的是索引層的 row 資料,不必逐筆把 Document 開出來。對大 view,這是能走得完的那種讀法。

但「用了 ViewNavigator」不等於「快」。要它真的快,有三個旋鈕得自己調。這篇講怎麼建對走訪範圍、那三個效能旋鈕,以及走訪時的記憶體紀律。

---

## 先建對範圍

ViewNavigator 從 [`view`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html) 建,而且你可以只框住要的那一塊,不必每次都全表:

- `createViewNav()`——整個 view。
- `createViewNavFromCategory("2026/Q4")`——某個分類底下。
- `createViewNavFromChildren(entry)` / `createViewNavFromDescendants(entry)`——某列的直接子代 / 所有後代(處理階層式 view 時用)。
- `createViewNavMaxLevel(n)`——只到第 n 層,把深階層壓平。
- `createViewNavFromAllUnread()`——所有未讀。

範圍框得越小,要走的 entry 越少。別動不動 `createViewNav()` 全表再自己過濾。

## 三個效能旋鈕

這是這篇的重點——預設設定對大 view 並不友善,三個地方要自己動手:

**1. `IsAutoUpdate` 設成 false。** 官方直說自動更新會「degrade performance and may invalidate entries in the navigator」。也就是:你一邊走訪、別人一邊改這個 view,預設的自動更新不只拖慢你,還可能讓你手上的 entry 失效。走訪前先關掉,需要最新資料時自己呼叫 refresh。這跟 [Java 讀 View 那篇](/domino-news/posts/java-view/) 關 `setAutoUpdate(false)` 是同一個道理。

**2. 遠端操作設 `CacheSize`。** 官方寫「ViewNavigator caches entries」,而且「You can set the cache size and should set it to try to minimize server access.」。當你的 Java 是透過遠端(IIOP)連 server,navigator 會快取 entry;把 CacheSize 設大一點,一次抓多列、減少來回的網路往返。本機 agent 跑在 server 上時這點影響小,遠端 client 時影響很大。

**3. 只走訪就用 `goto`,別用 `get`。** 這個很多人不知道:官方明寫「a goto method does not create a ViewEntry object」。`getNext()` 會幫你建一個 `ViewEntry` 物件(有成本、之後還要 recycle);但如果你只是要移動指標、算數量、找到某個位置,用 `gotoNext()` / `gotoFirst()` 就好,它只移動指標、不建物件。需要讀欄值時才用 `get`。

## 讀欄值與三種 entry

走訪拿到的 `ViewEntry`,它的 [`ColumnValues`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html) 官方定義是「The value of each column in the view entry.」——就是這一列在 view 裡每一欄的值,來自索引,讀它不必把背後的 Document 開出來。這正是 ViewNavigator 省事的地方:要顯示的資料如果 view 欄位裡都有,整趟走訪一份文件都不用開。

但有個要判斷的地方:view 裡的列不是只有文件。官方說 entry 有三種——document、category、total。走分類式 view 時,你會走到 category 列和 total 列;用 `isDocument()` / `isCategory()` 判斷,別把分類列當文件去抓它的 UNID。

## 每個 entry 都要 recycle

ViewNavigator 最容易爆記憶體的地方,正是你用 `get` 取出的那些 `ViewEntry`。走一個大 view,如果每個 `getNext()` 建出來的 entry 都不 recycle,C 層的 handle 會一路累積到爆。標準做法是在迴圈裡 recycle 掉上一個 entry:

```java
ViewNavigator nav = view.createViewNav();
nav.setCacheSize(400);
view.setAutoUpdate(false);
ViewEntry entry = nav.getFirst();
while (entry != null) {
    if (entry.isDocument()) {
        java.util.Vector<?> cols = entry.getColumnValues();   // 索引層欄值,不開文件
        // …用 cols…
    }
    ViewEntry next = nav.getNext(entry);   // 先拿下一個
    entry.recycle();                       // 再回收這一個
    entry = next;
}
nav.recycle();
```

完整的 recycle 紀律(為什麼要先拿 next 再 recycle current)見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-recycle-memory/)。

## 同類別在其他語言

同一個 `ViewNavigator`:

- **LotusScript**:`NotesViewNavigator`,`CreateViewNav` 家族、`GetFirst` / `GetNext`、`CacheSize`、`AutoUpdate` 都在,行為一致但不用 recycle;完整用法見 [NotesViewNavigator 那篇](/domino-news/posts/notes-view-navigator/)。
- **SSJS / XPages**:`NotesViewNavigator`,同樣的建立與走訪;在 XPages 裡常拿來自己控制階層式資料的展開,生命週期由 request 管。
- **Java 專屬的**不是 API(方法共用),而是:`goto` 不建 `ViewEntry` 物件這個效能差別,在強型別、要手動 recycle 的 Java 裡最有感——走大 view 時,該用 `goto` 卻用了 `get`,等於白白建了一堆要回收的物件。
