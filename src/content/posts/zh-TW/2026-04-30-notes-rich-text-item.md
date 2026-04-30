---
title: "NotesRichTextItem 入門：用 LotusScript 操作富文本欄位"
description: "NotesRichTextItem（富文本項目）繼承自 NotesItem，所以 NotesItem 的全部屬性與方法都能用；但它另外有 22 個專屬方法處理段落、樣式、表格、嵌入物件、Navigator/Range 進階遍歷。本文整理建立方式、22 個方法分類、繼承關係，與寫程式時常踩的雷。"
pubDate: "2026-04-30T03:12:47+08:00"
lang: "zh-TW"
slug: "notes-rich-text-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextItem (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesItem (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESITEM_CLASS.html"
  - title: "NotesDocument CreateRichTextItem method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATERICHTEXTITEM_METHOD.html"
  - title: "NotesEmbeddedObject (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
cover: "/covers/notes-rich-text-item.png"
---

## 一個重要前提：它繼承自 NotesItem

文檔開宗明義：

> NotesRichTextItem inherits from NotesItem. Because NotesRichTextItem inherits from NotesItem, all of the NotesItem properties and methods can be used on a NotesRichTextItem, too.

意思是：**NotesItem 上有的東西（`Name`、`Type`、`Text`、`Values`、`Remove()` 等等），在 NotesRichTextItem 物件上**全部都能直接用**。本文只談 NotesRichTextItem 自己「額外加上」的部分。

它自己只有**一個專屬屬性** —— `EmbeddedObjects`（唯讀）：包含這個富文本欄位裡所有嵌入的檔案、OLE 物件、物件連結。

剩下的精華都在 22 個方法裡。

## 兩種建立方式

### 方式 A：從文件建立

```lotusscript
Set rt = doc.CreateRichTextItem("Body")
```

`Body` 是欄位名稱。如果文件裡已經有同名的欄位，會回傳那個既有的。

### 方式 B：用 `New` 直接實例化

```lotusscript
Dim rt As New NotesRichTextItem(doc, "Body")
' 或
Set rt = New NotesRichTextItem(doc, "Body")
```

兩者效果相同，挑一個你順手的寫法。OLE 自動化情境下 `CreateRichTextItem` 比較方便（不用 `New`）。

## 22 個方法 —— 五種用途

### 1. 加文字（最常用）

| 方法 | 用途 |
|---|---|
| `AppendText(text$)` | 在最後接上純文字（套用當前的字型、樣式） |
| `AddNewLine(count%)` | 加 N 個換行 |
| `AddPageBreak()` | 加一個分頁符 |
| `AddTab(count%)` | 加 N 個 tab |

### 2. 設定樣式 / 段落格式

| 方法 | 用途 |
|---|---|
| `AppendStyle(style)` | 套用 `NotesRichTextStyle`（粗體、字級、顏色等）到後續文字 |
| `AppendParagraphStyle(pStyle)` | 套用 `NotesRichTextParagraphStyle`（縮排、對齊等）到後續段落 |
| `GetNotesFont(faceName$, addOnFail%)` | 取得字型 ID，配合 `NotesRichTextStyle.NotesFont` 用 |

### 3. 表格 / 章節 / 連結

| 方法 | 用途 |
|---|---|
| `AppendTable(rows%, cols%)` | 插入表格，回傳 `NotesRichTextTable` |
| `AppendDocLink(targetDoc/view/db, comment$)` | 插入文件連結（doclink） |
| `AppendRTItem(otherRT)` | 把另一個 NotesRichTextItem 的內容整段接過來 |
| `BeginSection(...)` / `EndSection()` | 包一段內容成可摺疊章節（section） |

### 4. 嵌入物件 / 附檔

| 方法 | 用途 |
|---|---|
| `EmbedObject(type%, className$, source$, [name$])` | 嵌入檔案附件、OLE 物件、或物件連結 |
| `GetEmbeddedObject(name$)` | 用名稱取出某個 `NotesEmbeddedObject` |

`EmbedObject` 的 `type%` 用內建常數：

```lotusscript
EMBED_ATTACHMENT  = 1454   ' 檔案附件
EMBED_OBJECT      = 1453   ' OLE 物件
EMBED_OBJECTLINK  = 1452   ' OLE 物件連結
```

### 5. 進階：Navigator / Range / 讀取 / 收尾

