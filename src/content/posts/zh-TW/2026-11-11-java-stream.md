---
title: "Java 的 Stream 讀寫檔案:預設 charset 不是 Unicode,是 System"
description: "在 Java 你要把一份文件的文字寫成檔案、或讀一個檔案進來。Domino 的 Stream(session.createStream)是跟 Domino 編碼體系整合的那條路,也是 MIMEEntity、附件底層在用的串流。但它有個會讓中文默默變亂碼的坑:新建的 Stream 回報 Charset 是 Unicode,可是 open(path) 沒帶 charset 參數時,預設卻是 System(伺服器的平台編碼)——不是 Unicode。這篇講怎麼拿到 Stream、open 的 charset 陷阱、writeText 預設不加行尾(EOL_NONE)的小坑、binary 模式與 getContents/setContents 怎麼接 java.io,以及 thread 限定和 recycle 兩個邊界。"
pubDate: 2026-11-11T07:30:00+08:00
lang: zh-TW
slug: java-stream
tags:
  - "Java"
sources:
  - title: "Stream class (Java)（建立、Charset/Position 屬性、open/readText/writeText/getContents 方法、thread 限定）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS_JAVA.html"
  - title: "open (Stream - Java)（pathname / charset 參數;charset 預設 System;Binary 與 Unicode 值）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM_JAVA.html"
  - title: "writeText (Stream - Java)（EOL_CRLF / EOL_LF / EOL_CR / EOL_NONE 常數;預設 EOL_NONE）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "Stream"
apiLang: "java"
cover: "/covers/java-stream.webp"
coverStyle: "low-poly-3d"
---

你在 Java 要把一份文件的 `Body` 寫成一個 `.txt`,或把一個檔案讀進來塞進欄位。直覺會去抓 `java.io.FileWriter`。但如果這段碼跑在 Domino 裡,還有另一條路:[`Stream`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS_JAVA.html)——`session.createStream()` 拿到,官方定義是「Represents a stream of binary or character data.」它跟 Domino 的編碼體系整合,也是 `MIMEEntity`、附件底層在用的那條串流。

問題是它有個很安靜的坑。新建一個 Stream,它回報的 `Charset` 是 Unicode;你大概會假設「那寫中文沒事」。可是真正決定編碼的是 `open` 那一刻——而 `open(path)` 不帶 charset 參數時,**預設是 "System",不是 Unicode**。System 是伺服器的平台編碼;你的 UTF-8 中文就這樣被用伺服器 locale 編碼寫出去,開檔一看是亂碼,而且沒有任何錯誤。

這篇講怎麼拿到並用 Stream、`open` 的 charset 陷阱、`writeText` 預設不加行尾的小坑、binary 模式與怎麼接 `java.io`,還有 thread 限定和 recycle 兩個會咬人的邊界。

---

## 拿到 Stream,以及 open 的 charset 陷阱

Stream 從 `session` 建,不是從 database:

```java
Stream stream = session.createStream();
stream.open("/local/export/body.txt", "UTF-8");   // 一定要帶第二個參數
```

剛建好、還沒 open 的 Stream,`Charset` 是 Unicode、`Bytes` 是 0、`Position` 是 0。但 [`open`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM_JAVA.html) 有兩個版本:`open(String pathname)` 和 `open(String pathname, String charset)`。官方對 charset 寫得很直白——「The character set used by the file... **Defaults to "System."**」

所以關鍵不是「新 Stream 的預設是什麼」,而是「open 時你有沒有指定」:

- `open(path)` → 用 **System**(伺服器平台編碼)。在一台 locale 不是 UTF-8 的 Domino server 上寫中文,就是亂碼的來源。
- `open(path, "UTF-8")` → 明確用 UTF-8,跨平台一致。

有效的 charset 值包含 `UTF-8`、`UTF-16`(等同 `Unicode`)、`UTF-16BE` / `UTF-16LE`、`ISO-8859-1` 到 `ISO-8859-9`、`Shift-JIS`,還有 `Binary`(只做 byte 操作,下面會講)。**養成永遠傳第二個參數的習慣**,別讓 System 在不同主機上給你不一樣的結果。

另外 `open` 在檔案不存在時會建立它;但如果這個 stream 已經開著、已經有內容、或你給的 charset 無效,`open` 會回 `false` 而不是丟例外——記得檢查回傳值。

