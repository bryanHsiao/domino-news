---
title: "在 Java 裡迴圈跑 DocumentCollection：先拿下一份，再 recycle 這一份"
description: "LotusScript 裡跑一個 DocumentCollection，你 Set doc = coll.GetNextDocument(doc) 一路跑到底，從不想記憶體的事。搬到 Java，同一個迴圈跑上萬份文件會把 agent 記憶體吃垮——除非你在迴圈裡 recycle 每一份，而且順序不能錯：得先用當前這份拿到下一份、再 recycle 當前這份。這篇講 Java 版的正確迭代寫法：DocumentCollection 的 getFirstDocument/getNextDocument、刪除標記的 isValid、什麼時候該改用更省的 ViewNavigator，以及那個 LotusScript 從不需要煩惱的 recycle 順序。"
pubDate: 2026-08-16T07:30:00+08:00
lang: zh-TW
slug: java-collection-iteration
tags:
  - "Java"
sources:
  - title: "DocumentCollection class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS_JAVA.html"
  - title: "ViewNavigator class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html"
  - title: "Base.recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
---

LotusScript 裡跑一個文件集合，你大概是這樣寫的：`Set doc = coll.GetFirstDocument()`，然後 `Set doc = coll.GetNextDocument(doc)` 一路跑到底，中間完全不用想記憶體的事。同一段邏輯搬到 Java 版的 `lotus.domino`，迴圈長得幾乎一樣——但如果集合有上萬份文件，這個迴圈會把 agent 的記憶體吃垮。

差別在於：Java 裡每一份 `Document` 都是要手動回收的後端物件。迴圈要跑得穩，你得在裡面 [`recycle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) 每一份——而且**順序不能錯**。這篇講 Java 版的正確迭代寫法，以及什麼時候該改用更省的 `ViewNavigator`。

---

## 重點摘要

- **[`DocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS_JAVA.html) 用 `getFirstDocument` + `getNextDocument` 跑**：`getNextDocument(doc)` 傳當前這份、回下一份；集合本身維護一個 current pointer。
- **順序是關鍵**：要 `recycle` 當前這份之前，得先用它拿到下一份。反過來先 recycle，再 `getNextDocument(doc)` 就會拿一個已死的物件去要下一份。
- **刪除標記要濾**：用 `isValid` 判斷一份文件是真的（true）還是刪除標記（deletion stub，false）。
- **大量、只讀、跑 view 時改用 `ViewNavigator`**：官方說「goto 類方法優於 get 類方法」，因為 goto 不會建出 `ViewEntry` 物件；遠端時還能設 cache 大小來少跑 server。
- **這一切 LotusScript 都不用管**：LS 的記憶體是自動的，這個 recycle 順序是純 Java 的負擔。

---

## DocumentCollection：正確的迴圈長這樣

Java 的 `DocumentCollection` 提供 `getFirstDocument()`（回第一份、無參數）與 `getNextDocument`。`getNextDocument` 有兩種形式：無參數的 `getNextDocument()` 靠集合內部維護的 current pointer 往前走，帶參數的 `getNextDocument(Document doc)` 則是回「你指定這份的下一份」。

在需要 recycle 的迴圈裡，帶參數那種才安全，因為正確的寫法是這樣：

```java
Document doc = coll.getFirstDocument();
while (doc != null) {
    Document next = coll.getNextDocument(doc);  // 先用當前這份，拿到下一份
    // ... 處理 doc ...
    doc.recycle();                              // 再回收當前這份
    doc = next;
}
```

這裡的關鍵是**先拿下一份、再 recycle 當前這份**。如果你順序反了——先 `doc.recycle()`、再 `coll.getNextDocument(doc)`——你就是拿一個已經被回收、handle 已失效的物件去要下一份，輕則拿到錯的結果、重則丟例外。這個順序，就是從 LotusScript 過來的人最容易忽略的一顆雷：LS 裡你重用同一個 `doc` 變數、記憶體自動收，根本沒有「順序」這回事。

不 recycle 會怎樣？集合裡每一份 `Document` 都是背後連著 handle 的後端物件（這正是站上 [recycle() 那篇](/domino-news/posts/java-recycle-memory)講的坑）。跑一萬份、留一萬個沒收，記憶體就一路漲到垮。

## 刪除標記：isValid

跑集合時還有一個 LotusScript 也有、但值得在這裡提的細節：集合裡可能混著**刪除標記（deletion stub）**——一份已被刪除、只剩殘影的文件。官方建議用 `isValid` 濾掉它：一份文件是真的會回 true、是刪除標記會回 false。在迴圈裡先 `if (doc.isValid())` 再處理，可以避免對一個殘影做無意義的操作。

## 什麼時候改用 ViewNavigator

如果你要跑的是一個 **view**、而且只是要讀（不需要每一份完整的 `Document`），[`ViewNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html) 通常比一份份撈文件省得多。它「提供對 view 中全部或部分項目的存取」，能拿到分類、加總、以及 view 專屬的資訊（像某個項目有幾個 sibling），而不必把每一份文件都實體化。

有兩句官方說明很值得記：

> A goto method is favored over a get method for navigation-only purposes because a goto method does not create a ViewEntry object.

也就是說，如果你只是要「移動位置」而不需要那個項目本身，用 `gotoNext` 這類 goto 方法會比 `getNext` 省——因為 goto 不會替你建一個 `ViewEntry` 物件（又一個要收的後端物件）。

遠端（DIIOP）情境下還有一句：

> You can set the cache size and should set it to try to minimize server access.

`ViewNavigator` 會 cache 項目，設好 cache 大小能少跑幾趟 server。另外官方也提醒，把 `IsAutoUpdate` 設成 false——讓 view 不要在你跑一半時自動更新——能避免效能下降與項目失效。

當然，`ViewNavigator` 迭代出來的 `ViewEntry` 一樣是後端物件，一樣要在迴圈裡收，順序邏輯跟上面的 `Document` 迴圈一樣。

## 一個完整的例子

跑一個集合，濾掉刪除標記，逐份處理、逐份收：

```java
Document doc = coll.getFirstDocument();
while (doc != null) {
    Document next = coll.getNextDocument(doc);   // 先拿下一份
    if (doc.isValid()) {                         // 濾掉刪除標記
        // ... 處理這份文件 ...
    }
    doc.recycle();                               // 再收當前這份
    doc = next;
}
```

`next` 這個暫存變數不是可有可無——它就是讓你能安全地「先拿、後收」的關鍵。

## 同類別在其他語言

- **LotusScript**：`coll.GetFirstDocument` / `coll.GetNextDocument(doc)` 迴圈幾乎一模一樣，但你重用一個 `doc` 變數、記憶體自動收，沒有 recycle、更沒有「先拿後收」的順序問題。這是 LS 在批次處理上比 Java 省心的地方。
- **SSJS／XPages**：底層同一套 `lotus.domino`，迴圈寫法與 recycle 負擔跟 Java 完全一致；在 XPages 裡跑大集合尤其要記得收，否則吃的是伺服器的記憶體。想看在 Java 端直接操作資料結構的思路，站上有 [XPages 直接用 java.util.Vector 操作多值](/domino-news/posts/ssjs-vector-multivalue)。
