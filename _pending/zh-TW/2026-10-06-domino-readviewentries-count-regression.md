---
title: "分類視圖用 &Count 讀出來的項目數不對？12.0.2 的 ReadViewEntries regression 與 DISABLE_REFIND_IN_READENTRIES"
description: "升到 12.0.2 之後，某個分類視圖用 ?ReadViewEntries&Count=N 讀回來，項目數就是不對——你的應用沒改，是 Domino 的 regression。這是 12.0.2 修另一個 bug（SPR# PJONB7GRUL）時引入的（SPR# MNIACMGKUV），暫解是在伺服端 notes.ini 加 DISABLE_REFIND_IN_READENTRIES=1，正解是升到 12.0.2 FP3 或 14.0。這篇講症狀、ReadViewEntries&Count 是什麼、為什麼會這樣，以及一個「同一個參數卻沒用」的相似 bug 別搞混。"
pubDate: 2026-10-06T07:30:00+08:00
lang: zh-TW
slug: domino-readviewentries-count-regression
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "URL commands for opening servers, databases, and views（?ReadViewEntries／Count）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
  - title: "KB0113007（分類視圖 &Count 項目數不對；SPR# MNIACMGKUV）— HCL Customer Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0113007"
  - title: "Categorised view problem in Domino Nomad Web 1.07（相似但不同的 bug）— FoCul"
    url: "https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/"
relatedJava: []
relatedSsjs: []
---

升到 12.0.2 之後,某個**分類視圖(categorized view)**用 `?ReadViewEntries&Count=N` 讀回來,**項目數就是不對**。你的應用一行沒改、視圖也沒動——這不是你的問題,是 Domino 自己的 regression。

比較容易讓人卡住的是:網路上會查到一個 notes.ini 暫解 `DISABLE_REFIND_IN_READENTRIES=1`,但**同一個參數,在另一個長得很像的分類視圖 bug 上卻沒用**。所以先確認你踩的是哪一個,再決定加不加。

這篇講清楚:症狀、`ReadViewEntries&Count` 是什麼、為什麼 12.0.2 會這樣,以及那個「參數無效」的相似 bug 怎麼區分。

---

## 重點摘要

- **症狀**：**分類視圖**用 `?ReadViewEntries&Count=N` 讀取時,**回傳的項目數不對**——自 **12.0.2** 起。
- **成因**:這是 12.0.2 在修另一個 bug(**SPR# PJONB7GRUL**)時引入的 **regression**(**SPR# MNIACMGKUV**);讀取時多了一個「refind(重新定位)」步驟,把數量算錯。
- **暫解**:在**伺服端** `notes.ini` 加 `DISABLE_REFIND_IN_READENTRIES=1`、重啟——把那個 refind 關掉、回到修 PJONB7GRUL 之前的行為。
- **正解**:升到 **12.0.2 FP3** 或 **14.0**(參數只是 stopgap,能升就升)。
- **別搞混**:另有一個「分類視圖空類別」的相似 bug([FoCul 那篇](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/)實測),**同一個 `DISABLE_REFIND_IN_READENTRIES=1` 對它「沒用」**,那是不同 SPR、修在 12.0.2 FP1。

## 症狀：&Count 在分類視圖回錯

`?ReadViewEntries` 是 Domino 把**視圖項目讀成 XML** 的 URL 指令(不帶字型、格式那些外觀屬性),是傳統 web、DAS(Domino Access Services)REST、Nomad Web 底層在用的東西。官方 [URL commands](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) 對 `Count` 的定義很簡單:`Count=n`,n 就是「要顯示的列數(rows)」。搭配 `Start`(從第幾列開始,分類視圖可以帶 `3.5.1` 這種階層 subindex)分頁讀。問題就出在**分類視圖**:12.0.2 之後,帶 `&Count` 讀分類視圖,回來的 entry 數量對不上(該有幾筆卻不是幾筆)。因為分類視圖的「entry」同時包含**分類列**與**文件列**,計數與定位比平面視圖複雜,而這正是 regression 打到的地方。

## 為什麼：修一個 bug、引入另一個

這是很典型的 regression 故事。HCL 在 12.0.2 修掉某個 bug(**SPR# PJONB7GRUL**)時,`ReadEntries` 的讀取流程多了一個「refind」——在讀取過程中**重新定位到某個 entry**。這個改動在平面視圖沒事,但在分類視圖把 `&Count` 的計數弄錯了,於是變成新的 regression(**SPR# MNIACMGKUV**,見 [KB0113007](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0113007))。

`DISABLE_REFIND_IN_READENTRIES` 這個參數的名字就是字面意思:**把 ReadEntries 裡那個 refind 關掉**,讓行為回到加那步之前。

## 暫解與正解

**暫解**——在**伺服端**的 `notes.ini` 加:

```
DISABLE_REFIND_IN_READENTRIES=1
```

然後重啟 Domino。它會關掉造成計數錯誤的 refind、恢復修 PJONB7GRUL 之前的正常行為。

**但這是 stopgap,不是終點。** 這個問題已在 **12.0.2 FP3** 與 **14.0** 修好;能排上 fixpack/升版,就升,別讓 `DISABLE_*` 這種「關掉某個內部行為」的參數在 notes.ini 長住——它同時也把當初修 PJONB7GRUL 想要的行為關掉了。升好之後,記得把這行移除。

## 別跟那個「參數無效」的相似 bug 搞混

12.0.2 前後,分類視圖的讀取有**不只一個**長得很像的 bug,別一律套同一個參數:

- **你這個**(KB0113007 / SPR# MNIACMGKUV):`&Count` 項目數不對 → `DISABLE_REFIND_IN_READENTRIES=1` **有效**、修於 **12.0.2 FP3 / 14.0**。
- **另一個**(分類視圖「空類別」,Nomad Web):[FoCul 的實測](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/)(Nomad Web 1.07)明講 `DISABLE_REFIND_IN_READENTRIES=1` **「did not work」**,那是**不同 SPR、修於 12.0.2 FP1**(該篇也提到 XPages 有相似的 KB0102504)。

所以順序是:**先確認症狀(是 `&Count` 數量錯,還是空類別?)、確認你的版本,再決定加不加這個參數**。加了沒用,多半是踩到另一個 bug,不是參數寫錯——別在錯的 bug 上耗時間。

## 小結

分類視圖 `?ReadViewEntries&Count` 在 12.0.2 之後數量不對,是修 SPR# PJONB7GRUL 引入的 regression(SPR# MNIACMGKUV)。`DISABLE_REFIND_IN_READENTRIES=1` 是暫解、把 ReadEntries 的 refind 關掉;正解是升到 12.0.2 FP3 或 14.0、然後把參數移掉。最後一句要記得:同名參數在「空類別」那個相似 bug 上是無效的——**先對症、再下參數**。
