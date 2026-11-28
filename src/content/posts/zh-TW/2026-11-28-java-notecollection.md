---
title: "Java 的 NoteCollection:先設條件再 buildCollection,連 form、view 都選得到"
description: "DocumentCollection 只選得到文件。但你要盤點一個庫的設計元件、把一批 form/view/agent 連文件一起匯出成 DXL、或依建立時間選一批 note——這要用 NoteCollection,它連設計 note 都選得到。用法是兩步驟:先把 Select* 條件、SelectionFormula、SinceTime 設好,再呼叫 buildCollection() 編譯——不 build,collection 就是空的、不能用。還有一個迭代坑:getNextNoteID 不是無參數的,你要把『目前這個 note id』傳進去。這篇講 NoteCollection 跟 DocumentCollection 差在哪、兩步驟模型、怎麼選、怎麼走訪、note id 怎麼變回文件。"
pubDate: 2026-11-28T07:30:00+08:00
lang: zh-TW
slug: java-notecollection
tags:
  - "Java"
sources:
  - title: "NoteCollection class (Java)（設計+資料元件、兩步驟、Select* / SelectionFormula / SinceTime）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS_JAVA.html"
  - title: "buildCollection (NoteCollection - Java)（不 build 就不能用）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUILDCOLLECTION_METHOD_NC_JAVA.html"
  - title: "getFirstNoteID / getNextNoteID (NoteCollection - Java)（getNextNoteID 要傳當前 id）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTNOTEID_METHOD_NC_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "NoteCollection"
apiLang: "java"
cover: "/covers/java-notecollection.webp"
coverStyle: "photoreal-3d"
---

`DocumentCollection` 只選得到文件。但你有時要的不只是文件:盤點一個庫有哪些設計元件、把一批 form / view / agent **連文件一起**匯出成 DXL、或「只要建立時間在某天之後的那些 note」。這要用 [`NoteCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS_JAVA.html) —— 官方定義「Represents a collection of Domino design and data elements in a database.」,**連設計 note 都選得到**。

用法是兩步驟:先把條件設好,再 `buildCollection()` 編譯。不 build,collection 就是空的、不能用。而且走訪時還有個坑:`getNextNoteID` 不是無參數的,你得把「目前這個 note id」傳進去。

這篇講它跟 `DocumentCollection` 差在哪、兩步驟模型、怎麼選、怎麼走訪、note id 怎麼變回文件。

---

## NoteCollection vs DocumentCollection:它連設計元件都選

兩個都是「一堆 note 的集合」,差在**選得到什麼**:

- `DocumentCollection` ——「a collection of documents」,只有資料文件。
- `NoteCollection` ——「design and data elements」,**文件 + 設計元件(form、view、agent、folder、image resource…)都可以**。

所以要做「設計盤點」「選擇性 DXL 匯出(把特定設計連資料一起帶走)」「依建立時間篩 note」這些,`NoteCollection` 才辦得到。它是 Release 6.5 才有的,由 `Database` 建立。

## 兩步驟:先設條件、再 buildCollection

這是用這個類別的核心節奏。`Database.createNoteCollection(selectallflag)` 建一個空殼,參數官方:「Sets all the "Select" note collection properties true or false.」—— 給 `false` 代表「先全部不選」,之後再 opt-in 你要的;給 `true` 代表「先全選」。

```java
NoteCollection nc = db.createNoteCollection(false);  // 先全不選
nc.setSelectForms(true);        // 要 form
nc.setSelectViews(true);        // 要 view
nc.setSelectDocuments(true);    // 也要資料文件
nc.buildCollection();           // ← 編譯，沒這行 collection 不能用
```

[`buildCollection()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUILDCOLLECTION_METHOD_NC_JAVA.html) 官方寫得很白:「You must build the collection before it is usable.」、而且「The built collection contains the database notes determined by the current values of SelectionFormula, SinceTime, and the Select properties.」—— **build 的那一刻,才把當下的條件結算成實際的 note。** 忘了 `buildCollection()`,症狀就是「collection 永遠 0 筆」。要重設條件重選,就用 `clearCollection()`(官方:「Clears (invalidates) a note collection build.」)再重設、重 build。

