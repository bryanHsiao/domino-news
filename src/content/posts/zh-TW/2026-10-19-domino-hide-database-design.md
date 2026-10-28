---
title: "隱藏資料庫設計:出貨 template 前先鎖設計"
description: "你把一個 template 交給客戶或裝到對方伺服器,不想讓人看到、改到裡面的表單公式和 LotusScript——這就是「隱藏資料庫設計」在做的事。它一勾下去,官方的說法是「disables all design operations and hides all formulas and scripts」:View → Design 消失、表單/檢視/agent 不能看不能改、公式與程式碼看不到、設計也不能複製。這篇講它怎麼做(透過 Replace Design 勾「Hide formulas and LotusScript」,或繼承一個設計已隱藏的 template)、關掉了哪些操作、為什麼它不是「加密鎖」(對有 Designer/Manager 權限的人不是永久防線,要配 ACL)、一個沒有退路的重點——沒有「取消隱藏」這回事,你一定要自己留一份沒隱藏的 template,以及隱藏設計會擋住 agent 變更、要怎麼用 @Command[AgentEnableDisable] 處理。"
pubDate: 2026-10-19T07:30:00+08:00
lang: zh-TW
slug: domino-hide-database-design
tags:
  - "Domino Designer"
  - "Admin"
sources:
  - title: "Hiding the design of a database(隱藏設計關掉哪些操作、怎麼做、要移除 Designer/Manager 權限、留著未隱藏 template)— HCL Domino Designer(官方)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_HIDING_THE_DESIGN_OF_A_DATABASE.html"
  - title: "Replacing a design(Replace Design 勾「Hide formulas and LotusScript」隱藏設計)— HCL Domino Designer(官方)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html"
  - title: "Templates and master templates(未隱藏的 template 才是你改設計的來源)— HCL Domino Designer(官方)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_TEMPLATES_AND_MASTER_TEMPLATES_.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-hide-database-design.webp"
coverStyle: "paper-craft"
---

你把一個 template 交給客戶、或裝到對方的伺服器,不想讓人看到、也改不到裡面的表單、公式和 LotusScript——這就是「**隱藏資料庫設計(Hide design)**」要做的事。它一勾下去,整個庫的設計就被封起來:設計師工具打不開、公式與程式碼看不到。

這是上一篇[模板繼承](/domino-news/posts/domino-template-inheritance-design-task/)的自然續集:template 負責把設計**發**出去,而隱藏設計負責在你**把成品交出去**時,保護裡面的智慧財產。但它有個很多人沒搞清楚、交出去才後悔的重點——**沒有「取消隱藏」這回事**。

---

## 重點摘要

- **它在做什麼**:官方一句話——隱藏設計「**disables all design operations and hides all formulas and scripts**」。View → Design 消失;表單、檢視、agent 不能看也不能改;公式/LotusScript/simple action 看不到;連設計都不能複製或複寫。
- **怎麼做**:從 template 建庫後,**File → Application → Replace Design**,勾「**Inherit future design changes**」+「**Hide formulas and LotusScript**」→ Replace。或讓庫**繼承一個設計已隱藏的 template**。
- **它不是加密鎖**:對**有 Designer / Manager 權限**的人,隱藏**不是永久防線**——他們還是能 Replace Design 把設計換掉。要真的鎖住,得**配 ACL**:把會改設計的人的 Designer/Manager 權限拿掉。
- **沒有退路**:官方沒有「反隱藏」的動作。你改設計的唯一來源,是你**自己保留的那份沒隱藏的 template**——所以**務必留著它、而且只給授權的設計者**。
- **會擋 agent**:隱藏設計會擋住 agent 變更。需要使用者觸發的 agent,排程設「**Choose when agent is enabled**」,再用 `@Command[AgentEnableDisable]` 做一個按鈕/動作去啟用它。

## 它關掉的到底是什麼

隱藏設計不是「把某幾個元素設 hide-when」那種顯示控制,而是**把整個庫的設計操作關掉**。[官方](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_HIDING_THE_DESIGN_OF_A_DATABASE.html)列出使用者**不能**做的事:

