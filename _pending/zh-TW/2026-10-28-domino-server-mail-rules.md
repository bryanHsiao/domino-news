---
title: "Domino 伺服器 mail rules:信進信箱前就先攔下來"
description: "有些信你根本不想讓它進到使用者信箱——帶某種附件的擋掉、寄給離職帳號的轉走、某類信留一份備查。這些不用寫 agent:Domino 的伺服器 mail rules 會在信還在 MAIL.BOX、router 處理它的當下就套用。這篇講在哪設(Configuration Settings 文件的 Router/SMTP → Restrictions and Controls → Rules)、它什麼時候跑(信沉進 MAIL.BOX 時、每封只評一次,跟使用者信箱裡的 client 規則不同)、條件怎麼寫(contains/is 等運算子、不支援萬用字元、可用 AND/OR 串、大小寫不分)、六種動作(Journal 留底、Move to database 隔離、Don't accept 直接拒、Don't deliver 靜默刪或回 NDR、Change routing state 設成 HOLD、Stop processing 停掉後續規則),以及兩個要知道的點:預設不會通知寄件人或收件人、而且 mail rules 不是防毒方案。"
pubDate: 2026-10-28T07:30:00+08:00
lang: zh-TW
slug: domino-server-mail-rules
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Setting server mail rules(在 Router/SMTP→Restrictions and Controls→Rules 設、MAIL.BOX 沉積時跑、conditions 運算子與無萬用字元、六種 actions、不通知、非防毒、set rules reload)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_settingservermailrules_t.html"
  - title: "Filtering mail using rules(使用者信箱裡的 client-side 規則,與伺服器規則對照)— HCL Notes(官方)"
    url: "https://help.hcl-software.com/notes/12.0.0/client/mail_rules_t.html"
  - title: "Setting delivery controls(同在 Router/SMTP→Restrictions and Controls 的投遞控制,如最大訊息大小)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/conf_settingdeliverycontrols_t.html"
relatedJava: []
relatedSsjs: []
---

有些信你根本不想讓它進到使用者信箱:帶某種附件的直接擋、寄給離職帳號的轉去別處、某類信留一份備查。這些**不用寫 agent**——Domino 的**伺服器 mail rules** 會在信還躺在 **MAIL.BOX**、router 處理它的那一刻就套用。它跟使用者信箱裡自己設的規則是兩回事:一個在伺服器端、信進信箱前;一個在 client 端、信進信箱後。

---

## 重點摘要

