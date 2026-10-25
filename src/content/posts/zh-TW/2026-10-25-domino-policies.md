---
title: "Policy documents:從一個地方把設定推到全公司的 Notes client——organizational vs explicit、effective policy、How to Apply 的四種模式"
description: "想把一個設定(密碼規則、郵件配額、桌面功能開關、ECL)一次套到全公司的 Notes 使用者,靠的是 policy。這篇講 Domino policy 的運作:兩種指派方式——organizational policy(依註冊時的 OU 自動套用)與 explicit policy(手動指派給個人或群組);各種 policy settings document(registration / desktop / mail / security / archive,以及已淘汰、併進 desktop 的 setup);effective policy 是什麼——使用者實際生效的設定,是在執行當下由 OU、explicit(含所屬群組)、與繼承自上層 policy 的值動態算出來的;最關鍵的 How to Apply 四種模式(Don't set value / Set initial value / Set value whenever modified / Set value and prevent changes=鎖死),決定使用者能不能改;以及 exception policy 怎麼讓特定人例外。"
pubDate: 2026-10-25T07:30:00+08:00
lang: zh-TW
slug: domino-policies
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Policies(policy 是一組 policy settings、各 settings document 類型 registration/desktop/mail/security/archive、effective policy 動態計算、How to Apply)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_policies_c.html"
  - title: "Organizational and explicit policies(organizational 依 OU 自動套用、explicit 手動指派個人/群組、指派方式)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/conf_organizationalandexplicitpolicies_c.html"
  - title: "Understanding the desktop policy settings document(desktop 設定何時強制、How to Apply 四種模式:do not change / set initial value / set whenever modified / set and prevent changes)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_understandingthedesktoppolicysettingsdocument_c.html"
relatedJava: []
relatedSsjs: []
---

想把一個設定——密碼規則、郵件配額、桌面功能開關、administration ECL——**一次套到全公司**的 Notes 使用者,而不是一台一台設,靠的就是 **policy**。但 policy 不只是「設一次到處生效」這麼簡單:它有兩種指派方式、好幾種設定文件、一套「使用者實際吃到哪個值」的計算規則,還有一個決定「使用者能不能自己改回去」的關鍵開關。這篇把它講清楚。

---

## 重點摘要

- **policy 是什麼**:官方說它是「a document that identifies a collection of individual policy settings」——一份把多個 **policy settings document** 收攏起來、指派給使用者或群組的文件,設定會**自動套用**。
- **兩種指派**:**organizational policy** 依**註冊時用的 OU**(憑 certifier ID)**自動套**到該 OU 底下所有使用者;**explicit policy** 則是**手動**指派給個人或群組(可在註冊時、Person 文件、或用 Assign Policy 工具指派)。
- **各種 settings document**:**registration**(新使用者註冊預設)、**desktop**(工作區/桌面功能)、**mail**(郵件、行事曆)、**security**(Notes/Internet 密碼、密碼政策、key rollover、administration ECL、push 信任交叉憑證、ID vault)、**archive**(封存)等;**setup 已淘汰**,內容併進 **desktop**。
- **effective policy**:使用者**實際生效**的那組設定,是「dynamically calculated at the time the policy is executed」——在執行當下,由 **OU 層的值、explicit(含所屬群組)的值、與繼承自上層 policy 的值**一起**動態解析**出來的。
- **How to Apply(最關鍵)**:每份 settings document 的每個欄位都有這個設定,決定「怎麼套、使用者能不能改」。四種模式:**Don't set value(不設值、交給使用者)/ Set initial value(設初始值、之後可改)/ Set value whenever modified(每次變更時覆寫)/ Set value and prevent changes(設死鎖住)**。
- **exception policy**:只列出「**不**強制的設定」,讓特定使用者可以**例外**覆寫原本被強制的值。

## organizational vs explicit:兩種指派

