---
title: "實作筆記：DRAPI 透過 Keycloak OIDC 登入 — Domino 12.0.2 就能用、不必等 14"
description: "想把 DRAPI（Domino REST API）接到現代 IdP — 譬如 Keycloak、Azure AD、Okta — 通常以為要等 Domino 14 才有 OIDC、其實 12.0.2 用 DRAPI 的 oidc 模式就能跑通。本文是本機完整重現整套設定的實作筆記、聚焦 DRAPI 三個 OIDC 模式怎麼選、三層獨立認證架構（身份驗證 / 身份對應 / 授權）為什麼要分層除錯、跟 4 個會卡很久的踩雷 — 最大那個是 providerUrl 用 localhost 因為 Java IPv4 解析造成跨機器整個失敗。完整逐步流程在 GitHub repo + Pages 上、文章本身不重複設定步驟、聚焦關鍵判斷跟陷阱。"
pubDate: 2026-06-01T07:30:00+08:00
lang: zh-TW
slug: drapi-keycloak-oidc
tags:
  - "Domino REST API"
  - "OIDC"
sources:
  - title: "DRAPI + Keycloak OIDC 實作筆記 — GitHub repo"
    url: "https://github.com/bryanHsiao/drapi-oidc-keycloak"
  - title: "DRAPI + Keycloak OIDC 實作筆記 — 公開站點"
    url: "https://bryanhsiao.github.io/drapi-oidc-keycloak/"
  - title: "Authentication — HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html"
  - title: "Configuring OIDC-based SSO for web users (Domino 12.0.2)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/secu_config_oidc_based_sso_for_web.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/drapi-keycloak-oidc.webp"
coverStyle: "low-poly-3d"
---

想把 DRAPI（Domino REST API）接到現代 IdP — Keycloak、Azure AD、Okta — 跳開傳統 LTPA cookie 跟 domcfg 表單登入、走 OIDC 認證。直覺上會以為要等 Domino 14 才有支援、官方文件也以 14 起為主。

實際做下去會發現：**Domino 12.0.2 用 DRAPI 的 `oidc` 模式就能跑通**、不必等伺服器升 14。這條路雖然設定步驟不少、但每一步都有官方支援、不是走旁門左道。

