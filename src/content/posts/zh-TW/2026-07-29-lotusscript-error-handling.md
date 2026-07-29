---
title: "LotusScript 錯誤處理：On Error 是逐程序的，Resume Next 不是「忽略錯誤」"
description: "兩個習慣毀掉了多數 LotusScript 錯誤處理：把 On Error 當成全域的（它是逐程序的，沒被接住的錯誤會往呼叫堆疊上爬），以及把 On Error Resume Next 當成一鍵「忽略所有錯誤」的開關（它藏起 bug、不是處理它）。一篇刻意做對的實測報告 —— 逐程序的作用範圍、Err／Error$／Erl 的生命週期、Resume 與 Resume Next 與 Resume label 的差別，以及一個 web agent 真正需要的乾淨錯誤樣式。"
pubDate: 2026-07-29T07:30:00+08:00
lang: zh-TW
slug: lotusscript-error-handling
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "On Error statement (LotusScript Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ON_ERROR_STATEMENT.html"
  - title: "Resume statement (LotusScript Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_RESUME_STATEMENT.html"
  - title: "Error statement (LotusScript Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ERROR_STATEMENT.html"
  - title: "Web Agent Patterns — claude-code-hcl-domino-skill"
    url: "https://github.com/bryanHsiao/claude-code-hcl-domino-skill/blob/main/lotusscript/web-agent-patterns.md"
relatedJava: []
relatedSsjs: []
cover: "/covers/lotusscript-error-handling.webp"
coverStyle: "risograph"
---

兩個習慣悄悄地毀掉多數 LotusScript 錯誤處理，而它們正好是這個語言最容易讓你做錯的兩件事。第一個是以為 `On Error Goto` 能保護整支程式 —— 其實不能，它只保護自己所在的那個程序，其他什麼都不管。第二個是每次有東西丟錯就伸手拿 `On Error Resume Next`，把它當成一鍵「讓錯誤消失」的開關 —— 它確實能讓錯誤消失，卻是用最糟的方式：它沒有處理錯誤，而是把造成錯誤的 bug 藏了起來。

這是一篇刻意做對 LotusScript 錯誤處理的實測報告：一個 handler 的保護實際上伸到哪、沒被接住的錯誤怎麼往呼叫堆疊上爬、`Err`／`Error$`／`Erl` 這三個的生命週期、以及三種 `Resume` 形式的差別 —— 最後收在一個 web agent 需要的乾淨錯誤樣式，讓失敗回傳瀏覽器讀得懂的東西、而不是一場原始的崩潰。

---

## 重點摘要

- [`On Error Goto label`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ON_ERROR_STATEMENT.html) 是**逐程序的**。這個 handler 只接住*那個* Sub 或 Function 裡的錯誤。它呼叫的某個 Sub 若自己沒有 handler，那裡發生的錯誤會*往上*傳到呼叫者的 handler。
- `On Error Resume Next` 不是「忽略錯誤」。它跳到下一個敘述、並讓 `Err` 保持有值 —— 只在你緊接著那行去檢查 `Err` 時才有用。當成一層通用包裝，它把崩潰變成靜默的錯誤行為。
- 在 handler 裡，`Err` 是錯誤編號、`Error$` 是訊息、`Erl` 是行號。它們描述目前這個錯誤，直到一個 `Resume` 把它們重置。
- `Resume` 重試出錯那行（若原因還在就是無窮迴圈），`Resume Next` 從它後面繼續，`Resume label` 跳到一個復原點。刻意選。
- 用 `Error errNumber, "message"` 丟你自己的錯，接住的方式跟內建錯誤一樣。

## On Error 保護一個程序，不是你的程式

你用 `On Error Goto` 宣告的 handler，作用範圍是它所在的那個程序。這是 LotusScript 錯誤處理裡被誤解最深的一件事，因為它的語法讀起來像全域守衛、行為卻是區域的。

```lotusscript
Sub Main
    On Error Goto Handler
    Call DoWork()            ' 若 DoWork 出錯且自己沒 handler，控制權會來這裡
    Exit Sub
Handler:
    Print "Main 接住：" & Err & " — " & Error$ & " 在第 " & Erl & " 行"
    Exit Sub
End Sub

Sub DoWork
    ' 這裡沒有 On Error —— DoWork 裡丟的錯不會在本地被處理
    Dim db As New NotesDatabase("", "nope.nsf")   ' 失敗
    Call db.Open("", "")
End Sub
```

`DoWork` 沒有 handler，所以它出錯時 runtime 會回退到它的呼叫者、改跑 `Main` 的 handler。這種往上傳的行為，正是「逐程序」這條規則好用的一面：你不需要每個 Sub 都寫 handler，只要在「你真的能對那個失敗做點什麼」的那一層放一個就好。危險的一面是反過來假設 —— 以為 `Main` 的 handler 也會接住你已經 `Exit Sub` 跳過的程式碼、或*之後*某個程序的錯誤。並不會。handler 只有在程式還跑在它自己那個程序裡、而且 `On Error` 那一行已經執行過之後，才會生效。

## Resume Next 是手術刀，不是毯子

`On Error Resume Next` 告訴 runtime：某個敘述出錯時，從下一個敘述繼續、不跑 handler。它只在一種情況下真的有用 —— 一個孤立、而且你會立刻檢查結果的高風險呼叫：

```lotusscript
On Error Resume Next
Set item = doc.GetFirstItem("MaybeMissing")
On Error Goto 0                      ' 立刻把毯子收掉
If Err <> 0 Then
    ' 處理那個你預期會發生的特定失敗
End If
```

