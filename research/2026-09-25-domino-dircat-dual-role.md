---
slug: domino-dircat-dual-role
title: "dircat 雙重身份:directory catalog 本業 + entitlement 稽核兼差"
lang: [zh-TW, en]
pubDate: 2026-09-25
status: staged（_pending，排 2026-09-25；接 9/24 admin-server-identity）
tags: [Domino Server, Admin]
requester: 使用者（問「dircat 暗地做稽核可以接著寫嗎」→ 我校正框架為「雙重身份」後同意）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。所有 HCL 引用逐字正確、condensed/extended 模板正確、CATALOG.NTF 區別正確、「since Domino 12」時間點確認、推測有 hedge。4 nit/minor：①zh 把「combines」引成「combine」→ 已修引全 -s；②標題「稽核/Auditing」比官方「tracking」略強——保留（使用者核准框架、內文講清 licensing compliance、非泛稱 audit）；③「licensing compliance」是對「highest access level」的合理轉述、非官方逐字——保留；④console 字串/entitlementtrack.ncf/5 秒 = LDAT05 實測、交叉連 9/24、未掛官方——保留。無 BLOCKER。
created: 2026-09-25
updated: 2026-09-25
---

# 研究軌跡 — domino-dircat-dual-role

概念/reference 型。承 [[domino-admin-server-identity]]（9/24，entitlement 聚合會咬人的故事在那篇）。

## 角度決策 + 框架校正

- 使用者原話「dircat 暗地裡做稽核」。查證後校正：**dircat 本業是建 Directory Catalog（通訊錄目錄），不是稽核**；「稽核」是它 Domino 12 起兼的第二份差（entitlement 聚合）。
- 定案角度：**「dircat 的雙重身份」**——本業（directory catalog：condensed/extended）+ 隱藏第二身份（entitlement 授權合規聚合）。保留使用者要的「暗地做稽核」驚訝感，但不誤導成「dircat=稽核工具」。呼應 [[feedback_no_vague_community_consensus]]（別把框架當事實、先對官方）。
- 與 9/24 分工：本篇重心是 **directory catalog 本業（全新內容）**；entitlement 會咬人那段交叉連 9/24、不重講。coverage 查過（grep dircat/directory catalog/entitlement，站上無專篇；grep 內文非只檔名，呼應 [[feedback_coverage_check_not_filename_glob]]）。

## 官方引用（第一手 WebFetch 逐字）

- **Directory catalogs**（[10.0.1 官方](https://help.hcl-software.com/domino/10.0.1/admin/conf_directorycatalogs_c.html)）：
  - 定義「A directory catalog is an optional directory database that typically contains information aggregated from multiple Domino directories.」
  - 用途「look up mail addresses and other information about the people, groups, mail-in databases, and resources throughout an organization」
  - condensed = `DIRCAT5.NTF`（client）；extended = `PUBNAMES.NTF`（同 Domino Directory 模板、server、「faster and more flexible directory lookups」）
  - dircat：build / update（「checks for changes... makes the appropriate changes」）/ partial / full rebuild
- **Condensed directory catalog**（[12.0.0 官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_settingupacondenseddirectorycatalog_c.html)）：
  - 警告「DO NOT select the Catalog (V6) template (CATALOG.NTF)」→ CATALOG.NTF 是資料庫編目、不同東西
  - 「combine multiple documents from Domino directories into single documents」、350,000 users/3GB → ~50MB
  - 「Using a condensed directory catalog on a server is no longer supported」
- **Entitlement tracking**（[14.0 官方](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html)）：「The directory catalog task manages the synchronization process」→ entitlements.nsf on domain admin server（9/24 已驗，沿用）。

## 誠實標示

- 「為什麼把 entitlement 塞給 dircat」用「大概/probably」明確標為**推測**，非官方。
- entitlement = 授權/entitlement 合規追蹤（每 user 最高存取層級供 HCL 授權用），非泛稱「audit 系統」；標題用「授權稽核」是通俗簡稱、內文講清是 licensing compliance。

## 交叉連

- 內部：[[domino-admin-server-identity]]（entitlement 聚合會咬人的完整故事）、[[domino-console-troubleshooting]]（show tasks 看 dircat）。

## 查證 checklist

- [x] directory catalog 定義/用途/condensed vs extended/模板 逐字對照官方
- [x] DIRCAT5.NTF vs CATALOG.NTF 警告、350k→50MB、server 不支援 逐字
- [x] entitlement 第二身份「directory catalog task manages the synchronization process」逐字（承 9/24）
- [x] 「為什麼塞給 dircat」標為推測
- [x] TYPE 留白（概念/reference）；tags Domino Server + Admin
- [x] inline-link diversity：3 相異外部（directory catalogs / condensed / entitlement）+ 內部 2 連
- [ ] 雙語 temp-build
- [ ] humanizer-zh-tw
- [ ] independent fact-check subagent（跑中）

## 異動日誌

- 2026-09-25 使用者提題→校正框架為「雙重身份」；WebFetch 驗 directory catalog 2 頁 + 沿用 entitlement；雙語成稿（本業為主、第二身份 hook、交叉連 9/24）；temp-build；sidecar；stage _pending 排 9/25。（Opus 4.8）
