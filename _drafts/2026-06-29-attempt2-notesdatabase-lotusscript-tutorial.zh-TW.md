---
title: "NotesDatabase：LotusScript 中的資料庫操作指南"
description: "深入探討如何在 LotusScript 中使用 NotesDatabase 類別來存取和操作 HCL Domino 資料庫，包括建立、開啟、查詢和管理文件的實用範例。"
pubDate: "2026-06-29T07:29:00+08:00"
lang: "zh-TW"
slug: "notesdatabase-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDatabase (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Examples: NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html"
  - title: "CreateDocument (NotesDatabase - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_CREATEDOCUMENT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — 1 critical fact issue(s)
attempt: 2
slug: notesdatabase-lotusscript-tutorial
topicOverlap: false
issues:
  [critical] Set collection = db.Search("[Subject] CONTAINS 'keyword'", Nothing, 0)
      problem: The query string '[Subject] CONTAINS 'keyword'' is not valid @Formula syntax. NotesDatabase.Search takes an @Formula string, not a full-text or SQL-style query. A correct @Formula would be something like '@Contains(Subject; "keyword")' or '@Like(Subject; "%keyword%")'. The CONTAINS operator shown is FTSearch syntax, not @Formula syntax. Using it in Search() will produce a formula-evaluation error at runtime.
      fix:     Replace the query string with valid @Formula syntax, e.g. db.Search("@Contains(Subject; \"keyword\")", Nothing, 0). Also add a note that FTSearch() should be used if full-text search is intended, and that DQL (db.FTDomainSearch / NotesSession.CreateQueryEngine) is a modern alternative.
  [major] Querying Documents — the article presents Search() as the way to query documents without mentioning alternatives
      problem: The article says 'to query documents within a database, you can use the Search method' as if it is the primary or only approach. NotesDatabase has several well-known retrieval paths: (1) View lookups via NotesView.GetDocumentByKey / GetAllDocumentsByKey, (2) NotesDatabase.FTSearch for full-text indexed databases, (3) DQL via NotesSession.CreateQueryEngine / NotesQueryResultsProcessor (Domino 10+). Omitting these is misleading to a developer choosing a strategy, especially since FTSearch is what the code example is actually trying to demonstrate.
      fix:     Add a short paragraph or bullet list acknowledging the other retrieval methods (view lookups, FTSearch, DQL) and when each is appropriate. At minimum, note that FTSearch exists and is preferable when a full-text index is present.
  [major] Set db = session.GetDatabase("", "names.nsf")
      problem: GetDatabase does not raise an error and does not return Nothing when the database cannot be opened in all cases — the returned NotesDatabase object's IsOpen property may be False rather than the object being Nothing. Checking 'If db Is Nothing' is therefore unreliable; a database that exists but cannot be opened (wrong ACL, not yet opened) will pass the Nothing check yet fail on subsequent calls. The correct guard is to check db.IsOpen after the call.
      fix:     Change the guard to check db.IsOpen: 'If Not db.IsOpen Then ... End If', or call db.Open explicitly and check its Boolean return value. Add a sentence explaining the distinction.
  [major] Set entry = acl.CreateACLEntry("Username", ACLLEVEL_EDITOR) / Call acl.Save
      problem: The example creates an ACL entry but never sets the entry type (NotesACLEntry.UserType). Without setting UserType the entry defaults to ACL_TYPE_UNSPECIFIED, which can cause access problems or unexpected behaviour, especially in hierarchical Domino environments. This is a commonly missed step that will mislead readers.
      fix:     Add 'entry.UserType = ACLTYPE_PERSON' (or the appropriate constant) after CreateACLEntry, and briefly explain the UserType property.
  [minor] References — https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html
      problem: This URL references Domino Designer 10.0.1 documentation while the primary reference targets 14.5.0 and the CreateDocument reference targets 11.0.1. Mixing three different version anchors for what is presented as current documentation looks inconsistent and the older version URLs may not reflect current API behaviour.
      fix:     Normalise all three reference URLs to the same (latest) documentation version, e.g. 14.5.0.
  [minor] Call doc.Save(True, False)
      problem: The two Boolean parameters to NotesDocument.Save are (force, makeResponse). The article does not explain what they mean, leaving readers to guess. 'True' for force means the save proceeds even if another user has modified the document — this is a meaningful choice that should be documented.
      fix:     Add a brief inline comment or sentence explaining the Save parameters: Save(force As Boolean, makeResponse As Boolean, [markRead As Boolean]).
  [minor] Article title and conclusion: 'A Guide to Database Operations'
      problem: The article covers only four narrow operations (open, create document, search, ACL). Titling it 'A Guide to Database Operations' overpromises scope — readers expecting coverage of replication, compaction, design access, or even db.AllDocuments will be disappointed. The NotesDatabase class has dozens of methods and properties not mentioned.
      fix:     Narrow the title and introduction to match what is actually covered, e.g. 'NotesDatabase: Opening Databases, Creating Documents, Querying, and Managing the ACL in LotusScript'.
