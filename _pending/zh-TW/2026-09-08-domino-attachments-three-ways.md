---
title: "Domino 附件的三種上傳法：Notes client、傳統 web form、XPages"
description: "在 Notes client 附一個檔案，把它拖進富文本欄位就好，簡單到不像個功能。但同樣的需求搬到 web、或搬進 XPages，「怎麼讓使用者上傳檔案」就變成三個不同的答案：client 靠富文本欄位、傳統 web form 用 File Upload Control 這個內嵌元素、XPages 用 xp:fileUpload 搭 xp:fileDownload。這篇把三種前端上傳機制擺在一起對照，並點出讓人安心的一件事——三者最後都落在文件的同一個富文本欄位裡，所以後端撈檔、抽取、刪除的程式碼是共用的。"
pubDate: 2026-09-08T07:30:00+08:00
lang: zh-TW
slug: domino-attachments-three-ways
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "EmbedObject method (NotesRichTextItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EMBEDOBJECT_METHOD.html"
  - title: "Creating a file upload control (classic web) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html"
  - title: "File Upload control (xp:fileUpload) — HCL Domino Designer 14.5 XPages"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_fileupload.html"
  - title: "File Download control (xp:fileDownload) — HCL Domino Designer 14.5 XPages"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_filedownload.html"
  - title: "URL commands for opening image files, attachments, and OLE objects — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_IMAGE_FILES_ATTACHMENTS_AND_OLE_OBJECTS.html"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: []
---

在 Notes client 附一個檔案有多容易？打開一份文件、把檔案拖進一個富文本欄位，放手，就好了。容易到你不會覺得那是一個「功能」。

但同一個需求換個場景就沒那麼理所當然了。老闆說「這張表單也要能在瀏覽器上傳檔案」，或者你正在用 XPages 重寫這個應用——這時候「怎麼讓使用者上傳檔案」不是一個答案，是三個：client 一種、傳統 web form 一種、XPages 又一種。

好消息是，這三條路最後都通到同一個地方。搞懂那個「同一個地方」，三種情境就串起來了。

---

## 重點摘要

- **三種前端、同一個儲存**：不管使用者從 client、web form 還是 XPages 上傳，檔案最後都變成文件某個**富文本欄位**上的一個附件（在 LotusScript 裡就是一個 `NotesEmbeddedObject`）。
- **Client**：富文本欄位天生就收附件，拖進去或用選單附加即可，不必寫程式。
- **傳統 web form**：用一個內嵌元素——[File Upload Control](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html)（`Create - Embedded Element - File Upload Control`），這是 **web 專用**的控制項。
- **XPages**：用 [`xp:fileUpload`](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_fileupload.html) 上傳、搭 `xp:fileDownload` 顯示與下載，兩者都**綁到同一個富文本欄位**。
- **後端程式共用**：因為都落在富文本欄位，撈檔、抽取到磁碟、刪除的 LotusScript 三種情境完全一樣——站上 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)那篇已經走過。

---

## 共同底層：附件是富文本欄位上的一個 embedded object

先把「同一個地方」講清楚，後面三種情境才好對照。

在 Domino 裡，一個附件不是散在文件某處的裸檔，而是掛在某個**富文本欄位**上的一個 [`NotesEmbeddedObject`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EMBEDOBJECT_METHOD.html)——官方對這個類別的定義涵蓋三種東西：「An embedded object, An object link, A file attachment.」附件是其中一種（`Type` 為 `EMBED_ATTACHMENT`）。它的資料跟富文本內容分開存放，但邏輯上就掛在那個欄位下。

這也是為什麼你在瀏覽器能用一條 URL 把附件抓出來——Domino 用 `$File` 這個元素名對外服務它：

```
http://Host/Database/View/Document/$File/Filename?OpenElement
```

記住這個模型：**上傳的前端有三種，但終點都是「某個富文本欄位上的一個附件」**。所以下面三節講的其實是同一件事的三個入口。

## Notes client：富文本欄位，拖進去就好

client 這一路沒什麼好教的，這正是重點——**富文本欄位天生就收附件**。使用者在編輯模式把檔案拖進富文本欄位、或用選單附加，檔案就掛上去了，不必你寫一行程式。這就是開頭說的「容易到不像功能」。

要用程式做（例如自動附一個產生好的報表），才會用到 [`NotesRichTextItem.EmbedObject`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EMBEDOBJECT_METHOD.html)：

```lotusscript
Dim rt As NotesRichTextItem
Set rt = doc.GetFirstItem("Body")
Call rt.EmbedObject(EMBED_ATTACHMENT, "", "C:\reports\Q3.pdf")   ' EMBED_ATTACHMENT = 1454
Call doc.Save(True, False)
```

`EmbedObject` 官方一句話：「Attaches the file you specify to a rich text item.」第一參數用 `EMBED_ATTACHMENT`（值 1454）、第二個 `class$` 附檔時傳空字串、第三個是要附的檔名。附上去之後怎麼列、怎麼抽取、怎麼刪，站上 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)那篇講得很完整，這裡不重複。

