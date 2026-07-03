---
title: "Overview of the Latest HCL Nomad Updates"
description: "HCL Nomad has recently introduced several updates for its iOS and web browser versions, including interface enhancements, new features, and bug fixes, improving user experience and application performance."
pubDate: "2026-07-03T08:08:18+08:00"
lang: "en"
slug: "hcl-nomad-latest-updates"
tags:
  - "Nomad"
  - "Release Notes"
  - "Domino Server"
sources:
  - title: "What's new in HCL Nomad for Apple iOS?"
    url: "https://help.hcl-software.com/nomad/1.0/hcln_whatsnew.html"
  - title: "What's new in HCL Nomad for web browsers, HCL Nomad server on Domino, and HCL Nomad for web browsers COM Helper?"
    url: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html"
  - title: "HCL Nomad Documentation"
    url: "https://help.hcl-software.com/nomad/welcome/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-latest-updates
-->

## Overview of the Latest HCL Nomad Updates

HCL Nomad has recently introduced several updates for its iOS and web browser versions, aiming to enhance user experience and application performance.

### iOS Version Updates

**Version 1.0.55**

- On iPad (iPadOS 26 and later), the "Create" and "Actions" menus are now available in the new system menu bar.
- Active replication now continues for up to 30 seconds after Nomad enters the background.

**Version 1.0.53**

- The Dialog List button has an updated icon and improved size for better visibility.
- The "Open Application" dialog has an updated "Up one level" button icon for more intuitive navigation.
- The "About" page now includes the version's year and month, aiding users in identifying version information.

**Version 1.0.52**

- The Rich Text Lite field has been refreshed to utilize the HCL Enchanted design language, providing a more consistent visual experience.
- The "Inter" font is now included and set as the default sans-serif font for most locales, enhancing text readability.

**Version 1.0.51**

- Several controls have been updated to utilize the HCL Enchanted design language, including radio buttons, checkboxes, list boxes, picker fields, text field delimiters, and tabbed tables, offering a more modern appearance.

**Version 1.0.50**

- Support for iPadOS 26 menu bar and window controls has been added, improving compatibility with the latest system features.

### Web Browser Version Updates

**Version 1.0.13**

- **Single Executable**: There is now only one executable for Nomad server on Domino that works on all supported versions of Domino, simplifying the deployment process.
- **SAML Configuration**: The SAML configuration has been migrated from `nomad-config.yml` to `idpcat.nsf` and requires manual migration. For more details, see [SAML Authentication Configuration for Nomad Server on Domino](https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html).
- **OIDC Provider Support**: If Domino HTTP is configured to use an OIDC provider for federated login, Nomad can now use that mechanism for authentication, provided the Domino server version is at least 14.0.0 FP2.
- **Drag and Drop**: Drag and drop functionality is no longer limited to Chrome and Edge browsers, extending support to other browsers.
- **Modernization Updates**:
  - **Custom Application Builder**: Allows the creation of new applications with fundamental components such as views, forms, and action bars automatically created, streamlining the development process.
  - **Import Restyle Settings**: Enables importing Restyle settings from a previously restyled database, ensuring design consistency.
- **New Formula Function Support**: Added support for the `@ScanBarcode` formula function, expanding application capabilities.

These updates aim to enhance the functionality and user experience of HCL Nomad, ensuring smooth operation across various devices and browsers. For more detailed information, refer to the [HCL Nomad Official Documentation](https://help.hcl-software.com/nomad/welcome/index.html).
