---
title: "LotusScript 的 List：內建的雜湊表，卻人人用平行陣列重造一遍"
description: "你要依分類統計文件、把一串名字去重、或建一張「代碼→標籤」對照表，好不用每次都開 view。Domino 開發者的直覺是兩條平行陣列加線性掃描，或臨時開個 view——但 LotusScript 老早就內建一個鍵值集合、卻幾乎沒人用：List。這篇實測筆記講它的鍵值存取、ForAll + ListTag 走訪、Erase，以及兩個雷：讀取要用 IsElement 守著、tag 大小寫跟著 Option Compare 跑。"
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
cover: "/covers/lotusscript-list-datatype.webp"
coverStyle: "photoreal-3d"
---

你要依分類統計文件筆數；或把一串名字去重；或建一張「代碼 → 標籤」對照表，好讓你解一個代碼時不必每次都去開一個 view。這種需求，Domino 開發者的直覺通常是兩條平行陣列加一段線性掃描（`For i = 0 To UBound(keys)` 一路比對，滿了還得 `Redim Preserve`），再不然就臨時開一個分類 view 讀回來。兩種都能動——但兩種其實都在重造一個 LotusScript 老早就內建、卻幾乎沒人用的東西：**List**。

[List](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html) 就是 LotusScript 原生的關聯陣列——你要叫它鍵值集合、字典、還是雜湊表（hashmap）都行，看你從哪個語言過來。這篇是它的簡短實測筆記：怎麼用、哪兩個操作讓它真的好用、以及一旦上手會踩到的兩個雷。

---

## 重點摘要

- 宣告用 `List`：`Dim total List As Long`。用字串 key 指派：`total("Sales") = 10`——指派一個沒出現過的 key，就等於建立它。
- 讀取前先用 [`IsElement`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ISELEMENT_FUNCTION.html) 守著：List 沒有預設值，讀一個從沒指派過的 tag 會直接拋錯，不是回空值。`If IsElement(total("Sales")) Then …`。
- 走訪用 [`ForAll`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_FORALL_STATEMENT.html)：迴圈裡 `ListTag(v)` 給你當前元素的 key，`v` 則是它的值。
- 移除用 `Erase total("Sales")` 刪掉單一元素，或 `Erase total` 整個清空。
- 雷：tag 分不分大小寫，是跟著模組的 `Option Compare` 走的，所以 `"AB"` 和 `"ab"` 可能是同一個 key、也可能不是——保險做法是自己先把 key 正規化，別依賴它。

## 整個型別用一個例子講完

依分類計數是最經典的例子，一次就把每個操作都用到了：

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

List 大概就這些了。鍵值寫入會建立或更新；`IsElement` 測存不存在；`ForAll` 走一遍、`ListTag` 取回 key。它沒有 `count`、沒有 `sort`、也沒有 `keys()`——刻意做得很精簡——但光是「每個 key 累積點東西」這件事，它就能把原本一長串平行陣列的瑣碎記帳換成四行；而且鍵值存取是直接定位，不像線性掃描會隨 key 變多而愈跑愈慢。

## 它在哪裡值回票價

有三種情境反覆出現，而且全都可以收斂成一個 List：

- **去重用的「seen」集合**：`seen(key) = True` 做標記、`IsElement(seen(key))` 判斷有沒有見過；值是什麼不重要，重點在 key。
- **計數器／分組器**：就是上面那個例子，每個 key 一個累計值。
- **對照表**：把一份代碼清單一次讀進 `label(code) = text`，之後在迴圈裡直接從記憶體查，不必反覆開 view（跟「把 `@DbLookup` 結果快取起來」是同一個直覺，只是這回由你自己掌控）。

只要你發現自己在對一個陣列反覆問「這個 key 是不是已經有了」，那就是該用 List 的時候。

## 那兩個雷

**讀取沒有預設值。** 從 JavaScript 物件、或 Notes item 過來的人最容易在這裡跌倒——那些地方讀一個不存在的東西，拿到的是空值。但 List 不是：一個從沒指派過的 tag 不是「空的」，而是「根本不存在」，你去讀它就會是一個 runtime 錯誤。所以前面那個 `IsElement` 不是可有可無的禮貌，而是讓讀取不爆掉的守門員。規則很簡單：先寫再讀，安全；先讀再寫，一定要先 `IsElement`。

**tag 分不分大小寫，是模組設定、不是固定規則。** 官方文件講得很白：「List tag 可以大小寫敏感、也可以不敏感，取決於該 tag 所在模組的設定」，而拍板的就是 `Option Compare`。所以 `total("AB")` 和 `total("ab")`，在某個模組裡是兩個 key、在另一個模組裡卻是同一個——當你在 `Option Compare` 設定不同的 script library 之間複製貼上程式時，這就是一顆可攜性地雷。保險的習慣是自己先把 key 正規化（例如 `LCase(cat)`），別讓 List 的行為，取決於檔案開頭那一行、要往上捲三個畫面才看得到的設定。

## 同類別在其他語言

這裡沒有對應的 Domino 類別——List 是語言內建的特性，所以 `relatedJava` 和 `relatedSsjs` 都留空。但這個*概念*大概是整個系列裡最能跨語言帶著走的：List 就是 Java 的 `HashMap`、SSJS／JavaScript 的純物件或 `Map`。如果你想把「鍵值集合」的邏輯搬出 LotusScript，要找的不是某個 Notes 類別，而是目標語言內建的 map——那些 map 還多了 List 刻意沒給的 API（大小、key 集合、順序）。反過來說，這篇真正想講的其實就一句：在你打算用平行陣列在 LotusScript 裡手刻一個雜湊表之前，先想起來——這語言早就內建一個了。