## writeText 預設不加行尾,readText 讀文字

把文字寫進 stream 用 [`writeText`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM_JAVA.html),它回傳寫入的字元數。這裡又有個預設值的坑:

```java
stream.writeText(doc.getItemValueString("Body"));                 // 不加任何行尾
stream.writeText(doc.getItemValueString("Body"), Stream.EOL_CRLF); // 補 CRLF
```

單參數版用的是 `EOL_NONE`——官方寫「Stream.EOL_NONE (5) appends nothing. Default.」。也就是說你一行一行寫,如果不帶第二個參數,全部會黏成一行。要分行就傳 EOL 常數:`EOL_CRLF`(0,CR+LF)、`EOL_LF`(1,LF)、`EOL_CR`(2,CR)、`EOL_PLATFORM`(3,跟著當前平台慣例)。

讀回來用 `readText`;讀的文字會依 stream 的 charset 解碼,所以 open 給對 charset 這件事,讀的時候一樣重要。

## binary vs text:Binary 模式與接 java.io

Stream 不只處理文字。`open(path, "Binary")` 之後,stream 只做 byte 層級的操作,`read` / `write` 進出的是位元組——要算雜湊、原樣搬一份檔案、不想碰任何編碼轉換時用它。

Java 版還多兩個 LotusScript 沒有的便利方法,直接跟 `java.io.*` 橋接:

- `getContents(OutputStream)` / `getContents(Writer)`——把 stream 內容倒進一個 `java.io.OutputStream` 或 `Writer`(例如直接串給 HTTP response)。
- `setContents(InputStream)` / `setContents(Reader)`——把一個 `java.io.InputStream` / `Reader` 的內容灌進 stream。

這讓 Domino 的 Stream 跟標準 Java I/O 直接接得起來,是純 Java 端比 LotusScript 舒服的一個角落。

## 兩個會咬人的邊界:thread 限定與 recycle

官方在 class 頁寫了一句很容易被忽略的話:「**Use of a Stream object is limited to the thread in which is created.**」你不能在一個 thread 建 stream、丟到另一個 thread 用——在多執行緒的 Java agent 或 XPages 背景工作裡,這會變成很難查的 bug。stream 要在用它的那個 thread 裡建。

另外 Stream 是後端 handle,用完要 `recycle()`;處理完一個檔案就收掉,別讓它跟著整批迴圈累積。完整的 recycle 紀律見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-recycle-memory/)。

## 一段完整範例

把選到的文件的 `Body` 用 UTF-8 寫成檔案,逐行加 CRLF:

```java
Stream stream = null;
try {
    stream = session.createStream();
    if (!stream.open("/local/export/" + doc.getNoteID() + ".txt", "UTF-8")) {
        throw new RuntimeException("stream open 失敗(路徑或 charset?)");
    }
    stream.truncate();   // 清掉既有內容,從頭寫
    stream.writeText(doc.getItemValueString("Subject"), Stream.EOL_CRLF);
    stream.writeText(doc.getItemValueString("Body"),    Stream.EOL_CRLF);
    stream.close();
} catch (NotesException e) {
    e.printStackTrace();
} finally {
    try { if (stream != null) stream.recycle(); } catch (NotesException e) {}
}
```

重點就是那個 `"UTF-8"`:拿掉它,同一段碼在不同 locale 的 server 上會寫出不同編碼的檔案。

## 同類別在其他語言

同一個 `Stream`:

- **LotusScript**:`NotesStream`,`Open` / `WriteText` / `ReadText` 都在,charset 與編碼的細節見 [NotesStream 的編碼那篇](/domino-news/posts/notes-stream-encoding/);LS 也有同樣的 charset 預設問題,但沒有 `getContents` / `setContents` 那種接 `java.io` 的橋接。
- **SSJS / XPages**:`NotesStream`,一樣 `session.createStream()`;在 XPages 裡常拿來產檔案串給下載,生命週期由 request 管。
- **Java 專屬的**,正是這篇的兩件事:`getContents` / `setContents` 讓 Domino Stream 跟標準 Java I/O 直接對接,而強型別不會幫你擋 charset 預設的坑——`open` 少給一個參數,中文就默默用 System 編碼寫出去了。
