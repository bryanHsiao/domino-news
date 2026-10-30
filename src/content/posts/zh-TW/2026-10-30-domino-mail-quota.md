---
title: "Domino mail quota:超過配額時,信到底會怎樣"
description: "你給每個信箱設了配額,以為超過就會自動擋信?不一定——Domino 的預設是「Deliver anyway」,配額設了也照送。真正決定「信箱爆了之後新信會怎樣」的,是你另外選的 over quota enforcement。這篇講兩個限制(quota 硬上限 + warning threshold 預警,且要先有 quota 才設得了 threshold)、Router 什麼時候比對大小(每次投遞)、三種 enforcement(Deliver anyway 照送、Non delivery to originator 退一封 NDR 給寄件人、Hold mail and retry 把信卡在 MAIL.BOX 等空間、過期預設一天就退回)、Hold and retry 的子選項(放得下的先投 vs 全部 hold、每人最多 hold 幾封),以及一個常被忽略的大小計算差異:預設算檔案含空白、刪了信不會馬上釋放配額;換成只算實際用量的算法,搭配 transaction logging 更省事。"
pubDate: 2026-10-30T07:30:00+08:00
lang: zh-TW
slug: domino-mail-quota
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Setting mail file quotas(quota 硬上限 + warning threshold 預警、要先有 quota)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_settingmailfilequotas_c.html"
  - title: "Setting quota controls for the Router(三種 over quota enforcement:Deliver anyway/Non delivery to originator/Hold mail and retry、子選項、過期 1 天、在 Delivery Controls→Quota Controls 設)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_settingquotacontrolsfortherouter_t.html"
  - title: "Notifying users who exceed a mail file quota or warning threshold(通知 None/per message/per interval、大小計算兩法)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_notifyinguserswhoexceedamailfilequotaorwarningt_c.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-mail-quota.webp"
coverStyle: "watercolor"
---

你給每個信箱設了配額,以為信箱一爆、新信就會被擋下來?**不一定**。Domino 的預設行為是 **「Deliver anyway」——配額設了,照送**。配額本身只是一個數字;真正決定「信箱爆掉之後新信會怎樣」的,是你另外選的 **over quota enforcement(超額處理方式)**。這篇把配額、預警、三種超額處理,還有一個常被忽略的「大小怎麼算」講清楚。

---

## 重點摘要

- **兩個限制**:**quota**(硬上限)與**warning threshold**(預警門檻,在快到上限時先提醒使用者自己清)。順序上**要先設 quota 才能設 threshold**。
- **何時比對**:開了 enforcement 之後,Router **每次投遞**都會拿目標信箱的**當前大小**跟 quota/threshold 比。
- **三種 enforcement**(在 Configuration Settings 文件 → Router/SMTP → Restrictions and Controls → **Delivery Controls → Quota Controls**):
  - **`Deliver anyway (don't obey quotas)`**:**預設**——照送、不理配額。
  - **`Non delivery to originator`**:不投,**退一封 NDR** 給寄件人說對方信箱滿了。
  - **`Hold mail and retry`**:不投,把信**卡在 MAIL.BOX** 等空間釋放、之後重試;過期(預設**一天**)還是投不了就**退回寄件人**。
- **Hold and retry 子選項**:`Attempt delivery of each message`(**開**=放得下的先投、其餘 hold;**關**=全部 hold 到信箱縮小)、`Maximum number of messages to hold per user`(超過就對後續每封回失敗報告、FIFO)、`Maximum message size to hold`。
- **大小怎麼算(容易忽略)**:預設算法連**空白(white space)**一起算,所以**刪了信不會馬上釋放配額**;換成只算「實際用量」的算法,搭配 transaction logging 更省事(不需要管理者去 compact)。

## 兩個限制:quota 與 warning threshold

