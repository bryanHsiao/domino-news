---
title: "Domino V12 起 notes.ini 支援多個 HTTPAdditionalRespHeader"
description: "舊版 Domino 的 notes.ini 只能塞一個 HTTPAdditionalRespHeader，第二行會把第一行蓋掉。HCL 在 V12.0.x 加了編號式的 HTTPAdditionalRespHeader01、02 寫法，讓你能用純 notes.ini 設好整套安全標頭——特別是當 web 站台還沒能起來、Internet Site 文件也用不了的時候，這是唯一的 fallback。"
pubDate: "2026-04-28"
lang: "zh-TW"
slug: "notes-ini-multiple-http-response-headers"
tags:
  - "Tutorial"
  - "Domino Server"
  - "Security"
  - "Admin"
sources:
  - title: "KB0124025 — How to apply multiple HTTPAdditionalRespHeader in notes.ini (HCL Software Customer Support)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0124025"
  - title: "KB0038786 — HTTPAdditionalRespHeader notes.ini parameter (HCL Software Customer Support)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0038786"
  - title: "Notes.ini Entry — HTTPAdditionalRespHeader (admincamp.de)"
    url: "https://admincamp.de/customer/notesini.nsf/85255a87005060c585255a850068ca6f/cd0d86347059d1a9c1257fb6004a41e2?OpenDocument="
cover: "/covers/notes-ini-multiple-http-response-headers.png"
---

## 為什麼這篇對你重要

Domino 站台要設安全 HTTP 標頭（HSTS、CSP、X-Frame-Options 等）通常有兩個入口：

1. **Internet Site 文件**或 Web Site Rules — 走 GUI、可細到「每個站台不一樣」
2. **`notes.ini` 的 `HTTPAdditionalRespHeader`** — 整台 server 通用

平常當然用前者，但當 HTTP task 起不來、admin client 也沒辦法登進去操作的時候，第二條路是唯一能救火的方法。這時你會遇到尷尬的事實：[`HTTPAdditionalRespHeader` 從 9.0.1 FP6 引進](https://admincamp.de/customer/notesini.nsf/85255a87005060c585255a850068ca6f/cd0d86347059d1a9c1257fb6004a41e2?OpenDocument=)以來，**只支援一個 header**。寫第二行 `HTTPAdditionalRespHeader=...` 會直接覆蓋上一行（notes.ini 後寫贏前寫的特性），等於只能挑一個安全項目（X-Frame-Options 或 CSP，二選一），其他全裸。

HCL 在 [Domino V12.0.x 起](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0124025) 用一個簡單的命名規則把這個限制拿掉了。

## 舊寫法（單一）

```ini
HTTPAdditionalRespHeader=X-Frame-Options: SAMEORIGIN
```

第二行的 `HTTPAdditionalRespHeader=...` 會把第一行覆蓋掉，因此事實上只能設一個。要在站台沒起來的情況下同時開 HSTS、CSP、X-Frame-Options，這條路是走不通的。

## 新寫法（V12.0.x 起，多個）

第一個 header 維持原語法（不加編號），其餘 header 用**兩位數編號**從 `01` 開始：

```ini
HTTPAdditionalRespHeader=X-Frame-Options: SAMEORIGIN
HTTPAdditionalRespHeader01=X-XSS-Protection: 1; mode=block
HTTPAdditionalRespHeader02=Content-Security-Policy: default-src 'self'
HTTPAdditionalRespHeader03=Strict-Transport-Security: max-age=31536000; includeSubDomains
HTTPAdditionalRespHeader04=X-Content-Type-Options: nosniff
```

幾個重點：

- **編號從 `01` 開始，不是 `1`**（兩位數，`HTTPAdditionalRespHeader1` 會被忽略）
- 編號順序不影響行為（Domino 全部讀進去），但連號 `01/02/03` 比較好維護
- 改完要 `tell http restart` 或重啟整個 server 才生效
- 適用 **HCL Domino 12.0.x 與更新版本**（更舊的版本還是只能一個）

## 一份「最低安全標頭」基礎組

如果你站台目前完全沒設安全標頭，下面這 5 行先放進 `notes.ini` 就涵蓋了 SSL Labs / Mozilla Observatory 大多數的基本要求：

```ini
HTTPAdditionalRespHeader=Strict-Transport-Security: max-age=31536000; includeSubDomains
HTTPAdditionalRespHeader01=X-Frame-Options: SAMEORIGIN
HTTPAdditionalRespHeader02=X-Content-Type-Options: nosniff
HTTPAdditionalRespHeader03=Referrer-Policy: strict-origin-when-cross-origin
HTTPAdditionalRespHeader04=Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'
```

CSP 那行幾乎一定要按你站台實際情況調整 —— `unsafe-inline` 嚴格說不應該開，但很多 Notes Web 應用 inline 樣式很多，先求站台不破再慢慢收斂。HSTS 的 `max-age=31536000` 是一年，第一次上線建議先放小一點（例如 `300` 五分鐘）試水溫，確定全 HTTPS 化沒問題再拉長。

## 還是建議走 Internet Site 文件

`notes.ini` 寫法的主要使用情境是 **救火** 跟 **整台 server 統一基線**。常態還是建議走 Internet Site 文件 + Web Site Rules，因為：

- 可以 per-site 設不同政策（`*.example.com` 跟 `api.example.com` 可以不一樣）
- 改了不用重啟 HTTP task
- 變更歷史看得出來（誰改了、什麼時候改）

把 `notes.ini` 當作 **最後一道網** 就對了 —— 平常用不到，但出事的時候很慶幸它在那。
