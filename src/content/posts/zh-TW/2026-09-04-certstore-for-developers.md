---
title: "把 CA 放進 certstore 就到處都信任了？DRAPI 對外其實走 JVM truststore、不是 certstore"
description: "把憑證放進 certstore.nsf 之後，開發者還有兩個實際問題：我的服務（尤其 Domino REST API）怎麼直接用它發 HTTPS？還有——我自己的程式對外呼叫 HTTPS 時，是不是也靠 certstore 驗對方憑證？答案會戳破一個常見誤會：同一台 server 上，憑證的信任其實分散在三個不同的地方。這篇（certstore 系列第三篇）以在 Domino 12.0.2 上的親手實測，講 DRAPI 的 keepconfig.d TLSCertStore 設定、certstore trusted roots 的真正用途，並把 certstore／Domino Directory／JVM cacerts 三個信任庫一次分清楚。"
pubDate: 2026-09-04T07:30:00+08:00
lang: zh-TW
slug: certstore-for-developers
tags:
  - "Domino REST API"
  - "Security"
sources:
  - title: "Enable HTTPS using Domino Certificate Manager — HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/dominohttps.html"
  - title: "Managing TLS certificates with Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html"
  - title: "Configuring the Certstore database for TLS — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_config_certstore_for_tls.html"
  - title: "DRAPI + Keycloak OIDC 登入實作筆記（含 certstore 整合實測）— 本站作者的實測 repo"
    url: "https://github.com/bryanHsiao/drapi-oidc-keycloak"
relatedJava: []
relatedSsjs: []
cover: "/covers/certstore-for-developers.webp"
coverStyle: "collage"
---

[Part 1](/domino-news/posts/certstore-getting-started) 把憑證收進 `certstore.nsf`，[Part 2](/domino-news/posts/certstore-acme) 讓它自動跟 Let's Encrypt 申請與續期。到這裡憑證「在庫裡」了，但開發者會馬上撞到兩個實際問題：

1. 我的服務——尤其 **Domino REST API（DRAPI）**——怎麼**直接**用 `certstore.nsf` 裡的憑證來發 HTTPS，而不是另外再指一個 keystore 檔？
2. 反過來，我自己的程式（DRAPI、LotusScript agent）**對外**打 HTTPS 時，是不是也靠 `certstore.nsf` 去驗對方的憑證？

第二題的答案會戳破一個很常見的誤會。這是 certstore 系列第三篇，從開發者這一側把它講完——底下不少結論是我在自己的 **Domino 12.0.2 + DRAPI v1.1.7** 環境親手測出來的。

---

## 重點摘要

- **DRAPI 可以直接吃 certstore**：在 `{notesdata}/keepconfig.d` 放一個 JSON、寫 `{ "TLSCertStore": true }`，DRAPI 就從 `certstore.nsf` 撈憑證發 HTTPS，不必再維護一個獨立 keystore 檔。
- **指定憑證用 `TLSCertStoreName`**：可給字串或陣列（多個 host 走 SNI 比對），支援萬用字元。不指定就抓 server 文件裡「Fully qualified Internet host name」對應的憑證。
- **實測踩到的差別**：同一張萬用憑證，**DRAPI 因為「你指名」所以吃得到；Domino HTTP 是「拿本機 FQDN 去查」，credential 的 Host names 必須含 FQDN，只有萬用不夠。**
- **certstore 的 trusted roots 是給「進來的連線」用的**：官方——「Trusted root certificates allow web servers to accept the trusted root certificates from connecting clients」，外加補全 CA 給的不完整憑證鏈。inbound 方向。
- **你的 outbound 呼叫不是靠 certstore 驗信任**：實測證實 **DRAPI 對外只讀 JVM truststore**（`<Domino>\jvm\lib\security\cacerts`）；server 端 LotusScript `NotesHTTPRequest` 在 14.5 走 **Domino Directory**。同一台機器上，信任分散在三處。

---

## 服務端：讓 DRAPI 直接吃 certstore 的憑證

