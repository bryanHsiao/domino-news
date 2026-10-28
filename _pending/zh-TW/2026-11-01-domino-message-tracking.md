---
title: "Domino message tracking:一封信到底送到哪了"
description: "使用者說「我寄的信對方沒收到」,你怎麼查這封信到底送到哪、卡在哪、還是根本沒出去?這就是 message tracking(郵件追蹤)。它記下每封信的「處理軌跡」——誰寄的、到哪去、什麼狀態——讓你在 Domino Administrator 的 Message Tracking Center 追一封信的下落。它跟上次的 mail journaling 不一樣:journaling 留的是整封信的複本,tracking 留的是「這封信去了哪」的 metadata。這篇講怎麼開(Configuration Settings 文件的 Router/SMTP → Message Tracking,預設是關的)、負責收集的 MTC(Mail Tracking Collector)task 怎麼把 Router 產生的追蹤 log 收進 MTSTORE.NSF、幾個要注意的選項(收集間隔預設 15 分、要不要記主旨預設是不記的隱私考量、誰能追蹤預設只有 LocalDomainServers、保留天數靠複寫設定控制),以及 tell mtc 的幾個主控台指令。"
pubDate: 2026-11-01T07:30:00+08:00
lang: zh-TW
slug: domino-message-tracking
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Configuring the server for message tracking(在 Router/SMTP→Message Tracking 開、collection interval 15 分、Log message subjects 預設 No、Allowed to track 預設 LocalDomainServers、Tracking Center 追單一信)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_configuringtheserverformessagetracking_t.html"
  - title: "Controlling the Mail Tracking Collector(MTC 建 MTSTORE.NSF 於 MTDATA、收集 Router 的 MTC log、tell mtc process/quit/compact/reindex/purge)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_controllingthemailtrackingcollector_c.html"
  - title: "Tools for mail monitoring(message tracking 在整套郵件監控工具裡的位置)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_toolsformailmonitoring_c.html"
relatedJava: []
relatedSsjs: []
---

使用者說「我上午寄的那封信對方沒收到」,你怎麼查它到底**送到哪、卡在哪、還是根本沒出去**?這就是 **message tracking(郵件追蹤)** 的用途:它記下每封信的「處理軌跡」——誰寄的、往哪去、什麼狀態——讓你在 **Message Tracking Center** 追一封信的下落。它跟上一篇的 [mail journaling](/domino-news/posts/domino-mail-journaling/) 不一樣:journaling 留的是**整封信的複本**,tracking 留的是**「這封信去了哪」的 metadata**——一個是存內容,一個是記軌跡。

---

## 重點摘要

- **是什麼**:記錄 message-handling 活動(誰寄給誰、到哪、狀態),讓你追蹤單一信件的下落。**跟 journaling 的差別**:journaling 存複本(內容)、tracking 存 metadata(軌跡)。
- **怎麼開**:**預設關**。在 **Configuration Settings 文件 → Router/SMTP → Message Tracking** 分頁把 **Message tracking** 設 Enabled。
- **誰在收集**:**MTC(Mail Tracking Collector)** task——開啟後它**自動建 `MTSTORE.NSF`**(放在 data 目錄下的 **MTDATA** 子目錄),並**定期**從 Router 產生的追蹤 log 檔把資料收進這個 store。
- **要注意的選項**:**collection interval**(多久收一次、分鐘,**預設 15**,官方提醒會影響效能)、**Log message subjects**(要不要記**主旨**,**預設 No**——記主旨有隱私考量)、**Don't track messages for**(排除某些人/群組)、**Allowed to track messages**(誰能追蹤,**留空=只有 LocalDomainServers 群組**)、**保留天數**靠**資料庫複寫設定**控制(不是在這個分頁設)。
- **怎麼追**:在 Domino Administrator 的 **Tracking Center** 分頁,追單一信件的**狀態**。
- **MTC 指令**:`tell mtc process`(立即收集)、`tell mtc quit`(停 MTC 但不停 Router)、`tell mtc compact`、`tell mtc reindex`、`tell mtc purge <天數>`。

## 是什麼,跟 journaling 差在哪

