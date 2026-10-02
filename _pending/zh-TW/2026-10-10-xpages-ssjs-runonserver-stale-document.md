---
title: "XPages 呼叫 runOnServer 後文件還是舊值？in-memory 文件是快照——解法與用 contextDocument 省掉暫存文件"
description: "XPages SSJS 常見模式：建一個暫存文件、填參數、save、呼叫 agent.runOnServer(noteid)，agent 在伺服器端把結果回寫進那份文件。然後你讀回來——卻是 agent 處理前的舊值。這不是 bug：你手上那個文件物件是載入當下的 in-memory 快照，agent 在另一條執行把磁碟上的 note 存檔了，你的物件不會自動同步。解法是 recycle 掉舊的、再 getDocumentByID 重抓一份新的。這篇講清楚這個模式、為什麼會拿到舊值、標準解法，用表單的 document data source（contextDocument）取代暫存文件，以及最乾淨的 runWithDocumentContext——傳 in-memory 文件給 agent、連存檔和重抓都免（代價是 agent 要勾「以 Web 使用者身分執行」）。"
pubDate: 2026-10-10T07:30:00+08:00
lang: zh-TW
slug: xpages-ssjs-runonserver-stale-document
tags:
  - "XPages"
  - "JavaScript"
sources:
  - title: "runOnServer (NotesAgent - JavaScript)（回傳 0=成功、noteID 傳入 ParameterDocID）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Agent_runOnServer.html"
  - title: "getDocument (NotesXspDocument - JavaScript)（getDocument(applyChanges) 回傳內層 NotesDocument）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html"
  - title: "DominoDocument（NotesXspDocument 的 Java 類別，getDocument(boolean applyChanges) 取得內層 Document）— HCL/IBM JavaDocs（官方）"
    url: "https://public.dhe.ibm.com/software/dw/lotus/Domino-Designer/JavaDocs/DesignerAPIs/com/ibm/xsp/model/domino/wrapped/DominoDocument.html"
  - title: "XPages and Calling Agents Using an In-Memory Document（runWithDocumentContext、8.5.2+、agent 必須勾 Run as Web user）— HCL Domino App Dev wiki（官方）"
    url: "https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/XPages_and_Calling_Agents_Using_an_In-Memory_Document"
  - title: "Web agents（Run as web user＝以瀏覽器登入身分當 effective user，否則以 signer 身分執行）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html"
relatedJava: []
relatedSsjs: []
---

XPages 裡有個很常見的模式：你需要一段在**伺服器端**跑的邏輯——打 Oracle／SQL、用簽署者身分做事、或純粹吃資源的批次——於是你寫一支後端 agent，從 SSJS 用 `agent.runOnServer(noteid)` 叫它。你先建一個暫存文件、把參數填進去、`save`，把它的 note id 傳給 agent；agent 在伺服器端處理完，把結果回寫進那份文件、再存檔。

然後你讀回那份文件，準備拿結果——**讀到的卻是 agent 處理前的舊值**。你去資料庫裡看，文件明明已經被 agent 改好、存好了；但你的程式就是拿不到新值。

這不是 bug，是你手上那個文件物件的性質問題：**它是你載入當下的 in-memory 快照，不會因為別人（agent）在磁碟上改了它而自動更新。** 這篇講清楚這個模式、為什麼會拿到舊值、標準解法，最後給一個更乾淨的做法——直接用表單的 document data source（也就是你說的 contextDocument）當參數信箱，連暫存文件都不用建。

---

## 重點摘要

- **模式**：建暫存文件填參數 → `save`（agent 從磁碟抓，一定要先存）→ `agent.runOnServer(noteid)` → agent 用 `ParameterDocID` 拿到那份文件、處理、回寫、再 `save` → 呼叫端讀結果。
- **陷阱**：呼叫端手上的文件物件是**載入當下的快照**。agent 在另一條執行把磁碟上的 note 存檔後，你那個物件**不會自動同步**，讀 item 還是舊值。
- **解法**：`recycle()` 掉舊物件、再 `database.getDocumentByID(noteid)` 從磁碟**重抓**一份新的，才看得到 agent 寫的值。
- **更乾淨的替代**：不想建暫存文件，就用表單已經綁好的 document data source——`document1.getDocument(true)` 取得套用了畫面改動的 backend 文件，存檔後把它的 note id 傳給 agent。省掉建暫存文件與事後清理。**但讀結果時同一條規則照舊**：agent 寫完後那份 cached backend 文件也是舊的，一樣要重抓。
- **最乾淨**：`agent.runWithDocumentContext(doc)`（8.5.2+）把 in-memory 文件（**存不存檔都行**）直接傳給 agent 的 `DocumentContext`；agent 就地改、控制權回來後**直接讀得到新值、連重抓都免**。硬性前提：被呼叫 agent 要在 Security 分頁勾「**以 Web 使用者身分執行（Run as Web user）**」。
- `runOnServer` 回傳 `0` 代表成功，確認成功再去讀結果。

## 這個模式：用一份文件當 agent 的「參數信箱」

