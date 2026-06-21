---
title: "使用 Java 操作 Notes MIMEEntity：讀取與修改電子郵件內容"
description: "本教程介紹如何使用 Java 操作 HCL Domino 中的 MIMEEntity 類別，讀取和修改電子郵件的 MIME 內容，包括存取 MIMEEntity、讀取內容、修改內容以及保存變更。"
pubDate: "2026-06-22T07:34:21+08:00"
lang: "zh-TW"
slug: "notes-mime-entity-java"
tags:
  - "Tutorial"
  - "Java"
  - "Domino Server"
sources:
  - title: "MIMEEntity (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_MIMEENTITY_CLASS_JAVA.html"
  - title: "Item (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_ITEM_CLASS_JAVA.html"
  - title: "Document (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_DOCUMENT_CLASS_JAVA.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/Java/H_MIMEENTITY_CLASS_JAVA.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-mime-entity-java
-->

在 HCL Domino 中，電子郵件的內容通常以 MIME（多用途網際郵件擴充）格式儲存。透過 Java 的 `MIMEEntity` 類別，開發者可以讀取和修改這些 MIME 內容。本文將介紹如何使用 Java 操作 `MIMEEntity`，包括存取、讀取、修改內容，以及保存變更。

## 存取 MIMEEntity

要存取電子郵件的 MIME 內容，首先需要取得對應的 `Document`，然後透過 `Item` 物件存取 `MIMEEntity`。

```java
import lotus.domino.*;

public class MIMEEntityExample {
    public static void main(String[] args) {
        try {
            Session session = NotesFactory.createSession();
            Database db = session.getDatabase("伺服器名稱", "郵件資料庫.nsf");
            Document doc = db.getDocumentByUNID("文件UNID");
            Item item = doc.getFirstItem("Body");
            if (item != null && item.getType() == Item.RICHTEXT) {
                MIMEEntity mimeEntity = item.getMIMEEntity();
                // 在此處操作 MIMEEntity
            }
        } catch (NotesException e) {
            e.printStackTrace();
        }
    }
}
```

在上述程式碼中，透過 `getFirstItem` 方法取得名為 "Body" 的 `Item`，並檢查其類型是否為 `RICHTEXT`。如果是，則透過 `getMIMEEntity` 方法取得 `MIMEEntity` 物件。

## 讀取 MIMEEntity 內容

取得 `MIMEEntity` 後，可以讀取其內容。例如，讀取 MIME 內容的主體部分：

```java
Stream stream = session.createStream();
if (mimeEntity != null) {
    mimeEntity.getContentAsText(stream);
    String content = stream.readText();
    System.out.println("MIME 內容：" + content);
}
```

此程式碼使用 `Stream` 物件讀取 `MIMEEntity` 的文本內容，並輸出到控制台。

## 修改 MIMEEntity 內容

要修改 `MIMEEntity` 的內容，可以使用 `setContentFromText` 方法：

```java
String newContent = "這是新的 MIME 內容。";
mimeEntity.setContentFromText(stream, newContent, "text/plain; charset=UTF-8");
```

此程式碼將 `MIMEEntity` 的內容設置為新的文本，並指定內容類型和字符集。

## 保存變更

修改 `MIMEEntity` 後，需要保存變更：

```java
doc.save();
```

這將保存對 `Document` 的所有變更，包括對 `MIMEEntity` 的修改。

## 結論

透過 Java 的 `MIMEEntity` 類別，開發者可以方便地讀取和修改 HCL Domino 中電子郵件的 MIME 內容。這對於需要自動處理郵件內容的應用程式非常有用。更多詳細資訊，請參考 [MIMEEntity (Java)](https://help.hcl-software.com/dom_designer/14.5.1/Java/H_MIMEENTITY_CLASS_JAVA.html) 和 [Item (Java)](https://help.hcl-software.com/dom_designer/14.5.1/Java/H_ITEM_CLASS_JAVA.html) 的官方文件。
