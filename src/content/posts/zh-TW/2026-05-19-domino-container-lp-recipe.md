---
title: "HCL Domino Container 加上繁中／簡中／韓文 LP — 我寫的一個社群工具"
description: "HCL 官方 domino-container repo 內建支援 6 種 Language Pack（DE/ES/FR/IT/NL/JA）。Issue #55 討論過怎麼裝其他 LP，但官方基於「真要加就要承擔所有語言的維護責任」的考量沒把更多 LP 收進 build.sh — 是合理的工程取捨。我寫了一個小工具 domino-container-lp-recipe 讓有需要的人自己擴充：用「動態修補」而不是「fork」的方式，跑一個腳本就能加進繁中（已驗證）、簡中（推論）、韓文（範本待補），結構小（~50 行 patch 跨 4 個檔）、跟著上游漂移成本低。本文整理上游考量、三層整合、recipe-vs-fork 設計選擇、快速開始、加新語言流程、跟一個一定要先讀的 sync-trap 警告。"
pubDate: 2026-05-19T07:30:00+08:00
lang: zh-TW
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
coverStyle: "ukiyo-e"
---

## 重點摘要

- HCL 官方 [`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container) 內建支援 6 種 LP（DE / ES / FR / IT / NL / JA）
- 上游 [Issue #55](https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55) 討論過怎麼裝其他 LP；官方基於「要加就要承擔所有語言維護責任」的考量沒把更多 LP 收進 `build.sh`、這個取捨是合理的
- 我寫了 [`bryanHsiao/domino-container-lp-recipe`](https://github.com/bryanHsiao/domino-container-lp-recipe) 讓**有需要的人自己擴充**：一個小腳本、套用 ~50 行修補到上游 clone（不是維護 fork），就能跑 `./build.sh ... -domlp=TC` 蓋出含繁中 LP 的 image
- 目前 **TC verified**（我本人 build 過、`names.nsf` view 顯示「網域監督」）、**SC inferred**（從 TC 對稱推論、需 `--allow-inferred`）、**KO template**（範本待人補 installer code）
- ⚠️ **重要警告**：對已運行的 server 重 build image 後、既有 `.nsf` **不會自動變繁中**（Domino entrypoint 偵測「Data already installed」會 skip template 部署）—— 重 build 之前一定要讀後面那節

## 背景：Issue #55 上游的考量

2022 年 11 月有人在上游 repo 開 [Issue #55](https://github.com/HCL-TECH-SOFTWARE/domino-container/issues/55) 問怎麼裝 LP。上游 maintainer Daniel Nashed 回了一些 workaround 思路（stop container、起 temp container 跑 LNXDomLPxx silent install），並在後續討論中點出維護擴大的考量：

> "The right way would be to add it to the software file, but then we would need to support all the languages..."

—— 意思是：真要在 `build.sh` 加新 LP、官方就要承擔「所有語言、所有版本」的維護責任。對一個個人維護的開源 repo 來說、那是合理的工程取捨。

但實務上 6 LP 之外的需求依然存在 —— 在台灣、中國、韓國 deploy Domino 通常會要繁中／簡中／韓文 LP，每個 deploy 工程師各自 hack `build.sh` 重複勞動。我自己 deploy 用到、把那段 hack 整理成共用工具、讓有相同需求的人不用每次重來，也希望有其他語言需求的社群伙伴**有起點可以擴充、跑通後貢獻回來**。

## 三層整合 — 為什麼每個 LP 要動 ~7 處跨 3 個檔

`build.sh` 加新 LP 不是「加一個 menu item」這麼簡單。從 [how-it-works.md](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/how-it-works.md) 整理：

| 層 | 檔案 | 為什麼要動 |
|---|---|---|
| **UI / menu** | `build.sh` | LP submenu 要列出新語言、user 才選得到 |
| **Install 邏輯** | `dockerfiles/install_dir_domino/install_domino.sh` | 短碼（TC）對應到 LP installer 內部碼（`zh-TW`）的 mapping |
| **Manifest** | `software/software.txt` + `dockerfiles/install_dir_common/software.txt` | 告訴 build.sh「這個 lang/version 對應哪個 LP tar 檔」 |

三層**缺一不可**：

- 漏 manifest → `Download for [domlp] [XX-VER] not found!`
- 漏 install_domino.sh mapping → `Cannot find LPLog.txt`
- 漏 build.sh → LP menu 根本看不到新語言

實際 patch 範圍：`build.sh` 4 處、`install_domino.sh` 1 處、兩份 `software.txt` 各 1 處 = **7 處跨 4 檔**、約 50 行。每加一個語言都要照這個 pattern 動一次。

## 為什麼用 Recipe 而非 Fork

要對上游 repo「加點東西」、技術上有三條路：

| 方法 | 怎麼做 |
|---|---|
| **Fork** | 維護一份 mirror、把 patch 直接 commit 上去 |
| **Recipe**（本工具走的）| 一支腳本、按需對乾淨的上游 clone 套用 patch |
| **Patch series** | 用 `git format-patch` 包裝、`git am` 套用 |

我選 Recipe 的理由（詳見 [`docs/why-recipe-not-fork.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/why-recipe-not-fork.md)）：

1. **改動很小** — ~50 行跨 4 檔。維護一個 99% 都是上游 code 的 fork、95% 的時間在處理 rebase noise
2. **上游動很快** — Daniel Nashed 直接 push to main、commit 頻繁。fork 永遠在追上游
3. **改動跟整份 codebase 是兩件事** — Recipe 的設計把「我改了什麼」跟「上游是什麼」徹底分開、可讀可審

上游萬一改到我們 patch 的位置、腳本會**明確噴錯**：

```
Error: expected 2 matches in build.sh, found 0
```

