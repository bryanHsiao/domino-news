---
title: "partial refresh vs partial execution：XPages 的 JSF 六階段，為什麼只刷一塊卻整頁重算"
description: "你在 XPages 按一個按鈕，結果一個八竿子打不著的欄位驗證器跳出來擋你——因為預設情況下，整頁都跑了一輪 JSF 生命週期，不只你按的那塊。XPages 有兩個各自獨立的「partial」旋鈕：partial refresh（refreshMode/refreshId）管的是 client 端回傳哪塊 HTML，partial execution（execMode/execId）管的才是 server 端跑哪些元件的生命週期。這篇用 JSF 六階段講清楚兩者差別、為什麼只做 partial refresh 整頁還是在 server 重算，以及 partial execution 怎麼把 server 工作縮到一塊。"
pubDate: 2026-10-01T07:30:00+08:00
lang: zh-TW
slug: xpages-partial-refresh-execution
tags:
  - "XPages"
  - "SSJS"
  - "Performance"
sources:
  - title: "execMode - Execution Mode — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/xpage_user_guide/builds/wpd_controls_pref_execmode.html"
  - title: "refreshMode - Refresh Mode — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/xpage_user_guide/builds/wpd_controls_pref_refreshmode.html"
  - title: "Understanding Partial Execution: Part Three – JSF Lifecycle — Intec（Paul Withers）"
    url: "http://intec.co.uk/understanding-partial-execution-part-three-jsf-lifecycle/"
relatedJava: []
relatedSsjs: []
cover: "/covers/xpages-partial-refresh-execution.webp"
coverStyle: "collage"
---

你在 XPages 頁上按一個按鈕,只想更新一小塊——結果一個跟這動作**毫不相干**的欄位,驗證器跳出來把你擋下。或者你明明只做了 partial refresh、只回傳一小塊 HTML,server 的 CPU 卻像整頁都重算了一遍。

這兩件事的根,都在同一個地方:**XPages 每次提交都會跑一輪 JSF 生命週期**,而且預設是**整頁**跑。XPages 給你兩個**各自獨立**的旋鈕去縮小範圍——但很多人只調了其中一個(client 端的 partial refresh),以為 server 也跟著省了,其實沒有。

這篇用 JSF 六階段講清楚 `partial refresh` 與 `partial execution` 到底各管什麼。

---

## 重點摘要

- **JSF 六階段**(每次提交依序跑):Restore View → Apply Request Values → Process Validations → Update Model Values → Invoke Application → Render Response。你的 SSJS action 在**第 5 階段** Invoke Application 跑。
- **`partial refresh`(`refreshMode="partial"` + `refreshId`)= client 端**:官方定義是「a fragment of a submitted page is refreshed rather than all controls」——它只決定**回傳哪塊 HTML**,**不影響 server 處理**。
- **`partial execution`(`execMode="partial"` + `execId`)= server 端**:官方定義是「the events for one control are executed rather than for all controls」——它才是把**生命週期縮到一塊元件**的旋鈕。
- **兩者獨立**:只做 partial refresh,server 照樣**整頁**跑六階段(所以不相干的驗證器照跳、computed 照算)。要 server 也省,得用 partial execution。
- **驗證失敗會直接跳到第 6 階段**(略過 Update Model／Invoke Application),你的 action 根本不會跑。
- 要讓 `refreshId`／`execId` 指向**特定元件**,得在原始碼明確設(不是每次都要——但要鎖定「事件處理器以外」那塊時就得設)。

## JSF 六階段

XPages 每次提交,元件樹會依序走過六個階段([JSF lifecycle 詳解見 Intec 這篇](http://intec.co.uk/understanding-partial-execution-part-three-jsf-lifecycle/)):

1. **Restore View**——還原元件樹,好把瀏覽器這次的變更套上去。
2. **Apply Request Values**——把瀏覽器輸入抓進各元件的 `submittedValue`。**這裡就受 execMode 影響**:full 就全抓,partial 只抓 `execId` 範圍內的。
3. **Process Validations**——跑 converter/validator。**任何一個驗證失敗,生命週期就直接跳到第 6 階段 Render Response**,後面的 model 更新與 application 邏輯全部略過。
4. **Update Model Values**——通過驗證的值,寫回 datasource(從 `submittedValue` 進到 `value`)。
5. **Invoke Application**——**你的 SSJS action 在這裡跑**,拿到的是通過驗證的值。
6. **Render Response**——產生要回給瀏覽器的 HTML;partial refresh 就是在這階段依 `refreshId` 只回傳那一塊。

看懂這條就懂了那個「不相干欄位擋我」的 bug:預設整頁都進第 3 階段,所以別的欄位的 validator 也會跑。

## partial refresh:只是 client 端少傳一點

`partial refresh` 由事件處理器的 `refreshMode="partial"` + `refreshId` 控制。官方 [refreshMode](https://help.hcl-software.com/dom_designer/11.0.0/xpage_user_guide/builds/wpd_controls_pref_refreshmode.html) 的定義:

> Partial refresh means that a fragment of a submitted page is refreshed rather than all controls on the page.

**關鍵**:它只管「第 6 階段回傳哪塊 HTML」。前面第 1~5 階段——包含所有驗證、所有 computed 重算——**還是整頁在跑**。Paul Withers 講得最白:`refreshId` 對 server 處理毫無影響,不管你填什麼,整頁都會在生命週期裡被重算。所以只調 partial refresh,你省的是網路回傳量,**不是 server CPU**。

## partial execution:把 server 的生命週期縮到一塊

要讓 server 也只處理一塊,得用 `partial execution`——事件處理器的 `execMode="partial"` + `execId`。官方 [execMode](https://help.hcl-software.com/dom_designer/11.0.0/xpage_user_guide/builds/wpd_controls_pref_execmode.html):

> Partial execution means that the events for one control are executed rather than for all controls on the page.

設了之後,第 2~5 階段**只對 `execId` 範圍內的元件跑**:範圍外的不抓值、不驗證、不重算。那個「不相干欄位的 validator 擋我」的問題,這樣才真正解決——因為那個欄位根本沒進生命週期。

**代價**:`execId` 範圍外、使用者剛輸入還沒送出的值,會**回到上次 refresh 的狀態**(因為它們這輪沒被 apply)。所以 execId 範圍要圈得剛好涵蓋「這次動作需要的輸入」。

## 兩個旋鈕、獨立使用

`refreshId`(client 回傳)與 `execId`(server 處理)是**兩件事、互不影響**:

- 只設 `refreshId`:少傳 HTML,但 server 整頁重算——驗證、computed 全跑。
- 只設 `execId`:server 只算一塊,但可能回傳整頁 HTML。
- **兩個都設**:server 只算一塊、client 只換一塊——運算與回傳都省。這才是「按一個按鈕只動一小塊」該有的完整寫法。

## 同類別在其他語言

JSF 六階段是 **XPages 執行期**的東西,沒有 LotusScript／Java-agent 的對應:

- **LotusScript／Java agent**:是「跑一支程式、從頭到尾」的模型,沒有元件樹、沒有階段化的 apply／validate／render;驗證要自己寫。
- **SSJS**:不是另一個平行世界——你的 SSJS 就是**跑在這條生命週期的第 5 階段**裡。理解階段,才知道為什麼你的 action 拿到的是「已驗證的值」、以及為什麼某些東西要放 viewScope 撐過階段(見 [XPages 四個 scope 那篇](/domino-news/posts/xpages-scope-variables))。