注意緊接著的 `On Error Goto 0` —— 它把作用中的 handler 關掉，讓毯子只蓋一行、不蓋程序其餘部分。反過來用 —— 在 Sub 開頭放 `On Error Resume Next`、然後從不關掉 —— 它會把整個程序裡的*每一個*錯誤吞掉。那個開不起來的 `NotesDatabase` 回傳 Nothing，下一行對 Nothing 取值、也出錯、也被跳過，然後你得到一份寫了一半的文件、卻沒有任何跡象顯示出過事。當機頂多讓你難過一個下午；一次悄悄存錯、沒人發現，會讓你難過一整季。把 `Resume Next` 保留給那個狹窄的「我預期這特定一行有時會失敗、而我會檢查」的情況，並在越過那行的當下就把它關掉。

## Err／Error$／Erl 的生命週期

在 handler 裡這三個告訴你發生了什麼：`Err` 是數字碼、`Error$` 是訊息文字、`Erl` 是錯誤來自的原始行號。只要你還在 handler 裡，它們就保持有效、描述*目前*那個錯誤，而一個 [`Resume`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_RESUME_STATEMENT.html) 會把它們重置。所以你需要的（記 log、對 `Err` 分支）要在 resume *之前*讀，不是之後。

你也可以用 [`Error`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_ERROR_STATEMENT.html) 敘述自己丟錯 —— `Error 1000, "訂單總額小於零"` —— 它的行為跟內建錯誤一模一樣：目前程序的 handler 接住它，或往上傳給呼叫者的。這就是你把一條商業規則違反，變成同一套 `On Error` 機制能處理的東西的方式，而不是把一個布林回傳值穿過五層呼叫往上傳。挑內建範圍以上的編號，才不會撞號。

## 三種 Resume 形式

`Resume` 單獨用時，重試出錯的那個敘述。只有在 handler *修好了原因*時它才對 —— 建好缺的目錄、重新認證 —— 否則同一行再失敗、handler 再跑一次，你就有一個無窮迴圈。`Resume Next` 從出錯那行的後一個敘述繼續，是「記 log 然後往下走」的選擇，用在一個走過很多文件的迴圈裡、一筆壞紀錄不該擋下整批。`Resume label` 跳到一個具名復原點 —— 通常是單一的清理並離開區塊。多數穩健的 handler 結尾是 `Resume` 到一個清理 label、而不是就這樣一路執行到程序結尾，這樣一來，開著的 stream 與後端物件在錯誤路徑上也會被釋放。

## web agent 的乾淨錯誤樣式

一個沒被處理的錯誤在 LotusScript web agent 裡比在 client 裡更糟：沒有除錯對話框，只有一個壞掉或被截斷的回應，而瀏覽器顯示一個原始的伺服器錯誤。解法是一個掌控輸出的 handler。因為一個 web agent 的回應就是它 `Print` 出來的東西，handler 的工作就是 `Print` 一個乾淨的錯誤 —— 一個讀得懂的頁面、或一個給 API 端點的 JSON 錯誤物件 —— 而不是讓 agent 在半途死掉：

```lotusscript
Sub Initialize
    On Error Goto Handler
    ' 先把整個 body 組好 —— 這段若出錯，還沒印出任何東西，handler 才吐得出乾淨回應
    Dim body As String
    body = |{"status":"ok"}|             ' ... 你真正的 JSON ...
    Print "Content-Type: application/json"
    Print ""                             ' 空行分隔 header 與 body（必要，少了它回應會壞）
    Print body
    Exit Sub
Handler:
    Print "Content-Type: application/json"
    Print ""
    ' Error$ 可能含引號，塞進 JSON 前先跳脫，否則會產生壞掉的 JSON
    Print |{"error":"| & Replace(Error$, |"|, |\"|) & |","code":| & Err & |}|
    Exit Sub
End Sub
```

有三個細節讓這段是「production 可用」而不只是「示意」：`Content-Type` 後那個空行是 HTTP 規定的 header/body 分隔，少了它回應就壞；`Error$` 在塞進 JSON 前先跳脫（訊息裡若有引號，不跳脫就會產生非法 JSON）；body 先組成字串、最後才 Print，這樣萬一組到一半出錯，handler 還能吐出它自己那份乾淨回應。呼叫端（瀏覽器）拿到一個能據以處理的結構化失敗，你的 log 拿到 `Err`／`Erl`，agent 乾淨地離開、而不是吐出半份文件。`Initialize` 裡那個單一的頂層 handler，就是「一個 web 端點失敗得清楚易讀」與「失敗得像個謎」之間的差別。更完整的版本 —— 把 `Err`／`Erl` 記進一份文件、同時只回給 client 一個通用訊息、真訊息留在 log —— 整理在[這份 web agent patterns 筆記](https://github.com/bryanHsiao/claude-code-hcl-domino-skill/blob/main/lotusscript/web-agent-patterns.md)裡。

## 同類別在其他語言

這裡 LotusScript 是那個異類，值得說清楚為什麼。Java 與 SSJS 用結構化的 `try` / `catch` / `finally` —— 一個 exception 是一個物件、自帶 stack trace，而 `finally` 保證清理。LotusScript 的 `On Error` / `Resume` 是較老的「行號加 goto」模型：沒有 exception 物件、狀態放在全域的 `Err` / `Error$` / `Erl` 裡、清理靠你自己用一個 `Resume` 到 label 來安排。這裡沒有 Domino 類別可對照，因為這是語言機制、不是 API —— 所以 `relatedJava` 與 `relatedSsjs` 是空的。當你把錯誤處理邏輯從一個 LotusScript agent 搬到 Java 或 XPages 時，你不是一行一行把 `On Error` 翻成 `try`；你是在一個「終於給你 exception 物件與 `finally` 區塊」的模型裡重建它 —— 那兩樣是 LotusScript 從來沒有的。
