---
title: "XPages 多欄位分類、下一欄還是分類時文件不顯示——12.0.2 的 regression 與 DISABLE_REFIND_IN_READENTRIES"
description: "一個 XPages 視圖分類在多個欄位上，你套上篩選、而下一欄還是分類時，畫面只出現分類、底下的文件卻不見了——12.0.2 才這樣，12.0.1 是正常的。這是 HCL 官方認的 regression（KB0102504 / SPR# MNIACMGKUV），是 12.0.2 修另一個 bug（SPR# PJONB7GRUL）時引入的。暫解是在伺服端 notes.ini 加 DISABLE_REFIND_IN_READENTRIES=1，正解是升到 12.0.2 FP3 或 14.0。這篇講症狀、為什麼會這樣、暫解與正解，以及 12.0.2 一整組同家族的分類視圖 regression（像官方 KB0102042 的 @PickList 變體，參數與修復版本都不同）該怎麼對症下參數。"
pubDate: 2026-10-06T07:30:00+08:00
lang: zh-TW
slug: xpages-multi-column-category-document
tags:
  - "XPages"
  - "Admin"
sources:
  - title: "XPages: Unable to get document when filtering a multi-column category and the next column is a category（KB0102504）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504"
  - title: "When using Picklist dialog in a view with categories and subcategories, topmost layer only showing（KB0102042，同家族、@PickList 變體、EnableExtendedFindByKey=0）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042"
  - title: "URL commands for opening servers, databases, and views（?ReadViewEntries）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
  - title: "Categorised view problem in Domino Nomad Web 1.07（相似變體、同參數無效）— FoCul"
    url: "https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/"
relatedJava: []
relatedSsjs: []
cover: "/covers/xpages-multi-column-category-document.webp"
coverStyle: "photoreal-3d"
---

你有一個 XPages 視圖,分類(categorize)在**多個欄位**上。你套上篩選,而篩到的**下一欄仍然是分類**(還沒到文件那層)時——畫面只出現分類名稱,**底下的文件卻不見了**。同一份設計在 **12.0.1** 是好的,升到 **12.0.2** 就這樣。

這不是你的 code 寫錯,是 HCL 官方認的 regression。有一個 notes.ini 暫解,但它是「把某個內部行為關掉」的那種參數——知道它在關什麼、以及正解是什麼,才不會讓它在 notes.ini 長住。

---

## 重點摘要

