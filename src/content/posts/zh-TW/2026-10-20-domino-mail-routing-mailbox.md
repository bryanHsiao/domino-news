---
title: "一封信在 Domino 裡怎麼走:mail.box、Router、NRPC 逐跳 vs SMTP,以及卡在 mail.box 裡的 dead 與 held mail"
description: "使用者按下送出之後,信到底去了哪?在 Domino,每封信都先落進一個叫 mail.box 的資料庫,再由 Router task 一封一封讀收件人、決定「本機投遞」還是「轉給下一台」。這篇把這條鏈講清楚:mail.box 是什麼(為什麼一台可以有好幾個 mail1.box/mail2.box)、Router 怎麼定期檢查並查 routing table、兩種傳輸協定(預設的 Notes routing/NRPC 怎麼逐跳把信搬到下一台的 mail.box,SMTP 怎麼用 DNS MX、port 25、只走 MIME,以及它預設關閉、在 Configuration Settings 的 Router/SMTP 分頁開),信怎麼投進收件人 home server 的 mail file;最後講卡在 mail.box 的兩種信——dead(stop sign:投不出去又退不回寄件人)與 held(紅驚嘆號:mail rule 或 quota 擋下來),各自怎麼來、怎麼處理。"
pubDate: 2026-10-20T07:30:00+08:00
lang: zh-TW
slug: domino-mail-routing-mailbox
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "How mail routes in a Domino system(整條路徑:存進 mail.box → Router 查 routing table 算下一跳 → NRPC/SMTP → home server 投遞)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/plan_howmailroutesinadominosystem_c.html"
  - title: "The Domino mail router(Router 定期檢查 mail.box、本機投遞 vs 轉下一台、同一 Notes named network 直接互轉、dead vs held)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_thedominomailrouter_c.html"
  - title: "Managing undeliverable mail in MAIL.BOX(dead/held 成因、mail rule RoutingState=HOLD、quota MailTimeout、correct/release/delete、多 mail.box 的 resend all 只管當前)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_managingundeliverablemailinmailbox_t.html"
relatedJava: []
relatedSsjs: []
---

使用者按下送出,信到底去了哪?在 Domino,答案的起點永遠是同一個:**每封信都先落進一個叫 `mail.box` 的資料庫**,然後由 **Router task** 一封一封讀收件人、決定下一步。看懂從 `mail.box` 到收件人信箱這條鏈,你在排「信怎麼還沒到」「退信卡在哪」時,才知道該去哪裡看。

---

## 重點摘要

- **mail.box 是路由佇列**:一個放「在途郵件」的 Notes 資料庫。信不管從 Notes client、SMTP 還是 HTTP 進來,都先存進寄件人 home server 的 `mail.box`。
- **Router 定期檢查**:Router task「periodically checks MAIL.BOX for new or changed messages」,對每封信**逐一讀收件人**,查 routing table 算出每個收件人的下一跳,再決定**本機投遞**或**轉給下一台**。
- **兩種協定**:預設走 **Notes routing(NRPC)**——把信搬到**下一跳伺服器的 `mail.box`**,那台 Router 再往下傳,直到收件人的 **home server**。**SMTP** 是選用(預設關),預設的 MIME-only 模式下只送 MIME 訊息(另有 All messages 模式會轉換)、用 **DNS MX** 查、連 **port 25**,在 Configuration Settings 的 **Router/SMTP → Basics** 分頁開。
- **投遞與取信**:到了收件人 home server,Router 把信投進他的 **mail file**;使用者再用 Notes RPC / IMAP / POP3 / HTTP 取。
- **卡在 mail.box 的信**:`mail.box` 可能有兩種投不出去的信——**dead**(stop sign 圖示:連「投遞」和「退回寄件人」都做不到)與 **held**(紅驚嘆號:被 mail rule 或 quota 擋下)。一台若有多個 `mail.box`,處理時要注意「resend all」只影響**當前**那個。

## mail.box:每封信的起點

`mail.box` 是 Domino 郵件伺服器上一個**放「在途郵件」的資料庫**。不管信怎麼進來——Notes client 用 Notes protocol、外部用 SMTP、網頁用 HTTP——第一步都一樣:**存進寄件人 home server 的 `mail.box`**。

一台伺服器可以有**好幾個** `mail.box`(在 mail.box 檢視裡會看到 `mail1.box`、`mail2.box`…)。多個 box 的用意是減少爭用:很多 client 同時「丟信進來」跟 Router「把信搬出去」如果擠在同一個資料庫,會互相卡;分成幾個就能分散。管理時要記得——後面講的「resend all」這類操作,**只作用在你當下開的那個 box**,其他 box 裡的信不會一起動。

## Router 怎麼決定下一步

