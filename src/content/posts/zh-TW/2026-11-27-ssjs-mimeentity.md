---
title: "XPages 寄 HTML mail:先 setConvertMime(false),不然 MIME 會被轉成 rich text"
description: "XPages 後端要寄一封 HTML 格式的 mail(不是純文字 rich text):帶格式、帶連結、帶公司樣式。你用 MIMEEntity 組。但第一件事不是建文件,是 session.setConvertMime(false)——因為 Domino 預設會在文件實例化時把 MIME 轉成 rich text,你不先關掉,辛苦組的 HTML 就被吃掉。這篇講那個 convert 開關(含官方自己大小寫不一致)、組一封 HTML mail 的完整順序、為什麼 MIME entity 一定要叫 Body 才寄得出去、中文怎麼不變亂碼(charset=UTF-8)、以及 entity handle 在 send/save 後就失效別再碰。"
pubDate: 2026-11-27T07:30:00+08:00
lang: zh-TW
slug: ssjs-mimeentity
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesMIMEEntity (JavaScript)（createMIMEEntity、setContentFromText、createChildEntity、handle 失效條件）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity.html"
  - title: "createMIMEEntity (NotesDocument - JavaScript)（Body 才寄得出去）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document_createMIMEEntity.html"
  - title: "setContentFromText (NotesMIMEEntity - JavaScript)（contentType 產生 Content-Type、encoding 常數）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity_setContentFromText.html"
relatedJava: []
relatedSsjs: []
coversClass: "MIMEEntity"
apiLang: "ssjs"
cover: "/covers/ssjs-mimeentity.webp"
coverStyle: "risograph"
---

XPages 後端要寄一封 **HTML 格式**的 mail:帶格式、帶超連結、帶公司樣式,不是乾巴巴的純文字。這種信內文是 MIME,你用 [`MIMEEntity`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity.html) 組。

但第一件事**不是**建文件 —— 是 `session.setConvertMime(false)`。因為 Domino 預設會在「文件被實例化時」把 MIME 轉成 composite rich text。你不先把這個轉換關掉,辛苦組好的 HTML 內文就被吃掉、變成一坨 rich text。

這篇講那個 convert 開關(含官方自己大小寫不一致的坑)、組一封 HTML mail 的完整順序、為什麼 MIME entity 一定要叫 `Body`、中文怎麼不變亂碼,以及 entity handle 在 send/save 後就失效。

---

## 招牌坑:先 setConvertMime(false),完再 restore

控制這件事的是 session 的 `IsConvertMIME`。官方:預設「This setting is initially true」,意思是 MIME 預設會被轉 rich text。所以碰 MIME 之前先關掉、做完再開回來:

```javascript
session.setConvertMime(false);   // 關掉 MIME→rich text 轉換
// …組 MIME…
session.setConvertMime(true);    // 官方:「you should restore it before exiting.」
```

時機很重要:官方「Changes to this property apply only to those items opened by the backend processor after the property has been changed.」—— 它只對「設定之後才開的 item」有效,所以**一定要在建 / 取 MIME entity 之前**設。

> 一個查證抓到的不一致:method reference 頁把方法寫成 `setConvertMIME`(MIME 大寫),但**官方範例碼用的是 `setConvertMime`**。SSJS 大小寫敏感,兩者不能混 —— 以你環境實測能跑的那個為準,別照頁面標題硬抄。

## 組一封 HTML mail 的完整順序

照官方範例的骨架,換成 HTML:

```javascript
session.setConvertMime(false);
var stream:NotesStream = session.createStream();
stream.writeText("<h2>訂單成立</h2><p>您的訂單 #12345 已確認。</p>");

var doc:NotesDocument = database.createDocument();
doc.appendItemValue("Form", "Memo");
doc.appendItemValue("Subject", "訂單確認");
doc.appendItemValue("SendTo", requestScope.to);

var body:NotesMIMEEntity = doc.createMIMEEntity();          // 預設 item 名 = Body
body.setContentFromText(stream, "text/html;charset=UTF-8", NotesMIMEEntity.ENC_NONE);

doc.send();
stream.close();
session.setConvertMime(true);
```

