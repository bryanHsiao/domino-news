---
title: "XPages 塞 rich text:appendText 不會換段,還有存檔邊界那一刀"
description: "XPages 後端要組一份有格式的文件 body 或 mail 內文:幾行文字,加一個附件。你 createRichTextItem、用 appendText 一行一行加、中間放 \\n 換行——結果全部擠成一段。因為 appendText 不理你的換行,要分段得自己呼叫 addNewLine。附件要用 embedObject,第二個 class 參數是空字串這個很多人卡住。最後還有一刀:rich text 改了,不 doc.save() 就什麼都沒寫進去,而在 XPages 裡這跟資料源的存檔模型會打架。這篇講建立/取得 rich text item、換段、加附件、存檔邊界,以及怎麼讀回純文字。"
pubDate: 2026-11-25T07:30:00+08:00
lang: zh-TW
slug: ssjs-richtextitem
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesRichTextItem (JavaScript)（appendText、addNewLine、embedObject、getUnformattedText）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem.html"
  - title: "appendText (NotesRichTextItem - JavaScript)（換行不等於換段）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_appendText.html"
  - title: "embedObject (NotesRichTextItem - JavaScript)（EMBED_ATTACHMENT 加附件）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_embedObject.html"
relatedJava: []
relatedSsjs: []
coversClass: "RichTextItem"
apiLang: "ssjs"
---

XPages 後端程式要組一份有格式的文件 body:標題、幾行說明、再夾一個剛產好的報表檔。或是組一封 mail 內文。你用 `createRichTextItem` 開一個 rich text item,`appendText` 一行一行加、字串裡放 `\n` 想換行 —— 跑出來**全部擠成一段**,換行像沒發生過。

因為 `appendText` 根本不理你字串裡的換行。而且就算你排好了版,只要忘了 `doc.save()`,整段 rich text **一個字都沒寫進去** —— 在 XPages 裡這還會跟資料源的存檔模型打架。

這篇講:怎麼建立 / 取得 rich text item、怎麼正確換段、怎麼加附件(那個 `embedObject` 的空字串參數很多人卡)、存檔邊界,還有怎麼把 rich text 讀回純文字。

---

## 建立 / 取得 rich text item

[`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem.html) 官方定義就一句「Represents an item of type rich text.」,它繼承自 `NotesItem`。在 SSJS 裡:

```javascript
// 新建一個
var rt:NotesRichTextItem = doc.createRichTextItem("Body");
// 取既有的 → 用 getFirstItem("Body")
```

官方寫得很直接:「To create a new NotesRichTextItem object, use createRichTextItem in NotesDocument.」、取既有的「use getFirstItem in NotesDocument.」。這裡 `doc` 是後端的 `NotesDocument`(在 XPages 裡常常是從資料源 `document1.getDocument(true)` 拿到的那份,詳見 [XPages 後端 NotesDocument 那篇](/domino-news/posts/ssjs-backend-document/))。

## 招牌坑:appendText 不換段 —— 要 addNewLine

這是最常踩的。[`appendText`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_appendText.html) 官方:「Appends text to a rich text item.」,但緊接著一句:「New lines (carriage returns) inserted in appended text do not cause new paragraphs. To create a new paragraph, use addNewLine.」

翻成白話:你在字串裡塞的 `\n`、`\r`,**不會變成段落**。要分段,得明確呼叫 `addNewLine()`:

```javascript
var rt:NotesRichTextItem = doc.createRichTextItem("Body");
rt.appendText("訂單 #12345 已成立。");
rt.addNewLine();                 // 不給參數 = 換一行、而且預設是「換段」
rt.appendText("明細如附件。");
rt.addNewLine(2);                // 換兩行
rt.appendText("—— 系統自動發送");
```

`addNewLine` 的第二個參數 `newparagraph` 預設 `true`,官方:「If true (default), forces the new line to be a paragraph separator.」—— 所以空的 `addNewLine()` 本來就會換段;給 `false` 才是「只換行、不換段」。另外 `appendText` 有個上限:「Paragraphs are restricted to approximately 35K of text and are automatically divided if this limit is exceeded.」,超過 35K 會自動被切段。

## 加附件:embedObject

把檔案夾進 rich text item 用 [`embedObject`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_RichTextItem_embedObject.html),四個參數:

```javascript
rt.embedObject(NotesEmbeddedObject.EMBED_ATTACHMENT, "", "C:\\temp\\report.pdf", null);
//             type（附件=1454）                      class  要夾的檔案路徑        參照名(可 null)
```

- 第一個 `type`:附件用 `EMBED_ATTACHMENT`(值 1454);另有 `EMBED_OBJECT`(1453,只給 OLE/1)。
- **第二個 `class` 卡最多人** —— 官方明寫「Specify an empty string ("").」,就是給空字串,不是填什麼 MIME type 或類別名。
- 第三個是要夾的檔案路徑;第四個是之後要引用它時的名字,可以 `null`。
- 一個平台限制:OLE 內嵌物件在 UNIX / Mac 不支援,但**檔案附件所有平台都支援**。

## 存檔邊界:改了不 save 就沒了

這一刀在 XPages 特別容易中。官方白紙黑字:「When you change the value of a NotesRichTextItem object, the change is not written to disk until you call save for the parent NotesDocument object.」—— 你對 rich text item 做的所有事,**要父 `NotesDocument` 的 `save()` 才真的落地**。

```javascript
var rt:NotesRichTextItem = doc.createRichTextItem("Body");
rt.appendText("…"); rt.addNewLine(); rt.embedObject(…);
doc.save();     // 少了這行，上面全白做
```

在 XPages 裡還有第二層:如果你是對**資料源背後的後端 doc** 動 rich text,又讓資料源自己也存一次,兩邊的存檔會互相覆蓋、甚至 save conflict —— 這跟 [XPages 後端 NotesDocument 那篇](/domino-news/posts/ssjs-backend-document/)講的是同一個坑。原則:想清楚你在對哪一份 doc 寫、由誰負責 save,別兩邊都存。

(另外,如果文件正在編輯模式開著,rich text 的改動不會即時顯示;官方:「You must close and reopen the document to see changes.」—— 這是正常的,不是沒寫進去。)

## 讀回純文字

要把 rich text 讀成字串,兩個方法:

- `getUnformattedText()` —— 原樣:「Tabs and carriage returns are left intact.」,不 wrap、tab 不處理。
- `getFormattedText(tabstrip, linelen, maxlen)` —— 可控:`tabstrip` 把 tab 換成空格、`linelen`(0 = 80 字)、`maxlen`(0 = 預設)。注意它「strips out non-text data, such as bit maps and file attachments.」—— **附件和點陣圖會被濾掉**,只給你文字。

## 同類別在其他語言

同一個 `RichTextItem`:

- **LotusScript**:`NotesRichTextItem`,`AppendText` / `AddNewLine` / `EmbedObject` 全在,行為一致 —— 一樣「AppendText 不換段」、一樣要 `NotesDocument.Save`。
- **Java**:`RichTextItem`,同樣的 API,配 recycle;完整版見 [Java 的 RichTextItem 那篇](/domino-news/posts/java-richtextitem/)。
- **SSJS 專屬的**不是 API(方法共用),而是場景:在 XPages button / event 裡即時組 body、夾附件、再決定由誰 save —— API 是後端那套,但「存檔邊界跟資料源怎麼搭」是 XPages 才要操心的事。
