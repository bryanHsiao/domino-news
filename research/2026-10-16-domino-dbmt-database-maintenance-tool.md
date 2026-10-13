---
slug: domino-dbmt-database-maintenance-tool
title: "DBMT(database maintenance tool):整合 compact+updall+fixup、執行緒/時間窗、-ods 換 DBIID"
lang: [zh-TW, en]
pubDate: 2026-10-16
status: Path A staged（_pending，排 2026-10-16）
tags: [Domino Server, Admin, Performance]（TYPE 留白：概念＋設定解說）
requester: 使用者「挑 14~19 主題、先查新聞沒有再寫技術文」→ **原訂 10/16 @Transform/@Eval 經 grep 內文確認重複(已被 formula-list-processing 8/26、formula-errors-evaluation 8/31 寫完)→ 改採真缺口 DBMT**
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-dbmt-database-maintenance-tool

admin 維護型。補 10/08 維護指令那篇的最大空白:它只教單兵 compact/updall/fixup,沒講把三者整合排程的現代 task(dbmt)。並第三度扣回 translog/DBIID(`-ods` copy-style 換 DBIID)。

## 選題（換題紀錄）

- **原訂 10/16 = @Transform/@Eval**,動筆前照 [[feedback_coverage_check_not_filename_glob]] grep 內文 → **已被完整涵蓋**:
  - `@Transform`(map/filter/flatMap、@Nothing 丟、錯誤傳播)→ formula-list-processing(8/26)整篇就是它。
  - `@Eval`(字串當 formula、{}/""、view column 警告、context 決定)→ formula-errors-evaluation(8/31)。
  - → 判定重複、棄題。同理連帶發現原訂 10/18(@DbLookup/@DbColumn 成本)已被 formula-dblookup-dbcolumn(8/25)+dblookup-cache-64k(8/04)蓋、原訂 10/19 Java session.evaluate 的 SSJS 面已被 ssjs-session-evaluate-formula(10/05)蓋。
- **改採 DBMT**:grep `dbmt` 全站只在 domino-ods-versions(6/21)順帶提 `-ods` 旗標,**無專文**;10/08 維護指令也沒提 dbmt → 真缺口。又正好接 admin cluster、三度呼應 translog/DBIID。

## 核心（官方 WebFetch）

- Program document 頁(14.0.0):**「The dbmt tool relieves the administrator of the need to run the Updall task」逐字**;performs multiple daily/weekly maintenance;整合 compact+updall+fixup。選項:-ct(預設1、0=不壓縮、依碟數)、-ut(預設1、0不允許)、-cnd(每n天壓非系統庫)、-tl(限 compact 分鐘、不管 updall)、-ncl(到上限讓正在壓的壓完不起新)、-range(啟動時跑一次用)/-stoptime(每天跑用)、-force(挑星期幾對連5+次壓縮失敗的庫跑 fixup;0=任一天,1=Sun)、-ftiNdays(每n天重建FTI,預設只壞才建)、-ods(copy-style 升 ODS、只升不降、跳過已達標的庫)。範例 `-compactThreads 8 -updallThreads 8 -range 2:00AM 7:00AM -compactNdays 5 -force 1`。
- updall-options-dbmt 頁(14.0.0):dbmt 取代 nightly updall;房務(purge deletion stub／expire soft-delete／update unread)→ 來源頁(WebSearch 摘要);updall `-nodbmt` 單跑跳過。**此條待 fact-check 回頁面逐字確認**。
- indirect files 頁(12.0.2):.ind 間接檔對一組庫跑維護。
- DBIID 橋接:`-ods` = copy-style(官方措辭)→ 換 DBIID(10/13 translog 已立)→ 做完補完整備份。

## 措辭守則

- dbmt 整合、取代 **nightly updall**——別寫成「取代 compact」或「取代所有維護」。
- -ct 可設 0(關 compact)、-ut 不可設 0——兩者別搞混。
- fixup 只在**連 5 次以上壓縮失敗**才跑——別寫成「每晚 fixup」。
- `-ods` 是 copy-style、換 DBIID——別把它當日常節奏;其餘例行壓縮不要硬斷言 in-place/DBIID 行為(官方該頁沒明講 default style,只確定 -ods 是 copy-style),故只在 -ods 上連 DBIID。
- 房務三項(stub/soft-delete/unread)必須有頁佐證才寫,否則軟化(等 fact-check)。

## 站上互連

- 連 10/08 維護指令（單兵 vs 編隊,hook＋收尾兩處）。
- 連 10/13 translog（-ods 換 DBIID、fixup 退後備）。
- 連 6/21 ODS 版本（-ods 升級路徑）。

## 標題候選

- [汰除] 名詞平述：`認識 dbmt` — 太泛。
- [選定] 痛點＋機制：`DBMT(Database Maintenance Tool):別再每晚排 compact、updall、fixup 三個 task,一條指令收完、還自己控執行緒與時間窗`
  — 直接打「每晚排三個 task」的痛點 + dbmt 收成一條的機制 + 控執行緒/時間窗;標題自決。
  en 鏡像：`DBMT (Database Maintenance Tool): Stop Scheduling compact, updall, and fixup as Three Nightly Tasks — One Command Does It, with Thread and Time-Window Control`

## 查證 checklist

- [x] dbmt Domino 9 起、Program document、整合三者、取代 nightly updall（逐字）
- [x] 選項 -ct/-ut/-cnd/-tl/-ncl/-range/-stoptime/-force/-ftiNdays 語意
- [x] -ods copy-style、只升不降、跳過已達標；換 DBIID 橋接 10/13
- [x] 範例指令語意
- [x] indirect .ind 檔
- [x] inline-link diversity：3 相異官方 URL 各 33%（Program／updall-dbmt／indirect）；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin + Performance
- [x] 雙語 temp-build 通過；內部連結 slug 確認(maintenance-commands-playbook／transaction-logging／domino-ods-versions)
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ **十條全部成立、零錯誤**。特別盯的兩條都過:第 2 房務三項官方 updall-options-dbmt 頁逐字「purges deletion stubs / expires soft deleted entries / updates unread lists」✓;第 8 `-ods` 官方明講「performs copy-style compacting to upgrade databases to the server's ODS level, and never downgrades」✓(跳過已達標:「only upgraded if they are below the ODS level...」)。逐字命中:「The dbmt tool relieves the administrator of the need to run the Updall task」、「Fixup is run only when 5 or more consecutive compact operations fail」、`-force` 0/1/2 對照、範例指令。三處依建議處理:
  - ①「Domino 9 起」官方 14.0 頁未逐字宣稱,最早文件為 9.0.1 → 屬可接受共識,保留「Domino 9 起」(dbmt 自 9.0.1 文件存在)。
  - ②官方用「disks」非「spindles/實體碟」→ zh 改「幾顆碟(disks backing the data directory)」、en 改「how many disks」。
  - ③「copy-style 換 DBIID」非 dbmt 頁出處(一般 compact 知識)→ 本文已把這點歸因給 10/13 translog 文的「換 DBIID」論述,`-ods` copy-style 本身引 dbmt 頁,兩者分開標注 ✓(未動)。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域有 Admin notebook，但本 session NotebookLM 瀏覽器狀態延續問題未解,改以官方 HCL 文件 WebFetch 為據(研究鏈允許 fallback、已揭露)。官方頁均 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-13 新建（排 2026-10-16）。**原訂 @Transform/@Eval 經 grep 內文判定重複、換題 DBMT**;官方三文為據;連 10/08＋10/13＋6/21;humanizer 自審;Path A staged。（Opus 4.8）
