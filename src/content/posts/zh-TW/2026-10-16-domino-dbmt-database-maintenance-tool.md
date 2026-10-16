---
title: "DBMT(Database Maintenance Tool):別再每晚排 compact、updall、fixup 三個 task,一條指令收完、還自己控執行緒與時間窗"
description: "維護指令那篇教你一個個下 compact、updall、fixup;但正式環境沒人半夜手動下——傳統做法是排一堆 Program document 每晚跑。Domino 9 起的 dbmt(database maintenance tool)把這些收成一條:官方說它「relieves the administrator of the need to run the Updall task」,一個 task 就做掉 compact + updall +(必要時)fixup,還能用執行緒數、時間窗、每幾天壓一次來控節奏。這篇講 dbmt 在做什麼、怎麼從 Program document 跑、compact 面(-ct／-cnd／-tl／-range／-force)與 updall 面(-ut／-ftiNdays)的關鍵開關,以及 -ods 這個會做 copy-style、換掉 DBIID 的特例——為什麼它跟交易日誌、ODS 升級綁在一起。"
pubDate: 2026-10-16T07:30:00+08:00
lang: zh-TW
slug: domino-dbmt-database-maintenance-tool
tags:
  - "Domino Server"
  - "Admin"
  - "Performance"
sources:
  - title: "Running the database maintenance tool from a Program document(dbmt 取代每晚 updall、compact/updall/fixup 整合、-ct/-ut/-cnd/-force/-tl/-range/-stoptime/-ods 選項與範例)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_running_the_database_maintenance_tool_from_a_program_document_t.html"
  - title: "Option to run Updall as part of dbmt(dbmt 取代 nightly updall、房務工作、updall -nodbmt 跳過)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_updalloptions_dbmt.html"
  - title: "Indirect files to save time running maintenance tasks(用 .ind 間接檔對一組庫跑維護)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/indirect_files_to_save_time_running_maintenance_tasks.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-dbmt-database-maintenance-tool.webp"
coverStyle: "pencil-sketch"
---

[維護指令那篇](/domino-news/posts/domino-maintenance-commands-playbook/)教你一個個下 `compact`、`updall`、`fixup`。但正式環境沒人半夜手動下——傳統做法是排一堆 Program document,每晚跑 `updall`、再另外排 `compact`。Domino 9 起有個 **dbmt(database maintenance tool)** 把這些收成一條:官方一句話——**「The dbmt tool relieves the administrator of the need to run the Updall task」**,一個 task 就做掉 compact + updall +(必要時)fixup,還能用執行緒數、時間窗、每幾天壓一次來控節奏。

---

## 重點摘要

- **是什麼**:Domino 9 起的維護 task,從 **Program document** 跑,一條指令整合 **compact + updall + fixup**,取代「每晚單獨跑 updall、再另排 compact」那套。
- **怎麼控**:用執行緒數(compact 幾條、updall 幾條)、**時間窗**(幾點到幾點)、**每 n 天壓一次**來排節奏;跑完就結束。
- **compact 面**:`-ct`(compact 執行緒,0=不壓縮,依資料目錄後面幾顆碟決定條數)、`-cnd`(每 n 天壓所有非系統庫)、`-tl`(限制總壓縮分鐘數,不管 updall)、`-range`/`-stoptime`(時間窗)、`-force`(挑星期幾對「一直壓不掉」的庫跑 fixup)。
- **updall 面**:`-ut`(updall 執行緒,**0 不允許**)、`-ftiNdays`(每 n 天重建全文索引,預設只在壞掉時重建)。
- **一個特例 `-ods`**:做 **copy-style** 壓縮把庫升到伺服器的 ODS 版本(**只升不降**)。copy-style 會**換掉 DBIID**——所以它跟[交易日誌](/domino-news/posts/domino-transaction-logging/)、[ODS 版本](/domino-news/posts/domino-ods-versions/)那兩篇綁在一起:做完要補一次完整備份。

## 它在做什麼:一個 task 收三件事

`dbmt` 是「每天/每週對 mail file 和其他庫做多項維護」的 task。它把三件原本要分開排的事收進一條指令:

