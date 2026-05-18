---
title: "Adding TC / SC / KO Language Packs to HCL Domino Container — A Community Tool I Built"
description: "The official HCL domino-container repo ships with only 6 Language Packs (DE/ES/FR/IT/NL/JA). Issue #55 has been open since 2022 asking about other languages, but nothing landed upstream. I wrote a small tool, domino-container-lp-recipe, that fills the gap — it uses a 'dynamic patch' approach rather than a fork, so one script call gets you Traditional Chinese (verified), Simplified Chinese (inferred), or Korean (template). The patch surface is small (~50 lines across 4 files), and the recipe drifts cheaply with upstream. This article covers the problem background, the three-layer LP integration, the recipe-vs-fork design decision, quickstart, adding new languages, and a sync-trap caveat you must read before rebuilding an already-running server."
pubDate: 2026-05-19T07:30:00+08:00
lang: en
slug: domino-container-lp-recipe
tags:
  - "Community"
  - "DevOps"
  - "Container"
sources:
  - title: "bryanHsiao/domino-container-lp-recipe — GitHub"
    url: "https://github.com/bryanHsiao/domino-container-lp-recipe"
  - title: "HCL-TECH-SOFTWARE/domino-container — Official upstream"
    url: "https://github.com/HCL-TECH-SOFTWARE/domino-container"
  - title: "Issue #55: Recommended approach to install language packs"
    url: "https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55"
relatedJava: []
relatedSsjs: []
---

## TL;DR

- The official [`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container) only ships with 6 Language Packs (DE / ES / FR / IT / NL / JA) — no Traditional Chinese, no Simplified Chinese, no Korean
- Upstream [Issue #55](https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55) asked "how do I install LPs with Domino on Docker?" back in 2022 — four years later, closed without implementation
- I wrote [`bryanHsiao/domino-container-lp-recipe`](https://github.com/bryanHsiao/domino-container-lp-recipe) to fill the gap. A small script that applies ~50 lines of patches to a clean upstream clone (not maintaining a fork), and then `./build.sh ... -domlp=TC` produces an image with the TC LP baked in
- Current status: **TC verified** (I built it myself; `names.nsf` view shows 「網域監督」), **SC inferred** (symmetric reasoning from TC, needs `--allow-inferred`), **KO template** (skeleton waiting on someone to fill in the installer code)
- ⚠️ **Important caveat**: rebuilding the image on an already-running server **does not retroactively translate existing `.nsf` files** — Domino's entrypoint detects "Data already installed" and skips template deployment. There's a section below specifically on this — read it before rebuilding production

## The problem: the story of Issue #55

In November 2022, someone opened [Issue #55](https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55) on the upstream repo asking:

> "What is the recommended approach to install language packs with Domino on Docker?"

Daniel Nashed (the upstream maintainer) replied with some workarounds — stop the container, spin up a temporary one, run `LNXDomLPxx` silent install. But the actual "add a new LP to `build.sh`" path **never shipped**.

In practice the need outside the original 6 (DE/ES/FR/IT/NL/JA) is common — anyone deploying Domino in Taiwan, mainland China, or Korea **almost always needs TC / SC / KO LPs**, and ends up hand-rolling the integration themselves.

Four years later the issue is still closed without implementation. I got stuck on this myself deploying, fixed it, then packaged it as a tool so others wouldn't have to do the same hack from scratch.

## The three-layer LP integration — why each language touches ~7 spots across 3 files

Adding a new LP to `build.sh` isn't just "add a menu item." Distilled from [how-it-works.md](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/how-it-works.md):

| Layer | File | Why it needs editing |
|---|---|---|
| **UI / menu** | `build.sh` | The LP submenu needs to list the new language so users can select it |
| **Install logic** | `dockerfiles/install_dir_domino/install_domino.sh` | Map the short code (TC) to the LP installer's internal code (`zh-TW`) |
| **Manifest** | `software/software.txt` + `dockerfiles/install_dir_common/software.txt` | Tell build.sh "this lang/version corresponds to which LP tar file" |

All three layers are **mandatory**:

- Skip the manifest → `Download for [domlp] [XX-VER] not found!`
- Skip the install_domino.sh mapping → `Cannot find LPLog.txt`
- Skip build.sh → the LP menu won't show the new language at all

Actual patch scope: `build.sh` 4 spots, `install_domino.sh` 1 spot, two `software.txt` files 1 spot each = **7 spots across 4 files**, about 50 lines. Each new language needs the same pattern applied.

## Why a Recipe and not a Fork

To "add something to an upstream repo," there are three technical paths:

| Approach | What it is |
|---|---|
| **Fork** | Maintain a mirror, commit patches on top |
| **Recipe** (this tool) | A small script that patches a fresh upstream clone on demand |
| **Patch series** | `git format-patch` files applied via `git am` |

Why I picked Recipe (full reasoning in [`docs/why-recipe-not-fork.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/why-recipe-not-fork.md)):

1. **The change is small** — ~50 lines across 4 files. Maintaining a fork that's 99% upstream code means 95% of the maintainer's time is just rebase noise
2. **Upstream moves fast** — Daniel Nashed pushes directly to main, commits frequently. A fork is forever chasing
3. **Separating "what we change" from "the rest of the codebase"** — Recipe makes the changes auditable and isolated

If upstream touches the lines I patch, the script **fails loudly**:

```
Error: expected 2 matches in build.sh, found 0
```

