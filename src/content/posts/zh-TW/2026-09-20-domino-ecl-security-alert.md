---
title: "Execution Security Alert：那個「要不要允許」的安全警告是 ECL 在把關"
description: "跑一個 agent、開一封信、按一個按鈕，突然跳出 Execution Security Alert 問你要不要允許——那不是病毒，是 ECL（執行控制清單）在守你的工作站。ECL 判定「某個 signer 的程式碼能不能在你這台跑、能做到哪些事」；signer 不在清單、或做了沒被授權的動作，就跳警告。這篇講 ECL 是什麼、警告為什麼跳、workstation ECL 與 Administration ECL 的差別、跟簽署的關係，以及怎麼設。"
pubDate: 2026-09-20T07:30:00+08:00
lang: zh-TW
slug: domino-ecl-security-alert
tags:
  - "Notes Client"
  - "Security"
sources:
  - title: "The execution control list — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html"
  - title: "ECL security access options — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_eclsecurityaccessoptions_r.html"
  - title: "Administration ECLs — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_administrationecls_c.html"
relatedJava: []
relatedSsjs: []
---

跑一個 agent、開一封帶按鈕的信、或按下某個 hotspot，Notes 突然跳出一個 **Execution Security Alert**：「某某簽署的程式碼想做某件事，要允許嗎?」很多人反射地按「允許」就過去了，也有人被它煩到不行。這個警告不是壞事——是 **ECL（Execution Control List，執行控制清單）**在守你的工作站。搞懂它，你就知道為什麼跳、該不該允許、以及開發時怎麼避免它一直跳。

## 重點摘要

- **ECL 判定「誰的碼能在你這台跑、能做什麼」**：[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html)——「determines whether the signer of the code is allowed to run the code on a given workstation, and defines the access that the code has to various workstation functions.」
- **它守的是「active content」**：公式、script、agent、設計元件、按鈕／hotspot……甚至病毒木馬。
- **為什麼跳警告**：signer 不在你的 ECL、或在但做了「沒被授權的動作」→ 跳 Execution Security Alert，標明**動作、signer、沒啟用的那個設定**。
- **兩種 ECL**：Administration ECL（在 Domino Directory，管理範本）與 workstation ECL（在使用者 Contacts，實際生效的那份）。
- **它是按 signer 授權的**：agent／DB 用「受信任的 ID」簽署，就不會一直跳。

## ECL 是什麼

ECL 是**工作站層級**的安全機制。[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html)一句話定義：

> 「The ECL determines whether the signer of the code is allowed to run the code on a given workstation, and defines the access that the code has to various workstation functions.」

兩件事：**這段碼的簽署者，能不能在你這台跑**；以及**能碰到哪些工作站功能**（存取檔案、改環境變數、寄信、讀其他資料庫……）。它守的對象是「active content」——[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html)列得很廣：

> 「Formulas; scripts; agents; design elements in databases and templates; documents with stored forms, actions, buttons, hot spots; as well as malicious code (such as viruses and so-called 'Trojan horses').」

換句話說，凡是「會在你機器上執行」的東西，ECL 都管——這正是它存在的意義：擋下不信任來源的程式碼亂動你的機器。

## 警告為什麼跳：Execution Security Alert

當一段 active content 想做某件事，Notes 會查你的 ECL：**這個 signer 在不在清單裡?被授權做這個動作嗎?** 只要有一項不符合，就跳警告。[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html)：

> 「If the active content attempts an action that is not enabled for the signer, or if the signer is not listed in the ECL, Notes generates an Execution Security Alert (ESA).」

而且警告會告訴你**是誰、想做什麼、卡在哪個設定**：

> 「The ESA specifies the attempted action, the signer's name, and the ECL setting that is not enabled.」

所以下次跳警告時，別急著閉眼按「允許」——先看它寫的 **signer 是誰、想做什麼動作**。是你認得、信得過的內部開發者簽的、動作也合理，才考慮允許；來源不明就該拒絕。使用者的回應選項裡，有一個「**開始信任這個 signer 執行這個動作**」——選了它會把該簽章加進你的 ECL，之後同一個 signer 做同一件事就不再問。

## 兩種 ECL：範本 vs 實際生效

[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html)點明有兩份：

> 「The Administration ECL, which resides in the Domino Directory (NAMES.NSF), and the workstation ECL, which is stored in the user's Contacts (NAMES.NSF).」

- **Administration ECL**：放在 Domino Directory 裡，是**組織的範本**。管理員在這裡定義「哪些 signer 預設受信任、能做哪些事」。
- **workstation ECL**：放在每個使用者的 Contacts（本機 names.nsf），是**實際生效**的那份。使用者第一次設定時從 Administration ECL 帶下來，之後每次跳警告按「信任」也會改到它。

所以要**全公司**統一放行某個內部 signer，管理員改 [Administration ECL](https://help.hcl-software.com/domino/11.0.1/admin/conf_administrationecls_c.html) 再推給使用者，比叫每個人自己按「允許」可靠得多。

## 跟簽署的關係（開發者最有感）

ECL 是**按 signer 授權**的——所以你的 agent／DB 一直跳安全警告，十之八九是因為**簽它的那個 ID 不在使用者的 ECL 裡、或沒被授權那個動作**。兩條路：

- **用受信任的 ID 重新簽署**：上線前用組織信任的簽署 ID（例如專用的 app signer）簽 agent／設計元件，使用者的 ECL 認得它，就不跳。
- **在 Administration ECL 放行那個 signer**：由管理員把 app signer 加進去、開對應的 access。

各種可授權的動作（存取檔案、修改環境、寄信、操作其他資料庫等）在 [ECL security access options](https://help.hcl-software.com/domino/12.0.0/admin/conf_eclsecurityaccessoptions_r.html) 有完整清單；另外 ECL 裡也有 `-Default-`（沒特別列出的 signer 套用的預設）與 `-No Signature-`（未簽署內容）這兩個特殊項要留意。

怎麼開自己的 workstation ECL 看：**File → Security → User Security → What Others Do**（不同版本字樣略異）。

## 小結

那個「要不要允許」的 Execution Security Alert，不是故障、也不是病毒——是 **ECL 按 signer 在守你的工作站**：signer 不在清單、或做了沒被授權的動作就跳，而且會告訴你是誰、想幹嘛。使用者端該看清楚再決定信不信；開發端則是**用受信任的 ID 簽署**、或請管理員在 Administration ECL 放行，就不會一直被問。