- **在哪設**:Domino Administrator → **Configuration → Messaging → Configurations**,編輯 **Configuration Settings 文件**,到 **Router/SMTP → Restrictions and Controls → Rules**。規則就存在這份 Configuration Settings 文件裡。
- **何時跑**:在信**沉進 MAIL.BOX** 的時候套用(**不是**在使用者信箱),而且**每封信只評估一次**。這跟使用者在 Notes 信箱裡設的 [client 規則](https://help.hcl-software.com/notes/12.0.0/client/mail_rules_t.html)不同——那是信進信箱**之後**才在信箱裡跑。
- **條件**:挑一個 item(Sender、Subject、Body、附件名、Size…)配一個運算子(**contains / does not contain / is / is not / is less than / is greater than**);可用 **AND/OR** 串、每個條件可加一個例外;**不支援萬用字元**(用 contains 搭關鍵字,不要用 `*`);文字比對**不分大小寫**。
- **六種動作(一條規則只能一個)**:**Journal**(留底一份、繼續投遞)、**Move to database**(搬去另一個庫隔離)、**Don't accept**(直接拒收)、**Don't deliver**(靜默刪除,或回一封 NDR)、**Change routing state**(標成 **HOLD**、卡在 MAIL.BOX 等管理者處理)、**Stop processing**(停掉這封信後續的規則)。
- **兩個要知道的點**:規則擋信時,**預設不通知**寄件人或收件人;而且官方明講 **mail rules 不是防毒方案**。

## 它在哪、什麼時候跑

伺服器 mail rules 設定在 **Configuration Settings 文件**裡([官方:設定伺服器 mail rules](https://help.hcl-software.com/domino/14.5.0/admin/conf_settingservermailrules_t.html)):Configuration → Messaging → Configurations,編輯該文件,到 **Router/SMTP → Restrictions and Controls → Rules**,按 New Rule。(同一個 Restrictions and Controls 區底下還有別的投遞層控制,例如[投遞控制](https://help.hcl-software.com/domino/11.0.0/admin/conf_settingdeliverycontrols_t.html)裡的最大訊息大小——mail rules 是其中偏「按規則分流」的那一塊。)

關鍵是**時機**:規則是在信**被 router 放進 MAIL.BOX 時**評估的——也就是在它被投進任何人的信箱**之前**。而且官方寫明**「Each message is evaluated only once」**,每封信只評一次。這正是它跟 client 端規則最大的差別:

- **伺服器 mail rules**:伺服器端、MAIL.BOX、信進信箱**前**、對**所有經過的信**生效。
- **client 規則**:使用者信箱裡、信進信箱**後**、只對那個人的信箱。

改了規則不會馬上生效,要等伺服器**重新載入**:約**每五分鐘**自動 reload 一次,或在主控台打 **`set rules`** 立刻套用。

## 條件怎麼寫

一條規則由一個或多個**條件**組成。每個條件:挑一個訊息 item(Sender、Subject、Body、附件名、Size…),配一個運算子:

- 文字類:**contains / does not contain / is / is not**。
- 數值類(如 Size):**is less than / is greater than**(數值要用數字填)。

幾個實務點:條件可以用 **AND / OR** 串起來、每個條件可加**一個例外**;**不支援萬用字元**——官方「Text fields do not support wildcard values」,所以別用 `*`,改用 **contains** 加關鍵字;文字比對**不分大小寫**。

## 六種動作(一條規則一個)

條件命中後,執行一個**動作**(每條規則只能設一個):

- **Journal this message**:把信**複製一份**送到 journaling 資料庫,然後**繼續正常投遞**(留底、不影響送達;journaling 要另外在 Router/SMTP → Advanced → Journaling 開)。
- **Move to database**:把信從 MAIL.BOX **搬到另一個資料庫隔離**(那個庫要**先存在**),常用來把可疑信丟進 graveyard 庫。
- **Don't accept message**:**直接拒收**,Domino 不另外產生投遞失敗報告。
- **Don't deliver message**:伺服器收下但不投——可選**靜默刪除**,或**回一封 NDR**(退信通知)給寄件人。
- **Change routing state**:把訊息標成 **HOLD**,信就卡在 MAIL.BOX、等管理者處理。(這正是[mail 路由那篇](/domino-news/posts/domino-mail-routing-mailbox/)講的 held mail 的其中一個來源——routing state 被 mail rule 改成 Held。)
- **Stop processing**:**停掉**這封信後面還沒跑的規則(排在這條之後的規則就不再套)。

## 兩個要先知道的點

- **預設不通知**:規則擋下一封信時,官方明講 **「Domino does not notify the sender or recipient if a rule prevents a message from reaching its destination」**——除非你用的動作本身會回(例如 Don't deliver 選 Send NDR)。所以用規則默默擋信時,兩邊都不會收到提示。
- **不是防毒**:官方也直說 **「Mail rules are not intended to serve as an anti-virus solution」**。mail rules 適合「照規則分流、留底、隔離、擋特定樣式」,但病毒防護要靠專門的掃毒方案,別拿 mail rules 當防毒。

## 小結

- **在哪**:Configuration Settings 文件 → Router/SMTP → Restrictions and Controls → Rules。
- **何時**:信沉進 MAIL.BOX 時、每封評一次(伺服器端、信進信箱前),對照 client 端信箱規則。
- **條件**:item + 運算子(contains/is/is less than…),無萬用字元(用 contains)、AND/OR、可加例外、不分大小寫。
- **動作(一條一個)**:Journal / Move to database / Don't accept / Don't deliver(靜默刪或 NDR)/ Change routing state=HOLD / Stop processing。
- **要知道**:預設不通知寄收件人;mail rules 不是防毒。改規則用 `set rules` 或等約五分鐘自動 reload。
