---
title: "NotesDocument 全攻略 — LotusScript 最核心類別的拿到、CRUD、五個踩雷點"
description: "NotesDocument 是 LotusScript 操作 Domino 文件最核心的類別 — 但它的細節很容易踩雷：GetItemValue 永遠回陣列、Save 的三個參數中 createResponse 常被誤解、Remove 的 force 不是軟刪除開關（軟刪除是 DB 層設定，要永久刪用 RemovePermanently）、direct property 跟 ReplaceItemValue 的微妙差別、漏 Save 是最常見的 silent bug。本文整理拿到 NotesDocument 的所有途徑、Item / Field 的觀念、CRUD 範例、五個必懂的坑、sibling methods 跟 Java/SSJS 對照。"
pubDate: 2026-05-13T07:30:00+08:00
lang: zh-TW
slug: notes-document
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "NotesDocument.Save method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SAVE_METHOD_DOC.html"
  - title: "NotesDocument.GetItemValue method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETITEMVALUE_METHOD.html"
  - title: "NotesDocument.Remove method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_REMOVE_METHOD_DOC.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
cover: "/covers/notes-document.png"
coverStyle: "paper-craft"
---

## 重點摘要

[`NotesDocument`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html) 是 LotusScript 對 Domino 文件做任何事都會用到的類別 — 建立、讀取、修改、刪除、設 reader/author、handle attachment、發 response、跑 ComputeWithForm，全部都從這裡開始。但 `NotesDocument` 有很多容易被搞錯的細節：

1. **`GetItemValue` 永遠回 array** — 連單值欄位都是，少打 `(0)` 就會吃到 Variant array 物件
2. **`Save(force, createResponse, markRead)` 的 `createResponse` 不是「建 response 文件」** — 是「衝突時把當前版本變成衝突文件」，常被誤解
3. **`Remove(force)` 的 `force` 不是永久刪除開關** — soft delete 是 DB 級設定，要永久刪用 `RemovePermanently`

這篇先整理拿到 `NotesDocument` 的所有途徑、Item / Field 的觀念、CRUD 範例，再講五個踩雷點，最後附 sibling methods 跟 Java/SSJS 對照。

## 拿到 NotesDocument 的途徑

依官方類別文件，至少有這些方式拿到 `NotesDocument`：

| 途徑 | 例子 |
|---|---|
| **新建** | `Set doc = New NotesDocument(db)` 或 `Set doc = db.CreateDocument()` |
| **UNID / NoteID 查詢** | `db.GetDocumentByUNID(...)` / `db.GetDocumentByID(...)` |
| **View 上的位置** | `view.GetFirstDocument()`、`view.GetNthDocument(n)`、`view.GetDocumentByKey(...)` |
| **集合搜尋** | `db.AllDocuments`、`db.Search(formula, ...)`、`db.FTSearch(query, ...)` |
| **agent context** | `session.CurrentAgent.SelectedDocuments`、`UnprocessedDocuments` |
| **Response 鏈** | 父文件的 `doc.Responses` collection、子文件的 `doc.ParentDocumentUNID` + `GetDocumentByUNID` |

**實務上 80% 情境** 是「`CurrentDatabase` + `GetDocumentByUNID`」或「view collection iterate」。其他幾種在批次處理、agent、response design 時才常用。

## Item vs Field — 觀念釐清

LS 新手最常搞混的觀念：「Item」跟「Field」**指的不是同一個東西**。

- **Item** = 文件實際存的 backend 資料單位（每筆都有 name + value + flags + data type）
- **Field** = form 設計上的 UI 元素（label + input + computed formula + validation）

當你在 form 上設一個 `Subject` field、user 在文件填入「test」儲存後，**底層存的是 `Subject` 這個 item**。Item 跟 field 同名是 form designer 安排，**並不是物理綁定**。所以你可以：

- 從 LS 在 doc 上加一個 form 上完全沒有的 item（用 `ReplaceItemValue`），它會被存進文件、但 UI 看不到
- 從 LS 改 item 值、但 form 上的 computed field / input translation / validation **不會跑**（這是 [Save 文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SAVE_METHOD_DOC.html)的原話：「Direct item access bypasses form validations, input translations, and computed fields」）— 要讓 form 邏輯跑一次得呼叫 `doc.ComputeWithForm()`

知道這個觀念，後面五個踩雷點才能講清楚。

## CRUD 範例

### 建立 + 存檔

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.CreateDocument()

