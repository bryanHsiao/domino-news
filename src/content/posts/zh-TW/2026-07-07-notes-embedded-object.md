---
title: "LotusScript 處理附件：EmbedObject、NotesEmbeddedObject 與 GetAttachment 捷徑"
description: "附加一個檔案、列出附了什麼、把它抽取到磁碟、再移除它 —— 全部用程式做。本文說明 NotesRichTextItem.EmbedObject 搭配 EMBED_ATTACHMENT 常數、NotesEmbeddedObject 類別、ExtractFile，以及兩個絆倒人的陷阱：NotesDocument.EmbeddedObjects 不會回傳檔案附件（要用 GetAttachment 或 rich text item），而 ExtractFile 對非附件的東西會出錯。"
pubDate: 2026-07-07T07:30:00+08:00
lang: zh-TW
slug: notes-embedded-object
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesEmbeddedObject class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "EmbedObject method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html"
  - title: "ExtractFile method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD.html"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: ["EmbeddedObject", "RichTextItem"]
---

一個 agent 要把產生好的 PDF 附到文件上再寄出；另一個要掃過進來的文件、把每個附件抽到網路資料夾、再刪掉原檔。兩者都是家常工作，也都經過同一個類別 —— [`NotesEmbeddedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html) —— 加上 `NotesRichTextItem` 與 `NotesDocument` 上的幾個方法。這組 API 帶著一些 OLE 時代的包袱，所以訣竅是知道哪些部分現在還重要。

---

## 重點摘要

- 一個 `NotesEmbeddedObject`「代表以下之一：一個嵌入物件、一個物件連結、一個檔案附件」。對現代開發來說，**檔案附件才是重要的那個** —— OLE 嵌入／連結是 Windows-only 的遺留功能。
- **附加檔案**：`Set eo = rtitem.EmbedObject(EMBED_ATTACHMENT, "", "c:\path\file.pdf")`。型別常數是 `EMBED_ATTACHMENT`（1454）、`EMBED_OBJECT`（1453）、`EMBED_OBJECTLINK`（1452）。
- **依名稱找單一附件**：`doc.GetAttachment(fileName$)` —— 它能找到附件，*不管附件放在哪個 rich text item*（或根本不在），這正是它的重點。
- **抽取到磁碟**：`Call eo.ExtractFile(path$)` —— 只限附件；它對 **OLE 物件／連結會出錯**，所以永遠要用 `eo.Type = EMBED_ATTACHMENT` 把關。
- **陷阱**：`NotesDocument.EmbeddedObjects`「不會回傳檔案附件」—— 改用 `rtitem.EmbeddedObjects`（逐 rich text item）或 `GetAttachment`。
- `doc.HasEmbedded` 是「這份文件有沒有帶任何附件／嵌入物」的快速 Boolean 檢查。

## 附加檔案

[`EmbedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html) 住在 rich text item 上。對一個純檔案附件，型別是 `EMBED_ATTACHMENT`、class 字串留空、source 是檔案路徑：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtitem As NotesRichTextItem
Dim eo As NotesEmbeddedObject
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
Set rtitem = New NotesRichTextItem(doc, "Body")
Set eo = rtitem.EmbedObject(EMBED_ATTACHMENT, "", "c:\reports\q1.pdf")
doc.Form = "Main Topic"
doc.Subject = "Here's the Q1 report, attached"
Call doc.Save(True, True)
```

這段是官方範例（把檔案路徑更新過）。可選的第四個 `name$` 參數只對 OLE 物件有意義、不適用附件，所以這裡不給。文件有一個要求：資料庫要設好 default view，`EmbedObject` 才能運作。

## 找附件 —— 以及 EmbeddedObjects 陷阱

抵達附加檔案有三條路，而它們之間的差別正是值得記牢的部分：

- `doc.HasEmbedded` —— 唯讀 Boolean，文件*有任何*嵌入、連結或附件時為 `True`。做更多事之前的便宜把關。
- `doc.GetAttachment(fileName$)` —— 回傳某個具名附件的 `NotesEmbeddedObject`，或 `Nothing`。依文件，它的強項是能找到「不在任何 rich text item 裡的檔案附件……以及包含在 rich text item 裡的檔案附件」。所以你不需要知道檔案*附在哪*。（注意：回傳物件的 `Parent` 是 `Nothing`，因為你不是透過 rich text item 拿到它的。）
- `rtitem.EmbeddedObjects` —— *那個* rich text item 裡嵌入物件的陣列，它**確實**包含檔案附件。

陷阱是大家最先伸手去拿的第四個選項：`doc.EmbeddedObjects`。class 頁明白寫著文件層級的版本**「不會回傳檔案附件」**—— 所以對 `doc.EmbeddedObjects` 跑迴圈，會悄悄跳過你通常正想要的那個東西。用 rich-text-item 陣列或 `GetAttachment`。

## 抽取與移除

要把附件拉到磁碟，走過 rich text item 的物件、用附件型別把關、再呼叫 [`ExtractFile`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD.html)。這是官方寫法：

```lotusscript
Dim doc As NotesDocument
Dim rtitem As Variant
Dim fileCount As Integer
Const MAX = 100000
fileCount = 0
'...set value of doc...
Set rtitem = doc.GetFirstItem("Body")
If (rtitem.Type = RICHTEXT) Then
  Forall o In rtitem.EmbeddedObjects
    If (o.Type = EMBED_ATTACHMENT) And (o.FileSize > MAX) Then
      fileCount = fileCount + 1
      Call o.ExtractFile("c:\reports\newfile" & Cstr(fileCount))
      Call o.Remove
      Call doc.Save(True, True)
    End If
  End Forall
End If
```

從這段官方片段帶兩件事進正式環境。第一，`o.Type = EMBED_ATTACHMENT` 這道把關不是可選的 —— `ExtractFile` 對 OLE 物件與物件連結會丟錯，所以沒檢查就抽取，一遇到帶有非附件嵌入物的文件就會炸。第二，注意抽出的檔名（`newfile1`、`newfile2`…）沒有副檔名 —— 那是 HCL 範例的怪癖；正式程式要用原檔名或真正的副檔名抽取，檔案才打得開。

`o.Remove` 刪掉附件，而（跟所有 rich-text 編輯一樣）變更要到 `doc.Save` 才落盤。過程中好用的 `NotesEmbeddedObject` 屬性：`Name`、`FileSize`（bytes，給附件用）、`Type`、`Class` 與 `Verbs`（僅 OLE）、以及 `Source`。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesEmbeddedObject` | `EmbeddedObject` | `EmbeddedObject` |
| `NotesRichTextItem.EmbedObject` | `RichTextItem.embedObject` | `RichTextItem.embedObject` |

Java 與 SSJS 的介面與這個對應 —— `rtitem.embedObject(...)`、`doc.getAttachment(...)`、`eo.extractFile(...)`、同一個 `EMBED_ATTACHMENT` 常數、以及同樣「文件層級 `getEmbeddedObjects()` 略過附件」的行為。建議原樣沿用：透過 `getAttachment` 或 rich-text item 抵達附件，而不是文件層級的集合。
