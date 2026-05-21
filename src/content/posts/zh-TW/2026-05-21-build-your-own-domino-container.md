---
title: "HCL Domino 容器化部署的兩條路 — 拉 pre-built image，或自己 build 客製版"
description: "HCL Domino 從 V12 起官方支援容器化部署、而且雙管齊下：要快上線可以從 HCL Harbor Container Registry (hclcr.io) 或 My HCLSoftware Portal 拉 pre-built image；要彈性可以用 HCL 在 GitHub 上開源的 domino-container 專案、跑互動式 build.sh menu 自己 build 客製 image，挑你要的模組（Domino / Traveler / Verse / Nomad / REST-API / Leap / Domino IQ / OnTime / C-API SDK / LP）+ add-on。這篇介紹兩條路怎麼選、build.sh 能客製到什麼程度、典型部署場景，跟想試試看的人怎麼起步。"
pubDate: 2026-05-21T07:30:00+08:00
lang: zh-TW
slug: build-your-own-domino-container
tags:
  - "Domino Server"
  - "DevOps"
  - "Container"
  - "News"
sources:
  - title: "HCL Harbor Container Registry"
    url: "https://hclcr.io"
  - title: "HCL Domino on Docker — official admin docs"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/inst_dock_load_tar_archive.html"
  - title: "HCL-TECH-SOFTWARE/domino-container — GitHub"
    url: "https://github.com/HCL-TECH-SOFTWARE/domino-container"
  - title: "Domino Container project documentation"
    url: "https://opensource.hcltechsw.com/domino-container/"
  - title: "My HCLSoftware Portal"
    url: "https://my.hcltechsw.com/"
relatedJava: []
relatedSsjs: []
cover: "/covers/build-your-own-domino-container.png"
coverStyle: "low-poly-3d"
---

## 重點摘要

