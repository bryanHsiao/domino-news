---
title: "MakeNotesFaster webinar 筆記：Notes 慢多半是設定、不是老筆電——ODS、cache.ndk 迷思與一張週一清單"
description: "panagenda 的 Christoph Adler 在 MakeNotesFaster webinar 上，把 Windows 上 HCL Notes 14.5.1 FP1 客戶端的效能拆成兩個決定：跑對版本、設對設定。這篇記下對管理者最有用的幾點——一個真實客戶的慘烈數字、ODS 為什麼每次開檔都在偷時間、cache.ndk 該不該定期刪（他直接打破迷思）、資料目錄別放網路碟、防毒排除清單的三個陷阱，以及他收尾那張『週一早上檢查清單』。"
pubDate: 2026-09-26T07:30:00+08:00
lang: zh-TW
slug: panagenda-makenotesfaster-webinar
tags:
  - "Performance"
  - "Admin"
  - "Community"
sources:
  - title: "MakeNotesFaster webinar（panagenda，隨選觀看）"
    url: "https://www.panagenda.com/webinars/makenotesfaster1/"
  - title: "MakeNotesFaster 簡報 PDF（panagenda，2026-09-15）"
    url: "https://www.panagenda.com/download/webinar/20260915_EN_HCL_Webinar_Slides_MakeNotesFaster.pdf"
  - title: "What's new in Domino 14.5.1 Fixpack 1 — HCL（官方）"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html"
relatedJava: []
relatedSsjs: []
---

