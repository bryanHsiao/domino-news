---
title: "Domino for Linux 的大小寫陷阱：URL 大小寫錯為什麼時通時 404，path cache 把它藏起來"
description: "Domino 從 Windows 搬到 Linux 後，一個大小寫打錯的 URL（實體是 /FFH/ 但你打 /ffh/）有時 404「File does not exist」、有時又正常——同一支 URL 時好時壞，查的時候偏偏又好了，於是大家以為沒事。真相是：Linux 的檔案系統分大小寫，而 Domino HTTP task 會把成功的路徑查找快取起來，所以只有『cache 冷 + 首次就打錯大小寫』才會現形。這篇用一台真實 R12（12.0.2 FP8）Linux 伺服器的三輪 curl 實測，示範怎麼乾淨重現這個陷阱、解釋它為什麼藏得住，並實測 symlink workaround 與治本做法。"
pubDate: 2026-10-09T07:30:00+08:00
lang: zh-TW
slug: domino-linux-path-case-sensitivity
tags:
  - "Domino Server"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Creating, updating, and deleting directory and database links（.dir／.nsf 連結檔）— HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_creatingupdatinganddeletingdirectoryanddatabasel_t.html"
  - title: "Case sensitivity of Domino database paths on UNIX/Linux（名稱只差大小寫的風險）— Data Protection for HCL Domino（官方產品文件）"
    url: "https://www.ibm.com/support/pages/known-issues-and-limitations-version-81x-data-protection-hcl-domino"
  - title: "URL commands for opening servers, databases, and views（server／appFileAndPath／name 皆 case insensitive）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
relatedJava: []
relatedSsjs: []
---

你把一個 Domino 應用從 Windows 搬到 Linux。在 Windows 上好好的一支 URL——比方 `/ffh/doc.nsf/...`，實體資料夾其實叫 `FFH`（大寫）——搬過來之後開始鬧脾氣：有時候回 `File does not exist`（HTTP 404），有時候又正常。

你想抓這個 bug，但偏偏每次你去開，它都是好的。於是這件事就被歸類成「偶發、重現不了、應該沒事」，擺著。

它不是偶發。它是**一定會發生、只是被藏起來**：Linux 的檔案系統分大小寫，所以 `/ffh/` 對不到實體的 `/FFH/`；但 Domino 的 HTTP task 會把「成功解析過的路徑」快取起來，只要有人用**正確大小寫**開過一次，之後連打錯大小寫也會通。所以你**只有在 cache 冷、而且首次就打錯大小寫**的那一瞬間才看得到 404——平常 cache 熱著，怎麼測都正常。這篇用一台真實運作的 R12（Domino 12.0.2 FP8，跑在 Linux／WSL2）實測，示範怎麼乾淨重現它。

---

## 重點摘要

- **根因**：Linux 檔案系統分大小寫（Windows 不分）。Domino 把 URL 的 `/FFH/doc.nsf` 這段對應到磁碟上實體的資料夾與 `.nsf` 檔名，大小寫對不上，OS 就說「沒這個檔」→ `File does not exist` / 404。
- **為什麼時通時 404**：行為上，Domino HTTP task 會**記住成功解析過的路徑**（像一份 path cache——內部機制官方沒文件化，但實測行為如此）。只要有人用正確大小寫（`/FFH/`）開過一次就「熱」了，之後連錯誤大小寫（`/ffh/`）也跟著通。所以 404 只在「**cache 冷 + 首次就打錯大小寫**」時出現。
- **別把兩種大小寫敏感搞混**：這個 cache 陷阱只在 **OS 檔案層**（資料夾名 + `.nsf` 檔名、只有 Linux、cache 熱了就恢復）。NSF **裡面**的設計元件（`.xsp`／view／form 名）是另一回事——它們在 Windows、Linux 上**一直**大小寫敏感、跟 cache 無關、也沒有 workaround，打錯就是打錯；而且兩者吐的 404 訊息不一樣，可以用來分辨（見下）。
- **重現的關鍵**：cache 熱著測不到。要乾淨重現，得先 `dbcache flush` + `restart task http` 把快取清掉，再用一個**中性 URL** 探伺服器 ready（不能拿目標路徑去探，會先把 cache 弄熱），然後搶在第一發就打錯誤大小寫。
- **治標**：OS symlink 或 Domino 原生 directory link 把小寫名字映射到實體大寫路徑。**治本**：應用端把所有 URL 統一成跟磁碟一致的精確大小寫。

