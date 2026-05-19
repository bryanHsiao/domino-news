---
title: "使用 LotusScript 操作 NotesEmbeddedObject：嵌入、提取與刪除"
description: "本教學將介紹如何使用 LotusScript 操作 NotesEmbeddedObject，包括嵌入、提取和刪除嵌入物件的步驟，並提供完整的程式碼範例。"
pubDate: "2026-05-20T07:30:32+08:00"
lang: "zh-TW"
slug: "notes-embedded-object"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "NotesRichTextItem class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesRichTextItem.EmbedObject method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD_RICHTEXTITEM.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object
-->

## 簡介

在 HCL Domino 應用程式中，嵌入物件（如文件、圖像或其他檔案）是常見的需求。LotusScript 提供了 `NotesEmbeddedObject` 類別，允許開發者在 Notes 文件中嵌入、提取和刪除物件。本文將詳細介紹如何使用 LotusScript 操作 `NotesEmbeddedObject`，並提供完整的程式碼範例。

## 嵌入物件

要在 Notes 文件中嵌入物件，您需要使用 `NotesRichTextItem` 的 `EmbedObject` 方法。以下是將檔案嵌入到現有文件的範例：

```lotusscript
Sub EmbedFileInDocument(doc As NotesDocument, filePath As String, fileName As String)
    Dim rtItem As NotesRichTextItem
    Set rtItem = doc.GetFirstItem("Body")
    If rtItem Is Nothing Then
        Set rtItem = New NotesRichTextItem(doc, "Body")
    End If
    Call rtItem.EmbedObject(EMBED_ATTACHMENT, "", filePath, fileName)
    Call doc.Save(True, False)
End Sub
```

在此範例中，`EMBED_ATTACHMENT` 常數表示將檔案作為附件嵌入。`filePath` 是要嵌入檔案的完整路徑，`fileName` 是顯示在 Notes 文件中的名稱。更多關於 `EmbedObject` 方法的資訊，請參閱 [NotesRichTextItem.EmbedObject 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD_RICHTEXTITEM.html)。

## 提取嵌入物件

要從 Notes 文件中提取嵌入物件，您可以遍歷 `NotesRichTextItem`，尋找 `NotesEmbeddedObject`，然後將其保存到磁碟。以下是範例程式碼：

```lotusscript
Sub ExtractEmbeddedObjects(doc As NotesDocument, savePath As String)
    Dim rtItem As NotesRichTextItem
    Dim embObj As NotesEmbeddedObject
    Dim embObjects As Variant
    Set rtItem = doc.GetFirstItem("Body")
    If Not rtItem Is Nothing Then
        embObjects = rtItem.EmbeddedObjects
        ForAll obj In embObjects
            Set embObj = obj
            Call embObj.ExtractFile(savePath & "\" & embObj.Name)
        End ForAll
    End If
End Sub
```

此程式碼將文件中所有嵌入的物件提取到指定的 `savePath` 目錄下。`EmbeddedObjects` 屬性返回 `NotesEmbeddedObject` 的集合。更多關於 `NotesEmbeddedObject` 的資訊，請參閱 [NotesEmbeddedObject 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html)。

## 刪除嵌入物件

要刪除嵌入物件，您可以使用 `NotesEmbeddedObject` 的 `Remove` 方法。以下是刪除特定嵌入物件的範例：

```lotusscript
Sub RemoveEmbeddedObject(doc As NotesDocument, objectName As String)
    Dim rtItem As NotesRichTextItem
    Dim embObj As NotesEmbeddedObject
    Dim embObjects As Variant
    Set rtItem = doc.GetFirstItem("Body")
    If Not rtItem Is Nothing Then
        embObjects = rtItem.EmbeddedObjects
        ForAll obj In embObjects
            Set embObj = obj
            If embObj.Name = objectName Then
                Call embObj.Remove
                Exit ForAll
            End If
        End ForAll
        Call doc.Save(True, False)
    End If
End Sub
```

此程式碼在文件中尋找名稱為 `objectName` 的嵌入物件，並將其刪除。刪除後，記得保存文件以應用更改。

## 結論

透過上述範例，您可以使用 LotusScript 在 HCL Domino 應用程式中嵌入、提取和刪除嵌入物件。這些操作對於處理包含附件或其他嵌入內容的文件非常有用。更多詳細資訊，請參閱 [NotesRichTextItem 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html) 和 [NotesEmbeddedObject 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html)。
