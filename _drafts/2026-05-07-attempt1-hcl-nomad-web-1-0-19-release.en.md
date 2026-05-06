---
title: "HCL Nomad Web 1.0.19 Released"
description: "HCL Nomad Web 1.0.19 introduces new features and fixes, including updated UI controls and enhanced stability."
pubDate: "2026-05-07T07:22:57+08:00"
lang: "en"
slug: "hcl-nomad-web-1-0-19-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Domino Server"
sources:
  - title: "HCL Nomad for web browsers 1.0.19"
    url: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-19/"
  - title: "HCL Nomad for web browsers User Documentation"
    url: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf"
  - title: "HCL Nomad and panagenda MarvelClient"
    url: "https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-19/" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-19-release
-->

HCL has recently released Nomad Web 1.0.19, bringing several new features and fixes that enhance user experience and application stability.

## Updated UI Controls

In this release, the following controls have been refreshed to utilize the HCL Enchanted design language:

- Rich text lite
- Time picker
- Time zone picker
- Color picker
- Color field
- Link hotspot

These updates provide a more modern and consistent user interface, improving the overall user experience.

## Fix List

1. **Connection Issue Fix**: Resolved an issue where Nomad Web took a long time to reconnect to the Domino server after a proxy or firewall dropped a connection without a reset.

2. **Context Menu Issue Fix**: Fixed intermittent loss of right-click context menu functionality.

3. **Printing Issue Fix**: Addressed the problem where combo boxes were missing when printing a document.

For a detailed list of fixes and related knowledge base articles, refer to [HCL Nomad for web browsers 1.0.19](https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-19/).

## MarvelClient Integration

HCL Nomad now integrates with panagenda's MarvelClient, allowing administrators to manage Nomad clients by defining their own settings. MarvelClient offers the following capabilities:

- **Centralized Management**: Manage every aspect of Nomad, including Recent Apps, local replicas, Location/Connection documents, and more, without end-user interaction.

- **Initial Setup**: Ensure Nomad clients are properly set up following initial installation, enabling users to be productive immediately without having to think about settings or how to find their Notes applications.

- **Consistent Application of Settings**: Apply settings consistently, ensuring Nomad stays configured correctly—a simple restart of the app automatically fixes misconfigurations without the need for help desk involvement.

- **Continuous Information Collection**: Continuously collect detailed information about all aspects of deployed Nomad installations, operating systems, and hardware to further administrative analytics.

- **Application Restrictions**: Configure application restrictions for improved data security.

For more information on how to download the MarvelClient Config database template with HCL Nomad support and how to configure MarvelClient, see [HCL Nomad and panagenda MarvelClient](https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html).

## Conclusion

HCL Nomad Web 1.0.19 significantly enhances user experience and application stability through the introduction of new UI controls and multiple fixes. The integration with MarvelClient further strengthens administrative capabilities, allowing for more effective management of Nomad clients. It is recommended that all users upgrade to this version to benefit from these improvements.