配額管理有兩個數字([官方:設定 mail file quota](https://help.hcl-software.com/domino/12.0.0/admin/conf_settingmailfilequotas_c.html)):

- **quota**:信箱大小的**硬上限**。
- **warning threshold**:一個**預警門檻**,在信箱快到 quota 時先提醒使用者,讓他有機會自己清、免得真的滿了被擋。要注意:**threshold 必須在已經有 quota 的前提下才設得了**。

但光設這兩個數字,**預設什麼都不會發生**——因為 enforcement 預設是「照送」。要讓配額真的「有效」,得去設下面的超額處理。

## 三種超額處理

enforcement 設定在 **Delivery Controls → Quota Controls**([官方:Router 的 quota controls](https://help.hcl-software.com/domino/10.0.1/admin/conf_settingquotacontrolsfortherouter_t.html))。開了之後,Router **每次投遞**都比對目標信箱大小,超過就按你選的方式處理:

- **`Deliver anyway (don't obey quotas)`(預設)**:**照送**,完全不理配額。所以「我設了配額怎麼還是一直收信」——多半就是這個預設沒改。
- **`Non delivery to originator`**:**不投**,直接**退一封 NDR** 給寄件人,說收件人信箱滿了。寄件人會知道沒送到。
- **`Hold mail and retry`**:**不投、但先留著**——把信**卡在 MAIL.BOX** 等收件人清出空間,之後重試。這就是[mail 路由那篇](/domino-news/posts/domino-mail-routing-mailbox/)講的 held mail 的另一個來源。信**過期**(預設**一天**,與 Router 的訊息逾時 `MailTimeout` 一致)還是投不了,就當投不出去**退回寄件人**。

## Hold and retry 的子選項

選了 Hold and retry,還有幾個細節控制:

- **`Attempt delivery of each message`**:**開啟**時,放得進剩餘空間的信**先投、投得出去的就投**,其餘才 hold;**關閉**時,**全部 hold** 到信箱縮小為止。
- **`Maximum number of messages to hold per user`**:每人最多在 MAIL.BOX hold 幾封;**超過之後**,對後續每一封都**回一封失敗報告**給寄件人(先進先出)。
- **`Maximum message size to hold`**:超過這個大小的信,就不 hold、直接回失敗報告。

## 一個常被忽略的點:大小怎麼算

配額比對用的「信箱大小」怎麼算,方法不只一種,差別會咬人([官方:超額通知與偵測](https://help.hcl-software.com/domino/11.0.1/admin/conf_notifyinguserswhoexceedamailfilequotaorwarningt_c.html))。最常拿來對比的是這兩種:

- **Check file size when extending the file(預設)**:算的是**檔案大小、含空白(white space)**。問題是——使用者**刪了信,檔案裡的空白不會馬上消失**,所以**配額不會立刻釋放**,他可能刪了半天還是「超過」,要等 compact 回收空白才算數。
- **Check space used in file when adding a note**:只算**實際用掉的空間**(白空間不計),刪信後釋放得比較即時。官方建議在**開了 transaction logging** 的環境用這個——因為開了日誌後使用者沒辦法自己 compact、要管理者介入,改用這個不吃白空間的算法就不用(translog 本身見[交易日誌那篇](/domino-news/posts/domino-transaction-logging/))。

(嚴格說這個設定〔`NSF_QUOTA_METHOD`,在 Server 文件 Transactional Logging 分頁〕共有**三種**,還有一個更嚴格的「Check file size when adding a note」〔含白空間、且每加一筆都檢查〕;上面兩種是配額管理最常對比的。)

所以「使用者說他刪到快哭了、系統還是說他超過」,常常不是配額算錯,是用了含空白的算法、空白還沒被回收。

## 通知與 iNotes

- **通知頻率**:超過 threshold 或 quota 時要不要通知、多久通知一次,可設 **None / 每封信(per message)/ 每隔一段時間(per interval)**。
- **iNotes**:iNotes 使用者**預設在到達配額時不能寄信、也存不了**;notes.ini `iNotes_wa_Ignore_Quota=1` 可讓他「能寄、但不存檔」。

## 小結

- **兩個限制**:quota(硬上限)+ warning threshold(預警,要先有 quota)。
- **預設不擋**:enforcement 預設是 **Deliver anyway**,配額設了不代表會擋——要另外選處理方式。
- **三種處理**:`Deliver anyway`(照送)/ `Non delivery to originator`(退 NDR)/ `Hold mail and retry`(卡 MAIL.BOX、過期一天退回)。
- **Hold 子選項**:放得下先投 vs 全部 hold、每人最多 hold 幾封、最大可 hold 大小。
- **大小算法**:預設含空白(刪信不馬上釋放)vs 只算用量(搭 translog 更即時)。
- **其他**:通知 None/per-message/per-interval;iNotes 到配額預設擋送(`iNotes_wa_Ignore_Quota`)。