## 怎麼選:Select 旗、selectAllDesignElements、SelectionFormula、SinceTime

- **個別 Select 旗** —— `setSelectDocuments` / `setSelectForms` / `setSelectViews` / `setSelectAgents` … 一個一個開。其中 `SelectDocuments`(資料文件)、`SelectProfiles`(profile 文件)官方標注「Not in a selectAll group」,是要個別設的資料旗。
- **整組開** —— `selectAllDesignElements(true)` 一次把一大票設計旗(form / view / agent / folder / image / page…)打開,不用一個一個設。
- **SelectionFormula** —— 一條 formula 字串當篩子,官方:「Formula that selects notes for inclusion in the collection.」、「must be a valid Domino formula that evaluates to True (includes the note) or False (excludes the note)」。關鍵一句:「It intersects the other selection criteria.」—— 它**跟其他條件取交集**,不是獨立一套。初始是空字串 = 全選。
- **SinceTime** —— 注意是**建立時間**,不是修改時間。官方:「Indicates the earliest note creation time in the collection.」、「excluding notes created prior to this time.」。預設沒設日期時不生效。想做「某天後新建的 note」才用它 —— 別誤以為它篩的是「改過的」。

## 招牌坑:getNextNoteID 要把當前 id 傳進去

走訪的寫法跟 `getNextDocument()` 不一樣。`getFirstNoteID()` 無參數、回第一個 note id 字串;但 [`getNextNoteID(noteid)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTNOTEID_METHOD_NC_JAVA.html) **要你把「目前這個 id」當參數傳進去**,它才回下一個:

```java
String id = nc.getFirstNoteID();
while (id.length() > 0) {                 // 沒下一個時回「長度 0 的字串」
  Document doc = db.getDocumentByID(id);  // note id → 文件
  System.out.println(id + "  " + doc.getItemValueString("Form"));
  id = nc.getNextNoteID(id);              // ← 要把當前 id 傳回去
}
```

兩個官方細節:「If no next note exists, this method returns a string of length 0.」(用長度 0 判斷結束,不是 null)、「This method throws an exception if the parameter is an invalid note ID.」(傳錯 id 會丟例外)。如果你照 `getNextDocument()` 的習慣寫成無參數呼叫,根本編不過 —— 這個坑在改寫既有迴圈時最常中。

## note id → 文件,以及餵 DXL

拿到的是 note id 字串,用 `database.getDocumentByID(id)` 變回 `Document`(官方:「Finds a document in a database, given the document note ID.」)。

一個常見下游:`NoteCollection` 很適合當**選擇性 DXL 匯出**的輸入 —— 你用它精準選出「這些設計 + 這些資料」,再交給 DxlExporter 匯出成一份 DXL。DXL 匯出/匯入本身的坑見 [DXL exporter / importer 那篇](/domino-news/posts/java-dxl-exporter-importer/)。

## 同類別在其他語言

同一個 `NoteCollection`:

- **LotusScript**:`NotesNoteCollection`,`CreateNoteCollection`、`BuildCollection`、`GetFirstNoteID` / `GetNextNoteID`、`SelectionFormula`、`SinceTime` 全在,一樣兩步驟、一樣 `GetNextNoteID` 要傳當前 id,不用 recycle。
- **SSJS / XPages**:一樣從 `database.createNoteCollection()`,在 XPages 做設計盤點 / 匯出工具時用得到。
- **Java 專屬的**不是 API(方法共用),而是場景:後端 / 排程 Java agent 做設計盤點、選擇性 DXL 匯出、依建立時間批次處理時,`NoteCollection` 是比 `DocumentCollection` 更廣的那把刀;只要記得「先設條件再 build」「getNextNoteID 要傳當前 id」這兩刀。
