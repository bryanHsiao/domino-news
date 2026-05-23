---
title: "Notes 14.5.1 Deployment Got Faster: panagenda Benchmark vs HCL's One-Line Explanation"
description: "During Engage 2026, panagenda cited a benchmark: Notes 14.5.1 installs 61% faster than 14.5.0 — 62s → 24s per endpoint. A separate panagenda blog post measured 38s 'in my environment'. But HCL's official What's New document gives the speedup just one sentence: 'now installs deployed modules and places them in the file system, similar to the fast and robust installation methods already in use for the Mac client' — no in-house benchmark, no mechanism detail. This article reconciles the two sources, runs the math for large-scale deployments, mentions another deployment-related 14.5.1 improvement (non-admin Windows install), and lists what HCL still hasn't disclosed."
pubDate: 2026-05-24T07:30:00+08:00
lang: en
slug: notes-14-5-1-deployment-changes
tags:
  - "Notes Client"
  - "News"
  - "Admin"
sources:
  - title: "Engage 2026 in Ghent — panagenda recap"
    url: "https://www.panagenda.com/blog/engage-2026-in-ghent-coming-home-to-the-community/"
  - title: "HCL Notes 2026 sneak peek — panagenda blog"
    url: "https://www.panagenda.com/blog/hcl-notes-2026-sneak-peek/"
  - title: "What's new in HCL Notes 14.5.1 Early Access 1 — HCL official"
    url: "https://help.hcl-software.com/notes/14.5.1/client/whats_new_notes_1451_ea1.html"
  - title: "HCL Notes and Domino 14.5.1 Release Notes — HCL Customer Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0129261"
  - title: "Notes/Domino 14.5.1 ship timing — Daniel Nashed blog"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/notesdomino-14.5.1-planned-to-ship-in-q12026-is-planned-to-replace-the-14.5-code-stream.htm"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-14-5-1-deployment-changes.png"
coverStyle: "photoreal-3d"
---

## TL;DR

