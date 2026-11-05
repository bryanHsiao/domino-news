---
title: "Notes client 的 eMudhra 憑證:難的不是哪張,是幾千台"
description: "伺服器端把那幾張被波及的 eMudhra / emSign / Comodo root 清掉,是一台一台、admin 自己操作;到了 Notes client,同一批憑證散在你公司每一台桌機上——你沒辦法 SSH 進五千台工作站。這篇接續 Domino Server 那篇,專講 client 端:憑證藏在哪幾個不一樣的信任庫(local names.nsf 的 Advanced > Certificates、程式目錄下的 Java cacerts、每台的 cacert.pem、macOS keychain)、為什麼沒有內建方法一次清完、怎麼用 MarvelClient 或你的軟體佈署工具把更新推到每一台,以及一個官方公告沒寫、但你最好自己查的角落:EOL 的 9.x。"
pubDate: 2026-11-05T07:30:00+08:00
lang: zh-TW
slug: notes-client-emudhra-ca-cve
tags:
  - "Notes Client"
  - "Security"
  - "Admin"
  - "News"
sources:
  - title: "CVE-2026-108015 — 官方 CVE 記錄（cve.org，HCL Notes Client outbound 憑證信任）"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-108015"
  - title: "CVE-2026-91403 — 官方 CVE 記錄（cve.org，上游 Java / 內建 Semeru JVM）"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-91403"
  - title: "Removing compromised eMudhra certificates from HCL Notes clients with MarvelClient — panagenda（client 佈署實務，Christoph Adler）"
    url: "https://www.panagenda.com/de/blog/remove-emudhra-certificates-hcl-notes/"
  - title: "eMudhra CA Key Compromise — How to remove the affected certs — Daniel Nashed's Blog"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm"
  - title: "CVE-2026-91403 — Red Hat Customer Portal（CVSS 6.8 的另一種讀法）"
    url: "https://access.redhat.com/security/cve/cve-2026-91403"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-client-emudhra-ca-cve.webp"
coverStyle: "low-poly-3d"
---

伺服器那關比較單純:幾台 Domino,你自己一台一台登進去,照指紋把那幾張被波及的 eMudhra / emSign / Comodo root 從信任庫清掉就好([怎麼判斷你中不中、清哪張,在 Domino Server 那篇講過](/domino-news/posts/domino-emudhra-ca-cve/))。

難的是桌面端。同一批憑證,**散在你公司每一台 Notes client 上**——業務的筆電、會計的桌機、那台沒人記得還開著的 kiosk。漏洞一模一樣,但你不可能 SSH 進五千台工作站手動改檔。這一關的難度不在「清哪張憑證」,而在**規模**:怎麼確定每一台都清到、清的是對的那幾個庫、而且不吵到使用者。

這篇就專講 client 端:憑證藏在哪幾個跟伺服器不一樣的信任庫、為什麼沒有一個按鈕能一次清完、怎麼靠佈署工具把更新推到每一台,以及一個官方公告沒列、但你最好自己查的角落——還在跑的 9.x。

---

## 重點摘要

