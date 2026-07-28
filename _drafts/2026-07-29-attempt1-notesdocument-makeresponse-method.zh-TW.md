---
title: "使用 NotesDocument.MakeResponse 方法建立回應文件"
description: "深入探討如何在 LotusScript 中使用 NotesDocument.MakeResponse 方法來建立回應文件，並了解其在 HCL Domino 應用程式中的應用。"
pubDate: "2026-07-29T07:59:29+08:00"
lang: "zh-TW"
slug: "notesdocument-makeresponse-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument class - LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "MakeResponse method - NotesDocument class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html"
  - title: "NotesDocumentCollection class - LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" was already cited by [notes-document-computewithform] on 2026-07-15. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html" was already cited by [notes-document-save-conflict] on 2026-07-27. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: notesdocument-makeresponse-method
-->

在 HCL Domino 應用程式開發中，回應文件（response document）是一種特殊的文件，與主文件（parent document）建立層級關係。這種結構在組織和管理相關資料時非常有用。本文將介紹如何在 LotusScript 中使用 `NotesDocument` 類別的 `MakeResponse` 方法來建立回應文件，並探討其應用場景。

## `MakeResponse` 方法概述

`MakeResponse` 方法是 `NotesDocument` 類別的一部分，用於建立一個新的回應文件，並將其與現有的主文件關聯。此方法的語法如下：

```lotusscript
Set responseDoc = parentDoc.MakeResponse()
```

其中，`parentDoc` 是現有的主文件，`responseDoc` 是新建立的回應文件。

## 使用範例

以下範例展示如何使用 `MakeResponse` 方法來建立回應文件：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim parentDoc As NotesDocument
Dim responseDoc As NotesDocument

Set db = session.CurrentDatabase
Set parentDoc = db.GetDocumentByUNID("主文件的UNID")

If Not parentDoc Is Nothing Then
    Set responseDoc = parentDoc.MakeResponse()
    responseDoc.Form = "ResponseForm"
    responseDoc.Subject = "這是回應文件"
    Call responseDoc.Save(True, False)
End If
```

在此範例中，程式碼首先獲取當前資料庫，然後透過主文件的 UNID 獲取主文件。接著，使用 `MakeResponse` 方法建立回應文件，設定其表單和主旨，最後儲存該回應文件。

## 注意事項

- **層級關係**：使用 `MakeResponse` 方法建立的回應文件會自動與主文件建立層級關係，這在視圖中可以直觀地顯示主從關係。

- **表單設定**：建立回應文件後，應明確設定其表單，以確保其符合應用程式的設計需求。

- **儲存文件**：在對回應文件進行必要的設定後，記得呼叫 `Save` 方法來儲存文件。

## 應用場景

回應文件在以下情境中特別有用：

- **討論串**：在討論應用程式中，回應文件可用於表示對主題的回覆。

- **工作流程**：在工作流程應用程式中，回應文件可用於記錄對特定請求的審批或意見。

透過使用 `MakeResponse` 方法，開發者可以有效地在 HCL Domino 應用程式中建立和管理回應文件，從而實現更靈活的資料組織和顯示。

有關 `NotesDocument` 類別和 `MakeResponse` 方法的更多資訊，請參閱 [NotesDocument 類別說明](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) 和 [MakeResponse 方法說明](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html)。
