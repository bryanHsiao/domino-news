---
title: "Domino 多檔上傳與批次刪除：傳統 web、XPages 14.5.1、一行清空附件"
description: "上一篇講怎麼在三種情境各附一個檔；這篇進到「一次很多個」：傳統 web form 靠 HTML5 的 multiple 屬性一次選多檔、XPages 到 14.5.1 才終於預設支援多選（在那之前是 OpenNTF 社群方案的天下），以及很少人著墨的批次刪除——doc.RemoveItem(\"$FILE\") 一行清掉整份文件的所有附件。附一張圖說明多選的檔怎麼落到同一個富文本欄位。"
pubDate: 2026-09-09T07:30:00+08:00
lang: zh-TW
slug: domino-attachments-bulk
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "XPages support for multiple file uploads — HCL Domino 14.5.1 What's new"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html"
  - title: "RemoveItem method (NotesDocument) — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVEITEM_METHOD.html"
  - title: "Remove method (NotesEmbeddedObject) — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVE_METHOD_OBJECT.html"
  - title: "Old-school Domino web dev — upload multiple files, just one word（Jesper Kiaer, nevermind.dk）"
    url: "https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word"
  - title: "XPages Multiple File Uploader（Mark Leusink）— OpenNTF"
    url: "https://www.openntf.org/internal/home.nsf/project.xsp?action=openDocument&name=XPages+Multiple+File+Uploader"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: []
---

[上一篇](/domino-news/posts/domino-attachments-three-ways)把「在三種情境各附**一個**檔」講完了。真實需求通常再進一步：一次上傳**很多個**檔，以及反過來——把一份文件的附件**一次清光**。這兩件事各有一個近況值得講：XPages 到 14.5.1 才終於把「一次多選」做成內建，而批次刪除其實有一行就搞定的寫法、卻很少人提。

先把結論用一張圖收好：不管一次選幾個檔，它們最後都落進同一份文件的同一個富文本欄位，成為多個 `$FILE` 附件——所以「清空」也可以一次對付。

![多選的檔案全部落進文件同一個 Body 富文本欄位，成為多個 $FILE 附件；doc.RemoveItem("$FILE") 一次移除所有同名 $FILE、把整份文件的附件清空](/domino-news/post-images/domino-multi-file-attachments.svg)

---

## 重點摘要

- **傳統 web form**：一次選多檔靠 HTML5 的 `multiple` 屬性——就是[那位部落格作者說的「一個字」](https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word)。加在 File Upload 控制項上，選檔器就從單選變多選。
- **XPages**：**到 Domino 14.5.1 才官方內建**——「[The XPages file upload UI now supports multiple selections by default](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)」。在那之前，一次多檔一直是 OpenNTF 社群方案的天下。
- **批次刪除有一行版**：`Call doc.RemoveItem("$FILE")` 一次移除所有同名 `$FILE` item——等於清空整份文件的附件；另一條路是迴圈 `EmbeddedObjects` 逐一 `Remove`。
- **一個要老實說的地方**：傳統 web 那招「多選的檔是否每個都各存成獨立 `$FILE`」，官方文件沒有背書、只有作者的實測宣稱——要靠它，先在自己環境測一次。

---

## 多檔上傳（一）：傳統 web 的「一個字」

傳統 web form 的 File Upload Control 本來是一次一個檔。[nevermind.dk 的 Jesper Kiaer](https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word) 指出一個「一個字」就解掉的老派招數：加上 HTML5 的 **`multiple`** 屬性，選檔器就從單選變成一次可選多個。

具體加在哪？打開 **File Upload Control 屬性框 →「HTML 標籤」（`<HTML>`）頁 →「其他」欄**，填入 `multiple`：

![File Upload Control 屬性框的「HTML 標籤」頁，在「其他」欄填入 multiple](/domino-news/post-images/domino-multiple-attribute-property.png)

這招我們在站上的 Domino Designer 實測過。填好 `multiple` 之後，按網頁上的「選擇檔案」開啟的檔案對話框就能一次挑好幾個：

![填了 multiple 之後，web 表單的檔案對話框可以一次選取多個檔](/domino-news/post-images/domino-multiple-attribute-picker.png)

選好送回來，按鈕旁就顯示「3 個檔案」——多選確實生效：

![選完之後，web 選檔器按鈕旁顯示「3 個檔案」](/domino-news/post-images/domino-multiple-attribute-result.png)

（作者也提到一個 Designer 小雷：控制項**從選單插入比較保險**，在 Designer 裡剪貼上傳控制項有時會渲染不對。）

要說清楚的是：`multiple` 是**純瀏覽器的 HTML5 行為**，不是 HCL 為傳統 web form 做的官方功能——它能用、我們也驗了多選這一步，但它不像 XPages 14.5.1 那樣是官方內建、寫進 What's new 的東西。至於送出後每個檔是否各存成一個獨立的 `$FILE`，上面截圖只驗到「選取」這一步；「儲存」那步可用 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object) 那篇的 `rtitem.EmbeddedObjects` 在自己環境數一次確認。

