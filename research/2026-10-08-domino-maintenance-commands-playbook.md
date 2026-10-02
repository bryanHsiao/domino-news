---
slug: domino-maintenance-commands-playbook
title: "Domino 維護指令實戰：參數規則 + transaction log 分支 + 情境 playbook"
lang: [zh-TW, en]
pubDate: 2026-10-08
status: staged（_pending，排 2026-10-08，Path A）
tags: [Domino Server, Admin, Tutorial]（Tutorial：三組情境 playbook 是可照跑的指令序列）
requester: 使用者（給 xred「DB 維護指令全攻略」URL，要「以後不用看他的也能找到資訊」→ 先研究能否不引用 xred、獨立寫；AskUserQuestion 選「新開實戰速查 companion」）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-08
updated: 2026-10-08
---

# 研究軌跡 — domino-maintenance-commands-playbook

hands-on 速查 companion。xred 那篇是從三支官方 HCL KB 濃縮的；本篇回到那三支 + 官方 options 文件獨立重寫，不引用 xred。深連站上 9/18 概念 triage 篇。

## 獨立性（不引用 xred）

xred「HCL Domino 資料庫維護指令全攻略」末尾自列三支 HCL KB，就是它的真實來源：
- **KB0030639**「Domino 伺服器維護管理員手冊」（[link](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030639)，瀏覽器逐字）：updall/compact/fixup 完整 options + compact 三 style + 情境還原程序（translog 分支）+ 工作時間修法 + 升級前後 + 各 OS 命令列 + 「何時不該跑 fixup」。**本篇主幹全出自此**。
- **KB0030754**「伺服器維護清單」（[link](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030754)）：頻率表 + translog/fixup 分支（啟用 translog 不能對該 DB 跑 fixup、要還原備份）+ 每季指令。
- **KB0030930**「伺服器維護技巧」：排程建議（每月重啟、每週離線維護、translog 時 fixup 可省）。
- 官方 options 文件：[Compact options](https://help.hcl-software.com/domino/12.0.2/admin/tune_compactoptions_r.html)（WebFetch 鎖定）、[Fixup options](https://help.hcl-software.com/domino/14.0.0/admin/admn_fixupoptions_r.html)（WebFetch 鎖定）、Updall options（11.0.1，9/18 已用）。
- **未跑 NotebookLM**：有 Admin notebook，但本篇是官方 KB + options 逐字第一手；與其他 admin/KB 篇同理。

## 與站上 9/18 的區隔

- 9/18 `domino-updall-fixup-compact`：概念 triage「哪個症狀跑哪個」，只薄薄一段排程/線上。
- 本篇：**實際參數 + 語法規則 + 情境 playbook**（xred 的價值面）。深連 9/18 當概念前置、不重複。AskUserQuestion 使用者選此方向（非擴充 9/18、非 dbmt 專篇）。

## 查證中自我修正（重要）

我原本假設「xred 的 `compact -REPLICA` 是錯的、`-REPLICA` 不是 compact 旗標」。**查證後發現我自己才錯**：正確文件是 `tune_compactoptions_r.html`（非我猜的 `admn_compactoptions_r.html`），`-REPLICA` **是官方真選項**（replication-style 線上背景壓縮、建新 replica 自動改名）。差點把「修正」寫成新錯誤——先查證擋下。文中 `-REPLICA` 已按官方描述（線上背景、minimal downtime）。呼應 [[feedback_no_vague_community_consensus]]：對 xred 的「糾錯」也要先對官方驗、不能憑假設。

## 關鍵技術點（全官方）

- `-b` 就地、不縮檔、**留 DBIID**（translog 安全）；`-B` 就地縮檔、**換 DBIID**；`-c` copy-style（損毀/結構/ODS）；`-REPLICA` 線上背景。換 DBIID → 認證備份工具要補完整備份。
- translog 分支：啟用時 routine 不跑 fixup（重啟自動復原）、compact 用 `-b`；對日誌 DB 跑 fixup 要 `-J`。
- playbook 三情境指令序列全對 KB0030639 section III（translog / no-translog / 工作時間）。
- 語法規則：`compact` 分大小寫（`-b`≠`-B`，官方兩義佐證）；`updall` 不分（KB 混用 -R/-r、-X/-x 推得，文中已標明「HCL 文件混用」）；`-LargeSummary on` 關鍵字（社群速查來源，已輕描）。

## 標題候選

- [汰除] 好處先行：`Domino 資料庫維護指令速查：參數怎麼配、三種情境各跑哪一串` — 好搜，但沒點出最關鍵的 `-b`/`-B`＋translog 風險。
- [汰除] 問題先行（窄）：`compact 要 -b 還是 -B?` — hook 很強但太窄，像只講 compact。
- [選定] 實戰＋風險＋結構：`Domino 維護指令實戰：參數規則、transaction log 分支，與三種情境 playbook（日常/修復/開不起來）`
  — 「實戰」區隔 9/18 概念篇、「transaction log 分支」點出最會出事的那條、「三種情境 playbook」講清楚可照跑的價值；標題自決（使用者已授權）。
  en 鏡像：`Domino Maintenance Commands in Practice — Option Rules, the Transaction-Log Branch, and Scenario Playbooks (Daily / Repair / Won't Open)`

## 查證 checklist

- [x] compact -b/-B/-c/-D/-i/-L/-S/-REPLICA 對官方 Compact options
- [x] fixup -F/-J/-O/-C/-N/-L 對官方 Fixup options
- [x] updall -V/-F/-R/-X 對 KB0030639 options 表
- [x] playbook 三情境序列對 KB0030639 section III（含 translog 分支）
- [x] DBIID 邏輯（-b 留、-B/-c/-REPLICA 換 → 補備份）對官方
- [x] 大小寫規則：compact 分（官方兩義）、updall 不分（KB 混用推得、已 hedge）
- [x] `-LargeSummary on` 關鍵字（社群來源、輕描）
- [x] inline-link diversity：4 相異官方 URL 各 25%（<40%），每語 4 外部（≥2）
- [x] TYPE Tutorial（情境序列可照跑）；tags Domino Server + Admin + Tutorial
- [x] 雙語 temp-build 通過
- [x] humanizer 自審 ~45/50（field-report 語氣；表格/規則清單為正當結構）
- [x] fact-check（獨立 subagent）→ **FAIR、零事實錯誤**。所有 option 意義（compact -b/-B/-c/-D/-i/-L/-S、fixup 六個、updall 四個）與三情境序列全對官方逐字（agent 重抓 compact/fixup 頁驗證）；DBIID 邏輯對。兩處軟化已套：
  - `-LargeSummary on` 不在所引 compact 頁 → 換成官方頁確有的 `-daos on|off` / `-nifnsf on|off` 當關鍵字參數例。
  - `-REPLICA 換 DBIID` 官方頁未明說 → 表格與 translog 段改「建新 replica」框架、不硬掛 DBIID 斷言。
  - updall 大小寫：agent 認「已可接受 hedge（文中附證據）」，保留。
  - 非問題：inline updall link 用 11.0.1（known-good），frontmatter 其餘用 12.0.2/14.0.0——版本混用非錯，保留。

## 異動日誌

- 2026-10-08 新建。三支官方 KB + options 文件獨立重寫、不引 xred；查證中自我修正 `-REPLICA`（原假設錯）；深連 9/18；humanizer 自審；排 10/08 Path A。（Opus 4.8）
