---
title: "XPages 的 database 是現成的,問題在「用誰的權限開」"
description: "LotusScript 和 Java 要寫幾行才拿得到一個 Database;XPages SSJS 裡 database 直接就在那,指向當前這個 NSF,你連 getDatabase 都不用呼叫。所以 SSJS 的 Database 難點不在「怎麼拿」,而在一個 LS/Java 很少逼你想的問題——這段 code 是用誰的權限在跑?使用者自己?還是 XPage 的簽署者?這篇講 database 全域、怎麼開別的庫(session.getDatabase / getCurrentDatabase),以及 session vs sessionAsSigner vs sessionAsSignerWithFullAccess 這組 XPages 權限模型——什麼時候非用簽署者權限不可。"
pubDate: 2026-11-06T07:30:00+08:00
lang: zh-TW
slug: ssjs-database
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "Global objects and functions (JavaScript)（database / session / sessionAsSigner / sessionAsSignerWithFullAccess 等全域物件）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html"
  - title: "Server-side scripting（session vs sessionAsSigner 的憑證與權限模型）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/xpageuser/wpd_scripts_server.html"
  - title: "NotesSession (JavaScript)（getDatabase / getCurrentDatabase / getDbDirectory）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html"
relatedJava: []
relatedSsjs: []
coversClass: "Database"
apiLang: "ssjs"
cover: "/covers/ssjs-database.webp"
coverStyle: "minimalist-mono"
---

LotusScript 要 `session.GetDatabase` 加判斷,Java 還要先生出 Session、再 `getDatabase`、再查 `isOpen`。XPages 的 SSJS 省了這一整段——`database` 直接就在那,一個現成的全域變數,指向當前這個應用的 NSF。你連 `getDatabase` 都不必呼叫。

正因為「怎麼拿」不是問題,SSJS 的 Database 真正要想清楚的,是另一件 LS 和 Java 很少逼你面對的事:**這段 server-side script 是用誰的權限在跑?** 是開頁面的那個使用者?還是這張 XPage 的簽署者?答錯,輕則該讀的讀不到,重則讓一般使用者做了他 ACL 上根本沒權限的事。

這篇講三件事:`database` 全域是什麼、要開別的庫怎麼開、以及 `session` / `sessionAsSigner` / `sessionAsSignerWithFullAccess` 這組權限模型——什麼時候非換權限不可。

---

## 重點摘要

- **`database` 是現成的全域**,官方定義:「represents the HCL Domino database currently being used as a data source」——當前應用的資料源,你不用建立、也不用開。
- **要開別的庫**才呼叫 `session.getDatabase(server, file)`;`session.getCurrentDatabase()` 等同 `database`,`session.getDbDirectory()` 拿目錄。底層就是那套 `lotus.domino` API。
- **真正的重點是權限**。`session` 用**當前使用者**的憑證;`sessionAsSigner` 用**這張 XPage 簽署者**的憑證;`sessionAsSignerWithFullAccess` 用簽署者憑證**再加完整存取**。
- **`database` 全域跟著 `session` 走**——用的是當前使用者的權限。使用者 ACL 讀不到的東西,透過 `database` 一樣讀不到。
- **什麼時候要 `sessionAsSigner`**:應用合法需要碰一個「使用者本人沒權限、但這個功能該做」的庫(中央設定庫、稽核 log、跨庫查表),就用 `sessionAsSigner.getDatabase(...)` 以簽署者身分開,而不是放寬那個庫的 ACL 給所有人。

## database:現成的,指向當前應用

在 XPages 的 server-side script 裡,`database` 是一個**全域變數**,不用宣告、不用建立。官方 [Global objects](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) 頁的定義是:「represents the HCL Domino database currently being used as a data source」——它就是當前這個應用的資料庫,型別是 `NotesDatabase`。

這跟 LotusScript 的 `session` 全域、或 SSJS 的 `session` 全域是同一種待遇:框架在每個 request 幫你備好,你直接用。所以最常見的 SSJS 就是這樣起手:

```javascript
var view:NotesView = database.getView("vwOrders");
var doc:NotesDocument = database.getDocumentByUNID(unid);
```

`database` 底下的方法——`getView`、`getDocumentByUNID`、`createDocument`、`FTSearch`、`createDominoQuery`——跟 LotusScript、Java 是同一套 `lotus.domino` API,名字只差大小寫慣例。

## 要開別的庫:走 session

`database` 只指向**當前**應用。要碰別的 NSF(跨庫查表、寫 log 到共用庫),就得自己開,入口在 `session`:

```javascript
// 開指定伺服器上的某個庫
var other:NotesDatabase = session.getDatabase("Mail01/ACME", "shared/config.nsf");

// 當前庫(等同 database 全域)
var cur:NotesDatabase = session.getCurrentDatabase();

// 拿資料庫目錄
var dir:NotesDbDirectory = session.getDbDirectory("Mail01/ACME");
```