同樣是 policy,差別在「怎麼套到人身上」([官方:organizational 與 explicit policies](https://help.hcl-software.com/domino/10.0.1/conf_organizationalandexplicitpolicies_c.html)):

- **Organizational policy**:**依組織結構自動套**。使用者在某個 OU 底下註冊(用該 OU 的 certifier ID),就**自動**繼承對應的 organizational policy——不用一個一個指派。適合「整個 /Sales/ACME 的人都套這組」這種。
- **Explicit policy**:**手動指派**給個人或群組。指派方式有幾種:在註冊時、在 **Person 文件**、用 **Assign Policy** 工具、或在 policy 文件的 Policy Assignment 分頁。適合「這幾個人/這個群組要特別套一組」這種。

兩種可以同時存在——一個人可能既有 OU 自動套的 organizational policy,又被指派了 explicit policy,最後實際生效的,就是下面講的 **effective policy**。

## settings document:實際的設定放這裡

policy 本身只是「容器」,真正的設定值放在各種 **policy settings document** 裡([官方 policies 總覽](https://help.hcl-software.com/domino/11.0.1/admin/conf_policies_c.html)):

- **registration**:新使用者註冊的預設(密碼、Internet 位址格式、roaming、mail 等)。
- **desktop**:使用者工作區與桌面功能(Widgets、Live Text、行事曆等)。
- **mail**:client 的郵件、行事曆、排程設定。
- **security**:administration ECL、Notes/Internet 密碼管理與同步、密碼政策、key rollover、push 信任交叉憑證、**ID vault** 設定——安全相關幾乎都在這。
- **archive**:封存在哪跑、封存條件。
- 還有 connections、traveler、roaming 等。

一個要注意的版本點:**setup policy 已經淘汰**,官方明講「Do not use the Setup Policy Settings document. Use a Desktop Policy Settings document.」——它的設定都搬進 **desktop** 文件了,別再用 setup。

## effective policy:使用者實際吃到的那組

當一個人身上同時有 OU 自動套的、explicit 指派的、還有上層繼承來的設定,他**最後生效**的是哪些?這就是 **effective policy**——官方定義它是「a set of derived policy settings that are **dynamically calculated at the time the policy is executed**」。

重點在 **dynamically calculated**:effective policy 不是某個固定文件,而是在**執行當下**,把這些來源的值**解析**出來的結果——OU 層的值、explicit policy 的值(**包含使用者所屬群組**帶來的)、以及**繼承自上層(parent)policy** 的值。所以你改了上層 policy、或把人加進某個有 explicit policy 的群組,他的 effective policy 會**跟著重算**。

## How to Apply:使用者能不能改回去

這是 policy 最關鍵、也最常被忽略的一環:光是「設了一個值」不代表使用者不能改回去。每個欄位旁邊的 **How to Apply** 才決定強度([官方:desktop policy settings 文件](https://help.hcl-software.com/domino/14.5.0/admin/conf_understandingthedesktoppolicysettingsdocument_c.html))。四種模式:

- **Don't set value(不設值)**:policy **不指定**任何值,交給**使用者自己填**。注意它不是「保留使用者現值不動」,而是「policy 這欄放手、由使用者決定」。
- **Set initial value(設初始值)**:**第一次**套一個預設值,之後**使用者可以自己改**。
- **Set value whenever modified(每次變更時套用)**:每當 policy 這個值改了就推給使用者、覆寫使用者設的值,但使用者仍可在兩次推送之間自己調。
- **Set value and prevent changes(設定並禁止變更)**:值存進 policy、**使用者改不了**——**設死、鎖住**,這才是真正的「強制」。

所以「我設了配額/密碼規則,使用者卻能改掉」通常不是沒設,而是 How to Apply 選的是「set initial value」而不是「set and prevent changes」。要強制,就得鎖。

## exception policy:讓特定人例外

既然可以鎖死,就需要一個「開後門」的機制。**exception policy** 就是——它**只列出那些「不」強制的設定**(它不是第三種 policy type:policy type 仍只有 explicit / organizational,exception 是在 policy 文件的 **Administration 分頁**開啟的選項)。官方說法:建 exception policy 時,你**只指定那些不會被強制的設定**。於是被它涵蓋的使用者,在那些設定上就能**覆寫**原本 mandatory 的值,其餘照舊。適合「全公司鎖死,但這幾個特例要放寬某一項」。

## 小結

- **policy**=一組 policy settings document 的容器,指派給人/群組、自動套用。
- **兩種指派**:organizational(依 OU 自動)vs explicit(手動指派個人/群組)。
- **settings document**:registration / desktop / mail / security(密碼/ECL/ID vault)/ archive…;setup 已併入 desktop。
- **effective policy**:使用者實際生效的設定,在執行當下由 OU + explicit(含群組)+ 上層繼承**動態算出**。
- **How to Apply**:Don't set value / Set initial value / Set value whenever modified / **Set value and prevent changes(鎖死)**——決定使用者能不能改。
- **exception policy**:只列「不強制」的設定,讓特定人例外覆寫。
