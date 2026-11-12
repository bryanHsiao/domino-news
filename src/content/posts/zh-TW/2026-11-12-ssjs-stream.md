---
title: "XPages 的 Stream:用 getContents 產檔下載,charset 要自己給"
description: "在 XPages 你要讓使用者按一個按鈕、下載一份當場產生的報表檔,或是讀一個剛上傳的檔案來解析。後端 SSJS 的 NotesStream(session.createStream)就是做這件事的工具。它有一個在 XPages 特別好用的方法:getContents 可以把 stream 的內容直接倒進一個 java.io.OutputStream——也就是 HTTP response 的輸出串流,不用先在磁碟落一個暫存檔。這篇講在 XPages 怎麼用 Stream 產檔下載、怎麼讀 fileUpload 上傳的檔、writeText 預設不加行尾的小坑,以及 charset 預設是 System(不是 UTF-8)這個同樣會咬人的點——後者的深講留給 Java 那篇,這裡只給修法。"
pubDate: 2026-11-12T07:30:00+08:00
lang: zh-TW
slug: ssjs-stream
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesStream (JavaScript)（建立、getContents/setContents 接 java.io、thread 限定）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream.html"
  - title: "open (NotesStream - JavaScript)（pathname / charset 參數;charset 預設 System）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_open.html"
  - title: "writeText (NotesStream - JavaScript)（EOL 常數;預設 EOL_NONE）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_writeText.html"
relatedJava: []
relatedSsjs: []
coversClass: "Stream"
apiLang: "ssjs"
---

在 XPages 你常會遇到這兩件事:使用者按一個按鈕,要下載一份當場產生的 CSV 或報表檔;或者使用者上傳了一個檔,你要在後端讀它、解析。兩件事都能用後端的 [`NotesStream`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream.html)——`session.createStream()` 拿到,官方定義是「Represents a stream of binary or character data. The stream can be associated with a file.」

Stream 在 XPages 特別好用的是一個方法:`getContents` 可以把 stream 的內容**直接倒進一個 `java.io.OutputStream`**。而 HTTP response 的輸出串流正好就是一個 `java.io.OutputStream`——所以你可以把產好的檔案內容直接串給瀏覽器下載,中間不用先在伺服器磁碟落一個暫存檔。

這篇講在 XPages 怎麼用 Stream 產檔下載、怎麼讀上傳的檔、`writeText` 的行尾小坑,還有 charset 預設是 System 這個會咬人的點。

---

## 產檔下載:getContents 直接倒進 response

一個典型的「匯出按鈕」:在事件裡把資料寫進 stream,再用 `getContents` 倒進 response 的輸出串流:

```javascript
var stream = session.createStream();
stream.open("/local/temp/export-" + session.getUserName() + ".csv", "UTF-8");
stream.writeText("訂單編號,狀態", NotesStream.EOL_CRLF);
stream.writeText("A001,已處理",  NotesStream.EOL_CRLF);

// 把檔案內容串給瀏覽器下載
var ec = facesContext.getExternalContext();
var response = ec.getResponse();
response.setContentType("text/csv; charset=UTF-8");
response.setHeader("Content-Disposition", "attachment; filename=export.csv");
stream.getContents(response.getOutputStream());
stream.close();
facesContext.responseComplete();   // 告訴 JSF:response 我自己處理完了
```

重點是 `stream.getContents(response.getOutputStream())`——官方寫 getContents「Copies contents to a java.io.OutputStream」,而 response 的輸出串流就是這個型別。資料直接從 Domino 的 stream 流到瀏覽器,全程不落地暫存檔。

## charset 預設是 System,不是 UTF-8

跟 [`open`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_open.html) 有關的一個坑,在 XPages 一樣存在:`open(path)` 不帶第二個參數時,charset **預設是 System**(伺服器平台編碼),不是 UTF-8。官方明寫「Defaults to System.」。你的 CSV 裡有中文、又沒指定 charset,在一台 locale 不是 UTF-8 的 server 上就會變亂碼,而且 response header 寫 `charset=UTF-8` 只會讓情況更糟——宣告的編碼和實際寫出去的編碼對不上。

所以產檔時一定 `open(path, "UTF-8")`,而且和 response 的 `setContentType("...; charset=UTF-8")` 保持一致。這個 charset 預設的來龍去脈,在 [Java 的 Stream 那篇](/domino-news/posts/java-stream/) 講得更細——同一個坑,兩種語言都踩得到。

## writeText 預設不加行尾

另一個小坑在 [`writeText`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Stream_writeText.html):單參數版用的是 `EOL_NONE`(官方「The default is NotesStream.EOL_NONE.」),也就是不加任何行尾。你一行一行寫 CSV,如果不帶第二個參數,全部會黏成一行。要分行就傳 `NotesStream.EOL_CRLF`(0)、`EOL_LF`(1)、`EOL_CR`(2)。CSV 慣例是 CRLF,所以上面範例用 `EOL_CRLF`。

## 讀上傳檔:fileUpload → 暫存檔 → open

反過來,讀一個使用者上傳的檔:XPages 的 `fileUpload` 控制項會把檔案存成伺服器端的一個暫存檔,你拿到它的路徑,用 Stream open 來讀:

```javascript
// uploadedFile 是 fileUpload 綁定的值(com.ibm.xsp.http.UploadedFile)
var path = uploadedFile.getServerFileName();   // 伺服器端暫存路徑
var stream = session.createStream();
stream.open(path, "UTF-8");
var line = stream.readText();                   // 依 charset 解碼
// …解析…
stream.close();
```

要做純位元組的處理(算雜湊、原樣搬檔),`open(path, "Binary")`,之後 stream 只做 byte 操作。

## 一個邊界:thread 限定,別塞進 scope

官方在 class 頁寫了「Use of a NotesStream object is limited to the thread in which is created.」。在 XPages 裡這句話的實際意思是:**別把一個 Stream 物件存進 `sessionScope` / `applicationScope` 想跨 request 重用**——下一個 request 很可能是不同 thread,那個 stream 已經失效。每次要用就 `session.createStream()` 當場建、用完 `close`。Stream 的生命週期跟著當前 request,不像背景 Java 那樣要你自己收,但它不是能跨請求保存的東西。

## 同類別在其他語言

同一個 `Stream`:

- **LotusScript**:`NotesStream`,`Open` / `WriteText` / `ReadText` 都在,但沒有 `getContents` 這種直接倒進 `java.io.OutputStream` 的橋接——那是 Java/SSJS 共用 Java 底層才有的。
- **Java**:`Stream`,API 一模一樣;charset 預設 System 的坑與 `getContents`/`setContents` 的細節,見 [Java 的 Stream 那篇](/domino-news/posts/java-stream/)。
- **SSJS 專屬的**不是 API(方法共用),而是**在 XPages 裡怎麼接**:`getContents` 倒進 `facesContext` 的 response 做下載、`fileUpload` 的暫存檔當輸入、搭配 `responseComplete()`,以及別把 thread 限定的 stream 塞進 scope。
