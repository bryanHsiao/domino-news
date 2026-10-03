---
title: "document1.getDocument(true) 的 true 到底在做什麼——applyChanges、什麼時候該加、什麼時候是多餘"
description: "XPages SSJS 裡 document1.getDocument() 和 document1.getDocument(true) 到處都有人用，但那個 true（applyChanges）到底套用了什麼、什麼時候非加不可、什麼時候加了也是多餘？加錯邊的代價很實在：少加，你可能存了一份漏掉程式剛改的值的文件；多加，則是憑直覺亂下。這篇把 getDocument() 與 getDocument(true) 的差別講清楚：true 是把 data source 的待套改動（控制項輸入 + 程式 setValue）flush 進 backend 文件；一般送出事件裡 Update Model Values 早就把畫面值同步進去了、多半不用加；真正需要 true 的是你做了程式改動、或要直接對 backend 文件動作時。附上 save() 與 getComponent().getValue() 的分工。"
pubDate: 2026-10-11T07:30:00+08:00
lang: zh-TW
slug: xpages-getdocument-applychanges
tags:
  - "XPages"
  - "JavaScript"
sources:
  - title: "getDocument (NotesXspDocument - JavaScript)（getDocument(applyChanges)：true 套用改動、false 不套用）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html"
  - title: "DominoDocument（getDocument(boolean applyChanges)：Apply any changes to the wrapped document before returning it）— HCL/IBM JavaDocs（官方）"
    url: "https://public.dhe.ibm.com/software/dw/lotus/Domino-Designer/JavaDocs/DesignerAPIs/com/ibm/xsp/model/domino/wrapped/DominoDocument.html"
  - title: "NotesXspDocument（XPages 的 document data source、取內層 Document 與 getValue/replaceItemValue）— HCL/IBM Knowledge Center（官方）"
    url: "https://www.ibm.com/docs/en/SSVRGU_9.0.1/reference/r_wpdr_xsp_xspdocument_r.html"
relatedJava: []
relatedSsjs: []
---

你在 XPages 的 SSJS 裡一定看過兩種寫法：`document1.getDocument()`，還有 `document1.getDocument(true)`。那個 `true` 是 `applyChanges`——但它到底「套用」了什麼改動？什麼時候非加不可、什麼時候加了只是心安？

這題值得分清楚，因為兩邊都會出事：**少加**，你可能把一份「漏掉你剛剛程式改的值」的文件拿去存或拿去用；**多加**，則是看別人這樣寫就跟著加、其實沒搞懂。這篇把 `getDocument()` 和 `getDocument(true)` 的差別、以及「什麼時候該加」講清楚。（這個問題最常在「把文件交給後端 agent」時冒出來——那個情境見[呼叫 runOnServer 後拿到舊值](/domino-news/posts/xpages-ssjs-runonserver-stale-document/)這篇，本文是它裡面 `getDocument(true)` 那一段的獨立深入。）

---

## 重點摘要

- **`getDocument()`**（＝`applyChanges` 預設 `false`）：回傳 data source 內層那份 `lotus.domino.Document`，**不先套用待處理的改動**。
- **`getDocument(true)`**：先把 data source **目前待套的改動**（控制項輸入、以及你用程式 `setValue` 改的）flush 進那份 backend 文件，**再**回傳（官方文件：true「applies any changes made to the data store」）。
- **什麼時候其實不用加**：一般送出事件裡，JSF 的 **Update Model Values 階段**早在你的按鈕 SSJS 之前就把 bound 控制項值同步進 data source 了，所以 `getDocument()` 本來就帶著畫面現值、`(true)` 多半多餘。
- **什麼時候真的需要**：你在 SSJS 裡用程式改了 data source（`document1.setValue(...)`），又要**直接對 backend 文件動作**（存它、`generateXML()`、傳給 agent）——這時 `(true)` 才會把那些改動放進去。
- **分工**：只是要存整份 → `document1.save()`；要單獨拿某個畫面欄位的現值 → `getComponent("xx").getValue()`。

## `getDocument()` 和 `getDocument(true)` 差在哪

