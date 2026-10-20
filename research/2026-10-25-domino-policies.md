---
slug: domino-policies
title: "Policy documents:organizational vs explicit、effective policy、How to Apply 四模式、exception policy"
lang: [zh-TW, en]
pubDate: 2026-10-25
status: Path A staged（_pending，排 2026-10-25，未來日期→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白：概念解說）
requester: 使用者「寫20~26的文章」/「繼續」；20~26「伺服器子系統」cluster 第 6 篇;grep 確認 policy document 無專文(≈2 順帶提)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-policies

admin 集中設定子系統型。切入點=「一次套到全公司、而非逐台設」。核心賣點=How to Apply 四模式(多數人只設值、沒鎖→使用者改回去)。

## 核心（官方 WebFetch/WebSearch）

- policies-overview（11.0.1）:「a document that identifies a collection of individual policy settings」;settings doc 類型 registration/setup(淘汰)/desktop/mail/security/archive/connections/traveler/roaming;effective policy「a set of derived policy settings that are dynamically calculated at the time the policy is executed」;setup「Do not use...current release」併入 desktop。
- organizational-and-explicit（10.0.1）:organizational 註冊時依 OU 自動;explicit 手動(註冊時/Person 文件/Assign Policy 工具/Policy Assignment 分頁)。
- desktop-policy（14.5.0）:How to Apply 四模式 do not change / set initial value / set whenever modified / set and prevent changes;desktop 設定 first login+setup 強制、之後 home-server 認證時推。
- security-policy（11.0.1）:Notes/Internet 密碼、自訂密碼政策、key rollover、administration ECL、push 信任交叉憑證、ID vault。
- exception policy(WebSearch):只列不強制的設定、讓特定人覆寫 mandatory 值。
- effective policy 來源:OU + explicit(含群組)+ parent 繼承,動態解析。

## 措辭守則

- organizational=自動依 OU、explicit=手動——別反。
- How to Apply:set initial value(設一次可改)vs set and prevent changes(鎖死)——這組對比是全文重點,別混。
- effective policy「動態計算」——別寫成固定文件。
- precedence(org vs explicit 誰贏、parent/child)官方總覽頁未明給、在「policy hierarchy」另頁 → 本文只框「動態解析成 effective policy、How to Apply 的鎖才是強制」,不硬斷言 org/explicit 誰覆寫誰(避免過度宣稱)。
- setup 已淘汰併入 desktop——版本點要寫對。

## 站上互連

- 鬆連 cluster;security settings 可連 notes-acl-entry(5/15)/certstore(9/02),正文未硬塞(diversity 用官方 3 URL 已足)。

## 標題候選

- [選定]:`Policy documents:從一個地方把設定推到全公司的 Notes client——organizational vs explicit、effective policy、How to Apply 的四種模式`
  en：`Policy Documents: Pushing Settings to Every Notes Client From One Place — Organizational vs Explicit, the Effective Policy, and How to Apply's Four Modes`

## 查證 checklist

- [x] policy 定義逐字、容器+自動套用
- [x] organizational(OU 自動)vs explicit(手動+指派方式)
- [x] settings doc 類型、setup 淘汰併 desktop
- [x] security settings 內容
- [x] effective policy 逐字+來源組成
- [x] How to Apply 四模式
- [x] exception policy 定義
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改;precedence 未過度宣稱)
- [x] fact-check（獨立 subagent）→ 6/7 對、逐字命中(policy 定義、organizational/explicit 四指派管道、security 各分頁、effective policy「dynamically calculated」、exception「override enforced policy settings」)。**一處硬傷已修**:
  - **How to Apply 模式名稱寫錯**:官方是「Don't set value / Set initial value / Set value whenever modified / Set value and prevent changes」。我原寫第一個為「do not change(不變更/保留現值)」**語意錯**——官方「Don't set value」是「不指定值、由使用者自己填」,非「保留現值」。四模式名稱＋第一個語意雙語全改(含 description)。另三個補回官方漏掉的「value」字。
  - 兩處措辭:①setup 停用引號改用官方原句「Do not use the Setup Policy Settings document. Use a Desktop Policy Settings document.」;②補述 exception 不是第三種 policy type、是 Administration 分頁的選項(policy type 仍 explicit/organizational)。
  - precedence(org/explicit 誰贏)本文未硬斷言、只框「動態解析成 effective policy、How to Apply 鎖才是強制」✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據(fallback、已揭露)。官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排 2026-10-25）。cluster 第 6 篇;官方多文為據;humanizer 自審;Path A staged。（Opus 4.8）
