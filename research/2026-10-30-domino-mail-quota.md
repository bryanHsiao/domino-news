---
slug: domino-mail-quota
title: "Mail quota:quota+threshold、三種 enforcement、大小計算兩法"
lang: [zh-TW, en]
pubDate: 2026-10-30
status: Path A staged（_pending，排 2026-10-30，未來日→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白）
requester: 使用者「寫27~11/2的文」；郵件管理 cluster 第 4 篇;接 10/20(held mail/MailTimeout)、10/13(translog 影響計算法)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-mail-quota

郵件管理 cluster 第 4 篇。核心賣點=「預設 Deliver anyway、配額設了不代表會擋」。接 10/20(held mail=Hold and retry 來源之一、MailTimeout)、10/13(translog→用量計算法)。

## 核心（官方 WebFetch）

- setting-mail-file-quotas（12.0.0）:quota 硬上限 + warning threshold;threshold 要先有 quota。
- setting-quota-controls（10.0.1）:在 Delivery Controls→Quota Controls;三選項逐字「Deliver anyway (don't obey quotas)」(預設)、「Non deliver to originator」(退 NDR)、「Hold mail and retry」(hold MAIL.BOX、過期 1 天退回);子選項「Attempt delivery of each message」(開=放得下先投/關=全 hold)、「Maximum number of messages to hold per user」(超過回失敗報告 FIFO)、「Maximum message size to hold」。
- notifying-users（11.0.1）:通知 None/per message/per interval;計算法 extend-file(含 white space、刪信不即釋放)vs space-used(只算用量、建議搭 translog 不需 compact);iNotes 預設擋送、iNotes_wa_Ignore_Quota=1。

## 措辭守則

- 三選項用官方確切標籤(Deliver anyway/Non deliver to originator/Hold mail and retry);「Non deliver to originator」別寫成 reject/deny(官方沒用這字)。
- 預設 Deliver anyway=不擋——這是全文賣點、別寫反。
- 計算法:預設含 white space、刪信不即釋放——方向別反;space-used 搭 translog。
- MailTimeout=1 天 vs enforcement 的 expiration=1 天,官方此頁說 expiration 1 天、MailTimeout 由另一頁定義,兩者同值,照引即可。

## 站上互連

- 連 10/20 mail 路由（held mail=Hold and retry 的來源之一）。
- 連 10/13 translog（用量計算法建議搭 translog）。

## 標題候選

- [選定] 一句提問:`Domino mail quota:超過配額時,信到底會怎樣`
  en：`Domino Mail Quota: What Happens When a Mailbox Is Over Quota`

## 查證 checklist

- [x] quota+threshold、threshold 要先有 quota
- [x] 每次投遞比對
- [x] 三 enforcement 確切標籤、Deliver anyway 預設
- [x] Hold and retry 子選項、過期 1 天/MailTimeout
- [x] 計算法兩種、translog 建議
- [x] 通知 None/per/interval、iNotes_wa_Ignore_Quota
- [x] inline-link diversity：3 相異官方 URL 各 33%
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審;標題精簡
- [x] fact-check（獨立 subagent）→ 大致正確、三處標籤/措辭已修:
  - ①選項標籤官方是 **「Non delivery to originator」**(我寫 deliver 少 y)→ 雙語 5 處全改。「Deliver anyway (don't obey quotas)」是 (Default) ✓、「Hold mail and retry」✓。
  - ②hold 過期官方配額頁只寫「(default =1 day)」、**未在該頁指名由 MailTimeout 控制**(MailTimeout 在 message-timeout 另一頁)→ 軟化為「與 Router 的訊息逾時 MailTimeout 一致」。
  - ③第二計算法完整標籤 **「Check space used in file when adding a note」**(補 in file);且 `NSF_QUOTA_METHOD` 實有**三種**(第三「Check file size when adding a note」最嚴格)→ 雙語補一句「嚴格說三種、上面兩種是最常對比」。預設「Check file size when extending the file」含 white space/刪信不即釋放/translog 建議全 ✓。
  - 其餘全對:quota+threshold（threshold 要先有 quota）、每次投遞比對、Hold 子選項、通知 None/per message/per interval、iNotes 預設擋送＋`iNotes_wa_Ignore_Quota=1` 可寄不可存（逐字）。

## NotebookLM 說明

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排 2026-10-30）。郵件管理 cluster 第 4 篇;官方三文為據;連 10/20、10/13;humanizer 自審;標題精簡;Path A staged。（Opus 4.8）
