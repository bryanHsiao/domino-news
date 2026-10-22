---
title: "Domino 的 web 設定到底讀哪裡:Internet Site documents vs Server 文件,all-or-nothing,以及為什麼 port 還是留在 Server 文件"
description: "你改了 Domino 的 web 設定卻沒生效,很多時候不是設錯,是改錯地方——Domino 的 Internet 協定設定有兩套來源:舊的 Server 文件(Web Server Configurations / 虛擬伺服器),和新的 Internet Site documents(存在 Domino Directory、可跨伺服器集中管理)。伺服器到底讀哪一套,由 Server 文件 Basics 分頁一個開關決定。這篇講兩種模型怎麼切、Internet Site documents 能設哪些協定(Web/IMAP/POP3/SMTP Inbound/LDAP/IIOP)、改動為什麼不用重啟、一個很容易踩的 all-or-nothing 規則(同一台伺服器只要有一個協定用 Internet Site,就得所有協定都用)、Web Site document 的 Basics/Configuration/Domino Web Engine/Security 分頁各管什麼、哪些設定(TCP/IP port、SSL port、server access)無論如何都還是留在 Server 文件,以及怎麼從 HTTP 啟動訊息確認伺服器實際讀的是哪一套。"
pubDate: 2026-10-22T07:30:00+08:00
lang: zh-TW
slug: domino-internet-site-documents
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Understanding Internet site documents(是什麼、6 種協定、存 Domino Directory 可跨伺服器、改動 dynamic、all-or-nothing、伺服器怎麼決定讀哪套、哪些留 Server 文件)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/inst_understandinginternetsitedocuments_c.html"
  - title: "Hosting Web sites(開 Internet Sites、建 Web Site document、各分頁)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_hostingwebsites_t.html"
  - title: "Configuring a Web Site document(Web Site 文件 Basics/host names、Configuration、Domino Web Engine、Security 分頁)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/trial_config_internet_site.html"
relatedJava: []
relatedSsjs: []
---

你改了 Domino 的 web 設定——某個 HTTP 選項、session 逾時、哪個網站對應哪個資料庫——結果**完全沒生效**。很多時候不是設錯值,而是**改錯地方**:Domino 的 Internet 協定設定有**兩套來源**,而伺服器同一時間只讀其中一套。看懂它讀哪裡、怎麼切,是所有 Domino web 設定問題的起點。

---

## 重點摘要

- **兩套設定來源**:舊的 **Server 文件**(Web Server Configurations,也就是早年的虛擬伺服器),與新的 **Internet Site documents**。
- **一個開關決定讀哪套**:Server 文件 **Basics 分頁**的「**Load Internet configurations from Server\Internet Sites documents**」。**關**=伺服器用 Server 文件設定;**開**=改讀 Internet Site documents(開/關要**重啟**才生效)。
- **Internet Site documents 是什麼**:存在 **Domino Directory** 的文件,每種 Internet 協定一種(**Web/HTTP、IMAP、POP3、SMTP Inbound、LDAP、IIOP**);一份可服務一台或多台伺服器,所以能**集中管理**。而且改動是 **dynamic 的——不用重啟**。
- **all-or-nothing(最容易踩)**:同一台伺服器,只要你**對一個協定用 Internet Site document,就得對所有協定都用**。不能 HTTP 走 Internet Site、LDAP 走 Server 文件混搭。
- **有些設定永遠留在 Server 文件**:就算開了 Internet Sites,**TCP/IP port 與狀態、SSL port 與狀態(含 TCP→SSL 轉址)、server access** 這些還是在 Server 文件設。
- **怎麼確認**:每次啟動/重啟 HTTP,主控台會印出它這次是用 Internet Sites 還是 Server document 取設定。

## 兩種模型,與那個開關

Domino 的 web(以及其他 Internet 協定)設定,歷史上有兩種放法:

- **Server 文件裡的 Web Server Configurations**(早期叫虛擬伺服器):設定綁在單一 Server 文件上。
- **Internet Site documents**:獨立文件,放在 **Domino Directory**。

