---
title: "NotesView.GetAllDocumentsByKey 全攻略：你以為簡單，但它有五個踩雷點"
description: "GetAllDocumentsByKey 是 LotusScript 開發中最常用的查詢方法 —— 給一個 key、拿回符合的所有 doc。但「key 對應 sorted column 不是 doc field」「exactMatch 預設 False 是前綴比對」「反斜線分類欄位讓查詢失效」這些細節，HCL 官方文件寫了但很多人沒讀完。本文整理 signature、整個 by-key 方法家族、五個常見踩雷點，附完整範例。"
pubDate: 2026-05-09T07:30:00+08:00
lang: zh-TW
slug: getalldocumentsbykey
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesView class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEW_CLASS.html"
  - title: "NotesView.GetAllDocumentsByKey method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html"
  - title: "NotesView.GetDocumentByKey method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETDOCUMENTBYKEY_METHOD.html"
relatedJava: ["View"]
relatedSsjs: ["View"]
---

## 為什麼幾乎每個 LotusScript 開發者都用過它

[`NotesView`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEW_CLASS.html) class 上的 `GetAllDocumentsByKey` 是 Notes 開發最日常的查詢動作 —— 給一個 key、拿回符合的所有 document。「找出某個業務員今年所有訂單」、「列出某個專案的全部任務」、「掃出某個客戶名下的所有合約」 —— 全部都是 GetAllDocumentsByKey。

但這個 method 有些設計細節是 HCL 官方明寫但很多人沒讀完，常見的踩雷類型有五種，本文逐一講清楚。

## Signature

完整 signature：

```
Set collection = notesView.GetAllDocumentsByKey( keyArray [, exactMatch%] )
```

| 參數 | 型別 | 說明 |
|---|---|---|
| `keyArray` | String、Integer、Long、Double，或 String / Number / `NotesDateTime` / `NotesDateRange` 的陣列 | 要比對的 key（單 key 或多 column 的 key 陣列） |
| `exactMatch%` | Boolean，optional | `True` 完全比對、`False`（預設）前綴比對 |
| 回傳 | `NotesDocumentCollection` | 符合的所有 doc；沒命中時是「空 collection」（count = 0），不是 Nothing |

## 三個關鍵概念（先搞懂這三個再用）

### 1. Key 對應 view 的「sorted column」，不是 doc 欄位

新手最常誤解的點：「key」**不是**比對 document field 的值，而是比對 view 上**已排序欄位**的計算結果。

「For the GetAllDocumentsByKey method to work, you must have at least one sorted column for each key.」 —— 直接引自官方。

實務上：

- view 第一個排序欄位是 `Customer`（顯示的就是 `customer` field 的值）→ key = 客戶名 → 直接 work
- view 第一個排序欄位是公式 `Customer + " - " + ProjectName` → key 必須是「客戶名 + ' - ' + 專案名」這個合成字串，不是任一個原始欄位的值

排序欄位的「程式設計時使用 → 名稱」跟欄位是不是同名沒關係 —— 重點是排序欄位**對某筆 doc 算出來的字串**是不是等於你的 key。

### 2. `exactMatch%` 預設是 **False**（前綴比對）

這個 default 是踩雷雷區。如果你寫：

```lotusscript
Set col = view.GetAllDocumentsByKey("cat")
```

**回傳的會包含 `cat`、`category`、`catalog`、`catfish`** —— 因為 default 是前綴比對。官方原文：

- exactMatch=True → 「'cat' matches 'cat' but does not match 'category,' while '20' matches '20' but does not match '201'」
- exactMatch=False（default）→ 「'T' matches 'Tim' or 'turkey,' but does not match 'attic,' while 'cat' matches 'catalog' or 'category'」

要嚴格比對請務必傳 `True`：

```lotusscript
Set col = view.GetAllDocumentsByKey("cat", True)   ' 只回 "cat"，不會撈到 "category"
```

### 3. 多 column key 用陣列，順序對應 view 的排序順序

如果 view 有兩個排序欄位（依序 `Customer` → `Year`），要查「某客戶 2026 年」：

```lotusscript
Dim keys(0 To 1) As String
keys(0) = "Bryan Inc."
keys(1) = "2026"
Set col = view.GetAllDocumentsByKey(keys, True)
```

陣列順序**必須對應排序欄位順序**。陣列長度可以**短於**排序欄位數（傳 1 個 key 對應第一個欄位、其他欄位不限制），但不能長於。

## 一整個 by-key 方法家族

GetAllDocumentsByKey 不是孤單的，它有兄弟：

| 方法 | 回傳 | 何時用 |
|---|---|---|
| `GetDocumentByKey(key, [exact])` | 單一 `NotesDocument`，沒命中回 **Nothing** | 預期 key 唯一、只要第一筆（最快） |
| [`GetAllDocumentsByKey(key, [exact])`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html) | `NotesDocumentCollection`，空 collection 表示沒命中 | 要全部符合的 doc |
| `GetAllEntriesByKey(key, [exact])` | `NotesViewEntryCollection` | 要 view entries（不是 doc 物件），可以拿 ColumnValues、未讀狀態等 view 才有的中介資料 |
| `GetAllReadEntries()` | `NotesViewEntryCollection` | view 上目前 user 已讀的 entry 們 |
| `GetAllUnreadEntries()` | `NotesViewEntryCollection` | 同上但是未讀 |

