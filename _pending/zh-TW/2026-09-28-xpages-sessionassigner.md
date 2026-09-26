---
title: "sessionAsSigner：XPages 用簽章者身分提權，簽章算誰、會踩什麼雷"
description: "XPages 給你三個全域 session：session 是當前使用者、sessionAsSigner 是 XPage 的簽章者、sessionAsSignerWithFullAccess 是簽章者再加 full access。用它讓使用者做他 ACL 上做不到的事（寫受限 DB、繞 Readers）很方便，但「簽章者到底算誰」是逐個 design element 算的——script library 用它自己的簽章者，不是 XPage 的，混簽就提權不一致。這篇講三個 session 的身分差別、簽章者怎麼認定，以及 setConvertMime、full access 那幾個會咬人的雷。"
pubDate: 2026-09-28T07:30:00+08:00
lang: zh-TW
slug: xpages-sessionassigner
tags:
  - "SSJS"
  - "XPages"
  - "Security"
sources:
  - title: "Global objects and functions（session / sessionAsSigner 定義）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html"
  - title: "sessionAsSigner Oddities – Part 1 — XPages and Me"
    url: "https://xpagesandme.wordpress.com/2015/02/13/sessionassigner-oddities-part-1/"
  - title: "sessionAsSigner & sessionAsSignerWithFullAccess in Java — HCL XPages Forum"
    url: "https://ds_infolib.hcltechsw.com/ldd/xpagesforum.nsf/xpTopicThread.xsp?documentId=4F3973ED6E5B8B338525792E00731534"
relatedJava: []
relatedSsjs: []
---

一個對設定 DB 沒有寫入權的使用者，在你的 XPage 上按了按鈕，文件竟然存進去了——因為那段程式是用 `sessionAsSigner` 跑的，不是用他本人的身分。

XPages 給你**三個全域 session 物件、三種身分**。用對了，你能讓使用者做他 ACL 上本來做不到的事；用錯了，不是默默失敗、就是提權過頭。而最容易搞混的，是「**簽章者到底算誰**」——它是逐個 design element 算的，不是整支應用一個。

這篇講清楚三個 session 各是什麼身分、簽章者怎麼認定，以及幾個會咬人的雷。

---

## 重點摘要

- **三個全域 session、三種身分**：`session`（當前使用者）、`sessionAsSigner`（XPage 的**簽章者**）、`sessionAsSignerWithFullAccess`（簽章者**再加 full access**）。
- **「簽章者」= 最後簽那個 design element 的人，而且逐元件算**：`script library` 裡執行的程式碼，用的是那支 library 自己的簽章者，不是呼叫它的 XPage 的。混簽 → 提權不一致。**正解：整支應用用同一個（admin）ID 簽**。
- **用途**：讓當前使用者做他權限做不到的事——寫受限 DB、繞過 Readers 欄位。概念等同 LotusScript agent 的「以簽章者身分執行」。
- **會咬人的雷**：① 用 `sessionAsSigner` 讀 MIME 富文本，`getMIMEEntity()` 會回 null → 先 `sessionAsSigner.setConvertMime(false)`；② `sessionAsSignerWithFullAccess` 的 full access 要伺服器／DB 允許才真的提權；③ 別無腦全用 signer——該尊重使用者權限的地方就用 `session`。

## 三個 session、三種身分

官方 [Global objects](https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html) 對這三個全域物件的定義（逐字）：

- **`session`**：「A `lotus.domino.local.Session` object that represents the current Domino session with credentials based on the user.」——**當前使用者**的身分。
- **`sessionAsSigner`**：「…with credentials based on the XPage signer.」——**XPage 簽章者**的身分。
- **`sessionAsSignerWithFullAccess`**：「…with credentials based on the XPage signer with full access.」——簽章者身分，**再加 full access**（可繞過 ACL 與 Readers，前提是有開）。

三者都是同一個 `Session` 類別、同樣的 API；差別只在**帶誰的權限**。所以你在同一段程式裡，可以用 `session` 判斷「當前使用者是誰」，再用 `sessionAsSigner` 去做需要更高權限的那一步。

## 「簽章者」到底算誰

這是最容易踩的一點。**簽章者不是「應用的擁有者」，而是「最後在 Designer 裡簽了那個 design element 的人」**——而且是**逐個元件**算的。

實務上的陷阱：你的 XPage 是 admin 簽的，但它呼叫的一支 `script library` 是另一個開發者上次存檔時簽的。那麼 library 裡用 `sessionAsSigner` 跑的程式碼，帶的是**那個開發者**的權限，不是 XPage 的 admin。結果就是「同一個按鈕、有時提權成功有時失敗」，很難查。

正解很簡單，也是上線前該做的：**整支應用的所有 design element 用同一個（通常是 admin）ID 重簽**，讓 `sessionAsSigner` 的身分可預期。

## 怎麼用：提權做一件受限的事

典型用法——當前使用者沒權限，但你信任這個經過驗證的動作，於是用簽章者身分去做：

```javascript
// 用簽章者身分打開一個當前使用者無權寫入的設定 DB
var signerDb = sessionAsSigner.getDatabase("", "config/settings.nsf");
var doc = signerDb.createDocument();
doc.replaceItemValue("Form", "Setting");
doc.replaceItemValue("Value", requestScope.newValue);
doc.save();

// 對照：session 帶的是當前使用者，這一步在他權限下會失敗
```

判斷「該不該做」用 `session`（當前使用者是誰、屬於哪些群組），真正動手那步才切到 `sessionAsSigner`——別整段都用 signer，那等於把每個使用者都當 admin。

## 會踩的雷

- **讀 MIME 富文本回 null**：用 `sessionAsSigner` 存取設成「Store contents as HTML and MIME」的富文本欄位時，`getMIMEEntity()` 會**意外回 null**（同一份文件改用當前使用者的 `session` 讀卻正常）。解法是先關掉自動 MIME 轉換：

  ```javascript
  sessionAsSigner.setConvertMime(false);   // 放在用 sessionAsSigner 動 MIME 之前
  ```

- **full access 不是自動就有**：`sessionAsSignerWithFullAccess` 要真的繞過 ACL／Readers，得伺服器與資料庫端允許 full access administration；沒開的話它不會神奇地提權。
- **別過度提權**：`sessionAsSigner` 很好用，但把整段邏輯都用它跑，等於架空了 Notes 的權限模型。原則是「以 `session` 判斷、以 `sessionAsSigner` 執行必要的那一步」。

## 同類別在其他語言

- **LotusScript**：沒有 `sessionAsSigner` 這個名字，但**概念對應**的是 agent 的「以簽章者身分執行」——agent 預設就用簽章者的權限跑（除非設「以 web 使用者身分執行」），這正是 `sessionAsSigner` 在 XPages 補回來的能力。
- **Java（在 XPages 裡）**：同樣拿得到這三個 session——透過 `facesContext` 或 Extension Library 解析 `sessionAsSigner` 變數即可（可參考 [HCL XPages 論壇這串在 Java 用 sessionAsSigner 的討論](https://ds_infolib.hcltechsw.com/ldd/xpagesforum.nsf/xpTopicThread.xsp?documentId=4F3973ED6E5B8B338525792E00731534)），行為與 SSJS 一致。
