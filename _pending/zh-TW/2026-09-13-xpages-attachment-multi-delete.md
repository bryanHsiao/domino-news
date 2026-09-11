---
title: "XPages 附件多選批次刪除：官方只能一次刪一個，自己補上「勾選多個、存檔一次刪」"
description: "XPages 的 File Download 控制項只給你一列一個、一次刪一個附件，沒有「勾選多個、一次刪」的原生做法——連做得很完整的生產表單也缺這塊。這篇先實測澄清一件事：原生刪除其實是「存檔才生效」、很守規矩；再用同樣 save-bounded 的官方 API（NotesXspDocument.removeAttachment）自己補上多選批次刪，在測試環境（Domino 12.0.2）做出一個可勾選、可反悔、存檔一次落地的實作。"
pubDate: 2026-09-13T07:30:00+08:00
lang: zh-TW
slug: xpages-attachment-multi-delete
tags:
  - "Domino Designer"
  - "XPages"
  - "Tutorial"
sources:
  - title: "NotesXspDocument.removeAttachment — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/reference/r_wpdr_xsp_xspdocument_removeattachment_r.html"
  - title: "NotesXspDocument.getAttachmentList — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/reference/r_wpdr_xsp_xspdocument_getattachmentlist_r.html"
  - title: "File Download control allowDelete property — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_controls_pref_allowdelete.html"
  - title: "Creating save conflicts mixing DominoDocument and Document methods（社群）— assono"
    url: "https://www.assono.de/en/blog/xpages-save-conflicts-mixing-methods"
  - title: "APAR LO68855：同名附件刪除限制（官方支援）— HCL"
    url: "https://www.ibm.com/support/pages/apar/LO68855"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: []
---

一份 XPages 文件上掛了好幾個附件，你想砍掉其中幾個。這在傳統 Notes 用戶端點一點就好，但在 XPages web 上，官方的 [File Download 控制項](https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_controls_pref_allowdelete.html)即使開了 `allowDelete="true"`，實際跑起來也是**每列一個刪除連結、一次刪一個**，沒有「勾選多個、一次刪」的原生做法。翻過 OpenNTF 和社群，多檔上傳的控制項一堆、附件唯讀清單也有，但「勾選多個附件一次刪」幾乎找不到現成的；連我手上一張做得相當完整的生產 XPages 表單（自訂上傳鈕、自畫下載表格），清單裡也還是沒有多選批次刪。

這篇就把這塊補起來——而且用對的方式補：**保住 XPages 原生刪除「存檔才生效」的好性質，只把缺的「多選」加上去。** 這也是附件系列的收尾，前面談過[多檔上傳與依條件刪（LotusScript）](/domino-news/posts/domino-attachments-bulk)和[傳統 web 用 `%%Detach` 勾選框刪除](/domino-news/posts/domino-web-attachment-ui)，這篇換 XPages。

## 重點摘要

- **官方只有一次刪一個**：`xp:fileDownload` 的 `allowDelete` 是每列一個刪除連結、逐檔刪，沒有多選批次；社群也幾乎沒有現成的多選刪控制項。
- **一件反直覺的好事**：XPages 原生附件刪除其實是**存檔才生效**（我在 Domino 12.0.2 實測），很守規矩——跟後端 LotusScript agent「還沒存就改底層」剛好相反。
- **補多選用官方 API**：`NotesXspDocument.removeAttachment(欄位, 檔名)`，官方明寫「**must save … for the change to take effect**」，天生 save-bounded；配 `getAttachmentList` 列附件。
- **別掉到後端**：不要用 `getDocument().getAttachment(name).remove()`，混用資料來源存檔與後端寫入會製造存檔衝突。
- **自己做**：`xp:repeat` 列附件 + 每列標記（收進 `viewScope` Map）+ 一顆「儲存」把新上傳與被標記的刪除**一次落地**。

## 先確認一件事：原生刪除其實很守規矩

動手之前先破一個可能的誤會。你或許以為 XPages 的附件刪除是點下去就即時砍掉——其實不是。我在自己的環境（Domino 12.0.2 FP8）實測：用原生 File Download 控制項刪一個附件、但**不要按存檔、直接關掉重開文件**，那個檔還在。也就是說，原生刪除是**跟著文件的 Save 一起 commit** 的。

這點很關鍵，因為它跟[前一篇 LotusScript 的後端批次刪](/domino-news/posts/domino-attachments-bulk)剛好相反：後端 agent 用 `Remove` + `Save` 是**直接對後端文件動刀、立刻落地**，還沒等使用者確定存檔就改了底層。XPages 原生這邊反而本來就守規矩。

所以目標很清楚：**保住這個「存檔才生效」的性質，只把缺的「多選」補上**，而不是去救什麼正確性。

## 官方地基：`removeAttachment` 與 `getAttachmentList`

補多選，用的是 XPages 資料來源（`xp:dominoDocument`）自己的 API，不必掉到後端。

