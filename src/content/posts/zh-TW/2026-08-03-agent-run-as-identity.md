---
title: "你的 agent 是用誰的身分在跑？signer、effective user，與 Error 201／Readers 欄位的雷"
description: "你的 agent 跑得好好的 —— 因為是你這個 admin 簽的。把它部署成 web agent、或用服務帳號 ID 簽了排程，它就壞了：Error 201，或者更糟 —— 一份文件都沒處理卻不報錯。原因是身分：Domino agent 是用某個人的身分在跑，而那個人不一定是你。一篇關於 signer 對上 effective user 的實測報告：session.EffectiveUserName 怎麼隨「run as web user」翻轉、Error 201 背後的 runtime security level、以及那個讓文件憑空消失的 Readers 欄位雷。"
pubDate: 2026-08-03T07:30:00+08:00
lang: zh-TW
slug: agent-run-as-identity
tags:
  - "LotusScript"
  - "Security"
sources:
  - title: "EffectiveUserName (NotesSession, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html"
  - title: "NotesAgent (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html"
  - title: "Security for agents on servers and the Web — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/h_setup_agent_security_steps.html"
relatedJava: ["Session", "Agent"]
relatedSsjs: ["session"]
cover: "/covers/agent-run-as-identity.webp"
coverStyle: "watercolor"
---

你的 agent 跑得完美無瑕。你從工作站執行它，它走過 view、更新文件、收工。然後你部署它 —— 成一個 web agent，或一個用服務帳號簽的排程 agent —— 它就壞了。`Error 201: Operation is disallowed in this session`，或者更糟：它沒報錯，卻靜靜地處理了零份文件。程式一個字都沒改。變的是*這個 agent 用誰的身分在跑*。

