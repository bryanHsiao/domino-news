---
title: "LotusScript web agent 的 I/O 模型：Print 是你的回應，DocumentContext 是你的請求"
description: "一個 LotusScript web agent 沒有 request 物件、也沒有 response 物件 —— 它有 Print，輸出變成 HTTP body，還有 DocumentContext，一份裝著 CGI 變數的特殊文件。一篇兩半模型的實測報告：第一行 Print 怎麼設 Content-Type、讓你回 JSON 而不是 HTML，怎麼從 DocumentContext 讀 query string 與 POST body，那個讓它們變空的 CGI-欄位陷阱，以及這一切怎麼跟一個頂層錯誤 handler 兜起來。"
pubDate: 2026-07-31T07:30:00+08:00
lang: zh-TW
slug: lotusscript-web-agent-io
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Web agents (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html"
  - title: "DocumentContext property (NotesSession) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTCONTEXT_PROPERTY.html"
  - title: "NotesSession (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
relatedJava: []
relatedSsjs: []
---

從任何一個現代 web 框架來到 LotusScript web agent，你第一個會找的是 request 物件與 response 物件。兩個都沒有。一個 Domino web agent —— 你用 `?OpenAgent` 叫起來、拿去建一個小 JSON 端點或吐一段動態片段的那種 —— 有的是兩道老得多的縫：`Print`，它累積起來的輸出*就是* HTTP 回應 body，以及 `DocumentContext`，一份記憶體裡的特殊文件、它的欄位*就是*請求的 CGI 變數。學會這兩個，整個模型就到位了；沒搞懂它們怎麼運作，你就得到一個「你要 JSON 它回 HTML」的 agent，或一個讀到空 query string、又不知道為什麼的 agent。

這是一篇 web agent I/O 模型的實測報告 —— 輸出側、輸入側、以及各自的兩個陷阱。它跟[錯誤處理那篇](/domino-news/zh-TW/posts/lotusscript-error-handling)搭配；兩篇加起來，就是一個手寫 Domino web 端點需要的大部分。

---

## 重點摘要

- **輸出就是 `Print`。** 文件講得很直白：「Domino 累積 print 敘述、在 agent 跑完後用它們的內容建出一個頁面。」你 `Print` 什麼，就是回應 body。
- **用第一個 `Print` 設 content type。** 要回 JSON 而不是預設的 HTML，你印的第一行就是 header —— `Content-Type: application/json` —— 接一個空行、再接 body。那個空行是 HTTP 的 header／body 分隔；漏掉它，header 就滲進你的 JSON。
- **輸入是 `Session.DocumentContext`** —— 一份帶著請求 CGI 變數的 `NotesDocument`。GET 的引數在它的 `Query_String` item 裡；POST body 在 `Request_Content` 裡。
- **CGI-欄位陷阱：** 對表單觸發的 agent（WebQueryOpen／Save），CGI 值只有在表單有一個以它命名的欄位時才會出現。獨立的 `?OpenAgent` agent 則直接在 `DocumentContext` 上拿到它們。

## 輸出側：Print 就是 body

沒有 `response.write`。有的是 `Print`，而 Domino 對它的合約剛好一句話：「Domino 累積 print 敘述、在 agent 跑完後用它們的內容建出一個頁面。」每個 `Print` 都往同一個緩衝區追加，而那個緩衝區在 agent 結束時被沖到瀏覽器、當成回應。

預設那個回應以 `text/html` 送出。要送別的 —— API 的 JSON、下載的 CSV、純文字 —— 你自己設 header，而機制是一個小小的 HTTP 慣例、不是一個屬性：你印的**第一個**東西是 header 行、然後一個空行、然後 body。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Print "Content-Type: application/json"    ' header —— 必須第一
    Print ""                                   ' 空行：header 結束
    Print "{""status"":""ok"",""count"":42}"   ' body
End Sub
```

兩個失效模式住在這裡。如果 `Content-Type` 那行不是最最開頭的輸出 —— 哪怕是一個游離的 `Print`、或它前面一個空格 —— Domino 已經開始了一個 HTML 回應，你的 header 就變成頁面最上面看得見的文字。而如果你忘了那個空行，header 跟 body 的第一行黏在一起，瀏覽器解不了那個回應。第一行、空行、body：那個順序就是整個協定。

## 輸入側：DocumentContext 就是請求

請求以 [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html) 上的 [`DocumentContext`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTCONTEXT_PROPERTY.html) 抵達。對一個 `?OpenAgent` 呼叫，並沒有真的在編輯的文件，所以 Domino 給你一份合成的、它的 item 就是那些 CGI 變數 —— 你在任何 CGI 環境會讀的那些 `Query_String`、`Request_Content`、`Remote_Addr`、`Remote_User`，變成文件欄位。

GET 的話，引數在 `Query_String` 裡；你自己讀、自己 parse：

```lotusscript
Dim ctx As NotesDocument
Set ctx = session.DocumentContext
Dim qs As String
qs = ctx.Query_String(0)              ' 例如 "OpenAgent&id=1024&fmt=json"
```

POST 的話，body 在 `Request_Content` 裡：

```lotusscript
Dim body As String
body = ctx.Request_Content(0)         ' 原始 POST payload —— 當表單或 JSON 去 parse
```

沒有自動 query 解析、也沒有自動 JSON 綁定；你拿到原始字串、自己切（或把 JSON body 餵給 [`NotesJSONNavigator`](/domino-news/zh-TW/posts/notes-json-navigator)）。那是這個模型年紀的代價，也正是它為什麼可預測 —— 沒有東西在你背後被解碼。

## 陷阱：CGI 值不是永遠都在

[web agents 那頁](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOTUSSCRIPT_AND_JAVA_AGENTS_WEB.html)對輸入側的警告，抓到很多人：「CGI 值是有的、但不是自動的。撐住目前文件的表單必須有一個以每個所需 CGI 變數命名的欄位。」那適用於從表單觸發的 agent —— WebQueryOpen 或 WebQuerySave —— 那裡 `DocumentContext` 是表單自己的文件。那種情況下，讀 `ctx.Query_String(0)` 會回空，除非表單設計真的有一個 `Query_String` 欄位來接它。把 CGI 欄位加到表單上，否則那些值就是靜靜地不在。

獨立的 `?OpenAgent` agent 沒有這個問題 —— 它的 `DocumentContext` 是那份合成的 CGI 文件、變數直接就在。所以同一行 `ctx.Query_String(0)` 在一個 `?OpenAgent` 端點裡開箱即用，在一個表單缺欄位的表單 agent 裡回空。知道你在哪一種 agent 裡，就知道該不該預期 CGI 值免費送到。

## 把兩半兜起來

一個手寫的 JSON 端點，就是這兩側加一個守衛：從 `DocumentContext` 讀請求、做事、印出 `Content-Type` 與 JSON body —— 再用[錯誤處理那篇](/domino-news/zh-TW/posts/lotusscript-error-handling)的頂層 handler 把它包起來，讓失敗印出一個乾淨的 JSON 錯誤、而不是一個被截斷的回應。讀、做事、印、守衛。那就是一個 Domino web agent 的整個形狀，而一旦這兩道縫清楚了，它是一個「不用扯上 XPages 或 REST API 就架起一個小端點」的、意外地直接的方式。

## 同類別在其他語言

這個模型有表親、不是雙胞胎。一個 Java agent 不用 `Print` —— 它呼叫 `AgentBase.getAgentOutput()` 拿一個 `PrintWriter`、透過它寫回應，但「第一行是 `Content-Type` header、然後一個空行」這個慣例一模一樣，因為它是 HTTP 慣例、不是語言慣例。Java 讀請求的方式一樣，從 `getDocumentContext()`。XPages 裡的 SSJS 是完全另一個世界：透過 `facesContext.getExternalContext()` 有真正的 request／response、有像樣的參數 map、沒有 CGI-欄位那套儀式 —— 那正是你把一個 JSON 端點從 web agent 搬到 XPages 時感受到的升級。三者之中 LotusScript agent 是最貼近底層的，而對一個單檔端點來說，那是個優點。
