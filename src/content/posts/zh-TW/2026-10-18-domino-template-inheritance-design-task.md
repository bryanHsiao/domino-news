---
title: "模板繼承:為什麼你改的設計半夜被蓋回去"
description: "你改了某個資料庫的表單,隔天早上改的東西不見了——因為那個庫「Inherit design from template」,伺服器的 Designer task 半夜把 master template 的設計蓋回來了。這篇講 Domino 的模板繼承到底怎麼運作:master template 是什麼(NTF + 「Database is a template」)、資料庫怎麼靠 Design 分頁的「Inherit design from template」綁上去、設計怎麼透過伺服器的 Designer task(load design,預設每天凌晨 1 點跑、每台伺服器都要有 template 的 replica)流下去、Refresh Design 與 Replace Design 差在哪,以及怎麼用「Prohibit design refresh or replace」加「Propagate」擋住不想被覆寫的元素——還有幾個實務陷阱:private agent/folder 不能進 template、icon/About/Using 預設不繼承。"
pubDate: 2026-10-18T07:30:00+08:00
lang: zh-TW
slug: domino-template-inheritance-design-task
tags:
  - "Domino Designer"
  - "Admin"
sources:
  - title: "Templates and master templates(master template 是什麼、「Database is a template」自動發設計)— HCL Domino Designer(官方)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_TEMPLATES_AND_MASTER_TEMPLATES_.html"
  - title: "Synchronizing databases with master templates(Designer task、load design、每台要有 template replica)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_synchronizingdatabaseswithmastertemplates_t.html"
  - title: "Making and distributing design changes(Refresh Design、繼承庫怎麼被更新)— HCL Domino Designer(官方)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_ABOUT_MAKING_AND_DISTRIBUTING_DESIGN_CHANGES.html"
  - title: "Replacing a design(Replace Design 手動整包換、沒繼承時唯一手段、Prohibit/Propagate 保護元素)— HCL Domino Designer(官方)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-template-inheritance-design-task.webp"
coverStyle: "photoreal-3d"
---

你改了某個正式資料庫的表單,隔天早上一看——改的東西不見了,整個設計被打回原狀。十之八九不是誰動了手腳,而是那個庫設定了「**Inherit design from template**」,伺服器的 **Designer task** 半夜把 master template 的設計**刷**了回來,連你昨天改的一起蓋掉。

模板繼承是 Domino 很強大也很容易咬人的機制:它讓你改一次 template、全公司幾百個庫跟著更新;但同一套機制,也會把你在個別庫上的即興修改,在沒搞清楚之前默默吃掉。這篇把它講清楚——怎麼運作、Refresh 與 Replace 差在哪、怎麼擋住不想被覆寫的東西。

---

## 重點摘要

- **master template**:一個標了「**Database is a template**」屬性、並取了 template name 的 NTF。它負責把設計變更**自動發**給繼承它的庫。
- **怎麼綁**:資料庫的 **Database Properties → Design 分頁**勾「**Inherit design from template**」、填上 template name。綁上去之後,這個庫的設計就會被 template 刷。
- **誰來刷**:伺服器的 **Designer task**(主控台 `load design`),**預設每天凌晨 1 點**跑,把所有繼承的庫對齊它們的 master template。**每台**放了繼承庫的伺服器,都要有一份該 template 的 **replica**。
- **Refresh vs Replace**:**Refresh Design** 是給「有繼承」的庫用的對齊;**Replace Design**(File → Application → Replace Design)是手動把一個庫變得跟某 template 一模一樣——**庫沒設繼承時,這是唯一能套用設計的方法**。
- **擋住某些元素**:在 template 的元素上設「**Prohibit design refresh or replace to modify**」+「**Propagate this prohibition of design change**」,refresh/replace 時就會跳過它。
- **會咬人**:設了繼承,你在個別庫上的改動**會被半夜的 Designer task(或手動 refresh)蓋掉**;要改就先把「Inherit design from template」**取消勾選**。

## master template 與繼承關係

**master template** 就是一個 NTF 檔,勾了資料庫屬性裡的「**Database is a template**」、並取了一個 **template name**。這個屬性讓它能把設計變更**自動發**給「從它建出來」或「設定繼承它」的庫。