Domino agent 永遠用某個身分在跑，而那個身分不一定是坐在鍵盤前的開發者。這是一篇關於兩個重要身分的實測報告 —— signer 與 effective user —— [`session.EffectiveUserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html) 怎麼告訴你現在是哪一個在生效，以及最常抓到人的兩個雷（Error 201 與 Readers 欄位）。

---

## 重點摘要

- 兩個身分。**signer** 是「最後修改並儲存這個 agent 的人」（`NotesAgent.CommonOwner` / `Owner`）—— 預設 agent 用 signer 的權限跑。**effective user** 是「這個 agent 代表其身分執行的使用者」（`NotesAgent.OnBehalfOf`）。
- `session.EffectiveUserName` 回傳當下生效的那一個。原文：「對一個 agent，選了『run as web user』會讓這個屬性使用登入的 web 使用者的身分。若沒選『run as web user』，這個屬性會使用 agent signer 的身分。」
- **Error 201** 是 *runtime security level* 的問題：在等級 1（預設）時，agent 不能執行 restricted 操作。到 Security 分頁改它，並用一個「被允許在該伺服器跑 restricted agent」的 ID 重新簽。
- **Readers 欄位雷**：開了「run as web user」或「run on behalf of」後，effective user 必須在文件的 Readers 欄位裡，否則 agent 看不到那份文件 —— 你的程式、他的存取權。
- `agent.RunOnServer` 用程式在伺服器上跑 agent；它的 `Print` 輸出進 `log.nsf`（Events），不是 client。

## signer 對上 effective user

每個 agent 都帶著一個簽章 —— 最後在 Designer 裡儲存它的人成為 signer，透過 [`NotesAgent`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html)`.CommonOwner`（「最後修改並儲存這個 agent 的人的名字」）暴露出來。預設情況下，agent 的程式用*那個人*在伺服器上的權限跑。這就是為什麼它「對你有效」：是你簽的，而你是 admin。

effective user 是 agent *代表*誰在動作，透過 `NotesAgent.OnBehalfOf`、以及執行時的 `session.EffectiveUserName` 暴露。對一個沒有覆寫設定的排程或 client agent，effective user 就是 signer。但有兩個設定會改變這件事，而它們就是勝負關鍵。

## Security 分頁的旋鈕

在 agent 的 [Security 分頁](https://help.hcl-software.com/dom_designer/11.0.1/basic/h_setup_agent_security_steps.html)上：

- **Run on behalf of** —— 程式用一個指定使用者、而不是 signer 的權限跑。`EffectiveUserName` 變成那個使用者。
- **Run as web user**（web agent）—— 程式用通過認證的 web 使用者身分跑。照文件所說，這讓 `EffectiveUserName`「使用登入的 web 使用者的身分」。
- **Runtime security level** —— 1（預設）不允許任何 restricted 操作；更高等級允許 restricted（與 full-admin）操作。

有一條規則把它們綁在一起、而且讓每個人都意外：**signer 的權限先被檢查。** 就算開了「run as web user」，除非 agent 是用一個「被允許在那台伺服器跑 restricted agent」的 ID 簽的，它不會在伺服器上跑；而「run on behalf of」要求 signer 有「代表他人執行」的權限。所以有兩道關卡：*這能不能跑*（signer 的伺服器權限）、以及*程式看到誰的存取*（effective user）。

## 雷一：Error 201

`Error 201: Operation is disallowed in this session` 是 runtime security level 那道關。在等級 1 —— 沒人設過時的預設 —— restricted 操作（讀檔案系統、跑其他程式、某些 admin 呼叫）被擋。你在桌面跑沒踩到，因為 client agent 對你是 unrestricted 地跑；伺服器那次踩到，因為等級是 1、和／或 signer 沒被授權跑 restricted agent。修法分兩半：到 Security 分頁把 runtime security level 提高、允許 restricted 操作，*並且*確保 agent 是用一個「伺服器信任、能跑 restricted agent」的 ID 簽的（伺服器文件裡的「Run restricted/unrestricted LotusScript/Java agents」欄位）。只提高等級、卻沒有受信任的簽章，只是把失敗往後挪。

## 雷二：Readers 欄位讓文件憑空消失

這是微妙的那個。開了「run as web user」（或「run on behalf of」），agent 現在透過 *effective user 的*眼睛看資料庫 —— 包含 [Readers 欄位](/domino-news/zh-TW/posts/readers-authors-fields)。如果一份文件有個 Readers 欄位、而它沒列出 effective user，agent 就完全看不到那份文件：`db.Search`、view 迴圈、`GetDocumentByKey` 全都跳過它，不報錯。所以一個你執行時處理了 400 份文件的 agent（你在每個 Readers 欄位裡、或你是 admin），換成用一個「只是自己紀錄的 reader」的 web 使用者跑時，處理了 3 份。這個 agent 沒壞；它正確地為它所用的身分執行讀取權限。修法是設計決策、不是程式決策：把你的 agent 所用的角色或群組放進 Readers 欄位，或用一個「本來就該看到全部」的 signer／身分跑 agent。

## RunOnServer，以及認得自己的身分

`agent.RunOnServer`「在包含該資料庫的電腦上執行 agent」—— 你從其他程式踢一個伺服器端 agent 的方式。一個對除錯有用的副作用：這樣跑的 agent 把 `Print` 輸出送進 `log.nsf` 的 Events、不是 client，所以那是你找它足跡的地方。

能預防以上全部的習慣：任何「會在你桌子以外的地方跑」的 agent，一開頭就 log 一下 `session.EffectiveUserName`。一行就告訴你這個 agent 是用你、用一個服務 ID、還是用一個 web 使用者在跑 —— 而那單一事實，幾乎能解釋每一個「這裡好、那裡壞」的 agent bug。

## 同類別在其他語言

這個模型是共用的，而它的詞彙值得帶過去。Java agent 跑在完全一樣的 signer/effective-user 安全下，`lotus.domino.Session.getEffectiveUserName()` 是同一個屬性。XPages／SSJS 把這個選擇變得明確、而不是一個 checkbox：`session` 用當前使用者跑，而 `sessionAsSigner` 用 signer 的權限跑、`sessionAsSignerWithFullAccess` 用完整管理權限跑 —— 同樣是「這段程式用誰的權限」的決定，攤成三個不同的 session 物件、而不是一個 agent 設定。不管你在哪，出貨前要回答的問題都一樣：*這段程式看到的是誰的存取，而那是我要的嗎？*
