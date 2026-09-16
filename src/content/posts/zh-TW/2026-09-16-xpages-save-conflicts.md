---
title: "XPages 存檔衝突：為什麼「只有你一個人」還會跳存檔衝突"
description: "「Document has been saved by another user」——奇怪的是根本沒別人在動這份文件，存檔衝突卻偶爾自己冒出來。這篇講一個 XPages 老坑：在同一份文件上混用 dominoDocument 資料來源的存檔與後端 Document 的存檔，會讓 Domino 的衝突判定誤判、生出一份 conflict 文件。從官方的衝突機制（$Revisions）講起、拆解 assono 那個經典重現，並在 Domino 12.0.2 與 14.5.1 各自實測看這個 2013 年的坑現在還在不在。"
pubDate: 2026-09-16T07:30:00+08:00
lang: zh-TW
slug: xpages-save-conflicts
tags:
  - "Domino Designer"
  - "XPages"
  - "Tutorial"
sources:
  - title: "Replication or save conflicts — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/admn_replicationorsaveconflicts_c.html"
  - title: "data — Data Source（dominoDocument, 含 concurrencyMode）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/xpageuser/wpd_controls_pref_data.html"
  - title: "Creating save conflicts mixing DominoDocument and Document methods（社群，2013）— assono"
    url: "https://www.assono.de/en/blog/xpages-save-conflicts-mixing-methods"
relatedJava: []
relatedSsjs: []
draft: true
---

存檔按下去，畫面跳出「Document has been saved by another user - Save created a new document as a response to that modified document」。你愣了一下：**這份文件根本只有你在動**，沒有同事、沒有另一個分頁，怎麼會「被別人存檔」？打開資料庫一看，還真的多出一份 conflict（衝突）文件。而且它**偶爾才發作**，最難查。

