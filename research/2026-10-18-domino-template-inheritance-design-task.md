---
slug: domino-template-inheritance-design-task
title: "模板繼承與 Designer task:繼承關係、load design、Refresh vs Replace、Prohibit/Propagate 保護元素"
lang: [zh-TW, en]
pubDate: 2026-10-18
status: Path A staged（_pending，排 2026-10-18）
tags: [Domino Designer, Admin]（TYPE 留白：概念＋設定解說）
requester: 使用者「挑 14~19 主題、先查新聞沒有再寫技術文」；admin 儲存/維護 cluster 周邊飽和(replication 6/06、FT 7/17、maintenance 9/18+10/08 都已覆蓋),換設計管理面向;grep 確認模板繼承/design 任務無專文
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-template-inheritance-design-task

Designer/admin 設計管理型。從儲存/維護 cluster(13-17)切到「設計怎麼流動」這個面向。Designer task 是另一個排程型 server task(1AM),與 updall(2AM)/dbmt 同類,輕扣前面幾篇。

## 選題（對帳後）

- 14~19 查無新聞 → 技術文。
- admin 儲存/維護 cluster 周邊已飽和:replication(notes-replication 6/06)、FT index(notes-database-ft-index 7/17)、maintenance 指令(domino-updall-fixup-compact 9/18 + playbook 10/08 + DBMT 10/16)都已覆蓋。
- grep「template inheritance / inherit design / load design / Replace Design / master template」→ 僅零星於 ODP tooling(6/27)、notesregistration(5/30)、container(5/19)順帶提,**無模板繼承專文** → 真缺口。
- 選它的理由:① 設計管理是 Domino 顧問日常、站上缺;② 「改的設計半夜被蓋」是極常見踩雷;③ Designer task 是排程型 server task,輕接前面 cluster;④ 官方 Designer 文件充足。

## 核心（官方 WebFetch/WebSearch）

- templates-and-master-templates(12.0.2):master template = NTF + 「Database is a template」+ template name,自動發設計。
- synchronizing(10.0.1 admin):Designer task 同步繼承庫與 master template;**預設每天 1 AM**;`load design` 手動;每台有繼承庫的伺服器要有 template replica。
- making-and-distributing(10.0.1):Refresh Design 推給繼承庫。
- replacing-a-design(12.0.2):Replace Design 手動整包換、**庫沒繼承時唯一手段**;File→Application→Replace Design;Prohibit design refresh or replace + Propagate 要一起勾;元素層「Inherit from the design template」Replace 時跳過。
- linking(11.0.1):Design 分頁「Inherit design from template」+ template name;字樣跨版本不同(Inherit future design changes / from master template)。
- 陷阱:private agent/folder 不能進 template(refresh/replace 跳錯);icon/About/Using 預設不繼承(Other→Database Resources 個別設);別改原 template、用 New Copy。

## 措辭守則

- Refresh(對齊有繼承的庫)vs Replace(手動整包換、沒繼承唯一手段)——分工別混。
- Prohibit 要**配 Propagate**才生效——別只講 Prohibit。
- 「1 AM 預設」是具體數字 → 要 fact-check 回頁確認逐字,否則軟化為「預設夜間排程」。
- template 不控制 icon/About/Using——別寫成「template 什麼都繼承」。

## 站上互連

- 輕接前面 cluster:Designer task 是排程型 server task(1AM),與 updall(2AM)/dbmt(10/16)同類——正文點一句,不強連。

## 標題候選

- [汰除] 名詞平述：`Domino 模板繼承介紹` — 太泛。
- [選定] 痛點＋機制：`模板繼承與 Designer task:為什麼你改的設計半夜被蓋回去,Refresh 與 Replace Design 差在哪,怎麼擋住不想被覆寫的元素`
  — 直接打「改的設計半夜被蓋」這個共同踩雷;帶出 Refresh/Replace 與元素保護;標題自決。
  en 鏡像：`Template Inheritance and the Designer Task: Why Your Design Changes Get Overwritten Overnight, Refresh vs Replace Design, and How to Protect Elements You Don't Want Touched`

## 查證 checklist

- [x] master template（NTF+「Database is a template」+ name、自動發）
- [x] 繼承綁定（Design 分頁「Inherit design from template」+ name、字樣跨版本）
- [x] Designer task / load design / 每台要 replica（1 AM 預設待 fact-check 確認）
- [x] Refresh vs Replace、沒繼承時 Replace 唯一手段、Replace 路徑
- [x] Prohibit + Propagate、元素層 Inherit from the design template 跳過
- [x] 陷阱 private agent/folder、icon/About/Using、別改原 template
- [x] inline-link diversity：3 相異官方 URL 各 33%（synchronizing／making-distributing／replacing）；每語 3 外部
- [x] TYPE 留白；tags Domino Designer + Admin
- [x] sources frontmatter 補齊（初稿漏填、已補 4 官方頁）
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ 六條 5 條全對;三個高風險點**全部官方逐字成立**:「The Designer task runs daily by default at 1 AM.」、Replace「is the only way to distribute design changes if the database doesn't inherit」、Prohibit 要「select this option as well as the option "Propagate this prohibition of design change"」。一處已修:
  - **主張 2(標籤)**:初稿把三個「Inherit…」當「同一勾選框的不同版本」並列,不準。修正為:既有庫屬性=「Inherit design from template」;從 template 建**新**庫是 New Database 對話框的「Inherit future design changes」(不同情境、非同框);「Inherit design from master template」官方頁查無此字串、已不引用。
  - agent 補充(採納為站上準確性、未逐一加進本文以免膨脹):Prohibit/hide 都擋不住 ACL Designer/Manager(「None of these choices prevents someone with Designer or higher access... from changing the design」)——此點正是 10/19 隱藏設計那篇的主軸(hide+拔 ACL),已於 10/19 展開。
  - 版本註:1AM/load design/replica 權威頁是 admin 文件 admn_synchronizing...（本文 sources 已指該頁)✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

Designer 設計管理無專屬 notebook(SSJS/XPages notebook 不涵蓋此主題),且本 session NotebookLM 瀏覽器狀態延續問題未解;以官方 Domino Designer / admin 文件 WebFetch 為據(研究鏈允許 fallback、已揭露)。官方頁均 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-13 新建（排 2026-10-18）。儲存/維護 cluster 周邊飽和、轉設計管理面向;grep 確認無專文;官方四文為據;humanizer 自審;Path A staged。（Opus 4.8）
