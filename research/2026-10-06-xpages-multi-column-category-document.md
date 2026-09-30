---
slug: xpages-multi-column-category-document
title: "XPages 多欄位分類、下一欄仍分類→文件不顯示（12.0.2 regression）"
lang: [zh-TW, en]
pubDate: 2026-10-06
status: staged（_pending，排 2026-10-06，Path A）
tags: [XPages, Admin]
requester: 使用者（先貼 DISABLE_REFIND_IN_READENTRIES KB 段落 + 誤給 KB0113007/「&count 數量不對」→ 後更正：無 KB 號、真實來源是 KB0102504，症狀是 XPages 多欄分類文件不顯示）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS（乾淨）。症狀「12.0.2 shows the category but not the document」、workaround 兩句、SPR# PJONB7GRUL/MNIACMGKUV、Resolved 12.0.2FP3+14.0、伺服端 notes.ini——全對 KB0102504 逐字。FoCul「did not work」逐字、與 KB0102504 明確不混談。唯一 nit：「同 ?ReadViewEntries 機制」為作者推論、已框成自述、免改。
created: 2026-10-06
updated: 2026-10-06
---

# 研究軌跡 — xpages-multi-column-category-document

admin/troubleshooting「已知問題 + workaround」型。

## 重大更正經過（來源與症狀都改過）

1. 使用者第一則：貼 DISABLE_REFIND_IN_READENTRIES 的 KB 段落 + 給「KB0113007、症狀＝分類視圖 &count 數量不對」。我據此寫了第一版（slug `domino-readviewentries-count-regression`）並已 commit。
2. 使用者第二則：「XPages 多欄位分類、下一欄亦為分類時取不到文件內容」。
3. 使用者更正（關鍵）：**「按太快、我根本沒有 KB 號碼」**，內容其實來自 xred.com.tw 一篇轉貼，**不想引 xred、要真實來源**。
4. 查證：xred 那篇其實引的是 **KB0102504**（不是 KB0113007），症狀正是第二則那個。**用內建瀏覽器打開 KB0102504（公開、非 gated）逐字讀取**——證實第一、二則是**同一個 issue**，且我第一版的「KB0113007 + &count 數量不對」**號碼與症狀都錯**。
5. 處置：**git mv 改名 + 整篇重寫**，改建在真實公開的 KB0102504、改症狀為「XPages 多欄分類、下一欄仍分類→只顯示分類、文件不顯示」。呼應 [[feedback_no_vague_community_consensus]]（要真來源、別將就轉貼/錯號）。

## 來源（KB0102504 為公開第一手，瀏覽器逐字讀）

