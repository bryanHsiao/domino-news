---
title: "Domino CertMgr 串接 Let's Encrypt：用 ACME 協定自動申請與續期 TLS 憑證"
description: "手動匯入憑證還是得每 90 天換一次、還是會忘。這篇（certstore 系列第二篇）講 CertMgr 真正的殺手級功能：透過 ACME 協定跟 Let's Encrypt 自動申請、配置、續期免費且受信任的 TLS 憑證。從兩個 ACME account profile（Staging／Production）與 Global Settings 設起，走一遍申請流程與 submit 後 CertMgr 自動做完的六件事，講清楚 HTTP-01 與 DNS-01 challenge 的差別，最後點出 micro CA 只該用在測試、ECDSA 與 key rollover。"
pubDate: 2026-09-03T07:30:00+08:00
lang: zh-TW
slug: certstore-acme
tags:
  - "Admin"
  - "Security"
  - "Tutorial"
sources:
  - title: "Managing TLS certificates with Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html"
  - title: "Requesting a certificate from the Let's Encrypt CA — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_requesting_a_certificate_2.html"
  - title: "Configuring the ACME account profiles — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_configuring_acme_accounts.html"
relatedJava: []
relatedSsjs: []
---

[Part 1](/domino-news/posts/certstore-getting-started) 把憑證從散落的 kyr 檔搬進了 `certstore.nsf`，也走過手動匯入第三方 CA 憑證的流程——複製 CSR、送去 CA、等簽好、貼回來。這比 kyr 時代乾淨，但它還是**手動**的。而 Let's Encrypt 的憑證只有 90 天效期，代表這套複製貼上的動作一年要重演四次、每台對外主機各一輪。忘記換，網站照樣半夜掛掉。

真正讓人願意搬到 certstore 的，其實不是「集中管理」，而是這篇要講的東西：**讓憑證的申請與續期完全自動化**。這是 certstore 系列第二篇。

---

## 重點摘要

- **CertMgr 的殺手級功能是全自動**：官方一句話講完它的定位——「CertMgr simplifies and secures Domino web server operations by providing the ability to automatically request, configure, and renew free, widely trusted TLS certificates from the Let's Encrypt certificate authority (CA) using the ACME protocol」。
- **設定只做兩件事**：填好兩個 ACME account profile（`LetsEncryptStaging` 測試、`LetsEncryptProduction` 正式）的 email 與同意條款，再到 Global Settings 把預設 provider、金鑰演算法設好。
- **申請一張憑證 = 選 provider = ACME、填 host name、按 Submit**，剩下的 CSR、challenge、取回憑證鏈、部署，CertMgr 自動做完。
- **憑證怎麼證明是你的**：ACME 用 challenge 驗證你對網域的控制權——HTTP-01（走 port 80/443，最常用）或 DNS-01（支援萬用字元憑證）。
- **micro CA 只給測試用**：官方明講「Certificates from a microCA are not intended for production use」；對外正式憑證走 Let's Encrypt。

---

## ACME 與 Let's Encrypt：把整條鏈自動化

先把名詞理清楚。**Let's Encrypt** 是一家免費、廣受信任的憑證頒發機構（CA）；**ACME**（Automated Certificate Management Environment）是它用的自動化協定——申請、驗證、簽發、續期，全程機器對機器，不必人工。[CertMgr](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html) 內建了 ACME client，把這條鏈接進了 Domino。

跟 Part 1 手動匯入的差別，一句話就懂：手動路徑裡 CSR 是你複製出來、貼進 CA、再把簽好的憑證貼回來的；ACME 路徑裡這些**全部由 CertMgr 代勞**。你只描述「我要哪些 host 的憑證」，剩下的交給協定跑。

## 設定：兩個 ACME account profile + Global Settings

動手申請前，`certstore.nsf` 裡有兩份預先建好的 [ACME Account profile 文件](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_configuring_acme_accounts.html) 要先設好：`LetsEncryptProduction`（正式）與 `LetsEncryptStaging`（測試）。每一份裡你要填一個接收通知的 **email**，並勾選同意 Let's Encrypt 的服務條款。

**先用 Staging 練一遍。** Let's Encrypt 的正式環境對同一網域有頻率限制，設定沒弄對就狂打會被限流；Staging 環境簽出來的憑證不受信任（瀏覽器會跳警告），但流程一模一樣，正好拿來確認你的 port 80／DNS 設定通不通，通了再換 Production。

Global Settings 則是這些申請的預設值來源：**Certificate provider** 選 ACME（用 Let's Encrypt CA）、**Key algorithm** 預設是 RSA、金鑰長度預設 4096、**ACME account** 選 Staging 或 Production。之後每張新憑證都從這裡帶預設，不必每次重填。

