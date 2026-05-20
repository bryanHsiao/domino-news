---
title: "深入解析 NotesItem：LotusScript 中的文檔數據存取"
description: "本文詳細介紹 NotesItem 類別，解釋其在 LotusScript 中的作用，並提供實際範例，展示如何在 HCL Domino 應用程式中存取和操作文檔數據。"
pubDate: "2026-05-21T07:33:20+08:00"
lang: "zh-TW"
slug: "notes-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesItem (LotusScript)"
    url: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_4_LOTUSSCRIPT_NOTES_CLASSES_REFERENCE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notes-newsletter] on 2026-05-12. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-item
-->

## 什麼是 NotesItem？

在 HCL Domino 的 LotusScript 中，`NotesItem` 類別代表文檔中的特定數據項目。這些項目通常對應於表單中的字段，但也可以存在於文檔中而不與任何字段相關聯。通過 `NotesItem`，開發者可以讀取、修改和管理文檔中的數據。

## 創建和存取 NotesItem

要創建新的 `NotesItem`，可以使用 `NotesDocument` 的 `New` 方法或 `ReplaceItemValue` 方法。例如：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set item = doc.ReplaceItemValue("Subject", "這是主題")
```

在上述範例中，`ReplaceItemValue` 方法創建了一個名為 "Subject" 的 `NotesItem`，並將其值設置為 "這是主題"。

## NotesItem 的屬性和方法

`NotesItem` 提供多種屬性和方法，允許開發者操作文檔中的數據。以下是一些常用的屬性和方法：

- **Name**：返回或設置項目的名稱。
- **Values**：返回或設置項目的值。
- **IsSummary**：指示項目是否包含在文檔的摘要中。
- **Remove**：從文檔中移除項目。

例如，以下程式碼展示如何讀取和修改現有文檔中的項目：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("文檔的UNID")
Set item = doc.GetFirstItem("Subject")

If Not item Is Nothing Then
    MsgBox "當前主題: " & item.Values(0)
    Call item.Remove
    Call doc.ReplaceItemValue("Subject", "新的主題")
    Call doc.Save(True, False)
End If
```

在此範例中，程式碼讀取名為 "Subject" 的項目，顯示其當前值，然後移除該項目，並添加一個新的 "Subject" 項目，最後保存文檔。

## 注意事項

- **數據類型**：`NotesItem` 的值可以是多種數據類型，包括文本、數字、日期等。確保在操作時考慮到正確的數據類型。
- **摘要項目**：將 `IsSummary` 設置為 `True` 的項目會包含在文檔的摘要中，這對於視圖和搜尋操作至關重要。

## 結論

`NotesItem` 是 LotusScript 中操作 HCL Domino 文檔數據的關鍵類別。通過理解其屬性和方法，開發者可以有效地讀取、修改和管理文檔中的數據，從而開發出功能強大的 Domino 應用程式。

更多詳細資訊，請參閱 [NotesItem (LotusScript)](https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html) 和 [使用 Domino 類別](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html)。
