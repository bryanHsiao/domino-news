---
title: "使用 LotusScript 操作 NotesDocument：完整指南"
description: "深入探討如何使用 LotusScript 的 NotesDocument 類別來創建、讀取、更新和刪除 HCL Domino 資料庫中的文件。"
pubDate: "2026-06-11T07:36:55+08:00"
lang: "zh-TW"
slug: "notesdocument-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html"
  - title: "Accessing a document in LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ACCESSING_A_DOCUMENT_STEPS_NOTESDATABASE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 2
slug: notesdocument-lotusscript
topicOverlap: false
issues:
  [critical] Cited source: https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENT_CLASS.html
      problem: The primary API reference link points to Domino Designer 9.0.1 documentation — a version that is over a decade old and long superseded. Linking readers to 9.0.1 docs for a 'comprehensive guide' is actively misleading; API details, property lists, and examples may differ from current 14.x behaviour.
      fix:     Replace with the 14.5.1 equivalent URL, e.g. https://help.hcl-software.com/dom_designer/14.5.1/appdev/H_NOTESDOCUMENT_CLASS.html
  [critical] ## Introduction — 'The NotesDocument class is central to this'... entire article
      problem: The article is extremely thin — it covers only New NotesDocument, GetDocumentByUNID, ReplaceItemValue, Save, and Remove. It omits the vast majority of the NotesDocument API: GetItemValue, GetFirstItem/GetNextItem, AppendItemValue, CopyToDatabase, MakeResponse/IsResponse (response hierarchy), SendTo/Send (mail routing), EmbedObject/Attachments, ComputeWithForm, HasItem/RemoveItem, Sign/Encrypt/Decrypt/IsEncrypted/IsSigned, the UniversalID vs NoteID vs NOTEID distinction, parent database/view context, IsNewNote, IsDeleted, IsProfile, Responses, and the critical SaveOptions/MailOptions/SignOnSend flags. Billing this as a 'Comprehensive Guide' or 'Mastering' piece when it covers perhaps 5% of the class is a serious accuracy/framing problem.
      fix:     Either retitle the article as an introductory primer (e.g. 'NotesDocument Basics: Creating, Reading, Updating, and Deleting') or substantially expand coverage to justify 'Comprehensive' and 'Mastering' in the title.
  [major] ## Accessing an Existing Document — 'retrieve it using its Universal ID (UNID) or NoteID'
      problem: The article mentions NoteID as an access method but provides no code example using GetDocumentByID (NoteID). A reader unfamiliar with the distinction between UNID and NoteID will be confused. More importantly, the article ignores the other primary ways to obtain a NotesDocument: navigating a NotesView (GetFirstDocument/GetNextDocument), AllDocuments collection, FTSearch, db.Search, DQL/NotesQueryResultsProcessor, and GetDocumentByURL — all of which are how documents are obtained in the vast majority of real agents.
      fix:     Either add a brief section covering view-based and search-based document retrieval, or explicitly scope the article to 'direct lookup by UNID/NoteID' and note that other retrieval methods are covered in companion articles.
  [major] ## Deleting a Document — `Call doc.Remove(True)`
      problem: The article does not explain what the Boolean parameter means (True = force delete even if document is not saved; also relevant: soft-delete behaviour when a database has soft-deletes enabled). It also does not mention db.Remove on a NotesDocumentCollection (RemoveAll) as the preferred bulk-delete mechanism, nor the distinction between Remove (permanent) and soft-delete / move-to-trash behaviour controlled by database settings.
      fix:     Explain the force parameter. Add a note about soft-delete databases and point to RemoveAll for bulk operations.
  [major] ## Updating a Document — only ReplaceItemValue shown
      problem: The update section shows only ReplaceItemValue. It omits AppendItemValue (multi-value items), GetFirstItem / NotesItem for typed access (rich text, numbers, date-times), and ComputeWithForm — which is often required when business logic or field validation is embedded in the form. A developer following this guide will produce incomplete documents that bypass all form-level logic.
      fix:     Add a note about ComputeWithForm and at least mention GetFirstItem/NotesItem for retrieving and manipulating typed item values.
  [major] Call doc.Save(True, True)
      problem: The two Boolean parameters to Save (force, makeResponse) are never explained. The second parameter (makeResponse) silently changes the document's relationship in the hierarchy if set incorrectly. Using Save(True, True) as a copy-paste pattern without explanation is dangerous.
      fix:     Document what each parameter means: first = force save even if another user has modified the document; second = makeResponse (create as response document). In most CRUD scenarios Save(True, False) is the correct call.
  [minor] ## Creating a New Document — `Set doc = New NotesDocument(db)`
      problem: The article does not mention that db.CreateDocument is the equally valid and arguably more idiomatic alternative to New NotesDocument(db), and that the new document is not persisted until Save is called — a common beginner trap.
      fix:     Add a one-line note: 'Alternatively use db.CreateDocument. The document is not stored in the database until Save is called.'
  [minor] ## Introduction — 'LotusScript serves as a powerful tool'
      problem: Minor style/franding: 'LotusScript' as a brand name is fine, but the introduction does not mention the alternative agent/script contexts (scheduled agents, web agents, buttons, actions) where NotesDocument is used, giving no orientation to new readers.
      fix:     Add one sentence contextualising where LotusScript NotesDocument code typically runs.
-->

## 簡介

在 HCL Domino 開發中，LotusScript 是一種強大的工具，允許開發者以程式方式操作資料庫中的各種元素。`NotesDocument` 類別是其中的核心，代表資料庫中的單一文件。透過此類別，開發者可以創建、讀取、更新和刪除文件，並操作其內部的項目（items）。

## 創建新文件

要在當前資料庫中創建新文件，可以使用以下程式碼：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)

' 設定文件的主題
Call doc.ReplaceItemValue("Subject", "新建文件")

' 保存文件
Call doc.Save(True, True)
```

在此範例中，`ReplaceItemValue` 方法用於設定或更新文件中的項目值。更多關於 `ReplaceItemValue` 方法的資訊，請參閱 [NotesDocument 類別](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESDOCUMENT_CLASS.html)。

## 訪問現有文件

要訪問現有文件，可以透過其唯一標識符（UNID）或 NoteID 來檢索：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' 操作文件
End If
```

有關如何訪問文件的更多資訊，請參閱 [在 LotusScript 中訪問文件](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ACCESSING_A_DOCUMENT_STEPS_NOTESDATABASE_CLASS.html)。

## 更新文件

要更新現有文件的項目值，可以使用 `ReplaceItemValue` 方法：

```lotusscript
Call doc.ReplaceItemValue("Status", "已完成")
Call doc.Save(True, True)
```

## 刪除文件

要刪除文件，可以使用 `Remove` 方法：

```lotusscript
Call doc.Remove(True)
```

## 結論

`NotesDocument` 類別提供了豐富的方法和屬性，允許開發者以程式方式操作 HCL Domino 資料庫中的文件。透過熟悉這些方法，開發者可以有效地管理和操作資料庫內容。更多範例和詳細資訊，請參閱 [NotesDocument 類別範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOCUMENT_CLASS.html)。