Follow [`upgrade-guide.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/upgrade-guide.md) to adjust the anchor string in `patch.py` — a small edit, not a fork-wide rebase. **No long-running fork drift**.

Comparison (excerpt):

| Aspect | Fork | Recipe |
|---|---|---|
| First-time use | `clone fork && build` | `clone recipe && apply && build` |
| Upstream changes file I don't patch | rebase noise | nothing |
| Upstream changes file I do patch | rebase + per-file merge conflict | update 1 anchor string |
| Repo size | inherits 600+ upstream commits | ~300 lines of code + docs |
| Maintainer busy for 3 months | fork silently drifts | recipe pinned to last tested commit, users get a warning |

For "upstream moves fast, change is small" — Recipe is the right abstraction.

## Quickstart (TC, verified)

```bash
# 1. Clone this recipe
git clone https://github.com/bryanHsiao/domino-container-lp-recipe.git ~/lp-recipe

# 2. Run apply-lp.sh
#    Auto-clones upstream domino-container, checks out the tested commit, patches it for TC
~/lp-recipe/apply-lp.sh --lang TC

# 3. Place the LP tar in /local/software/
#    (Download from HCL FlexNet; HCL software isn't redistributable, so it's not bundled here)

# 4. Build
cd /local/github/domino-container
./build.sh domino 14.5.1 -restapi=1.1.7 -leap=1.1.10 -domlp=TC

# 5. Verify
~/lp-recipe/verify.sh --lang TC
```

After this, re-launching `./build.sh menu` and pressing `L` shows `(TC) Traditional Chinese` as a 7th option alongside the original six — press `t` to select.

Currently verified combinations (from [`tested-against.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/tested-against.md)):

| Recipe ver | Upstream commit | Domino | Lang | OS | Container engine | Result |
|---|---|---|---|---|---|---|
| v0.1 | `4734801` | 14.5.1 | TC | Ubuntu 24.04.4 (WSL2) | Docker 29.4.3 | ✅ Build + fresh setup verified — `names.nsf` shows 「網域監督」 |

## Adding a new language (KO / SC / TH / etc.)

Full walkthrough at [`docs/adding-new-language.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/adding-new-language.md). Three steps:

```bash
# 1. Extract the LP tar, find the installer's internal code
tar -xf NotesDomLP-14050100-XX.tar
strings LNXDomLP | grep LangCodeList   # KO is "ko", for example

# 2. Add an entry to language_registry.py
# Language("KO", "Korean", "k", "ko", status="verified")

# 3. Apply + build
./apply-lp.sh --lang KO
./build.sh domino 14.5.1 -domlp=KO
```

Once it works, please send a PR back here promoting the language status from `template` / `inferred` to `verified` — others don't have to redo your work.

## ⚠️ Important caveat: the "Data already installed" sync trap

**Read this before rebuilding the image on a server that's already running.**

Full discussion in [`docs/sync-trap-caveat.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/sync-trap-caveat.md). Summary:

### Symptom

You successfully:

1. Ran the recipe to integrate TC (or another LP)
2. Rebuilt the image with `./build.sh ... -domlp=TC`
3. Confirmed the image contains TC resources (`verify.sh --lang TC` passes)
4. Restarted the production container with the new image

…but logging into the Notes client against the server **the UI is still English**:

- `names.nsf` People / Groups / Configuration views — English
- Existing `mail/*.nsf` files — English
- A newly created `testmail.nsf` from the server template — **also English**

### Root cause

Domino container's entrypoint checks `/local/notesdata` at startup. If it finds an existing installation, it **skips template deployment**:

```
Data already installed for 14050100
```

In other words: the image has the Traditional Chinese templates, but the entrypoint won't deploy them onto an existing `notesdata` directory.

### Fixes (pick one)

- **Fresh data dir + new OneTouch Setup** — wipe `/local/notesdata`, restart the container, let the entrypoint run template deployment
- **Manual Replace Design on every existing `.nsf`** — `load convert -u <dbpath> * <template>`, applied per database

Both need planning. This isn't "swap image, restart, done."

## Future: PR back to upstream

Two PR drafts are already in the repo ([`PR-DRAFT-tc.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/PR-DRAFT-tc.md) + [`PR-DRAFT-framework.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/PR-DRAFT-framework.md)) — ready to convert into `git format-patch` series + GitHub PRs when the upstream maintainer has bandwidth:

- **PR-DRAFT-tc** — integrate TC into upstream, close Issue #55, following the same pattern Daniel Nashed used when adding the original 6 LPs. Minimal change
- **PR-DRAFT-framework** — a larger refactor proposal: make the LP menu registry-driven so adding a new LP becomes a one-line addition to `language-packs.txt`, eliminating the 5-edits-across-3-files dance

Once a PR lands, the recipe retires. Until then, the recipe is the workaround that actually works today.

## Contributions welcome + closing

If you:

- **Need TC / SC / KO / another LP** — clone the repo and use it
- **Have SC / KO working and want to bump it to verified** — PR back, others benefit
- **Need to add a new language (TH / VI / etc.)** — follow [`adding-new-language.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/adding-new-language.md), PR the registry entry
- **Spot upstream changing a file we patch and the recipe stops working** — file an issue

Repo is Apache-2.0, same as upstream. This tool **contains no HCL software** — bring your own LP tars from HCL FlexNet under your own license.

In the four years Issue #55 has been open without an HCL implementation, every TC / SC / KO user has hand-rolled `build.sh` for themselves. Standardizing that hack — testable, shared, with the caveats spelled out — is what [`domino-container-lp-recipe`](https://github.com/bryanHsiao/domino-container-lp-recipe) is for.
