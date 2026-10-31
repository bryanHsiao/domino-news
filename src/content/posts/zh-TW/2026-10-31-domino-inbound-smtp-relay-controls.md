---
title: "別讓 Domino 變成 open relay:inbound SMTP 管制"
description: "open relay(開放轉送)就是一台設錯的 SMTP 伺服器,會替任何人把信轉去任何地方——垃圾信寄送者最愛拿來當轉運站,結果你的 IP 上黑名單、連正常信都送不出去。Domino 預設其實會擋外部主機的 relay,但你得懂它怎麼擋。這篇講 inbound relay controls 的四個欄位(allow/deny × 目的網域/來源主機)、allow 與 deny 怎麼互動(allow 優先、但同一筆同時在兩邊時 deny 贏)、Domino 會查「原始寄件人」而不只是最後一跳、enforcement 的範圍(預設只對 local 網域外的主機、認證使用者預設豁免、放寬不建議)、可加掛的 DNS 黑名單(DNSBL:只記錄 / 記錄加標記 / 記錄並拒收)與私有黑名單/白名單,以及反向 DNS 檢查(解不到 PTR 就不收信)。"
pubDate: 2026-10-31T07:30:00+08:00
lang: zh-TW
slug: domino-inbound-smtp-relay-controls
tags:
  - "Domino Server"
  - "Admin"
  - "Security"
sources:
  - title: "Setting inbound relay controls(SMTP Inbound Controls 分頁的四個 allow/deny 欄位、allow 優先、查原始寄件人、* 用法)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_settinginboundrelaycontrols_t.html"
  - title: "Specifying enforcement of inbound relay controls(enforcement 範圍:預設只對 local 網域外主機、認證使用者預設豁免、放寬不建議)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_specifyingenforcementofinboundrelaycontrols_t.html"
  - title: "Enabling DNS blacklist filters for SMTP connections(DNSBL:只記錄/記錄加標記/記錄並拒收、只對受 relay 管制的主機)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/conf_enablingdnsblacklistfiltersforsmtpconnections_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-inbound-smtp-relay-controls.webp"
coverStyle: "risograph"
---

**open relay(開放轉送)**就是一台設錯的 SMTP 伺服器:它會替**任何人**把信轉去**任何地方**。垃圾信寄送者最愛這種——拿你的伺服器當轉運站大量發垃圾信,結果**你的 IP 被列上黑名單**,連公司自己的正常信都送不出去。好消息是 Domino **預設就會擋**外部主機的 relay;但你得懂它怎麼擋、範圍到哪、還能加掛什麼,才不會哪天不小心開了洞。

---

## 重點摘要

- **什麼是 open relay**:一台「不分來源、把外部來的信又轉去另一個外部目的地」的 SMTP 伺服器。Domino 的 **inbound relay controls** 就是用來擋這個;一台新的 Domino SMTP 伺服器**預設擋掉外部主機的 relay**。
- **設在哪**:Configuration Settings 文件 → Router/SMTP → Restrictions and Controls → **SMTP Inbound Controls** 分頁。
- **四個欄位**:allow/deny 各兩個,一組管**目的網域**、一組管**來源主機**:只允許送到某些網域 / 拒絕送到某些網域、只允許某些主機來轉送 / 拒絕某些主機轉送。
- **allow 與 deny 怎麼互動**:**allow 優先**於相衝突的 deny;但**同一筆**同時出現在 allow 和 deny 時,**Domino 以 deny 為準**。空的 allow 欄位代表不限制。
- **查原始寄件人**:Domino 判斷能不能 relay 時,看的是**原始寄件人、不只是最後一跳**——擋掉「從被拒來源、繞過一台被允許的伺服器」這種偷渡。
- **enforcement 範圍**:預設只對**本地 Internet 網域以外**的主機套用(本地網域的主機豁免);**認證過的使用者預設也豁免**(可改成一樣受檢);官方說**放寬 enforcement 的選項不建議**。
- **可加掛**:**DNSBL(DNS 黑名單)**在每個連線時查 IP,動作可選**只記錄 / 記錄加標記 / 記錄並拒收**;另有**私有黑名單**與 **DNS 白名單**——這些都**只對受 relay 管制的主機**生效。

## 什麼是 open relay,Domino 怎麼看

Domino 的文件把 **open relay** 定義成:一台**不分來源**、把「從本地 Internet 網域之外來的信」又**轉去另一個外部目的地**的 SMTP 伺服器。這正是垃圾信要的——免費的轉運站。擋它的機制叫 **inbound relay controls**,設在 **Router/SMTP → Restrictions and Controls → SMTP Inbound Controls** 分頁。預設上,一台 Domino SMTP 伺服器**不讓外部主機拿它 relay**。

