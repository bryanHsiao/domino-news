---
title: "Notes 14.5.1 部署變快：panagenda benchmark vs HCL 官方一句話解釋"
description: "Engage 2026 期間 panagenda 公布的 benchmark：Notes 14.5.1 安裝速度比 14.5.0 快 61%（每 endpoint 從 62s → 24s）。panagenda 個人 blog 另測出 38s。但 HCL 官方 What's New 文件對這個改善只給了一句話：「now installs deployed modules and places them in the file system, similar to the fast and robust installation methods already in use for the Mac client」— 沒提自家 benchmark、沒講機制細節。本文對齊兩邊資料、做大規模部署的時間數學、附帶提一下同版本另一個部署相關改善「non-admin Windows install」、以及目前 HCL 還沒公開的幾項細節。"
pubDate: 2026-05-24T07:30:00+08:00
lang: zh-TW
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

## 重點摘要

- **panagenda 在 Engage 2026 recap 引述的數字**：Notes 14.5.1 安裝比 14.5.0 **快 61%**、每 endpoint 從 **62s → 24s**
- **同 panagenda 個人 blog 另測**：「在我的環境 38 秒」
- **這不是 HCL 官方 benchmark** — HCL 自己沒公布速度數字、What's New 文件只給了一句話的機制描述
- HCL 一句話原文：「the Notes installation program now installs deployed modules and places them in the file system, similar to the fast and robust installation methods already in use for the Mac client」
- **大規模部署的數學**：1000 endpoint 從 ~17 小時 → ~10 小時（依 panagenda 數字推算、實際走 SCCM/Intune 並行會更短）
- **同版本另一個部署改善**：Windows 終於支援 **non-admin user install** — 不用 local admin 權限
- 完整 14.5.1（Domino 2026）功能介紹見 [4/27 release highlights](/posts/hcl-domino-2026-release-highlights/)

---

## 數字長什麼樣 — 都是 panagenda、不是 HCL

兩個獨立數字、來源都是 **panagenda**（HCL 主要 partner、自家做 Notes endpoint 管理工具 MarvelClient）、不是 HCL 官方 spec：

