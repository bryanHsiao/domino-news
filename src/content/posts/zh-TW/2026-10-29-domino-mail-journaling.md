---
title: "Domino mail journaling:合規側錄,加密有兩個坑"
description: "稽核或法遵常要求「所有進出的信都留一份備查」。Domino 的 mail journaling 就是讓 router 在正常投遞的同時,側錄一份複本到一個專門的資料庫。這篇講它怎麼開(預設是關的,在 Configuration Settings 文件的 Router/SMTP → Advanced → Journaling 開)、要側錄哪些信(全部,或用上一篇的 Journal this message mail rule 選擇性側錄)、複本存哪(local 資料庫 MAILJRN.NSF 會自動建,或 mail-in 資料庫但那個要先存在)、以及兩個很容易踩的加密坑:local journaling 用「Encrypt on behalf of user」那個人的公鑰加密,而且預設連 Subject 都加密、所以 journal 庫的 view 裡 Subject 欄會是空白;mail-in journaling 則預設不自動加密,要自己到 Mail-in database 文件的 Basics 分頁開。最後提醒:已被收件人加密的信不會再用 journal 的鑰加密、預設這個庫會從 Open Database 對話框隱藏。"
pubDate: 2026-10-29T07:30:00+08:00
lang: zh-TW
slug: domino-mail-journaling
tags:
  - "Domino Server"
  - "Admin"
  - "Security"
sources:
  - title: "Mail journaling(側錄複本做合規、不影響投遞、搭配 mail rules、全部或選擇性、存 MAILJRN.NSF、Router 加密)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_mailjournaling_c.html"
  - title: "Setting up the Mail Journaling database(在 Router/SMTP→Advanced→Journaling 開、local vs mail-in、Encrypt on behalf of user、Field encryption exclusion list、Subject 被加密)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_settingupthemailjournalingdatabase_t.html"
  - title: "Managing the Mail Journaling database(mail-in 不自動加密要自己開、已加密信不重加密、預設隱藏、建議專用 journal ID)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/conf_managingthemailjournalingdatabase_c.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-mail-journaling.webp"
coverStyle: "paper-craft"
---

稽核或法遵常有一條要求:「所有進出的信都要留一份備查」。Domino 內建就能做——**mail journaling(郵件側錄)**:在 router **正常投遞**一封信的同時,**複製一份**到一個專門的資料庫存底。它不影響送達,使用者照收他的信;只是伺服器額外留了一份。但它**預設是關的**,而且**加密有兩個很容易踩的坑**,這篇講清楚。

---

## 重點摘要

- **是什麼**:router 在投遞的同時**側錄一份複本**到 Mail Journaling 資料庫(預設 `MAILJRN.NSF`)。**不影響正常投遞**——官方:預設 router 處理完就不留複本,journaling 改變的只是「被你選到的那些信」。
- **怎麼開**:**預設關**。在 **Configuration Settings 文件 → Router/SMTP → Advanced → Journaling** 開。
- **側錄哪些**:側錄**一律由 mail rule 的 Journal this message 動作驅動**(上一篇[伺服器 mail rules](/domino-news/posts/domino-server-mail-rules/))——要側錄**全部**就用一條「全部命中」的規則,要**選擇性**就加條件。**光在 Advanced → Journaling 開、沒建規則,是不會側錄任何信的。**
- **存哪**:**local 資料庫**(router 複製到本機、沒有就自動建)或 **mail-in 資料庫**(**要先存在**,且 Domino Directory 裡要有對應的 Mail-in database 文件)。
- **加密坑一(local)**:用「**Encrypt on behalf of user**」欄位那個人的公鑰加密;而且**預設連 Subject 都加密**,所以 journal 庫的 view 裡 **Subject 欄會空白**(靠「Field encryption exclusion list」控制哪些欄位豁免加密、好做 view)。
- **加密坑二(mail-in)**:mail-in journaling **不會自動加密**——要**自己到 Mail-in database 文件的 Basics 分頁開加密**,否則側錄下來的信是明文。

## 它在做什麼

