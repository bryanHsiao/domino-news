---
title: "XPages/SSJS：直接用 java.util.Vector 操作多值欄位"
description: "LotusScript 沒有 removeElementAt、刪一個多值元素得重建陣列；SSJS 剛好相反——它跑在 Java 上，多值欄位讀進來就是一個 java.util.Vector，addElement／removeElementAt／insertElementAt 整套 API 現成可用，改完用 replaceItemValue 寫回。這篇拆解怎麼用 Vector 操作多值、倒著刪的原理、以及兩個一定會踩的雷（空欄位的 [\"\"]、getValue 的型別）。"
pubDate: 2026-08-12T07:30:00+08:00
lang: zh-TW
slug: ssjs-vector-multivalue
tags:
  - "SSJS"
sources:
  - title: "Document (NotesDocument - JavaScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document.html"
  - title: "java.util.Vector — Java Platform SE 8 API"
    url: "https://docs.oracle.com/javase/8/docs/api/java/util/Vector.html"
  - title: "Global functions (XPages SSJS) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html"
relatedJava: []
relatedSsjs: []
---

前一篇講 [LotusScript 沒有 removeElementAt](/domino-news/posts/lotusscript-remove-element)——刪一個多值元素得自己重建陣列，因為 LS 沒有 Vector。SSJS 剛好是它的反面：**你有一整套 Vector API 現成可用**。

原因就一句話：SSJS 跑在 XPages 的 Java runtime 上，能直接 new、直接用任何 Java 類別。而多值欄位在 SSJS 讀進來，本來就是一個 `java.util.Vector`，不必轉、不必包，`removeElementAt`、`addElement`、`insertElementAt` 這些方法立刻可用，改完用 `replaceItemValue` 寫回。你那段截圖(`@Explode` 拆字串、倒著 `removeElementAt`)就是這個模式。

這篇拆解怎麼用 Vector 操作多值，以及兩個一定會踩的雷。

---

## 重點摘要