| 來源 | 數字 | 性質 |
|---|---|---|
| [panagenda Engage 2026 recap](https://www.panagenda.com/blog/engage-2026-in-ghent-coming-home-to-the-community/) | **61% 快、24s vs 62s** | 引述 Engage 2026 keynote 時提到、panagenda benchmark 數字 |
| [panagenda Notes 2026 sneak peek](https://www.panagenda.com/blog/hcl-notes-2026-sneak-peek/) | **38 秒** | 作者「在我的環境」測試 |

兩個都沒 disclose 完整 methodology：endpoint 規格、Windows 版本、AV exclusion 設定、是 fresh install 還是 upgrade — 都未公開。

**為什麼 panagenda 講而不是 HCL 講？** 推測：HCL 偏好讓 partner 跟社群測試後發聲（不背書任何特定 benchmark 數字、減少法律風險）、自己只在官方 doc 裡描述機制改變。這在企業 software 圈很常見。

→ **結論**：「61% 快」當「community 觀察到的趨勢」報、不要當「HCL 官方承諾的效能 SLA」用。

---

## HCL 官方怎麼解釋

[14.5.1 What's New EA1 文件](https://help.hcl-software.com/notes/14.5.1/client/whats_new_notes_1451_ea1.html) 對 installer 改善只給一句話：

> the Notes installation program now installs deployed modules and places them in the file system, similar to the fast and robust installation methods already in use for the Mac client

拆解這句話：

- 「installs deployed modules and places them in the file system」 — 暗示**從舊的 Windows-specific 安裝機制（很可能是 InstallShield 或類似 self-extracting + 大量 registry / COM 註冊）改成更接近檔案複製的模式**
- 「similar to ... the Mac client」 — Mac 版本一直以來都是 .app bundle 直接複製到 /Applications、本質上是 file copy + 少量 plist。Windows 看來在向這個方向靠
- 「fast and robust」 — HCL 認知到 Windows installer 過去**慢且脆弱**（這是業界公認的、Notes 安裝程式在 SCCM mass deploy 一直是 nightmare）

合理推測機制改變：
- 較少 Windows API call（避開 MSI engine 的 transactional overhead）
- 較少 registry entry（檔案本位）
- 對 AV 比較友善（複製檔案 vs 寫 registry + 啟動 sub-installer）

但 **HCL 沒明講**這些細節 — 沒提 parallel install、沒列出新舊 mechanism 差異、沒公布 installer technology 換成什麼。

---

## 對 large deployment 的時間數學

依 panagenda 的 24s vs 62s 數字、純序列部署的話：

| Endpoint 數 | 14.5.0（62s/台）| 14.5.1（24s/台）| 節省 |
|---:|---:|---:|---:|
| 100 | ~103 分 | ~40 分 | ~63 分 |
| 1,000 | ~17.2 小時 | ~6.7 小時 | ~10.5 小時 |
| 5,000 | ~3.6 天 | ~1.4 天 | ~2.2 天 |
| 10,000 | ~7.2 天 | ~2.8 天 | ~4.4 天 |

**但實務上沒人序列部署** — SCCM、Intune、Workspace ONE 都會 parallel 推。所以真正的 saving 不是「總時間」、是：

1. **每台 endpoint 的部署 window 縮短**：使用者「裝完才能登入」的等待從 1 分鐘 → 半分鐘以下
2. **AV / antivirus scan 受 install 干擾的時間減半**（Windows Defender 對 installer 行為敏感）
3. **失敗 retry 成本降低**（每次失敗 retry 比較不痛）
4. **CI/CD test cycle 加速**（在 Windows lab 重複裝來測 plugin 相容性等）

對 100-1000 endpoint 規模的客戶感受最明顯；微型部署（個位數）感受不到差異。

---

## Bonus：14.5.1 還有 non-admin Windows install

同版本另一個跟部署相關的改善：**Windows 終於可以**用 **non-admin user 身份安裝 Notes client**、不用 local admin 權限。

這對 Zero Trust 走向的企業很重要：

- 越來越多公司禁止 endpoint 給 local admin（合規 / 攻擊面控制）
- 過去要部署 Notes 必須要：(a) 暫時開 admin 權限給 IT、(b) 用 SCCM/Intune 走 SYSTEM 帳號裝
- 現在 (a) 不用了、user 自己就裝得起來
- (b) 還是建議走集中部署、但失敗 fallback 變友善

跟 installer speedup 是同主題（**14.5.1 在「能更乾淨部署到 endpoint」這條主題下做了一連串改善**）、值得放在一起認知。

---

## 還沒問清楚的

HCL 目前沒公開：

- **官方 benchmark + methodology** — 自家測的數字、endpoint spec、test scenario
- **新 installer 換成什麼 technology** — MSI v5? Custom file-copier? WiX-based?
- **舊 SCCM / Intune package 是否要重做** — 還沒看到 breaking change 警告、但也沒明確說「100% backward compat」
- **AV exclusion 建議是否變動** — 舊版要 exclude `notes.exe` 跟某些 install temp folders、新版可能可以放寬

這幾項要等：(a) HCL 後續發 admin blog post、(b) panagenda / [Daniel Nashed](https://blog.nashcom.de/) / Hablewitz 等社群人物深度測試文章出爐。

---

## 小結

| 怎麼說 | 怎麼別說 |
|---|---|
| ✅「community benchmark 看到 14.5.1 安裝快很多、panagenda 量到 61%」 | ❌「HCL 14.5.1 官方提速 61%」 |
| ✅「HCL 在文件說 installer 改成像 Mac 那樣以 file system 為主」 | ❌「HCL 把 installer 改成純檔案複製」（HCL 沒這樣說、是推測）|
| ✅「對 large deployment 的部署 window 縮短有感」 | ❌「總部署時間從 17 小時降到 7 小時」（忽略了並行）|

值得在你自己環境測一次再決定怎麼跟內部 stakeholder 講。完整 14.5.1（Domino 2026）功能介紹見 [4/27 的 release highlights](/posts/hcl-domino-2026-release-highlights/)。
