---
title: "實作筆記：DRAPI 透過 Keycloak OIDC 登入 — Domino 12.0.2 就能用、不必等 14"
description: "想把 DRAPI（Domino REST API）接到 modern IdP — 譬如 Keycloak、Azure AD、Okta — 通常以為要等 Domino 14 才有 OIDC、其實 12.0.2 用 DRAPI 的 oidc mode 就能跑通。本文是本機完整重現整套 setup 的實作筆記、聚焦 DRAPI 三個 OIDC mode 怎麼選、三層獨立認證架構（identity / mapping / authorization）為什麼要分層 debug、跟 4 個會卡很久的踩雷 — 最大那個是 providerUrl 用 localhost 因為 Java IPv4 解析造成跨機器整個 fail。完整 step-by-step 在 GitHub repo + Pages 上、文章本身不重複 setup、聚焦關鍵 decision 跟陷阱。"
pubDate: 2026-06-01T07:30:00+08:00
lang: zh-TW
slug: drapi-keycloak-oidc
tags:
  - "Domino"
  - "Tutorial"
sources:
  - title: "DRAPI + Keycloak OIDC 實作筆記 — GitHub repo"
    url: "https://github.com/bryanHsiao/drapi-oidc-keycloak"
  - title: "DRAPI + Keycloak OIDC 實作筆記 — 公開 site"
    url: "https://bryanhsiao.github.io/drapi-oidc-keycloak/"
  - title: "Authentication — HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html"
  - title: "Configuring OIDC-based SSO for web users (Domino 12.0.2)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/secu_config_oidc_based_sso_for_web.html"
relatedJava: []
relatedSsjs: []
---

想把 DRAPI（Domino REST API）接到 modern IdP — Keycloak、Azure AD、Okta — 跳開傳統 LTPA cookie 跟 domcfg form login、走 OIDC 認證。直覺上會以為要等 Domino 14 才有支援、官方文件也以 14 起為主。

實際做下去會發現：**Domino 12.0.2 用 DRAPI 的 `oidc` mode 就能跑通**、不必等 server 升 14。這條路雖然 setup 步驟不少、但每一步都有官方支援、不是 hack。

