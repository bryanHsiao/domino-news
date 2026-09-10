---
title: "Domino 多檔上傳與依條件刪附件：傳統 web、XPages 14.5.1"
description: "上一篇講怎麼在三種情境各附一個檔；這篇進到「一次很多個」：傳統 web form 靠 HTML5 的 multiple 屬性一次選多檔、XPages 到 14.5.1 才終於預設支援多選（在那之前是 OpenNTF 社群方案的天下），以及實務上最常遇到、參考卻最少的「依條件挑著刪」——迭代 EmbeddedObjects、依 .Source 檔名條件逐一 Remove（附可照跑範例）。附一張圖說明多選的檔怎麼落到同一個富文本欄位。"
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
cover: "/covers/domino-attachments-bulk.webp"
coverStyle: "watercolor"
---

[上一篇](/domino-news/posts/domino-attachments-three-ways)把「在三種情境各附**一個**檔」講完了。真實需求通常再進一步：一次上傳**很多個**檔，以及反過來——刪附件，而實務上刪多半是**挑符合條件的刪**，不是全砍光。這兩件事各有一個近況值得講：XPages 到 14.5.1 才終於把「一次多選」做成內建，而「依條件挑著刪」明明最常遇到、參考卻最少。

先把結論用一張圖收好：不管一次選幾個檔，它們最後都落進同一份文件的同一個富文本欄位，成為多個 `$FILE` 附件——所以「清空」也可以一次對付。

![多選的檔案全部落進文件同一個 Body 富文本欄位，成為多個 $FILE 附件；doc.RemoveItem("$FILE") 一次移除所有同名 $FILE、把整份文件的附件清空](/domino-news/post-images/domino-multi-file-attachments.svg)

---

## 重點摘要

- **傳統 web form**：一次選多檔靠 HTML5 的 `multiple` 屬性——就是[那位部落格作者說的「一個字」](https://www.nevermind.dk/nevermind/blog.nsf/subject/old-school-domino-web-dev---a-very-simple-way-to-upload-multiple-files-just-one-word)。加在 File Upload 控制項上，選檔器就從單選變多選。
- **XPages**：**到 Domino 14.5.1 才官方內建**——「[The XPages file upload UI now supports multiple selections by default](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)」。在那之前，一次多檔一直是 OpenNTF 社群方案的天下。
- **刪除實務上是「挑著刪」居多**：迭代 `EmbeddedObjects`、依 `.Source`（原始檔名）的條件逐一 `Remove`，這種依條件刪的參考最少、也最常用（附可照跑範例）；真要一次清全部，`Call doc.RemoveItem("$FILE")` 一行搞定。
- **多選的檔各存成獨立 `$FILE`（實測確認）**：傳統 web 這招雖是瀏覽器行為、非 HCL 官方功能，但我們在站上環境實測——選 3 個檔送出，文件裡就是 3 個獨立的 `$FILE`（附欄位檢視器截圖）。

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

要說清楚的是：`multiple` 是**純瀏覽器的 HTML5 行為**，不是 HCL 為傳統 web form 做的官方功能——它不像 XPages 14.5.1 那樣是官方內建、寫進 What's new 的東西。但「多選的檔會不會各存成獨立的 `$FILE`」這件事，我們在站上環境**實測到底了**：選 3 個檔送出、儲存後打開文件屬性的欄位檢視器，裡面就是**三個獨立的 `$FILE` 欄位**（每個的資料類型都是「附加的物件／檔案」）：

![送出並儲存後，文件屬性的欄位檢視器裡有三個獨立的 $FILE 欄位，每個資料類型都是「附加的物件（檔案）」——多選的三個檔各存成一個 $FILE](/domino-news/post-images/domino-multiple-three-files-inspector.png)

所以結論很明確：**`multiple` 一次選的每個檔，Domino 都各存成一個獨立的 `$FILE`**。後端要撈、要刪就跟平常一樣（`rtitem.EmbeddedObjects`、`doc.GetAttachment`，見 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)）。

## 多檔上傳（二）：XPages 到 14.5.1 才內建

XPages 這一路更有意思，因為它有個明確的分界點。