官方 [NotesSession (JavaScript)](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html) 對 `getDatabase` 的說明是「Creates a NotesDatabase object that represents the database located at the server and file name you specify」,並且「opens the database, if possible」。注意最後那句——「if possible」。跟 Java 一樣,開不到不一定當場報錯,養成檢查 `isOpen()` 的習慣;Java 版那個「回了物件卻沒開成」的陷阱,在 [Java Database 那篇](/domino-news/posts/java-database/)講得更細,SSJS 走的是同一個後端。

## 真正的問題:這段 code 用誰的權限?

這才是 SSJS 跟 LS/Java 最不一樣的地方。LotusScript agent 跑在誰身上、通常你很清楚(簽署者或指定執行者);XPages 的 server-side script 預設跑在**開頁面的那個使用者**身上,而 `database` 全域、`session` 全域,用的都是**他**的憑證。

官方 [Server-side scripting](https://help.hcl-software.com/dom_designer/14.5.1/xpageuser/wpd_scripts_server.html) 把三種身分講得很清楚:

- **`session`**——「assigns credentials based on the user」。用當前使用者的憑證,受這個應用的 ACL、以及伺服器 Domino Directory 安全頁設定限制。`database` 全域就是走這個。
- **`sessionAsSigner`**——「assigns credentials based on the signer of the ... XPages design element」。改用**這張 XPage 的簽署者**的憑證(同樣受 ACL 與安全設定限制,只是「人」換成簽署者)。
- **`sessionAsSignerWithFullAccess`**——簽署者憑證**再加完整管理存取**,「allows full administrative access to the application's data」。但官方附帶一句硬條件:簽署者本人必須有這個權限,否則「the session is not created」——拿到的會是空的,不是偷渡的後門。

一句話:**`session`（和 `database`）是使用者視角,`sessionAsSigner` 是簽署者視角。**

## 什麼時候非用 sessionAsSigner 不可

情境很具體:你的 XPage 要寫一筆稽核 log 到一個共用的 `audit.nsf`,但一般使用者在那個庫的 ACL 只有 `No Access`——這是對的,稽核庫本來就不該讓人隨便進。如果你用 `database` 或 `session` 去開它,使用者權限不足,寫不進去。

這時**不要**去放寬 `audit.nsf` 的 ACL(那等於為了一個功能把整個庫對所有人打開),而是用簽署者的權限開:

```javascript
var audit:NotesDatabase = sessionAsSigner.getDatabase("", "audit.nsf");
if (audit != null && audit.isOpen()) {
    var log:NotesDocument = audit.createDocument();
    log.replaceItemValue("Form", "AuditEntry");
    log.replaceItemValue("User", session.getEffectiveUserName());  // 記的是「真正那個使用者」
    log.replaceItemValue("Action", "ViewedRecord");
    log.save();
}
```

重點在於權限的**收束**:只有這張簽署過的 XPage 能以簽署者身分寫 log,使用者自己拿不到那個權限。簽署者是誰?官方的規則是「XPages are signed with the ID of the current Domino Designer user upon saving the XPage design element」——你存檔那張 XPage 時,它就被你的 ID 簽了。所以部署前務必確認 XPage 是用一個**有適當權限的 ID** 簽的,不然 `sessionAsSigner` 拿到的權限會跟你以為的不一樣。

還有一道安全網值得知道:XPages 的 SSJS 直譯器對「受限操作」有把關——它會「Rejects embedded Java statements in JavaScript ... if the XPages Signer is not granted permission to perform restricted operations」。也就是說,簽署者沒被授權做受限操作時,連在 SSJS 裡嵌 Java 去繞都會被擋。

## recycle 呢?交給框架

Java standalone 要自己數 `recycle()`、自己收 handle(那套規則見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-recycle-memory/))。SSJS 在 XPages 的 request 生命週期裡,`database`、`session` 這些是**框架備好的 request-scope 全域**,它們的生命週期由 XPages 執行環境管,你不需要、通常也不該去 recycle 它們。你自己 `session.getDatabase(...)` 開出來的額外物件,在一次 request 內用完即可;真正需要像 Java 那樣逐一手動回收的重迴圈場景,在 XPages 相對少見。少操一份心,是 SSJS 相對 Java 的一個實在好處。

## 同類別在其他語言

同一個 `NotesDatabase`,三種語言的「取得」與「權限」差很多:

- **LotusScript**:`session.GetDatabase(server, file)` 再 `db.Open`,開不到回 `Nothing`;權限通常就是 agent 的執行身分(簽署者或指定執行者),沒有 `sessionAsSigner` 這種「同一段 code 切換身分」的機制。
- **Java**:要先取得 Session、再 `getDatabase`,還要顧 `isOpen` 陷阱與 `recycle` 鏈——細節見 [Java 開 Notes Database](/domino-news/posts/java-database/)。
- **SSJS 專屬的**,正是這篇的重點:`database` 現成、而且有 `sessionAsSigner` / `sessionAsSignerWithFullAccess` 讓你在同一段 script 裡切換到簽署者權限。至於 SSJS 怎麼碰後端文件(`document1` vs 後端 `NotesDocument`),見 [XPages 裡其實有兩個 document](/domino-news/posts/ssjs-backend-document/)。