## 申請一張 Let's Encrypt 憑證

設定好之後，[申請一張憑證](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_requesting_a_certificate_2.html)的步驟很短：

1. 確認這台 server 的 **HTTP task 有起來**（HTTP-01 challenge 會用到）。
2. 開 `certstore.nsf`，到 **TLS Credentials > By Host Name**，按 **Add TLS Credentials**。
3. **Certificate provider** 選 **ACME**。
4. **Host names** 填要簽的對外主機名（可多個；DNS-01 才支援萬用字元；最多 30 個 SAN）。
5. **Servers with access** 選哪幾台 server 能用這張憑證——私鑰會針對它們加密（跟 Part 1 同一個模型）。
6. 其他欄位自動帶 Global Settings 的預設，需要再調。
7. 按 **Submit Request**。

按下去之後，CertMgr 自動把這幾件事做完：**產生金鑰對並存起來 → 建立並送出 CSR → 處理 challenge（HTTP-01 或 DNS-01）→ 用 ACME 協定向 CA 要簽好的憑證鏈、輪詢到拿到為止 → 把憑證鏈寫回 TLS Credentials 文件 → 產生 keyfile 並自動部署到 server 的 data 目錄**。對照 Part 1 的手動流程，你會發現 CSR 複製貼上那段整個消失了——這就是自動化的價值。

## HTTP-01 還是 DNS-01：怎麼證明網域是你的

ACME 不會白白發憑證給你，它要你先證明「這個網域真的歸你管」。這一步叫 challenge，CertMgr 支援兩種：

- **HTTP-01**：最常用。CA 會來連你 host 的 **port 80／443**，看指定路徑上有沒有 CertMgr 放的驗證檔。所以申請前那台 server 的 HTTP task 要起來、對外 80 埠要通。
- **DNS-01**：CertMgr 在你的 DNS 放一筆 TXT 記錄讓 CA 驗證。它比較麻煩（要能改 DNS），但**只有 DNS-01 能簽萬用字元憑證**（`*.example.com`），也適合那台 server 不對外開 80 埠的情況。

一句話選：單一主機、80 埠開得了 → HTTP-01；要萬用字元、或不方便開 80 埠 → DNS-01。

## 自動續期：真正的理由

到這裡才講到重點。CertMgr 作為一個 server task 定期執行，官方明講它能自動 **renew** 這些 Let's Encrypt 憑證——憑證接近到期時，同一條 ACME 流程自動再跑一次、換上新憑證，不必人再進 `certstore.nsf` 動手。Let's Encrypt 90 天的短效期，配合自動續期反而變成優點：憑證常換、外洩的曝險窗短，而你什麼都不用做。（官方文件沒有明確標「到期前幾天觸發續期」的數字，本文就不替它填一個。）

這一段是整個 certstore 最實際的賣點：從此沒有「憑證半夜到期網站掛掉」這回事。

## micro CA 與 ECDSA、key rollover

順帶三個補充：

- **micro CA**：CertMgr 內建一個迷你 CA，能「一鍵」簽出憑證。但它的定位很明確，官方寫死——「A quick and easy way to generate TLS certificates for testing and development purposes is by creating and using a microCA」，而且「Certificates from a microCA are not intended for production use」。拿來在測試機、內部 demo 環境快速生憑證很方便，**別拿去簽對外正式站台**。
- **ECDSA**：除了預設的 RSA，CertMgr 也支援 ECDSA（NIST P-256／P-384 曲線）給 ACME account 與 TLS 1.2 host key 用——同樣安全強度下金鑰更短、握手更省。
- **key rollover**：需要時可以請求換金鑰——較常見的是 TLS host key rollover，也能做 ACME account key rollover。憑證與帳號金鑰都能在不重來一輪的情況下輪替。

## 小結

Part 1 把憑證收進 `certstore.nsf`，Part 2 讓它**自己會長**：設好兩個 ACME account profile 與 Global Settings，申請時 provider 選 ACME、填 host、按 Submit，CSR／challenge／取回／部署 CertMgr 全代勞，之後還會自動續期。HTTP-01 對單一主機最省事、DNS-01 給萬用字元；micro CA 只留測試用。

憑證進到 `certstore.nsf` 之後，接下來的問題是：Domino 裡那些**對外連線**——`NotesHTTPRequest`、Domino REST API——實際上怎麼從這裡取用憑證與信任根？還有 Domino 14.5 把信任根從 `cacerts.pem` 搬進 Domino Directory 又是怎麼回事？那是 [Part 3：certstore 的開發者視角](/domino-news/posts/certstore-for-developers) 的主題。