Router task 的工作循環很單純([官方:The Domino mail router](https://help.hcl-software.com/domino/10.0.1/admin/conf_thedominomailrouter_c.html)):**「periodically checks MAIL.BOX for new or changed messages」**——定期去 `mail.box` 找新的或改過的信。找到一封,就**逐一讀它的收件人清單**,對每個收件人判斷:他的 mail file 在**本機**嗎?

- 在本機 → **直接投遞**到那個 mail file。
- 不在 → **轉送**到目的伺服器的 `mail.box`。

怎麼知道「往哪送」?Router 查它的 **routing table**,「checks its routing table to calculate the next 'hop'」算出每個收件人的下一跳;這些路由資訊來自 **Domino Directory**(「contains almost all of the essential information required for routing mail」)。同一個 **Notes named network** 內的伺服器,用 Notes routing「automatically transfer mail among themselves」——直接互轉;跨出去的,Domino 會算出該怎麼走、以及該用 SMTP 還是 NRPC。

## 兩種協定:NRPC 逐跳 vs SMTP

算好下一跳,Router 選一種協定把信送出去:

- **Notes routing(NRPC,預設)**:把信**搬進下一跳伺服器的 `mail.box`**,那台的 Router 再重複同一套動作,一跳一跳直到收件人的 **home server**。Notes rich text 一般就走這條。
- **SMTP(選用)**:**預設是關的**,要在 Configuration Settings 文件的 **Router/SMTP → Basics** 分頁開。常見的 **MIME-only** 模式下,只有已是 MIME 格式的訊息會走 SMTP(Notes rich text 仍走 NRPC);另有 **All messages** 模式會把 Notes 格式**先轉成 MIME 再走 SMTP**(代價是 fidelity 與效能損失),所以別以為「SMTP 絕不碰 Notes 格式」。送出時用 **DNS 的 MX record** 找出哪台收該網域的信、連 **port 25**。要注意分工:**SMTP listener 只負責「收」進來的信**、丟進 `mail.box` 就結束,**後續的轉送/投遞還是 Router 在做**。

一句話:NRPC 是 Domino 之間「box 傳 box」的逐跳接力,SMTP 是跟外部世界(或設定成全走 SMTP 時)用標準郵件協定對接。

## 投遞與取信

信一路跳到收件人的 **home server** 後,Router 把它**投進收件人的 mail file**([官方:信在 Domino 系統裡怎麼走](https://help.hcl-software.com/domino/11.0.1/admin/plan_howmailroutesinadominosystem_c.html))。到這裡 Router 的任務就結束了——之後使用者怎麼看到信,是另一回事:Notes client 用 Notes RPC、其他用 IMAP / POP3 / HTTP 去那個 mail file 把信取出來。

所以「信到了沒」有兩段要分清楚:**Router 有沒有把信投進 mail file**(路由問題),跟**使用者的 client 有沒有把信抓下來**(存取問題)——卡在哪一段,查的地方不一樣。

## 卡在 mail.box 的信:dead 與 held

`mail.box` 裡可能出現兩種**投不出去**的信,圖示就分得出來([官方:處理 mail.box 裡投不出去的信](https://help.hcl-software.com/domino/11.0.1/admin/conf_managingundeliverablemailinmailbox_t.html)):

- **dead(stop sign 圖示)**:Router **連「投遞」和「把失敗報告退回寄件人」都做不到**時,信就變 dead。官方舉的例子:收件人位址打錯、而寄件人的郵件伺服器又連不上——兩頭都送不了,信就死在 box 裡。
- **held(紅驚嘆號)**:Domino **收下了信、但刻意不投**,信會一直留在 `mail.box` 直到管理者放行。兩個常見來源(官方是分開描述的兩套機制,別當成同一個旗標):**mail rule**(伺服器規則命中,Domino 把訊息的 routing state 改成 `Held`)、以及 **quota**(收件人 mail file 超過配額、採 Hold and Retry 時先 hold 住;過了 `MailTimeout`〔notes.ini,預設 **1 天**〕還是投不了,就當投不出去退回寄件人)。

另外,**投不出去的信很多時候是「本機根本沒這個收件人」**;如果這種信**暴量**,很可能是 spam 在對你的網域做「字典攻擊」猜帳號——這本身就是個值得警覺的訊號。

**怎麼處理**:到 `mail.box` 裡可以**改正位址、release(放行)、或 delete(刪除)**。官方提醒:**release 之前先看 From / Recipients 欄位**——如果 From 或收件人是空的、位址無效、或失敗原因指向 null 的 SMTP reverse path,那就該**刪掉而不是放行**(放了也還是投不出去)。主控台的 `Show Server` 會報 dead mail 的數量;看到有,就去 `mail.box` 處理。再提醒一次:一台有多個 box 時,「resend all」**只放行你當下開的那個 box**。

## 小結

- **起點**:每封信都先進寄件人 home server 的 `mail.box`(在途佇列);一台可有多個 `mail1.box`/`mail2.box` 以減少爭用。
- **Router**:定期檢查 `mail.box`,逐收件人判斷「本機投遞」或「轉下一台」,路由資訊來自 Domino Directory。
- **協定**:預設 **NRPC**(box→box 逐跳到 home server);**SMTP** 選用、只走 MIME、DNS MX、port 25,在 Router/SMTP 分頁開;SMTP listener 只收、轉送仍由 Router 做。
- **投遞 vs 取信**:Router 投進 mail file 後,使用者才用 RPC/IMAP/POP3/HTTP 取——兩段要分開查。
- **卡信**:**dead**(投不出又退不回)vs **held**(mail rule 把 routing state 設 `Held`,或 quota 的 `MailTimeout` 機制——兩者分開);release 前先看 From/Recipients,無效就刪;多 box 時 resend all 只管當前。