| 方法 | 用途 |
|---|---|
| `CreateNavigator()` | 取得 `NotesRichTextNavigator` 走訪富文本內部結構（章節、表格、連結等） |
| `CreateRange()` | 取得 `NotesRichTextRange` 做選取、複製、刪除某段內容 |
| `BeginInsert(element)` / `EndInsert()` | 把後續操作的插入位置從「結尾」改成「指定元素之前/之後」 |
| `GetFormattedText(stripTabs%, lineLen%, paraLen%)` | 取出富文本，**保留**換行/段落格式但去掉樣式 |
| `GetUnformattedText()` | 取出**完全純文字**（最常用來做搜尋、比對） |
| `Update()` | 強制處理所有 pending 操作（通常 `doc.Save` 會自動跑） |
| `Compact()` | 壓縮富文本佔用空間（長期累積編輯後優化用） |

## 實用範例：建立帶附件的回信

```lotusscript
Sub SendReplyWithAttachment(targetMail As String, attachPath As String)
    Dim s As New NotesSession
    Dim db As NotesDatabase
    Dim doc As NotesDocument
    Dim body As NotesRichTextItem
    Dim style As NotesRichTextStyle

    Set db = s.GetDatabase("", "mail.box")
    Set doc = db.CreateDocument()
    doc.Form = "Memo"
    doc.SendTo = targetMail
    doc.Subject = "報表已附上"

    ' 建立富文本欄位
    Set body = doc.CreateRichTextItem("Body")

    ' 加一段一般文字
    Call body.AppendText("您好，")
    Call body.AddNewLine(2)
    Call body.AppendText("附件是本月度銷售報表，請查收。")
    Call body.AddNewLine(2)

    ' 切成粗體紅字
    Set style = s.CreateRichTextStyle()
    style.Bold = True
    style.NotesColor = COLOR_RED
    Call body.AppendStyle(style)
    Call body.AppendText("注意：請於本週五前回覆是否需要進一步分析。")

    ' 嵌入附件
    Call body.EmbedObject(EMBED_ATTACHMENT, "", attachPath)

    ' 寄出
    Call doc.Send(False)
End Sub
```

幾個重點：

1. `CreateRichTextItem("Body")` —— Body 是 Memo 表單預期的富文本欄位名
2. `AppendStyle` 之後寫的所有 `AppendText` 都會套用該樣式，直到下一個 `AppendStyle`
3. `EmbedObject` 第一個參數是常數（`EMBED_ATTACHMENT` 等）
4. `doc.Send(False)` 自動會呼叫 `Update`，不用你手動

## 三個常踩的雷

### 雷 1：先 `Save` 才能 `EmbedObject`？不一定

文檔沒要求 EmbedObject 之前必須 Save。但**如果你建完就 EmbedObject 大檔案**（>幾 MB），有些情境會吃到記憶體問題；這時建議先 `doc.Save(True, False)` 一次再嵌入。

### 雷 2：`GetFormattedText` vs `GetUnformattedText`

兩者都回純文字，但：

- `GetFormattedText(False, 80, 0)` —— 保留換行、用 80 字元寬包裝，適合 email 引言
- `GetUnformattedText()` —— 全部攤平、無換行，適合 `InStr` 搜尋或全文比對

選錯會讓你的搜尋邏輯吃到一堆雜訊。

### 雷 3：富文本不能用 `@Formula` 直接讀

```
@GetField("Body")     ' 拿到的是 ""，不是富文本內容
@Text(Body)           ' 同樣不行
```

要用 `@Abstract([TextOnly];0;"";"Body")` 或在 LotusScript 端用 `GetUnformattedText()` 處理。

## 跟其他類別的搭配

| 想做的事 | 用的類別 |
|---|---|
| 設樣式（粗體、顏色、字級） | `NotesRichTextStyle` |
| 設段落格式（縮排、對齊、列表） | `NotesRichTextParagraphStyle` |
| 建表格 | `NotesRichTextTable`（由 `AppendTable` 產生） |
| 走訪富文本內部結構 | `NotesRichTextNavigator`（由 `CreateNavigator` 產生） |
| 選取/複製/刪除某段 | `NotesRichTextRange`（由 `CreateRange` 產生） |
| 讀寫嵌入檔案 | [`NotesEmbeddedObject`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html)（由 `EmbeddedObjects` 屬性或 `GetEmbeddedObject` 取得） |

NotesRichTextItem 是 Notes 「**寫東西進文件**」這條 API 鏈的入口，後面的格式化、表格、嵌入都圍繞它展開。
