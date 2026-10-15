---
title: "HCL Nomad 1.0.21 Release"
description: "HCL Nomad 1.0.21 has been released, introducing new features and improvements to enhance user experience and management capabilities."
pubDate: "2026-10-15T09:17:46+08:00"
lang: "en"
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

HCL has recently released version 1.0.21 of HCL Nomad, bringing several new features and improvements to enhance the application's usability and management capabilities.

## Key Updates

- **Multi-Value Selection Fix**:
  - Resolved an issue where selecting multiple values in the "Date/Time" field was problematic under certain conditions. For more details, refer to the [HCL Nomad 1.0.21 Release Notes](https://help.hcltechsw.com/nomad/1.0_web/nomad_web_new.html).

- **IME Input Enhancements**:
  - Addressed issues related to input accuracy and smoothness when using Input Method Editors (IME) in specific scenarios.

## Management Enhancements

- **Integration with panagenda MarvelClient**:
  - HCL Nomad now includes panagenda MarvelClient, allowing administrators to manage Nomad clients by defining specific settings. This integration enables:
    - Centralized management of various aspects of Nomad, such as recent apps, local replicas, and location/connection documents, without user intervention.
    - Ensuring Nomad clients are correctly set up post-installation, allowing users to be productive immediately without configuring settings or locating Notes applications.
    - Continuous collection of detailed information about deployed Nomad installations, operating systems, and hardware for further administrative analysis.
    - Configuration of application restrictions to enhance data security.

  For more information, see [HCL Nomad and panagenda MarvelClient](https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html).

## Installation and Configuration

- **Managing HCL Nomad**:
  - Comprehensive guides are available for installing, configuring, and managing HCL Nomad, assisting administrators in effectively deploying and maintaining the Nomad environment. Relevant information can be found in the [HCL Nomad Administration Documentation](https://help.hcl-software.com/nomad/1.0_admin/index.html).

The release of HCL Nomad 1.0.21 provides users and administrators with a more stable and efficient tool, further enhancing the overall experience and management capabilities of HCL Nomad.
