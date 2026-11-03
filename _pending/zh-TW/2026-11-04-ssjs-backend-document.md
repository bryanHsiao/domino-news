---
title: "XPages 裡其實有兩個 document,別改錯邊"
description: "你在 XPages SSJS 裡寫 document1,手上拿的是資料源包裝（NotesXspDocument）；但 document1.getDocument() 遞給你的是另一個物件——後端的 NotesDocument。兩者指向同一份 note、卻是兩套 API：包裝這邊用 getValue / setValue、後端那邊用 getItemValue / replaceItemValue，而且各有各的 save。這篇講後端那一個：怎麼在 SSJS 拿到它、它能做什麼（replaceItemValue / computeWithForm / save / remove / universalID）、它跟包裝的分界線在哪，以及為什麼「兩邊都 save」會生出一份 save-conflict 文件。"
pubDate: 2026-11-04T07:30:00+08:00
lang: zh-TW
slug: ssjs-backend-document
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesXspDocument（XPages 的 document data source、取內層 Document、getValue / setValue / replaceItemValue / save）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_r.html"
  - title: "getDocument (NotesXspDocument - JavaScript)（取後端 NotesDocument、applyChanges 參數）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html"
  - title: "NotesDocument class（後端文件類別,SSJS / Java / LotusScript 共用同一套 API）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
relatedJava: []
relatedSsjs: []
coversClass: "Document"
apiLang: "ssjs"
---

你在 XPages 的 SSJS 裡寫 `document1`,心裡想的是「這份文件」。但嚴格講,`document1` 不是文件本身——它是 XPages 的 **document data source**,一個 [`NotesXspDocument`](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_r.html) 物件,是畫面與資料之間的那層包裝。

真正那份「後端文件」要用 `document1.getDocument()` 才拿得到,它是一個 **`NotesDocument`**——就是你在 agent、script library 裡熟悉的那個後端文件類別。兩個物件指向**同一份 note**,卻是**兩套不同的 API**:包裝這邊用 `getValue` / `setValue`,後端那邊用 `getItemValue` / `replaceItemValue`,而且**各有各的 `save`**。搞不清楚你手上是哪一個、或兩邊都去存,正是 XPages 存檔怪象的來源。

這篇只講後端那一個 `NotesDocument`:怎麼在 SSJS 拿到它、它能做什麼、它跟包裝的分界在哪。

---

## 重點摘要

- **`document1` 是包裝,不是後端文件**。它是 `NotesXspDocument`(資料源);官方自己說,要「直接對資料庫動作」就用 `NotesDocument`。
- **後端文件用 `document1.getDocument()` 拿**,或完全不經過資料源,直接 `database.getDocumentByUNID(...)` / `view.getDocumentByKey(...)` / `database.createDocument()` 生出來。
- **兩套 API 別混**:資料源用 `getValue` / `setValue`(綁定控制項的那層);後端 `NotesDocument` 用 `getItemValue` / `replaceItemValue`、`computeWithForm`、`save`、`remove`、`universalID`——跟 LotusScript 的 NotesDocument 一模一樣。
- **存檔分界**:要把整份資料源連同畫面輸入存回 → `document1.save()`;你拿了後端文件、要單獨存它 → `doc.save()`。**不要兩個都呼叫**。
- **最常見的坑**:同一份文件上既 `doc.save()`(後端)又 `document1.save()`(資料源),版本戳記對不上,Domino 就產出一份 `$Conflict` 存檔衝突文件。詳見下方與[存檔衝突那篇](/domino-news/posts/xpages-save-conflicts/)。

## 兩個 document:包裝 vs 後端

先把名詞分清楚,後面才不會亂。

- **`NotesXspDocument`**——XPages 的 document data source。官方定義:「Represents a document associated with the XPage context in which the server script is running.」一個 XPage 綁了 Domino document 當資料源時,就會有一個這型別的全域變數,叫 `document1`、`document2`…;`currentDocument` 指最近的那個。它負責的是**畫面控制項與文件之間的綁定**,所以它的 `getValue` / `setValue` 是走「這份資料源目前的狀態」。
- **`NotesDocument`**——後端文件。就是 `lotus.domino` 那套裡的 Document,你在 SSJS、Java、LotusScript 裡用的是**同一套 API**。它直接對應資料庫裡那份 note,沒有畫面綁定這回事。

官方在 `NotesXspDocument` 頁面講得很白:要「直接對 Domino 資料庫動作」,請用 `NotesDocument`。換句話說,資料源是給你接畫面用的方便層;要碰真正的文件,往下拿後端那個。

## 怎麼在 SSJS 拿到後端 NotesDocument

有兩條路,看你要不要經過資料源。

**(1) 從現在這份資料源拿**——最常見,你人在某個 XPage 的事件裡:

```javascript
var doc:NotesDocument = document1.getDocument();
```

[`getDocument()`](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html) 的官方說明是「Gets the document as a NotesDocument object」。它還有一個帶參數的版本 `getDocument(applyChanges)`:`true` 會先「apply any changes made to the data store」再回傳、`false`(預設)不套用。那個參數在「程式改了值又要馬上拿後端文件」時很關鍵,不過它屬於另一個主題——實際套用了什麼、什麼時候非加不可,見[`getDocument(true)` 的 true 到底在做什麼](/domino-news/posts/xpages-getdocument-applychanges/),這裡不重講。

