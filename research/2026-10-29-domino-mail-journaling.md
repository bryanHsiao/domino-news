---
slug: domino-mail-journaling
title: "Mail journaling:怎麼開、全部vs選擇性、local vs mail-in、兩個加密坑"
lang: [zh-TW, en]
pubDate: 2026-10-29
status: Path A staged（_pending，排 2026-10-29，未來日→cron 自動 promote）
tags: [Domino Server, Admin, Security]（TYPE 留白）
requester: 使用者「寫27~11/2的文」；郵件管理 cluster 第 3 篇;接 10/28(Journal mail rule 動作)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-mail-journaling

郵件管理 cluster 第 3 篇。grep 確認 journaling 1 命中。接 10/28 Journal 動作(journaling 要先開)。核心賣點=兩個加密坑(local Subject 不見、mail-in 不自動加密)。

## 核心（官方 WebFetch）

- mail-journaling（10.0.1）:router 投遞同時複製到 MAILJRN.NSF、不影響投遞「the Router still delivers each message to its recipient after copying it」、搭 mail rules、只授權管理者可看、預設關、Router/SMTP→Advanced→Journaling 開。
- setting-up（10.0.1）:local（自動建）vs mail-in（要先存在+Mail-in 文件）;Encrypt on behalf of user 公鑰;Field encryption exclusion list;Subject 預設加密→view 空白。
- managing（10.0.1）:mail-in 不自動加密、要 Basics 開;已加密信不重加密、非收件人只看 header;預設從 Open Database 隱藏;建議專用 journal ID 多密碼。

## 措辭守則

- 兩坑方向:local=有加密但 Subject 不見;mail-in=根本沒自動加密。別寫反。
- journaling 要先開、mail rule Journal 動作才有地方送——順序別顛倒。
- 「不影響投遞」照官方、別寫成會延遲。
- Encrypt on behalf of user 用「公鑰」加密——別寫私鑰。

## 站上互連

- 連 10/28 mail rules（Journal this message 動作、journaling 要先開）。
- cluster 內郵件系列。

## 標題候選

- [選定] 一句賣點+坑:`Domino mail journaling:合規側錄,加密有兩個坑`
  en：`Domino Mail Journaling: Capturing Mail for Compliance, and Two Encryption Traps`

## 查證 checklist

- [x] 定義、不影響投遞、MAILJRN.NSF、預設關、Advanced→Journaling 開
- [x] 全部 vs 選擇性(Journal mail rule)、要先開
- [x] local（自動建）vs mail-in（要先存在+Directory 文件）
- [x] local 加密 Encrypt on behalf of user 公鑰、Subject 預設加密 view 空白、Field encryption exclusion list
- [x] mail-in 不自動加密要 Basics 開
- [x] 已加密信不重加密、非收件人只看 header
- [x] 預設隱藏、專用 journal ID
- [x] inline-link diversity：3 相異官方 URL 各 33%（初稿 2、已補 managing）
- [x] TYPE 留白；tags Domino Server + Admin + Security
- [x] 雙語 temp-build 通過
- [x] humanizer 自審;標題精簡
- [x] fact-check（獨立 subagent）→ **七條全對、零錯誤**(我盯的 local Subject、mail-in 不加密、已加密不重加密都站得住)。逐字命中:「Journaling does not disrupt the normal routing」、「By default, mail journaling is not enabled」、mail-in「Domino does not automatically encrypt」、「not re-encrypted with the Journal user's key」、非收件人只看 header、預設從 Open Database 隱藏。兩處已精準化:
  - ①**側錄一律要 Journal mail rule 驅動**(官方「Enabling it alone doesn't journal mail. You must also create a server mail rule with the action 'Journal this message.'」)——連「全部」也要一條 catch-all 規則;光開 Advanced 不建規則不側錄。雙語重寫為「兩步 + 範圍看規則」。
  - ②**Subject 空白是推論**:官方 10.0.1 頁沒直接寫「Subject 欄空白」,是由「加密欄位無法顯示於 view」+「預設只有 Form/From/Principal/PostedDate 不加密」推得 → 雙語改為明列四個豁免欄位＋推理鏈,不當官方明句。

## NotebookLM 說明

admin/security 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排 2026-10-29）。郵件管理 cluster 第 3 篇;官方三文為據;連 10/28;humanizer 自審;標題精簡;Path A staged。（Opus 4.8）