要讓一個**既有**資料庫繼承某 template:開 **Database Properties → Design 分頁**,勾「**Inherit design from template**」,把 template name 貼進 Template Name 欄。(字樣會因「你在哪個對話框」而不同:既有資料庫屬性這裡是「Inherit design from template」;若是**從 template 建新庫**,則是 New Database 對話框裡的「Inherit future design changes」——兩者是不同情境的控制項,不是同一個勾選框。)綁上之後,官方講得很直白——這個庫的設計會在**伺服器 Designer task 跑時、或你手動 refresh 時被取代**。

## 誰來刷:Designer task(load design)

設計不會自己飛過去,是伺服器上的 **Designer task** 在發。它[同步繼承庫與 master template](https://help.hcl-software.com/domino/10.0.1/admin/admn_synchronizingdatabaseswithmastertemplates_t.html):

- **預設每天凌晨 1 點**自動跑一次(所以才會「隔天早上」設計就變了)。
- 你也可以在主控台手動促發:**`load design`**。
- 關鍵前提:**每一台**存放繼承庫的伺服器,**都要有那個 master template 的 replica**;沒有 replica,那台的 Designer task 就刷不動。

這跟 updall、dbmt 那些**排程型 server task** 是同一類東西——半夜固定時間、對整批庫做一件事。差別只在 Designer task 做的是「把設計對齊 template」。

## Refresh Design 與 Replace Design

兩個常被混用,其實分工不同([官方:製作與發佈設計變更](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_ABOUT_MAKING_AND_DISTRIBUTING_DESIGN_CHANGES.html)):

- **Refresh Design**:給**有繼承**的庫用——把 master template 的設計**推**給那些繼承它的庫(Designer task 做的也是這件事)。
- **Replace Design**:**手動**把一個庫變得**跟某 template 一模一樣**([官方:取代設計](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html))。重點是——**如果一個庫沒有設繼承,Replace Design 是唯一能把設計套進去的方法**。步驟:選那個庫 → File → Application → Replace Design → 選 template → Replace、確認。

簡單記:Refresh = 「跟著 template 持續對齊」;Replace = 「現在就整包換成這個 template」。

## 怎麼擋住不想被覆寫的元素

繼承很方便,但總有幾個元素你想在個別庫手動維護、不要被 template 蓋。方法在 **template 端**設:

- 在 template 那個元素的設計屬性裡,勾「**Prohibit design refresh or replace to modify**」。官方提醒:要讓它真的生效,**還要一起勾「Propagate this prohibition of design change」**,這個「禁止」才會跟著發下去。這樣 refresh/replace 時就會**跳過**該元素。
- 另外,**元素層級**若設了「**Inherit from the design template**」指向某 template,即使沒設上面那個禁止,Replace Design 時也**不會**被覆寫。

## 幾個會咬人的實務點

- **你的手動改動會被蓋**:只要庫設了繼承,個別庫上的設計改動,就可能被**半夜的 Designer task、或一次 refresh** 覆寫。要在某個庫上做會保留的改動,先到 Design 分頁**取消勾選「Inherit design from template」**。
- **private agent / private folder 不要放進 template**:它們的變更發不下去,refresh/replace 時還會跳錯誤訊息。
- **icon、About、Using 預設不跟著繼承**:template 通常不控制資料庫 icon 與 About/Using 文件,要它們也繼承,得到 Designer 的 **Other → Database Resources** 個別把那幾項設成「從 template 繼承」。
- **別亂改原 template 的屬性**:想客製就用 **File → Application → New Copy** 複製一份、改綁那份,別動到正在被一堆庫繼承的原 template。

## 小結

- **master template**:NTF + 「Database is a template」+ template name,負責自動發設計。
- **綁繼承**:庫的 Design 分頁勾「Inherit design from template」+ 填 template name。
- **誰來刷**:Designer task(`load design`),**預設每天 1 AM**;**每台**有繼承庫的伺服器都要有 template 的 replica。
- **Refresh vs Replace**:Refresh=對齊有繼承的庫;Replace=手動整包換、**沒繼承時的唯一手段**。
- **擋元素**:template 端「Prohibit design refresh or replace」+「Propagate」;元素層「Inherit from the design template」也會被跳過。
- **會咬人**:設了繼承,手動改動會被半夜 Designer task 蓋——要改先取消繼承;private agent/folder 別進 template;icon/About/Using 預設不繼承。
