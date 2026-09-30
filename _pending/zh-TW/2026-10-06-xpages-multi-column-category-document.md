---
title: "XPages 多欄位分類、下一欄還是分類時文件不顯示——12.0.2 的 regression 與 DISABLE_REFIND_IN_READENTRIES"
description: "一個 XPages 視圖分類在多個欄位上，你套上篩選、而下一欄還是分類時，畫面只出現分類、底下的文件卻不見了——12.0.2 才這樣，12.0.1 是正常的。這是 HCL 官方認的 regression（KB0102504 / SPR# MNIACMGKUV），是 12.0.2 修另一個 bug（SPR# PJONB7GRUL）時引入的。暫解是在伺服端 notes.ini 加 DISABLE_REFIND_IN_READENTRIES=1，正解是升到 12.0.2 FP3 或 14.0。這篇講症狀、為什麼會這樣、暫解與正解，以及一個「同參數卻沒用」的相似變體要注意。"
pubDate: 2026-10-06T07:30:00+08:00
lang: zh-TW
slug: xpages-multi-column-category-document
tags:
  - "XPages"
  - "Admin"
sources:
  - title: "XPages: Unable to get document when filtering a multi-column category and the next column is a category（KB0102504）— HCL Customer Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504"
  - title: "URL commands for opening servers, databases, and views（?ReadViewEntries）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
  - title: "Categorised view problem in Domino Nomad Web 1.07（相似變體、同參數無效）— FoCul"
    url: "https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/"
relatedJava: []
relatedSsjs: []
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

## 暫解與正解

**暫解**——在**伺服端** `notes.ini` 加(然後重啟 Domino):

```
DISABLE_REFIND_IN_READENTRIES=1
```

官方明說它會「restore the normal behavior before the fix」——把造成文件漏掉的 refind 關掉、恢復修 PJONB7GRUL 之前的行為。

**但這是 stopgap。** KB0102504 的 Resolved version 是 **12.0.2 FP3** 與 **14.0**;能排 fixpack/升版就升,別讓 `DISABLE_*`(關掉某個內部行為)這種參數在 notes.ini 常住——它同時也把當初修 PJONB7GRUL 想要的行為關掉了。升好之後記得移除這行。

## 這個 workaround 不保證通用

同一個參數不是萬用鑰匙。分類視圖在 12.0.2 前後有**不只一個**相似的讀取問題:KB0102504 這個 XPages 情境,`DISABLE_REFIND_IN_READENTRIES=1` 有效、修於 FP3/14.0;但 [FoCul](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/) 記錄的 **Nomad Web 1.07** 分類視圖「空類別」問題,同一個參數卻**「did not work」**。所以順序永遠是:**先對症(是不是「分類套分類、文件不顯示」、哪個介面、哪個版本),再決定加不加這個參數**;加了沒用,多半是踩到另一個變體,不是參數寫錯。

## 小結

XPages 多層分類、篩選後下一欄仍是分類時文件不顯示,是 12.0.2 修 SPR# PJONB7GRUL 引入的 regression(SPR# MNIACMGKUV,KB0102504)。伺服端 `notes.ini` 加 `DISABLE_REFIND_IN_READENTRIES=1` 是暫解、把 ReadEntries 的 refind 關掉;正解是升到 12.0.2 FP3 或 14.0、再把參數移掉。並記得:同名參數在其他相似變體(如 Nomad Web 那個)未必有效——先對症、再下參數。
