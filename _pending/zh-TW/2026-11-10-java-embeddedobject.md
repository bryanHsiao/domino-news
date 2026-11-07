---
title: "Java 讀附件:用 getInputStream 不落地,還有兩個會咬你的坑"
description: "在 Java 你要一份附件的 bytes——串給瀏覽器、算雜湊、推去物件儲存。直覺是先 extractFile 存成暫存檔、再讀那個檔;但 EmbeddedObject 在 Java 有 getInputStream,直接把附件內容當串流讀出來、一個暫存檔都不用。這篇講 Java 讀附件的串流做法,以及兩個官方文件白紙黑字、但很容易中的坑:extractFile 對「不是附件」的 embedded object / object link 會丟例外;而 Document.getEmbeddedObjects 根本不回傳 file attachment——附件要從 RichTextItem 拿。順帶一個平台現實:UNIX/Mac 的 Domino 只支援 file attachment,沒有 embedded object。"
pubDate: 2026-11-10T07:30:00+08:00
lang: zh-TW
slug: java-embeddedobject
tags:
  - "Java"
sources:
  - title: "EmbeddedObject class (Java)（三種類型;getInputStream / getType;UNIX/Mac 限制）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html"
  - title: "extractFile (EmbeddedObject - Java)（寫附件到路徑;對非附件丟例外）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD_JAVA.html"
  - title: "RichTextItem class (Java)（embedObject / getEmbeddedObjects 入口）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "EmbeddedObject"
apiLang: "java"
---

你在 Java 要一份附件的內容——串給瀏覽器下載、算個 SHA-256、或推去 S3。直覺的寫法:`extractFile` 把它存成一個暫存檔,再把那個檔讀回來。

但你其實不用繞這一圈。[`EmbeddedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html) 在 Java 有 `getInputStream`——直接把附件內容當一個 `InputStream` 讀出來,一個暫存檔都不用落地。對「讀完就丟給別人」的場景,這乾淨得多。

這篇講這個串流做法,外加兩個官方文件寫得清清楚楚、卻很容易中的坑。

---

## 三種 EmbeddedObject,先搞清楚手上是哪種

官方定義,`EmbeddedObject` 代表三種東西之一:**embedded object(嵌入的 OLE 物件)、object link(物件連結)、file attachment(檔案附件)**。`getType` 告訴你是哪一種。

一個很多人不知道的平台現實,官方直接寫在 Note 裡:**embedded object 和 object link 在 UNIX 和 Macintosh 上不支援,只有 file attachment 支援**。也就是說,你那台跑在 Linux / AIX 的 Domino server,實務上你碰到的 `EmbeddedObject` 幾乎只會是 **file attachment**——embedded OLE 物件根本不存在。這讓事情單純:server 端 Java 處理的,通常就是附件。

## 讀內容:getInputStream 不落地,extractFile 才落地

兩條路,選對省很多事:

- **`getInputStream`(或 `getReader`)——不落地。** 把附件內容當串流讀出來,直接接到你的輸出(HTTP response、雜湊器、上傳)。不產生暫存檔、不用清理。

```java
EmbeddedObject eo = rt.getEmbeddedObject("report.pdf");
try (InputStream in = eo.getInputStream()) {
    in.transferTo(response.getOutputStream());   // 串出去,沒落地
}
```

- **[`extractFile(path)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD_JAVA.html)——落地。** 官方定義:「Writes a file attachment to storage.」把附件寫到你指定的 `path`。注意這個路徑是**伺服器端**的(server 上的 Java / agent 跑在 Domino 主機上,寫的是主機的檔案系統)——不是使用者的電腦。只有真的需要一個檔在磁碟上(餵給外部程序之類)才用它。

這裡就是**坑一**:`extractFile` 只對 **file attachment** 有效;你如果對一個 embedded object 或 object link 呼叫它,官方明說**會丟例外**。所以動手前先 `getType` 確認是附件,別假設每個 `EmbeddedObject` 都能 extract。

## 坑二:Document.getEmbeddedObjects 不回附件

要拿到一份文件的附件,你會想「`doc.getEmbeddedObjects()` 不就好了?」——**不行**。官方寫得很清楚:`Document` 的 `getEmbeddedObjects` **不回傳 file attachment**(也不回 Notes R3 建的物件)。它回的是嵌入物件/連結,偏偏把你最常要的附件漏掉。

附件要從 **RichTextItem** 拿:

```java
RichTextItem rt = (RichTextItem) doc.getFirstItem("Body");   // 先 cast(見 RichTextItem 那篇)
Vector<?> objs = rt.getEmbeddedObjects();                     // 這個才含附件
```

或者你知道名字,直接 `rt.getEmbeddedObject("report.pdf")`。`RichTextItem` 的 [`getEmbeddedObjects` / `embedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html) 才是附件的正門;先把 `Body` cast 成 RichTextItem 的那一步,以及 MIME 的注意,見 [Java 讀 rich text 那篇](/domino-news/posts/java-richtextitem/)。

## recycle 呢?

`EmbeddedObject`、它所屬的 `RichTextItem`、迴圈裡的集合,都是後端 handle,Java 裡用完 `recycle()`;別把 parent 收太早。完整回收紀律見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-collection-iteration/),這裡不重講。

## 同類別在其他語言

同一個 `EmbeddedObject`,三種語言:

- **LotusScript**:`NotesEmbeddedObject`,`ExtractFile` 把附件存到磁碟;沒有 `getInputStream` 那種串流讀,也不用 recycle。LS 的完整目錄見 [NotesEmbeddedObject 那篇](/domino-news/posts/notes-embedded-object/)。
- **SSJS / XPages**:`NotesEmbeddedObject`,一樣有 `extractFile` / `getType`;生命週期由 XPages request 管。
- **Java 專屬的**,正是這篇:`getInputStream` 讓你不落地讀附件,而 `extractFile` 的例外、`Document.getEmbeddedObjects` 漏附件這兩個坑,強型別的 Java 會讓你更快撞上、也更快發現。附件處理的整體策略另見 [附件的三種拿法](/domino-news/posts/domino-attachments-three-ways/)。