預設情況下,router 把信投遞完就不留複本了。**mail journaling** 改變這件事:對你**選中**的信,router 在投遞的同時**複製一份**到 **Mail Journaling 資料庫**([官方:mail journaling](https://help.hcl-software.com/domino/10.0.1/admin/conf_mailjournaling_c.html))。重點是它**不打斷路由**——「the Router still delivers each message to its recipient after copying it」,收件人照收,只是多了一份存底。它跟 **mail rules** 搭配運作,而且只有**授權的管理者**能看這個庫。

要開它,到 **Configuration Settings 文件 → Router/SMTP → Advanced → Journaling** 分頁(預設是關的)。

## 側錄哪些信:全部 vs 選擇性

側錄其實是**兩步**:(1) 在 **Advanced → Journaling** 開啟並定義 journaling 庫;(2) 建一條帶 **Journal this message** 動作的 server mail rule。**只做第一步、不建規則,是不會側錄任何信的**——範圍就看你規則怎麼寫:

- **全部**:規則寫成「全部命中」,每封經 router 的信都側錄。
- **選擇性**:規則加上條件(寄件人、主旨、附件…),只側錄符合的,接上[上一篇 mail rules](/domino-news/posts/domino-server-mail-rules/) 的 **Journal this message** 動作。

順序很重要:journaling 的庫要先在 Advanced → Journaling 定義好,mail rule 的 Journal 動作才有地方可送;不是設了 mail rule 就自動開 journaling。

## 複本存哪:local vs mail-in

兩種儲存方式([官方:設定 Mail Journaling 資料庫](https://help.hcl-software.com/domino/10.0.1/admin/conf_settingupthemailjournalingdatabase_t.html)):

- **local 資料庫(預設)**:router 把每封被側錄的信**複製到本機**的一個資料庫(通常就是 `MAILJRN.NSF`);**沒有就自動建**。
- **mail-in 資料庫**:側錄到一個 mail-in 庫。但這個庫**必須先存在**,而且 Domino Directory 裡要有對應的 **Mail-in database 文件**。

## 加密坑一:local 的 Subject 會不見

local journaling 會加密存下來的信,用的是「**Encrypt on behalf of user**」欄位指定那個人的**憑證公鑰**——所以只有那個人(或拿得到對應私鑰的授權者)解得開。這是好事,但有個副作用:

**預設只有 `Form`、`From`、`Principal`、`PostedDate` 這四個欄位不加密**,其餘(包括 **Subject**)都會被加密。而**加密的欄位沒辦法顯示在 view**——兩者加起來,journal 庫的 view 裡 **Subject 欄就會是空白的**。哪些欄位豁免加密、好留給 view 顯示,是由「**Field encryption exclusion list**」控制的;想在 view 裡看到主旨,就把 Subject 加進這個清單(但這等於讓主旨變明文,是安全與可用性的取捨)。

## 加密坑二:mail-in 不會自動加密

這個坑更危險,因為它是「以為有、其實沒有」:**mail-in journaling 不會自動加密**([官方:管理 Mail Journaling 資料庫](https://help.hcl-software.com/domino/10.0.1/conf_managingthemailjournalingdatabase_c.html))。官方明講——送進 mail-in journaling 庫的信**不會被 Domino 自動加密**;要加密,得**自己到那個 Mail-in database 文件的 Basics 分頁把加密打開**。

換句話說,如果你用 mail-in 方式側錄、又沒手動開加密,那整個合規存底就是**明文**躺在那——稽核要的是「留底」,但留的是一份誰都看得懂的明文,反而是風險。用 mail-in 就一定要記得開這個。

## 其他要知道的

- **已被加密的信不會再加密**:如果一封信在寄的時候就已經被 Notes 為收件人加密了,journaling **不會**再用 journal user 的鑰重新加密它。這代表:如果 journal user **不是**原收件人,他對這封信**只看得到 header(信頭)資訊**、看不到內文。
- **預設隱藏**:Domino 預設把 Mail Journaling 資料庫從使用者的 **Open Database 對話框隱藏**起來,不讓一般人隨手開。
- **建議專用 ID**:官方建議為 journal 建一個**專用的 ID、搭配多組密碼**,把「誰能解開存底」這件事管得更嚴。

## 小結

- **是什麼**:router 投遞同時側錄一份複本到 journaling 庫,不影響送達;預設關,在 Router/SMTP → Advanced → Journaling 開。
- **側錄範圍**:全部,或用 mail rule 的 Journal this message 選擇性(journaling 要先開)。
- **存哪**:local 庫(`MAILJRN.NSF`、自動建)vs mail-in 庫(要先存在 + Directory 有 Mail-in 文件)。
- **加密坑一(local)**:用「Encrypt on behalf of user」公鑰加密;Subject 預設被加密、view 裡空白,靠 Field encryption exclusion list 調。
- **加密坑二(mail-in)**:不自動加密,要自己在 Mail-in database 文件 Basics 開,否則是明文存底。
- **其他**:已加密信不重加密(非收件人只看 header);預設從 Open Database 隱藏;建議專用 journal ID。