- **SSJS 能直接用 Java 類別。** `java.util.Vector` 是「growable array of objects」，整套 API 對 SSJS 開放。
- **多值欄位讀進來就是 Vector**：`getItemValue` 回一個 `java.util.Vector`，不用轉換。
- **操作**：`addElement` / `removeElement`(依值)/ `removeElementAt`(依 index)/ `insertElementAt` / `setElementAt` / `contains` / `indexOf` / `size` / `isEmpty`——[完整 API](https://docs.oracle.com/javase/8/docs/api/java/util/Vector.html) 都在。
- **寫回**：`replaceItemValue` 直接接受 `java.util.Vector`——這是把多值寫回文件最可靠的方式。
- **`removeElementAt` 要倒著跑**：邊刪邊改 index，順著跑會跳號;倒著跑(`i = size()-1; i>=0; i--`)才安全。或用 `java.util.Iterator` 的 `remove()`。
- **兩個雷**：① 空的多值欄位常常不是 size 0，而是 size 1、裡面一個空字串 `[""]`;② [`getComponent().getValue()`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) 的型別依控制而定(inputText 是 String、多選 listBox 是 Vector/Array),操作前先驗型別。

---

## 為什麼 SSJS 有、LS 沒有

差別的根源，就是[前一篇](/domino-news/posts/lotusscript-remove-element)反過來講的那件事：**SSJS 跑在 Java 上，LS 不是。** LS 只有自己那套 List/陣列，沒有 Vector、沒有 `removeElementAt`;SSJS 則能直接碰整個 Java 標準函式庫，`java.util.Vector`、`java.util.Iterator`、`java.util.List` 全都能用。同一件「刪一個多值元素」，LS 得重建、SSJS 一個方法搞定。

## 讀進來就是 Vector

多值欄位在 SSJS 讀出來，型別就是 `java.util.Vector`——這是最順的起點，不必自己拆字串或轉陣列：

```javascript
var doc:NotesDocument = currentDocument.getDocument();
var roles = doc.getItemValue("UserRoles");   // 回 java.util.Vector
```

`getItemValue` 掛在 SSJS 的 [NotesDocument](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document.html) 上;拿到的 Vector 就能直接動手。

## Vector 的整套 API

`java.util.Vector` 官方定義是「a growable array of objects」，它的[方法](https://docs.oracle.com/javase/8/docs/api/java/util/Vector.html)正是 LS 缺的那些：

| 方法 | 作用 |
|---|---|
| `addElement(obj)` | 加到尾端 |
| `insertElementAt(obj, i)` | 插到第 i 個 |
| `removeElement(obj)` | 依**值**刪第一個相符 |
| `removeElementAt(i)` | 依 **index** 刪 |
| `setElementAt(obj, i)` | 取代第 i 個 |
| `elementAt(i)` / `indexOf(obj)` / `contains(obj)` | 取值 / 找位置 / 是否存在 |
| `size()` / `isEmpty()` | 個數 / 是否空 |

`removeElementAt`——LS 沒有、你截圖用的那個——在這裡是現成的。

## removeElementAt 為什麼要倒著跑

這是你截圖裡的關鍵。`removeElementAt(i)` 刪掉一個後，Vector 會動態縮短，**後面的元素全部往前移一格**。所以如果你順著跑 `for (i=0; i<size(); i++)`、刪掉 index 0，原本 index 1 的元素移到 index 0;下一圈 `i=1` 時，你看的是原本的 index 2，把原本的 index 1 跳過了。

倒著跑就沒這問題:`for (i = vec.size()-1; i >= 0; i--)`——你刪的是尾端、往前移的都是「已經處理過」的元素，不會漏也不會 `ArrayIndexOutOfBounds`。

```javascript
for (var i = roles.size() - 1; i >= 0; i--) {
    if (roles.elementAt(i).startsWith("Legacy_")) {
        roles.removeElementAt(i);   // 倒著刪，安全
    }
}
```

另一條路是用 `java.util.Iterator` 的 `remove()`(走訪中安全移除)，或對 `java.util.List` 用 `removeAll(要刪的集合)` 一次刪掉一批。

## 寫回：replaceItemValue 吃 Vector

改完的 Vector 直接丟回 [`replaceItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document.html)——官方定義「replaces all items of the specified name with one new item, which is assigned the specified value」，而它直接接受 `java.util.Vector`,是把多值寫回最可靠的方式:

```javascript
doc.replaceItemValue("UserRoles", roles);
doc.save(true, false);
```

## 兩個一定會踩的雷

- **空多值欄位不是 size 0**：一個新建或清空過的多值欄位，讀回來常常是 **size 1、裡面一個空字串 `[""]`**，不是空的 Vector。直接 `for` 一跑會多處理一筆空白、或寫回一行空值。處理前先判斷:`if (v.size()==1 && v.elementAt(0).equals("")) v.removeElementAt(0);`
- **`getComponent().getValue()` 型別不固定**：[`getComponent`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) 拿到的是 UI **元件**本身，要再對它 `.getValue()` 取值；而值的型別**依控制而定**——`<xp:inputText>` 回 String，多選的 `<xp:listBox multiple="true">` / `checkBoxGroup` 回 Array 或 Vector。動手前先 `typeof` / `instanceof` 驗過，否則對 String 呼叫 `removeElementAt` 就爆了。

## 逐行看你那段截圖

```javascript
var DeleteValue = getComponent("DeleteValue").getValue();   // 拿控制的值(先確認型別)
if (DeleteValue != "" && DeleteValue != null) {
    var DeleteValuearr = @Explode(DeleteValue, ",");        // 拆成要刪的 index 清單
    for (var i = (DeleteValuearr.length - 1); i >= 0; i-- ) {  // 倒著跑
        wordValue.removeElementAt(parseInt(DeleteValuearr[i]));  // 依 index 刪、parseInt 轉整數
    }
}
```

寫得沒問題:先確認值非空，`@Explode` 出要刪的 index，**倒著跑**避免 index 位移，`parseInt` 把字串轉成整數 index 再 `removeElementAt`。唯一要留意的還是上面那兩個雷——`wordValue` 若可能是空欄位或非 Vector，前面補個型別/空值判斷更穩。

## 同類別在其他語言

| 語言 | 從多值刪一個元素 |
|---|---|
| **SSJS / XPages** | 直接用 `java.util.Vector` 的 `removeElementAt` / `removeElement`——多值欄位讀進來就是 Vector，改完 `replaceItemValue` 寫回 |
| **LotusScript** | 沒有 Vector；依情境重建陣列、或用 `List` 的 `Erase(tag)`——見 [LS 沒有 removeElementAt 那篇](/domino-news/posts/lotusscript-remove-element) |
| **Java（`lotus.domino`）** | 同樣能用 `java.util.Vector`;`Document.getItemValue()` 在 Java 端一樣回 Vector |

一句話對照:**SSJS 借的是 Java 現成的容器,LS 用的是自己那套**。同一個 `removeElementAt`,在 SSJS 是一行、在 LS 要一個重建迴圈。想看這些類別彼此怎麼串,可參考站上的[類別地圖](/domino-news/map)。