重點:**Content-Type 不用自己開 header**。官方:「The methods setContentFromBytes and setContentFromText generate Content-Type and Content-Transfer-Encoding headers.」—— 你把 `"text/html;charset=UTF-8"` 當 [`setContentFromText`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_MIMEEntity_setContentFromText.html) 的第二個參數傳進去,它就自動產生 `Content-Type: text/html` 這個 header。要另外加 Subject / To 這種才用 `createHeader(name)` + `setHeaderVal(...)`。

encoding(第三參數)常數:`ENC_NONE`(1725,不加 Content-Transfer-Encoding)、`ENC_QUOTED_PRINTABLE`(1726)、`ENC_BASE64`(1727)、`ENC_IDENTITY_7BIT`(1728)、`ENC_IDENTITY_8BIT`(1729)、`ENC_IDENTITY_BINARY`(1730)、`ENC_EXTENSION`(1731)。

## createMIMEEntity 要叫 "Body" 才寄得出去

這個很容易忽略。[`createMIMEEntity([itemName])`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document_createMIMEEntity.html) 不給名字時預設 item 名就是 `Body`。而官方明寫:「A MIME entity named Body (case insensitive) gets special support as a Domino mail message.」、而且「If you specify an item name other than Body, the containing document cannot be mailed.」

白話:**要寄信,MIME entity 一定要是 `Body`**(大小寫不拘)。你圖方便給它取別的名字(像 `HtmlBody`),文件就寄不出去 —— 這種「`send()` 跑了但信沒出去」最難查。

## 中文會變亂碼:charset=UTF-8 不能漏

這是中文環境的必踩。官方 Usage:「If the NotesStream input is the result of NotesStream.WriteText, translation of the internal Unicode defaults to US-ASCII.」—— `writeText` 進來的內容,**預設用 US-ASCII 落地**,中文直接變問號。要正確存,contentType 一定要帶 charset:`"text/html;charset=UTF-8"`。漏了 charset,信裡的中文就是一排 `?`。

## entity handle 在 send/save 後就失效

官方列了一組會讓 `NotesMIMEEntity` 失效的操作:「A valid NotesMIMEEntity object becomes invalid if any of the following methods are applied to the containing NotesDocument object: computeWithForm, encrypt, save, send, sign, or closeMIMEEntities.」

所以 `doc.send()` / `doc.save()` **之後,手上那個 `body` 變數就死了**,別再拿它去設 header 或讀內容。順序永遠是:組完 → 設完 content → 最後才 send / save。另外官方也提醒「Avoid processing items as both NotesItem and NotesMIMEEntity objects concurrently.」—— 同一個 item 別一邊當 NotesItem、一邊當 MIMEEntity 同時操作。

## 多段:createChildEntity

要做「HTML + 附件」這種多段信,用 `createChildEntity()` 建子 entity。官方:「If the parent's content type is multipart, the existing content type/subtype is retained; otherwise, multipart/mixed is imposed.」、而且「The parent entity should contain no content.」—— 父 entity 本身不要放內容,內容放在各個 child。多段的細節這裡不展開,知道入口是 `createChildEntity` 就好。

## 同類別在其他語言

同一個 `MIMEEntity`:

- **LotusScript**:`NotesMIMEEntity`,`CreateMIMEEntity` / `SetContentFromText`、`session.ConvertMIME = False`、`CloseMIMEEntities` 全在,一樣要先關 convert。
- **Java**:`MIMEEntity`,同樣的 `setConvertMIME(false)` + `closeMIMEEntities`,配 recycle;完整版見 [Java 的 MIMEEntity 那篇](/domino-news/posts/java-mimeentity/)。
- **SSJS 專屬的**不是 API(方法共用),而是場景:在 XPages event 裡即時把頁面內容(甚至 `inputRichText` 的 `getHTML()`)組成 HTML mail 寄出 —— API 是後端 MIME 那套,但「`setConvertMime` 的時機 + charset + handle 失效」這三刀在 XPages 即時寄信時最常中。
