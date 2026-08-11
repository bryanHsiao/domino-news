---
title: "LotusScript 沒有 removeElementAt：從陣列、List、多值欄位刪一個元素"
description: "在 SSJS/XPages 裡刪一個多值元素很順——java.util.Vector 有 removeElementAt，倒著跑迴圈依 index 刪就好。搬到 LotusScript 卻卡住：沒有 Vector、沒有 removeElementAt，而 Erase 對陣列是「整個清空」不是「刪一個」。這篇拆解 LS 的實際選項——先分清你的集合是什麼，再用 Split/Join、陣列重建、List 的 Erase(tag)、或 Evaluate + @Replace。"
pubDate: 2026-08-11T07:30:00+08:00
lang: zh-TW
slug: lotusscript-remove-element
tags:
  - "LotusScript"
sources:
  - title: "Split function (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_SPLIT.html"
  - title: "Erase statement (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ERASE_STATEMENT.html"
  - title: "Working with lists (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html"
  - title: "Using the Evaluate statement — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html"
relatedJava: []
relatedSsjs: []
---

在 SSJS / XPages 裡刪一個多值元素，你大概會這樣寫：`@Explode` 把字串拆成陣列，倒著跑迴圈，`wordValue.removeElementAt(parseInt(idx))` 依 index 一個個刪。乾淨俐落，因為 SSJS 底層是 Java，`wordValue` 其實是個 `java.util.Vector`，`removeElementAt` 是它現成的方法。

同一段邏輯搬到 LotusScript 就卡住了：LS **沒有 Vector、沒有 `removeElementAt`**，而你直覺想用的 `Erase`，對陣列是「整個清空」不是「刪掉一個」。所以「從集合刪一個元素」在 LS 沒有一步到位的答案，取決於你手上的「集合」到底是什麼。

這篇把 LS 的實際選項攤開。

---

## 重點摘要

- **LS 沒有 `removeElementAt`。** 那是 `java.util.Vector` 的方法，SSJS 能用是因為底層是 Java；LS 沒有 Vector。
- **先分清你的集合是什麼**：分隔字串、動態陣列、`List`、還是多值欄位——每種的刪法不同。
- **字串 ↔ 陣列**：`Split`（= `@Explode`）、`Join`（= `@Implode`），都是 LS 原生（R6 起）。
- **陣列刪一個：沒有內建。** 官方講明 `Erase` 對動態陣列是「移除**所有**元素、回收儲存」——是整個清空。要刪某個 index，只能**重建到新陣列**（跳過那個 index）。`ReDim Preserve` 只能改最後一維的上界，不能挖掉中間。
- **`List` 才有「刪一個」**：`Erase 清單(tag)` 依**鍵值**刪掉單一元素。這是 LS 最接近「有 remove 的集合」的東西——但它是依 key、不是依 index。
- **多值欄位**：抓 `item.Values`（Variant 陣列）重建後 `ReplaceItemValue` 寫回；或用 `Evaluate` 跑 `@Replace`/`@Trim` 一行刪值。

---

## 先分清「集合」是什麼

SSJS 那段之所以順，是因為 `wordValue` 是**一種**東西：一個有序、可依 index 增刪的 `Vector`。LS 沒有這個統一的容器，取而代之的是幾種不同的東西，各有各的刪法。動手前先問自己手上是哪一種：

- 一個逗號分隔的**字串**？→ 先 `Split` 成陣列。
- 一個**動態陣列**？→ 沒有刪一個的方法，得重建。
- 一個 **`List`**（關聯集合）？→ `Erase 清單(tag)` 依 key 刪。
- 一個**多值欄位**的值？→ 抓 `item.Values` 重建，或走 `Evaluate`。

## Split / Join：@Explode 與 @Implode 的原生對應

你 SSJS 用的 `@Explode`，LS 有原生對應：[`Split`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_SPLIT.html)——官方定義「Returns an Array of Strings that are the substrings of the specified String」，R6 起內建。反向的 `Join` 則等於 `@Implode`。所以「逗號字串 → 處理 → 逗號字串」在 LS 就是 `Split` 進、`Join` 出，中間對陣列動手腳。

```lotusscript
Dim arr As Variant
arr = Split("Apple,Banana,Cherry", ",")   ' = @Explode
' ...對 arr 動手腳...
Dim s As String
s = Join(arr, ",")                          ' = @Implode
```

## 陣列：為什麼沒有 removeElementAt

這是最反直覺的一點。你可能想用 `Erase`——但 [`Erase`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ERASE_STATEMENT.html) 對動態陣列的行為是「移除**所有**元素、回收儲存」，也就是把整個陣列清空，不是刪掉某一個。而 `ReDim Preserve` 只能改**最後一維的上界**——你能把陣列變短，但沒辦法「挖掉中間第 3 個、其餘往前補」。

所以 LS 刪陣列某個 index 的標準做法是**重建**：跑一遍、把「不要刪的」複製到新陣列。