## 現象：同一支錯誤大小寫 URL，時通時 404

把情境講清楚。磁碟上實體是這樣：

```
/local/notesdata/FFH/doc.nsf      ← 資料夾 FFH 大寫、檔案 doc.nsf 小寫
```

使用者（或舊的 Windows 連結）打的是小寫路徑 `/ffh/doc.nsf/...`。在 Windows 上這完全沒問題，因為 Windows 檔名不分大小寫；一搬到 Linux，`ffh` 和 `FFH` 是兩個不同的名字。

但你去測的時候，它又常常是好的。這就是最惱人的地方：**它不是「一直壞」，而是「時好時壞」**，而且你一旦手動去開（很可能順手打了正確大小寫、或之前已經有人開過），cache 就熱了，看起來一切正常。於是問題被低估、被擺著，直到某天一台剛重啟的伺服器、某個使用者的第一發剛好打了小寫——404。

## 為什麼：Linux 大小寫敏感 × HTTP task 的 path cache

兩件事疊在一起：

**第一，Linux 檔案系統分大小寫——而 Domino 的 URL 模型以為它不分。** 有意思的是，Domino 的 URL 命令本來把路徑設計成**不分大小寫**：[官方說明](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html)明寫 `server`、`appFileAndPath`（資料庫路徑）、`name` 都是 case insensitive，在 Windows 上也確實如此。但這份「不分大小寫」的承諾只到 Domino 這一層為止——真正去磁碟開檔的是底下的 Linux 檔案系統，**它分大小寫**。於是 `/FFH/doc.nsf` 這段對不上實體檔名時，OS 回報找不到檔案，Domino 吐 `File does not exist`。這就是陷阱的源頭：**Domino 說好的不分大小寫，在 Linux 的 OS 層破功了。** 官方在 UNIX／Linux 脈絡下也點過名：資料目錄裡**只差大小寫**的資料庫名會出事（[Data Protection for Domino 的已知限制](https://www.ibm.com/support/pages/known-issues-and-limitations-version-81x-data-protection-hcl-domino)就警告過這種「只差大小寫」的路徑會造成問題）。

**第二，行為上，成功解析過的路徑會被 HTTP task 記住。** 這是「時通時 404」的真正原因。一旦有人用正確大小寫 `/FFH/` 開過一次、解析成功，之後再進來——即使打的是錯誤的 `/ffh/`——也會順著那份已經熱好的狀態放行。（內部到底是「把解析結果快取」還是「把 db handle 開著」，官方沒文件化；但從實測看，行為就是如此，我後面用「path cache」當它的代稱。）所以錯誤大小寫**不是穩定地壞**，而是「冷的時候壞、熱了就好」。

這也解釋了為什麼這個陷阱這麼難抓：你要測它，手一賤先用對的大小寫開一下、或伺服器早被別人開熱了，就再也測不出來。

而且這份快取在**伺服器端**、不是使用者的瀏覽器——實測是全程從 server 本機用 `curl`、完全沒有瀏覽器，一樣重現、一樣會把 cache 弄熱。這有個放大隱蔽性的後果：**伺服器重啟後，第一個碰到該路徑的請求決定了這份 cache**。那個人通常是管理員、或多數人習慣打正確大小寫，於是 cache 一熱，之後**所有使用者、所有 client** 連打錯大小寫都正常。只有「重啟後剛好第一發就打錯大小寫」的那個倒楣鬼會中 404，而且只要別人用對的大小寫打過一次，他也跟著好了。於是整件事看起來就像「偶發、重試一下就好」的暫時 glitch——這正是它最難抓的地方。

## 實測重現（真實 R12 12.0.2 FP8）

我在一台真實運作的 Linux Domino（12.0.2 FP8，WSL2）上實測，實體是 `/local/notesdata/FFH/doc.nsf`。全部用 `curl` 看 HTTP code。三輪下來，前兩輪都「測不到」，第三輪才乾淨重現——過程本身就是重點。

**第一輪：cache 熱著直接測（測不到）**

```
/ffh/...  → 200
/FFH/...  → 200
```

因為這台之前已經被存取過、path cache 是熱的，兩種大小寫都通。很多人就是在這個狀態下測，得出「沒問題」的結論。

**第二輪：只做 `dbcache flush` 後測（還是測不到）**

```
首發 /ffh/ → 仍然 200
```

結論很有用：**單純 `dbcache flush` 不夠**。那份路徑解析的快取不在 dbcache 裡（doc.nsf 可能還開著、HTTP task 的快取也沒清到）。

**第三輪：`dbcache flush` + `restart task http` + 搶首發（乾淨重現 ✅）**

```
1. dbcache flush
2. restart task http
3. 先用中性 URL /homepage.nsf 探，連續 3 次 200，確認 HTTP 真的 ready
   （關鍵：不能拿 /FFH/ 或 /ffh/ 去探，否則就先把 cache 弄熱了）
4. [首發] /ffh/ （小寫）→ HTTP 404   ← File does not exist，重現！
5.        /FFH/ （正確大寫）→ HTTP 200  ← 把 cache 弄熱
6. 再     /ffh/ （小寫）→ HTTP 200    ← cache 熱了，錯誤大小寫也通了
```

兩個方法論重點：

- **要清的是 HTTP task 的快取，不是 dbcache**。`restart task http` 能讓它變冷，`dbcache flush` 單獨做不到。
- **探 ready 要用中性 URL**。你得確認 HTTP 起來了才打首發，但探針若用目標路徑（`/FFH/`）就會先把 cache 弄熱、毀掉這一發。拿一支無關的 `/homepage.nsf` 探，不污染目標路徑的 cache。

## 一條 URL 裡，哪幾段吃大小寫？

一支 `/FFH/doc.nsf/HomePage.xsp` 拆開來，不同段落的大小寫規則其實不一樣，別混為一談：

- **資料夾 + `.nsf` 檔名（`/FFH/doc.nsf`）→ 本文主角的 OS 層陷阱。** 這段是磁碟實體檔案，在 Linux 吃大小寫。它有「時間性」：cache 冷首發 404、熱了恢復，symlink／`.dir` 可解。資料夾（`FFH`／`ffh`）和 `.nsf` 檔名（`doc.nsf`／`Doc.nsf`）都實測過、行為一模一樣。
- **classic 的 view／form 名（`?OpenView`／`?OpenForm`）→ 不分大小寫。** 官方 URL 命令說明寫得很清楚，`name` 是 case insensitive，所以傳統的 `?OpenView=業務清單` 這類大小寫打錯了照樣開得到——這一段**不是**陷阱。
- **XPages 的 `.xsp` 頁名（`HomePage.xsp`）→ 大小寫敏感。** 這是實測到、而且跟上面兩者都不同的一條：`.xsp` 走 XPages runtime 自己的頁面查找，**大小寫敏感、Windows／Linux 都一樣、跟 OS 檔案系統和 path cache 都無關、也沒有 workaround**，只能打對。

`.xsp` 這條實測對照（帶登入 session，同一個正確路徑 `/FFH/doc.nsf`，只改 `.xsp` 頁名）：

```
/FFH/doc.nsf/HomePage.xsp  （頁名精確）→ 正常開啟
/FFH/doc.nsf/homepage.xsp  （頁名小寫）→ 404
/FFH/doc.nsf/HOMEPAGE.xsp  （頁名全大寫）→ 404
```

**一個很實用的鑑別點**：OS 層的大小寫失敗、跟 `.xsp` 頁名的大小寫失敗，吐的 404 訊息**不一樣**，可以反過來判斷你中的是哪一層——

- **OS 檔案層**（路徑 `/ffh` 大小寫錯）→ `錯誤 404　HTTP Web Server: HCL Notes 異常情況 - File does not exist`
- **XPages `.xsp` 層**（`.xsp` 頁名大小寫錯）→ `HTTP Web Server: 找不到項目異常`

看到 `File does not exist` 就查路徑（資料夾／`.nsf`）的大小寫，並想到它有 cache 時間性（可能只有冷 cache 首發才現形、symlink／`.dir` 可解）；看到「找不到項目異常」就查 `.xsp` 頁名的大小寫——那跟 OS、cache 都無關，純粹是頁名打錯、在哪個平台都一樣。（`File does not exist` 是 Domino 印的英文字串，中英文伺服器都一樣。）

## Workaround：symlink、Domino directory link、與治本

**治標一：OS symlink。** 在 data dir 建一個小寫的 symlink 指到實體大寫資料夾：

```
ln -s /local/notesdata/FFH /local/notesdata/ffh   # owner 要是 notes
```

實測有效：建了 symlink 之後，再跑一次「`dbcache flush` + `restart task http` + 搶首發 `/ffh/`」，**首發就是 HTTP 200**（對照沒有 symlink 時首發是 404）。Linux 在 OS 層把小寫 `ffh` 跟隨到實體 `FFH`，Domino 跟著 symlink 開 `.nsf`，cache 冷的首發也通。還有個佐證它解的正是「路徑那一關」：沒 symlink 時冷首發卡在路徑層、body 是 `File does not exist`；加了 symlink 冷首發變 200、body 則變成 Login 頁（`curl` 沒帶 session、被後面的認證層接手）——請求確實通過了 OS 路徑層、往下走到認證。
注意：symlink **只解一層**——你 link 了 `ffh`，但若別層還有大小寫不一致（例如 `Doc.nsf`）得各自再建；而且 data dir 裡的 symlink 對 `compact`／`fixup`／replication 可能有邊際效應，上正式環境前先測。

**治標二：Domino 原生的 directory link。** 不想動 OS symlink，可以用 Domino 自己的連結檔：directory link 是一個 `.dir` 副檔名的文字檔、database link 是 `.nsf` 副檔名的文字檔，內容是指向實體路徑的完整路徑（[官方說明](https://help.hcl-software.com/domino/14.0.0/admin/admn_creatingupdatinganddeletingdirectoryanddatabasel_t.html)）。它是 Domino 層的重導、跨平台，不依賴 OS symlink。實測一樣有效：在 data dir 放一個 `ffh.dir`、內容單行是實體路徑 `/local/notesdata/FFH`，同樣的冷 cache 首發 `/ffh/` 也變 **HTTP 200**。順帶一個實測發現：`.dir` 一般的認知是「指向 data dir 外的目錄」，但這裡 `FFH` 其實就在 data dir **裡面**，`.dir` 指內部子目錄一樣 work。官方提醒 UNIX 上 `.dir` 要指到子目錄（可以指 `/sales`、不能指 `/`），而且資料庫存取權還是由 ACL 控制、不是連結檔。

兩種治標放一起對照（都是乾淨冷 cache 首發、打小寫 `/ffh/` 的實測 HTTP code）：

| 作法 | 冷 cache 首發 `/ffh/` |
|---|---|
| 無 workaround | **404** |
| OS symlink（`ln -s FFH ffh`） | 200 |
| Domino `.dir` link（`ffh.dir` 內容＝`/local/notesdata/FFH`） | 200 |

**治本：應用端統一精確大小寫。** 上面兩個都是繞路。真正該做的是把應用裡所有的 URL、連結、`@DbName`／`Open` 路徑，全部對齊磁碟上的實體大小寫。symlink／directory link 是讓你先不炸、爭取時間，不是長久之計——多一層映射，日後維護、搬遷、備份都是多一個要記得的例外。（另外實測也 grep 過這台的 `notes.ini`，`case`／`path cache`／`nocase`／`lowercase` 這類關鍵字都沒有——就目前所知**沒有 `notes.ini` 層級的開關**能把路徑查找改成不分大小寫，只能靠上面的映射或治本。）

## 小結

Domino for Linux 的大小寫陷阱，難的不是「Linux 分大小寫」這件事本身，而是 **path cache 把它藏起來**：錯誤大小寫只在「cache 冷 + 首次打錯」時 404，平常熱著怎麼測都正常，於是被當成偶發擺著。要重現，得 `dbcache flush` + `restart task http` 清掉 HTTP task 的快取、用中性 URL 探 ready、再搶首發打錯誤大小寫。治標可用 OS symlink 或 Domino directory link，治本永遠是把應用端的 URL 大小寫對齊磁碟。這是 Windows→Linux 搬遷的通病——Windows 不分大小寫讓你開發時隨意，搬到 Linux 才現形。最後別忘了把一條 URL 裡的大小寫規則分清楚：有 cache 時間性的陷阱只在 OS 檔案層（資料夾 + `.nsf`）；classic 的 view／form 名**不分**大小寫；只有 XPages 的 `.xsp` 頁名是另一種、在哪個平台都敏感的大小寫——OS 層與 `.xsp` 層吐的 404 訊息不同，正好拿來分辨。
