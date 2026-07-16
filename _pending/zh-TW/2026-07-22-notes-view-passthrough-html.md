---
title: "你的 Domino view 表頭為什麼永遠歪一格：passthrough HTML 黑魔法考古"
description: "接手一個老 classic-web Domino view，你常會發現直欄標題整體往右偏一格 —— 而且沒人知道為什麼。一篇實測報告，挖出藏在二十年前 view 設計裡的 passthrough HTML 把戲：直欄值與標題裡的方括號 HTML、間隔欄、每列 checkbox，以及真正的元兇 —— 一個故意不閉合的 <input 標籤吞掉 </td><td> 欄界線、把兩個直欄合併成一格，讓它之後的每個表頭都往右偏。"
pubDate: 2026-07-22T07:30:00+08:00
lang: zh-TW
slug: notes-view-passthrough-html
tags:
  - "Formula"
  - "Domino Designer"
  - "Tutorial"
sources:
  - title: "URL commands for opening servers, databases, and views — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
  - title: "OpenView @Command (Formula Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENVIEW.html"
  - title: "Attribute value (double-quoted) state — HTML Standard (WHATWG) tokenization"
    url: "https://html.spec.whatwg.org/multipage/parsing.html#attribute-value-(double-quoted)-state"
relatedJava: []
relatedSsjs: []
---

你接手一個二十年的 Domino 應用。在瀏覽器裡打開它的某個 view —— 那種老 [`?OpenView`](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) classic-web 的 —— 直欄標題有點微妙地不對：每個標題都坐在它所標示的資料往右一格的位置。它這樣好幾年了；最近三個碰過它的人都聳聳肩走人。沒人知道為什麼，也沒人想當那個「修好它」卻弄壞別的東西的人。

成因是一個任何手冊都沒寫的 passthrough HTML 把戲，而一旦你看得見它，那個歪一格的表頭就顯而易見。這是一篇關於老 classic-web view 在玩什麼黑魔法的實測報告 —— 測於 Domino 12.x、Chrome/Edge、classic `?OpenView` 渲染（這些都不適用於 XPages 或 REST API，它們渲染 view 的方式完全不同）。所有範例用去識別化的 `myview.nsf` / `VwDemo`。

---

## 重點摘要

- Domino 把 view **直欄值或直欄標題公式**裡的 `[...]` 當原始 HTML 輸出 —— 這就是 passthrough HTML。它是 classic view 不靠 template 就能塞 checkbox、顏色、版面的方式。
- 常見用法：整個值是 `"[<td></td>]"` 的**間隔欄**、由 `$$SelectDoc` 建的**每列 checkbox**、以及放在直欄*標題*裡的**全選 checkbox**。
- **弄歪表頭的把戲：** 一個老 checkbox 欄讓 `value` 屬性的**引號沒關**（連帶標籤的 `>` 也沒寫）。瀏覽器的 tokenizer 於是進入「雙引號屬性值」狀態，在這個狀態下 `>` *只是普通字元* —— 所以它把 Domino 自己的 `</td><td>` 欄界線（連 `>` 一起）吞掉，直到*下一個 `"`*（在下一欄裡）才停。兩個直欄塌成一格。
- **副作用：** 表頭列仍然每欄各輸出一個 `<td>`，所以它現在比合併後的資料列多一格 —— 而從合併點以後的每個表頭都往右偏一欄。這就是你的「表頭歪一格」。
- **判讀：** 資料列格數 ≠ 表頭格數，幾乎就是 passthrough 在動手腳；DevTools 裡像 `2"=""` 或 `face="新細明體"` 這種垃圾屬性，是被吞掉的下一欄殘骸。

## Passthrough HTML 基礎

在 classic web view 裡，Domino 把每個直欄渲染成一個 HTML 表格儲存格。如果一個直欄的*值公式*產生用方括號包起來的文字，Domino 會把方括號內容當字面 HTML 輸出、而不是跳脫它。直欄的靜態*標題*也一樣。這一個行為就是底下每個把戲的引擎。

三個你會一直看到的：

```
間隔欄（整個直欄值）：   "[<td></td>]"
每列 checkbox（直欄值）： "[<input type=\"checkbox\" name=\"$$SelectDoc\" value=\"" + @Text(@DocumentUniqueID) + "\">]"
全選 checkbox（直欄標題）：[<input type="checkbox" name="AllCheck" onclick="SCheck()">]
```

間隔欄塞一個空 `<td>` 來擠出欄距。每列 checkbox 用特殊的 `$$SelectDoc` 欄位名，讓 classic Domino 把它接進文件選取。全選放在直欄*標題*裡，所以它在表頭渲染一次。這三個都是合法、有文件的 passthrough。麻煩從「用 passthrough 去做 parser 本來不該允許的事」開始。

## 吞掉欄界線的不閉合引號

這是同一個 checkbox 欄、用老方式寫的 —— 仔細看最後面：