message tracking 是 Domino [一整套郵件監控工具](https://help.hcl-software.com/domino/11.0.1/admin/admn_toolsformailmonitoring_c.html)裡的一個;它做的是**記軌跡**:每封信被處理時,Router 會把「這封信怎麼被處理的」資訊記下來,之後你可以用這些記錄**追一封特定的信**——它送達了嗎?在哪一台?什麼時候?

這跟上一篇的 **journaling** 很容易混,但目的不同:

- **journaling**:複製**整封信的內容**存底(合規、備查)。
- **message tracking**:只記「**這封信去了哪、狀態如何**」的 **metadata**(診斷、追蹤)。

所以「我要能重現整封信」用 journaling;「我要知道這封信送到沒、卡在哪」用 tracking。

## 怎麼開,誰在收集

開啟在 **Configuration Settings 文件 → Router/SMTP → Message Tracking** 分頁([官方:設定伺服器 message tracking](https://help.hcl-software.com/domino/10.0.1/admin/admn_configuringtheserverformessagetracking_t.html)),把 **Message tracking** 設成 **Enabled**(預設 Disabled)。

開了之後,真正做事的是 **MTC(Mail Tracking Collector)** task([官方:控制 MTC](https://help.hcl-software.com/domino/14.0.0/admin/admn_controllingthemailtrackingcollector_c.html)):

- 它**自動建出 `MTSTORE.NSF`**(MailTracker Store),放在 data 目錄下的 **MTDATA** 子目錄。
- Router 一邊處理信、一邊產生原始的追蹤 log 檔;MTC task **定期**把這些 log 的資料**收集**進 `MTSTORE.NSF`。
- 所以有兩段:**Router 產 log → MTC 收進 store → Tracking Center 讀 store**。

## 幾個要注意的選項

同一個 Message Tracking 分頁上,有幾個值得留意:

- **Message tracking collection interval**:MTC 多久收一次,單位分鐘。官方說這個數字**會影響伺服器效能**,建議用**預設的 15 分鐘**。
- **Log message subjects**:要不要把**主旨**也記進 store,**預設 No**。記主旨對「用主旨找信」很方便,但有**隱私**考量(等於把每封信的主旨都留下來)——另有 **Don't log subjects for** 可排除特定寄件人。
- **Don't track messages for**:列出不追蹤其寄件的人/群組(例如把 ISpy 探測信排除,免得塞進 `MTSTORE.NSF`)。
- **Allowed to track messages / Allowed to track subjects**:誰有權在這台追蹤訊息(或追主旨)。**留空(預設)時,只有 LocalDomainServers 群組的成員**能追——所以不是誰都能隨手查別人的信軌跡。
- **保留多久**:這個分頁**不設**保留天數;要限制 `MTSTORE.NSF` 留幾天的資料,是用**資料庫的複寫設定**(replication settings)去控。

## 怎麼追一封信

開了之後,到 Domino Administrator 的 **Messaging → Tracking Center** 分頁,就能**追單一信件的狀態**。給它寄件人/收件人/時間等線索,它去 `MTSTORE.NSF` 查出這封信的處理軌跡,告訴你它走到哪、送達了沒。

(需要停 MTC、立即收集、或維護 store 時,用主控台的 `tell mtc` 系列:`tell mtc process` 立即收、`tell mtc quit` 停 MTC(不停 Router)、`tell mtc compact` / `reindex` / `purge <天數>` 做維護。)

## 小結

- **是什麼**:記每封信的處理軌跡(metadata),用來追蹤單一信件;跟 journaling(存複本)分工不同。
- **怎麼開**:Configuration Settings → Router/SMTP → Message Tracking → Enabled(預設關)。
- **誰收集**:MTC task 建 `MTSTORE.NSF`(MTDATA 子目錄),定期把 Router 的追蹤 log 收進去。
- **選項**:collection interval 預設 15 分(影響效能)、Log subjects 預設 No(隱私)、Don't track for、Allowed to track 留空=只 LocalDomainServers、保留靠複寫設定。
- **怎麼追**:Domino Administrator 的 Tracking Center 分頁;維護用 `tell mtc process/quit/compact/reindex/purge`。