- **KB0102504**（[HCL 客戶支援](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504)，公開 Defect Article）逐字：
  - 標題「XPages: Unable to get document when filtering a multi-column category and the next column is a category」；Applies to 12.0.2。
  - 「12.0.1 shows the category and document correctly. 12.0.2 shows the category but not the document.」
  - Workaround：「This is a regression caused by another issue (SPR# PJONB7GRUL) that was fixed in 12.0.2. Setting the notes.ini parameter DISABLE_REFIND_IN_READENTRIES=1 on the server, will restore the normal behavior before the fix.」
  - Resolved version「HCL Domino 12.0.2FP3, 14.0」；「reported via SPR#MNIACMGKUV」。
- **?ReadViewEntries URL commands**（[9.0.1 官方](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html)）：ReadEntries＝讀 view entries 的機制（XPages 底層同源）。
- **FoCul**（Nomad Web 1.07）：同參數在該變體「did not work」→ 標為「workaround 不保證通用」。
- **不引用**：xred.com.tw（社群轉貼，使用者明確不要）、KB0113007（使用者誤給的錯號、且 gated 不存在公開記錄）。
- 未跑 NotebookLM（notes.ini/XPages regression，官方 KB 逐字足）。

## 查證 checklist

- [x] 症狀/成因/workaround/Resolved version 全對 KB0102504 逐字
- [x] SPR# PJONB7GRUL / MNIACMGKUV 對 KB
- [x] ReadEntries 機制對 ?ReadViewEntries 官方
- [x] 「refind」為參數名+KB 推得的機制解釋、非官方逐字
- [x] FoCul 變體「同參數無效」正確、標為 Nomad Web
- [x] DISABLE_REFIND_IN_READENTRIES=1＝伺服端 notes.ini+重啟、stopgap（正解升 FP3/14.0）
- [x] TYPE 留白；tags XPages + Admin
- [x] inline-link diversity：3 相異外部（KB0102504 / URL commands / FoCul）
- [x] 雙語 temp-build（改寫後 + 真實案例補寫後）
- [x] fact-check：初版 PASS（KB0102504 逐字）＋補寫段 VERIFIED（`\` 子分類分隔符對官方 Designer help）

## 真實案例補寫（`\` 子分類分隔符）

使用者提供同事實際遇到的 XPages 附件問題（兩張截圖：view 直欄公式 `DocNo + "\\" + FieldCode`、XPages 單一分類 filter `FormNumber + "\\File"`；DB 放上 R12/12.0.2 後同一分類永遠只看到第一筆檔案、刪掉才冒下一筆；使用者當時請他把 `\\` 拿掉就正常）。判定與 KB0102504 高度吻合：`\` 是 Domino 分類欄的**子分類分隔符**，`DocNo + "\\" + FieldCode` 不是平字串而是**兩層分類**，正好造出「下一欄仍是分類」的觸發條件；「拿掉 `\\`＝去巢狀化」與 `DISABLE_REFIND_IN_READENTRIES=1`（關 refind）殊途同歸，正解仍是 12.0.2 FP3 / 14.0。

- 動作：zh 與 en 各加一節（zh「實務上怎麼冒出來:一個 \ 就把視圖做成巢狀分類」/ en「How it shows up in practice: one \ turns a view into nested categories」），插在「為什麼/Why」與「暫解/Workaround」之間。含實用檢查：踩到症狀卻沒想做多層分類時，回頭看分類欄公式有沒有不小心的 `\`。
- 未新增 inline link（維持原 3 相異外部 URL 的多樣性）；未動 frontmatter。temp-build 雙語通過（332 pages）。
- fact-check：獨立 subagent 查「`\`＝Domino 分類欄子分類分隔符（含 computed column）」對官方 HCL 文件 → **VERIFIED**。Domino Designer help「Examples: Generating category names」逐字「A backslash ( \ ) after a main entry denotes the subcategory name」（`Bedroom\Beds` 等例；且另半頁正是 `@Month`/`@If` 的 computed 分類欄，證實 computed 值也拆層）；最多 32 層（Sorting documents in views）。**load-bearing 但書：拆層只在欄位設為「分類(Categorized)」時發生**，同值放「排序」欄會原樣顯示 `ABC\File`——已把這句補進雙語措辭。分隔符固定為 `\`、不可設定。XPages 專屬 doc 無逐字，故 XPages 面向以「view index 帶層、XPages 控制項呈現」自述、未硬掛引用。
  - 來源：https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_GENERATING_CATEGORY_NAMES_EX.html 、 https://help.hcl-software.com/dom_designer/10.0.1/basic/H_ABOUT_SORTING_DOCUMENTS_IN_VIEWS.html

## 異動日誌

- 2026-10-06 初版誤建於 KB0113007/&count（使用者按太快給錯）→ 使用者更正、真實來源 KB0102504。git mv 改名 + 整篇重寫，改引公開 KB0102504（瀏覽器逐字）；標題自決；temp-build；重新 stage 排 10/06。（Opus 4.8）
- 2026-10-06 補「真實案例：`\` 子分類分隔符」一節（雙語），呼應使用者同事的 XPages 附件案例；temp-build 通過。（Opus 4.8）
