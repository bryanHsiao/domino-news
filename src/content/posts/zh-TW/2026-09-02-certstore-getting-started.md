---
title: "Domino 憑證管理入門：用 CertMgr 與 certstore.nsf 取代滿地的 kyr keyring 檔"
description: "從 Domino 12 起，TLS 憑證不再是散在每台 server 磁碟上的 .kyr keyring 檔——一個 CertMgr server task 加一個 certstore.nsf 資料庫就統一管起來：憑證存在 TLS Credentials 文件裡、私鑰用 256-bit AES 加密、由 ACL 保護、還能挑哪幾台 server 讀得到。這篇是 certstore 系列第一篇，講清楚這個模型、怎麼把 certstore.nsf 立起來、TLS Credentials 文件的組成，以及把既有第三方 CA 憑證匯入的完整步驟。"
pubDate: 2026-09-02T07:30:00+08:00
lang: zh-TW
slug: certstore-getting-started
tags:
  - "Admin"
  - "Security"
  - "Tutorial"
sources:
  - title: "Managing TLS certificates with Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html"
  - title: "Setting up the Domino credential and certificate stores — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_set_up_cred_and_cert_stores.html"
  - title: "Managing TLS certificates without Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_managingservercertificatesandcertificaterequests_t.html"
relatedJava: []
relatedSsjs: []
---

一個 Domino 管理員都認得的畫面：某台 web server 的 TLS 憑證半夜到期，網站掛掉，你連進去，發現憑證躺在一個 `keyfile.kyr` 檔裡——那台 server 專屬的 keyring 檔，配一個 `.sth` 密碼隱藏檔，用 `kyrtool` 或更早的 Server Certificate Admin（`certsrv.nsf`）產生。要換一張憑證，得在那台機器上重跑一輪、把新的 kyr 佈署過去、重啟 HTTP task。多台 server 就是把這套動作乘以台數。憑證快到期沒人盯，就等著半夜出事。