- **compact**:回收空間。
- **updall**:更新檢視索引與全文索引,並做例行房務——官方說 dbmt 會[接手 updall 那套工作](https://help.hcl-software.com/domino/14.0.0/admin/admn_updalloptions_dbmt.html):清 deletion stub、過期 soft-delete、更新 unread 清單。
- **fixup**:**只在**某個庫「連續 5 次以上壓縮失敗」(且不是因為庫正在使用中)時才對它跑——是個**後備**,不是每晚全掃(這跟[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)講的「有日誌時 fixup 退成後備」一致)。

所以 dbmt 不是「又一個維護指令」,而是把 [10/08 那篇](/domino-news/posts/domino-maintenance-commands-playbook/)的單兵指令,編成一套**會自己排程、控執行緒、守時間窗**的隊形。

## 怎麼跑:Program document + 一行參數

`dbmt` 一般從 **Program document** 跑([官方頁](https://help.hcl-software.com/domino/14.0.0/admin/admn_running_the_database_maintenance_tool_from_a_program_document_t.html))。官方給的範例一行:

```
-compactThreads 8 -updallThreads 8 -range 2:00AM 7:00AM -compactNdays 5 -force 1
```

拆開看:compact 和 updall **各 8 條執行緒**、只在**凌晨 2 點到 7 點**這個窗內做、**每 5 天**把所有非系統庫壓一次、對一直壓不掉的庫**星期日**跑 fixup。一行就把「壓多兇、什麼時候壓、多久壓一次、壞掉怎麼辦」講完了。

如果你不想對整台伺服器掃,而是只針對**一組特定的庫**跑,可以搭配[間接檔(indirect / `.ind` 檔)](https://help.hcl-software.com/domino/12.0.2/admin/indirect_files_to_save_time_running_maintenance_tasks.html)——把要維護的庫路徑列進一個 `.ind` 檔,再讓維護 task 吃那個清單。

## compact 面的開關

- **`-compactThreads` / `-ct`**:compact 執行緒數,**預設 1**;**設 0 就完全不壓縮**。官方建議**依資料目錄後面有幾顆碟**(disks backing the data directory)來決定——碟多才開多條,不然會互相搶 I/O。
- **`-compactNdays` / `-cnd`**:每 **n 天**把所有非系統庫壓一次。
- **`-timeLimit` / `-tl`**:限制**總壓縮時間**(分鐘);**只管 compact、不管 updall**。
- **`-nocompactlimit` / `-ncl`**:碰到時間窗或 `-tl` 上限時,讓**正在壓的**壓完,但**不再起新的**。
- **`-range`** 與 **`-stoptime` / `-st`**:控時間窗。`-range` 給「只在伺服器啟動時跑一次」的 Program document 用(睡到 starttime、壓到 stoptime);`-stoptime` 給「每天跑」的 Program document 用。
- **`-force` / `-f`**:挑**星期幾**對「老是壓不掉」的庫跑 fixup(0=任何一天、1=星期日、2=星期一…)。重點是**連續 5 次以上壓縮失敗**才會觸發,不是每個庫都 fixup。

## updall 面的開關

- **`-updallThreads` / `-ut`**:updall 執行緒數,**預設 1**;注意**不能設 0**(compact 可以設 0 關掉,updall 不行)。
- **`-ftiNdays` / `-fnd`**:每 **n 天**重建一次全文索引;**預設只在索引壞掉時才重建**,不會沒事重建。

如果你某次只想**單獨跑一次 updall**、不想連帶做 dbmt 那套房務,`updall` 有個 **`-nodbmt`** 可以跳過那些工作,讓這次 updall 跑快一點。

## -ods:會換 DBIID 的特例

大多數開關做的是**就地**的例行壓縮與索引維護。但有一個要特別小心:

- **`-ods`**:做 **copy-style 壓縮**,把庫升到**伺服器的 ODS 版本**(**只升不降**),並**跳過已經在目標 ODS 的庫**,不做白工。

關鍵在 **copy-style**:它等於把整個庫重寫一份,會**換掉 DBIID**。而[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)講過,換 DBIID 會讓舊日誌失效——所以跑完 `-ods` 要**補一次完整備份**。要不要升 ODS、升到哪一版,看[ODS 版本那篇](/domino-news/posts/domino-ods-versions/);這裡只要記住:`-ods` 不是日常節奏的一部分,是個有副作用的升級動作。

## 小結

- **是什麼**:Domino 9 起的 dbmt,從 Program document 跑、一條指令整合 compact + updall + fixup,取代每晚單獨跑 updall。
- **怎麼控**:執行緒數(`-ct`/`-ut`)、時間窗(`-range`/`-stoptime`/`-tl`/`-ncl`)、每幾天壓一次(`-cnd`)、全文索引幾天重建(`-ftiNdays`)。
- **fixup 是後備**:只對「連 5 次以上壓縮失敗」的庫、在 `-force` 指定的星期幾跑。
- **`-ods` 要小心**:copy-style、只升不降、**換 DBIID → 做完補完整備份**。
- **跟 10/08 的關係**:[維護指令那篇](/domino-news/posts/domino-maintenance-commands-playbook/)是單兵指令,dbmt 是把它們編成會排程、控資源的隊形。
