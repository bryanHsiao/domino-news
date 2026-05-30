---
title: "HCL Domino 14 vs Earlier Versions: A Reference for Admins and Developers"
description: "When upgrading from V11 / V12 to Domino 14.x, the structural changes that actually break existing deployments are surprisingly limited — concentrated in a few areas. This article organises the 14.0 / 14.5 / 14.5.1 differences along five dimensions: notes.ini location, Java / JAR environment, XPages editor (CKEditor → TinyMCE 6.7), new modules (Domino IQ / DQL @FTSearch / AdminCentral / AutoUpdate), and the complete deprecation list (iNotes UI, SNMP MIB, DCT, Server Load Utility, etc.). Each entry is tagged with its starting version and official source, plus a pre-upgrade checklist at the end."
pubDate: 2026-05-31T07:30:00+08:00
lang: en
slug: domino-14-key-changes
tags:
  - "Domino"
  - "Tutorial"
sources:
  - title: "What's New in Domino 14.0 — HCL Product Documentation"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/wn_140.html"
  - title: "General updates in Domino 14.5 — HCL Product Documentation"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html"
  - title: "Components no longer included in Domino 14.5 — HCL Product Documentation"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_components_no_longer_included_in_release.html"
  - title: "General updates in Domino Designer 14.5 — HCL Product Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_generalupdates.html"
  - title: "What's new in Domino Designer 14.5.1 — HCL Product Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html"
  - title: "Splitting the CKEditor/TinyMCE Difference in XPages on Domino 14.5 — frostillic.us"
    url: "https://frostillic.us/blog/posts/2026/2/4/splitting-the-ckeditor-tinymce-difference-in-xpages-on-domino-14-5"
relatedJava: []
relatedSsjs: []
---

Your org is planning to upgrade Domino from V11 or V12 to 14.5 — the admin pages through release notes, the developer reads the Designer 14 docs, and in the end neither is sure which of *their* existing pieces will actually break versus which are just nice-to-haves.

The reality: Domino 14.x's truly structural changes — the ones that affect existing deployments — concentrate in a handful of areas. Not every release-notes line item deserves equal attention. This article organises the 14.0 / 14.5 / 14.5.1 differences along five dimensions: where files live, the Java environment, the XPages editor, new modules, and the full deprecation list. Every entry is tagged with its starting version and an official source, and the article closes with a pre-upgrade checklist you can run through.

---

## TL;DR

