---
title: "NotesRichTextParagraphStyle、NotesRichTextTab 與 NotesColorObject：用程式排版 rich text"
description: "用 LotusScript 產 rich text 不只是接字串 —— 邊界、對齊、行距、tab 停點、顏色都是你在「加文字之前」蓋上去的獨立物件。本文說明 NotesRichTextParagraphStyle（版面）、NotesRichTextTab（tab 停點，由 style 唯讀生出）、NotesColorObject（色彩運算）、twips 度量、「先蓋 style 再加文字」規則，以及那個不直覺的點：NotesColorObject 不會直接幫文字上色 —— 你是用它推算出一個 Domino 色值。"
pubDate: 2026-07-01T07:30:00+08:00
lang: zh-TW
slug: notes-rich-text-paragraph-style
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextParagraphStyle class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS_3756.html"
  - title: "NotesRichTextTab class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTTAB_CLASS.html"
  - title: "NotesColorObject class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCOLOROBJECT_CLASS.html"
relatedJava: ["RichTextParagraphStyle", "RichTextTab", "ColorObject"]
relatedSsjs: ["RichTextParagraphStyle", "RichTextTab", "ColorObject"]
cover: "/covers/notes-rich-text-paragraph-style.webp"
coverStyle: "low-poly-3d"
---

你用 agent 產一份報表文件 —— 標題置中、內文縮排、數字對齊在小數 tab 上、標題用你的品牌藍。在 Designer 裡你會在編輯器裡點一點搞定。但在 LotusScript，格式不是 `AppendText` 的一部分 —— 它住在獨立的 style 物件裡，而且你要在「它要管的文字」*之前*先套上去。

其中三個物件互相搭配：[`NotesRichTextParagraphStyle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS_3756.html) 持有段落版面、[`NotesRichTextTab`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTTAB_CLASS.html) 代表其中一個 tab 停點、`NotesColorObject` 做色彩運算。本文走過這三個，以及那個讓每個人都意外的陷阱：色彩物件其實不會幫你的文字上色。

---

## 重點摘要

- 用 `session.CreateRichTextParagraphStyle` 建段落 style，設好對齊／邊界／行距／tab，然後在加入它要管的文字*之前* `Call rtitem.AppendParagraphStyle(style)`。
- 邊界與 tab 位置的單位是 **twips** —— `RULER_ONE_INCH` = 1440、`RULER_ONE_CENTIMETER` = 567。文件講得很白：「一公分是 567 twips，一英吋是 1440 twips。」
- `Alignment` 用常數 `ALIGN_LEFT`（0）/ `ALIGN_RIGHT`（1）/ `ALIGN_FULL`（2）/ `ALIGN_CENTER`（3）/ `ALIGN_NOWRAP`（4）。
- tab 設在段落 style 上（`SetTab`、`SetTabs`、`ClearAllTabs`）；一個 `NotesRichTextTab` 是**唯讀**的 —— `Position` 與 `Type`（`TAB_LEFT`/`TAB_RIGHT`/`TAB_DECIMAL`/`TAB_CENTER`）。
- `NotesColorObject`（`session.CreateColorObject`）在 Domino 調色盤值（`NotesColor`，0–240）、RGB（0–255）、HSL（0–240）之間轉換。`SetRGB` / `SetHSL` 會貼齊**最接近**的 Domino 顏色並回傳它。
- **陷阱：** `NotesColorObject` *不會*附到 rich text 上。你用它推算出一個 Domino 色值，再把那個值指派給 `NotesRichTextStyle.NotesColor`（字元 style）。三個不同物件：段落 style、字元 style、色彩物件。

## 段落 style

`NotesRichTextParagraphStyle` ——「代表 rich text 段落屬性」—— 從 session 建立，承載一個段落的版面：

```lotusscript
Dim session As New NotesSession
Dim rtps As NotesRichTextParagraphStyle
Set rtps = session.CreateRichTextParagraphStyle
rtps.Alignment = ALIGN_CENTER
rtps.LeftMargin = RULER_ONE_INCH          ' twips
rtps.RightMargin = RULER_ONE_INCH
rtps.SpacingAbove = SPACING_DOUBLE
rtps.SpacingBelow = SPACING_ONE_POINT_50
```

最常用的屬性：`Alignment`、`LeftMargin` / `RightMargin` / `FirstLineLeftMargin`、`SpacingAbove` / `SpacingBelow` / `InterLineSpacing`（搭配 `SPACING_SINGLE` / `SPACING_ONE_POINT_50` / `SPACING_DOUBLE` 常數），以及控制分頁的 `Pagination`（`PAGINATE_BEFORE`、`PAGINATE_KEEP_WITH_NEXT`、`PAGINATE_KEEP_TOGETHER`）。邊界是 twips，所以 `RULER_ONE_INCH * 0.75` 就是四分之三英吋。

## Tab

你不會去 `New` 一個 `NotesRichTextTab`。你把 tab 設在段落 style 上，再透過它唯讀的 `Tabs` 陣列讀回來：

```lotusscript
' 三個小數 tab，第一個在 1 英吋、間隔 1 公分 —— 數字會對齊在小數點上
Call rtps.SetTabs(3, RULER_ONE_INCH, RULER_ONE_CENTIMETER, TAB_DECIMAL)

' 或一次設一個
Call rtps.SetTab(RULER_ONE_INCH * 2, TAB_RIGHT)

' 全部清掉
' Call rtps.ClearAllTabs
```

每個生出來的 `NotesRichTextTab` 提供 `Position`（twips）與 `Type`（`TAB_LEFT` = 0、`TAB_RIGHT` = 1、`TAB_DECIMAL` = 2、`TAB_CENTER` = 3 之一），兩者都唯讀 —— 要改 tab 就重設整個 style 的 tabs。

## 顏色 —— 以及那個不幫任何東西上色的物件

[`NotesColorObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESCOLOROBJECT_CLASS.html)（「代表一個顏色」）是色彩*運算*。它同時以三種表示法持有一個顏色，並在它們之間轉換：

