---
slug: domino-attachments-rest-drapi-das
title: "Domino Attachments over REST: DRAPI and DAS Both Have Attachment Endpoints — Modern vs Legacy"
lang: [zh-TW, en]
pubDate: 2026-09-10
status: staged
tags: [Domino REST API, DevOps]
requester: 使用者 (bryan，附件系列「另個方向」：DRAPI/DAS 端點處理附件；並主動指路 das-api-specs 糾正 DAS 誤判)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent；經一次重大校正後重審)
review_result: "重大校正：初稿誤判『DAS 唯讀/不能上傳』（來自 WebSearch 摘要）→ 使用者指路 das-api-specs、我直讀 data.yaml 證實 DAS 有完整附件 CRUD → 全篇重寫 → 重審 PASS（零必修）"
created: 2026-09-07
updated: 2026-09-07
---

# 研究軌跡 — domino-attachments-rest-drapi-das

附件系列第三篇（2 篇規劃之二；「另個方向」= REST）。承 [[domino-attachments-three-ways]] /
[[domino-attachments-bulk]]。**這篇經歷一次重大事實校正，記錄如下以備future。**

## 重大校正 saga（核心）

1. 研究 subagent（Agent 3）從 WebSearch 摘要得出「DAS 不支援建立附件、回 400、唯讀導向」，並自標
   「來自搜尋摘要、舊 lotus.com 頁失聯」。我初稿據此把整篇框成「DRAPI 端點化 vs DAS 唯讀 base64」。
2. 第一次獨立 reviewer 竟 PASS——因為它只驗了「文件 create/update 帶附件→400」那條（是真的），
   **沒去查 das-api-specs 有沒有專屬附件端點**。→ 教訓：reviewer 驗「你寫的對不對」，未必會發現「你漏了整組端點」。
3. **使用者指路** github.com/OpenNTF/das-api-specs。我直讀 `data.yaml`（v9.0.1，權威 spec），發現
   `attachment` tag 有**完整 CRUD**：`POST …/{docUnid}/{itemName}`（multipart，Adds an attachment，201）、
   `GET/PUT/DELETE …/{itemName}/{fileName}`。→ **「DAS 唯讀/不能上傳」是錯的。**
4. 矛盾解決（兩者都對）：400 是**窄範圍**——只發生在「用文件 body 夾帶內嵌附件資料去 create/update」；
   而**專屬 `POST …/{itemName}` 端點可上傳**（201）。兩條路分開，DAS 就通了。
5. 全篇重寫（框架從「唯讀 vs 端點化」改為「兩套都有附件端點，差在 modern KEEP vs legacy ExtLib + 一個
   文件回寫 400 陷阱」）；圖也重畫。
6. **使用者再追問「『DAS 不能上傳是誤解』是誰的誤解?」**——正解：是**我自己**初稿的誤判（源自 WebSearch 摘要），
   不是有出處的「常見誤解」。→ 把所有「常見誤解／網路上常看到」的模糊歸因**拿掉**，改成據實：「400 限制容易被讀錯」。
   （這是 CLAUDE.md「模糊歸因」該避免的實例。）

## 研究來源
- **DAS 權威**：`https://raw.githubusercontent.com/OpenNTF/das-api-specs/master/data.yaml`（v9.0.1）——直讀確認
  attachment CRUD 端點、`multipart`/`attachmentlinks` 參數。
- **DAS 400**：來自舊 Domino Data Service User Guide（8.5.3；infolib 已失聯）逐字「Creating attachments and
  embedded objects is not currently supported… returns error 400… remove any attachment data.」→ 文章以
  「較舊 DAS 文件」hedge、建議依版本實測。
- **DRAPI**：richtext 頁（`$FILES`、richTextAs、MIME/multipart）、Round Trip how-to（`POST /attachments/{unid}`
  逐字）、OpenAPI spec（GET/DELETE summary、`dataSource`、`fieldName`）。

## 獨立審查 (review)
- 第一次（審錯版本）→ PASS（但漏了 DAS 端點，見上）。
- **重審（審校正版）→ PASS（零必修）**：4 個 DAS 端點對 data.yaml 全 match、attachmentlinks 逐字、
  400 歸屬正確且未過度、無殘留「唯讀」矛盾、DRAPI 側重確認。

## 標題候選（AskUserQuestion，使用者拍板）
- [汰除] 誤區修正 hook：`DAS 其實能上傳附件：DRAPI/DAS 兩套 REST 的附件端點，以及那個 400 陷阱`
- [汰除] 對比精簡：`DRAPI vs DAS：Domino 兩套 REST 的附件端點對照（含 DAS 的 400 陷阱）`
- [選定] 搜尋導向：`把 Domino 附件用 REST 拋出去：DRAPI 與 DAS 都有附件端點，差在現代 vs 舊版`
  en：`Domino Attachments over REST: DRAPI and DAS Both Have Attachment Endpoints — the Difference Is Modern vs Legacy`

## 附圖
自製 SVG：`public/post-images/domino-attachments-drapi-vs-das.svg`（zh）/ `-en.svg`。**已隨校正重畫**——
兩欄都列 CRUD 端點（不再是「DAS 唯讀/400」），400 降為底部「DAS 陷阱」註腳；措辭去掉「誤解/myth」改據實。
瀏覽器實測渲染乾淨。

## 查證 checklist
- [x] 研究鏈：3 平行研究 subagent + 使用者指路 das-api-specs + 我直讀 data.yaml 解重大矛盾
- [x] DAS 端點對 data.yaml v9.0.1 逐一 match（重審確認）
- [x] 400 正確歸屬（舊 DDS 文件、窄範圍）、hedge 得當
- [x] DRAPI 端點/逐字確認
- [x] 誠實：拿掉「常見誤解」的模糊歸因（使用者追問後）
- [x] inline-link diversity 通過（3 相異 URL 各 2 次 = 33%；初稿 das-specs 50% 已修）
- [x] 雙語 build 通過；SVG 附圖（已重畫）渲染確認
- [x] 未重寫系列前篇，交叉連結
- [x] 標題優化 loop（使用者選搜尋導向）
- [x] 獨立 fact-check（subagent）重審 → PASS（零必修）

## 異動日誌
- 2026-09-07 研究 subagent（DRAPI+DAS）、初稿（誤框「DAS 唯讀」）、SVG、標題（Opus 4.8）
- 2026-09-07 使用者指路 das-api-specs → 直讀 data.yaml 證實 DAS 有附件 CRUD → 全篇重寫、重畫圖、
  修 diversity（das-specs 50%→33%）（Opus 4.8）
- 2026-09-07 使用者追問「誰的誤解」→ 拿掉「常見誤解」模糊歸因、改據實；重審 → PASS（Opus 4.8）