```lotusscript
Dim src As Variant, temp() As String
Dim i As Integer, n As Integer, removeIdx As Integer
src = Split("Apple,Banana,Cherry,Date", ",")
removeIdx = 1                               ' 要刪 "Banana"
ReDim temp(0 To UBound(src))
n = 0
For i = 0 To UBound(src)
    If i <> removeIdx Then
        temp(n) = CStr(src(i))
        n = n + 1
    End If
Next
If n > 0 Then ReDim Preserve temp(0 To n - 1) Else Erase temp
' temp = ["Apple", "Cherry", "Date"]
```

順帶一提：SSJS 那段要「倒著跑」是因為 `removeElementAt` 邊刪邊改動 index，順著刪會跳號。LS 用重建法就**沒這個問題**——你是複製到新陣列，原陣列的 index 從頭到尾不變，要刪多個 index 也只要一個「這個 index 在不在刪除集合裡」的判斷，不必倒著跑。

## List：唯一內建「刪一個」的集合

如果你不是非得用「整數 index」不可，[`List`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html) 是 LS 裡唯一有「刪單一元素」的內建集合。官方原文：「`Erase listName(listTag)` removes the individual element identified by listTag from the list」，依**鍵值（tag）**刪掉一個、其餘不動。

```lotusscript
Dim fruit List As String
fruit("a") = "Apple"
fruit("b") = "Banana"
fruit("c") = "Cherry"

If IsElement(fruit("b")) Then Erase fruit("b")   ' 只刪 Banana；先 IsElement 守著
```

關鍵差異：`List` 是依 **key** 刪，不是依 **index**——這跟 SSJS 的 `removeElementAt(整數)` 不一樣。如果你的資料本來就有天然的鍵（代碼、UNID、名字），`List` 遠比陣列重建優雅；如果你就是需要「第 N 個」這種位置語意，那還是回到陣列重建。（`List` 的完整用法見 [LotusScript List 專篇](/domino-news/posts/lotusscript-list-datatype)。）

## 多值欄位：Values 重建，或 Evaluate 一行

如果那個「集合」其實是一份文件的**多值欄位**，有兩條路：

1. **抓值重建**：`item.Values` 回傳一個 Variant 陣列（注意：即使只有一個值，它也永遠是陣列），用上面的重建法處理完，再 `ReplaceItemValue` 寫回。
2. **`Evaluate` 一行**：把 `@Replace` / `@Trim` 當公式丟給 [`Evaluate`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html)，一行就把某些值從多值清單裡拿掉——程式碼最少。細節見 [LotusScript Evaluate 專篇](/domino-news/posts/lotusscript-evaluate)。

```lotusscript
' 從多值欄位 Categories 移除所有等於 "Obsolete" 的值
Dim s As New NotesSession
Dim result As Variant
result = Evaluate(|@Trim(@Replace(Categories; "Obsolete"; ""))|, doc)
Call doc.ReplaceItemValue("Categories", result)
```

## 把你那段 SSJS 翻成 LS

回到你的情境——一個逗號分隔的 index 清單、要從一個多值集合裡把這些位置刪掉。SSJS 用 Vector 倒著 `removeElementAt`；LS 的等價寫法是「重建、跳過要刪的 index」：

```lotusscript
Dim wordValue As Variant, deleteArr As Variant, kept() As String
Dim i As Integer, j As Integer, n As Integer, drop As Boolean
' wordValue：原本的多值；deleteValue：要刪的 index，逗號分隔
deleteArr = Split(deleteValue, ",")
ReDim kept(0 To UBound(wordValue))
n = 0
For i = 0 To UBound(wordValue)
    drop = False
    For j = 0 To UBound(deleteArr)
        If i = CInt(deleteArr(j)) Then drop = True : Exit For
    Next
    If Not drop Then kept(n) = CStr(wordValue(i)) : n = n + 1
Next
If n > 0 Then ReDim Preserve kept(0 To n - 1) Else Erase kept
```

同樣一件事，SSJS 靠 Vector 現成的 `removeElementAt`，LS 靠重建——多幾行，但邏輯更透明（原 index 全程不變）。

## 同類別在其他語言

| 語言 | 從集合刪一個元素 |
|---|---|
| **SSJS / XPages** | 直接用 `java.util.Vector` 的 `removeElementAt(index)` / `removeElement(value)`——底層是 Java，有現成的有序容器 |
| **LotusScript** | 沒有 Vector 也沒有 `removeElementAt`；依情境用 `List` 的 `Erase(tag)`（依 key）、陣列重建（依 index）、或 `Evaluate` + `@Replace`（多值欄位） |

SSJS 端「直接用 `java.util.Vector` 操作多值」有[對照的專篇](/domino-news/posts/ssjs-vector-multivalue)（XPages 裡怎麼把多值欄位接上 Vector 的完整 API）。核心對照就是這張表：**SSJS 借的是 Java 的容器、LS 用的是自己的一套**。想看這些類別彼此怎麼串，可參考站上的[類別地圖](/domino-news/map)。