-->

## 簡介

在 HCL Domino 開發中，`NotesDatabase` 類別是 LotusScript 中用來存取和操作資料庫的核心。透過此類別，開發者可以建立、開啟、查詢和管理資料庫中的文件。本文將介紹如何在 LotusScript 中使用 `NotesDatabase` 類別，並提供實用範例。

## 建立和開啟資料庫

要在 LotusScript 中存取現有的資料庫，可以使用 `NotesSession` 類別的 `GetDatabase` 方法。以下範例展示如何開啟本地的 `names.nsf` 資料庫：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "names.nsf")
If db Is Nothing Then
    MsgBox "無法開啟資料庫"
Else
    MsgBox "成功開啟資料庫: " & db.Title
End If
```

在此範例中，`GetDatabase` 方法的第一個參數為伺服器名稱，空字串表示本地端。第二個參數是資料庫的檔案名稱。

## 建立新文件

使用 `NotesDatabase` 的 `CreateDocument` 方法可以在資料庫中建立新的文件。以下範例展示如何建立並儲存一個新文件：

```lotusscript
Dim doc As NotesDocument
Set doc = db.CreateDocument
Call doc.ReplaceItemValue("Form", "Memo")
Call doc.ReplaceItemValue("Subject", "新文件主題")
Call doc.ReplaceItemValue("Body", "這是新文件的內容。")
Call doc.Save(True, False)
MsgBox "新文件已建立並儲存。"
```

在此範例中，`ReplaceItemValue` 方法用來設定文件的欄位值，`Save` 方法則將文件儲存到資料庫中。

## 查詢文件

要查詢資料庫中的文件，可以使用 `NotesDatabase` 的 `Search` 方法。以下範例展示如何查詢主題包含特定關鍵字的文件：

```lotusscript
Dim collection As NotesDocumentCollection
Set collection = db.Search("[Subject] CONTAINS '關鍵字'", Nothing, 0)
Dim doc As NotesDocument
Set doc = collection.GetFirstDocument
While Not doc Is Nothing
    MsgBox "找到文件: " & doc.GetItemValue("Subject")(0)
    Set doc = collection.GetNextDocument(doc)
Wend
```

在此範例中，`Search` 方法的第一個參數是查詢語法，`GetFirstDocument` 和 `GetNextDocument` 方法用來遍歷查詢結果。

## 管理資料庫 ACL

`NotesDatabase` 的 `ACL` 屬性允許開發者存取和修改資料庫的存取控制清單（ACL）。以下範例展示如何為特定使用者設定存取權限：

```lotusscript
Dim acl As NotesACL
Set acl = db.ACL
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("使用者名稱")
If entry Is Nothing Then
    Set entry = acl.CreateACLEntry("使用者名稱", ACLLEVEL_EDITOR)
    Call acl.Save
    MsgBox "已為使用者新增編輯者權限。"
Else
    MsgBox "使用者已存在於 ACL 中。"
End If
```

在此範例中，`GetEntry` 方法用來檢查使用者是否已在 ACL 中，`CreateACLEntry` 方法則用來新增新的 ACL 條目。

## 結論

透過 `NotesDatabase` 類別，開發者可以在 LotusScript 中有效地存取和操作 HCL Domino 資料庫。本文介紹了如何建立和開啟資料庫、建立新文件、查詢文件以及管理資料庫的 ACL。希望這些範例能夠幫助您更好地理解和應用 `NotesDatabase` 類別。

參考資料：

- [NotesDatabase (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS.html)
- [CreateDocument (NotesDatabase - LotusScript)](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_CREATEDOCUMENT_METHOD.html)
- [Examples: NotesDatabase class](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html)