## 四個欄位:allow / deny × 網域 / 主機

inbound relay controls 有四個欄位,兩兩一組([官方:設定 inbound relay controls](https://help.hcl-software.com/domino/11.0.1/admin/conf_settinginboundrelaycontrols_t.html)):

**管目的網域**(信能被轉到哪):

- **Allow … only to the following external Internet domains**:**只允許**轉去清單裡的網域,其他外部網域一律拒。
- **Deny … to the following external Internet domains**:**拒絕**轉去清單裡的網域;填 **`*`** 代表**擋掉所有外部網域**,其他才放行。

**管來源主機**(誰能拿它轉送):

- **Allow … only from the following Internet hosts**:填了之後,**只有清單裡的主機/IP** 能向外轉送,其他主機一律拒。
- **Deny … from the following Internet hosts**:**拒絕**清單裡的主機轉送;填 **`*`** 代表**擋掉所有受 relay 管制的主機**。

兩個規則:**allow 優先**於相衝突的 deny;但**同一筆**entry 同時出現在 allow 與 deny 時,**Domino 以 deny 為準**。空的 allow 欄位代表「不加限制」。

還有一個關鍵判斷:Domino 決定能不能 relay 時,**看的是原始寄件人,不是只看最後一跳的網域**——所以「從一個被你拒絕的來源、先繞過一台你允許的伺服器、再想送進你網域」這種繞道,會被擋下來。

## enforcement:到底對誰套用

光設了 allow/deny 還要看**對誰生效**([官方:指定 inbound relay 的 enforcement](https://help.hcl-software.com/domino/10.0.1/admin/conf_specifyingenforcementofinboundrelaycontrols_t.html)):

- **預設只對「本地 Internet 網域以外」的主機**套用 relay 檢查;**本地網域內的主機豁免**。其他選擇是「所有連進來的主機」或「都不套」。
- **認證過的使用者預設豁免**——已經登入的人不受這些 relay 限制;你可以改成「認證使用者也一樣受檢」,並列出要豁免的主機。
- 官方特別提醒:**放寬 enforcement 的選項不建議**(relax enforcement is not recommended)——把關放鬆就是給 relay 開洞。

## 可加掛:DNSBL、私有黑白名單、反向 DNS

relay controls 之外,Domino 還能加幾層針對「連進來的 SMTP 主機」的過濾:

- **DNSBL(DNS 黑名單)**:每個進來的連線都去查設定好的 DNSBL 站台,看對方 IP 在不在公開的垃圾來源名單上。命中後的動作可選:**只記錄(log)/ 記錄加標記(log and tag)/ 記錄並拒收(log and reject)**([官方:啟用 DNSBL](https://help.hcl-software.com/domino/10.0.1/conf_enablingdnsblacklistfiltersforsmtpconnections_t.html))。注意 DNSBL **只查 IPv4**;IPv6 連線會**跳過** DNSBL 檢查。
- **私有黑名單 / DNS 白名單**:自己維護的黑名單、或把信任來源放進白名單略過檢查。
- **反向 DNS**:inbound 連線控制有個「**Verify connecting host name in DNS**」選項(**預設關**),開了會反查對方 IP 的 **PTR record**;**解不到**主機名(DNS 不通、或根本沒 PTR)就**拒收**(實際上是先收下連線、再在 `MAIL FROM` 階段回錯誤拒信,不是一開始就斷線)。但官方提醒:合法的 SMTP 主機**不一定**有 PTR,開這個可能**誤殺正常來源**,要斟酌。

一個共通點要記住:**DNSBL、黑白名單這些,都只對「受 relay 管制的主機」生效**——也就是說,被你豁免(本地網域、認證使用者、白名單)的主機不會被這些擋到。設計上是「先決定誰要管、再對要管的人做過濾」。

## 小結

- **open relay**:替任何人把外部信轉去外部的 SMTP 伺服器;Domino 預設擋外部 relay,設在 SMTP Inbound Controls 分頁。
- **四欄位**:allow/deny × 目的網域/來源主機;allow 優先、同筆 deny 贏、空 allow=不限;`*` 擋全部。
- **查原始寄件人**:不只看最後一跳,擋繞道。
- **enforcement**:預設只對本地網域外主機、認證使用者預設豁免、放寬不建議。
- **加掛**:DNSBL(log/tag/reject)、私有黑名單、DNS 白名單、反向 DNS(無 PTR 不收)——都只對受 relay 管制的主機生效。