這種[沒有 Certificate Manager 的手動管理方式](https://help.hcl-software.com/domino/14.5.1/admin/conf_managingservercertificatesandcertificaterequests_t.html)官方到現在都還留著文件、也還能用，但它就是散、就是靠人記得。從 Domino 12 起有一套把這件事收攏起來的機制，這篇（certstore 系列第一篇）就從「它是什麼、怎麼立起來」講起。

---

## 重點摘要

- **一個 task + 一個資料庫**：官方說得很直接——「HCL Domino 12 introduces a new server task, Certificate Manager (CertMgr), that works with a new database, Certificate Store (certstore.nsf) to manage TLS certificates in your Domino environment」。憑證不再散在磁碟的 kyr 檔，改由 `certstore.nsf` 統一管。
- **certstore.nsf 自己會生**：不必手動從 template 建，跑 `load certmgr` 這個 task 第一次執行時就會建出這個資料庫。
- **憑證存在 TLS Credentials 文件裡**：官方——「certificates generated through Certificate Manager are securely stored directly in TLS Credentials documents in certstore.nsf rather than in keyring files on disk」。
- **私鑰有加密、庫有 ACL**：「certstore.nsf is protected by the database ACL and private keys are protected by 256 bit AES encryption」。還能指定哪幾台 server 讀得到私鑰。
- **憑證怎麼進來有三條路**：Let's Encrypt／ACME 自動申請、內建 micro CA、以及手動匯入第三方 CA 的憑證。前兩者是系列下一篇的主題，這篇先把手動匯入走完。

---

## certstore.nsf 到底是什麼

先把角色分清楚。[Certificate Manager](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html)（CertMgr）是一個 **server task**，`certstore.nsf`（Certificate Store）是它操作的**資料庫**。官方對這個資料庫的定義一句話：「This database provides the interface to request, store, and distribute certificates in a secure way.」——請求、儲存、發佈憑證，都在這一個地方。

跟 kyr 時代最大的差別在「發佈」兩個字。以前一張憑證綁死在一台 server 的一個 keyring 檔；現在憑證存在 `certstore.nsf` 這個 NSF 裡，而 NSF 是會抄本、會複寫的——同一份憑證可以讓多台 server 共用，你只在一個地方維護。要換憑證，改一份文件，不必爬進每台機器。

## 把 certstore.nsf 立起來

好消息是幾乎不用「建」。[設定憑證庫的官方步驟](https://help.hcl-software.com/domino/14.5.1/admin/conf_set_up_cred_and_cert_stores.html)第一步就是：「Create a certificate store on the server using the `load certmgr` console command. This starts the Certificate Manager task, which will create the certstore.nsf database.」——在 server console 打 `load certmgr`，task 一起來就把 `certstore.nsf` 生出來。

要它每次開機都在，把 `CertMgr` 加進 notes.ini 的 `ServerTasks`，或用一份 Program document 排它執行。之後開啟 `certstore.nsf`，裡面就是你管憑證的介面：一份 Certificate Authority 文件（Basics 頁）、若干信任根憑證、以及一筆一筆的 TLS Credentials 文件。設好之後重啟 Domino server 讓 HTTP task 接手新的憑證來源。

## TLS Credentials 文件：憑證的存放單位

`certstore.nsf` 裡真正裝一張憑證的東西，叫 **TLS Credentials 文件**。一份 TLS Credential 不只是「一張憑證」，它是一組綁在一起的東西：這張憑證涵蓋哪些 **host name**（單一 IP 對到多個 Internet Site 時，還要各自填 SAN——Subject Alternative Name）、**哪幾台 server 讀得到它的私鑰**、憑證由誰簽發（provider），以及金鑰對本身與憑證鏈。

「哪幾台 server 讀得到私鑰」這個欄位（Servers with access）是 certstore 安全模型的核心：私鑰是**針對你指定的那些 server 加密**的，只有它們解得開、用得了這張憑證。這也是為什麼同一份 NSF 可以放心複寫到多台機器——沒被授權的 server 就算拿到文件也讀不到私鑰。

## 把既有的第三方 CA 憑證匯入

如果你手上已經有一張商業 CA（DigiCert、Sectigo 之類）簽的憑證，或公司規定憑證一定得走內部 CA，那就走**手動匯入**這條路。步驟是在 `certstore.nsf` 裡：

1. 到 **TLS Credentials** 檢視，按 **Add TLS Credentials**。
2. **Host names** 欄填這台對外 server 的 host name；一個 IP 透過 Internet Sites 對到多個 web host 時，替每個 host 填上 SAN。
3. **Servers with access** 欄選要讓哪幾台 Domino server 能讀這張憑證的私鑰。
4. **Certificate Provider** 欄選 **Manual**。
5. 按 **Submit Request**，CertMgr 產生金鑰對與 CSR。當 **Status** 變成 **Waiting**，把 **Certificate signing request (CSR)** 欄的內容複製出來，送去給你的 CA。
6. CA 簽好、把憑證發回來之後，把收到的憑證貼進這份文件的 **Certificates & Roots (PEM)** 欄，再按一次 **Submit Request** 收尾。

進出的憑證格式是 **PEM**（Base64 編碼的 DER）。整個過程金鑰對是 CertMgr 在庫裡產生的，私鑰從頭到尾沒落地成一個裸檔——這正是相對 kyr 時代的關鍵差別。

## 安全模型：ACL + AES-256，不是磁碟上的裸檔

把安全性收在一段講：kyr 時代，私鑰是磁碟上一個 `.kyr` 檔，保護它的是檔案系統權限加一個 `.sth` 密碼隱藏檔——備份、搬機、誤設權限都可能讓私鑰外流。certstore 把這件事換成兩層 Domino 原生的保護：整個 `certstore.nsf` 由**資料庫 ACL** 控管誰能開，裡面每把**私鑰再用 256-bit AES 加密**、而且是綁定「Servers with access」那批 server 才解得開。等於私鑰不再是一個可以整個拷走的檔案，而是一份受 ACL 與加密雙重保護、還挑得了讀取對象的資料。

## 小結

certstore 的模型講穿了就一句：**把散在每台 server 磁碟上的 kyr keyring 檔，收攏成一個 ACL 保護、私鑰 AES 加密的 `certstore.nsf`，由 CertMgr task 統一管理與發佈**。立起來只要 `load certmgr`；一張憑證是一份 TLS Credentials 文件；既有的第三方憑證走 Manual provider 匯入。

這篇把「是什麼、怎麼立、怎麼手動放憑證」走完了。真正讓很多人換到 certstore 的理由，其實是它能**自動**跟 Let's Encrypt 用 ACME 協定申請與續期憑證，再也不用半夜爬起來換憑證——那是本系列 [Part 2：CertMgr + ACME 自動憑證](/domino-news/posts/certstore-acme)的主題。至於 certstore 裡的憑證怎麼被 `NotesHTTPRequest`、Domino REST API 這些對外連線實際使用、以及 Domino 14.5 把信任根從 `cacerts.pem` 搬進 Domino Directory 的變化，留給 [Part 3：certstore 的開發者視角](/domino-news/posts/certstore-for-developers)。
