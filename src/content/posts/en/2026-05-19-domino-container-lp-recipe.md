---
title: "domino-container-lp-recipe — A Community Tool for Adding the Traditional Chinese Language Pack to HCL Domino Container (with templates for additional languages)"
description: "The official HCL domino-container repo ships with 6 Language Packs (DE/ES/FR/IT/NL/JA). Issue #55 discussed how to install other LPs; the maintainer's position was that adding more LPs to build.sh would mean owning maintenance for every language — a reasonable engineering call for a personally-maintained open source repo. The community tool domino-container-lp-recipe fills that extension path: a 'dynamic patch' approach (not a fork) that ships an end-to-end verified Traditional Chinese (TC) patch, plus Simplified Chinese (SC) and Korean (KO) entries in language_registry.py as templates for the community to verify and extend. The patch surface is small (~50 lines across 4 files), and the recipe drifts cheaply with upstream. This article walks through the tool's background, the three-layer LP integration, the recipe-vs-fork design decision, quickstart, adding new languages, and a sync-trap caveat you must read before rebuilding an already-running server."
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
cover: "/covers/domino-container-lp-recipe.png"
coverStyle: "low-poly-3d"
---

## TL;DR

- The official [`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container) ships with 6 Language Packs (DE / ES / FR / IT / NL / JA)
- Upstream [Issue #55](https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55) discussed how to install other LPs; the maintainer's position is that adding more LPs to `build.sh` would mean owning maintenance for every language — a reasonable engineering call
- The community tool [`bryanHsiao/domino-container-lp-recipe`](https://github.com/bryanHsiao/domino-container-lp-recipe) **only ships Traditional Chinese (TC) as a verified, end-to-end build**: a small script that applies ~50 lines of patches to a clean upstream clone (not maintaining a fork), then `./build.sh ... -domlp=TC` produces an image with the TC LP baked in
- **SC and KO are not supported — they are templates in `language_registry.py`** for the community to extend. SC is inferred symmetrically from TC and requires the `--allow-inferred` flag (not tested in practice); KO is an empty skeleton waiting for someone to fill in the installer code. They exist as reference entries to give people with those language needs a starting point; if you get them working, please PR back to promote the status
- ⚠️ **Important caveat**: rebuilding the image on an already-running server **does not retroactively translate existing `.nsf` files** — Domino's entrypoint detects "Data already installed" and skips template deployment. There's a section below specifically on this — read it before rebuilding production

## Background: upstream's position on Issue #55

In November 2022, someone opened [Issue #55](https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55) on the upstream repo asking how to install LPs. Daniel Nashed (the upstream maintainer) replied with workarounds — stop the container, spin up a temporary one, run `LNXDomLPxx` silent install — and in follow-up discussion made the maintenance scope explicit:

> "The right way would be to add it to the software file, but then we would need to support all the languages..."

In other words: actually wiring new LPs into `build.sh` would mean owning "all languages, all versions" as ongoing maintenance. For a personally-maintained open-source repo, that's a reasonable engineering call.

But the need for LPs outside the original 6 doesn't disappear — anyone deploying Domino in Taiwan, mainland China, or Korea typically wants TC / SC / KO, and ends up hand-rolling the integration themselves. `domino-container-lp-recipe` standardizes the **Traditional Chinese** hack into a shared, repeatable, tested tool, and leaves the extension pattern in `language_registry.py` (with SC / KO entries as reference templates) so people with other language needs **have a starting point to extend and contribute back**.

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

After this, re-launching `./build.sh menu` and pressing `L` shows `(TC) Traditional Chinese` as a 7th option alongside the original six — press `t` to select:

![build.sh Language Pack submenu after applying the recipe — (TC) Traditional Chinese added as a 7th option](/domino-news/post-images/domino-container-lp-menu-with-tc.png)

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

## Contributions welcome + closing

This tool is for community folks who **need an LP and want to extend it themselves**. Routing by what's actually delivered today:

- **Need Traditional Chinese** — clone the repo, run `apply-lp.sh --lang TC`. This is the end-to-end verified path
- **Want to try Simplified Chinese** — the SC entry exists in the registry (inferred symmetrically from TC as `zh-CN`), use the `--allow-inferred` flag. **Treat your own end-to-end build as the source of truth.** If it works, PR back to promote the status from `inferred` to `verified`
- **Want to try Korean** — KO is an empty skeleton. Extract the LP tar, run `strings LNXDomLP | grep LangCodeList` to find the installer code, fill it into the registry. Walkthrough in [`adding-new-language.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/adding-new-language.md)
- **Need to add a brand new language (TH / VI / etc.)** — same `adding-new-language.md` flow, PR the registry entry
- **Spot upstream changing a file we patch and the recipe breaks** — file an issue

Repo is Apache-2.0, same as upstream. This tool **contains no HCL software** — bring your own LP tars from HCL FlexNet under your own license.

The community that needs Traditional Chinese (and other LPs) for Domino deployment has always existed — standardizing the TC hack into something tested, shared, and with the caveats spelled out, plus leaving extension templates for other languages, is what [`domino-container-lp-recipe`](https://github.com/bryanHsiao/domino-container-lp-recipe) is for. Verified status for SC / KO and others accumulates only when community contributors plug actual LP tars in and PR back.