這是 XPages 一個很少被講清楚的老坑：在同一份文件上，**混用了 `dominoDocument` 資料來源的存檔和後端 `Document` 的存檔**。這篇從 Domino 怎麼判定衝突講起，拆解 [assono 在 2013 年那個經典重現](https://www.assono.de/en/blog/xpages-save-conflicts-mixing-methods)，並因為那篇年代久遠，實際在 **Domino 12.0.2 與 14.5.1** 各跑一次，看這坑現在還在不在。

## 重點摘要

- **存檔衝突不需要兩個人**：只要「同一份文件被存了兩條不同的修改血脈」，Domino 就會把其中一條收成 conflict 文件——一個人也能自己製造出這種情況。
- **XPages 常見的觸發**：先存 `dominoDocument`（`doc.save()`），又抓它的後端 `doc.getDocument()` 改欄位再 `save()`，然後 `dominoDocument` 又存一次——兩套 API 在同一份文件上各存各的，Domino 的版本比對就對不上。
- **官方機制**：Domino 用 `$Revisions`（記錄每次編輯的時間）判定誰是主文件、誰變成 conflict 回應文件。
- **怎麼避開**：收斂成**單一存檔路徑**（assono 的解：少存那一次、或乾脆只用後端類別）；資料來源的 `concurrencyMode` 可決定撞到時的行為；真正多人並行才需要 document locking。

## 先搞懂：Domino 怎麼「生出」一份衝突文件

存檔衝突不是 XPages 的專利，是 Domino 資料層的老機制。[官方文件](https://help.hcl-software.com/domino/11.0.0/admin/admn_replicationorsaveconflicts_c.html)講得很白：當「同一份文件被兩段各自的編輯 session 改過並存檔」時，Domino 只能留一份當主文件、其餘收成衝突：

> 「The document edited and saved the most times becomes the main document; other documents become Replication or Save Conflict documents.」

判定靠的是 **`$Revisions`** 欄位——它記錄每一次編輯存檔的日期時間：

> 「Domino uses the `$Revisions` field, which tracks the date and time of each document editing session, to determine which document becomes the main document and which documents become responses.」

關鍵在這句「兩段各自的編輯 session」：Domino 判的是「你這次存的，是不是**接在磁碟上目前那版之後**」。如果你手上這份的版本序列，跟磁碟上已經被更新過的那份對不起來，Domino 就認定「這是另一條血脈」，把它收成 conflict。**它從頭到尾不在乎是不是同一個人**——這就是為什麼一個人也能自己撞出衝突。

## XPages 的觸發：兩套 API 在同一份文件上各存各的

現在把上面那個機制放進 XPages。你在 XPage 上通常拿的是 `dominoDocument` 資料來源（`var="doc"`）。它底下對應一份後端的 `NotesDocument`，可以用 `doc.getDocument()` 取到。問題就出在**同時對這兩層存檔**。

assono 那篇（2013）給了一個能穩定重現的最小樣本，邏輯是這樣：

```javascript
doc.save();                          // 1) 先存資料來源
var backend = doc.getDocument();     // 2) 抓它的後端 Document
backend.replaceItemValue("Note", "touched by back end");
backend.save();                      //    後端自己又存一次（磁碟上版本前進了）
doc.save();                          // 3) 資料來源又存一次——但它手上的版本比磁碟舊
```

第 3 步的 `dominoDocument` 還以為自己接在第 1 步之後，殊不知第 2 步的後端存檔已經把磁碟上的版本往前推了一格。於是第 3 步這一存，在 Domino 眼裡就是「另一條血脈」→ 收成 conflict。assono 還發現：**兩次存檔之間留個時間差（他用 `Thread.sleep`）就穩定發作，沒有時間差反而不一定**——這也解釋了為什麼實務上它「偶爾才中」。

> assono 的原始解法很直接：把多餘的那次 `dominoDocument` 存檔**拿掉**就沒事；更根本的是「the best way would be to work only with the back end classes」——同一份文件從頭到尾只走一套 API、一條存檔路徑。

（這也正是我們在[XPages 多選附件刪除那篇](/domino-news/posts/xpages-attachment-multi-delete)刻意避開後端 `getDocument().remove()`、全程留在資料來源層的原因——就是不想踩這個衝突。）

## 這是 2013 的文，R12 / 14.5.1 還會這樣嗎？

assono 那篇已經十多年，中間 Domino 換了好幾個大版本。所以我們照他的樣本做了一支最小 XPage，在 **Domino 12.0.2** 與 **14.5.1** 各跑一次，看這個坑現在還在不在。

<!-- 實測結果待補：我們會在 12.0.2 與 14.5.1 各跑一次「save → 改後端 → 再 save」的重現，
     記錄有沒有生出 conflict 文件、需不需要 sleep、兩版行為是否一致，把結論與截圖填進來。 -->

## 怎麼避開

- **收斂成單一存檔路徑**：同一份文件，不要一邊用資料來源 `doc.save()`、一邊用後端 `doc.getDocument().save()`。要嘛全走資料來源、要嘛全走後端，別交錯——這是根治。
- **不要重複存**：一次動作裡不要對同一份 `dominoDocument` 存兩次；把該做的改動集中在一次存檔前完成。
- **`concurrencyMode`**：`dominoDocument` 資料來源有個 [`concurrencyMode` 屬性](https://help.hcl-software.com/dom_designer/12.0.2/xpageuser/wpd_controls_pref_data.html)——[官方](https://help.hcl-software.com/dom_designer/12.0.2/xpageuser/wpd_controls_pref_data.html)說它「Specifies the handling of concurrent updates if multiple users update a document at the same time」，值有 `createResponse`、`fail`、`exception`、`force`。它管的是「真的撞到並行更新時要怎麼處理」（例如 `fail` 讓存檔失敗而不是默默生衝突），對「真並行」有用；但上面那種**單人自撞**的根源還是在混用 API，該從存檔路徑收斂。
- **真並行才上鎖**：多人同時編輯的場景，才需要 document locking 這類機制去擋。

## 小結

存檔衝突最反直覺的一點，是**它跟「有幾個人」無關**——只跟「同一份文件有沒有被存成兩條血脈」有關。XPages 上最容易自撞的寫法，就是在同一份文件上混用 `dominoDocument` 資料來源與後端 `Document` 兩套存檔。認得這個坑、把存檔收斂成單一路徑，大半的「單人卻跳存檔衝突」就消失了。想看「全程留在資料來源層、不碰後端」怎麼寫，見 [XPages 多選附件刪除](/domino-news/posts/xpages-attachment-multi-delete)。
