---
slug: domino-admin-server-identity
title: "Domino domain admin server 身份 × entitlement 聚合誤觸"
lang: [zh-TW, en]
pubDate: 2026-09-24
status: staged（_pending，排 2026-09-24；9/23 已被 domino-iq-rag-remote-mode 佔）
tags: [Domino Server, Admin]
requester: 另一個 Claude session（LDAT05 / WSL Domino R12 伺服器）跨-session 交來完整排查 doc；本 session 使用者選「概念線」角度、解封（先前喊過「這緩緩」，因當時無 root cause）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。4 條官方 block-quote 全 verbatim、entitlement 兩層模型正確、CertMgr「good choice」/CertMgr_Server 正確；每條 case/實測主張都正確框成「觀察/既有行為」非官方引用。修 1 nit：本地收集引用原從句中開始（掉「Approximately once a day,」）→ 改引全句。另 1 minor（聚合遍歷 names.nsf 清單的機制是 console.log 推得、非官方逐字）→ fact-check 認可為敘事說明、不冒充官方，不改。
created: 2026-09-24
updated: 2026-09-24
---

# 研究軌跡 — domino-admin-server-identity

概念/troubleshooting 型。素材來自跨-session 交來的第一手排查 doc
`C:\Users\siaob\code\20260827-wsl-domino-r1202-ldat05\docs\entitlement-aggregation-fix.md`
（LDAT05/TheNet, Domino 12.0.2 FP8, WSL2；冷啟動實測驗證過）。

## 角度決策

- 使用者從兩個角度中選「**概念線**」：以「Domino domain admin server 身份由誰決定、牽動哪些機制（entitlement 聚合 / CertMgr / AdminP）」為主軸，LDAT05 case 當範例。
- 先前此題被使用者喊「這緩緩」暫停（原因：當時只有 `DISABLE_ENTITLEMENT_TRACKING=1` 這個**猜測**、無 root cause）。LDAT05 session 把 root cause + 方案 B 查出並冷啟動驗證後解封。呼應 [[feedback_no_vague_community_consensus]]（#4 就是這個 entitlement 猜測）。

## 官方引用（第一手 WebFetch 逐字驗證）

- **Entitlement tracking**（[14.0 官方](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html)）逐字：
  - 本地收集：「each Domino 12 server scans every database on the server and collects the highest level of access for each entitled user」（update task → entitlementtrack.ncf）。
  - 聚合：「…aggregated for the entire domain **on the domain administration server**. The directory catalog task manages the synchronization process…」（→ entitlements.nsf）。
- **Running CertMgr**（[14.0 官方](https://help.hcl-software.com/domino/14.0.0/admin/secu_le_running_certificate_manager.html)）逐字：「The Domino administration server for the domain **is a good choice**」＝建議非強制。
- **CertMgr_Server**（[12.0.2 官方](https://help.hcl-software.com/domino/12.0.2/admin/secu_le_CertMgr_Server.html)）逐字：「Defines the server that has certstore.nsf」，可指定、預設本機。
- dircat 選台頁（[12.0.2](https://help.hcl-software.com/domino/12.0.2/admin/conf_pickingtheserverstorunthedircattask_t.html)）：講的是 directory catalog 用途、**未**明述「names.nsf 決定 domain admin」——故該條**不冒充官方逐字**。

## 不冒充官方、誠實標示的幾條（重要）

- **「domain admin 身份只由 names.nsf 管理伺服器決定」**：Domino 既有行為 + **本案例實證**（方案 B 驗證時 admin4.nsf 一直是 LDAT05 沒動、聚合照樣停）。文中以「既有行為 + case 實證」呈現，**不標官方逐字**（無單一官方頁明講此句）。
- **DISABLE_ENTITLEMENT_TRACKING 對聚合層無效**：以「本案例冷啟動實測」呈現（收集層 vs 聚合層），非官方聲明；dpastov 是該 setting 出處。呼應 [[feedback_no_vague_community_consensus]]。
- 冷啟動驗證結果、無害 warning：來自 source doc 的實測，標為「本案例」。

## 交叉連

- 內部：[[certstore-getting-started]]（CertMgr/certstore 脈絡；當初就是設 CertMgr 埋的伏筆）。
- 相關 memory：[[project_certstore_trilogy]]（三個信任庫）、[[feedback_no_vague_community_consensus]]（entitlement 猜測那條的正解落地）。

## 查證 checklist

- [x] 三條官方逐字引用對照（entitlement 兩層 / CertMgr good choice / CertMgr_Server）
- [x] 兩層機制正確（收集 update/entitlementtrack.ncf；聚合 dircat/entitlements.nsf/domain admin）
- [x] 「names.nsf 決定 domain 身份」以既有行為+case 實證呈現、不冒充官方逐字
- [x] DISABLE_ENTITLEMENT_TRACKING 無效標為本案例實測、非官方
- [x] TYPE 留白（概念/reference，非可照跑 Tutorial）；tags Domino Server + Admin
- [x] inline-link diversity：4 相異外部（entitlement / running certmgr / CertMgr_Server / dpastov）+ 內部 certstore
- [x] 雙語 temp-build（暫拷 posts + 過去 pubDate）→ exit 0、兩版 render
- [ ] humanizer-zh-tw pass
- [ ] independent fact-check subagent（跑中）

## 異動日誌

- 2026-09-24 跨-session 交來 doc → 使用者選概念線、解封；WebFetch 驗 3 官方頁；雙語成稿（概念先行、case 為例）；temp-build 驗證；sidecar；stage _pending 排 9/24。（Opus 4.8）