**(2) 完全不經過資料源**——你在 SSJS 裡要處理的根本不是當前這份,而是別份文件(查表、批次、跨庫):

```javascript
var db:NotesDatabase = database;                 // 全域變數 database
var doc:NotesDocument = db.getDocumentByUNID(unid);
// 或用視圖查:
var view:NotesView = db.getView("vwUsers");
var doc2:NotesDocument = view.getDocumentByKey("USER_001");
// 或開新文件:
var newDoc:NotesDocument = db.createDocument();
```

這條路拿到的就是純後端文件,跟 `document1` 沒關係,也不會動到畫面資料源。

## 後端文件能做什麼

拿到 `NotesDocument` 之後,它的方法就是你熟悉的那套後端 API(與 LotusScript 完全相同):讀值 `getItemValue` / `getItemValueString`、寫值 [`replaceItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html)、跑表單公式與驗證 `computeWithForm`、存檔 `save`、刪除 `remove`、拿識別 `getUniversalID` / `getNoteID`、判斷 `isNewNote` / `isResponse`。

一段完整的「取文件 → 改欄位 → 存檔」:

```javascript
try {
    var view:NotesView = database.getView("vwUsers");
    var doc:NotesDocument = view.getDocumentByKey("USER_001");
    if (doc != null) {
        doc.replaceItemValue("Status", "Active");
        doc.replaceItemValue("LastUpdated", session.createDateTime("Today"));

        // computeWithForm(dodatatypes, raiseError):跑表單的預設值與驗證公式
        if (doc.computeWithForm(true, false)) {
            doc.save(true, false);   // save(force, makeResponse)
            print("更新完成,UNID=" + doc.getUniversalID());
        } else {
            print("computeWithForm 驗證沒過");
        }
    }
} catch (e) {
    print("處理失敗:" + e.toString());
}
```

兩個參數值得記一下:`save(force, makeResponse)` 的 `force` 控制「別人同時改了同一份時要不要硬存」;`computeWithForm(dodatatypes, raiseError)` 的第二個參數決定驗證失敗時是丟例外還是回傳 `false`——上面用 `false`,所以自己檢查回傳值。

## 分界線:什麼時候用哪一邊

這是最容易出錯、也最該記住的一段。同一份 note,兩個物件、兩套存法:

| 你要做的事 | 用哪一個 |
|---|---|
| 讀/寫**綁定控制項**那層的值 | 資料源 `document1.getValue` / `setValue` |
| 讀/寫**文件欄位本身** | 後端 `doc.getItemValue` / `replaceItemValue` |
| 存回「整份資料源＋畫面輸入」 | `document1.save()` |
| 只存你手上這份後端文件 | `doc.save()` |
| 跑 `computeWithForm`、`remove`、拿 UNID | 後端 `doc`(資料源沒有這些) |

一句話:**畫面綁定的事交給資料源,文件本身的事交給後端 `NotesDocument`**。需要跨過去時,用 `getDocument()` 那座橋。

## 最常見的坑:兩邊都 save

分界沒守住,最典型的後果是**存檔衝突**。情境是這樣:頁面載入時,資料源 `document1` 記住了這份文件當下的版本戳記(sequence number)。你在 SSJS 裡 `var doc = document1.getDocument()` 拿到後端文件、呼叫了 `doc.save()`——磁碟上的版本已經被你更新了。接著 XPages 生命週期又觸發 `document1.save()`,資料源卻還拿著**舊的**戳記去寫,Domino 一比對發現磁碟上的比記憶體裡的新,就判定衝突、生出一份 `$Conflict` 文件。

避法就是守住分界:**一份文件,只用一邊存**。走畫面就全程 `document1.setValue(...)` ＋ `document1.save()`,別再 `doc.save()`;真要直接操作後端就 `doc.save()`,那就別再讓資料源去 `save()`。這個坑的完整重現與實測(含在 Domino 12.0.2 / 14.5.1 上跑過),見[XPages 存檔衝突那篇](/domino-news/posts/xpages-save-conflicts/)。

## 同類別在其他語言

後端 `NotesDocument` 這個類別,跨語言幾乎是同一套——因為它本來就是同一個 `lotus.domino.Document`:

- **LotusScript**:`NotesDocument`,`db.GetDocumentByUNID`、`doc.ReplaceItemValue`、`doc.Save`——方法名一樣,只差大小寫慣例與語法。
- **Java**:`lotus.domino.Document`,`db.getDocumentByUNID(...)`、`doc.replaceItemValue(...)`、`doc.save()`;Java 這邊多一件事要顧——用完要 `recycle()` 放掉記憶體,這點 SSJS / LS 不用。那個故事見 [Java 的 NotesDocument 與欄位處理](/domino-news/posts/java-document-items/)。
- **SSJS 專屬的**其實不是 `NotesDocument` 本身,而是它**上面多包的那層** `NotesXspDocument`(資料源)——這層是 XPages 才有的,也是這篇要你分清楚的重點。