XPages 的 document data source 是一個 [`NotesXspDocument`](https://www.ibm.com/docs/en/SSVRGU_9.0.1/reference/r_wpdr_xsp_xspdocument_r.html)（預設變數名 `document1`…），它內層包著一份真正的 `lotus.domino.Document`。兩個方法都是把那份內層文件拿出來，差別只在「拿之前先不先把待套的改動灌進去」（[官方 getDocument](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html)、[DominoDocument JavaDoc](https://public.dhe.ibm.com/software/dw/lotus/Domino-Designer/JavaDocs/DesignerAPIs/com/ibm/xsp/model/domino/wrapped/DominoDocument.html)）：

- `getDocument()`／`getDocument(false)`：回那份 Document **現在的樣子**，不主動套用 data source 手上還沒 flush 的改動。
- `getDocument(true)`：JavaDoc 寫得最直白——「**Apply any changes to the wrapped document before returning it**」。先把改動套進內層文件、再回給你。

所以 `true` 不是什麼魔法開關，它就是一個 flush 動作：**把 data source 層的待套改動，寫進 backend 文件層。**

## 「改動」是哪來的：控制項輸入 + 程式 setValue

要知道什麼時候該加 `true`，得先知道「它在 flush 的那些改動」從哪來。兩個來源：

1. **使用者在控制項上的輸入**。欄位綁在 data source 上，使用者改了，那些值會進到 data source 的模型。
2. **你用程式改的**。在 SSJS 裡 `document1.setValue("Status", "done")`、或 `document1.replaceItemValue(...)`，改的也是 data source 這一層。

這兩種改動都先落在 **data source 模型**，不一定當下就同步到內層那份 `lotus.domino.Document`。`getDocument(true)` 做的，就是在你拿文件之前，把它們灌進去。

## 什麼時候其實不用加 true：JSF 生命週期

這是最多人誤加 `true` 的地方。XPages 是建在 JSF 上的，一次送出會跑六個階段，順序固定：

1. Restore View
2. Apply Request Values
3. Process Validations
4. **Update Model Values** ← 把控制項的值寫進後端模型（你的 data source）
5. **Invoke Application** ← 你的按鈕 SSJS 在這裡執行
6. Render Response

重點在 **4 比 5 早**：等你的按鈕事件（第 5 階）跑 SSJS 時，使用者在 bound 控制項上打的值，**早在第 4 階就已經同步進 data source 了**。所以這時候 `document1.getDocument()` 本來就帶著畫面現值，**為了「抓畫面值」而加 `true`，多半是多餘的**。

一個例外要記得：如果觸發的是 `immediate="true"` 的事件（例如某些取消鈕、partial 動作），它會**跳過 Update Model Values**——這時畫面上的新值根本沒進 data source，`getDocument()` 或 `getDocument(true)` 都拿不到，要靠 `getComponent("xx").getValue()` 直接讀控制項。

## 什麼時候真的需要 true

既然一般送出事件 `getDocument()` 就夠，那 `true` 的真正用武之地是：**你自己在 SSJS 裡動了 data source、又要直接對 backend 文件做事**。

- 你 `document1.setValue(...)` 改了幾個欄位，接著想把這份文件 **`generateXML()` 丟出去**、或**存成一份副本**、或**傳 note id 給 agent**——這些是直接碰 backend 文件的操作。如果用 `getDocument()`（不加 true），你剛程式改的值**不一定在裡面**；`getDocument(true)` 才會先把它們套進去。官方的範例正是這個味道：`document1.getDocument(true).generateXML()`——要輸出含最新改動的 XML。
- 不確定 data source 的改動有沒有進文件、而你又要直接操作那份文件時，`true` 是「確保它們在裡面」的明確作法。

換句話說：**`true` 是為了「直接操作 backend 文件、且要含待套改動」而存在的**，不是「每次拿文件都要加」的儀式。

## 三種取值方式，各管一段

把上面收斂成一張實務分工，就不會每次都在猶豫要不要加 `true`：

- **只是要把整份存起來** → `document1.save()`。這是 data source 的存檔，它會把待套改動 flush 進文件、再寫到磁碟，你根本不用碰 `getDocument`。
- **要直接對 backend 文件動作**（serialize、傳 agent、複製…） → `document1.getDocument(true)`。用 `true` 確保程式改動與畫面值都在那份文件裡。
- **只要單獨一個畫面欄位的現值** → `getComponent("xx").getValue()`。直接讀控制項，連 data source 都不經過——`immediate` 事件（沒跑 Update Model Values）要拿畫面值時，更是只能這樣。

很多人就是靠「`getDocument()` 抓後端、`getComponent().getValue()` 抓畫面、`save()` 存整份」這組分工，把三件事切得清清楚楚，也就不必再糾結那個 `true`。

## 小結

`document1.getDocument(true)` 的 `true` 是 `applyChanges`：在把內層 `lotus.domino.Document` 拿給你之前，先把 data source 的待套改動（控制項輸入 + 程式 `setValue`）flush 進去。一般送出事件裡，Update Model Values 早已把畫面值同步進 data source，所以 `getDocument()` 就帶著現值、`(true)` 多半多餘；它真正的用武之地，是你用程式改了 data source、又要直接對 backend 文件動作時。搞不清楚要不要加，就回到那張分工：存整份用 `save()`、要操作文件用 `getDocument(true)`、只讀一個畫面欄位用 `getComponent().getValue()`。
