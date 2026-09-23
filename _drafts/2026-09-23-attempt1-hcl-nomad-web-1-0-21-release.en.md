---
title: "HCL Nomad Web 1.0.21 Released: Fixes MarvelClient Configuration Issue"
description: "HCL Nomad Web 1.0.21 has been released, addressing issues related to panagenda MarvelClient configuration and including several other bug fixes."
pubDate: "2026-09-23T09:19:23+08:00"
lang: "en"
slug: "hcl-nomad-web-1-0-21-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Admin"
sources:
  - title: "HCL Nomad Web 1.0.21: Important Bug Fix for MarvelClient | panagenda"
    url: "https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/"
  - title: "HCL Nomad for web browsers 1.0.21 - Ales Lichtenberg"
    url: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-21/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai" appears 6/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-21-release
-->

HCL has recently released HCL Nomad Web 1.0.21, focusing on bug fixes and stability improvements without introducing new features. ([panagenda.com](https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai))

**MarvelClient Configuration Fix**

For users utilizing panagenda MarvelClient, this release resolves an issue where the MarvelClient configuration database specified through `NOM_MC_DB` in `notes.ini` was not being utilized correctly. This problem, introduced in version 1.0.20, prevented Nomad Web from locating custom MarvelClient configuration databases. Version 1.0.21 restores the expected functionality. ([panagenda.com](https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai))

**Other Fixes**

In addition to the MarvelClient-related fix, version 1.0.21 addresses the following issues:

- Unable to select multiple values in the "Date/Time" field under certain conditions.
- IME input to a database field is not possible while the Search dialog is displayed.
- Embedded Outline icon position "Middle-right" is not honored.
- Print Preview dialog shows extra input fields, and text and borders are not aligned correctly.
- Crash while importing a large database via Open Application.
- Legacy gray system-style buttons are converted to outlined buttons.
- "LookupHandle: handle out of range" in GetPrintSettings causes a crash.
- Email footer inline images are displayed as attachments.
- Tabbed table cell color rendering changes unexpectedly.
- Nomad Federated Login with Google Workspace as the IdP results in a 400 error.

**How to Get the Latest Version**

HCL Nomad Web 1.0.21 is available through the My HCLSoftware Portal. HCL announced the release on September 15, 2026. ([panagenda.com](https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai))

**Conclusion**

HCL Nomad Web 1.0.21 is a maintenance release focusing on stability and compatibility improvements. For users of panagenda MarvelClient, upgrading to version 1.0.21 is particularly important to ensure proper configuration functionality.