選擇原則：**只要一筆 → `GetDocumentByKey`；要 doc 物件操作 → `GetAllDocumentsByKey`；要 view 中介資料（column values、unread state）→ `GetAllEntriesByKey`**。後者比前者**更輕量**（不必把整個 doc 拉進記憶體），大資料量時 entry 系列效能比 doc 系列好。

## 完整範例

### 單 key 查詢

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim view As NotesView
    Dim col As NotesDocumentCollection
    Dim doc As NotesDocument

    Set db = session.CurrentDatabase
    Set view = db.GetView("(byCustomer)")  ' 第一排序欄位是 Customer
    If view Is Nothing Then
        Error 1, "找不到 view (byCustomer)"
    End If

    ' 嚴格比對 — 只要 Customer 完全等於 "Bryan Inc." 的 doc
    Set col = view.GetAllDocumentsByKey("Bryan Inc.", True)

    If col.Count = 0 Then
        Print "查無資料"
        Exit Sub
    End If

    Print "找到 " & col.Count & " 筆："
    Set doc = col.GetFirstDocument()
    Do Until doc Is Nothing
        Print "  - " & doc.Subject(0)
        Set doc = col.GetNextDocument(doc)
    Loop
End Sub
```

### 多 column key 查詢

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim view As NotesView
    Dim col As NotesDocumentCollection

    Set db = session.CurrentDatabase
    Set view = db.GetView("(byCustomerYear)")  ' 排序: Customer, Year

    Dim keys(0 To 1) As Variant
    keys(0) = "Bryan Inc."
    keys(1) = "2026"

    Set col = view.GetAllDocumentsByKey(keys, True)
    Print "客戶 Bryan Inc. 在 2026 年的訂單共 " & col.Count & " 筆"
End Sub
```

## 五個踩雷點

### 1. Column 沒設成 sorted → 直接 silent 失敗

如果 view 第一欄沒勾「Sort: Ascending / Descending / Click on column header to sort」，這個方法根本不會 work —— 但**不會噴錯**，會回空 collection 讓你以為「查無資料」。

排查方式：用 Designer 開那個 view → 點第一欄 → 屬性 → Sorting tab → 確認 Sort = Ascending 或 Descending。

### 2. 反斜線分類欄位（`Cat\\Subcat`）讓 [`GetDocumentByKey`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETDOCUMENTBYKEY_METHOD.html) 失效

官方原文：「columns formatted with both categories and subcategories using the '\\\\' character will prevent the method from locating documents.」

也就是 view 排序欄位若用反斜線做兩層分類（例如 `Region\Country` 或 `Year\Month`），by-key 方法會找不到。Workaround：把分類拆成兩個獨立欄位、key 用陣列傳。

### 3. exactMatch=False（default）會撈到不該撈的

前面提過。**永遠把 `exactMatch%` 設成 `True` 除非你真的要前綴比對**。讓 default 是 False 這個設計可能是 1996 年「找跟『陳』姓開頭的客戶」這類用法 —— 在現代寫嚴格 lookup 的 use case，default 反而誤導。

### 4. Date / DateTime key 必須用 `NotesDateTime`，不是字串

直接傳字串 `"2026-05-09"` 大多數情況不會 match —— Notes view 排序欄位裡的日期是 Date 物件，不是字串。正確做法：

```lotusscript
Dim dt As New NotesDateTime("2026-05-09")
Set col = view.GetAllDocumentsByKey(dt, True)
```

只有在 view 欄位本身就是 `@TextToTime(field)` 之類已轉成字串顯示的特殊 case，才能用字串 key。一般情境用 `NotesDateTime` 物件最保險。

### 5. 回傳的 collection「沒順序」、「不能 access ColumnValues」

「Documents returned by this method are in no particular order, and do not provide access to ColumnValues.」 —— 這條最容易踩。如果你需要：

- **照 view 順序處理** → 改用 `GetAllEntriesByKey`，搭配 `NotesViewEntry`
- **取那一筆 entry 的 column values**（不必 load 整個 doc 的 fields）→ 同樣用 `GetAllEntriesByKey`

`GetAllDocumentsByKey` 拿到的是**裸 doc 集合，順序未定義**。需要排序的話自己排，或改 entries 路線。

## 同類別在其他語言

| 語言 | 對應方法 |
|---|---|
| LotusScript | `view.GetAllDocumentsByKey(...)` |
| Java | `lotus.domino.View.getAllDocumentsByKey(...)` —— signature 一致，case sensitivity 跟參數行為都一樣 |
| SSJS（XPages）| 同 Java（SSJS 透過 `lotus.domino.*` import 使用同一 class） |

跨語言行為一致是 Domino API 的特色 —— 學會 LS 版的 GetAllDocumentsByKey，Java / SSJS 直接會用，差別只在 LS 是 `Set ... =` 而 Java 是 `View view = ...; DocumentCollection col = view.getAllDocumentsByKey(...);` 這種 syntax 包裝。

## 結論

GetAllDocumentsByKey 看起來簡單 —— 三個參數、一個回傳值 —— 但 default `exactMatch%=False` 這個設計、「key 對應 sorted column」這個概念、「沒命中回空 collection」「documents 沒順序」這幾個 caveat，是 LS 老開發者也偶爾會被坑到的地方。寫 lookup query 之前花 30 秒 review 一下這篇，比之後 debug 為什麼 `Set col = view.GetAllDocumentsByKey("cat")` 撈到 catalog 跟 category 容易得多。
