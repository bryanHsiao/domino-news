---
title: "Java 讀 MIME:不先 setConvertMIME(false),你讀到的就不是 MIME"
description: "現代 Domino 的郵件 Body 多半是 MIME(多段式、帶 headers),不是傳統的 composite rich text。你在 Java 用 getFirstItem(\"Body\") 去讀,Domino 預設會把 MIME 自動轉成 rich text 再給你——結果你拿到的是轉換後的東西,原本的 MIME 結構、headers、編碼都在轉換裡被攤平了。要拿到真正的 MIME,得先呼叫 session.setConvertMIME(false) 關掉這個自動轉換,再 getMIMEEntity。這篇講讀 MIME 的正確順序、怎麼走訪 multipart 的每一段、怎麼讀 headers,以及一個很會咬人的失效規則:MIMEEntity 在你對 Document 做 save / computeWithForm / sign 之後就失效了。"
pubDate: 2026-11-13T07:30:00+08:00
lang: zh-TW
slug: java-mimeentity
tags:
  - "Java"
sources:
  - title: "MIMEEntity class (Java)（內容/headers/走訪方法、失效規則、Release 5.0.2）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEENTITY_CLASS_JAVA.html"
  - title: "Working with a MIME entity in Java classes（setConvertMIME(false) → getMIMEEntity → closeMIMEEntities 流程）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS_JAVA.html"
  - title: "MIMEHeader class (Java)（name/value/parameters;RFC-822 / RFC-2045）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEHEADER_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "MIMEEntity"
apiLang: "java"
---

你在 Java 要讀一封信的 `Body`。直覺:`doc.getFirstItem("Body")`,再把它當 rich text 讀。但現代 Domino 的郵件 Body 多半是 **MIME**——多段式、帶一堆 headers、各段有自己的 content type 和編碼——不是傳統的 composite rich text。

問題在於:你那樣讀,Domino **預設會先把 MIME 自動轉成 rich text 再給你**。轉換之後,原本的 MIME 結構、headers、各段編碼都被攤平了;你拿到的是一個「看起來像內文」的東西,但它不是原始 MIME。要拿到真正的 MIME,得先關掉這個自動轉換。

這個關掉的動作,就是 [`MIMEEntity`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEENTITY_CLASS_JAVA.html) 最容易被忽略的前置步驟。這篇講讀 MIME 的正確順序、怎麼走訪 multipart、怎麼讀 headers,以及一個很會咬人的失效規則。

---

## 讀 MIME 的正確順序

官方的 [Working with a MIME entity](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORKING_WITH_A_MIME_ENTITY_STEPS_JAVA.html) 把順序寫得很清楚,第一步就是關掉轉換:

1. 「**First call Session.setConvertMIME(false)** to override normal conversion of MIME items to rich text.」——先關掉 MIME→rich text 自動轉換。
2. 「Then call Document.getMIMEEntity.」——取頂層 entity(或 `getFirstItem` 後 `Item.getMIMEEntity`)。
3. 讀完、要改回用 Item 存取時:「call Document.closeMIMEEntities.」
4. 「Before exiting your code, call **Session.setConvertMIME(true)** (or restore the original setting).」——離開前把設定還原。

少了第 1 步,後面全錯——你 getMIMEEntity 之前 Domino 已經把 MIME 轉成 rich text 了。注意 Java 的正確拼法是 `setConvertMIME`(大寫 MIME)。這個旗標是 session 層級的,會影響整個 session,所以用完一定要還原,別讓它污染後續其他程式碼。

## 讀內容與走訪 multipart

拿到 entity 之後,讀內容有兩條:`getContentAsText` 回文字、`getContentAsBytes` 回原始位元組(附件、二進位段用這個)。各段的型別資訊是唯讀屬性:`ContentType`、`ContentSubtype`、`Charset`、`Encoding`。

一封 multipart 的信(例如 `multipart/alternative` 同時有純文字和 HTML 版本)是一棵樹,用 `getFirstChildEntity` 進到第一段、`getNextSibling` 走下一段:

```java
MIMEEntity child = entity.getFirstChildEntity();
while (child != null) {
    String type = child.getContentType() + "/" + child.getContentSubtype();
    // 例如挑 text/html 那一段來處理
    MIMEEntity next = child.getNextSibling();
    child = next;
}
```

## 讀 headers

每一段的 headers 用 [`MIMEHeader`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIMEHEADER_CLASS_JAVA.html) 表示——官方定義「A MIME header consists of a name, value, and parameters as defined in RFC-822 and RFC-2045.」。要某個 header 用 `getNthHeader("Content-Type")`,要全部用 `getHeaderObjects`。整段 headers 當一個字串用 `getHeaders`。這是你讀 `From` / `Subject` / `Content-Disposition` 這些的地方。

## 很會咬人的失效規則

這是最容易踩的雷。class 頁明寫:一個有效的 MIMEEntity「becomes invalid if any of the following methods are applied to the containing Document object」——這些方法是 `computeWithForm`、`encrypt`、`save`、`send`、`sign`、`closeMIMEEntities`。

白話:**你一旦對那份 Document 做了 save(或 computeWithForm、sign…),手上的 MIMEEntity handle 就失效了**,再拿它讀會出錯。所以順序要對:先把 MIME 讀完、或寫完,最後才 `save`;別在讀 MIME 的迴圈中間插一個 `doc.save()`。

另一條相關勸告:**別在同一份文件上同時用 Item 存取和 MIMEEntity 存取**。要從 MIME 模式切回一般 Item 操作,先 `closeMIMEEntities`。

處理完後,MIMEEntity 跟 document 都是後端 handle,Java 裡用完 `recycle()`;完整紀律見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-recycle-memory/)。

## 一段完整範例

把一封信的 `text/plain` 段讀出來:

```java
String plain = null;
session.setConvertMIME(false);               // 1. 先關轉換
try {
    MIMEEntity root = doc.getMIMEEntity();   // 2. 取 entity
    if (root != null) {
        if ("multipart".equalsIgnoreCase(root.getContentType())) {
            MIMEEntity child = root.getFirstChildEntity();
            while (child != null) {
                if ("text".equalsIgnoreCase(child.getContentType())
                        && "plain".equalsIgnoreCase(child.getContentSubtype())) {
                    plain = child.getContentAsText();
                    break;
                }
                child = child.getNextSibling();
            }
        } else {
            plain = root.getContentAsText();
        }
    }
    doc.closeMIMEEntities();                  // 3. 收掉 MIME 處理
} catch (NotesException e) {
    e.printStackTrace();
} finally {
    session.setConvertMIME(true);             // 4. 還原設定
}
```

## 同類別在其他語言

同一個 `MIMEEntity`:

- **LotusScript**:`NotesMIMEEntity`,同樣要先 `NotesSession.ConvertMIME = False`(或對應方法)、`GetMIMEEntity`,流程一致;完整用法見 [NotesMIMEEntity 那篇](/domino-news/posts/notes-mime-entity/)。
- **SSJS / XPages**:`NotesMIMEEntity`,一樣先 `session.setConvertMIME(false)`;在 XPages 讀內送信件或組 MIME 回信時會用到。
- **Java 專屬的**不是 API(方法共用),而是兩個 Java 開發者最容易忽略的點:`setConvertMIME` 的大寫拼法與 session 層級副作用(用完要還原),以及強型別不會幫你擋「save 之後 handle 失效」——編譯過不代表那個 MIMEEntity 還有效。