DRAPI（Keep）要發 HTTPS，本來可以自己指一個 keystore：JKS／PFX（`TLSFile` + `TLSPassword` + `TLSType`）或 PEM（`TLSFile` + `PEMCert`）。但既然憑證已經在 `certstore.nsf` 裡由 CertMgr 管好（Part 1／2），更省事的是叫 DRAPI 直接去撈。

官方做法是在 `{notesdata}/keepconfig.d` 放一個 JSON，[用 Domino Certificate Manager 開 HTTPS](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/dominohttps.html)。最簡單一行：

```json
{
  "TLSCertStore": true
}
```

這樣 DRAPI 會去 `certstore.nsf` 找「跟 server 文件裡 **Fully qualified Internet host name** 相符」的憑證來用。要明確指定就加 `TLSCertStoreName`——字串或陣列都行：

```json
{
  "TLSCertStore": true,
  "TLSCertStoreName": ["foo.bar.com", "api.bar.com"]
}
```

給多個名字時，DRAPI 用 **SNI** 對到對應憑證；也可以給萬用字元 `["*.bar.com"]`。改完把 DRAPI 在所有 server 上重啟即可。好處是憑證只有一份、由 CertMgr 自動續期，DRAPI 跟 web server 都吃同一份。

### 實測：同一張萬用憑證，DRAPI 與 Domino HTTP 的「查法」不一樣

我在自己的環境（Domino 12.0.2、DRAPI v1.1.7、一張 Let's Encrypt `*.domino.com.tw` 萬用憑證）把 Domino HTTP(443) 與 DRAPI(8880) 都改成從 certstore 供憑證，撞到一個文件沒明講、但很關鍵的差別：

- **DRAPI 是「你指名」**：`tls.json` 裡你自己寫 `TLSCertStoreName: ["*.domino.com.tw"]`，DRAPI 就照這名字撈——**萬用憑證直接就夠**。
- **Domino HTTP 是「它拿 FQDN 去查」**：Domino web(443) 用本機的 Fully qualified Internet host name（例如 `ldat05.domino.com.tw`）回 certstore 找 credential。實測：credential 裡**只有萬用 `*.domino.com.tw`、沒放 FQDN** 時，443 握手直接失敗、certstore 沒接手；把那台的 **FQDN 加進該 credential 的 Host names** 之後，443 才正常（送出的還是 `*.domino.com.tw`）。

