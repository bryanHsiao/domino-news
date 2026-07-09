---
title: "多層分類 view 裡的 GetAllDocumentsByKey：為什麼你的 count 悄悄就錯了"
description: "在單層分類 view，GetAllDocumentsByKey('Belgien', True) 正確回傳那個分類下的 2 筆文件。但加上第二層分類 — Form 再 Country — GetAllDocumentsByKey('Customer', True) 回傳 3，不是全部。它停在第一個子分類就不走了。本文記錄這個實測驗證過的陷阱與繞法。"
pubDate: 2026-07-09T07:30:00+08:00
lang: zh-TW
slug: by-key-lookup-categorized-views
tags:
  - "LotusScript"
  - "Domino Designer"
  - "Tutorial"
sources:
  - title: "NotesView.GetAllDocumentsByKey method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html"
  - title: "NotesView.GetDocumentByKey method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDOCUMENTBYKEY_METHOD.html"
  - title: "Domino Back to Basics Part 5: Finding data — NotesSensei (Stephan Wissel)"
    url: "https://www.wissel.net/blog/2014/01/domino-development-back-to-basics-part-5-finding-data-collections-and-search.html"
relatedJava: ["View"]
relatedSsjs: ["View"]
---

在一個以 Country 分類的 view 裡，`GetAllDocumentsByKey("Belgien", True)` 回傳 2 — Maison Dewey 與 Suprêmes délices。完全正確。單層分類加上 by-key 查詢，運作得一如預期。

現在加上第二層分類。一個 view "cc"，先以 Form 分類、再以 Country 分類：

```
▼ Customer              ← 第一層分類 (Form)
  ▼ Argentinien         ← 第二層分類 (Country)
      Cactus Comidas para llevar (CACTU)
      Océano Atlántico Ltda. (OCEAN)
      Rancho grande (RANCH)
  ▼ Belgien
      Maison Dewey (MAISD)
      Suprêmes délices (SUPRD)
  ▼ Brasilien
      Comércio Mineiro (COMMI)
      …9 筆以上
  ▼ Dänemark
      Simons bistro (SIMOB)
      …
```

呼叫 `GetAllDocumentsByKey("Customer", True)`。你期望拿到 "Customer" 分類下的每一筆文件 — 所有國家、所有文件。答案回來：**3**。不是全部的數字。只有 Argentinien（第一個子分類）底下那 3 筆。

沒有錯誤。沒有警告。一個看起來合理的數字。你就這樣上線了。

---

## 重點摘要

- **單層分類 view + by-key = 正確運作。** 傳分類值、拿到該分類下所有文件。
- **多層分類 view + 單一 key = 悄悄被截斷。** 查詢在第一個子分類邊界就停了。你拿到的是一個*看起來*對的部分結果（不是零、不是錯誤、是一個合理的 count），但後面的子分類全部都漏掉了。
- `GetAllDocumentsByKey` 文件說 key 是「由左至右比對已排序欄位」— 但它沒警告在多層分類 view 裡單一 key 只會回傳到第一個子分類的文件。
- **繞法：** 用一個平面的（非分類）查詢 view；或用不依賴 view 分類結構的 [`db.Search`](/domino-news/zh-TW/posts/lotusscript-db-search) / [DQL](/domino-news/zh-TW/posts/dql-getting-started)；或用 `GetAllEntriesByKey` 明確地走子分類。

## 單層分類做對了什麼

先把基線講清楚：只有一個分類欄位的 view 運作如預期。[五個 pitfall 的那篇](/domino-news/zh-TW/posts/getalldocumentsbykey)講的是正常的 by-key 機制 — key 由左至右比對已排序欄位、`exactMatch` 預設 False 等等。在一個只以 Country 分類的 Customers view 裡，`GetAllDocumentsByKey("Belgien", True)` 正確回傳 Belgien 底下的 2 筆文件。沒什麼意外。

陷阱只在 view 有**分類再分類**時才出現。