panagenda 上架了一場很值得看的 webinar：[MakeNotesFaster](https://www.panagenda.com/webinars/makenotesfaster1/)，由 Head of Solution Consulting **Christoph Adler**（與 Senior Solution Architect Marc Thomas）主講，主題是 Windows 上 HCL Notes 14.5.1 FP1 客戶端的效能。整場的定調很直接：「Notes 慢」很少是無解的 Notes 問題，通常收斂成兩個決定——**跑哪個版本、以及怎麼設定它**。範圍鎖在 Notes Standard client 的本機設定（不含 Domino server 調校、Nomad、macOS、應用程式設計）。這篇把對管理者最有用的幾點記下來。

## 重點摘要

- **慢是設定問題，不是老筆電**：他現場給了一組真實客戶數字，證明爛設定在新硬體上也能讓 Notes 慢到離譜。
- **ODS[^ods] 是啟動時間的隱形殺手**：資料庫檔案結構版本太舊，client 每次開檔都要在記憶體裡逐級向上轉換——`names.nsf` 卡在舊 ODS 就能吃掉 60 秒啟動。
- **cache.ndk 別再定期刪**：他直接把「要固定清 cache.ndk」列為 Myth；正解是調 quota、不是刪檔。
- **資料目錄絕不放網路碟**（含 folder redirection、roaming profile、OneDrive 同步）——他把這條列為「其他之前先修」的第一優先。
- **防毒排除不是把保護關掉**：是給一份窄、可稽核的清單，還有三個「看起來設了、其實沒效」的陷阱。
- 收尾是一張可照做的**「週一早上檢查清單」**。

## 先看代價：慢是設定、不是老筆電

Adler 開場就丟出一個上週實測的客戶案例：**16,000 users、專業服務業、現役硬體、沒設任何防毒排除**，從 9.0.1 升到 14.0 FP5、沒做什麼效能優化。結果：

| 動作 | 實測 | 健康值 |
|---|---|---|
| 冷啟動 | **2+ 分鐘** | < 10 秒 |
| 熱啟動 | **35–40 秒** | 最多 5 秒 |
| 客戶端升級 | **22 分鐘** | 4–8 分鐘 |

他強調這是**新硬體**跑出來的——「是爛設定、不是老筆電」造成的。換算給你聽：每天兩次、每次多等 30 秒，乘上 1,000 個 user，就是**每個工作日 17 小時的等待**。效能是使用者體驗指標，使用者體驗是商業指標。

## ODS：每次開檔都在偷時間

這段最值得記。**ODS（On Disk Structure）** 是資料庫檔案本身的實體結構——是容器、不是內容。每個 Notes/Domino 版本都有一個它原生使用的 ODS 版本，而 client **無法原生打開比它舊的 ODS**：它會把檔案在記憶體裡**逐級向上轉換**到自己原生的版本，才打開。關鍵是——**這件事每次開檔都做一遍，不是一次性的**。

具體代價：一個停在舊 ODS（例如 ODS 20）的 `names.nsf`，在 14.5.1 FP1 client 上光這一個檔就是**至少 60 秒**的啟動時間，而 `names.nsf` 是每次 client 啟動都要讀的。

好消息是**自 12.0.2 起，升級 Notes client 會自動把 data 目錄裡的本機資料庫升到最新 ODS（55）**，並取代過去那些用 notes.ini 控制的舊參數（server 端不會自動轉、14/14.5/14.5.1 行為不變）。這裡要說清楚一個區別：以上是 client 對「既有本機 DB」的自動升級；而「新建 DB 的預設 create ODS」是另一回事——官方表上新建的預設其實仍是 ODS 52，要直接建在 55 得靠 `Create_R12_Databases=1`（站上 [ODS 版本演進、什麼時候會升](/domino-news/posts/domino-ods-versions) 有完整拆解）。要付的是一次性成本：第一次開檔會做 copy-style compact + 完整 view rebuild，要留約「最大本機 NSF 兩倍」的磁碟空間，而且**升級後第一次啟動是最慢的一次，先跟使用者講**。

於是 notes.ini 裡那堆 ODS 老參數該清一清（他給了一張 verdict 表）：

- `CREATE_R8/R85/R9/R10_DATABASES` → **移除**（會把新建/compact 後的 db 釘在 55 以下）
- `NSF_UpdateODS=1` / `NSF_AlwaysUpdateODS=1` → **移除**（12.0.2 起被自動升級取代或已是預設）
- `NSF_AlwaysUpdateODS=0` → **移除**（它會擋掉自動升級，除非你是刻意暫時這樣）
- `CREATE_R12_DATABASES=1` → 留著（要讓新建 DB 直接落在 ODS 55 就靠它；也讓設定明確、避免舊的 `CREATE_R*` 贏過它）

他的一句話：移除參數，也要移除那個會把參數再推回去的 policy。（這一整包都是 14.5.1 FP1 的脈絡，版本層面可對照 [FP1 總覽](/domino-news/posts/domino-1451-fp1)。）

## 別放網路碟、一個 replica ID 一份

第二大主軸是檔案系統。**data 目錄（連同 program 目錄）必須放在本機、直接掛載的儲存上**——他特別點名容易被忽略的變形：mapped drive／UNC／DFS／home drive／NAS、Windows 的 folder redirection、logon 時複製 data 目錄的 roaming profile、範圍涵蓋 data 目錄的 OneDrive Known Folder Move、以及「本機磁碟其實是遠端 volume」的 non-persistent VDI。放網路碟的代價是：本機微秒級的讀取變成 SMB 上的毫秒級（一個 session 幾千次）、網路一抖就 corruption、抓不到重現的 crash、logon/logoff storm。

還有一條：**一個 data 目錄裡，每個 replica ID 只能有一份**。`File > Application > New Copy` 會產生新的 replica ID，但**用 Windows 複製檔案不會**——所以 `mail (1).nsf`、還原時擺在原檔旁邊的備份、「我升級前先備份一下」，都會製造同 replica ID 的兩份。後果是複製跑到錯的檔、無謂的 save conflict、未讀標記與資料夾成員漂移（未讀標記為什麼會漂，見 [Notes 未讀標記](/domino-news/posts/domino-unread-marks)）。**改名沒用，replica ID 跟著檔案走。**

## cache.ndk：別再定期刪它

這段最對站上胃口——他直接**打破迷思**。先分清三個檔的刪除代價差很多：

| 檔案 | 存什麼 | 刪掉的代價 |
|---|---|---|
| `cache.ndk` | 從 server 快取的設計元素（form、view、script library…） | 只是變冷快取 |
| `desktop8.ndk` | 工作區：每個用過的 db、設計元素清單、指標 | 所有工作區分頁、icon 等更多東西都要手動重建 |
| `bookmark.nsf` | 書籤、工作區頁、個人化（如 view 欄位順序） | 書籤與每一項個人化設定全沒 |

（順帶一提：HCL 文件到現在還寫 `desktop6.ndk`，但 14.5.1 的 data 目錄裡實際是 `desktop8.ndk`。）

然後是三條迷思的裁決：

- **「cache.ndk 要定期刪」→ Myth。** 它是「診斷用、清一次」的動作，不是維護工作。
- **「cache.ndk 很大本身就是問題」→ 多半是 Myth。** 大小是症狀，該查的是背後那些應用。
- **「快取損毀是常見根因」→ 有，但遠比被歸咎的次數少。**

正解是**用 quota、不是刪檔**：cache 有配額、預設 30 MB，一直撞配額的 client 是在 thrashing（逐出、重抓、逐出、重抓）。做法是先確認有沒有人撞到、再把配額**調高不是調小**（改 ini 不會縮小既有檔，之後刪一次讓它在新上限下重建）。順序是：先搞定基礎設施（data 目錄放本機 SSD、排除 AV/EDR、移出 profile sync 與 OneDrive）→ 再調 quota → 才做那一次性刪除。真的要清單一應用，可以開 cache.ndk 的 `ByURL`／`ByURLCat` view、按 replica ID 精準刪那個 app 的元素，不必連坐整個快取。

## 防毒排除：不是把保護關掉

他用 Microsoft Defender 當例子（原則通用、語法各家不同）。掃描器對 Notes 特別狠，是因為 Notes 有**幾千個小檔**持續讀寫，每次都被 AV 引擎多評估一次——傷的是次數不是檔案大小；而且掃描器在很低的層級運作，可能鎖住或隔離 Notes 正在用的檔，一路到 crash。

14.5.1 FP1 的排除集合是**三個目錄 + Notes 自己的執行檔**（process 排除要用完整路徑）。他點名三個「主控台看起來對、對 client 卻沒效」的陷阱：

1. **環境變數**：排除字串裡的環境變數展不開就等於沒設。
2. **只用檔名（image name）**：檔名會匹配裝置上任何同名執行檔；用完整路徑才綁到寫保護 program 目錄裡那一個。
3. **釘死 build 資料夾**：`notes2.exe` 的路徑含 plug-in build level、每次 fix pack 都會變，釘死就會**悄悄失效**——要用萬用字元。

還有一個：資料夾排除不涵蓋 **reparse point（junction）** 子資料夾，而 profile container 與 folder redirection 會產生 junction，每個要另外加。他的立場很清楚：這不是把保護關掉，是給安全團隊一份**窄、可稽核、每條都有理由與複驗日期**的範圍——排程掃描、EDR、行為偵測、對非 Notes 程序的即時防護，全都還開著。

## 收尾：一張「週一早上檢查清單」

Adler 把整場濃縮成一張可照做的清單：

1. 把 data 目錄從所有網路路徑、redirection、同步範圍裡搬出來
2. 驗證三個 Notes 路徑與 Notes 執行檔的 AV 排除（完整路徑、`notes2.exe` 用萬用字元）
3. 裝 14.5.1 FP1，之後**再驗一次**排除
4. 移除指向已不存在 server 的 icon、書籤、replicator 條目
5. 清乾淨對應的 connection／account 文件（用 FQDN、不要 IP）
6. 清 notes.ini：舊 port、`DELEGATED_*`、過時的 ODS 參數，以及會把它們再推回去的 policy
7. 別再刪 cache.ndk——先看 `log.nsf` 有沒有配額訊息，再調高配額
8. 一個 replica ID 一份本機副本，並排程本機 compact
9. 一份 location 文件，中央定義、每次啟動強制套用
10. 前後各量一次——兩個碼表數字最能讓工單有底氣結掉

## 去哪看

完整內容（含每一段的操作細節與 Defender 的 PowerShell 範例）在 [panagenda 的 MakeNotesFaster 頁面](https://www.panagenda.com/webinars/makenotesfaster1/)隨選觀看，[簡報 PDF](https://www.panagenda.com/download/webinar/20260915_EN_HCL_Webinar_Slides_MakeNotesFaster.pdf) 也可下載。panagenda 這個系列還有下一場（簡報末頁預告 2026-10-20）。

[^ods]: ODS（On Disk Structure，磁碟結構）是 NSF/NTF 資料庫檔案的實體格式版本——決定檔案在磁碟上怎麼組織，跟裡面的文件內容無關。每個 Notes/Domino 版本原生使用某個 ODS 版本；ODS 55 是目前最高的版本。