doc.Form = "MainForm"
doc.Subject = "新文件"
doc.CreatedBy = session.UserName  ' 自己加的 item，跟 form 上有沒有無關

Call doc.Save(True, False)
```

兩個常用建立方式 `db.CreateDocument()` 跟 `New NotesDocument(db)` **行為一樣**，前者較常見、可讀性較好。

### 讀取單筆

```lotusscript
Dim doc As NotesDocument
Set doc = db.GetDocumentByUNID("UNID_STRING_HERE")

If doc Is Nothing Then
    Print "查無文件"
    Exit Sub
End If

Dim subjects As Variant
subjects = doc.GetItemValue("Subject")  ' 永遠是 array
Print subjects(0)                         ' 單值文件就讀第 0 個
```

或用 direct property syntax：

```lotusscript
Print doc.Subject(0)  ' 等同 GetItemValue, 也是 array
```

### 修改 + 存檔

```lotusscript
Set doc = db.GetDocumentByUNID("UNID")
If Not doc Is Nothing Then
    Call doc.ReplaceItemValue("Subject", "更新後的主題")
    Call doc.ReplaceItemValue("UpdatedAt", Now())
    Call doc.Save(True, False)
End If
```

`ReplaceItemValue` **不存在 item 也會建** — 不用先 `HasItem` 檢查。

### 刪除

```lotusscript
Set doc = db.GetDocumentByUNID("UNID")
If Not doc Is Nothing Then
    Call doc.Remove(True)  ' 看 DB 設定決定是 soft delete 還是 hard delete
