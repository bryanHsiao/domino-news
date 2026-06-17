---
title: "NotesForm：用程式讀一個資料庫有哪些表單、欄位、誰能用"
description: "你接手一個沒文件的 NSF，想先搞清楚它有哪些表單、每個表單有哪些欄位、誰被允許建立文件 — 不用打開 Designer，用 NotesForm 就能在程式裡把這些設計資訊讀出來。本文拆解從 db.Forms / db.GetForm 取得表單、Name / Aliases / Fields / FormUsers / Readers 等屬性、GetFieldType 與 Remove，以及 ProtectReaders / ProtectUsers 跟複寫的關係。"
pubDate: 2026-06-17T07:30:00+08:00
lang: zh-TW
slug: notes-form
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesForm class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html"
  - title: "NotesDatabase class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
  - title: "NotesForm class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESFORM_CLASS.html"
relatedJava: ["Form"]
relatedSsjs: ["Form"]
cover: "/covers/notes-form.webp"
coverStyle: "oil-chiaroscuro"
---

你接手一個沒人留文件的 NSF：想先搞清楚它到底有哪些表單、每個表單長什麼樣、誰被允許用它建文件。打開 Designer 一個一個點當然可以，但如果你要寫一支稽核 agent、跑過幾十顆資料庫做盤點呢？

這時候靠的是 [`NotesForm`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html)。它的定義很簡單 —— 「Represents a form in a database」 —— 但重點在於：它讓你**在程式裡讀到表單的設計資訊**，不用開 Designer。這在「處理文件」之外、難得碰到的「讀設計」這一面，`NotesForm` 是主要入口之一。

---

## 重點摘要

- 從 [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html) 取得：`db.Forms`（全部，回傳陣列）或 `db.GetForm("表單名")`（指定一個）
- **讀設計**：`Name`、`Aliases`（別名）、`Fields`（所有欄位名，陣列）
- **讀權限**：`FormUsers`（誰能用此表單建文件，即 `$FormUsers` 欄位）、`Readers`（`$Readers`）
- `IsSubForm`：判斷是不是子表單；`GetFieldType(欄位名)`：查某欄位的型別
- **複寫保護**：`ProtectReaders` / `ProtectUsers`（讀寫 `Boolean`）防止 `$Readers` / `$FormUsers` 被複寫蓋掉
- `Remove()` 永久刪除表單；多數屬性唯讀，FormUsers / Readers / Protect* 是讀寫

---

## 取得表單：db.Forms 與 db.GetForm

表單屬於資料庫，所以從 `NotesDatabase` 取得。要列出全部，用 `db.Forms`（回傳陣列）——[官方範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESFORM_CLASS.html)就是這樣跑的：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase
  Forall form In db.Forms
    Messagebox form.Name
  End Forall
End Sub
```

要指定某一個，用 `db.GetForm("Memo")`。一個官方提醒：**「You can't get access to private forms belonging to other people.」** —— 別人的私有表單你讀不到，只能拿到共用的與自己的。

## 讀設計：Name / Aliases / Fields

拿到 `form` 之後，這三個唯讀屬性是「盤點」最常用的：

| 屬性 | 內容 |
|---|---|
| `Name` | 表單名稱 |
| `Aliases` | 表單的別名（陣列） —— 表單常有「顯示名｜別名」，程式參照多半用別名 |
| `Fields` | 此表單上**所有欄位名稱**的陣列 |

`Fields` 特別有用 —— 一行就能列出某表單定義了哪些欄位，不用開 Designer 看 form 設計：

```lotusscript
Dim form As NotesForm
Set form = db.GetForm("Order")
Forall fld In form.Fields
    Print fld & " : " & form.GetFieldType(fld)   ' 欄位名 + 型別
End Forall
```

`GetFieldType(欄位名)` 回傳那個欄位的資料型別，跟 `Fields` 搭起來就是一張「表單欄位清單 + 型別」。

## 讀權限：FormUsers 與 Readers

`NotesForm` 也讓你讀（並改）表單層級的存取控制：

- **`FormUsers`**（讀寫）—— 官方：建立表單時若指定了「誰可以用這個表單建文件」，那些名字就存在 `$FormUsers` 欄位裡，這個屬性讀的就是它。
- **`Readers`**（讀寫）—— 讀的是 `$Readers` 欄位內容。

搭配的是兩個複寫保護開關：**`ProtectReaders`** 跟 **`ProtectUsers`**（讀寫 `Boolean`）。它們的作用是「防止 `$Readers` / `$FormUsers` 在複寫時被另一個副本蓋掉」。如果你在多伺服器環境用程式改了表單的 reader/user 設定，記得這兩個旗標決定你的改動會不會被複寫沖掉。

## 還有

- `IsSubForm`（唯讀 `Boolean`）—— 判斷這是不是子表單。
- `Remove()` —— 永久刪除表單（謹慎用）。
- `HttpURL` / `NotesURL` —— 表單在 HTTP / Notes 協定下的 Domino URL。
- `Lock()` / `LockProvisional()` / `UnLock()` —— 設計元素鎖定，多人改設計時用。

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `Form` | `db.getForm(name)` / `db.getForms()` |
| SSJS / XPages | `Form` | `database.getForm(name)` |

三邊一致：都從 database 取得、都能讀 `Name` / `Fields` / `FormUsers` 等。要注意 `Fields`、`Aliases` 在 Java/SSJS 是 `getFields()` / `getAliases()` 方法回傳字串陣列。寫 Java 稽核工具掃描設計時，這篇的屬性對照可以直接用。
