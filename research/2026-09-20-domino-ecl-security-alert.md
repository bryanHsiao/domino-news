---
slug: domino-ecl-security-alert
title: "ECL / Execution Security Alert"
lang: [zh-TW, en]
pubDate: 2026-09-20
status: staged（_pending）
tags: [Notes Client, Security]
requester: 使用者 (bryan，9/17–9/22 六篇批次；候選 4；security)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent) → PASS；ESA 觸發那句原本引號內是改寫 → 改用官方逐字「If the active content attempts an action that is not enabled for the signer, or if the signer is not listed in the ECL...」。（-Default-/-No Signature- 描述正確、框為一般說明非官方引用，保留。）
created: 2026-09-16
updated: 2026-09-16
---

# 研究軌跡 — domino-ecl-security-alert

9/20（第 4 篇）。coverage：無 ECL 專篇（sign/encrypt 有 notes-document-sign-encrypt 但那是文件層級簽署加密，不同）。security 方向。TYPE 留白。

## 研究鏈（WebFetch 第一手）

- **The execution control list**（[12.0.0 doc](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html)）逐字：
  - ECL 定義：「determines whether the signer of the code is allowed to run the code on a given workstation, and defines the access that the code has to various workstation functions.」
  - active content：「Formulas; scripts; agents; design elements...; documents with stored forms, actions, buttons, hot spots; as well as malicious code...」
  - 兩種 ECL：「The Administration ECL, which resides in the Domino Directory (NAMES.NSF), and the workstation ECL, which is stored in the user's Contacts (NAMES.NSF).」
  - ESA 觸發：「the signer is not listed in the ECL, or if the signer of the code is listed but attempts an action that is not enabled.」＋「The ESA specifies the attempted action, the signer's name, and the ECL setting that is not enabled.」
- ECL security access options / Administration ECLs 頁。
- 「start trusting the signer」回應選項、`-Default-`/`-No Signature-`、簽署關係（開發端用受信任 ID 簽）＝通識 + 官方語意。

## 查證 checklist

- [x] ECL 定義 / active content / 兩種 ECL / ESA 觸發與內容 全官方逐字
- [x] Notes Client + Security tag；TYPE 留白
- [x] inline-link diversity：3 相異官方 URL
- [ ] 雙語 build 驗證
- [ ] 批次 fact-check（#4–6）

## 異動日誌

- 2026-09-16 WebFetch 驗 ECL 官方逐字、雙語、sidecar；stage _pending 排 9/20（Opus 4.8）