本文是把這套 setup 在本機完整重現的實作筆記 — 聚焦 DRAPI 三個 OIDC mode 怎麼選、三層獨立認證架構為什麼失敗時要分層 debug、跟 4 個會卡很久的踩雷。完整 step-by-step 在 [GitHub repo](https://github.com/bryanHsiao/drapi-oidc-keycloak) 跟對應的 [Pages site](https://bryanhsiao.github.io/drapi-oidc-keycloak/) 上、本文本身不重複 setup、聚焦關鍵 decision 跟陷阱。

---

## 重點摘要

- [**DRAPI 三個 OIDC mode**](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)：`jwt`（只有 public key）/ `oidc`（標準 OIDC provider、需 clientId + clientSecret）/ `oidc-idpcat`（**需要 Domino 14+**、共用 idpcat.nsf 設定）
- **這個 demo 用 `oidc` mode** — clientId / clientSecret 直接在 `keepconfig.d` 設、不依賴 Domino server 版本
- **Domino 12.0.2 就能跑** — [12.0.2 就有 OIDC web login 設定](https://help.hcl-software.com/domino/12.0.2/admin/secu_config_oidc_based_sso_for_web.html)、不必等 14
- **三層獨立認證關卡**：identity（OIDC 驗你是誰）→ mapping（token claim 對應 Person doc）→ authorization（scope 決定能不能用）— 任一層失敗都報「login failure」、要分層 debug
- **4 個踩雷**：缺 `adminui` block / **`providerUrl` 用 localhost 因 Java 走 IPv4 跨機器整個 fail**（最大坑）/ browser localStorage 殘留舊 config / default client scopes 不會回追既有 client
- **完整 setup** 包括 WSL Ubuntu + Keycloak 安裝、realm / client / scope 設定、DRAPI keepconfig.d 對應、PEM 憑證信任、curl 驗證 reachability — 全部在 [repo + site](https://bryanhsiao.github.io/drapi-oidc-keycloak/) 上

---

## 為什麼這個 demo 值得跑一次

幾個 motivation：

1. **要替代 domcfg form login**：傳統 domcfg.nsf 自家 login form 寫死綁 Domino 帳號、跟現代 IdP 整合困難。OIDC 是業界標準、Keycloak 又是 open source 的成熟方案、組合起來可以打通跨系統 SSO
2. **DRAPI 是「現代 stack」入口**：對 React / Vue / 純 SPA / mobile app 來說、DRAPI 是接 Domino data 的主要 path。如果這層認證走 OIDC、整套 frontend 開發就可以用業界通用的 IdP toolchain
3. **本機跑通能消除版本焦慮**：很多人卡在「我們 server 是 12.x、要等升 14 才能用 OIDC」 — 實際試過會發現 `oidc` mode 在 12.0.2 就 work、不是技術限制是版本誤解

---

## DRAPI 三個 OIDC mode

[官方 DRAPI authentication doc](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html) 把 OIDC 設定分三種 mode、依環境跟需求選：

| Mode | 適合場景 | Domino 版本 | clientId/Secret 放哪 |
|---|---|---|---|
| **`jwt`** | provider 只給你 public key、或自己手 build JWT verification | 任何版本 | DRAPI 直接設 `iss` / `kid` / `keyFile` |
| **`oidc`** | 標準 OIDC provider（Keycloak / Entra ID / Okta）、想獨立設定 | **12.0.2+** | 直接放 `keepconfig.d` |
| **`oidc-idpcat`** | 跟 Domino server 共用同一個 IdP 設定 | **需 14+** | 用 Domino 的 `idpcat.nsf` 集中管理 |

### 為什麼這個 demo 選 `oidc`

- **Domino 12.0.2 就能用** — `oidc-idpcat` 需要 14+、demo 環境若還在 12.x 用不到
- **跟 Domino server auth 解耦** — DRAPI 自己有 clientId / clientSecret、不依賴 Domino server 的 IdP 設定。對「DRAPI 跟 Domino server 對接不同 IdP」的場景有彈性
- **設定集中在一個 JSON 檔** — `keepconfig.d` 就一個位置、不必跨檔追 idpcat.nsf

`oidc-idpcat` 的好處（[官方文件](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)寫的）是 shared cache 跟 shared diagnostics — Domino server 跟 DRAPI 走同一 IdP 時、token 快取共用、debug 統一。**升到 Domino 14+ 之後**、把這個 demo 從 `oidc` 轉 `oidc-idpcat` 是自然的升級路徑。

---

## 三層獨立認證架構

OIDC 接 DRAPI 失敗時、最常見的錯誤 reaction 是「login failed」一律當成「OIDC 設定錯」、整個翻 Keycloak。但實際上 DRAPI 認 OIDC 是**三層獨立關卡、任一層失敗都顯示同樣的 login failed**：

| 層 | 問題 | 失敗症狀 |
|---|---|---|
| **1. Identity (你是誰)** | OIDC flow 本身、Keycloak 認證 | token 拿不到 / Keycloak 那邊就擋 |
| **2. Identity Mapping (token 對應到 Domino 是哪個人)** | token 的 claim（譬如 email）對應 Person doc 的 Internet address | 拿到 token 但對不到 Domino user、視為 unknown user |
| **3. Authorization (這個人能做什麼)** | DRAPI scope（譬如 `$DATA` / `$SETUP`）對應 client 的 scope 設定 | 對到 user 但沒對 scope、API call 被拒 |

Debug 時要分層往下：

```
登入失敗
  ├─ Keycloak realm log 有錯？  → 第 1 層、OIDC 本身
  ├─ DRAPI log 寫 "user not found in directory"？  → 第 2 層、mapping
  └─ DRAPI log 寫 "missing scope"？  → 第 3 層、authorization
```

把這三層當獨立關卡看、debug 速度差很多 — 不會把第 2 層的 mapping 問題當成第 1 層的 OIDC config 錯誤一直翻 Keycloak realm 設定。

---

## 關鍵 config — `keepconfig.d` JSON 結構

DRAPI 的 OIDC 設定放在 `keepconfig.d/` 資料夾的 JSON 檔裡（[官方文件示範格式](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)）。`oidc` mode 的最小結構：

```json
{
  "oidc": {
    "keycloak": {
      "active": true,
      "providerUrl": "https://192.168.x.x:8443/realms/domino",
      "clientId": "Domino",
      "clientSecret": "你的 keycloak client secret",
      "userIdentifier": "email",
      "scope": "$DATA",
      "adminui": {
        "active": true,
        "displayName": "Keycloak SSO"
      }
    }
  }
}
```

幾個欄位非看不可：

- **`providerUrl`** — Keycloak realm 的 base URL。**不能用 `localhost`**（見下節踩雷 #2）
- **`clientId` / `clientSecret`** — Keycloak realm 裡建的 client 設定。clientId 官方建議用 `Domino`
- **`userIdentifier`** — token 的哪個 claim 拿來對 Domino。設 `email` 表示用 token 的 email claim 對應 Person doc 的 Internet address。要對 LDAP DN 的話另外設 `userIdentifierInLdapFormat: true`
- **`scope`** — DRAPI 接受的 scope name。`$DATA` 是 read/write 文件、`$SETUP` 是管理操作、`keepconfigadmin` 是 keepconfig 管理
- **`adminui`** block — 這個 block **不能缺**、否則 DRAPI 管理 UI 的 login dropdown 不會出現這個 provider 選項、URL 變 `/admin/undefined`（踩雷 #1）

完整版含 `additionalClientIds` / `userIdentifierInLdapFormat` / 多 scope 等的設定範例、看 [repo 內的 `keepconfig.d` 樣板](https://github.com/bryanHsiao/drapi-oidc-keycloak)。

---

## 4 個會卡很久的踩雷

### 踩雷 1：缺 `adminui` block 導向 `/admin/undefined`

設好 `oidc` 區塊、`providerUrl` / `clientId` 都對、但 DRAPI Admin UI 的 login dropdown 沒看到 Keycloak 選項、按其他選項會 redirect 到 `/admin/undefined`。

**Root cause**：`adminui` 是 DRAPI 用來告訴管理 UI「這個 provider 要出現在 dropdown」的 metadata block。缺了它、provider 雖然在 backend 註冊、但 UI 不知道怎麼 expose 給使用者。

**修法**：每個 OIDC provider 設定底下都要有 `adminui: { active: true, displayName: "..." }`、`displayName` 是顯示在 dropdown 的人類可讀名字。

### 踩雷 2：`providerUrl` 用 `localhost` 跨機器整個 fail（最大坑）

Setup 場景常見：Keycloak 在 WSL Ubuntu 跑、DRAPI 在 Windows 跑。設定 `providerUrl` 時直覺寫 `https://localhost:8443/realms/...`、結果 Keycloak 自己可以打到、DRAPI 就是 connection refused。

**Root cause**：DRAPI 是 Java、Java 預設 `localhost` 解析走 IPv4、變 `127.0.0.1`。在 Windows 跑的 DRAPI、`127.0.0.1` 是 Windows 主機自己、不是 WSL 裡面的 Keycloak。**WSL 跟 Windows 不共用 `localhost`**。

**修法**：`providerUrl` 改成 WSL 的實際 IP（譬如 `https://192.168.x.x:8443/...`）。WSL2 從 Windows 看的 IP 可以用 `wsl hostname -I` 拿。

**為什麼這個坑會卡很久**：失敗訊息是 connection 層的、不是 OIDC config 錯。容易 misdirect 去翻 Keycloak realm 設定、cert 信任、scope mapping — 然後浪費半天才回到 IP 解析這個基礎問題。

**驗證**：在 DRAPI 主機（Windows）跑：

```
curl https://<wsl-ip>:8443/realms/<your-realm>/.well-known/openid-configuration
```

回得到 JSON 才算 reachability OK。不行的話 OIDC 怎麼設都沒用。

### 踩雷 3：Browser localStorage 殘留舊 config

OIDC config 改了之後（譬如改 `providerUrl` 或 `clientId`）、瀏覽器 retry 還是用舊的 redirect URL 或 client_id、login fail。

**Root cause**：DRAPI Admin UI 把 OIDC discovery 結果 cache 在 browser `localStorage`、改 server config 不會自動 invalidate。

**修法**：每次改 OIDC config 後、瀏覽器 DevTools → Application → Local Storage → 清掉 DRAPI 站的 storage、再 retry。或開無痕視窗測。

### 踩雷 4：Default client scopes 不會回追既有 client

在 Keycloak 加新的 default client scope（譬如 `$DATA`）、希望既有 `Domino` client 自動拿到 — 結果新登入測還是 missing scope。

**Root cause**：Keycloak 的 default client scope **只 apply 到設定之後新建的 client**、既有 client 不會自動帶上。

**修法**：到 Keycloak Admin Console → Clients → 選 `Domino` client → Client Scopes tab → 手動 Add 那個 scope 到 Assigned default client scopes。

---

## 完整 setup 指引

文章不重複 step（避免兩邊 sync 不一致）— 完整流程包括：

1. **WSL Ubuntu 24.04 + Java 21 環境**
2. **Keycloak 安裝跟啟動**（self-hosted、不用 docker）
3. **Keycloak realm / client / scope / 測試 user 設定**
4. **HTTPS / hostname 設定**（PEM 憑證）
5. **DRAPI `keepconfig.d` 對應**
6. **JVM truststore 信任 Keycloak 憑證**
7. **identity mapping** — token email claim 對應 Person doc Internet address
8. **scope authorization** — `$DATA` / `$SETUP` / `keepconfigadmin`
9. **certstore.nsf 整合測試紀錄**

全部 step-by-step 在這兩個地方：

- **GitHub repo**：[bryanHsiao/drapi-oidc-keycloak](https://github.com/bryanHsiao/drapi-oidc-keycloak)
- **公開 site**：[drapi-oidc-keycloak Pages](https://bryanhsiao.github.io/drapi-oidc-keycloak/)

兩邊內容一致、site 排版好讀、repo 可 clone 對著實際 config sample 跑。

---

## 跟 Domino 14 / 5/31 那篇的關係

這個 demo 走的是「**外部 IdP（Keycloak）→ DRAPI OIDC 認證**」這條路、跟 [Domino 14 跟前版差異整理](/domino-news/zh-TW/posts/domino-14-key-changes)那篇講的 Domino 14.5.1 新增的 `NotesSession` / `Session` OIDC token API 是**不同層級的事**：

- **這個 demo**（DRAPI + Keycloak `oidc` mode）：認 web / mobile client 來 DRAPI 的請求、是 server-side endpoint 的 auth
- **14.5.1 OIDC token API**：給 server-side LotusScript / Java code 從 Domino OIDC Provider 主動拿 token、是 application code 主動發起 OIDC token request 的能力

兩個合起來、是 Domino 認證從「domcfg form / LTPA cookie」往「OIDC 全套」現代化的兩面：reader-facing（這個 demo）跟 code-facing（14.5.1 API）。

**未來升 Domino 14+**、把這個 demo 從 `oidc` mode 轉 `oidc-idpcat` 是自然下一步 — DRAPI 跟 Domino server 共用 `idpcat.nsf` 設定、token cache 也共用、整體更乾淨。

---

## 結語

「DRAPI 接 OIDC 要等 Domino 14」是普遍誤解 — `oidc` mode 12.0.2 就 work、跟 server 版本解耦。但跑通的 cost 是 setup 步驟多 + 幾個版本踩雷（特別是 `localhost` 那個）會卡半天。

把整套 setup 跑過一次、最大的 takeaway 不是 OIDC 多複雜、是 **DRAPI 把認證設計成三層獨立關卡**這件事 — debug 時依循 identity → mapping → authorization 順序 trace、解 issue 的速度差幾倍。

完整實作 repo 已經放上 [GitHub](https://github.com/bryanHsiao/drapi-oidc-keycloak) + [Pages](https://bryanhsiao.github.io/drapi-oidc-keycloak/)、想自己跑一輪本機 demo 可以直接 clone 對著走。