End If
```

要**保證**永久刪除（即使 DB 啟用 soft delete）：

```lotusscript
Call doc.RemovePermanently(True)
```

## 五個踩雷點

### 1. `GetItemValue` 永遠回 array — 漏 `(0)` 就 type mismatch

[GetItemValue 文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETITEMVALUE_METHOD.html)原話：「For text, number, and time-date items, GetItemValue always returns an array, even when there is only a single value in the item.」

實務上會看到：

```lotusscript
Dim s As String
s = doc.GetItemValue("Subject")  ' 錯！type mismatch、s 是 String、回的是 Variant array
```

正解：

```lotusscript
Dim s As String
s = doc.GetItemValue("Subject")(0)  ' 取陣列第 0 個 element
```

或用 `GetItemValueString` 這個方便的 sibling（**已知是單值文字** item 用）：

```lotusscript
s = doc.GetItemValueString("Subject")
```

新人寫的 agent 一執行 type mismatch 多半就是這個漏 `(0)`。

### 2. `Save(force, createResponse, markRead)` 的 `createResponse` 不是「建 response 文件」

[Save 文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SAVE_METHOD_DOC.html)的三個參數常被誤解，特別是 `createResponse`：

| 參數 | 真正意義 |
|---|---|
| `force` (Boolean) | 衝突時的處理 — `True` 強蓋過、`False` 視 `createResponse` |
| `createResponse` (Boolean) | **不是**「建 response document」，而是「衝突發生時、把當前修改另存成 conflict 文件當原文的 response」 |
| `markRead` (Boolean, 可選) | `True` 把該文件對當前 user 標為已讀 |

常見錯解：「`createResponse=True` 是不是會把這個 doc 變成另一個 doc 的 response？」**不是**。要建 response 用的是 `MakeResponse(parent)`，那是另一個 method。

實務 90% 場景：`Save(True, False)` —— 強蓋過、無衝突文件。

### 3. `Remove(force)` 的 `force` 不是「永久刪除」開關

[Remove 文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_REMOVE_METHOD_DOC.html)：

- **`force` 參數**：`True` 表示「即使他人 script 開啟此 doc 後我也照刪」、`False` 表示「衝突就不刪」
- **軟刪除 vs 硬刪除**：取決於 **DB 級設定**「Allow soft deletions」 — 沒開、`Remove(True)` 就是永久刪除；有開、`Remove(True)` 會進 soft-delete 區（之後可以還原）

要**繞過 DB 軟刪除設定**、無條件永久刪除，用 [`RemovePermanently`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html)：

```lotusscript
Call doc.RemovePermanently(True)
```

很多文章把 `Remove(True)` 寫成「永久刪除」是錯的 — 完整準確說法是「衝突也照刪、但軟刪除與否看 DB 設定」。

### 4. Direct property syntax 跟 `ReplaceItemValue` 的微妙差別

兩種寫法看似等同：

```lotusscript
doc.Subject = "X"              ' direct property
Call doc.ReplaceItemValue("Subject", "X")  ' explicit method
```

實務上 99% 場景**真的等同**。但有兩個邊角：

- **Item type 強制**：`ReplaceItemValue` 可以接 `NotesDateTime`、array、explicit type，type 推斷更可控；direct syntax 對 string / number 沒問題、但 datetime 偶爾會有 coercion 陷阱
- **欄位名跟 LS reserved word 衝突**：例如 item 叫 `Form` 用 direct 沒問題（class 有 `Form` property），但叫 `Stop` 之類 reserved word 就要用 `ReplaceItemValue`

新手習慣可以**統一用 `ReplaceItemValue`** — 它幾乎沒有踩雷面、debug 也比較容易。

### 5. 漏 `.Save` — 最常見、debug 最痛的 silent bug

寫了一支 agent 改了三十個欄位，但**整支 agent 都沒呼叫 `doc.Save`** —— agent 結束、Domino 把記憶體釋放、變更**沒寫入**。沒任何錯誤訊息。

```lotusscript
Set doc = db.GetDocumentByUNID(unid)
Call doc.ReplaceItemValue("Status", "Approved")
Call doc.ReplaceItemValue("ApprovedBy", session.UserName)
Call doc.ReplaceItemValue("ApprovedAt", Now())
' ❌ 沒 Call doc.Save(True, False)
End Sub
```

最常見的觸發場景：

- 改完某個欄位、想看 dialog 確認沒問題（`MsgBox doc.Subject`）但沒繼續寫 Save
- 在 `For Each doc In dc` loop 內改 doc 但漏寫 Save
- 把寫法從「manual save → form save」refactor、結果 LS 路徑變成 in-memory 修改但 doc.Save 沒了

建議 code review 時**永遠 grep 一次每個 `ReplaceItemValue` 後面有沒有對應的 `.Save`**。

## Sibling methods 補充

| Method / Property | 用途 |
|---|---|
| `HasItem(name)` | 確認 item 是否存在（不存在不會 raise error） |
| `Items` | 回 array of `NotesItem` — 遍歷文件所有 item 用 |
| `GetItemValueString(name)` | 單值文字 item 的便利 method，直接回 String 不用 `(0)` |
| `GetFirstItem(name)` | 回單一 `NotesItem` 物件（給你進階控 type / flag） |
| `MakeResponse(parent)` | 把當前 doc 設為另一個 doc 的 response |
| `ParentDocumentUNID` | response 文件的父 UNID |
| `Responses` | 回 NotesDocumentCollection — 該 doc 的所有 direct response |
| `ComputeWithForm()` | 跑一次該 form 的 computed field / validation / input translation |
| `RemovePermanently(True)` | 永久刪除、繞過 DB 軟刪除設定 |
| `Sign()` / `Encrypt()` | 簽章 / 加密文件 |
| `CopyAllItems(srcDoc, replace)` | 從另一筆 doc 複製所有 item |

`Items` 集合特別好用於「**動態遍歷一筆 doc 上有哪些欄位、印出全部值來 debug**」這類 use case。

## What about Java and SSJS?

`NotesDocument` 跨語言對位很乾淨：

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesDocument` |
| Java | `lotus.domino.Document` — method 名 camelCase (`getItemValue`、`save`、`remove`、`replaceItemValue`、`hasItem`、`makeResponse`、`computeWithForm`、`removePermanently`) |
| SSJS（XPages） | 同 Java，透過 `lotus.domino.*` import |

跨語言差別只在大小寫慣例（Pascal → camel）跟 syntax 包裝（LS 的 `Set doc = ...` vs Java 的 `Document doc = ...`）— 語意完全相同。一個重要 Java/SSJS 額外考量：**Java 物件要記得 recycle（`doc.recycle()`）**，否則 c++ side memory 不會釋放。LS 自動 recycle，所以這在 LS 不是議題。

## 結論

`NotesDocument` 是 LS 寫 Domino backend code 一定會用到的類別 — 但 method 數量多、預設行為對新手不友善（`GetItemValue` 回 array、`Save` / `Remove` 的參數語意都跟直覺不同）。常見的 production bug 來源前三名：

1. **漏 `.Save`** — 改了沒存
2. **`GetItemValue` 漏 `(0)`** — type mismatch 或拿到 Variant array 物件
3. **誤用 `Remove(True)` 以為永久刪除** — 結果 DB 啟用 soft delete、文件還在 trash 區

把這三個記起來，寫 agent 跟 server script 就少踩 80% 的雷。
