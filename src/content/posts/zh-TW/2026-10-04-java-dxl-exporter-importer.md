---
title: "Java 端的 DXL：DxlExporter／DxlImporter 怎麼把 Domino 資料進出 XML"
description: "要把設計元素在資料庫之間搬、或把文件快照成 XML 做 diff／備份，DXL 就是 Domino 的 XML 表示法。在 Java 裡兩個主力是 DxlExporter（Domino→DXL，exportDxl 回一個 String）與 DxlImporter（DXL→Domino，importDxl 寫進目標 DB）。重點是：import 不是「把 XML 灌進去」這麼單純——你要用 setDesignImportOption／setDocumentImportOption／setAclImportOption 告訴它 design、文件、ACL 各自要 create／replace／update 還是 ignore，還有 replica 要不要相符。這篇整理兩個類別的建立與方法、import 的策略選項，以及跟 LotusScript 版的關係。"
pubDate: 2026-10-04T07:30:00+08:00
lang: zh-TW
slug: java-dxl-exporter-importer
tags:
  - "Java"
  - "Tutorial"
sources:
  - title: "Exporting and importing DXL (Java) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXPORTING_AND_IMPORTING_DXL_JAVA.html"
  - title: "DxlImporter (Java) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLIMPORTER_CLASS_JAVA.html"
  - title: "createDxlExporter (Session - Java) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_CREATEDXLEXPORTER_METHOD_SESSION_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-dxl-exporter-importer.webp"
coverStyle: "risograph"
---

你要把一批設計元素從測試庫搬到正式庫,或把一堆文件快照成 XML 好做 diff、備份、餵給別的系統——**DXL(Domino XML)就是 Domino 資料與設計的 XML 表示法**,而在 Java 裡,進出 DXL 的兩個主力是 `DxlExporter` 與 `DxlImporter`。

出去很單純;**回來才是重點**——import 不是「把 XML 灌進去」而已,你得明確告訴它:design、文件、ACL 各自要 create、replace、update 還是 ignore。搞錯策略,輕則沒進、重則覆蓋掉不該覆蓋的。

這篇整理兩個類別的建立與方法,以及 import 那幾個決定成敗的策略選項。

---

## 重點摘要

- **`DxlExporter`(Domino → DXL)**:`session.createDxlExporter()` 建立;`exportDxl(...)` 吃 `Database`／`Document`／`DocumentCollection`／`NoteCollection`,**回傳一個 DXL 字串**。
- **`DxlImporter`(DXL → Domino)**:`session.createDxlImporter()` 建立;`importDxl(...)` 吃 `String`／`Stream`／`RichTextItem`,**寫進目標 `Database`**;用 `getFirstImportedNoteID` / `getNextImportedNoteID` 走剛匯入的 note（後者要傳目前的 note ID）。
- **import 是有策略的**:`setDesignImportOption`(create／ignore／replace)、`setDocumentImportOption`(create／ignore／replace／update)、`setAclImportOption`(ignore／replace／update)、`setReplaceDbProperties`、`setReplicaRequiredForReplaceOrUpdate`。
- **recycle**:exporter／importer 與過程中的 backend 物件,照 [Java 端的 recycle 紀律](/domino-news/posts/java-recycle-memory)收。
- **round-trip 有坑**:出去再回來不保證完全一致,見站上 [DXL round-trip 陷阱那篇](/domino-news/posts/dxl-round-trip-pitfalls)。

## DxlExporter：Domino → DXL

官方 [Exporting and importing DXL](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXPORTING_AND_IMPORTING_DXL_JAVA.html) 講得很直接:「Use the createDxlExporter method in Session to create a DxlExporter object. Use the exportDxl method to perform the export. Input to exportDxl can be a Database, Document, DocumentCollection, or NoteCollection object. Output is a String object.」

```java
DxlExporter exporter = session.createDxlExporter();
String dxl = exporter.exportDxl(doc);      // 也可傳 Database / DocumentCollection / NoteCollection
// …把 dxl 寫檔、比對、或傳出去…
exporter.recycle();
```

要控制輸出,exporter 上有一排選項(例如是否輸出 DOCTYPE、富文本怎麼處理)。多數情況預設就夠用;要精確控制格式時再查 exporter 的 setter。

## DxlImporter：DXL → Domino

官方:「Use the createDxlImporter method in Session to create a DxlImporter object. Input to DxlImporter can be a String, Stream, or NotesRichTextItem object. Output is to a Database object.」匯入後,「You can access these note IDs using the getFirstImportedNoteId and getNextImportedNoteId methods.」

```java
DxlImporter importer = session.createDxlImporter();
importer.setDocumentImportOption(DxlImporter.DXLIMPORTOPTION_CREATE);
importer.importDxl(dxl, targetDb);          // 寫進 targetDb

String noteId = importer.getFirstImportedNoteID();
while (noteId != null) {
    // …處理剛匯入的每一筆…
    noteId = importer.getNextImportedNoteID(noteId);   // 傳目前的 note ID、取下一個
}
importer.recycle();
```

## import 是有策略的：三個 ImportOption

這是 DXL 匯入最該想清楚的一步。目標庫裡可能已經有同樣的東西,你要決定「遇到既有的怎麼辦」。官方 [DxlImporter](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLIMPORTER_CLASS_JAVA.html) 的選項:

| 選項 | 控制 | 可選 |
|---|---|---|
| `setDesignImportOption` | 進來的**設計元素**怎麼處理 | create／ignore／replace |
| `setDocumentImportOption` | 進來的**文件**怎麼處理 | create／ignore／replace／update |
| `setAclImportOption` | 進來的 **ACL** 項怎麼處理 | ignore／replace／update |
| `setReplaceDbProperties` | 進來的 DXL 要不要**取代資料庫屬性** | 是／否 |
| `setReplicaRequiredForReplaceOrUpdate` | 做 replace／update 時,**replica ID 要不要相符** | 是／否 |

幾個實務提醒:

- **replace／update 前先想清楚 replica 條件**:`setReplicaRequiredForReplaceOrUpdate` 決定「要不要求 DXL 的 replica ID 跟目標庫一致」。跨庫搬設計、但兩庫不是複本時,這個設定會影響 replace／update 到底做不做得成。
- **文件的 update 與 replace 不同**:`update` 是更新既有(比對),`replace` 是換掉;搬資料 vs 覆蓋,選錯結果差很多。
- **ACL 誤帶**:匯入含 ACL 的 DXL 時,`setAclImportOption` 沒設好,可能把目標庫的權限一起改掉——搬設計時通常不想動 ACL。

## recycle 與 round-trip

`DxlExporter`／`DxlImporter` 一樣是 backend 物件,用完 `recycle()`,跟 [Java 端 recycle 那篇](/domino-news/posts/java-recycle-memory)講的紀律一致。另外,DXL「出去再匯回來」不保證位元級一致(某些元素、富文本、附件有眉角)——這部分站上 [DXL round-trip 陷阱](/domino-news/posts/dxl-round-trip-pitfalls)整理過,搬正式資料前值得先看。

## 同類別在其他語言

- **LotusScript**:對應 `NotesDXLExporter`／`NotesDXLImporter`,API 形狀幾乎一樣(`CreateDXLExporter`／`CreateDXLImporter`、`Export`／`Import`、同一組 import option)——站上 [NotesDXLImporter(LS)那篇](/domino-news/posts/notes-dxl-importer)講過 LS 版。這篇是 Java 版。
- **SSJS**:能透過 Java API 用同樣的類別,但 DXL 進出比較常在 agent／背景工作(Java／LS)做,不是前端 SSJS 的典型場景。
