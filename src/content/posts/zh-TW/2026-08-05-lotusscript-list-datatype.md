---
title: "LotusScript 的 List：內建的雜湊表，卻人人用平行陣列重造一遍"
description: "你要依分類數文件、去重一組名字、或建一個「代碼→標籤」的查表好不用每次都打 view。Domino 的直覺是兩個平行陣列加一個線性掃描、或一個丟完就扔的 view。但 LotusScript 一直有一個原生的鍵值集合、幾乎沒人用：List。一篇關於這個內建關聯陣列的實測報告 —— 它的鍵值存取、ForAll + ListTag 走訪、Erase，以及兩個雷（用 IsElement 守讀取、以及 tag 大小寫跟隨 Option Compare）。"
pubDate: 2026-08-05T07:30:00+08:00
lang: zh-TW
slug: lotusscript-list-datatype
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Working with lists with LotusScript — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html"
  - title: "IsElement function (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ISELEMENT_FUNCTION.html"
  - title: "ForAll statement (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_FORALL_STATEMENT.html"
relatedJava: []
relatedSsjs: []
---

你要依分類數文件。或去重一串名字。或建一個「代碼 → 標籤」的查表、讓你解一個代碼時不用每次都打一個 view。Domino 的直覺是一對平行陣列加一個線性掃描 —— `For i = 0 To UBound(keys)`、比對、可能還 `Redim Preserve` —— 或一個讀回來的臨時分類 view。兩個都能動，而兩個都在重造一個 LotusScript 從一開始就內建、卻幾乎沒人用的東西：**List**。

[List](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html) 是 LotusScript 原生的關聯陣列 —— 一個鍵值集合、一本字典、一個雜湊表，隨你從哪個語言來就怎麼叫它。這是一篇關於這個「藏在眼前」的資料型別的簡短實測報告：怎麼用它、哪兩個操作讓它值得你伸手拿、以及一旦你用了會咬人的兩個雷。

---

## 重點摘要

- 用 `List` 宣告：`Dim total List As Long`。用字串 key 指派：`total("Sales") = 10` —— 指派一個新 key 就會建立它。
- 用 [`IsElement`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ISELEMENT_FUNCTION.html) 守讀取：List 沒有預設值，所以讀一個你從沒指派過的 tag 會拋錯、不是回空值。`If IsElement(total("Sales")) Then …`。
- 用 [`ForAll`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_FORALL_STATEMENT.html) 走訪；迴圈裡 `ListTag(v)` 給你當前元素的 key，而 `v` 是它的值。
- 用 `Erase total("Sales")` 移除一個元素，或用 `Erase total` 清掉整個 List。
- 雷：tag 是否大小寫敏感，跟隨模組的 `Option Compare`，所以 `"AB"` 與 `"ab"` 可能是同一個 key、也可能不是 —— 自己把 key 正規化、別靠它。

## 整個型別用一個例子講完

依分類計數是經典案例，它一次展示每一個操作：

```lotusscript
Dim total List As Long

Forall doc In col.Documents
    Dim cat As String
    cat = doc.Category(0)
    If IsElement(total(cat)) Then
        total(cat) = total(cat) + 1     ' key 存在 —— 加一
    Else
        total(cat) = 1                  ' 第一次 —— 指派就建立 key
    End If
End Forall

Forall n In total
    Print ListTag(n) & ": " & n         ' ListTag = key，n = 值
End Forall
```

這就是 List 的全部。鍵值寫入會建立或更新；`IsElement` 測存在；`ForAll` 走它、`ListTag` 取回 key。沒有 `count`、沒有 `sort`、沒有 `keys()` 集合 —— List 刻意做得極簡 —— 但對「每個 key 累積點東西」這件事，它把一整塊平行陣列的簿記換成四行，而且鍵值存取不會像線性陣列掃描那樣、隨 key 數變多而變慢。

## 它在哪裡值回票價

有三種形狀一直出現，全都塌縮成一個 List：

- **一個「seen」集合** —— 用 `seen(key) = True` 去重、用 `IsElement(seen(key))` 測試；值無所謂，key 才是重點。
- **一個計數器／分組器** —— 上面那個例子，每個 key 一個累計。
- **一個查表** —— 把代碼清單一次讀進 `label(code) = text`，之後在迴圈裡從記憶體解、而不是反覆打 view（跟快取 `@DbLookup` 同一個直覺，只是由你掌控）。

任何時候你發現自己在對一個陣列寫「這個 key 是不是已經存在」，那就是一個 List。

## 那兩個雷

**讀取沒有預設值。** 這會絆倒從 JavaScript 物件或 Notes item 過來的人，那裡缺的東西讀起來是空的。一個從沒指派過的 List tag 不是空的 —— 它是不存在，而為了讀去引用它是一個 runtime 錯誤。所以那個 `IsElement` 檢查不是可有可無的禮貌；它是讓讀取不拋錯的守衛。先寫再讀是安全的；先讀再寫需要 `IsElement`。

**tag 的大小寫敏感是一個模組設定、不是固定規則。** 文件講得很白：「List tag 可以大小寫敏感或不敏感，取決於該 tag 所在模組的大小寫敏感設定」，而 `Option Compare` 是那個決定者。所以 `total("AB")` 與 `total("ab")` 在一個模組裡是兩個 key、在另一個模組裡是同一個 —— 當你在 `Option Compare` 設定不同的 script library 之間貼程式時，這是一顆可攜性地雷。安全的習慣是自己把 key 正規化（`LCase(cat)`），讓 List 的行為不依賴三個畫面以上的一行指示詞。

## 同類別在其他語言

這裡沒有 Domino 類別 —— List 是語言特性，所以 `relatedJava` 與 `relatedSsjs` 是空的。但這個*概念*是整個系列裡最可攜的東西：List 正是 Java 叫 `HashMap`、SSJS／JavaScript 叫一個純物件或 `Map` 的東西。如果你要把鍵值集合的邏輯搬出 LotusScript，你要找的不是一個 Notes 類別 —— 是目標語言內建的 map，它有 List 刻意沒有的更豐富 API（一個大小、一個 key 集合、順序）。反過來走，這篇真正要講的是那個教訓：在你用平行陣列於 LotusScript 裡拼一個雜湊表之前，記得這個語言已經有一個了。
