---
title: "Domino 的 eMudhra 憑證警報:9.1 分的真相,與該清哪個信任庫"
description: "10 月底 HCL 發了一份把 Domino Server 列為受影響的資安公告,CVE 掛著 9.1 的 CVSS。但這不是 Domino 程式碼的漏洞——是一組 eMudhra 中繼 CA 的私鑰可以被還原,而這些 CA 被 Java 的信任庫、以及 Domino 對外請求的信任鏈給信任了。真正要搞清楚的是三件事:這 9.1 到底怎麼讀(Oracle 給 9.1、Red Hat 給 6.8),你的環境是不是真的中(多數 server 中的是內建 Java cacerts、而不是 certstore.nsf),以及該把哪些憑證從哪些信任庫移掉。這篇把 CVE-2026-91403 / 114820 / 108014 的對應關係、受影響版本、移除清單與驗證方式整理清楚。"
pubDate: 2026-11-05T07:32:00+08:00
lang: zh-TW
slug: domino-emudhra-ca-cve
tags:
  - "Domino Server"
  - "Security"
  - "Admin"
  - "News"
sources:
  - title: "Security Bulletin: eMudhra Compromised Certificate vulnerabilities in Java impact HCL Domino Server (CVE-2026-91403, CVE-2026-114820) — HCL Support（官方）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0134847"
  - title: "CVE-2026-91403 — 官方 CVE 記錄（cve.org，Oracle CNA）"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-91403"
  - title: "CVE-2026-108014 — 官方 CVE 記錄（cve.org，HCL Domino Server）"
    url: "https://www.cve.org/CVERecord?id=CVE-2026-108014"
  - title: "CVE-2026-91403 — Red Hat Customer Portal（CVSS 6.8 的另一種讀法與修法演進）"
    url: "https://access.redhat.com/security/cve/cve-2026-91403"
  - title: "eMudhra CA Key Compromise — How to remove the affected certs — Daniel Nashed's Blog（Domino 社群實務）"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-emudhra-ca-cve.webp"
coverStyle: "ukiyo-e"
---

你管著幾台 Domino server。10 月底一份 HCL 資安公告點名 Domino,CVE 旁邊掛著一個紅色的 **9.1 / 10**。老闆轉了連結給你,問這是不是要連夜處理。

先把呼吸放慢。這不是有人能遠端打進你 Domino 跑指令的那種漏洞——Domino 的程式碼沒出事。真正出事的是**一組被廣泛信任的 CA 憑證**:一家叫 eMudhra 的憑證簽發機構,有幾張中繼 CA 的私鑰可以被還原出來,而這些 CA 又被 Java 的信任庫、還有 Domino 對外連線時用的信任鏈給信任著。換句話說,這是一個**信任庫裡放錯了東西**的問題,不是執行層的破口。分數嚇人,但要處理的事情很具體,也很可控。

這篇講清楚三件事:這個 9.1 到底該怎麼讀、你的環境是不是真的中、以及該把哪些憑證從哪些信任庫清掉。

---

## 重點摘要

- **本質**:eMudhra 的中繼 CA 私鑰可被還原。拿到這些私鑰的人,可以替**任何網域**簽出一張「看起來合法」的 TLS 憑證。只要攻擊者能插進你的連線中間(中間人,MITM),一個仍信任這些 CA 的 Java TLS client 就會接受偽造的站台。
- **不是 Domino 的程式漏洞**,是信任庫內容的問題。CWE 歸在 Improper Certificate Validation[^cwe]。
- **9.1 有兩種讀法**:Oracle 與 HCL 都給 CVSS[^cvss] **9.1**;Red Hat 以 CVSS 3.1 給 **6.8**——差在實際的 MITM 路徑需要攻擊者先取得中間人位置、且受害端要連上去。兩個都不是「有人直接進你 server」。
- **你中了嗎?先看對地方**:多數 Domino server 真正信任這些 CA 的地方是**內建的 Java 信任庫**(`cacerts`)和舊版用到的 `cacert.pem`;`certstore.nsf` **預設只有 Let's Encrypt 的 root**、標準 Domino Directory **預設也不含**這些公開 root——除非你自己匯過。
- **該做的事**:把 HCL 公告列出的那幾張 eMudhra / emSign / Comodo root **從每一個信任庫**移除,**依指紋比對、不要依名稱**,而且相關的幾張要**全部**移(只移一張,鏈可能從另一條路徑繞回來)。
- **受影響版本**(HCL 列的 Domino Server):**12.0.2 FP8 以前、14.0 FP5 以前、14.5 到 14.5.1 FP1**。R12、R14 都在內。