## 多檔上傳（二）：XPages 到 14.5.1 才內建

XPages 這一路更有意思，因為它有個明確的分界點。

**14.5.1 之前**：`xp:fileUpload` 一次只吃一個檔。要一次多選，得靠社群方案——OpenNTF 上長期有幾個現成控制項，例如 Mark Leusink 的 [XPages Multiple File Uploader](https://www.openntf.org/internal/home.nsf/project.xsp?action=openDocument&name=XPages+Multiple+File+Uploader)（早期用 Flash/SWFUpload 處理多檔選取與進度條），以及後來 Julian Buss 的 HTML5 版多檔上傳控制項。這些填補了官方缺口很多年。

**14.5.1 起**：官方終於把它做進去了。HCL 14.5.1 的 What's new 一句話——「The XPages file upload UI now supports multiple selections by default」——**檔案上傳的 UI 現在預設就支援多選**。注意它是「預設行為」的改變，不是多了一個新屬性（所以 `xp:fileUpload` 的屬性清單沒變），你不必改 XSP、升上去就有。官方那頁很精簡（一句話加兩張截圖），多選之後那些檔會附到控制項綁定的那個富文本欄位上（跟單檔同一個模型）；截圖與更細的畫面可以直接開[那頁](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)看。

所以現在的建議很簡單：**環境在 14.5.1 以上，用官方內建的多選就好**；還在舊版、又需要多檔，才回頭找 OpenNTF 那幾個社群控制項。

## 批次刪除：很少人提的一行版

上傳講完，反過來——怎麼一次刪掉一份文件的**所有**附件？多數教學只教怎麼刪一個，批次很少人著墨。其實有兩條路。

**做法一：一行清空（`RemoveItem`）。** 附件在文件裡是一個個名為 `$FILE` 的 item，而 [`RemoveItem` 官方寫明](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVEITEM_METHOD.html)：「If more than one item has the specified name, all items with this name are deleted.」——同名的 item 會一次全刪。所以：

```lotusscript
Call doc.RemoveItem("$FILE")   ' 一次移除所有 $FILE，清空整份文件的附件
Call doc.Save(True, False)
```

一行、不必迴圈、也沒有「邊迭代邊刪」的漏刪問題。要留意一個細節：`$FILE` 是附件本體，富文本內容裡若還有指向附件的圖示參照，純刪 `$FILE` 之後畫面上可能殘留 icon（這點是社群常見提醒、非官方逐字，建議實測確認你的情境）。

**做法二：挑著刪（`GetAttachment` + `Remove`）。** 想在刪之前先做別的事（先抽取備份、或依檔名挑特定幾個刪），就走這條。用 `doc.GetAttachment(檔名)` 取到那個附件、`Remove`，[官方提醒](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVE_METHOD_OBJECT.html)「After calling the Remove method, you must call the Save method in NotesDocument to save the change that you made」——刪完要 `Save` 才生效：

```lotusscript
Dim eo As NotesEmbeddedObject
Set eo = doc.GetAttachment("report.pdf")          ' 挑一個特定附件
If Not eo Is Nothing Then
    Call eo.ExtractFile("C:\backup\report.pdf")   ' 先備份（可選）
    Call eo.Remove
    Call doc.Save(True, False)                     ' Remove 後要 Save 才生效
End If
```

要**依條件刪好幾個**時，有個雷要避開：**「邊 `ForAll` 迭代 `EmbeddedObjects`、邊 `Remove`」在社群普遍被認為會漏刪**（改到集合、指標跳位）。所以刪多個的穩妥做法是**先把要刪的檔名收集起來、再逐一 `GetAttachment(...).Remove`**，或乾脆用做法一的 `RemoveItem` 一次清。這個「邊迭代邊刪會漏」是社群共識、不是 HCL 官方逐字寫的，但夠多人踩過、值得預設避開。至於 Formula，沒有乾淨的「批次刪附件」@Command——要批次，就用上面的 LotusScript。

## 小結

「一次很多個」在 Domino 兩頭都有近況：上傳端，傳統 web 用 HTML5 `multiple`（輕巧、但多檔各存 `$FILE` 這步自己驗一下）、XPages 到 **14.5.1 才官方預設支援多選**（之前靠 OpenNTF）；刪除端，`doc.RemoveItem("$FILE")` 一行清空整份文件的附件，或用 `EmbeddedObjects` + `Remove` 逐一處理（別邊迭代邊刪）。想回到「一次一個檔、三種情境」的基礎，見[上一篇](/domino-news/posts/domino-attachments-three-ways)；附件的後端撈取／抽取細節，見 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)。