- **症狀**(官方 [KB0102504](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504)):XPages 視圖分類在多欄位、篩選後**下一欄還是分類**時,**「12.0.2 shows the category but not the document」**——只出現分類、文件不顯示;**12.0.1 正常**。
- **成因**:這是 **regression**,官方原話「a regression caused by another issue (**SPR# PJONB7GRUL**) that was fixed in 12.0.2」;regression 本身是 **SPR# MNIACMGKUV**。
- **暫解**:在**伺服端** `notes.ini` 加 `DISABLE_REFIND_IN_READENTRIES=1`(重啟)——官方說它會「restore the normal behavior before the fix」。
- **正解**:升到 **12.0.2 FP3** 或 **14.0**(官方 Resolved version)。升好把參數移掉。
- **要注意**:這個參數**不保證每個相似變體都有效**——[FoCul](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/) 在 Nomad Web 1.07 的分類視圖問題上實測它「did not work」。先確認你的症狀與版本再加。

## 症狀:分類套分類,文件就不見

官方 KB0102504 把情境描述得很具體:同一個視圖,不套篩選時兩筆文件都看得到;用 `field1b`、`field2b` 兩個欄位去篩;

- **12.0.1**:分類與文件都正確顯示。
- **12.0.2**:**只顯示分類、不顯示文件**。

關鍵條件是「**下一欄還是分類**」——也就是你的視圖是**多層分類**,篩選之後停在某個分類層、而它底下又是另一層分類。這種「分類套分類」的巢狀情況,正是 12.0.2 這個 regression 打到的地方。

## 為什麼:修一個 bug、引入 refind

XPages 的視圖底層,是靠讀取**視圖項目(view entries)**來組畫面的(這跟傳統 web 的 [`?ReadViewEntries`](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) 是同一套讀視圖項目的機制)。而分類視圖的 entry 同時包含**分類列**與**文件列**,巢狀分類下的定位本來就比較複雜。

HCL 在 12.0.2 修另一個 bug(SPR# PJONB7GRUL)時,`ReadEntries` 的讀取流程多了一個「**refind(重新定位)**」步驟。這步在一般情況沒事,但在「分類套分類、要往下取文件」時把文件漏掉了——於是成了新的 regression(SPR# MNIACMGKUV)。`DISABLE_REFIND_IN_READENTRIES` 這個參數的名字就是字面意思:**把 ReadEntries 裡那個 refind 關掉**,回到加它之前的行為。

## 實務上怎麼冒出來:一個 `\` 就把視圖做成巢狀分類

這個 bug 常常是「不小心」踩到的,因為很多人不知道一件事:**在一個設為「分類(Categorized)」的欄位裡,值中的 `\`(反斜線)是 Domino 的「子分類分隔符」**——官方文件寫得很直白,「A backslash ( \ ) after a main entry denotes the subcategory name」。(同樣的值放在只是「排序」而非「分類」的欄位,會原樣顯示成 `ABC\File`;一旦欄位設為分類,就被拆成層。)所以一個看起來只是把兩個欄位串起來的欄位公式——

```
DocNo + "\\" + FieldCode
```

——**不會**產生一個平的字串 `ABC\File`,而是讓 Notes 把它拆成**兩層分類**:`DocNo`(第一層)→ `FieldCode`(第二層,例如 `File`、`AssetReport`)。視圖就這樣從「單欄分類」變成了「巢狀分類」,正好落在這個 bug 的觸發條件上。

一個真實案例:有人把每個附件各存成一份文件、都用單號當 key,再用一個分類視圖(欄位公式就是上面那個 `DocNo + "\\" + FieldCode`)呈現,XPages 的 category filter 下 `FormNumber + "\\File"`——也就是**篩進 `ABC\File` 這個巢狀分類**。把 DB 放到 **R12(12.0.2)** 後,同一個分類底下**永遠只看得到第一筆檔案,刪掉才冒出下一筆**——正是前面說的 refind 定位症狀。

**當時的解法是把 `\\` 拿掉**(不要用它去製造第二層分類),視圖回到單層、觸發條件消失,就正常了。這其實就是「**去巢狀化**」這條 workaround——跟 `DISABLE_REFIND_IN_READENTRIES=1`(關掉 refind)殊途同歸,正解一樣是升到 12.0.2 FP3 / 14.0。

**一個很實用的檢查**:如果你並沒有想做多層分類、卻踩到這個症狀,先回頭看分類欄公式裡有沒有一個不小心的 `\`——它可能正在幫你把視圖悄悄做成巢狀分類。

## 暫解與正解

**暫解**——在**伺服端** `notes.ini` 加(然後重啟 Domino):

```
DISABLE_REFIND_IN_READENTRIES=1
```

官方明說它會「restore the normal behavior before the fix」——把造成文件漏掉的 refind 關掉、恢復修 PJONB7GRUL 之前的行為。

**但這是 stopgap。** KB0102504 的 Resolved version 是 **12.0.2 FP3** 與 **14.0**;能排 fixpack/升版就升,別讓 `DISABLE_*`(關掉某個內部行為)這種參數在 notes.ini 常住——它同時也把當初修 PJONB7GRUL 想要的行為關掉了。升好之後記得移除這行。

## 這個 workaround 不保證通用:12.0.2 有一「家族」的分類視圖 regression

同一個參數不是萬用鑰匙。12.0.2 其實有**一整組**「分類/子分類底下的文件顯示不出來」的 regression,各自打在不同介面、各有各的參數與修復版本——重點是**對到你自己那個介面**。

最好的官方對照是 [KB0102042](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042):在 Notes client 用 **`@PickList`** 或 **`NotesUIWorkspace.PicklistCollection`** 對一個有分類與子分類的視圖選文件時,**只顯示最上層、子分類底下的文件不出現**。官方講的成因是「a new functionality was added in Notes 12.0.2 ... an advanced form of NIF lookup」——跟本篇同屬「12.0.2 一連串改動 view/NIF 查找行為、各自引入 regression」這一群(彼此是**不同的 SPR、不是同一段修正**;光是修復版本一個 FP1、一個 FP3 就說明不是同一次改動),但它是**不同介面**:暫解是 client 端 `notes.ini` 的 **`EnableExtendedFindByKey=0`**(不是本篇的 `DISABLE_REFIND_IN_READENTRIES=1`),修於 **12.0.2 FP1**(不是本篇的 FP3/14.0)。KB0102042 自己也指向更多姊妹案例(KB0102043、KB0101979、embedded view 變體),可見這是一「家族」而非單一 bug。

社群端則有相似、但**這個參數無效**的變體:[FoCul](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/) 記錄的 **Nomad Web 1.07** 分類視圖「空類別」問題,`DISABLE_REFIND_IN_READENTRIES=1` 在那個情境**「did not work」**。

所以順序永遠是:**先對症(哪個介面——XPages?`@PickList` 對話框?Nomad?embedded view?哪個版本?),再挑對應的參數與 KB**;參數加了沒用,通常是踩到家族裡的另一個變體,不是參數寫錯。

## 小結

XPages 多層分類、篩選後下一欄仍是分類時文件不顯示,是 12.0.2 修 SPR# PJONB7GRUL 引入的 regression(SPR# MNIACMGKUV,KB0102504)。伺服端 `notes.ini` 加 `DISABLE_REFIND_IN_READENTRIES=1` 是暫解、把 ReadEntries 的 refind 關掉;正解是升到 12.0.2 FP3 或 14.0、再把參數移掉。並記得:12.0.2 有一整組這種分類視圖 regression(如 `@PickList` 的 KB0102042,介面、參數與修復版本都不同)——先對症、再挑對應的參數與 KB。
