---
title: "使用 LotusScript 的 NotesNewsletter 類別：建立新聞通訊的實作指南"
description: "深入探討如何使用 LotusScript 的 NotesNewsletter 類別來建立和發送新聞通訊，包括設定、添加文件和發送的步驟。"
pubDate: "2026-11-24T14:49:51+08:00"
lang: "zh-TW"
slug: "notes-newsletter-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNewsletter (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html"
  - title: "NotesDocumentCollection (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "NotesRichTextItem (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-newsletter-lotusscript
-->

## 簡介

在 HCL Domino 應用程式開發中，LotusScript 提供了強大的工具來處理各種任務。其中，`NotesNewsletter` 類別允許開發者建立包含多個文件的新聞通訊，這在需要將多個文件的摘要或連結發送給用戶時非常有用。

## 設定 NotesNewsletter

首先，您需要初始化 `NotesNewsletter` 物件。這通常透過 `NotesSession` 物件來完成。

```lotusscript
Dim session As New NotesSession
Dim newsletter As NotesNewsletter
Set newsletter = session.CreateNewsletter("新聞通訊標題")
```

在上述程式碼中，`CreateNewsletter` 方法用於建立新的新聞通訊，並指定其標題。

## 添加文件到新聞通訊

您可以使用 `AddDocument` 方法將 `NotesDocument` 或 `NotesDocumentCollection` 添加到新聞通訊中。

```lotusscript
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("文件UNID")
Call newsletter.AddDocument(doc)
```

如果您有多個文件，可以使用 `NotesDocumentCollection`：

```lotusscript
Dim collection As NotesDocumentCollection
Set collection = db.AllDocuments
Call newsletter.AddDocuments(collection)
```

## 發送新聞通訊

完成新聞通訊的內容後，您可以使用 `Send` 方法將其發送給指定的收件人。

```lotusscript
Call newsletter.Send("收件人郵件地址")
```

您也可以指定多個收件人，使用逗號分隔：

```lotusscript
Call newsletter.Send("user1@example.com,user2@example.com")
```

## 結論

`NotesNewsletter` 類別提供了一種方便的方法來在 LotusScript 中建立和發送包含多個文件的新聞通訊。透過上述步驟，您可以有效地將多個文件的摘要或連結發送給用戶，提升資訊傳遞的效率。

有關更多詳細資訊，請參閱 [NotesNewsletter 類別說明](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html) 和 [NotesDocumentCollection 類別說明](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html)。