換句話說，同一張萬用憑證，DRAPI 吃得到、Domino HTTP 卻要你把 FQDN 也列進 Host names 才查得到。接上之後，server document 的「TLS 金鑰檔名」欄位可以直接留空，certstore 就接手——比留著一個失效的 `keyfile.kyr` 字串乾淨。（[web server 用 certstore 當 TLS 來源](https://help.hcl-software.com/domino/14.5.1/admin/conf_config_certstore_for_tls.html)這條路在 Part 1 立庫時就接上了。完整過程另有[實測筆記](https://github.com/bryanHsiao/drapi-oidc-keycloak)。）

## certstore 的 trusted roots 是給「進來的連線」用的

CertMgr 有一個[「Adding trusted root certificates」的功能](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html)，名字聽起來很像「我要信任的 CA 清單」，但官方對它的定義其實是 inbound 方向的——「Trusted root certificates allow web servers to accept the trusted root certificates from connecting clients. Trusted root certificates are also useful for automatically completing partial certificate chains presented by CAs.」

拆開看兩個用途：一是**接受連進來的 client 出示的憑證**（要做 client certificate 驗證、雙向 TLS 時，得先信任簽發那些 client 憑證的 root）；二是**補全 CA 給的不完整憑證鏈**。兩個都是「別人連進我這台 server」的情境。換句話說，`certstore.nsf` 這個庫的重心是**服務端**：我這台 server 對外出示什麼憑證、以及我接受哪些連進來的憑證。

## 你的 outbound 呼叫信任誰？不是 certstore

這就接到那個常見誤會了。很多人以為「我把 CA 放進 certstore，那我的程式對外打 HTTPS 應該就信任它了吧？」——**不是**。你的程式**對外**連線時，驗對方憑證用的是另一套信任庫，跟 certstore 分開：

| 情境（方向） | 用哪個信任庫 |
| --- | --- |
| Web／DRAPI 對外**發** HTTPS（出示自己的憑證） | `certstore.nsf` 的 TLS Credentials |
| server 接受連進來的 **client 憑證** | `certstore.nsf` 的 trusted roots |
| **DRAPI 對外呼叫**（抓 IdP metadata／換 token／抓 JWKS） | **JVM truststore（`cacerts`）** |
| LotusScript `NotesHTTPRequest` **對外呼叫**（14.5 server 端） | **Domino Directory** |
| LotusScript `NotesHTTPRequest` 對外呼叫（14.0 以前 server 端） | data 目錄的 `cacerts.pem` |
| Java agent／XPages SSJS 對外呼叫 | **JVM 的 `cacerts`** keystore |

**你程式對外呼叫時信任誰，跟 certstore 沒關係。** 這句話我拿 DRAPI 串 OIDC 親手驗過。DRAPI 串外部 IdP（Keycloak／ADFS）登入時，如果 DRAPI 不信任 IdP 的憑證，會卡在 **`Error fetching token`**。我把 IdP 的 CA **只**放進 certstore 的 Trusted Root、並從 JVM cacerts 移除、重啟 DRAPI——結果 DRAPI **還是不信任**（那個 provider 直接從 idpList 消失）。反過來，用 Domino 自帶的 keytool 把同一張 CA 匯進 DRAPI 那個 JVM 的 truststore：

```
"<Domino>\jvm\bin\keytool" -import -trustcacerts -alias keycloak-test ^
  -file kc-cert.pem ^
  -keystore "<Domino>\jvm\lib\security\cacerts" -storepass changeit -noprompt
```

重啟後 provider 立刻回到 idpList、登入就通了。**結論很硬：DRAPI 對外走 JSSE、只讀 `<Domino>\jvm\lib\security\cacerts` 這個 JVM truststore；certstore 的 Trusted Root 餵不到 DRAPI 的 Java 對外連線。** 順帶一個常見的誤導：拿 `curl` 測，`curl` 失敗、`curl -k`（略過驗證）卻過，或 PowerShell 的 curl 跟 `curl.exe` 結果不一樣——那只是不同工具用不同信任機制，不代表 DRAPI 會信任。

至於 server 端 LotusScript `NotesHTTPRequest`，Domino 14.5 把它的信任根從 `cacerts.pem` 搬進了 **Domino Directory**——這個變化站上有專篇 [Domino 14.5 改了 NotesHTTPRequest 讀信任根的地方](/domino-news/posts/notes-httprequest-14-5-trust-store) 深入談過（含升級當天 self-signed CA 會突然失敗、`NotesHTTPRequest_Use_CACerts=1` 的退路），這裡不重複；要點只有一個：那是 **Domino Directory**、不是 certstore。

所以同一台 server 上，「憑證信任」至少分散在三處：certstore（服務端出示與接受）、Domino Directory（LS 對外）、JVM cacerts（DRAPI 與 Java／SSJS 對外）。要讓某張自簽 CA 到處都被信任，得在對應的地方各設一次——別以為進了 certstore 就全域生效。

## 小結

certstore 三部曲收在這裡：[Part 1](/domino-news/posts/certstore-getting-started) 把憑證從散落的 kyr 收進 `certstore.nsf`、[Part 2](/domino-news/posts/certstore-acme) 讓它自動跟 Let's Encrypt 申請與續期，Part 3 則是開發者這一側——DRAPI 用 `keepconfig.d` 的 `TLSCertStore` 直接吃庫裡的憑證發 HTTPS（實測到 DRAPI「指名」吃萬用、Domino HTTP 要 FQDN 才查得到）；而 certstore 的 trusted roots 是給進來的連線用的、你程式對外呼叫的信任根另有其庫（DRAPI 與 Java／SSJS 是 JVM cacerts、LS `NotesHTTPRequest` 在 14.5 是 Domino Directory）。把「服務端出示／接受」與「用戶端對外驗證」這兩個方向分清楚，certstore 在你系統裡的位置就不會再模糊。
