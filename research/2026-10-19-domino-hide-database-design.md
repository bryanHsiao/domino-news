---
slug: domino-hide-database-design
title: "隱藏資料庫設計(Hide design):關掉哪些操作、不是加密鎖(配 ACL)、沒有 unhide 要留未隱藏 template、擋 agent"
lang: [zh-TW, en]
pubDate: 2026-10-19
status: Path A staged（_pending，排 2026-10-19）
tags: [Domino Designer, Admin]（TYPE 留白：概念解說）
requester: 使用者「挑 14~19 主題、先查新聞沒有再寫技術文」；六篇計畫最後一篇;與 10/18 模板繼承成對(發設計 vs 鎖設計)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-hide-database-design

Designer 設計保護型,10/18 模板繼承的續集:template 把設計「發」出去,hide design 在「交出成品」時保護 IP。grep 確認「hide design/hiding the design」無專文(2 命中為 hide-when/欄位隱藏)。

## 選題（對帳後）

- 14~19 查無新聞 → 技術文;本篇為六篇計畫最後一篇。
- 安全面向多已覆蓋(ACL 5/15、Readers/Authors 7/10、agent 身分 8/03、簽章 7/12…)、儲存/維護 cluster 周邊飽和 → 找「與 10/18 成對且官方乾淨」的缺口。
- grep「hide design / hiding the design / hide formulas / Hide Design」→ 僅 notes-view-column(6/26)、dql-production(5/03)命中,均為 hide-when/欄位層隱藏,**非資料庫設計隱藏** → 真缺口。
- 選它的理由:① 10/18 的自然續集(發 vs 鎖),收尾成對;② 「沒有 unhide、要自留未隱藏 template」是交付 template 最常後悔的點;③ 「不是加密鎖、要配 ACL」連回 notes-acl-entry(5/15);④ 官方 hiding-the-design 頁乾淨。

## 核心（官方 WebFetch）

- hiding-the-design(12.0.2):「disables all design operations and hides all formulas and scripts」;使用者不能:View>Design、改/增/刪 fields/forms/navigators/pages/subforms、改/刪 views、看/刪/改 agents、看/改 formulas/LotusScript/simple action、改 Database Open 屬性/design synopsis/複製複寫設計;「To fully protect... remove Designer and Manager access...」;有 Designer/Manager 者「can replace the database design, thereby changing it」(=非永久鎖);留未隱藏 template、「do not give the template to anyone except authorized designers」;別發 formulas/LotusScript 說明文件;agent 先測、需使用者輸入的設「Choose when agent is enabled」+ @Command[AgentEnableDisable]。
- replacing-a-design(12.0.2):Replace Design 勾「Inherit future design changes」+「Hide formulas and LotusScript」隱藏;File>Application>Replace Design。
- **可逆性**:初次 WebFetch 顯示官方頁「doesn't state directly whether hiding can be undone」、未描述反隱藏步驟 → 本文框成「官方沒有 unhide 動作、改設計只能靠未隱藏 template」。**待 fact-check 回頁確認此框法沒過度宣稱**。

## 措辭守則

- hide design ≠ hide-when(顯示控制)——是關掉整庫設計操作,別混。
- hide ≠ 加密鎖:對 Designer/Manager 不是永久防線,要**配 ACL**——別寫成「隱藏=誰都改不了」。
- 「沒有 unhide」:官方未提供反隱藏步驟 → 框成「沒有 unhide 動作、靠未隱藏 template 改」,不要寫成「技術上永遠不可能解開」(避免過度宣稱;待 fact-check)。
- 「Inherit future design changes」是 Replace Design/New Database 對話框的字樣(與 10/18 既有庫屬性「Inherit design from template」不同框——10/18 已修正該區別)。

## 站上互連

- 連 10/18 模板繼承（發 vs 鎖,hook＋兩處;更新隱藏庫靠未隱藏 template 的 refresh）。
- 連 notes-acl-entry(5/15)（hide 不是加密鎖、要拔 Designer/Manager ACL）。

## 標題候選

- [汰除] 名詞平述：`如何隱藏資料庫設計` — 太泛。
- [選定] 情境＋關鍵雷：`隱藏資料庫設計(Hide design):出貨 template 給客戶前怎麼鎖設計,它關掉的到底是什麼,以及為什麼你一定要自己留一份沒隱藏的 template`
  — 打「出貨前鎖設計」情境 + 點出「沒 unhide、要留未隱藏 template」這個後悔點;標題自決。
  en 鏡像：`Hiding a Database Design: How to Lock the Design Before You Ship a Template, What It Actually Disables, and Why You Must Keep an Unhidden Copy of the Template`

## 查證 checklist

- [x] 「disables all design operations and hides all formulas and scripts」逐字
- [x] 不能做的操作清單
- [x] Replace Design 勾「Inherit future design changes」+「Hide formulas and LotusScript」
- [x] 非永久鎖(Designer/Manager 可 Replace)、「remove Designer and Manager access」逐字 → 配 ACL
- [x] 留未隱藏 template、「do not give the template to anyone except authorized designers」逐字
- [x] agent:Choose when agent is enabled + @Command[AgentEnableDisable]
- [x] inline-link diversity：3 相異官方 URL 各 33%（hiding／replacing／templates）;每語 3 外部(初稿只有 1、已補 2)
- [x] TYPE 留白；tags Domino Designer + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ **七條全部官方背書、零錯誤**。逐字命中:「Hiding the design disables all design operations and hides all formulas and scripts」、「Users who have Designer or Manager access... can replace the database design」、「To fully protect database design, remove Designer and Manager access...」、「do not give the template to anyone except authorized designers」、「you redesign the template, whose design is not hidden, and then refresh...」、兩個勾選框「Inherit future design changes」+「Hide formulas and LotusScript®」。三處措辭精度已調:
  - ①**可逆性(最重要)**:官方並未明說「不可逆」,只是「沒提供 unhide、唯一途徑是未隱藏 template」→ 改寫為「官方文件沒有提供任何 unhide 操作;頁面通篇無反隱藏步驟;唯一官方途徑是透過未隱藏 template 改再 refresh」,不替官方加「不可逆」斷言。
  - ②agent 項補「或新增 shared agent」(官方「or add shared agents」);view 項本就只寫「改/刪既有」未寫新增 ✓。
  - ③Replace Design 的隱藏步驟其實寫在**隱藏設計頁**、非 replacing-a-design 頁 → 把 replacing-a-design 連結改歸因為「Replace Design 這個操作本身」(該頁確實是 Replace Design 的參考),勾選框步驟歸隱藏頁(已於「它關掉的」段連結)。保持 3 相異外部 URL 各 33%。
  - 第 2 項「reveal the design by copy/replica」原文重點在 reveal、本文簡寫方向對,未再動。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

Designer 設計保護無專屬 notebook、本 session NotebookLM 瀏覽器狀態延續問題未解;以官方 Domino Designer 文件 WebFetch 為據(研究鏈允許 fallback、已揭露)。官方頁 WebFetch 驗證非 404。

## 異動日誌

- 2026-10-13 新建（排 2026-10-19）。六篇計畫最後一篇、與 10/18 成對;官方三文為據;連 10/18＋notes-acl-entry;humanizer 自審;Path A staged。（Opus 4.8）