## 實測證明

View "cc" — 兩個分類欄位：

| 欄位 | 角色 | 已排序 | 分類 |
|---|---|---|---|
| Form | 第一層分類 | 是 | 是 |
| Country | 第二層分類（巢狀在 Form 底下）| 是 | 是 |
| Subject | 顯示 | — | 否 |

程式：
```lotusscript
Sub Initialize
  On Error GoTo errH
  Dim ss As New NotesSession
  Dim db As NotesDatabase
  Set db = ss.CurrentDatabase
  Dim v As NotesView
  Set v = db.GetView("cc")
  Dim dc As NotesDocumentCollection
  Set dc = v.GetAllDocumentsByKey("Customer", True)
  MsgBox dc.Count
  Exit Sub
errH:
  MsgBox "get error: " + Error + " on line: " + CStr(Erl)
End Sub
```

結果：**3** — 只有 Argentinien（第一個子分類）底下的文件。不是 "Customer" 底下橫跨所有國家的 20 幾筆。

查詢找到了第一層分類 "Customer"、下降到它的第一個子分類 "Argentinien"、回傳那 3 筆文件、然後就停了。Belgien 的 2 筆、Brasilien 的 9 筆、Dänemark 的 2 筆、以及其他每個國家的文件，全部悄悄不見了。

## 為什麼這是地雷

三個原因讓這個比多數 API 怪癖更會咬人：

1. **結果看起來合理、不是零。** 你拿到 count = 3 — 一個真實的數字、來自真實的文件。如果答案是 0 你會馬上調查。但 3 看起來搞不好就是對的，尤其你不知道正確的總數該是多少。

2. **沒有錯誤、沒有警告。** 方法不丟錯、不回 `Nothing`、不設旗標。它回傳一個合法的 `NotesDocumentCollection`，裝著合法的文件 — 只是不是全部。

3. **[官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html)沒描述這個行為。** 它說「陣列第一個元素比對第一個已排序欄位」、警告了 `\\` backslash 子分類 bug，但它沒提到在多層分類 view 裡用單一 key 會在第一個子分類就截斷。你可以把方法頁從頭讀到尾、仍然不會預見這個。

## 繞法

**方法一：用平面的查詢 view。** 做一個專用 view，你需要的欄位有排序但**不分類**（或只有單層分類）。一個 Form 有排序（ascending、不勾 categorize）的「lookup」view，用單一 key 就能回傳完整的結果集。

**方法二：用 `db.Search` 或 DQL。** 這些根本不走 view 索引，所以分類結構影響不了它們：

```lotusscript
Set dc = db.Search({Form = "Customer"}, Nothing, 0)
Print dc.Count   ' 所有 Form = "Customer" 的文件
```

**方法三：用 `GetAllEntriesByKey` 走子分類。** 如果你一定要用那個分類 view，用 `GetAllEntriesByKey` 搭配最上層的 key。view-entry 集合包含分類 entry 本身，讓你能走完整棵樹。但到了這步，做一個平面查詢 view 通常更簡單。

最乾淨的答案 — 也是完全避開陷阱的那個 — 是一個沒有多層分類的查詢 view。如 [Stephan Wissel 的 back-to-basics 指南](https://www.wissel.net/blog/2014/01/domino-development-back-to-basics-part-5-finding-data-collections-and-search.html)所強調的，分類再分類是給人類讀者展開/折疊群組用的 UI 功能；它不是拿來做程式化查詢的可靠結構。

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `view.GetAllDocumentsByKey(...)` / `view.GetDocumentByKey(...)` |
| Java | [`View.getAllDocumentsByKey(...)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDOCUMENTBYKEY_METHOD.html) |
| SSJS (XPages) | 同 Java |

這個行為是 view 索引的性質、不是語言的 — 所以同樣的截斷在 Java 與 SSJS 也會發生。繞法也一樣：平面查詢 view、或 `db.search` / DQL。
