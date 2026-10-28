---
title: "Domino 外出通知:為什麼該用 Service 而不是 Agent"
description: "使用者設了外出自動回覆,回來忘了關、系統還在亂回信,或回覆總慢半拍——這跟你伺服器把 Out of Office 設成哪一型有關:Service 還是 Agent。這篇講兩型差在哪(Service 跑在 mail router 裡、回覆即時、支援 failover、delegation 整合行事曆、而且到期會自己關、還能設不到一天的區間;Agent 是排程跑、預設一天四次、到期要手動關、delegation 不整合行事曆、最短只能設一天)、在哪設(Server Configuration 文件的 Router/SMTP → Advanced → Control,預設是 Agent)、為什麼現在幾乎都該用 Service,以及兩個操作:從 Files 分頁的 Out of Office 欄看誰在外出、用 Tell router O 列出有啟用 Service 的信箱。"
pubDate: 2026-10-27T07:30:00+08:00
lang: zh-TW
slug: domino-out-of-office
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Designating the Out of Office service type(Service vs Agent、在 Server Configuration Router/SMTP→Advanced→Control 設、預設 Agent、各自優缺)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/conf_designatingtheoutofofficeservicetype_t.html"
  - title: "Set user name and enable schedule agent(從 Notes client 啟用 OOO agent 時產生的請求、需 Editor access)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_setusernameandenablescheduleagent_r.html"
  - title: "Setting up out-of-office notifications(Notes client 這端怎麼設外出)— HCL Notes(官方)"
    url: "https://help.hcl-software.com/notes/12.0.0/client/mail_ooo_t.html"
relatedJava: []
relatedSsjs: []
---

