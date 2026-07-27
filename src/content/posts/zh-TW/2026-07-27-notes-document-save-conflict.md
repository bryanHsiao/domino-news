---
title: "Save(True, False) 還是 Save(False, True)：決定誰的資料會不見的兩個布林值"
description: "兩個程序動到同一份文件 —— 一個 web agent 和一個開著表單的使用者，或一個排程 agent 和一個 replica。一邊的儲存贏，另一邊的編輯要嘛消失、要嘛變成一份沒人發現的 $Conflict。發生哪一種，完全由你傳給 NotesDocument.Save 的那兩個布林值決定。一篇關於 force 與 createResponse 的實測報告：last-write-wins 對上 replicator 產生的衝突文件、為什麼 Save(True, False) 會靜默丟資料、以及怎麼刻意地選對。"
pubDate: 2026-07-27T07:30:00+08:00
lang: zh-TW
slug: notes-document-save-conflict
tags:
  - "LotusScript"
sources:
  - title: "Save (NotesDocument, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html"
  - title: "NotesDocument (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "MakeResponse (NotesDocument, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html"
relatedJava: ["Document"]
relatedSsjs: ["Document"]
cover: "/covers/notes-document-save-conflict.webp"
coverStyle: "minimalist-mono"
---

一個排程 agent 走過一個 view、更新訂單文件。它跑的時候，有個使用者正在 client 裡開著其中一筆訂單、按了儲存。兩邊都寫同一份 note。兩次寫入裡有一次靜靜地消失 —— 或者一份 `$Conflict` 文件悄悄出現在 view 裡、一個禮拜都沒人注意到。你拿到這兩種結果的哪一種，不是運氣。是你傳給 [`NotesDocument.Save`](/domino-news/zh-TW/posts/notes-document) 的那兩個布林值，而多數程式傳它們的時候根本沒想。

這是一篇關於 `Save(force, createResponse)` 的實測報告 —— 並行寫入背後的真值表、為什麼常見的 `Save(True, False)` 是一個被包裝成方便的丟資料決定、以及怎麼刻意地選這一對。

---

## 重點摘要

- `Save` 的前兩個參數是 `force` 與 `createResponse`，它們合起來決定「你開啟到儲存之間 note 在你底下被改過了」時會發生什麼。
- **`Save(True, False)`** —— 強制。「最後一個被儲存的版本贏；較早的版本被丟棄。」另一邊的寫入不見了，靜默地。沒有錯誤、沒有衝突文件。
- **`Save(False, True)`** —— 不強制、做成 response。如果 note 在你底下改過，你的儲存「變成原文件的一個 response —— 這就是 replicator 遇到複製衝突時的作法」。兩個版本都以 `$Conflict` 存活下來。
- **`Save(False, False)`** —— 不強制、不做 response。儲存被取消；你得偵測到這件事、再決定怎麼辦，否則你的改動也一樣不見。
- 明確地把它們傳出來。哪一對是對的，取決於對那份文件來說，丟掉*另一邊*的編輯、還是留下*兩份*，哪個是比較小的惡。

## 那兩個布林值，講精確

[`Save`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html) 的文件對碰撞情況講得罕見地直白，所以照字面讀。

`force`（第一個參數）：「若為 True，即使有別人在腳本執行期間編輯並儲存了該文件，文件仍會被儲存。最後一個被儲存的版本贏；較早的版本被丟棄。」若為 False，而這期間有別人存了，第二個參數就接手。

`createResponse`（第二個參數）：「若為 True，目前的文件變成原文件的一個 response（這就是 replicator 遇到複製衝突時的作法）。若 force 參數為 True，createResponse 參數沒有作用。」

所以碰撞行為是一張小小的真值表：

| 呼叫 | 若 note 在你底下改過 |
|---|---|
| `Save(True, False)` | 你的版本覆蓋掉他們的。他們的編輯被丟棄，靜默地。 |
| `Save(False, True)` | 你的版本存成一份 **response** 衝突文件；兩份都活著。 |
| `Save(False, False)` | 儲存被**取消**；除非你處理，你的編輯不會落地。 |

注意 `createResponse` 那一欄在 `force` 為 True 時是死的 —— 這就是為什麼 `Save(True, True)` 只是帶了一個誤導人的第二參數的 `Save(True, False)`。

## 為什麼 Save(True, False) 是那個危險的預設

`Save(True, False)` 是多數範例會伸手去拿的，因為它「就是會動」—— 沒有錯誤、沒有被取消的儲存，寫入永遠落地。那正是問題所在。*永遠落地*代表它永遠覆蓋，而它覆蓋掉的那份文件，可能帶著某個使用者兩秒前做的編輯。沒有任何訊號說有東西掉了；被丟棄的版本不會進衝突、不會拋錯、不留痕跡。在一份低競爭的文件上，它可以好幾年沒事。在一份熱門文件上 —— 一筆很多人動的訂單、一個計數器、一個 web 表單跟 agent 都會寫的狀態欄位 —— 它是一台靜默丟資料的機器。

只在*你的*寫入按設計就是權威的時候，才伸手拿 `Save(True, False)`：你把欄位從頭算出來、真心想蓋掉原本那裡的任何東西。如果文件裝的是使用者輸入、而另一個寫入者也可能改過，強制就是錯的選擇。

## Save(False, True)：讓衝突看得見

`Save(False, True)` 用靜默換一個看得見的產物。當你的寫入碰撞時，它不會贏、也不會消失 —— 它以一份標了 `$Conflict` 的 [response 文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html)落地，正是 replicator 給「兩個 replica 都改了一份 note」用的機制。兩個版本現在都在資料庫裡，衝突那份巢狀在主文件底下，一個人（或一個清理 agent）可以去調和它們。

當「丟掉一個編輯」比「浮出一團亂」更糟時，這是對的選擇。代價是：如果沒人盯著，`$Conflict` 文件會越堆越多，而且它們會搞亂那些沒預期會有 response 的 view 邏輯。你可以在設計層減輕這點：表單的 **Merge Replication/Save Conflicts** 屬性會自動合併那些「編輯動到*不同*欄位」的衝突，所以只有真正同欄位的碰撞才變成看得見的 `$Conflict` 文件。對一份常衝突的文件來說，把那個打開，往往是槓桿最大的單一改動。

## Save(False, False) 與處理那個取消

`Save(False, False)` 是嚴格的選項：不強制、不做衝突 —— 如果 note 在你底下移動了，儲存就被取消。陷阱在於把 `Save` 當成射後不理。如果你呼叫它、然後走人，一個被取消的儲存代表你的改動悄悄不見了，跟站在強制的輸家那一邊淨結果一樣。誠實的樣式是把碰撞當成一次 retry：重新抓[文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html)、把你的改動重新套到那份新鮮的副本上、再存一次 —— 一個小迴圈，把「我輸了這場競賽」變成「我把我的改動併進了目前的版本」。對一個「不能丟資料、又不能生衝突」的後端寫入者來說，那個 re-read-and-retry 迴圈是對的形狀，多那幾行值得。

## 同類別在其他語言

這一個搬得很乾淨，很難得。Java 的 `Document.save(boolean force, boolean createResponse)` 收同樣兩個布林值、同樣的碰撞語意，而 XPages 裡 SSJS 的 `document.save()` 坐在同一個後端呼叫上。所以上面那張真值表跟語言無關 —— 「要覆蓋、要分支到衝突、還是要取消」這個決定，是文件儲存體的性質，不是 API 面的性質。所以要是你把一段常常在存檔的程式從 LotusScript 改寫到 Java 或 SSJS，語法查一下就會 —— 真正要一起搬過去、也最容易漏掉的，是「`force` 和 `createResponse` 各自該填 True 還是 False」這個判斷。填錯了，語法再正確，一樣會覆蓋掉別人剛存的資料、或生出一堆沒人處理的衝突文件。