- **Java jumps twice**: [Domino 14.0](https://help.hcl-software.com/domino/14.0.0/admin/wn_140.html) lifts the main JVM from Java 8 to **Java 17 LTS** (Win / Linux / AIX); [Domino 14.5](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html) lifts it again to **Java 21 LTS**. IBM i only catches up to Java 17 in 14.5.
- **`notes.ini` can no longer live in the executable directory** — the 14.0 Windows installer dropped that support; the 14.5 installer actively moves it into `data directory` and updates the service registry to match.
- **JAR placement changed** — extension jars that used to go in `jvm/lib/ext` must move to `ndext` starting in 14.5.
- **The XPages editor was replaced wholesale** — 14.5 ships TinyMCE 6.7 instead of CKEditor 4, with **no opt-out** (CKEditor no longer ships with Domino).
- **14.5 removes 5 things**: [iNotes UI](https://help.hcl-software.com/domino/14.5.0/admin/wn_components_no_longer_included_in_release.html), SNMP MIB server start/stop/restart, Domino Configuration Tuner, Server Load Utility from the install panel, and the "Send upgrade notifications" action on `pubnames.ntf`.
- **14.0 additions**: AdminCentral (`admincentral.nsf`), AutoUpdate, 64-bit-only Notes clients, Domino Restyle UI.
- **14.5 additions**: [Domino IQ](/domino-news/en/posts/domino-iq) (server-embedded LLM inference engine), DQL integration of `@FTSearch`, external meeting invitation description limit lifted from 40 KB to 1 MB.
- **14.5.1 additions**: [`Copy` method on NotesJSONArray / NotesJSONObject / NotesJSONElement](https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html), new NotesSession methods (LotusScript + Java) for acquiring tokens from the Domino OIDC Provider, and [the XPages file upload UI now supports multiple selections by default](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html).

---

## 1. Where files live

### `notes.ini` location — narrowed in 14.0, auto-moved in 14.5

In V11 / V12, `notes.ini` on Windows could sit in the Domino executable directory (`C:\Program Files\HCL\Domino\`). **Starting with 14.0, the Windows installer no longer supports that location.** In 14.5, the installer goes further: it **actively moves `notes.ini` into `data directory`** (e.g. `C:\Domino\Data\notes.ini`) and updates the service registry to point at the new path.

Operational fallout to plan for:

- Existing add-on programs, batch jobs, monitoring scripts that hard-code the old path need to be audited and updated
- Third-party backup tools using `notes.ini` as a server-identity fingerprint will need reconfiguration
- Custom monitoring scripts reading `notes.ini` for dynamic config need to follow the path

### Windows Extension Manager API search path tightened

In 14.5, the [Extension Manager API](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html) (invoked via the `ExtMgr_Addins` notes.ini variable) **no longer searches the system PATH** for unqualified library names. The default search path drops to three locations:

1. Notes / Domino executable directory
2. Windows System directory
3. Windows directory

To add more search paths, use `ExtMgr_Dir<#>=<path>` (`<#>` is 1–9):

```ini
ExtMgr_Dir1=C:\MyExtensions
ExtMgr_Dir2=D:\ThirdParty\Bin
```

This is a security hardening — searching PATH made it too easy for a malicious DLL in the wrong location to get loaded. But legacy environments that relied on PATH to find their in-house extensions will need to set these variables explicitly post-upgrade.

### `OS_DISABLE_CACHESET` default flipped from 0 to 1

Starting with 14.5, `OS_DISABLE_CACHESET` defaults to `1` instead of `0`. The reasoning: on Windows Server 2019 and later, Domino's manipulation of the Windows File System cache actually causes performance problems, so the new default is to leave it alone.

If you manually set this to `0` chasing performance gains in the past, re-evaluate in 14.5 — keeping it at 1 is the right call in most scenarios.

### Verse install path

Fresh 14.5 installs put Verse in the program directory, not `data directory`. On upgrades: if the Verse version hasn't changed it stays put; if it has changed it moves to the program directory. Impact on backup paths and patch flows is minor, but any path-mapping tooling needs updating.

---

## 2. Java environment

### Two JVM jumps

| Version | Main JVM | JVM on IBM i |
|---|---|---|
| V11 / V12 | Java 8 | Java 8 |
| **14.0** | **Java 17 LTS** (Win / Linux / AIX) | Java 8 |
| **14.5** | **Java 21 LTS** (OpenJDK 21.0.3, IBM Semeru / OpenJ9) | **Java 17** (requires IBM i 7.4 / 7.5) |

Neither jump is small — Java 8 → 17 skips one LTS (11), and 17 → 21 is another LTS. **Most legacy code that relies on Java reflection, internal APIs, or `sun.*` packages will break on either 17 or 21.** Compatibility testing before upgrade isn't optional.

Starting with 14.0, Java applications need to **explicitly add [`glassfish-corba-omgapi.jar`](https://help.hcl-software.com/domino/14.0.0/admin/wn_140.html) to the classpath** alongside the existing `Notes.jar` or `NCSO.jar`. Without it, some CORBA operations throw `ClassNotFoundException`.

### Eclipse 4.22 → 4.30

In 14.5, Notes Standard, Domino Administrator, Domino Designer, and XPages all move from [Eclipse 4.22 to 4.30](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html). Biggest impact is on anyone shipping Eclipse plugins — Eclipse APIs aren't always backward-compatible across minor versions, so in-house plugins need recompilation and testing.

### JAR placement — `jvm/lib/ext` → `ndext`

Pre-V14, `jvm/lib/ext` was the standard place for extension jars (Domino auto-scanned them into classpath on startup). **Starting with 14.5, that location is no longer scanned** — jars must move to the `ndext` folder.

```
Old: <domino>/jvm/lib/ext/yourlib.jar
New: <domino>/ndext/yourlib.jar
```

This is downstream of Java 17/21 removing the old ext mechanism. During upgrade, audit every in-house jar and third-party extension still in `jvm/lib/ext` and migrate them.

### 64-bit Notes clients only

Starting with 14.0, Notes client **is 64-bit only**. Environments still running 32-bit need to confirm the client side can run 64-bit (most modern Windows installs are fine). AutoUpdate can upgrade 32-bit to 64-bit without a manual reinstall.

### Designer 14.5 / 14.5.1 developer APIs

- **14.5**: new 64-bit NotesSession API (LotusScript)
- **14.5**: XPages adds [`unsafe-inline` CSP support](https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_generalupdates.html), opt-in on the server (inline scripts in XPages used to hit CSP policy walls; now there's a path)
- **14.5.1**: [`NotesJSONArray` / `NotesJSONObject` / `NotesJSONElement` gain a `Copy` method](https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html) (copying JSON structures used to mean walking the tree; now there's a native API — see the [site article on the JSON trio](/domino-news/en/posts/notes-json-array-element-object))
- **14.5.1**: new `NotesSession` method (LotusScript) and `Session` method (Java) for acquiring an access token from the Domino OIDC Provider
- **14.5.1**: [the XPages file upload UI now supports multiple selections by default](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html) — verbatim: "The XPages file upload UI now supports multiple selections by default." Users can now select multiple files at once; the `fileUpload` control's default behaviour changed, no extra attribute needed

---

## 3. The XPages editor swap: CKEditor → TinyMCE

This is the single biggest 14.5 change for XPages developers.

### What changed

Starting with [Domino Designer 14.5, the XPages default rich text editor switched from CKEditor 4 to TinyMCE 6.7](https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_generalupdates.html). **No opt-out** — CKEditor no longer ships with Domino, so you can't reach back for the old one post-upgrade.

### Why HCL made the swap

Community observation ([frostillic.us's writeup](https://frostillic.us/blog/posts/2026/2/4/splitting-the-ckeditor-tinymce-difference-in-xpages-on-domino-14-5)) points to two reasons:

1. **CKEditor 4 reached EOL in June 2023** — no more security updates
2. **CKEditor 5 dropped the MPL licence option** — commercial use is now paid-only

HCL apparently didn't want to pay for extended CKE4 support or for a CKE5 commercial licence, so TinyMCE it is.

### Two common ways your customisation will break

If you've customised CKEditor before, two patterns won't work on TinyMCE:

**1. Toolbar configuration as a string preset**

```xml
<!-- CKEditor accepts a preset profile -->
<xp:attr name="toolbarType" value="Large"/>
```

TinyMCE treats the same attribute as a **space-delimited list of action names**, and `"Large"` isn't one of TinyMCE's built-in actions — so it **silently breaks**: the editor renders, but the toolbar is wrong.

**2. JavaScript expressions for dynamic attribute values**

CKEditor runs certain attributes through `eval()`, so this works:

```xml
<xp:attr name="toolbar" value="${javascript:getUserToolbar(...)}"/>
```

TinyMCE **does not support that** — values must be resolved up front.

### Cross-version-compatible workaround

The community pattern is to use `@Version` build-number checks and conditionally load both configurations:

```xml
<xp:dataContext var="isTinyMce"
                value="${javascript:parseInt(session.evaluate('@Version')[0], 10) >= 495}"/>

<!-- For 14.5 and below — CKEditor style -->
<xp:attr name="toolbar" value="Slim" loaded="${not isTinyMce}"/>

<!-- For 14.5+ — TinyMCE style (space-delimited actions) -->
<xp:attr name="toolbar" value="undo redo styles" loaded="${isTinyMce}"/>
```

Not an official recommendation, but practical for code that has to deploy across multiple Domino server versions.

### What still works

Simple static attributes (`skin="oxide-dark"`, `height="400"`, etc.) work on both — no changes needed.

### Bonus: Dojo upgraded too

[Domino 14.5 also lifts Dojo from 1.9.7 to 1.17.3](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html) — same "cross-major-version compatibility isn't guaranteed" story. XPages components built on Dojo need re-testing.

---

## 4. New modules

This section is "new arrivals only"; deep-dives are linked to their own articles:

### Domino IQ — server-embedded LLM inference engine (14.5)

Domino 14.5 brings an LLM inference engine into the server process — Domino apps can call a local AI model without round-tripping to OpenAI / Azure. New [`NotesLLMRequest` / `NotesLLMResponse` classes](/domino-news/en/posts/notes-llm-request) (covered in a dedicated article) let LotusScript and Java interact directly. With [RAG configuration](/domino-news/en/posts/domino-iq-rag), NSFs can serve as the knowledge base.

### DQL `@FTSearch` integration (14.0)

[Domino 14 integrated FTSearch as a DQL term](/domino-news/en/posts/domino-search-decision) — write `@FTSearch('query')` or `@FTS('query')` to mix text-search predicates into structured queries. One query expresses both shapes; no more two-stage chains needed.

### AdminCentral — new admin app (14.0)

Starting with 14.0, AdminP automatically creates `admincentral.nsf`, putting most day-to-day admin tasks in either Notes Standard client or Nomad web — no need for the classic Domino Administrator. Big quality-of-life improvement for web-admin-first shops.

### AutoUpdate — automated Domino updates (14.0; reinforced in 14.5)

Shipped in 14.0: pull new versions from the My HCLSoftware Portal, distribute to designated server groups. **Fully automated updates on Windows / Linux start in 14.5** (set Product Updates to "Notify, Download and Update"); AIX in 14.5 can serve as a download server or target for distribution but not as an install target.

### 64-bit NotesSession API (14.5)

14.5 adds a NotesSession API specifically tuned for 64-bit — better performance and memory characteristics for large workloads.

### Other additions

- [Mac C API Kit](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html) ships with an upgraded compiler (14.5)
- External meeting invitation description ceiling raised from 40 KB to **1 MB** (14.5)
- DAOSmgr Repair Tell command scans the DAOS catalog for missing objects (14.0)
- Domino Restyle harmonised UI palette (14.0)
- InstallAnywhere upgraded to 2024 R1 on all platforms; Notes client switched to InstallShield 2023 R1 (14.5)

---

## 5. Deprecation / removal list (14.5)

Items [explicitly no longer included in Domino 14.5](https://help.hcl-software.com/domino/14.5.0/admin/wn_components_no_longer_included_in_release.html):

| Removed | Replacement |
|---|---|
| **iNotes user interface** | Switch to HCL Verse; to keep iNotes alive, you must retain a 14.0 or earlier Domino server |
| The "Send upgrade notifications" action on `pubnames.ntf` + matching subform | None |
| **SNMP MIB** server start / stop / restart | None — use a different server management tool |
| **Domino Configuration Tuner (DCT)** | No formal replacement |
| **Server Load Utility** from the Domino Administrator install panel | None |

iNotes removal is the heaviest hit on this list — orgs with iNotes users still around need a Verse transition plan upfront, or they have to keep a legacy server around as a stopgap (not recommended long-term).

---

## 6. Security / authentication (covered in dedicated site articles)

14.5 has two changes that hit existing deployments hard; both have dedicated articles on the site:

- **Mandatory port encryption** (14.5): see the [mandated-port-encryption article](/domino-news/en/posts/mandated-port-encryption)
- **TLS trust store moves from `cacerts.pem` to the Domino Directory** (14.5): see the [NotesHTTPRequest 14.5 trust-store article](/domino-news/en/posts/notes-httprequest-14-5-trust-store)

Both will cause "code that worked yesterday won't connect today" failures post-upgrade — strongly recommend reading both before scheduling the upgrade.

---

## Pre-upgrade checklist

Organised into an admin / dev checklist you can run through:

### Admin

- [ ] Audit every in-house batch / scheduled / monitoring script for hardcoded `notes.ini` paths
- [ ] List every library loaded via `ExtMgr_Addins`; check which relied on PATH search and add `ExtMgr_Dir<#>=` entries as needed
- [ ] Drop any manual `OS_DISABLE_CACHESET=0` setting — confirm the 14.5 default works
- [ ] If iNotes users remain: schedule the Verse transition
- [ ] If SNMP MIB drove server start/stop automation: switch tooling
- [ ] If DCT was part of your health-check flow: find an alternative
- [ ] Upgrading IBM i to 14.5: confirm OS is at 7.4 or 7.5 and Java 17 patch level matches

### Developer

- [ ] Move every jar in `jvm/lib/ext` to `ndext`
- [ ] Add `glassfish-corba-omgapi.jar` to the Java application classpath
- [ ] In 32-bit Notes client environments: confirm 64-bit migration is feasible
- [ ] XPages apps: grep for CKEditor usage; check `toolbar` / `toolbarType` attributes that might break
- [ ] XPages apps: grep for `${javascript:...}` expressions on CKEditor attributes; replace with static values or `@Version`-conditioned attributes
- [ ] Run a full XPages regression after upgrade, paying particular attention to Dojo-based components
- [ ] In-house Eclipse plugins (if any): rebuild and test against Eclipse 4.30
- [ ] Code using Java reflection: compatibility-test against Java 17 / 21
- [ ] Post-14.5.1: revisit any in-house `fileUpload` customisation that assumed single-file selection — the default behaviour now allows multiple files

---

## Closing

Domino 14.x isn't a V8-to-V9-style UI refresh — it's "the underlying runtime got swapped out from underneath you" — two Java jumps, tightened file paths, an editor swap, and a slate of security hardening.

For existing deployments, **the thing that bites isn't "missing a new feature" — it's "missing that an old pattern no longer works"**. The items in this article — `notes.ini` path, `jvm/lib/ext`, CKEditor customisations especially — are real-world breakage points, not nice-to-know release-notes entries.

When you're scheduling the actual upgrade, take this checklist against your systems item by item. It'll save you a lot of troubleshooting hours down the road.