## 傳統 web 的 Notes form：File Upload Control

把同一張表單搬上瀏覽器，就不能靠「拖進富文本欄位」了——瀏覽器沒有那個互動。Domino 對傳統 web form 提供的是一個**內嵌元素**：[File Upload Control](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATING_A_FILE_UPLOAD_CONTROL_STEPS.html)。在 Designer 裡的步驟很直接：

> Choose Create - Embedded Element - File Upload Control.

幾個要知道的點：

- **它是 web 專用的**：官方明講「The file upload control is not supported in Notes」——放了它，在 Notes client 開這張表單不會有作用，它只在瀏覽器上渲染成一個檔案選擇框。
- **要在編輯模式**：使用者是在「建立表單或以編輯模式開啟文件」時才能附檔——跟 client 一樣，唯讀模式不能上傳。
- **檔案附到文件上**：送出後，檔案就成為這份文件的附件（跟 client 同一個模型），伺服器端需要有設好的暫存目錄讓附件落地。

上傳之後要在伺服器端處理（驗證、改名、搬去別的欄位、通知），就掛一個 **WebQuerySave** agent，用跟 client 完全一樣的後端 API——`doc.HasEmbedded`、`doc.GetAttachment(檔名)`、富文本欄位的 `EmbeddedObjects`、`ExtractFile`——處理它。要讓使用者把附件下載回去，就給那條 `$File/Filename?OpenElement` 的 [URL](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_IMAGE_FILES_ATTACHMENTS_AND_OLE_OBJECTS.html)。

## XPages：xp:fileUpload 搭 xp:fileDownload

XPages 把上傳與下載拆成兩個成對使用的核心控制項，而且——這是關鍵——兩個都**綁到文件的同一個富文本欄位**。

- **[`xp:fileUpload`](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_fileupload.html)**：官方定義「Uploads a file from the local file system.」它的 `value` 要「binds a control to a data element or other value which must be of type rich text」——也就是綁一個富文本欄位。
- **[`xp:fileDownload`](https://help.hcl-software.com/dom_designer/14.5.0/xpageuser/wpd_controls_cref_filedownload.html)**：「Downloads a file to the local file system.」綁同一個富文本欄位，把已附的檔案列出來讓使用者點下載；`rows` 控制最多顯示幾列、`allowDelete` 決定使用者能不能刪附件。

典型寫法就是把兩個控制項放在同一個 XPage、`value` 都指向同一份文件資料源的同一個富文本欄位：

```xml
<xp:fileUpload id="fileUpload1" value="#{document1.body}" />

<xp:fileDownload id="fileDownload1" value="#{document1.body}"
    rows="30" allowDelete="true" />
```

使用者選檔、儲存文件時，`xp:fileUpload` 把檔案附進 `body` 這個富文本欄位；`xp:fileDownload` 則從同一個欄位把清單顯示出來、可下載、（開了 `allowDelete` 時）可刪。上傳與下載綁同一欄位，才會是同一批附件——這是 XPages 這一路最容易接錯的地方。

## 三種情境一張表

| | 上傳機制 | 綁定對象 | 刪除 | 後端處理 |
| --- | --- | --- | --- | --- |
| **Notes client** | 富文本欄位（拖放／選單附加） | 富文本欄位 | client 直接刪 | 共用（[7/07 篇](/domino-news/posts/notes-embedded-object)） |
| **傳統 web form** | File Upload Control（內嵌元素，web 專用） | 附到文件 | WebQuerySave / URL | 共用 |
| **XPages** | `xp:fileUpload` | 富文本欄位（`value`） | `xp:fileDownload` 的 `allowDelete` | 共用 |

三欄的「上傳機制」各不相同，但最右欄一樣——因為終點都是同一個富文本欄位上的附件。

## 同類別在其他語言

Java 端對應 `RichTextItem` 與 `EmbeddedObject`（同一個「附件是富文本上的 embedded object」模型，方法名對得起來）；XPages／SSJS 這一側不是用某個 class，而是用上面那兩個控制項（`xp:fileUpload`／`xp:fileDownload`）綁富文本欄位來做。

## 小結

「怎麼讓使用者上傳檔案」在 Domino 有三個入口：client 的富文本欄位（天生就會、最容易）、傳統 web form 的 File Upload Control（web 專用內嵌元素）、XPages 的 `xp:fileUpload`＋`xp:fileDownload`（綁同一個富文本欄位）。前端三種寫法，終點是同一個——文件某個富文本欄位上的附件。也因此，附上去之後撈它、抽取它、刪它的 LotusScript，三種情境共用一套；那一套的細節在 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)。想更底層地理解富文本欄位本身，回 [NotesRichTextItem 入門](/domino-news/posts/notes-rich-text-item)。