- 看任何設計元素的設定(**View → Design 整個不見**)。
- 修改、新增、刪除欄位、表單、navigator、page、subform。
- 修改或刪除既有檢視;看、刪、改既有 agent,或新增 shared agent。
- 看或改公式、LotusScript、simple action 公式。
- 改 Database Open 屬性、顯示 design synopsis、複製或複寫設計。

一句話:交出去的那份庫,**可以用,但打不開、改不動、抄不走**。

## 怎麼做:透過 Replace Design 勾隱藏

隱藏是在**套用設計時**一起做的——具體就是用 **Replace Design**(把一個庫整包換成某 template 的操作,見[官方:取代設計](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html))時,在對話框勾上隱藏選項:

1. 從你的 template 建出目標庫。
2. **File → Application → Replace Design**,選那個 template。
3. 勾「**Inherit future design changes**」+「**Hide formulas and LotusScript**」。
4. Replace → Yes。

之後要更新這個已隱藏庫的設計,就靠它繼承的那個 template:**你在未隱藏的 template 上改好、再 refresh 繼承它的庫**(繼承怎麼運作見[模板繼承那篇](/domino-news/posts/domino-template-inheritance-design-task/))。

## 它不是加密鎖:要配 ACL

這是最容易被誤解的地方。隱藏設計**擋的是「看與改設計」的操作**,但它**不是對所有人的永久鎖**——官方明講,**有 Designer 或 Manager 權限**的使用者「can replace the database design, thereby changing it」:他們照樣能用 Replace Design 把設計整包換掉。

所以要真的保護設計,隱藏只是第一層,第二層是 **ACL**:[把會改設計的人的 Designer/Manager 權限拿掉](/domino-news/posts/notes-acl-entry/)(官方原文「To fully protect database design, remove Designer and Manager access from users who can change the database design」)。兩層一起,設計才算真的鎖住。

## 沒有退路:一定要自己留未隱藏的 template

這是交出去才後悔的那一條:**官方文件沒有提供任何「取消隱藏(unhide)」的操作**。頁面通篇沒有「反隱藏」這個步驟——要改一份已隱藏庫的設計,官方指示的唯一途徑,是透過它繼承的那份**未隱藏 template** 去改、再 refresh 下來。

你唯一能改設計的來源,是**你自己保留的那份「沒隱藏」的 [template](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_TEMPLATES_AND_MASTER_TEMPLATES_.html)**——在它上面改、再把變更 refresh/replace 到交出去的庫。所以官方的提醒很實際:

- **留著未隱藏的 template**,而且「**do not give the template to anyone except authorized designers**」——別把未隱藏的 template 一起交出去。
- 別把公式與 LotusScript 的說明文件也一起發出去。

一句話:**隱藏的是副本,母帶要自己收好**。母帶弄丟了,那份設計你自己也改不了。

## 別忘了 agent

隱藏設計會**擋住 agent 的變更**,這會咬到「需要使用者輸入才跑」的 agent。官方的建議是:先**測好 agent**;需要使用者觸發的,把排程設成「**Choose when agent is enabled**」,再用 `@Command[AgentEnableDisable]` 做一個按鈕或動作讓使用者去啟用它——因為隱藏設計之後,你沒辦法再進去改 agent。

## 小結

- **是什麼**:把整個庫的設計操作關掉——官方「disables all design operations and hides all formulas and scripts」;View→Design 消失、元素不能看不能改、設計不能複製。
- **怎麼做**:Replace Design 勾「Inherit future design changes」+「Hide formulas and LotusScript」,或繼承一個設計已隱藏的 template。
- **不是加密鎖**:對 Designer/Manager 不是永久防線——要**配 ACL**拿掉他們的權限才算真鎖。
- **沒有退路**:沒有「取消隱藏」;改設計唯一來源是**你自留的未隱藏 template**,務必收好、別外流。
- **會擋 agent**:需使用者觸發的 agent 用「Choose when agent is enabled」+ `@Command[AgentEnableDisable]`。
