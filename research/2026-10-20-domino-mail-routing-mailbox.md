---
slug: domino-mail-routing-mailbox
title: "Domino mail routing:mail.box、Router、NRPC 逐跳 vs SMTP、dead/held mail"
lang: [zh-TW, en]
pubDate: 2026-10-20
status: Path A staged（_pending，排 2026-10-20＝今天）→ **commit 後需手動 publish-pending 促發**（已過台北早上 cron）
tags: [Domino Server, Admin]（TYPE 留白：概念解說）
requester: 使用者「寫20~26的文章」；查無可發新聞(14.5.1 FP1 是 7 月、已覆蓋;14.5.2 未釋細節)→ 技術文;本篇為 20~26 七篇「伺服器子系統」cluster 第 1 篇
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-mail-routing-mailbox

admin 郵件子系統型,20~26 cluster 開篇。接續 14~19 儲存/維護 cluster,轉向「伺服器子系統(壞了才認識)」。grep 確認 mail 路由/mail.box 無專文(命中皆 rich-text/container/directory 順帶提)。

## 選題（對帳後）

- 開場對帳:git pull → 14~19 全數 promote、_pending 清空 ✓;`date -u`=10/20 08:29 UTC(台北約 16:29、已過早上 cron)→ 今天這篇要手動促發 publish-pending。
- `npm run coverage`=97/97 類別 100%(URL 偵測寬鬆)→ LS 類別名目已滿,找子系統缺口。
- 新聞:WebSearch Oct 2026 → 無新釋出(14.5.1 FP1 July、已覆蓋;14.5.2 upcoming 無細節)→ 技術文。
- 子系統覆蓋密度 grep:DDM=0、LTPA/web 認證≈2、policy≈2、Internet Site≈3、AMgr≈4(皆順帶提非專文)、mail/cluster 命中亦皆順帶提 → 7 個真缺口,組「伺服器子系統」cluster。
- 本篇 mail 路由為第 1 篇:最基礎、最常被問「信去哪了/卡在哪」。

## 核心（官方 WebFetch）

- how-mail-routes（11.0.1）:存進 mail.box → Router 查 routing table 算下一跳 → NRPC/SMTP → home server 投進 mail file → client RPC/IMAP/POP3/HTTP 取。
- the-mail-router（10.0.1）:「periodically checks MAIL.BOX for new or changed messages」逐字;逐收件人 local 投遞 vs 轉下一台;同一 Notes named network「automatically transfer mail among themselves」;mail.box 有 dead(stop sign)/held(紅驚嘆號)兩種 undeliverable(此頁只給圖示與定義,成因在 undeliverable 頁)。
- managing-undeliverable（11.0.1）:dead=投不出又退不回寄件人;held=mail rule RoutingState=HOLD／quota Hold-and-Retry 過 MailTimeout(預設 1 天)退回;本機無收件人暴量=字典攻擊;correct/release/delete;release 前看 From/Recipients、null SMTP reverse path 就刪;Show Server 報 dead 數;多 box「resend all」只管當前。
- SMTP 細節（WebSearch 多頁）:預設關、Router/SMTP Basics 分頁開、只 MIME、DNS MX、port 25、SMTP listener 只收。

## 措辭守則

- dead vs held 方向別反:dead=兩頭都失敗、held=刻意不投。
- NRPC 預設、SMTP 選用——別寫成 SMTP 預設。
- 多 mail.box 的「減少爭用」理由:官方多半只說「可以有多個」;若未明說理由,框成「用意是減少爭用」時標清楚是常識性說明（待 fact-check）。
- MailTimeout 預設 1 天——具體數字待 fact-check 確認。

## 站上互連

- 鬆連:Show Server/console 可連 domino-console-troubleshooting(9/17)——正文點 Show Server 即可,不強連(避免硬湊)。
- 本 cluster 後續篇(AMgr/DDM 等)之後互連。

## 標題候選

- [汰除] 名詞平述：`Domino 郵件路由介紹` — 太泛。
- [選定] 旅程＋卡信：`一封信在 Domino 裡怎麼走:mail.box、Router、NRPC 逐跳 vs SMTP,以及卡在 mail.box 裡的 dead 與 held mail`
  — 用「一封信怎麼走」當敘事線 + 點出卡信(dead/held)這個實務查修點;標題自決。
  en 鏡像：`How a Message Routes Through Domino: mail.box, the Router, NRPC Hop-by-Hop vs SMTP, and the Dead and Held Mail Stuck in mail.box`

## 查證 checklist

- [x] mail.box=在途佇列、各來源都先進
- [x] Router「periodically checks」逐字、逐收件人、routing table、Domino Directory
- [x] NRPC 預設逐跳、同 NNN 自動互轉
- [x] SMTP 選用/預設關/MIME/DNS MX/port25/Router-SMTP 分頁/listener 只收
- [x] home server 投 mail file、client RPC/IMAP/POP3/HTTP 取
- [x] dead/held 定義、成因、MailTimeout、字典攻擊、處理、resend all 只管當前
- [x] inline-link diversity：3 相異官方 URL 各 33%（the-mail-router／how-mail-routes／managing-undeliverable）；每語 3 外部（初稿只 1、已補 2）
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改;修了 zh 一處打字殘留「invest)」）
- [x] fact-check（獨立 subagent）→ **八條全對、零事實錯誤**。盯的三處都官方逐字背書:多 mail.box「減少爭用」理由(官方「contention for a single MAIL.BOX... degrades performance」逐字,另加 failover 好處)、SMTP MIME/port25/預設關(SMTP 總覽+設定頁逐字)、dead/held 定義與 quota「MailTimeout=1」(undeliverable+quota 頁逐字)。另「dictionary attack」是官方用語、null SMTP reverse path 就刪、resend all 只管當前 box 皆逐字。兩處措辭已收緊:
  - ①SMTP「只走 MIME」→ 補:預設 MIME-only 模式只送 MIME,另有 All messages 模式會把 Notes 格式轉 MIME 再送(fidelity/效能損失),免讀者誤會「SMTP 絕不碰 Notes 格式」。
  - ②held 狀態用詞:mail rule 造成的 routing state 官方值是 `Held`(改掉原 `HOLD`);quota 的一天 hold 是 `MailTimeout` 機制、官方分開描述 → 明標「兩套機制別當同一旗標」。
  - agent 另提醒:MailTimeout=1 與一般投遞 message-timeout 24h 是兩個剛好都=1 天的不同設定(本文只引 MailTimeout、未混用 ✓);取信四協定並列屬標準產品知識、本文該句未硬掛單頁 citation ✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

mail routing 屬 admin 網域;本 session NotebookLM 瀏覽器狀態延續問題未解;以官方 HCL admin 文件 WebFetch 為據(研究鏈允許 fallback、已揭露)。官方頁均 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排當天）。20~26「伺服器子系統」cluster 第 1 篇;官方三文為據;humanizer 自審;Path A staged＋**需手動 publish-pending 促發**。（Opus 4.8）