為什麼要大費周章建一份文件來呼叫 agent？因為 `runOnServer` 跑在**伺服器端、另一個 agent 執行環境**，它不能直接讀你 SSJS 記憶體裡的變數。你能傳給它的只有一個 **note id**：`agent.runOnServer(noteid)` 會把這個 id 放進被呼叫 agent 的 `ParameterDocID`，agent 端再用 `getParameterDocID()` 把那份文件抓出來（[官方 runOnServer 說明](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Agent_runOnServer.html)）。

所以整條流程是「拿文件當信箱」：

1. 呼叫端建文件、填參數、**`save`**（沒存檔，agent 從磁碟抓不到）。
2. 取得 note id，`agent.runOnServer(noteid)`。
3. agent 端 `getDocumentByID(agent.getParameterDocID())` 拿到文件，處理（打 Oracle 之類），把結果回寫、**再 `save`**。
4. 呼叫端在 `runOnServer` 回來後（`0` 代表成功），讀那份文件拿結果。

第 1 步和第 3 步的 `save` 都是必要的：agent 讀的是**磁碟上的 note**，不是記憶體；呼叫端要的是 agent 寫回磁碟的結果。問題就出在第 4 步。

## 為什麼讀到舊值：in-memory 文件是快照

關鍵在於：你在呼叫端持有的那個文件物件（不管是 `db.createDocument()` 建的、還是 `getDocumentByID` 抓的）是一個 **backend 文件物件**，它包著一個在**載入當下**就定型的內部狀態。

`agent.runOnServer` 跑在另一個獨立的 agent 執行裡，它改的、存的是**磁碟上那個 note**。磁碟變了，但你呼叫端那個早就載入好的物件**不會回頭去跟磁碟對帳**——它還握著載入當時的那份 item 值。於是你在 `runOnServer` 之後讀 `tmpdoc.getItemValueString("status")`，拿到的是「agent 還沒動它之前」的值。

換句話說：**不是 agent 沒存檔，是你讀錯了對象。** 你讀的是記憶體裡的舊快照，不是磁碟上的新內容。

## 解法：recycle 掉舊的、重新 getDocumentByID

既然舊物件不會自己更新，那就**丟掉它、重抓一份**：

```javascript
tmpdoc.save();
var noteid = tmpdoc.getNoteID();
tmpdoc.recycle();                 // 釋放舊的 in-memory 物件
if (agent.runOnServer(noteid) == 0) {
    // 從磁碟重新載入 agent 改過的那份
    var resultDoc = database.getDocumentByID(noteid);
    var nextSigner = resultDoc.getItemValueString("NextSigner");
    // ...用 resultDoc 的新值...
    resultDoc.recycle();
}
```

兩個動作缺一不可：

- **`recycle()` 掉舊物件**：釋放它握住的內部 handle（在 XPages／Java 這層，backend 物件背後是 C handle，不會被 JVM 自動回收，養成 `recycle` 的習慣對記憶體也好——這點另有[專篇](/domino-news/posts/java-recycle-memory/)）。
- **`getDocumentByID(noteid)` 重抓**：這才會從磁碟載入一份**反映 agent 改動**的新物件。

這也就是為什麼「先 `recycle`、再 `getDocumentByID`」是這個模式的標準收尾——不是儀式，是因為你真的需要一份新的、跟磁碟同步過的物件。

## 更乾淨：用 contextDocument 取代暫存文件

上面那套要**另外建一份暫存文件**，用完還得清掉（不然資料庫裡會堆一堆只為了呼叫 agent 而生的孤兒文件——很多人因此還得在文件上加個 `CreatorDelete` 之類的標記、再寫一支清理 agent）。