照 [`upgrade-guide.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/upgrade-guide.md) 微調 `patch.py` 裡的 anchor 字串就好。**沒有長期 fork drift**。

對比表（節錄）：

| 面向 | Fork | Recipe |
|---|---|---|
| 初次使用 | `clone fork && build` | `clone recipe && apply && build` |
| 上游改了我沒 patch 的檔 | rebase noise | 完全無影響 |
| 上游改到我有 patch 的檔 | rebase + per-file merge | 改 1 個 anchor 字串 |
| Repo 大小 | 繼承 600+ 上游 commit | ~300 行 code + docs |
| 我 3 個月不更新 | fork silently drift | recipe pin 在測試過的 commit、跑起來會 warn |

對「上游動很快、改動很小」的場景、Recipe 是對的抽象。

## 快速開始（TC、已驗證）

```bash
# 1. clone 本工具
git clone https://github.com/bryanHsiao/domino-container-lp-recipe.git ~/lp-recipe

# 2. 跑 apply-lp.sh
#    自動 clone 上游 domino-container、checkout 到測試過的 commit、對 TC 套用 patch
~/lp-recipe/apply-lp.sh --lang TC

# 3. 把 LP tar 檔放到 /local/software/
#    （從 HCL FlexNet 下載；HCL 軟體不能重新散布，所以不在本 repo 內）

# 4. Build
cd /local/github/domino-container
./build.sh domino 14.5.1 -restapi=1.1.7 -leap=1.1.10 -domlp=TC

# 5. 驗證
~/lp-recipe/verify.sh --lang TC
```

跑完之後重進 `./build.sh menu` 按 `L`、LP submenu 會在原本 6 種之後多出第 7 個 `(TC) Traditional Chinese`、按 `t` 即可選用：

![套用 recipe 後的 build.sh Language Pack submenu，(TC) Traditional Chinese 為新加的第 7 個選項](/domino-news/post-images/domino-container-lp-menu-with-tc.png)

目前驗證過的組合（從 [`tested-against.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/tested-against.md)）：

| Recipe ver | 上游 commit | Domino | Lang | OS | Container engine | 結果 |
|---|---|---|---|---|---|---|
| v0.1 | `4734801` | 14.5.1 | TC | Ubuntu 24.04.4 (WSL2) | Docker 29.4.3 | ✅ Build + fresh-setup verified — `names.nsf` 顯示「網域監督」 |

## 加新語言（KO / SC / TH 等）

完整流程在 [`docs/adding-new-language.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/adding-new-language.md)，三步：

```bash
# 1. 解壓 LP tar、找該語言的 installer 內部碼
tar -xf NotesDomLP-14050100-XX.tar
strings LNXDomLP | grep LangCodeList   # 例如 KO 是 "ko"

# 2. 在 language_registry.py 加 entry
# Language("KO", "Korean", "k", "ko", status="verified")

# 3. apply + build
./apply-lp.sh --lang KO
./build.sh domino 14.5.1 -domlp=KO
```

通了之後請發 PR 回來、把該語言的 status 從 `template` / `inferred` 升到 `verified`、其他人就不用重做一次。

## ⚠️ 重要警告：「Data already installed」同步陷阱

**這節是已 deploy 的 server 重 build 之前一定要讀的。**

完整討論見 [`docs/sync-trap-caveat.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/sync-trap-caveat.md)，這裡摘要：

### 症狀

你完成這些步驟：

1. 跑 recipe 整合 TC（或其他 LP）
2. `./build.sh ... -domlp=TC` 重 build image
3. `verify.sh --lang TC` 通過、image 確實有 TC resources
4. 把 production container 重啟成新 image

…但登入 Notes client 進 server **UI 還是英文**：

- `names.nsf` 的 People / Groups / Configuration view —— 英文
- 既有 `mail/*.nsf` —— 英文
- 新建一個 `testmail.nsf`（套 server template）—— **也是英文**

### 根本原因

Domino container 的 entrypoint 啟動時檢查 `/local/notesdata`、發現裡面已有安裝就**跳過 template 部署**：

```
Data already installed for 14050100
```

換句話說 —— image 裡有繁中 template、但 entrypoint 不會把它部署到既有 `notesdata` 上。

### 解法（任選一）

- **fresh data dir + 重做 OneTouch Setup** — 把 `/local/notesdata` 清空、重起 container、讓 entrypoint 跑 template 部署
- **對每個既有 `.nsf` 手動 Replace Design** — `load convert -u <dbpath> * <template>`、針對每個 db 套新 template

兩種都要 plan、不是換個 image 重啟那麼簡單。

## 邀請貢獻 + 結論

這個工具是寫給「有 LP 需求、想自己擴充」的社群伙伴用的。如果你：

- **用得到繁中 / 簡中 / 韓文** — 直接 clone repo 用
- **跑通 SC / KO 想升 verified status** — 發 PR 回來、把 status 從 `template` / `inferred` 升到 `verified`、讓其他人少踩一次坑
- **要加新語言（TH / VI / 越南文等）** — 照 [`adding-new-language.md`](https://github.com/bryanHsiao/domino-container-lp-recipe/blob/main/docs/adding-new-language.md) 做、PR 進 registry
- **看到上游 commit 改到我們 patch 位置、recipe 跑壞** — 報 issue 我修

Repo 用 Apache-2.0、跟上游一致。本工具**不含任何 HCL 軟體**、LP tar 你自己從 HCL FlexNet 下載。

繁中／簡中／韓文（以及其他語言）的 Domino 部署社群一直存在 —— 把各自 hack `build.sh` 的經驗標準化、共用、有測試、有警告，是 [`domino-container-lp-recipe`](https://github.com/bryanHsiao/domino-container-lp-recipe) 想做的事。
