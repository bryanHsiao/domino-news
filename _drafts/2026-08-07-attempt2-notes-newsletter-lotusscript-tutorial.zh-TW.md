---
title: "使用 LotusScript 的 NotesNewsletter：建立新聞通訊的實作指南"
description: "深入探討如何使用 LotusScript 的 NotesNewsletter 類別來建立和格式化新聞通訊，包含實作步驟和範例程式碼。"
pubDate: "2026-08-07T09:42:27+08:00"
lang: "zh-TW"
slug: "notes-newsletter-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesNewsletter (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html"
  - title: "CreateNewsletter (NotesSession - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_CREATENEWSLETTER_METHOD.html"
  - title: "FormatDocument (NotesNewsletter - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_FORMATDOCUMENT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-newsletter-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-newsletter-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 開發中，**NotesNewsletter** 類別提供了一種有效的方法，讓開發者能夠從多個文件中建立新聞通訊，並將其格式化為可讀的格式。這在需要將多個文件的內容彙整並傳遞給使用者時特別有用。

## 建立 NotesNewsletter

要建立一個新的 NotesNewsletter 物件，您可以使用 **NotesSession** 類別的 **CreateNewsletter** 方法。此方法需要一個 **NotesDocumentCollection** 作為參數，該集合包含您希望納入新聞通訊的文件。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim docCollection As NotesDocumentCollection
Dim newsletter As NotesNewsletter

Set db = session.CurrentDatabase
Set docCollection = db.AllDocuments
Set newsletter = session.CreateNewsletter(docCollection)
```

在上述程式碼中，我們首先取得當前資料庫的所有文件，然後使用這些文件來建立一個新的新聞通訊物件。

## 格式化新聞通訊

建立新聞通訊後，您可以使用 **FormatDocument** 方法來格式化特定的文件。此方法會在指定的資料庫中建立一個新文件，該文件包含所選文件的渲染內容。

```lotusscript
Dim targetDb As NotesDatabase
Dim formattedDoc As NotesDocument

Set targetDb = session.GetDatabase("", "target.nsf")
Set formattedDoc = newsletter.FormatDocument(targetDb, 1)

Call formattedDoc.Save(True, True)
```

在這段程式碼中，我們指定了目標資料庫，並格式化了新聞通訊中的第一個文件。請注意，**FormatDocument** 方法的第二個參數是一個整數，表示要格式化的文件在集合中的位置。

## 設定主題行

如果您希望在新聞通訊中包含主題行，可以使用 **SubjectItemName** 屬性來指定用作主題的項目名稱。這需要與 **DoSubject** 屬性一起使用。

```lotusscript
newsletter.DoSubject = True
newsletter.SubjectItemName = "Subject"
```

在這裡，我們將 **DoSubject** 設為 True，並指定 "Subject" 作為主題項目的名稱。這樣，新聞通訊將包含每個文件的 "Subject" 項目的內容作為主題行。

## 結論

透過使用 **NotesNewsletter** 類別，開發者可以有效地從多個文件中建立和格式化新聞通訊，並根據需要自訂其內容和格式。這提供了一種強大的工具，能夠增強 HCL Domino 應用程式的功能和使用者體驗。

有關更多詳細資訊，請參閱 [NotesNewsletter 類別的官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html)。