**14.5.1 之前**：`xp:fileUpload` 一次只吃一個檔。要一次多選，得靠社群方案——OpenNTF 上長期有幾個現成控制項，例如 Mark Leusink 的 [XPages Multiple File Uploader](https://www.openntf.org/internal/home.nsf/project.xsp?action=openDocument&name=XPages+Multiple+File+Uploader)（早期用 Flash/SWFUpload 處理多檔選取與進度條），以及後來 Julian Buss 的 HTML5 版多檔上傳控制項。這些填補了官方缺口很多年。

⚠️ **但 Leusink 那個是用 Flash/SWFUpload 做的，而 Flash 已於 2020 年底停止支援、被所有現代瀏覽器移除**——現在實測會跳「You need the Flash Player 9.028 or above」、其實已經跑不起來，Flash 也裝不回去了。所以在 14.5.1 之前、又要多檔，請用 **Buss 的 HTML5 版**（不需 Flash），別碰 Flash 那個；或乾脆走上面傳統 web 的 `multiple`。

**14.5.1 起**：官方終於把它做進去了。HCL 14.5.1 的 What's new 一句話——「The XPages file upload UI now supports multiple selections by default」——**檔案上傳的 UI 現在預設就支援多選**。注意它是「預設行為」的改變，不是多了一個新屬性（所以 `xp:fileUpload` 的屬性清單沒變），你不必改 XSP、升上去就有。官方那頁很精簡（一句話加兩張截圖），多選之後那些檔會附到控制項綁定的那個富文本欄位上（跟單檔同一個模型）；截圖與更細的畫面可以直接開[那頁](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)看。

所以現在的建議很簡單：**環境在 14.5.1 以上，用官方內建的多選就好**；還在舊版、又需要多檔，才回頭找 OpenNTF 那幾個社群控制項。

## 刪除：真正常見的是「挑著刪」，不是「全清空」

上傳講完，反過來講刪。多數教學只教怎麼刪一個，但實務上「一次清光一份文件的**全部**附件」其實情境不多——真正天天遇到的是**挑著刪**：只刪 `.tmp` 暫存檔、只刪某個舊版本、只留最新一份、把超過某大小的清掉。偏偏這種「依條件刪」的參考特別少，所以這篇著重講它。

**挑單一個（`GetAttachment` + `Remove`）。** 已經知道要刪哪個檔名，最直接：用 `doc.GetAttachment(檔名)` 取到、`Remove`。[官方提醒](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVE_METHOD_OBJECT.html)「After calling the Remove method, you must call the Save method in NotesDocument to save the change that you made」——刪完要 `Save` 才生效：

```lotusscript
Dim eo As NotesEmbeddedObject
Set eo = doc.GetAttachment("report.pdf")          ' 挑一個特定附件
If Not eo Is Nothing Then
    Call eo.ExtractFile("C:\backup\report.pdf")   ' 先備份（可選）
    Call eo.Remove
    Call doc.Save(True, False)                     ' Remove 後要 Save 才生效
End If
```

**依條件刪好幾個（迭代 `EmbeddedObjects`）。** 這才是主戲。當你不是刪某個定死的檔名、而是「凡是符合某條件的都刪」時，就迭代富文本欄位的 `EmbeddedObjects`，在迴圈裡看每個附件的 `.Source`（附件的原始檔名），符合條件才 `Remove`。下面這段把所有 `.tmp` 結尾的附件清掉、其餘保留——`.Source` 那一行的判斷換成你自己的條件（副檔名、檔名前綴、或先前備份過的清單）即可：

```lotusscript
Dim rtitem As NotesRichTextItem
Dim eo As NotesEmbeddedObject
Dim removed As Integer

Set rtitem = doc.GetFirstItem("Body")             ' 附件掛在哪個富文本欄位
If Not rtitem Is Nothing Then
    ForAll o In rtitem.EmbeddedObjects            ' 陣列快照，迴圈裡刪是安全的
        Set eo = o
        If eo.Type = EMBED_ATTACHMENT Then        ' 只處理附件（略過 OLE 物件／連結）
            If LCase(Right(eo.Source, 4)) = ".tmp" Then   ' ← 換成你自己的條件
                Call eo.Remove
                removed = removed + 1
            End If
        End If
    End ForAll
    If removed > 0 Then Call doc.Save(True, False) ' 有動到才存
End If
```

這正是 [HCL 官方 `EmbeddedObjects` 範例](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_EMBEDDEDOBJECTS_PROPERTY_RTITEM.html)的寫法（迴圈裡逐一判斷、`Remove`、最後 `Save`）。`.Type = EMBED_ATTACHMENT` 這道過濾別省——同一個富文本欄位裡也可能躺著 OLE 物件或物件連結，不加判斷會連那些一起刪到。

（順帶澄清一個常聽到的顧慮：「邊迭代邊刪會漏掉元素」——那是對**活的、會即時變動的集合**（像 `NotesDocumentCollection`、`NotesView`）才要小心的通則；`EmbeddedObjects` 回的是**陣列快照**，不受這個影響，可以放心在迴圈裡刪。）

**真要一次清全部：一行版（`RemoveItem`）。** 少數情況確實想把附件全砍光。附件在文件裡是一個個名為 `$FILE` 的 item，而 [`RemoveItem` 官方寫明](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_REMOVEITEM_METHOD.html)「If more than one item has the specified name, all items with this name are deleted.」——同名 item 一次全刪，所以清空全部不必迴圈：

```lotusscript
Call doc.RemoveItem("$FILE")   ' 一次移除所有 $FILE，清空整份文件的附件
Call doc.Save(True, False)
```

一個細節：`$FILE` 是附件本體，富文本內容裡若還有指向附件的圖示參照，純刪 `$FILE` 之後畫面上可能殘留 icon（這點是社群常見提醒、非官方逐字，建議實測確認你的情境）。至於 Formula，沒有乾淨的「批次刪附件」@Command——要批次，就用上面的 LotusScript。

## 小結

「一次很多個」在 Domino 兩頭都有近況：上傳端，傳統 web 用 HTML5 `multiple`（輕巧、而且多檔各存獨立 `$FILE` 已實測確認）、XPages 到 **14.5.1 才官方預設支援多選**（之前靠 OpenNTF）；刪除端，真正常用的是**挑著刪**——迭代 `EmbeddedObjects`、看 `.Source` 依條件 `Remove`（陣列快照，官方範例就是邊迭代邊刪），少數要全清才用 `doc.RemoveItem("$FILE")` 一行清空。想回到「一次一個檔、三種情境」的基礎，見[上一篇](/domino-news/posts/domino-attachments-three-ways)；附件的後端撈取／抽取細節，見 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)。