列出附件——`getAttachmentList(欄位名)`，[官方](https://help.hcl-software.com/dom_designer/12.0.0/reference/r_wpdr_xsp_xspdocument_getattachmentlist_r.html)回一個 `java.util.List`、每個元素是 `NotesEmbeddedObject`：

```javascript
var atts = doc.getAttachmentList("Body");   // List<NotesEmbeddedObject>
// 官方範例：用 iterator 跑、對每個 element 取 .getName()
```

刪一個——`removeAttachment(欄位名, 檔名)`，回傳 boolean，而且[官方頁](https://help.hcl-software.com/dom_designer/11.0.1/reference/r_wpdr_xsp_xspdocument_removeattachment_r.html)寫得很直白：「**You must save the document for the change to take effect in the data store.**」

```javascript
doc.removeAttachment("Body", "report.pdf");   // 要 doc.save() 才真的落地
```

看到那句「must save … to take effect」了嗎？這正是我們要的：`removeAttachment` **本來就存檔才生效**，跟原生刪除、跟傳統 web 的 `%%Detach` 是同一個「commit on save」語義。用它補多選，等於延續原生的好性質，而不是打破它。

**一個要避開的坑**：不要為了方便掉到後端 `doc.getDocument().getAttachment(name).remove()` 去刪。[assono 有一篇](https://www.assono.de/en/blog/xpages-save-conflicts-mixing-methods)講得很清楚——在同一份文件上**混用 XPages 資料來源的 save 與後端 `Document` 的寫入**，XPages runtime 靠時間戳比對差異，會把它存成**存檔衝突文件**。留在資料來源這層用 `removeAttachment`，就不會製造衝突。

## 動手做：勾選多個、存檔一次刪

UI 很單純：一個 `xp:repeat` 跑 `getAttachmentList`、每列一個「刪除」鈕當標記，勾中的檔名收進一個 `viewScope` 的 Map；最後一顆「儲存」把新上傳與被標記的刪除**一次存檔**送出。

核心的刪除邏輯（放在那顆儲存鈕的 action 裡）：

```javascript
var del = viewScope.del;             // key=檔名, value=Boolean（使用者標記的）
var it = del.keySet().iterator();
while (it.hasNext()) {
  var nm = it.next();
  if (del.get(nm).toString() == "true") {
    doc.removeAttachment("Body", nm);   // 標記者逐一移除
  }
}
doc.save();   // 新上傳 + 刪除，同一次落地
```

幾個設計重點：

- **標記存 `viewScope`、不當場刪**：使用者點「刪除」只是把檔名標記起來（那列劃掉、可「復原」），什麼都還沒動到硬碟——直到按下「儲存」。這就是把原生的 save-bounded 語義延續到多選上。
- **上傳搭同一次存檔**：`xp:fileUpload` 選的檔在 submit 的 Update Model 階段就掛上 `doc.Body`，所以那顆 `doc.save()` 會把新上傳連同刪除一起存。
- **上傳後記得清空控制項**：`fileUpload` 上傳完若不清掉它的值，下次 submit 它會把同一個檔再掛一次、Domino 幫你自動改名成重複的 `-2` 檔——這是我們實作時實際踩到、也查了半天的雷。上傳的 AJAX 完成後（`onComplete`）用一小段 client JS 把 file input 的 `value` 清空即可。

把這套做成一個最小 XPage，在測試庫（Domino 12.0.2）跑通。成品長這樣——勾了兩個（劃掉、按鈕變「復原」）、一個維持正常，按「儲存變更」才真的刪：

![XPages 多選附件刪除的實作畫面：上方自訂「選擇檔案」上傳鈕；中間附件清單三列，其中兩列被劃掉變灰、右側按鈕顯示「復原」（已標記待刪），一列正常顯示藍色檔名與紅框「刪除」鈕；右下角深綠色「儲存變更」鈕](/domino-news/post-images/xpages-attachment-multi-delete-demo.png)

## 兩個要知道的限制

- **同名檔分不出來**：`removeAttachment` 是靠**檔名**認的，所以「同一份文件有兩個同名附件」時，沒辦法只刪其中一個——這是 name-based API 的先天限制、跟版本無關，遇到就得改用內部識別去處理。（[APAR LO68855](https://www.ibm.com/support/pages/apar/LO68855) 早年也記過原生控制項的類似狀況：刪一個同名檔會兩個一起刪；不過那是對 8.5.3 回報的、後續版本可能已修，我沒在 12.0.2 再測——但上面那個先天限制不受影響。）實務上附件同名機率低，但值得先知道。
- **沒有 undo**：一旦「儲存」把 `removeAttachment` 落地，附件就真的沒了（只能靠複本／備份救）。所以「標記 → 存檔前都可反悔」這個設計不只是好看，是實實在在給使用者一道後悔的機會。

## 小結

XPages 原生的附件刪除其實做得不差——**存檔才生效、守規矩**，只是**一次只能刪一個**。缺的那塊「勾選多個、一次刪」官方沒給、社群也幾乎沒有現成的，但自己補並不難：用資料來源層的 `removeAttachment`（一樣存檔才生效）配 `getAttachmentList`，加一個 `xp:repeat` + 標記 + 一顆存檔鈕，就能在**不破壞 save-bounded、也不製造存檔衝突**的前提下做出多選批次刪。

這也是附件系列的收尾：從[多檔上傳與依條件刪（LotusScript）](/domino-news/posts/domino-attachments-bulk)、[傳統 web 的 `%%Detach` 勾選刪](/domino-news/posts/domino-web-attachment-ui)，一路到 XPages 這個「官方沒給、自己刻」的多選批次刪。三種技術棧，同一個原則：**刪除跟著使用者的存檔走。**