- **panagenda's Engage 2026 recap figure**: Notes 14.5.1 installs **61% faster** than 14.5.0 — **62s → 24s per endpoint**.
- **A separate panagenda blog post measured**: "the installer only takes 38 seconds in my environment."
- **These are not HCL's own benchmarks** — HCL hasn't published install-time numbers; the What's New document gives the improvement just one sentence of mechanism description.
- HCL's exact wording: "the Notes installation program now installs deployed modules and places them in the file system, similar to the fast and robust installation methods already in use for the Mac client."
- **Math for large deployments**: 1,000 endpoints drops from ~17 hours to ~10 hours (using panagenda's numbers, assumes serial — parallel via SCCM/Intune shaves more).
- **Another 14.5.1 deployment improvement**: Windows finally supports **non-admin user install** — no local admin rights required.
- Full 14.5.1 (Domino 2026) feature overview in the [4/27 release highlights](/en/posts/hcl-domino-2026-release-highlights/).

---

## The numbers — both from panagenda, not HCL

Two independent numbers, both from **panagenda** (a major HCL partner, makers of the MarvelClient endpoint management tool), not HCL spec:

| Source | Number | Provenance |
|---|---|---|
| [panagenda Engage 2026 recap](https://www.panagenda.com/blog/engage-2026-in-ghent-coming-home-to-the-community/) | **61% faster, 24s vs 62s** | Cited around the Engage 2026 keynote, panagenda benchmark |
| [panagenda Notes 2026 sneak peek](https://www.panagenda.com/blog/hcl-notes-2026-sneak-peek/) | **38 seconds** | Author's "in my environment" test |

Neither discloses full methodology: endpoint specs, Windows version, antivirus exclusion settings, fresh install vs upgrade — none of it public.

**Why panagenda and not HCL?** Best guess: HCL prefers partners and the community do the speed claims (avoids endorsing any specific benchmark number, reduces legal exposure) and keeps its own docs to mechanism-level descriptions. That pattern is common in enterprise software.

→ **Bottom line**: Treat "61% faster" as a community-observed trend, not an HCL-promised performance SLA.

---

## What HCL actually says

The [14.5.1 What's New EA1 doc](https://help.hcl-software.com/notes/14.5.1/client/whats_new_notes_1451_ea1.html) gives the installer improvement one sentence:

> the Notes installation program now installs deployed modules and places them in the file system, similar to the fast and robust installation methods already in use for the Mac client

Unpacking it:

- "installs deployed modules and places them in the file system" — hints at a move **from the old Windows-specific install mechanism (likely InstallShield or similar self-extracting + heavy registry / COM registration) toward something closer to a file-copy model**.
- "similar to ... the Mac client" — the Mac client has always been a `.app` bundle copied into `/Applications`, essentially file copy + a small plist. Windows looks like it's moving in that direction.
- "fast and robust" — HCL is implicitly acknowledging the legacy Windows installer was **slow and fragile** (an industry-known pain point — the Notes installer was a recurring nightmare for SCCM mass deployment).

Reasonable speculation about the mechanism:

- Fewer Windows API calls (sidestepping MSI engine's transactional overhead)
- Fewer registry entries (file-centric)
- Friendlier to antivirus (copying files vs. writing registry + spawning sub-installers)

But **HCL doesn't spell any of this out** — no mention of parallel install, no diff between old and new mechanisms, no disclosure of the installer technology in use.

---

## Math for large deployments

Using panagenda's 24s vs 62s numbers, purely serial:

| Endpoints | 14.5.0 (62s each) | 14.5.1 (24s each) | Saved |
|---:|---:|---:|---:|
| 100 | ~103 min | ~40 min | ~63 min |
| 1,000 | ~17.2 hours | ~6.7 hours | ~10.5 hours |
| 5,000 | ~3.6 days | ~1.4 days | ~2.2 days |
| 10,000 | ~7.2 days | ~2.8 days | ~4.4 days |

**But nobody actually deploys serially** — SCCM, Intune, Workspace ONE all push in parallel. So the real saving isn't "total wall-clock time"; it's:

1. **Per-endpoint deployment window shrinks** — the user's "have to wait for install before logging in" goes from ~1 min to under half.
2. **Antivirus scan interference time halves** (Windows Defender is sensitive to installer behavior).
3. **Failed-retry cost drops** (each retry hurts less).
4. **CI/CD test cycles speed up** (repeatedly reinstalling in a Windows lab to test plugin compatibility, etc.).

Most felt by 100-1,000 endpoint customers; micro-deployments (single digits) won't notice.

---

## Bonus: 14.5.1 also ships non-admin Windows install

Another deployment-related improvement in the same release: **Windows finally lets you install the Notes client as a non-admin user**, without requiring local admin rights.

This matters more than it sounds for Zero Trust environments:

- More and more companies prohibit local admin on endpoints (compliance / attack-surface reasons).
- Previously, deploying Notes required either (a) temporarily granting admin to IT, or (b) pushing via SCCM/Intune running as SYSTEM.
- Now (a) is no longer needed — users can install themselves.
- (b) is still recommended for centralized deployment, but the fallback path is friendlier.

Same theme as the installer speedup (**14.5.1 made a coordinated push under "cleaner endpoint deployment"**) — worth grouping these two changes mentally.

---

## What's still unclear

HCL hasn't publicly disclosed:

- **Official benchmark + methodology** — their own measurements, endpoint specs, test scenarios.
- **What installer technology the new path uses** — MSI v5? Custom file copier? WiX-based?
- **Whether existing SCCM / Intune packages need to be rebuilt** — no breaking-change warning so far, but no explicit "100% backward compatible" statement either.
- **Whether antivirus exclusion recommendations changed** — old guidance was to exclude `notes.exe` and certain install temp folders; new path might relax that.

These will get answered as (a) HCL publishes follow-up admin blog posts and (b) deep-dive community testing from panagenda / [Daniel Nashed](https://blog.nashcom.de/) / David Hablewitz et al lands.

---

## Wrap-up

| What to say | What not to say |
|---|---|
| ✅ "Community benchmarks see 14.5.1 installing meaningfully faster; panagenda measured 61%" | ❌ "HCL's 14.5.1 is officially 61% faster" |
| ✅ "HCL documents the installer as more file-system based, like the Mac client" | ❌ "HCL turned the installer into a pure file copy" (HCL never said that — it's speculation) |
| ✅ "Per-endpoint deployment window shrinks meaningfully for large estates" | ❌ "Total deployment time dropped from 17 hours to 7 hours" (ignores parallel pushes) |

Worth testing in your own environment before quoting numbers to internal stakeholders. Full 14.5.1 (Domino 2026) feature overview lives in the [4/27 release highlights](/en/posts/hcl-domino-2026-release-highlights/).