```
老「合併」版：   "[<input type=\"checkbox\" name=\"$$SelectDoc\" value=\"" + @Text(@DocumentUniqueID) + "]"
修復「獨立」版： "[<input type=\"checkbox\" name=\"$$SelectDoc\" value=\"" + @Text(@DocumentUniqueID) + "\">]"
```

老版本從沒關掉 `value` 屬性的引號 —— 於是標籤也沒關。修復版把缺的 `">` 補回去。那一個引號是承重的，而原因比「標籤沒閉合」更微妙。Domino 把每個直欄值包在一個 `<font>` 裡、並輸出自己的儲存格界線，所以 checkbox 格與下一個（主旨）格渲染出的 markup 長這樣：

```html
<td><font ...><input type="checkbox" name="$$SelectDoc" value="ABC123</font></td><td><font size="2" face="新細明體">Subject text</font></td>
```

`value="` 開了一個雙引號屬性值、卻從沒拿到它的結尾 `"`。於是瀏覽器的 tokenizer 現在在**[雙引號屬性值狀態](https://html.spec.whatwg.org/multipage/parsing.html#attribute-value-(double-quoted)-state)**，而這個狀態的關鍵事實是：`>` *只是普通字元* —— 它**不會**結束標籤。tokenizer 一路吞下去、連 `>` 一起，直到找到**下一個 `"`** —— 那個 `"` 遠在下一欄、在 `size="2"` 裡。中間的一切 —— `</font></td><td><font size=` —— 全被拉進那個失控的屬性值，連儲存格界線一起。

這是很容易寫錯的細節：它**不是**「吃到下一個 `>`」。界線 markup `</font></td><td>` 裡到處是 `>`，但它們照樣被吃掉 —— 正是因為在引號值裡 `>` 是惰性的。value 在一個 `"` 結束、絕不在 `>`。

`size="` 關掉失控 value 之後剩下的 —— `2" face="新細明體">` —— tokenizer 把它當成 `<input>` 的垃圾屬性：`2"` 變成一個屬性（DevTools 裡看到的 `2"=""`）、`face="新細明體"` 變成另一個，而 input 標籤*終於*在那個 `<font>` 的 `>` 收尾。在這種頁面上打開 DevTools，就是這樣：一個 `<input>` 帶著 `2"=""` 與 `face="新細明體"`。那些垃圾屬性就是上游有不閉合 value 引號的*指紋*。

看得見的結果：checkbox 和主旨最後落在**同一格**，因為它們之間的 `</td><td>` 界線被吃了。兩個直欄渲染成一個。

## 為什麼表頭最後會歪一格

現在那個歪一格自己就掉出來了。**表頭列是分開產生的** —— Domino 為標題每欄輸出一個 `<td>`，而那些標題格沒有一個帶著失控的引號。所以表頭列有它完整、正確的格數，而每個*資料*列少一格（兩欄合併成一）。從合併點往右，每個標題現在坐在*下一欄*的資料上方。表頭不是被某個 CSS bug「弄歪」的 —— 它字面上就比它所標示的列多一格。

那個不對稱也正是解法。關掉 value 引號與標籤 —— 上面「獨立」版的 `">` —— 兩欄就再度分開；資料列拿回它們缺的那格，表頭自己就對齊了 —— 不需要改 CSS。唯一要小心的：有些老頁面有 JavaScript *依賴*那個合併結構（用索引走 sibling 儲存格），所以補上標籤前先檢查任何選取或列高亮腳本。

## 判讀 checklist

當一個 classic view 看起來結構不對，把這張清單走一遍：

- **數格數。** 資料列 `<td>` 數 ≠ 表頭列 `<td>` 數 → passthrough 在某處合併或塞格。這一個檢查就抓到大部分。
- **找垃圾屬性。** 在 DevTools 裡，一個元素帶著 `2"=""`、`face="..."`、或游離的 `</td` 片段這種屬性，代表**上游有不閉合的 value 引號**吃了下一欄的 markup。
- **分清結構 vs 狀態。** 分類列的儲存格有真正的 `colspan`；那是結構。但 `TR0_Out` / `TR1_Out` 這種 class 是滑鼠事件 JavaScript 換上去的列狀態 —— 它們不是固定的列型別，所以別寫假設它們是的 CSS 選擇器。

## 適用範圍與注意

這是 classic-web（[`?OpenView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENVIEW.html)）的地盤。XPages 與 Domino REST API 產 markup 的方式完全不同，這些 passthrough 行為 —— 以及它的失效模式 —— 在那裡都不適用。parser 行為本身是瀏覽器標準（引號屬性值吞掉一切、連 `>` 一起，直到下一個 `"`，就是 HTML tokenization 的運作方式），所以它在任何現代瀏覽器都會重現；這裡的測試是在 Chrome/Edge、對 Domino 12.x。如果你在維護這種老 view，一旦知道那個歪一格的表頭只是少了個 `>`，就幾乎不值得繼續忍它 —— 但補回去之前先讀那頁的 JavaScript。
