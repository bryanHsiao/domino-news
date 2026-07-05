---
title: "HCL Nomad 1.0.20 Released"
description: "HCL Nomad 1.0.20 is now available, introducing new features and improvements for web browsers, including Kiosk Mode, LotusScript access to C API, and updates to the COM Helper."
pubDate: "2026-07-05T08:03:30+08:00"
lang: "en"
slug: "hcl-nomad-1-0-20-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Domino Server"
sources:
  - title: "HCL Nomad Documentation"
    url: "https://help.hcl-software.com/nomad/welcome/index.html"
  - title: "HCL Nomad for web browsers 1.0.x Release Notes"
    url: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html"
  - title: "HCL Nomad for web browsers COM Helper beta 3"
    url: "https://help.hcl-software.com/nomad/beta/nomadweb/nomadweb_welcome_beta.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/nomad/welcome/index.html" was already cited by [hcl-nomad-latest-updates] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html" was already cited by [hcl-nomad-latest-updates] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-1-0-20-release
-->

HCL Nomad 1.0.20 has been released, bringing several new features and enhancements to the web browser experience. Here are the key updates in this version:

## Kiosk Mode

This release introduces Kiosk Mode, allowing a specific database to automatically run on startup, providing a smoother user experience. For more details, refer to the [HCL Nomad for web browsers 1.0.x Release Notes](https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html).

## LotusScript Access to C API

HCL Nomad 1.0.20 now supports LotusScript access to the C API, enhancing application functionality and flexibility. More information can be found in the [HCL Nomad Documentation](https://help.hcl-software.com/nomad/welcome/index.html).

## COM Helper Updates

To improve interaction with COM objects, the HCL Nomad for web browsers COM Helper has been updated to Beta 3. This update requires Nomad for web browsers 1.0.14 or higher and moves whitelist management from a registry key to a file in the installation directory. For more details, see the [HCL Nomad for web browsers COM Helper beta 3](https://help.hcl-software.com/nomad/beta/nomadweb/nomadweb_welcome_beta.html).

## Additional Improvements

- **Single Executable**: The Nomad server on Domino now requires only one executable for all supported Domino versions, simplifying installation and maintenance.

- **SAML Configuration Changes**: SAML configuration has been migrated from `nomad-config.yml` to `idpcat.nsf`, requiring manual migration. More information is available in the [HCL Nomad for web browsers 1.0.x Release Notes](https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html).

Users are encouraged to upgrade to HCL Nomad 1.0.20 to take advantage of these new features and improvements.