- **Domino 從 V12 起官方支援容器化部署**，現在的旗艦版本是 Domino 14.5
- HCL 提供**兩條路**：
  - **(Path A)** 從 [HCL Harbor Container Registry](https://hclcr.io) 或 [My HCLSoftware Portal](https://my.hcltechsw.com/) 拉 pre-built image — 快、適合標準部署
  - **(Path B)** 用 GitHub 上的 [`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container) 自己 build — 彈性、適合要客製模組組合的場景
- Path B 的 `build.sh` 是**互動式 menu**：勾選要的模組（Domino / Traveler / Verse / Nomad / REST-API / Leap / Domino IQ / OnTime / C-API SDK / Language Pack）+ add-on（Prometheus、Borg Backup、nshmailx）→ 約 5-8 分鐘 build 出客製 image
- Base OS 預設 Red Hat Enterprise Linux 10 UBI；支援 Docker / Podman / Rancher Desktop / Kubernetes / OpenShift
- 典型場景：dev / lab、CI 自動化測試、production（搭 K8s）

---

## Domino on Container 是回事嗎？

「Domino 還只能裝在實體 server 上」這種印象其實已經過時。

從 HCL 接手後的 **Domino V12** 開始、官方就正式支援以 container 方式部署 Domino server。到今天的 **Domino 14.5** 這條路已經很成熟 —— 不少社群成員用容器跑開發環境、CI 測試、甚至 production（搭配 Kubernetes 或 OpenShift）。

要拿到 Domino container image 有兩條路：

**(A) Pull pre-built image** — HCL 在 [Harbor Container Registry (`hclcr.io`)](https://hclcr.io) 跟 [My HCLSoftware Portal](https://my.hcltechsw.com/) 都有提供 ready-to-go 的 image。用 My HCLSoftware Portal 帳號 `docker login hclcr.io`、然後 `docker pull` 就能拿到。這是最快上線的方式。

**(B) Build your own** — HCL 也把 build 用的 tooling 開源在 GitHub：[`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container)。clone 下來、跑互動式 `build.sh` menu、挑你要的模組組合、5-8 分鐘 build 出屬於自己的 custom image。

這篇之後的內容主要聚焦在 Path B —— 因為這條路是 Domino 容器世界真正的彈性所在。Path A 簡單到沒什麼好寫的（`docker pull` + `docker run`）；Path B 才有東西聊。

---

## 為什麼會想自己 build？

幾個面向：

**1. 客製化模組組合** — 不同情境要的模組天差地遠：

- 只跑 mail / app server → 純 Domino
- 要做 web client → Domino + Verse
- 要 mobile 推送 → Domino + Traveler + Nomad
- 要 modern app dev → Domino + REST-API + Leap
- 要 AI → Domino + Domino IQ

Pre-built image 通常是「典型組合」、模組顆粒度不見得完全對你的需求。自己 build 可以**精準到只裝你要的模組**、image 也小、攻擊面也小。

**2. Fixpack / Hotfix 流動性** — 你今天 build、今天的 hotfix 就在裡面。Pre-built image 的版本節奏跟 HCL 的 release cadence 綁、新 hotfix 出來到 registry 有對應 image 之間會有 lag；自己 build 等於 supply chain 在你手上。

**3. Base OS 跟 add-on 選擇** — 預設 base 是 Red Hat Enterprise Linux 10 UBI、想換 Ubuntu / Rocky 編 `build.cfg` 就行。想加 Prometheus exporter、Borg backup agent、自家公司 ISV 的 add-on，都接得進去。

**4. Language Pack 客製** — 內建支援 6 種 LP（DE / ES / FR / IT / NL / JA）、要加繁中 / 簡中 / 韓文得自己擴充 build flow。

→ 簡單講：**Path A 求快、Path B 求彈性**。需要精準客製模組、合規 + supply chain 透明、跟 hotfix 流動性對齊的場景 → Path B。

---

## build.sh 能客製到什麼程度

[`HCL-TECH-SOFTWARE/domino-container`](https://github.com/HCL-TECH-SOFTWARE/domino-container) clone 下來、跑 `./build.sh menu` 是這樣的互動式 menu：

![HCL Domino Container build.sh main menu](/domino-news/post-images/domino-container-buildsh-menu.png)

主選單可以勾的**產品**：

| 代號 | 模組 | 是什麼 |
|---|---|---|
| (D) | HCL Domino | Server 本體 |
| (O) | OnTime | 群組行事曆 |
| (V) | Verse | 現代化 mail web client |
| (T) | Traveler | 行動裝置同步（iOS / Android） |
| (N) | Nomad Server | Notes client on browser / mobile |
| (L) | Language Pack | 語言包（內建 DE / ES / FR / IT / NL / JA） |
| (R) | REST-API | Domino REST API |
| (A) | C-API SDK | 給 native add-in 開發者 |
| (P) | Domino Leap | low-code app builder |
| (J) | Domino IQ | 內建 LLM 跟 RAG（Domino 14.5 起） |

**Add-ons**：(M) Prometheus、(G) Borg Backup、(X) nshmailx —— 跑容器化監控 / 備份 / SMTP 出信的常見搭配。

**Base OS**：預設 Red Hat Enterprise Linux 10 UBI（無 license 成本的 universal base image）。可以改用其他 UBI / Ubuntu / Rocky base、編輯 `build.cfg` 即可。

**版本**：可以挑「最新」也可以指明 specific 版本 + Fixpack + Hotfix。

選完按 `B`（Build）、跑 5-8 分鐘出來就是這樣：

![docker images output showing hclcom/domino:14.5.1 image](/domino-news/post-images/domino-container-docker-images.png)

`hclcom/domino:14.5.1` — 約 3GB image、內含你剛剛勾的所有模組。

跑起來 `docker run` 一下、瀏覽器打 `localhost` 就看得到 Domino 登入頁：

![Domino login page accessed via browser at localhost](/domino-news/post-images/domino-container-login-page.png)

---

## 典型部署場景

**Dev / Lab —** 個人學習、ODP 開發、DQL 練習、跨版本相容性測試。WSL2 + Docker 很常見的搭配（Windows 工作者也能跑）。每次 build 一個乾淨環境、玩壞了砍掉重來。

**CI / 自動化測試 —** 每次 push 起一個全新 Domino 容器、跑完 unit test / integration test 就銷毀。比維護一個共用測試 server 乾淨得多。

**Production —** HCL 官方文件有 [K8s 跟 OpenShift 部署指引](https://opensource.hcltechsw.com/domino-container/)。Production 通常會搭 persistent volume、external NSF storage、Helm chart。

值得提一下：[Daniel Nashed](https://blog.nashcom.de/) — 這個專案的主要 community maintainer 之一 — 在他的 blog 上有很多 production-grade 容器化部署的實戰紀錄，搜「nashcom domino container」就找得到。

---

## 想自己玩玩看？

**Path A（最快）— Pull pre-built image**：

```bash
# 用 My HCLSoftware Portal 帳號 login HCL Harbor
docker login hclcr.io
# 拉 image（具體 image 名跟 tag 看 Harbor UI 上的 repo 清單）
docker pull hclcr.io/domino/domino-server:14.5.0
docker run -d --name domino -p 80:80 -p 1352:1352 hclcr.io/domino/domino-server:14.5.0
```

**Path B（彈性）— Build your own**：

需要的東西：

1. **My HCLSoftware Portal 帳號** — 有 Domino maintenance contract 就有；沒有的話可以申請 90-day trial。下載 Domino 14.5.x 的 Linux installer（`Domino_14.5.x_Linux_English.tar`）。
2. **Docker / Podman** — Docker Desktop（macOS / Windows）、Docker Engine（Linux）、或 Podman 都行。
3. **磁碟空間 ~10GB** — 安裝包 + base image + final image
4. **約 1 小時** — 第一次跑會花在搞清楚目錄結構跟下載安裝包；第二次熟了 build 一輪 < 10 分鐘

大致流程：

```bash
git clone https://github.com/HCL-TECH-SOFTWARE/domino-container.git
cd domino-container
# 把下載的 installer 放到 software/ 目錄（路徑要對）
./build.sh menu
# → 互動式 menu 勾你要的模組 → B → build
docker images   # 看到 hclcom/domino:14.5.x 就成功
```

兩條路的完整文件：[HCL 官方 Domino on Docker docs](https://help.hcl-software.com/domino/14.5.0/admin/inst_dock_load_tar_archive.html) 跟 [domino-container repo README](https://github.com/HCL-TECH-SOFTWARE/domino-container)。

---

## ⚠️ Self-build 上路前要知道的幾件事（簡短版）

- **安裝包路徑** `build.sh` 只認特定資料夾、不是想丟哪裡都行
- **Bind mount** 跑起來後、host 跟 container 的 UID 要對齊、不然 Domino 起不來（會看到一堆 `permission denied`）
- **OneTouch Setup** 第二次跑要先清 mount、不然 setup script 會跳過直接進 vi 編輯模式
- **build.sh 會偷拉一個 `nginx` image** 當 internal helper（上面 `docker images` 截圖裡那個 240MB 的就是它）、不是你的 Domino 進 production 要用的 reverse proxy

這幾條 HCL docs 沒有特別強調、第一次跑很容易卡。社群有人寫了完整 SOP（包含 WSL2 平台特化）、可以搜「HCL domino container WSL2」找看看。

---

## 想加繁中 / 其他亞洲語言 Language Pack？

`build.sh` menu 的 (L) Language Pack 內建支援 6 種：DE / ES / FR / IT / NL / JA — 不包含繁中、簡中、韓文。

要加繁中，可以看上一篇介紹的社群工具 [`domino-container-lp-recipe`](/posts/domino-container-lp-recipe/) — 用「動態修補上游 clone」的方式（不是維護 fork）、跑一個腳本就能讓 `build.sh` 多認得 `-domlp=TC`。同時提供 SC / KO 的擴充範本給有對應需求的社群成員當起點。

這條路目前只走 Path B（self-build）— Pre-built image 不含這些 LP、要繁中就一定得自己 build。

---

## 小結

Container 化是 Domino 現代化部署的一條主要路線、HCL 雙管齊下：要快上線的拉 [`hclcr.io`](https://hclcr.io) pre-built image、要客製的用 [open-source build script](https://github.com/HCL-TECH-SOFTWARE/domino-container) 自己 build。

對 Domino admin / dev 來說：

- 一般 dev / lab 跟標準 production → 直接 pull pre-built、最快上線
- 要精準客製模組、合規 + supply chain 嚴格、加新 LP、跟 hotfix 流動性對齊 → self-build

10GB 空間、HCL 帳號、Docker — 兩條路各摸過一次就會知道哪條適合你的場景。