使用者出差設了外出自動回覆,回來忘了關、系統還在對每封新信亂回;或是外出回覆總慢半拍、隔一兩小時才送出。這些症狀多半不是 bug,而是你伺服器把 **Out of Office(外出通知)** 設成了哪一型——**Service** 還是 **Agent**。兩型行為差很多,而現在的環境幾乎都該用 Service。(使用者自己在 client 怎麼開外出,見 [Notes 設定外出通知](https://help.hcl-software.com/notes/12.0.0/client/mail_ooo_t.html);這篇講的是**伺服器端**兩型的差別與選擇。)

---

## 重點摘要

- **兩型**:**Out of Office Service** 與 **Out of Office Agent**。在 **Server Configuration 文件 → Router/SMTP → Advanced → Control** 的 Miscellaneous 區設定;官方預設是 **Agent**。
- **Service 好在哪**:它**跑在 mail router 裡**,所以**回覆是即時的**、支援**伺服器 failover**;delegation(委派)**整合行事曆管理**;到期後**處理完第一封信就自己關掉**;而且區間可以設**不到一天(但要大於一小時)**。
- **Agent 的差別**:它是**排程**跑的,預設**一天四次**;到期**要手動關**(不然就會一直回);delegation 支援但**不整合行事曆**;最短區間**一天**;委派還要在 Server 文件給「代簽 agent」的權限。
- **該選哪個**:Service 是給「全部都是 Domino 8 以上、用 MAIL8.NTF」的環境用的——也就是現在幾乎所有環境。所以除非你還有 Domino 8 以前的舊伺服器,**都該用 Service**。
- **兩個操作**:誰正在外出,看 Domino Administrator **Files 分頁的 Out of Office 欄**;要列出有啟用 Service 的信箱,用 router 指令 **`Tell router O`**。

## 兩型:Service vs Agent

Out of Office 有兩種實作,決定它「怎麼跑」([官方:指定 Out of Office 服務類型](https://help.hcl-software.com/domino/14.0.0/admin/conf_designatingtheoutofofficeservicetype_t.html)):

- **Out of Office Service**:外出回覆的邏輯**內建在 mail router**。
- **Out of Office Agent**:一個**排程 agent**,固定時間跑過信箱、對該回的信補回覆。

設定的地方在 **Server Configuration 文件**:Configuration → Server → Configurations,編輯該文件,到 **Router/SMTP → Advanced → Control**,在 Miscellaneous 區找 **Out of Office service type**。官方講得很直接:**「By default, the Out of Office service type is Agent.」**——預設是 Agent,所以如果你沒改過,你的環境跑的就是舊的那一型。

## Service 好在哪

把外出邏輯放進 router,帶來幾個 Agent 做不到的好處:

- **即時**:信一進來、router 當下就回。官方:**「Out of Office responses are instantaneous, server failover is supported.」**——不但即時,還支援**伺服器 failover**。
- **委派整合行事曆**:delegation 支援,而且**跟行事曆管理整合**(委派對象要有至少 **Editor** 的 ACL 權限)。
- **會自己關**:到期後**處理完第一封信就自動停用**——官方:**「The service disables itself after processing the first email.」** 這正是「回來忘了關」最好的解方。
- **可設短區間**:支援**不到一天、但大於一小時**的外出區間(臨時下午離開幾小時也能用)。

## Agent 的差別

Agent 是舊機制,幾個關鍵差異會咬人:

- **排程、不是即時**:官方「By default, the agent executes four times each day on a schedule.」——一天跑四次,所以外出回覆會**慢半拍**(等下一次排程才送)。
- **要手動關**:**「The agent must be manually disabled when the Out of Office time period expires.」**——到期不會自己停,忘了關就會一直回信。
- **委派不整合行事曆**:支援 delegation,但**沒跟行事曆整合**;而且委派對象除了 Editor,還要有在 Server 文件授予的「代替他人簽署 agent」權限。
- **最短一天**:區間最短只能設**一天**,沒辦法像 Service 那樣設幾小時。

(使用者在 Notes client **設定並啟用**外出時〔Tools → Out of Office、完成對話框〕,會對信箱產生一個[啟用排程 agent 的請求](https://help.hcl-software.com/domino/11.0.1/admin/admn_setusernameandenablescheduleagent_r.html),且使用者需要對該信箱有 **Editor** 權限才設得了。)

## 該選哪個

官方的適用條件很清楚:**Service** 用於「全部是 Domino 8 伺服器、使用 Notes 8 mail 範本(MAIL8.NTF)」的叢集;**Agent** 用於「含任何 Domino 8 以前伺服器」的叢集。

翻成白話:**現在的環境幾乎都是 Domino 8 以上,所以該用 Service**——即時、會自己關、委派整合行事曆、還能設短區間,全面優於 Agent。只有你還留著 Domino 8 以前的舊伺服器時,才需要退回 Agent。改 **Out of Office service type** 這個欄位,就是在這兩者間切換。

## 兩個查的操作

- **誰正在外出**:Domino Administrator 的 **Files 分頁**有一個 **Out of Office 欄**,直接看哪些信箱目前是外出狀態(這一欄反映的是 Out of Office **Service** 的狀態)。
- **列出有啟用 Service 的信箱**:在主控台用 router 指令 **`Tell router O`**,列出目前有啟用 Out of Office Service 的資料庫。(外出邏輯在 router 裡,所以是用 router 指令查——這也呼應它跟 [mail 路由](/domino-news/posts/domino-mail-routing-mailbox/) 共用同一個 Router task。)

## 小結

- **兩型**:Service(router 內建)vs Agent(排程);在 Server Configuration 的 Router/SMTP → Advanced → Control 設,預設 Agent。
- **Service**:即時、支援 failover、委派整合行事曆、到期自動關、可設 <1 天(>1 小時)的區間。
- **Agent**:一天排程四次(慢半拍)、要手動關、委派不整合行事曆、最短一天。
- **選擇**:Domino 8 以上環境(= 現在幾乎所有環境)都該用 **Service**;只有還有 8 以前舊伺服器才用 Agent。
- **查**:Files 分頁 Out of Office 欄看誰在外出;`Tell router O` 列有啟用 Service 的信箱。