伺服器讀哪一套,看 **Server 文件 → Basics 分頁**的開關「**Load Internet configurations from Server\Internet Sites documents**」([官方:理解 Internet site documents](https://help.hcl-software.com/domino/10.0.1/admin/inst_understandinginternetsitedocuments_c.html)):

- 開關**關著**:官方說法是「the server defaults to Server document settings」——用 Server 文件的設定。
- 開關**打開**:改從 Internet Site documents 讀。

這個開關的**開/關本身要重啟伺服器**才生效(它在 Server 文件上;開啟與建站的完整步驟見[官方:Hosting Web sites](https://help.hcl-software.com/domino/11.0.1/admin/conf_hostingwebsites_t.html))。這也是「我建了 Web Site document 卻沒作用」最常見的原因之一:**開關還沒打開**,伺服器根本沒去讀那些文件。

## Internet Site documents:集中、動態

Internet Site document 是「用來設定 Domino 伺服器所支援 Internet 協定」的 Domino Directory 文件。重點有三:

- **每種協定一種文件**:**Web(HTTP)、IMAP、POP3、SMTP Inbound、LDAP、IIOP**。
- **可跨伺服器**:因為存在 Domino Directory,一份文件可以服務**一台或多台**伺服器——協定設定因此能**集中管理**,不必每台 Server 文件各設一次。
- **改動是 dynamic 的**:官方逐字「Modifications to Internet site documents (including the creation of new Site documents) are dynamic」——改了(或新建)**不用重啟**,幾分鐘內生效。(注意:這是指「改 Site 文件的內容」不用重啟;前面那個「要不要用 Internet Sites」的總開關,改了還是要重啟。)

## all-or-nothing:最容易踩的規則

這條規則很多人踩:**同一台伺服器,一旦你對某一個協定用了 Internet Site document,就必須對那台的所有 Internet 協定都用 Internet Site document**。官方原文:「You must also use Internet site documents for all Internet protocols on that server.」

也就是說,你**不能**一邊用 Site document 設 HTTP、一邊還用 Server 文件設 LDAP。要嘛整台切到 Internet Sites、要嘛整台留在 Server 文件——沒有混搭。切換前先盤點這台伺服器上**所有**有在用的 Internet 協定,一起搬。

## Web Site document 怎麼設

開了總開關之後,從 Domino Administrator 的 **Configuration → Web → Internet Sites**,**Add Internet Site → Web** 建一份 Web Site document([官方:設定 Web Site document](https://help.hcl-software.com/domino/12.0.0/admin/trial_config_internet_site.html)):

- **Basics 分頁**:site name、organization,以及對應到這個站的 **host names / 位址**(哪些網址走這個站)。
- **「要由哪些伺服器 host 這個站」**:一個選填欄位;**沒被列進去的伺服器不會載入這份站設定**——這也是「某台就是不吃這個站」的常見原因。
- **Configuration 分頁**:允許的 HTTP methods 等。
- **Domino Web Engine 分頁**:**session authentication**(web 登入怎麼做,下一篇會專講)。
- **Security 分頁**:存取控制。
- 之後還可以加 **Web Site Rules**(重寫/重導/substitution)與 file protection。

## 哪些設定還是留在 Server 文件

一個關鍵但容易忽略的分界:**就算開了 Internet Sites,這些還是在 Server 文件設**——

- **TCP/IP port number 與 status**
- **SSL port number 與 status**(含 TCP 轉 SSL 的 redirection)
- **server access** 設定

所以「HTTP 到底開在哪個 port、有沒有開 SSL」永遠去 Server 文件看,別在 Web Site document 裡找。

## 怎麼確認伺服器讀的是哪一套

不用猜:**每次啟動或重啟 HTTP task,主控台都會印一行訊息**,說它這次是用 **Internet Sites**、還是用 **Server document(Web Server Configurations 檢視)** 取設定。設了半天沒反應,先去 console 看這行——它會直接告訴你伺服器到底在讀哪裡。

## 小結

- **兩套來源**:Server 文件(Web Server Configurations)vs Internet Site documents(Domino Directory、可跨伺服器)。
- **開關**:Server 文件 Basics「Load Internet configurations from…Internet Sites documents」,開/關要重啟;決定讀哪一套。
- **Internet Site documents**:6 種協定各一種、可集中管理、改內容 dynamic 免重啟。
- **all-or-nothing**:一台只要一個協定用 Internet Site,就得全協定都用。
- **永遠在 Server 文件**:TCP/IP port、SSL port(含 TCP→SSL 轉址)、server access。
- **確認**:看 HTTP 啟動/重啟時 console 那行——用 Internet Sites 還是 Server document。