如果你的按鈕本來就在一張**綁了 document data source 的 XPage** 上，其實不必另起爐灶——直接拿表單正在編輯的那份文件當信箱就好。XPages 的 data source 是一個 `NotesXspDocument`（預設變數名 `document1`、`document2`…，你也可能把它命名成 `contextDocument`），用 `getDocument(applyChanges)` 就能取出它內層的 `lotus.domino.Document`（[官方](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html)、[DominoDocument JavaDoc](https://public.dhe.ibm.com/software/dw/lotus/Domino-Designer/JavaDocs/DesignerAPIs/com/ibm/xsp/model/domino/wrapped/DominoDocument.html)）：

```javascript
// 用表單的 data source，不另建暫存文件
var beDoc = document1.getDocument(true);   // true=把畫面上的改動套進 backend 文件
beDoc.save();                              // 存檔，agent 才抓得到這些值
var noteid = beDoc.getNoteID();
if (agent.runOnServer(noteid) == 0) {
    // 讀結果：一樣要重抓，別再信手上這份
    var fresh = database.getDocumentByID(noteid);
    // ...用 fresh 的新值，或把值塞回 data source 再 refresh...
}
```

`getDocument(true)` 的 `true` 是 `applyChanges`：官方的意思是「把對 data store 的改動套用進去」——也就是先把使用者在畫面上剛改、還沒存的值灌進 backend 文件，你再 `save`、再傳給 agent，agent 才看得到最新輸入。

**好處**：省掉建暫存文件、省掉事後清理那些孤兒文件。**但要記住一條沒變的規則**：agent 回寫之後，data source 手上那份 backend 文件**還是舊的**——`getDocument(true)` 再呼叫一次也不會幫你從磁碟拉新值（`applyChanges` 是把**你的**改動推進去，不是把 **agent 的**改動拉回來）。要顯示新結果，一樣是 `getDocumentByID` 重抓、或把新值塞回 data source 後做一次 refresh。

還有一個**身分**的細節容易忽略：從 XPages 叫的 agent，**預設是以 signer（簽署者）身分跑**；effective user 是 signer 還是登入的 web 使用者，決定它的 **ACL 存取權**（但它**能做哪些操作**〔受限／不受限方法〕仍由 signer 決定，這兩件事是分開的）（[官方 Web agents 說明](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html)：勾「以 Web 使用者身分執行」就以瀏覽器登入身分跑，否則以 signer）。所以如果那份文件有 **Readers 欄位**、或 ACL 會擋住 signer，agent 以 signer 身分就**讀不到你剛存的值**——這時要在 agent 的 Security 分頁勾「**以 Web 使用者身分執行**」，讓它以登入使用者的身分去讀。

## 最乾淨：runWithDocumentContext——連存檔和重抓都免

前面兩條（暫存文件、`getDocument(true)`）都還要 `save` + 事後 `getDocumentByID` 重抓。其實 8.5.2 之後有更直接的做法 `agent.runWithDocumentContext(doc)`：它把一份 **in-memory 文件（存檔或未存檔都可以）**傳進被呼叫 agent 的 `DocumentContext`——agent 端用 `session.DocumentContext`（LotusScript）／`getDocumentContext()`（Java）拿到它、就地處理、回寫；**控制權回到 XPage 時，你直接從同一份文件讀得到 agent 改過的值，不必再 `getDocumentByID` 重抓**（[官方 wiki](https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/XPages_and_Calling_Agents_Using_an_In-Memory_Document) 逐字：「when control returns to the XPage the updated values can be read from the document」）。

```javascript
var beDoc = document1.getDocument(true);   // 或任何一份 in-memory 文件，不必先 save
agent.runWithDocumentContext(beDoc);        // 傳進 agent 的 DocumentContext
// 回來後直接讀 beDoc，不用重抓
var nextSigner = beDoc.getItemValueString("NextSigner");
```

這一條把本文的兩個麻煩一次解掉：**不用為了存檔傷腦筋、也不用處理 stale handle**。但它有一個**硬性前提**——官方明講：被呼叫的 agent 必須在 Security 分頁勾「**以 Web 使用者身分執行（Run as Web user）**」，否則這個 in-memory 文件 context 不會正確運作（你截圖裡那個勾選，就是它）。另外，伺服器端的 Security 文件也要允許 agent／XPages「以呼叫者身分執行（sign agents or XPages to run on behalf of the invoker）」，這個模式才跑得起來。

要怎麼選：要相容很舊的版本、或 agent 跟畫面文件無關（純伺服器端 RPC）→ 用暫存文件／`runOnServer`；想一次省掉存檔與 stale handle、又能把 agent 設成 run-as-web-user → `runWithDocumentContext` 最乾淨。

## 幾個實務注意

- **呼叫前一定要 `save`**：agent 讀磁碟，沒存檔就抓不到（新文件更是要存了才有穩定的 note id）。
- **用回傳值判成功**：`runOnServer` 是同步的——它會**擋住**、直到 agent 跑完才回來，所以你可以在它一回傳就讀結果；回 `0` 才代表跑完且成功，確認成功再讀。
- **什麼時候還是該用暫存文件**：當你**不想動到、也不想存檔**那份正式文件時（例如純粹借 agent 做一次伺服器端 RPC、跟畫面文件無關），一份丟完即焚的暫存文件反而更乾淨——記得給它清理機制。
- **`recycle` 當習慣**：XPages SSJS 裡自己 `createDocument`／`getDocumentByID` 拿到的 backend 物件，用完 `recycle`，對長時間運作的 HTTP 行程的記憶體有幫助。

## 小結

`runOnServer` 之後讀到舊值，不是 agent 沒存檔，是你讀的是 in-memory 的舊快照：呼叫端的文件物件在載入當下就定型，agent 在磁碟上的改動不會同步回來。標準解法是 `recycle()` 舊的、`getDocumentByID()` 重抓新的。而如果只是為了呼叫 agent 而建暫存文件，多半可以改用表單的 document data source（`document1.getDocument(true)`）當信箱、省掉建檔與清理——只是「讀結果要重抓」這條規則，不管用暫存文件還是 contextDocument，都一樣適用。想一次擺脫「存檔 + 重抓」這兩件事，就用 `runWithDocumentContext` 把 in-memory 文件直接傳進 agent 的 `DocumentContext`、回來即讀——前提是把那支 agent 設成「以 Web 使用者身分執行」。
