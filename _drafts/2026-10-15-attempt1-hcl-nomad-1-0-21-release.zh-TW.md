---
title: "HCL Nomad 1.0.21 版本發布"
description: "HCL Nomad 1.0.21 版本已發布，提供多項新功能與改進，提升使用者體驗與管理能力。"
pubDate: "2026-10-15T09:17:46+08:00"
lang: "zh-TW"
slug: "hcl-nomad-1-0-21-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Domino Server"
sources:
  - title: "HCL Nomad for web browsers 1.0.21 Release Notes"
    url: "https://help.hcltechsw.com/nomad/1.0_web/nomad_web_new.html"
  - title: "HCL Nomad Administration Documentation"
    url: "https://help.hcl-software.com/nomad/1.0_admin/index.html"
  - title: "HCL Nomad and panagenda MarvelClient"
    url: "https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 1
slug: hcl-nomad-1-0-21-release
topicOverlap: false
issues:
  [critical] Article title and body — 'HCL Nomad 1.0.21 Release'
      problem: The article conflates HCL Nomad for mobile/desktop (the native Notes client replacement, versioned separately) with HCL Nomad Web (the browser-based variant). The cited release-notes URL path is 'nomad/1.0_web/nomad_web_new.html', which is explicitly the Nomad Web release notes, yet the article title and body say only 'HCL Nomad 1.0.21' with no qualification. These are distinct products with distinct version streams, release notes, and feature sets. Publishing without clarifying which product (or confirming 1.0.21 applies to both) will mislead readers.
      fix:     Confirm whether 1.0.21 refers to Nomad Web, Nomad for iOS/Android/macOS/Windows, or all variants. Update the title and body to name the specific product explicitly (e.g., 'HCL Nomad Web 1.0.21' or 'HCL Nomad 1.0.21 — All Platforms'). If covering multiple variants, separate the release notes per product.
  [critical] Multi-Value Selection Fix — 'selecting multiple values in the "Date/Time" field'
      problem: This is a vague and potentially inaccurate characterization. A 'multi-value Date/Time field selection' fix is an oddly specific claim that does not obviously match any publicly documented 1.0.21 Nomad Web fix. The cited URL is to the live release-notes page (which changes over time), so the article may be paraphrasing the wrong version's notes, or may have hallucinated this detail. Without pinning the exact fix to the 1.0.21 section of that page, this cannot be verified as accurate.
      fix:     Quote the exact fix text from the 1.0.21 section of the release notes and link directly to the anchored section if available. Do not paraphrase a bug fix description — the paraphrase here is ambiguous enough that it may be factually wrong.
  [major] Integration with panagenda MarvelClient
      problem: The article presents the panagenda MarvelClient integration as a new feature of 1.0.21, but MarvelClient support for Nomad was introduced in earlier Nomad releases and has been present in the admin documentation for some time. If this is simply being documented here (not newly introduced in 1.0.21), presenting it under a '1.0.21 release' article as a new update is misleading. Additionally, the article does not clarify that panagenda MarvelClient is a separate third-party commercial product requiring its own licensing and infrastructure — readers may assume it is bundled with Nomad at no cost.
      fix:     Verify that MarvelClient integration was genuinely new in 1.0.21. If not, move it to a separate 'further reading' or 'administration' section and do not imply it is a 1.0.21 addition. Add a sentence clarifying that panagenda MarvelClient is a separately licensed third-party product.
  [major] IME Input Enhancements — 'in specific scenarios'
      problem: 'In specific scenarios' is so vague as to be meaningless to readers. IME issues are particularly relevant to CJK-language users (Chinese, Japanese, Korean). Without stating which languages or input modes were affected, or what 'specific scenarios' means, the item provides no actionable information and reads as filler.
      fix:     Identify the specific IME scenarios fixed (e.g., Japanese IME candidate window behavior, Korean composition mode) as stated in the actual release notes. If the release notes are themselves vague, quote them directly rather than paraphrasing.
  [major] Article overall — thin content
      problem: The article is extremely thin: two bug fixes (one vaguely described) and a management feature that may not be new to this release. A release-notes summary article of this length and detail level does not add value beyond what a reader would get by clicking the linked release-notes page directly. The MarvelClient section is padded with generic marketing-style bullet points that duplicate the HCL documentation verbatim without editorial analysis.
      fix:     Either expand with genuine editorial analysis (what these fixes mean in practice, who is affected, workarounds that existed before the fix) or hold the article until enough release content exists to justify it. Alternatively, position it explicitly as a 'quick summary' with a clear link to the full notes.
  [minor] Cited source — https://help.hcltechsw.com/nomad/1.0_web/nomad_web_new.html
      problem: This URL uses the domain 'help.hcltechsw.com' while the other two citations use 'help.hcl-software.com'. HCL has been consolidating documentation under hcl-software.com. The hcltechsw.com domain may redirect or may be a legacy path. The inconsistency is a flag worth checking before publication.
      fix:     Verify that the hcltechsw.com URL resolves to current 1.0.21 content and is not a redirect to an outdated page. If a canonical hcl-software.com equivalent exists, prefer that for consistency.
-->

HCL 最近發布了 HCL Nomad 1.0.21 版本，為使用者帶來多項新功能與改進，進一步提升了應用程式的可用性與管理能力。

## 主要更新內容

- **多值選擇修正**：
  - 解決了在特定條件下，無法在「日期/時間」欄位中選擇多個值的問題。詳細資訊請參閱 [HCL Nomad 1.0.21 發行說明](https://help.hcltechsw.com/nomad/1.0_web/nomad_web_new.html)。

- **IME 輸入改進**：
  - 修正了在某些情況下，使用輸入法編輯器（IME）輸入時的問題，提升了輸入的準確性與流暢度。

## 管理功能增強

- **與 panagenda MarvelClient 整合**：
  - HCL Nomad 現在內建了 panagenda MarvelClient，允許管理員透過定義設定來管理 Nomad 用戶端。這包括：
    - 中央管理 Nomad 的各個方面，如最近的應用程式、本地副本、位置/連線文件等，無需使用者介入。
    - 確保 Nomad 用戶端在初次安裝後正確設定，讓使用者立即投入生產，無需考慮設定或如何找到 Notes 應用程式。
    - 持續收集有關已部署的 Nomad 安裝、作業系統和硬體的詳細資訊，以進行進一步的管理分析。
    - 配置應用程式限制，以提高資料安全性。

  更多資訊請參閱 [HCL Nomad 與 panagenda MarvelClient](https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html)。

## 安裝與設定

- **管理 HCL Nomad**：
  - 提供了詳細的安裝、配置和管理 HCL Nomad 的指南，協助管理員有效地部署和維護 Nomad 環境。相關資訊可在 [HCL Nomad 管理文件](https://help.hcl-software.com/nomad/1.0_admin/index.html) 中找到。

HCL Nomad 1.0.21 版本的發布，為使用者和管理員提供了更穩定和高效的工具，進一步提升了 HCL Nomad 的整體體驗與管理能力。