```lotusscript
Dim color As NotesColorObject
Set color = session.CreateColorObject
Dim dominoColor As Integer
dominoColor = color.SetRGB(0, 102, 204)   ' 回傳最接近的 Domino 調色盤值
```

它唯讀的 `Red` / `Green` / `Blue`（0–255）、`Hue` / `Saturation` / `Luminance`（0–240），以及可讀寫的 `NotesColor`（Domino 調色盤值，0–240）彼此保持同步 —— 依文件「設定 NotesColor 會把 RGB 與 HSL 屬性設成對應該 Domino 色值的值」。因為調色盤只有 0–240，`SetRGB` / `SetHSL` 會把任意顏色貼齊到**最接近**的 Domino 顏色，那也就是它們的回傳值。

陷阱在這裡：`NotesColorObject` 從不附到 rich text item 上。文字顏色是由 `NotesRichTextStyle`（*字元* style）承載的。色彩物件的工作，是給你一個 Domino 值好指派到那裡：

```lotusscript
Dim richStyle As NotesRichTextStyle
Set richStyle = session.CreateRichTextStyle
richStyle.NotesColor = dominoColor        ' 來自上面的 SetRGB；或像 COLOR_RED 這種常數
richStyle.Bold = True
```

所以三個物件、三種職責：**段落 style** 排整塊的版面、**字元 style** 承載顏色／粗體／字型、**色彩物件** 從任意 RGB 算出一個調色盤值。色彩物件只在你需要超出具名 `COLOR_*` 常數的顏色時才值得動用。

## 組起來

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase
  Dim doc As New NotesDocument(db)
  doc.Form = "Memo"

  ' 段落版面
  Dim rtps As NotesRichTextParagraphStyle
  Set rtps = session.CreateRichTextParagraphStyle
  rtps.Alignment = ALIGN_CENTER
  Call rtps.SetTabs(3, RULER_ONE_INCH, RULER_ONE_CENTIMETER, TAB_DECIMAL)

  ' 顏色 -> 字元 style
  Dim color As NotesColorObject
  Set color = session.CreateColorObject
  Dim richStyle As NotesRichTextStyle
  Set richStyle = session.CreateRichTextStyle
  richStyle.NotesColor = color.SetRGB(0, 102, 204)
  richStyle.Bold = True

  ' 建 item：style 要在文字「之前」
  Dim rt As New NotesRichTextItem(doc, "Body")
  Call rt.AppendParagraphStyle(rtps)
  Call rt.AppendStyle(richStyle)
  Call rt.AppendText("Q1 Report")

  Call doc.Save(True, False)
End Sub
```

*（組裝自官方「working with text」範例；把邊界、tab 與色彩物件推算的顏色放進同一個程序是改寫的。）*

**順序規則是第一大陷阱：** 段落 style 與字元 style 都要在它們要套的文字*之前*加入。蓋在後面，它們什麼都管不到。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesRichTextParagraphStyle` | `RichTextParagraphStyle` | `RichTextParagraphStyle` |
| `NotesRichTextTab` | `RichTextTab` | `RichTextTab` |
| `NotesColorObject` | `ColorObject` | `ColorObject` |

Java 與 SSJS 的介面與這些對應 —— `session.createRichTextParagraphStyle()`、`session.createColorObject()`、同一套 twips 與常數。「style 在文字之前」和「色彩物件餵給字元 style」這兩條規則都原樣沿用。
