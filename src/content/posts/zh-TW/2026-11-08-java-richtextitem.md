---
title: "Java 讀 rich text:先 cast,再小心 MIME 和被丟掉的附件"
description: "在 Java 要碰一個 Body 這種 rich text 欄位,getFirstItem 回給你的是一個 Item,你得先 cast 成 RichTextItem 才能用——而這一步藏了兩個意外:這份 body 現在很可能是 MIME、不是傳統 rich text(那要走 getMIMEEntity);還有,你用 getFormattedText 把內容讀成純文字時,它會「順手」把附件和圖片這些非文字內容丟掉。這篇講 Java 怎麼取到(cast 與 MIME)、怎麼把 rich text 讀成純文字(getFormattedText 的三個參數與它丟掉的東西)、以及怎麼用 createRichTextItem 建立一個。"
pubDate: 2026-11-08T07:30:00+08:00
lang: zh-TW
slug: java-richtextitem
tags:
  - "Java"
sources:
  - title: "RichTextItem class (Java)（extends Item；getMIMEEntity / getFormattedText）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html"
  - title: "createRichTextItem (Document - Java)（建立一個 rich-text item）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATERICHTEXTITEM_METHOD_JAVA.html"
  - title: "getFormattedText (RichTextItem - Java)（讀成純文字；tabstrip / linelen / maxlen;移除非文字內容）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFORMATTEDTEXT_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "RichTextItem"
apiLang: "java"
---

你要把一份文件的 `Body` 讀成純文字——拿去做索引、做預覽、塞進一封信。在 LotusScript 你差不多直接讀就有了。在 Java,`doc.getFirstItem("Body")` 回給你的是一個 `Item`,你得先把它 **cast 成 `RichTextItem`** 才能呼叫 `getFormattedText()`。

而這個 cast,就是意外住的地方。

第一,這份 `Body` 現在**很可能根本不是傳統 rich text、而是 MIME**(近年的郵件、HTML 內容大多存成 MIME)。第二,就算它是 rich text,`getFormattedText` 把它讀成純文字時,會**把附件和圖片這些非文字內容「順手」丟掉**——官方原文就是這樣寫的。這篇講在 Java 怎麼取到(cast 與 MIME)、怎麼讀成文字(以及它丟掉什麼)、怎麼建立一個。

---

## 取得:cast 下去,但先想一下它是不是 MIME

[`RichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html) 官方定義是「Represents an item of type rich text」,而且 `public class RichTextItem extends Item`——它是 `Item` 的子型別。所以讀既有的,官方教的就是:**`getFirstItem` 拿到 `Item`,再 cast 成 `RichTextItem`**。

```java
Item item = doc.getFirstItem("Body");
if (item instanceof RichTextItem) {
    RichTextItem rt = (RichTextItem) item;
    // ... 用 rt
}
```

注意那個 `instanceof` 判斷——別閉著眼睛直接 cast。因為 `Body` 這種欄位現在常常存成 **MIME**,那時它不是一個傳統 rich text item,你要走的是 `getMIMEEntity`(RichTextItem 上就有這個方法)、而不是 rich text 的那些 append/讀取方法。LS 的 `Set rtitem = doc.GetFirstItem(...)` 對型別比較寬鬆,Java 的強制 cast 會把這件事逼到你面前——這其實是好事,逼你先確認手上是什麼。

## 讀成純文字:getFormattedText,還有它丟掉的東西

把 rich text 讀成一段 `String`,用 [`getFormattedText`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFORMATTEDTEXT_METHOD_JAVA.html)。官方定義:「Returns the contents of a rich text item as plain text.」三個參數都有用:

```java
String text = rt.getFormattedText(true, 0, 0);
//                               tabstrip linelen maxlen
```

- **`boolean tabstrip`**:`true` 把 tab 換成空白。
- **`int linelen`**:幾個字元換行(加 CR/LF);**`0` 代表 80**。
- **`int maxlen`**:最多回傳幾個字元;`0` 代表預設。

一個一定要知道的行為,官方白紙黑字:**它會移除 bitmap、file attachment 這些非文字內容**。所以如果你 `getFormattedText` 之後發現「附件怎麼不見了」——不是不見了,是這個方法本來就只給你文字。要拿附件,走 `getEmbeddedObjects`(或見 [附件的三種拿法](/domino-news/posts/domino-attachments-three-ways/));要單純的文字、不要換行與 tab 處理那套,還有一個更單純的 `getUnformattedText`。

## 建立一個:createRichTextItem + append

反過來,要在 Java 建一個 rich text 欄位,用 [`createRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATERICHTEXTITEM_METHOD_JAVA.html)(在 `Document` 上),再依序 append:

```java
RichTextItem rt = doc.createRichTextItem("Body");
rt.appendText("訂單已出貨。追蹤單號:");
rt.appendText(trackingNo);
rt.addNewLine(1);
rt.appendDocLink(orderDoc, "開啟訂單");   // 一個 doclink
doc.save(true, true);                       // append 完記得存
```

`append*` 是**依呼叫順序**往下堆的:先 `appendText` 再 `appendDocLink`,出來的順序就是這樣。想嵌入檔案用 `embedObject`、想插表格、段落樣式、字型那些,方法很多——但那是 LS 版 [NotesRichTextItem 那篇](/domino-news/posts/notes-rich-text-item/) 已經把 22 個方法分類列過的內容,Java 同名、同概念,這裡不重抄;doclink 的細節見 [doclink 那篇](/domino-news/posts/notes-rich-text-doclink/)。重點只有一個:**append 完要 `doc.save()`**,不然什麼都沒寫進去。

## recycle 呢?

`RichTextItem`、`EmbeddedObject` 這些都是後端 handle,Java 裡用完要 `recycle()`;在迴圈裡尤其要顧回收鏈,別把 parent 收太早。完整紀律見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-collection-iteration/),這裡不重講。

## 同類別在其他語言

同一個 rich text item,三種語言:

- **LotusScript**:`NotesRichTextItem`,繼承 `NotesItem`;22 個方法的完整目錄在 [NotesRichTextItem 那篇](/domino-news/posts/notes-rich-text-item/)。沒有 cast 這一步、也不用 recycle。
- **SSJS / XPages**:`NotesRichTextItem`,一樣有 `getFormattedText`、`embedObject`、`getMIMEEntity`;生命週期由 XPages request 管。
- **Java 專屬的**,正是這篇:`getFirstItem` 回 `Item`、要自己 cast,強制你面對「這到底是 rich text 還是 MIME」;而 recycle 鏈也是 Java 多出來的功課。
