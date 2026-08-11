---
title: "HCL Nomad Web 1.0.20 Released"
description: "HCL Nomad Web 1.0.20 has been released, featuring multiple security fixes and enhancements. Users are advised to upgrade promptly."
pubDate: "2026-08-12T07:41:59+08:00"
lang: "en"
slug: "hcl-nomad-web-1-0-20-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Security"
sources:
  - title: "Customer Information for HCL Nomad Web 1.0.20 - panagenda"
    url: "https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/"
  - title: "HCL Nomad for web browsers and HCL Nomad server on Domino 1.0.19 – Now Officially Released!"
    url: "https://developer.ds.hcl-software.com/t/hcl-nomad-for-web-browsers-and-hcl-nomad-server-on-domino-1-0-19-now-officially-released/172443"
  - title: "HCL Nomad for web browsers User Documentation"
    url: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf" was already cited by [hcl-nomad-ios-updates] on 2026-08-01. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-20-release
-->

HCL Nomad Web 1.0.20 has been officially released, bringing several security fixes and feature enhancements. Users are strongly encouraged to upgrade to this version to ensure system security and stability.

## Key Updates

- **Security Fixes**:
  - Addressed a denial-of-service (DoS) vulnerability in zlib (CVE-2026-27171), which could potentially cause system crashes or operational issues. For more details, refer to the [security bulletin](https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/).
  - Resolved known security vulnerabilities in libpng, yaml, and Lodash, further enhancing system security.

- **Feature Enhancements**:
  - Improved rendering of gray form and table cell backgrounds, ensuring consistent and aesthetically pleasing interface display.
  - Fixed an issue where the Nomad server could crash on launch when used with Domino 14.5.1 and OIDC backchannel logout enabled.

## Upgrade Recommendations

Given the critical security fixes and enhancements included in this release, all HCL Nomad Web users are advised to upgrade to version 1.0.20 promptly to maintain system security and stability. Detailed upgrade instructions and considerations can be found in the [HCL Nomad official documentation](https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf).

## Related Resources

- [HCL Nomad Web 1.0.20 Release Information](https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/)
- [HCL Nomad Official Documentation](https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf)

Please ensure that you back up relevant data before upgrading and perform necessary tests post-upgrade to confirm system functionality.