- **是同一批憑證、同一個根因**(eMudhra 中繼 CA 私鑰可被還原 → MITM 可偽造受信任站台),只是這次在 client 端。對應的 CVE 是 Notes client 的 CVE-2026-108015,加上內建 Semeru JVM 跟著中的上游 Java [CVE-2026-91403 / 114820](https://www.cve.org/CVERecord?id=CVE-2026-91403)。CVSS 一樣掛 9.1(Red Hat 對上游那支的[另一種讀法是 6.8](https://access.redhat.com/security/cve/cve-2026-91403))。
- **client 的信任庫跟 server 不一樣**:`cacert.pem`(每台 data 目錄各一份)、內建 Java 的 `cacerts`(程式目錄 `jvm\lib\security`,寫入要 admin)、local `names.nsf` 的 **Advanced > Certificates**、macOS 上則是 **keychain**。
- **沒有內建方法一次清很多台**。實務解法是佈署工具:MarvelClient、或你既有的軟體派送(SCCM/Intune 之類)。
- **受影響版本**:12.0.2 FP8↓ / 14.0 FP5↓ / 14.5–14.5.1 FP1。
- **別漏 EOL 的 9.x**:官方公告只列支援中的版本,但這些 root 早於 12.x 就內建——9.x 的信任庫很可能有同一批,得自己查。

## client 端:憑證到底藏在哪

伺服器那篇列過要移除的 root 清單與 SHA-256 指紋,這裡不重抄([完整清單看那篇](/domino-news/posts/domino-emudhra-ca-cve/))。client 端的差別在**位置**——同樣那幾張憑證,躲在不太一樣的幾個庫裡,而且每台桌機都有一份:

| 信任庫 | 在哪 | 備註 |
|---|---|---|
| `cacert.pem` | 每台 Notes `data` 目錄 | 每台一份;沒有內建方法一次清 |
| 內建 Java `cacerts` | 程式目錄 `jvm\lib\security` | 寫入要 admin 權限 |
| local `names.nsf` | Notes 用戶端:Advanced > Certificates | KB0134844 列 AAA Certificate Services (Comodo) 可從這裡移 |
| macOS keychain | Mac 版 Notes | Mac 版靠 keychain、不是 `cacert.pem` |

重點跟伺服器端一樣:**依指紋比對、不要依名稱**,而且該移的要全部移(只移一張,鏈可能從另一條路徑繞回來)。差別只在於,你現在要在**每一台**上都做到這件事。

## 真正的難題:規模

panagenda(Christoph Adler)那篇講 client 補救講得最實在,核心就一句:**沒有內建機制能一次把這些憑證從一大批 client 清掉**,你得靠佈署工具把「乾淨的檔案」推上去。拆成三件事:

1. **`cacert.pem`——用更新版覆蓋全部。** [MarvelClient](https://www.panagenda.com/de/blog/remove-emudhra-certificates-hcl-notes/) 可以把一份已清乾淨的 `cacert.pem` 佈到每台的 `data` 目錄、直接覆蓋既有的。用你自己的派送工具(SCCM、Intune、GPO 登入腳本)推同一份檔也行。
2. **local `names.nsf`——跑清除 agent。** 這個庫在每個使用者的個人通訊錄裡,手動進 Advanced > Certificates 一台一台刪不切實際。panagenda 有一支 agent 會檢查 local `names.nsf` 裡的受影響 certifier 並移除、透過 MarvelClient 無互動執行(需 MarvelClient Basic 授權,來信他們索取)。沒有這類工具的話,就得自己寫對應的派送。
3. **內建 Java `cacerts`——換檔。** 這份在程式目錄下、要 admin,MarvelClient Upgrade 可以換成更新版,或用你的軟體佈署工具替換。
4. **macOS——走系統更新。** Mac 版 Notes 靠 macOS keychain,panagenda 的建議是把 Mac 更新到最新、讓作業系統那層處理。

如果你本來就在用 MarvelClient 管客戶端,這次等於是它的主場——這也是為什麼[把客戶端管理工具養起來](/domino-news/posts/notes-httprequest-14-5-trust-store/)的團隊,遇到這種「全 fleet 推一份檔」的事會從容很多。

## 別漏了 EOL 的 9.x(但別照抄清單)

HCL 的 bulletin 只列支援中的版本(12.0.2 FP8↓ / 14.0 FP5↓ / 14.5–14.5.1 FP1)。9.x 不在上面,是因為 **EOL、不是因為安全**——所以別跳過;但也別把 12/14 的清單照抄過去。

我們實測一台 9.0.1 的 bundled JVM,結果跟直覺相反:**emSign 一張都沒有**(JVM 太舊、根本沒收進來),**反而是 Comodo AAA 在**——完整結果與範圍聲明見 [Domino Server 那篇的實測](/domino-news/posts/domino-emudhra-ca-cve/)。那是一台 server;**client 同樣是 bundled JVM 結構**,但我們沒有另外實測一台 9.0.1 client。所以最實在的做法是:**你環境裡每台 9.x client,自己用 `keytool -list` 以指紋查一遍**,看哪個庫有哪張,別靠假設。

## 怎麼確認每一台真的清乾淨

Daniel Nashed 給了一段 LotusScript 測試鈕,用 `NotesHTTPRequest` 去連一個「拿被波及 CA 簽的憑證」的測試站,看連線會不會被擋:

```lotusscript
Dim req As New NotesHTTPRequest
req.Maxredirects = 0
Dim response As String
response = req.Get(testUrl)   ' 清乾淨後:這裡應該要失敗(cert 不受信)
```

但 client 端的驗證有個更尖銳的但書,比伺服器端還重要:**一台桌機上會對外連線的元件不只一個**。這段只測到 LotusScript 的 `NotesHTTPRequest`;Notes 內嵌的瀏覽器、Java 層的 client、甚至同一台上別的軟體,各自讀各自的信任庫。[Nashed 的測試](https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm) 與社群引用的 live 測試站可以快速確認「LS 這條」清了,但**瀏覽器或 curl 測過,不代表同台其他元件也安全**。每個對外連線的入口都要各自確認——而且是在你抽樣的每一台上。

## 跟 Server 篇、跟這一串 CVE 怎麼對應

拆開看就不亂:

- **CVE-2026-108015** —— HCL 給 **Notes client** 對外請求功能的號,[cve.org 記錄](https://www.cve.org/CVERecord?id=CVE-2026-108015) 顯示 2026-10-27 發布、CVSS 9.1。它是伺服器那支 CVE-2026-108014 的 client 鏡像。
- **CVE-2026-91403 / 114820** —— 上游 **Java** 的問題;Notes client 內建 IBM Semeru JVM,所以跟著受影響(這部分跟伺服器端共用同一個上游根因)。
- 至於**漏洞本質、9.1 vs 6.8 怎麼讀、完整的 cert 清單與指紋**,都在 [Domino Server 那篇](/domino-news/posts/domino-emudhra-ca-cve/)——client 端要補的是「怎麼在一大批桌機上做到同一件事」。

對照 HCL 對應的 Notes client 公告(涵蓋內建 Semeru JVM 與 client 對外功能的那兩份)與手動移除 KB,確認你這版的確切步驟與修正版狀態;第三方彙整站的 KB 編號偶有出入,以 HCL 支援入口的為準。

## 一句話收尾

伺服器那關考的是「你知不知道自己信任哪些 root」;客戶端這關考的是「你有沒有辦法對全 fleet 一次做對一件事」。前者靠對信任庫的理解,後者靠你平常有沒有把[憑證模型](/domino-news/posts/certstore-getting-started/)和客戶端佈署的底子打好。這次要推的,不過是一份乾淨的 `cacert.pem` 加一支清 `names.nsf` 的 agent——真正決定你今天輕不輕鬆的,是那套佈署管道早就在不在。