本文是把這套設定在本機完整重現的實作筆記 — 聚焦 DRAPI 三個 OIDC 模式怎麼選、三層獨立認證架構為什麼失敗時要分層除錯、跟 4 個會卡很久的踩雷。完整逐步流程在 [GitHub repo](https://github.com/bryanHsiao/drapi-oidc-keycloak) 跟對應的 [Pages 站點](https://bryanhsiao.github.io/drapi-oidc-keycloak/) 上、本文本身不重複設定步驟、聚焦關鍵判斷跟陷阱。

---

## 重點摘要

- [**DRAPI 三個 OIDC 模式**](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)：`jwt`（只有公鑰）/ `oidc`（標準 OIDC provider、需 clientId + clientSecret）/ `oidc-idpcat`（**需要 Domino 14+**、共用 idpcat.nsf 設定）
- **這個示範用 `oidc` 模式** — clientId / clientSecret 直接在 `keepconfig.d` 設、不依賴 Domino 伺服器版本
- **Domino 12.0.2 就能跑** — [12.0.2 就有 OIDC 網頁登入設定](https://help.hcl-software.com/domino/12.0.2/admin/secu_config_oidc_based_sso_for_web.html)、不必等 14
- **三層獨立認證關卡**：身份驗證（OIDC 驗你是誰）→ 身份對應（token 的 claim 對應 Person 文件）→ 授權（scope 決定能不能用）— 任一層失敗都報「登入失敗」、要分層除錯
- **4 個踩雷**：缺 `adminui` 區塊 / **`providerUrl` 用 localhost 因 Java 走 IPv4 跨機器整個失敗**（最大坑）/ 瀏覽器 localStorage 殘留舊設定 / Keycloak 預設用戶端 scope 不會回追既有用戶端
- **完整設定** 包括 WSL Ubuntu + Keycloak 安裝、領域 / 用戶端 / scope 設定、DRAPI keepconfig.d 對應、PEM 憑證信任、用 curl 驗證可達性 — 全部在 [repo + 站點](https://bryanhsiao.github.io/drapi-oidc-keycloak/) 上

---

## 為什麼這個示範值得跑一次

幾個動機：

1. **要替代 domcfg 表單登入**：傳統 domcfg.nsf 自家登入表單寫死綁 Domino 帳號、跟現代 IdP 整合困難。OIDC 是業界標準、Keycloak 又是開放原始碼的成熟方案、組合起來可以打通跨系統 SSO
2. **DRAPI 是「現代技術堆疊」入口**：對 React / Vue / 純 SPA / 行動應用程式來說、DRAPI 是接 Domino 資料的主要路徑。如果這層認證走 OIDC、整套前端開發就可以用業界通用的 IdP 工具鏈
3. **本機跑通能消除版本焦慮**：很多人卡在「我們伺服器是 12.x、要等升 14 才能用 OIDC」 — 實際試過會發現 `oidc` 模式在 12.0.2 就能用、不是技術限制、是版本誤解

---

## DRAPI 三個 OIDC 模式

[官方 DRAPI 認證文件](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html) 把 OIDC 設定分三種模式、依環境跟需求選：

| 模式 | 適合場景 | Domino 版本 | clientId/Secret 放哪 |
|---|---|---|---|
| **`jwt`** | provider 只給你公鑰、或自己手寫 JWT 驗證 | 任何版本 | DRAPI 直接設 `iss` / `kid` / `keyFile` |
| **`oidc`** | 標準 OIDC provider（Keycloak / Entra ID / Okta）、想獨立設定 | **12.0.2+** | 直接放 `keepconfig.d` |
| **`oidc-idpcat`** | 跟 Domino 伺服器共用同一個 IdP 設定 | **需 14+** | 用 Domino 的 `idpcat.nsf` 集中管理 |

### 為什麼這個示範選 `oidc`

- **Domino 12.0.2 就能用** — `oidc-idpcat` 需要 14+、示範環境若還在 12.x 用不到
- **跟 Domino 伺服器認證解耦** — DRAPI 自己有 clientId / clientSecret、不依賴 Domino 伺服器的 IdP 設定。對「DRAPI 跟 Domino 伺服器對接不同 IdP」的場景有彈性
- **設定集中在一個 JSON 檔** — `keepconfig.d` 就一個位置、不必跨檔追 idpcat.nsf

`oidc-idpcat` 的好處（[官方文件](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)寫的）是共用快取跟共用診斷 — Domino 伺服器跟 DRAPI 走同一 IdP 時、token 快取共用、除錯資訊統一。**升到 Domino 14+ 之後**、把這個示範從 `oidc` 轉 `oidc-idpcat` 是自然的升級路徑。

---

## 三層獨立認證架構

OIDC 接 DRAPI 失敗時、最常見的錯誤反應是「登入失敗」一律當成「OIDC 設定錯」、整個翻 Keycloak。但實際上 DRAPI 認 OIDC 是**三層獨立關卡、任一層失敗都顯示同樣的登入失敗**：

| 層 | 問題 | 失敗症狀 |
|---|---|---|
| **1. 身份驗證 (你是誰)** | OIDC 流程本身、Keycloak 認證 | 拿不到 token / Keycloak 那邊就擋 |
| **2. 身份對應 (token 對應到 Domino 是哪個人)** | token 的 claim（譬如 email）對應 Person 文件的 Internet address | 拿到 token 但對不到 Domino 使用者、視為未知使用者 |
| **3. 授權 (這個人能做什麼)** | DRAPI 的 scope（譬如 `$DATA` / `$SETUP`）對應用戶端的 scope 設定 | 對到使用者但沒對 scope、API 呼叫被拒 |

除錯時要分層往下：

```
登入失敗
  ├─ Keycloak 領域日誌有錯？        → 第 1 層、OIDC 本身
  ├─ DRAPI 日誌寫「user not found in directory」？ → 第 2 層、身份對應
  └─ DRAPI 日誌寫「missing scope」？  → 第 3 層、授權
```

把這三層當獨立關卡看、除錯速度差很多 — 不會把第 2 層的身份對應問題當成第 1 層的 OIDC 設定錯誤、一直翻 Keycloak 領域設定。

---

## 關鍵設定 — `keepconfig.d` JSON 結構

DRAPI 的 OIDC 設定放在 `keepconfig.d/` 資料夾的 JSON 檔裡（[官方文件示範格式](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)）。`oidc` 模式的最小結構：

```json
{
  "oidc": {
    "keycloak": {
      "active": true,
      "providerUrl": "https://192.168.x.x:8443/realms/domino",
      "clientId": "Domino",
      "clientSecret": "你的 keycloak 用戶端密碼",
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

- **`providerUrl`** — Keycloak 領域的基礎 URL。**不能用 `localhost`**（見下節踩雷 #2）
- **`clientId` / `clientSecret`** — Keycloak 領域裡建的用戶端設定。clientId 官方建議用 `Domino`
- **`userIdentifier`** — token 的哪個 claim 拿來對 Domino。設 `email` 表示用 token 的 email claim 對應 Person 文件的 Internet address。要對 LDAP DN 的話另外設 `userIdentifierInLdapFormat: true`
- **`scope`** — DRAPI 接受的 scope 名稱。`$DATA` 是讀寫文件、`$SETUP` 是管理操作、`keepconfigadmin` 是 keepconfig 管理
- **`adminui`** 區塊 — 這個區塊 **不能缺**、否則 DRAPI 管理介面的登入下拉選單不會出現這個 provider 選項、URL 變 `/admin/undefined`（踩雷 #1）

完整版含 `additionalClientIds` / `userIdentifierInLdapFormat` / 多個 scope 等的設定範例、看 [repo 內的 `keepconfig.d` 樣板](https://github.com/bryanHsiao/drapi-oidc-keycloak)。

---

## 4 個會卡很久的踩雷

### 踩雷 1：缺 `adminui` 區塊導向 `/admin/undefined`

設好 `oidc` 區塊、`providerUrl` / `clientId` 都對、但 DRAPI 管理介面的登入下拉選單沒看到 Keycloak 選項、按其他選項會重定向到 `/admin/undefined`。

**根本原因**：`adminui` 是 DRAPI 用來告訴管理介面「這個 provider 要出現在下拉選單」的中繼資料區塊。缺了它、provider 雖然在後端註冊、但介面不知道怎麼顯示給使用者。

**修法**：每個 OIDC provider 設定底下都要有 `adminui: { active: true, displayName: "..." }`、`displayName` 是顯示在下拉選單的人類可讀名字。

### 踩雷 2：`providerUrl` 用 `localhost` 跨機器整個失敗（最大坑）

設定場景常見：Keycloak 在 WSL Ubuntu 跑、DRAPI 在 Windows 跑。設定 `providerUrl` 時直覺寫 `https://localhost:8443/realms/...`、結果 Keycloak 自己可以打到、DRAPI 就是連線被拒。

**根本原因**：DRAPI 是 Java、Java 預設 `localhost` 解析走 IPv4、變 `127.0.0.1`。在 Windows 跑的 DRAPI、`127.0.0.1` 是 Windows 主機自己、不是 WSL 裡面的 Keycloak。**WSL 跟 Windows 不共用 `localhost`**。

**修法**：`providerUrl` 改成 WSL 的實際 IP（譬如 `https://192.168.x.x:8443/...`）。WSL2 從 Windows 看的 IP 可以用 `wsl hostname -I` 拿。

**為什麼這個坑會卡很久**：失敗訊息是連線層的、不是 OIDC 設定錯。容易誤導去翻 Keycloak 領域設定、憑證信任、scope 對應 — 然後浪費半天才回到 IP 解析這個基礎問題。

**驗證**：在 DRAPI 主機（Windows）跑：

```
curl https://<wsl-ip>:8443/realms/<your-realm>/.well-known/openid-configuration
```

回得到 JSON 才算可達性 OK。不行的話 OIDC 怎麼設都沒用。

### 踩雷 3：瀏覽器 localStorage 殘留舊設定

OIDC 設定改了之後（譬如改 `providerUrl` 或 `clientId`）、瀏覽器重試還是用舊的重定向 URL 或 client_id、登入失敗。

**根本原因**：DRAPI 管理介面把 OIDC 探索結果快取在瀏覽器 `localStorage`、改伺服器設定不會自動失效。

**修法**：每次改 OIDC 設定後、瀏覽器 DevTools → Application → Local Storage → 清掉 DRAPI 站的儲存、再重試。或開無痕視窗測。

### 踩雷 4：預設用戶端 scope 不會回追既有用戶端

在 Keycloak 加新的預設用戶端 scope（譬如 `$DATA`）、希望既有 `Domino` 用戶端自動拿到 — 結果新登入測還是缺少 scope。

**根本原因**：Keycloak 的預設用戶端 scope **只套用到設定之後新建的用戶端**、既有用戶端不會自動帶上。

**修法**：到 Keycloak Admin Console → Clients → 選 `Domino` 用戶端 → Client Scopes 頁籤 → 手動 Add 那個 scope 到 Assigned default client scopes。

---

## 完整設定指引

文章不重複步驟（避免兩邊同步不一致）— 完整流程包括：

1. **WSL Ubuntu 24.04 + Java 21 環境**
2. **Keycloak 安裝跟啟動**（自架、不用 Docker）
3. **Keycloak 領域 / 用戶端 / scope / 測試使用者設定**
4. **HTTPS / 主機名設定**（PEM 憑證）
5. **DRAPI `keepconfig.d` 對應**
6. **JVM 信任儲存信任 Keycloak 憑證**
7. **身份對應** — token 的 email claim 對應 Person 文件 Internet address
8. **scope 授權** — `$DATA` / `$SETUP` / `keepconfigadmin`
9. **certstore.nsf 整合測試紀錄**

全部逐步流程在這兩個地方：

- **GitHub repo**：[bryanHsiao/drapi-oidc-keycloak](https://github.com/bryanHsiao/drapi-oidc-keycloak)
- **公開站點**：[drapi-oidc-keycloak Pages](https://bryanhsiao.github.io/drapi-oidc-keycloak/)

兩邊內容一致、站點排版好讀、repo 可以複製下來對著實際設定範例跑。

---

## 跟 Domino 14 / 5/31 那篇的關係

這個示範走的是「**外部 IdP（Keycloak）→ DRAPI OIDC 認證**」這條路、跟 [Domino 14 跟前版差異整理](/domino-news/zh-TW/posts/domino-14-key-changes)那篇講的 Domino 14.5.1 新增的 `NotesSession` / `Session` OIDC token API 是**不同層級的事**：

- **這個示範**（DRAPI + Keycloak `oidc` 模式）：認網頁 / 行動用戶端來 DRAPI 的請求、是伺服器端端點的認證
- **14.5.1 OIDC token API**：給伺服器端 LotusScript / Java 程式碼從 Domino OIDC Provider 主動拿 token、是應用程式碼主動發起 OIDC token 請求的能力

兩個合起來、是 Domino 認證從「domcfg 表單 / LTPA cookie」往「OIDC 全套」現代化的兩面：面向讀者的（這個示範）跟面向程式碼的（14.5.1 API）。

**未來升 Domino 14+**、把這個示範從 `oidc` 模式轉 `oidc-idpcat` 是自然下一步 — DRAPI 跟 Domino 伺服器共用 `idpcat.nsf` 設定、token 快取也共用、整體更乾淨。

---

## 結語

「DRAPI 接 OIDC 要等 Domino 14」是普遍誤解 — `oidc` 模式 12.0.2 就能用、跟伺服器版本解耦。但跑通的代價是設定步驟多 + 幾個版本踩雷（特別是 `localhost` 那個）會卡半天。

把整套設定跑過一次、最大的重點不是 OIDC 多複雜、是 **DRAPI 把認證設計成三層獨立關卡**這件事 — 除錯時依循 身份驗證 → 身份對應 → 授權 順序追、解問題的速度差幾倍。

完整實作 repo 已經放上 [GitHub](https://github.com/bryanHsiao/drapi-oidc-keycloak) + [Pages](https://bryanhsiao.github.io/drapi-oidc-keycloak/)、想自己跑一輪本機示範可以直接複製下來對著走。