## 這到底是什麼漏洞

TLS 的信任是一條鏈:你的 server 連出去時,對方給一張憑證,憑證往上一層一層簽,最後簽到一張你**信任庫裡**的 root CA。只要鏈能接到一張你信的 root,這條連線就被認定「安全」。

這次出事的是鏈的中段。[CVE-2026-91403](https://www.cve.org/CVERecord?id=CVE-2026-91403) 的核心是:Java 的信任庫裡有 root CA,簽發了 eMudhra 的**中繼 CA**,而這些中繼 CA 的**私鑰可以被還原**。社群的分析指出,受影響的是 8 張 eMudhra 中繼 CA(6 張簽 TLS、2 張簽 code-signing),全部跨簽在 AAA Certificate Services 這張 root 底下。

拿到中繼 CA 的私鑰等於拿到一把萬能鑰匙:可以替 `mail.yourcompany.com`、`login.partner.com`、任何網域簽出一張「鏈得回受信任 root」的憑證。接著只要攻擊者能坐在連線中間(改路由、投毒 DNS、同網段 ARP…),把偽造站台塞給你的 Domino,一個還信任這些 CA 的 TLS client 就會乖乖接受。

要強調的是:**單靠「撤銷(revocation)」擋不住**。很多 TLS 實作預設不檢查撤銷狀態,所以正解是把這些 CA 從信任庫**直接拿掉**,而不是指望撤銷清單。

## 9.1 還是 6.8?

同一個 CVE,你會看到兩個分數,兩個都沒錯,只是在量不同的東西:

| 評分者 | 分數 | 向量 | 在量什麼 |
|---|---|---|---|
| Oracle / HCL | **9.1** | `AV:N/AC:L/PR:N/UI:N/...`（高 C、高 I） | 泛 JSSE / 跑不受信任程式碼的最壞情況 |
| [Red Hat](https://access.redhat.com/security/cve/cve-2026-91403) | **6.8** | `AV:N/AC:H/PR:N/UI:R/...` | 實際的 MITM-TLS 路徑:要中間人位置 + 受害端互動 |

兩者的差距落在 `AC`(攻擊複雜度)和 `UI`(是否需要使用者/用戶端互動)。Oracle 用的是涵蓋最廣的框架給分,Red Hat 針對「偽造憑證 → 中間人」這條實務路徑評估,所以落在中高而非危急。對 Domino 管理員的意義是:**該修,但不是「有人正拿著 exploit 在敲你 443」那種急**。優先度高,但你有時間照步驟做對。

## 你的環境真的中了嗎

這是最容易被 9.1 嚇到而過度反應的地方。問題不在「Domino 有沒有中」,而在「**哪個信任庫**裡真的有這些 CA」。Domino 會碰到的信任庫有好幾個,但預設內容差很多:

- **內建的 Java 信任庫(`cacerts`)** —— 最主要的著火點。Domino 內建的 JVM 自帶一份信任庫(14.x 已是 PKCS12 格式、檔名仍叫 `cacert` 沒有副檔名),裡面就有這些公開 root。這份幾乎一定要處理。
- **`cacert.pem` / `cacerts.pem`(data 目錄)** —— 舊式的信任來源。Domino 14.5 起 server 端 [`NotesHTTPRequest`](/domino-news/posts/notes-httprequest-14-5-trust-store/) 預設已改從 Domino Directory 拿 root、不再讀這個檔;但若你環境還靠它(或有 `.ini` 退回舊行為),就得一起清。
- **`certstore.nsf`** —— 社群實測(Daniel Nashed,10 月下旬)指出它**預設只放 Let's Encrypt 的 root**,所以**只有你自己匯過**這些公開 CA 才會中。
- **標準 Domino Directory(`names.nsf`)** —— 預設也**不含**這些公開 root;同樣只在手動加過時才需要處理。

結論很實際:**先查內建 Java `cacerts`**,再看你是否動過 `cacert.pem`、`certstore.nsf`、Domino Directory。對一台沒客製過信任來源的 server,要清的往往就是那份 bundled Java 信任庫。這也是為什麼先搞懂[三個信任庫各自是什麼](/domino-news/posts/certstore-getting-started/)的人,這次會輕鬆很多。

## EOL 版本別想當然:實測一台 9.0.1

直覺會想「9.x 更舊、應該也中」,但實測結果推翻了這個假設。我們在一台 9.0.1 FP10 的 Domino server 上把三個信任庫都查了一遍——這台是用[我們公開的 build recipe](https://github.com/bryanHsiao/build-hcl-domino9-container) build 出來的 Domino 9 容器(站上也有[怎麼 build 的那篇](/domino-news/posts/build-hcl-domino-9-container/)),內建 IBM J9 Java 1.8.0_151、cacerts 檔案 2018 年、105 張,你可以照同一份 recipe 自己重現:

- **bundled JVM `cacerts`(以 `keytool -list` 實查,最權威)**:**沒有任何 emSign / eMudhra**;但 Comodo 的 **AAA Certificate Services 在**(別名 `comodoaaaca`,SHA-256 `D7:A7:A0:FB…69:EF:4`)。
- **`names.nsf`(Domino Directory)**:我們沒做權威檢查,不下結論;一般標準 Domino Directory 預設不含這些公開 root,只有手動加過才需處理。
- **`cacert.pem`**:這台**根本沒有這個檔**(data 與程式目錄都沒有),所以鎖定 `cacert.pem` 的那類工具在這台無檔可動。

為什麼 emSign 三個庫全無?這版 JVM 的 cacerts 太舊(2018 年),而 emSign 約 2018 後才被各信任庫收錄——根本沒收進來。這也跟官方只把 emSign 列到 12.0.2 / 14.x 一致。所以這台 9.0.1 要評估的**不是 emSign、而是 AAA**;而 AAA 是用途極廣的老 root,**移除回歸面大,動前務必測過你依賴的 TLS 鏈**。

> 範圍聲明:這是**單一一台 9.0.1 FP10 server 容器的實測**,JVM 被手動更新過的 9.0.1 可能不同。穩的結論只有一條:**9.x 別跳過、但也別照抄 12/14 的清單——在你自己每台 9.x 上用 `keytool -list` 以指紋實查,分清哪個庫、哪張。**

## 要移除哪些憑證

HCL 的手動移除指引列出了幾張要拔掉的 root。以下是**截至 2026-11-05 寫稿時**、社群([Nashed](https://blog.nashcom.de/nashcomblog.nsf/dx/emudhra-ca-key-compromise-how-to-remove-the-affected-certs.htm)、panagenda)轉述的清單與 SHA-256 指紋;但**最終請以 HCL 公告的當前清單為準**——這種清單 HCL 可能隨調查更新:

```text
emSign ECC Root CA - G3        （主要）
  SHA-256 86:A1:EC:BA:08:9C:4A:8D:3B:BE:27:34:C6:12:BA:34:
          1D:81:3E:04:3C:F9:E8:A8:62:CD:5C:57:A3:6B:BE:6B

emSign Root CA - C1
  SHA-256 12:56:09:AA:30:1D:A0:A2:49:B9:7A:82:39:CB:6A:34:
          21:6F:44:DC:AC:9F:39:54:B1:42:92:F2:E8:C8:60:8F

emSign ECC Root CA - C3
  SHA-256 BC:4D:80:9B:15:18:9D:78:DB:3E:1D:8C:F4:F9:72:6A:
          79:5D:A1:64:3C:A5:F1:35:8E:1D:DB:0E:DC:0D:7E:B3

AAA Certificate Services (Comodo)
  SHA-256 D7:A7:A0:FB:5D:7E:27:31:D7:71:E9:48:4E:BC:DE:F7:
          1D:5F:0C:3E:0A:29:48:78:2B:C8:3E:E0:EA:69:9E:F4
```

兩個操作上的重點,踩過的人都會提醒:

1. **依指紋比對,不要依名稱**。同一張 root 在不同信任庫裡顯示的名稱不一樣(例如 AAA root 在 `cacert.pem` 裡可能叫「Comodo AAA Services root」)。用 SHA-256 指紋對,才不會漏掉或誤刪。
2. **該移的要全部移**。Nashed 特別點名:`emSign ECC Root CA - G3` 和那張 Comodo cross-cert **兩個都要拔**——只移其中一張,憑證鏈可能從另一條路徑重新建起來,等於沒清。

> **還有一張有爭議的第 5 張:emSign Root CA – G1。** 上面四張是 HCL/Domino 社群(panagenda)的移除清單;G1 不在內——**截至 2026-11-05**,[Mozilla 選擇不移除](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449)、Chrome 還在評估(G1 的爭點偏向一份 CRL 簽章問題,跟那 8 張中繼 CA 私鑰外洩不完全同一條線)。但部分 Java 信任庫的指引(如 Ignition、Camunda)與一些實務修復工具採較保守立場、會連 G1 一起移。你在清 Java `cacerts` 時若遇到 G1,這不是「漏列」,是各家畫線不同——以你的 vendor 當前指引為準,動前先測過你服務依賴的 TLS 鏈。

## 伺服器端該怎麼補:步驟與語法

順序:**查 → 備份 → 移除 → 驗證**;移除是「看完報告、人工決定」那一步,不是一鍵。就目前(2026-11-05 寫稿時)HCL 的指引仍以**手動步驟為主、等後續修正版釋出**。

**1. 先查(唯讀,不動任何東西)** — 用 Domino **內建的** keytool 列 bundled JVM cacerts,比對指紋看那幾張在不在:

```
"<Domino>\jvm\bin\keytool" -list -v -keystore "<Domino>\jvm\lib\security\cacerts" -storepass changeit | findstr /i "emSign emudhra 86:A1:EC BC:4D:80 12:56:09 40:F6:AF D7:A7:A0"
```

Linux/AIX 把 `findstr` 換成 `grep -i`;Domino 14.5+ 可用更短的 `keytool -list -v -cacerts`(免指路徑與密碼)。掃到哪個前綴,對照上面清單就知道是哪張。`cacert.pem`(若這台有)則打開逐段看 PEM 區塊的指紋。

**2. 備份**(改壞 cacerts = 這台 HTTPS/TLS 整個起不來):

```
copy "<Domino>\jvm\lib\security\cacerts" "<Domino>\jvm\lib\security\cacerts.bak"
```

**3. 移除(依指紋決定、照別名刪)** — `keytool -delete` 是**用別名(alias)**刪的,而別名跨版本不一樣,所以**先用步驟 1 的指紋認出是哪張、再刪它那筆的別名**(例如 AAA 常見別名是 `comodoaaaca`):

```
"<Domino>\jvm\bin\keytool" -delete -alias comodoaaaca -keystore "<Domino>\jvm\lib\security\cacerts" -storepass changeit
```

⚠️ **刪哪幾張,按 HCL 當前清單決定**;尤其 **AAA 用途極廣、回歸面大**——動前務必測過你依賴的 TLS 鏈,並保留備份。

**4. 驗證**:把步驟 1 再跑一次,應該**一張都掃不到**;改完 cacerts 後**重啟 HTTP task** 讓它重讀。

**5. 其他庫另案**:`cacert.pem` 直接編輯(依指紋刪整段 PEM);`certstore.nsf`、`names.nsf`(Domino Directory)與 OS 憑證庫**只有你手動加過時才需要處理**,而且 `names.nsf` 的交叉憑證是 NSF 文件、要走 Domino admin / DXL、不是檔案工具(Nashed 指出標準 Domino Directory 預設不含這些 root)。

確切步驟與是否已有修正版,對照 HCL 的 Domino Server 公告(KB0134847)與它連出的手動移除 KB。

## 怎麼確認真的清乾淨

Nashed 給了一段 LotusScript 測試,用 `NotesHTTPRequest` 去連一個「拿被波及 CA 簽的憑證」的測試站,看連線會不會被擋:

```lotusscript
Dim req As New NotesHTTPRequest
req.Maxredirects = 0
Dim response As String
response = req.Get(testUrl)   ' 清乾淨後:這裡應該要失敗(cert 不受信)
```

一個很重要的但書:**這只測到 LotusScript 的 `NotesHTTPRequest` 這條路**。Domino 內嵌的瀏覽器、Java 層的 HTTP client、其他元件各自走各自的信任庫,得分開驗。Linux 上可以另外用 `curl` 打同一個測試站交叉確認。換句話說,**在一條路徑上測過不代表全部都安全**——每個會對外連線的元件都要各自確認。

## 這一串 CVE 怎麼對應

這次會看到不只一個 CVE 編號,容易混。拆開看其實很清楚:

- **CVE-2026-91403 / CVE-2026-114820** —— 上游 **Java** 的問題(Oracle Java SE、GraalVM、OpenJDK)。91403 是第一版(只擋中繼 CA);因為被發現容易繞過、第一版修法不夠,OpenJDK 乾脆把 root CA 整個移除,另開 114820。Domino 內建 JVM,所以跟著受影響——這就是 [KB0134847](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0134847) 這份 Domino Server 公告掛這兩個號的原因。
- **CVE-2026-108014** —— HCL 自己開的號,針對 **Domino Server 對外請求功能**的憑證信任,[cve.org 記錄](https://www.cve.org/CVERecord?id=CVE-2026-108014) 顯示 2026-10-27 發布、CVSS 9.1。這就是 10 月底那份「正式公告」的主角。
- **CVE-2026-108015** —— 同性質,但針對 **Notes client** 的對外功能。

四個號、兩層(上游 Java + Domino 自身),但**收尾動作是同一件事**:把那幾張被波及的 root 從你的信任庫裡清掉。

## 一句話收尾

這是一次典型的「分數很高、但本質是信任庫衛生」的事件。它接續的是 Domino 14.5 把 [NotesHTTPRequest 的信任來源改成 Domino Directory](/domino-news/posts/notes-httprequest-14-5-trust-store/) 那條線,也接續了 [certstore / CertMgr 的憑證管理模型](/domino-news/posts/certstore-getting-started/)——同一個 DRAPI [只吃 JVM truststore](/domino-news/posts/drapi-keycloak-oidc/) 的世界。真正搞懂「我這台 server 到底信任哪些 root、放在哪幾個庫」的人,這次只是照指紋清幾張憑證;沒搞懂的人,才會被那個 9.1 嚇得不知從何下手。

[^cvss]: CVSS(Common Vulnerability Scoring System)是業界通用的漏洞嚴重度評分,0–10 分,附一條標明攻擊途徑、複雜度、所需權限等的「向量字串」。同一漏洞不同評分者可能給不同分數,因為他們假設的攻擊情境不同。
[^cwe]: CWE(Common Weakness Enumeration)是弱點「類型」的分類標準。本案歸在 CWE-295(憑證驗證不當)與 CWE-327(使用有風險的加密機制)——都指向「信任關係本身出錯」,而非程式記憶體被攻破那類執行層漏洞。
