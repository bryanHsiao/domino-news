---
title: "呼叫 Domino REST API 一直 401？先搞懂它的 JWT 認證與 scope"
description: "DRAPI 幾乎每個呼叫都要證明你是誰。它不用傳統的 session/LTPA，而是 JWT bearer token：先 POST 到 /api/v1/auth 用 Domino 帳密換一個 token，之後每個請求都在 Authorization header 帶著它。這篇講怎麼登入拿 token、token 裡的 scopes/aud claim 在管什麼、token 從哪來（Domino 自簽 JWT、外部 OIDC、idpcat.nsf 三條路）、以及重啟金鑰會變之類的坑。DRAPI 系列第二篇。"
pubDate: 2026-08-20T07:30:00+08:00
lang: zh-TW
slug: domino-rest-api-auth
tags:
  - "Domino REST API"
  - "Security"
  - "OIDC"
sources:
  - title: "Domino REST API — Authentication (HCL opensource)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html"
  - title: "Domino REST API — Lab 01: Log in to the REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/lab-01.html"
  - title: "Domino REST API — Functional accounts"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/functionalUsers.html"
cover: "/covers/domino-rest-api-auth.webp"
coverStyle: "oil-chiaroscuro"
---

[上一篇](/domino-news/posts/domino-rest-api-getting-started)講過，DRAPI 幾乎每個呼叫都要帶一個 token。這一篇就把「怎麼拿、怎麼帶、token 裡到底裝了什麼」講清楚。

從傳統 Domino 過來的人要先換個腦袋：DRAPI **不用** session cookie、也不用 LTPA。它走的是現代 API 的標準做法——**JWT bearer token**：你先拿 Domino 帳密去換一個 token，之後每個請求都在 header 帶著它，server 靠驗證這個 token 認得你、也決定你能碰哪些東西。

---

## 重點摘要

- **登入端點是 `POST /api/v1/auth`**：body 傳 `{"username": "...", "password": "..."}`（Domino 帳號 + HTTP 密碼），換回一個 JWT。
- **之後每個請求帶 `Authorization: Bearer <token>`**。
- **token 是一個 [JWT](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)**：官方說「All actions in Domino REST API are secured with JWT」。裡面的 claim 決定你是誰（`sub`）、能碰什麼（`scopes`）、給誰用（`aud` 必須是 `Domino`）、以及何時過期（`exp`）。
- **token 有三個來源**：Domino 自簽 JWT（`/auth` 端點）、外部 OIDC provider（Entra ID／Keycloak）、以及用 `idpcat.nsf` 集中管理的 OIDC（官方推薦，需 Domino 14+）。
- **一個常見坑**：Domino 自簽用的預設是「每次 DRAPI 重啟就換一把的隨機對稱金鑰」——重啟後舊 token 全失效。要穩定就設 RSA 金鑰檔。

---

## 登入：POST /api/v1/auth

最直接的一條路，是跟 Domino 自己的認證端點換 token。[官方的登入示範](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/lab-01.html)就是這樣：

```bash
curl -X POST http://localhost:8880/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "KEEP Admin", "password": "passw0rd"}'
```

`username` 是 Domino 帳號、`password` 是它的 HTTP 密碼。登入成功，回來一段 JSON，裡面就是你的 bearer token（可以貼到 [jwt.io](https://jwt.io/) 解開來看內容）。

拿到 token 之後，接下來每一個請求都在 header 帶著它：

```bash
curl http://localhost:8880/api/v1/... \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1Ni.....(你的 token)"
```

Swagger UI 上也一樣——把 token 貼進 Authorize 那個框，之後在頁面上試打的每個端點就都帶著它了。

## token 裡裝了什麼

JWT 不是一串亂碼，它是一個可以解開讀的 claim 集合。DRAPI 在意的幾個：

```json
{
  "sub": "CN=John Doe/O=MyOrg",
  "scopes": "MAIL $DATA",
  "aud": "Domino",
  "iat": 1618506339,
  "exp": 1618509939
}
```

- **`sub`**：你是誰——Domino 的階層式名稱。
- **`scopes`**：你能碰哪些範圍，**用空格分隔**（例如 `MAIL $DATA`，或某個資料庫的 scope 別名）。這是權限的核心，下一篇會專講 scope 怎麼定義。
- **`aud`**：這個 token 是給誰的，**必須是 `Domino`**，否則 server 不收。
- **`exp`**：什麼時候過期。過了就得重新登入拿新的。

換句話說，「你能不能做這件事」不是每次都回去查 ACL 現算，而是**在你登入拿 token 的那一刻，就把身分與 scope 封進了這個 token**。

## token 從哪來：三條路

`/auth` 只是其中一條。大致上，token 的簽發與信任有三種路子，規模越大越該往後面走：

1. **Domino 自簽 JWT**：就是上面 `/auth` 那條，Domino 自己簽發。**預設用一把「每次 DRAPI 重啟就重新產生的隨機對稱金鑰」**——方便，但一重啟，先前發出去的 token 全部失效。要讓 token 跨重啟穩定，得改設永久的 RSA 公私鑰檔（`JwtPrivateKeyFile` / `JwtPublicKeyFile`）。
2. **外部 OIDC provider**：讓 DRAPI 直接信任一個標準 OIDC provider（像 Microsoft Entra ID、Keycloak），token 由對方簽發。需要設 `clientId`、`clientSecret`，並透過 `.well-known/openid-configuration` 做 discovery。企業已經有 IdP 的話，這條最自然。
3. **用 `idpcat.nsf` 管理的 OIDC**（官方推薦）：把 IdP 設定集中放進 `idpcat.nsf` 統一管理，需 **Domino 14+**。

另外還有 **functional accounts**（[功能帳號](https://opensource.hcltechsw.com/Domino-rest-api/references/functionalUsers.html)），但它的用途比你想的窄：官方把它限定給**管理／監控類端點**（Management console、Metrics、Health check）用，尤其在目錄服務不可用時派上用場——文件明講「它們不需要存取一般端點」。所以別把它當成一般資料 API 的服務帳號。

## 兩個實務提醒

- **重啟會讓 token 失效**（自簽預設金鑰那條）——開發時你可能會遇到「昨天好好的 token 今天就 401」，多半就是 server 重啟換了金鑰。要穩定就設 RSA 金鑰檔。
- **scopes 要對得上**：token 裡的 scope 決定你能碰哪些資料庫。呼叫一個 scope 不在 token 裡的資源，會被擋。token 是登入當下就決定好的，事後想多碰別的，得重新拿一個帶對 scope 的 token。

下一篇進到 **scope 與 schema**——`scopes` claim 裡那些名字到底是怎麼把一個 NSF 對應成 REST 端點的。
