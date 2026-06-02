---
title: "HCL Domino 14 跟前版的關鍵差異整理 — 管理員與開發者必看"
description: "從 V11 / V12 升級到 Domino 14.x、真正會讓既有部署失效的「結構性變動」其實有限、集中在幾個面向。本文用五個維度整理 14.0 / 14.5 / 14.5.1 跟之前版本的差異 — notes.ini 路徑、Java / jar 環境、XPages 編輯器（CKEditor → TinyMCE 6.7）、新模組（Domino IQ / DQL @FTSearch / AdminCentral / AutoUpdate）、跟一份完整的棄用 / 移除清單（iNotes UI、SNMP MIB、DCT、Server Load Utility 等）。每條都標版本起跑點跟官方來源、結尾附一份升級前的檢查清單。"
pubDate: 2026-05-31T07:30:00+08:00
lang: zh-TW
slug: domino-14-key-changes
tags:
  - "Domino"
  - "Tutorial"
sources:
  - title: "What's New in Domino 14.0 — HCL Product Documentation"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/wn_140.html"
  - title: "General updates in Domino 14.5 — HCL Product Documentation"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html"
  - title: "Components no longer included in Domino 14.5 — HCL Product Documentation"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_components_no_longer_included_in_release.html"
  - title: "General updates in Domino Designer 14.5 — HCL Product Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_generalupdates.html"
  - title: "What's new in Domino Designer 14.5.1 — HCL Product Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html"
  - title: "Splitting the CKEditor/TinyMCE Difference in XPages on Domino 14.5 — frostillic.us"
    url: "https://frostillic.us/blog/posts/2026/2/4/splitting-the-ckeditor-tinymce-difference-in-xpages-on-domino-14-5"
  - title: "Running servlets in Domino — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_RUNNING_SERVLETS_IN_DOMINO.html"
  - title: "JEP 220: Modular Run-Time Images — OpenJDK"
    url: "https://openjdk.org/jeps/220"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-14-key-changes.webp"
coverStyle: "photoreal-3d"
---

公司預計把 Domino 從 V11 或 V12 升到 14.5 — 管理員拿到版本變動說明一頁一頁翻、開發者看 Designer 14 文件、最後還是不確定「**我們現有的東西哪些會壞掉、哪些只是順帶有的新功能**」。

事實上、Domino 14.x 真正影響既有部署的「結構性變動」其實集中在幾個面向 — 不是每一條版本說明都需要同等關注。本文用五個維度整理 14.0 / 14.5 / 14.5.1 跟之前版本的差異 — 從檔案放哪、Java 環境、XPages 編輯器、新功能模組、到完整的棄用清單。每一條都標出版本起跑點、附官方來源、結尾再給一份升級前的檢查清單。

---

## 重點摘要

- **Java 升兩次**：[Domino 14.0](https://help.hcl-software.com/domino/14.0.0/admin/wn_140.html) 主 JVM 從 Java 8 升 **Java 17 LTS**（Win / Linux / AIX）、[Domino 14.5](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html) 再升 **Java 21 LTS**；IBM i 在 14.5 才升 Java 17
- **`notes.ini` 不能再放執行檔目錄** — 14.0 Windows 安裝程式起就不支援、14.5 安裝程式自動把它移到 `data directory` 並更新登錄檔
- **JAR 放的位置 14 起不能再用 `jvm/lib/ext`** — V12（Java 8）時放這裡會自動掃進類別路徑、實戰確認可以；14.0 主 JVM 升 [Java 17 後 ext 機制完全移除](https://openjdk.org/jeps/220)（Java 9 棄用、Java 11 砍）、Domino 不會再從那裡掃 jar、實務上替代方案是 `ndext`
- **XPages 編輯器整個換掉** — 14.5 起 CKEditor 4 換成 TinyMCE 6.7、**沒有退出選項**（CKEditor 不再隨 Domino 出貨）
- **14.5 移除 5 個東西**：[iNotes UI](https://help.hcl-software.com/domino/14.5.0/admin/wn_components_no_longer_included_in_release.html)、SNMP MIB 開關機、Domino Configuration Tuner、Server Load Utility 安裝面板、跟 `pubnames.ntf` 的「Send upgrade notifications」動作
- **14.0 新增**：AdminCentral 應用程式（`admincentral.nsf`）、AutoUpdate 自動更新、只支援 64 位元 Notes Client、Domino Restyle UI
- **14.5 新增**：[Domino IQ](/domino-news/zh-TW/posts/domino-iq)（伺服器內建 LLM 推論引擎）、DQL 整合 `@FTSearch`、外部會議邀請描述上限從 40 KB 拉到 1 MB
- **14.5.1 新增**：[NotesJSONArray / NotesJSONObject / NotesJSONElement 的 Copy 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html)、取 OIDC token 的新 NotesSession 方法（LotusScript + Java 雙語）、跟 [XPages 檔案上傳 UI 預設支援多檔選擇](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)

---

## 一、檔案配置變動

### `notes.ini` 位置 — 14.0 開始限縮、14.5 自動移動

V11 / V12 時代 Windows 上 `notes.ini` 可以放在 Domino 執行檔目錄（譬如 `C:\Program Files\HCL\Domino\`）。**從 14.0 起、Windows 安裝程式不再支援這個位置**；到了 14.5、安裝程式直接把它**自動搬到 `data directory`**（譬如 `C:\Domino\Data\notes.ini`）、同時更新 Windows 服務的登錄檔設定指向新路徑。

實務上要小心：

- **既有附加程式 / 排程跑的批次檔**裡寫死了舊路徑、升級後要逐一驗證
- 第三方備份工具如果是抓 `notes.ini` 做伺服器識別、路徑變了之後要重設
- 自己寫的監控腳本（譬如讀 `notes.ini` 算動態設定）路徑要跟著改

### Windows Extension Manager API 搜尋路徑收緊

14.5 起、[Extension Manager API](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html)（透過 `ExtMgr_Addins` notes.ini 變數呼叫的）**不再搜尋系統 PATH** 找未指定完整路徑的程式庫。預設搜尋路徑剩三個：

1. Notes / Domino 執行檔目錄
2. Windows System 目錄
3. Windows 目錄

要加額外路徑、用 `ExtMgr_Dir<#>=<path>` 格式設定（`<#>` 是 1 到 9）：

```ini
ExtMgr_Dir1=C:\MyExtensions
ExtMgr_Dir2=D:\ThirdParty\Bin
```

這個變動是安全強化 — 之前搜尋 PATH 容易讓惡意 DLL 從不該載的位置進來。但舊環境靠 PATH 找到自家擴充程式的、升級後要明確設這些變數。

### `OS_DISABLE_CACHESET` 預設值 — 0 變 1

14.5 起、`OS_DISABLE_CACHESET` 預設從 `0` 改 `1`。官方說法：在 Windows Server 2019 以上、Domino 自己操作 Windows 檔案系統快取會反過來造成效能問題、所以改預設不要動它。

如果你之前手動把這個設成 `0` 想榨效能、14.5 之後要重新評估 — 多數情境下保持 1 比較好。

### Verse 安裝路徑

14.5 全新安裝的 Verse 預設裝在程式目錄、不再裝到 `data directory`。升級的話：如果 Verse 版本沒變就保留原位置、版本變了就會搬到程式目錄。這個對備份路徑跟修補包流程影響小、但路徑映射的工具要跟著改。

---

## 二、Java 開發環境變動

### JVM 兩次升級

| 版本 | 主 JVM | IBM i 上的 JVM |
|---|---|---|
| V11 / V12 | Java 8 | Java 8 |
| **14.0** | **Java 17 LTS** (Win / Linux / AIX) | Java 8 |
| **14.5** | **Java 21 LTS**（OpenJDK 21.0.3、IBM Semeru / OpenJ9）| **Java 17**（要求 IBM i 7.4 / 7.5）|

兩次都不是小升級 — Java 8 → 17 中間隔了一個 LTS（11）、17 → 21 又一個 LTS。**多數靠 Java 反射、私有 API、或 sun.* 套件的舊程式碼在 17 跟 21 都會出問題**。升級前的相容性測試是真的不能省。

從 14.0 起、Java 應用程式要正確跑、**必須把 [`glassfish-corba-omgapi.jar`](https://help.hcl-software.com/domino/14.0.0/admin/wn_140.html) 明確加進類別路徑**、和原本就在類別路徑上的 `Notes.jar` 或 `NCSO.jar` 並列。沒加會在某些 CORBA 操作上拋 ClassNotFoundException。

### Eclipse 4.22 → 4.30

Notes Standard、Domino Administrator、Domino Designer、XPages 14.5 用的 Eclipse 從 4.22 升到 [4.30](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html)。對寫 Eclipse 插件的開發者影響最大 — Eclipse API 跨小版本不一定向下相容、自家插件要重編譯跟測試。

### JAR 放置位置 — Java 17 移除 ext 機制的連帶影響

V11 / V12（Java 8 時代）保留 [ext 類別載入機制](https://openjdk.org/jeps/220)、jar 放 `<domino>/jvm/lib/ext/` 會被 JVM 自動掃進類別路徑。實戰上 12 版這條路是能用的、許多自家擴充程式都靠這個位置部署。

**從 14.0 起、主 JVM 升 Java 17** — Java 9 棄用了 ext 機制、Java 11 完全砍掉。14.x 跑 Java 17、`jvm/lib/ext` 已經完全不被掃進類別路徑、原本放那邊的 jar 直接失效。這是 V12 → 14 升級時非常容易踩雷的點 — 類別載入失敗的錯誤訊息常常讓人花很多時間在錯的方向除錯。

要搬到哪？實務上兩條路可以分開講：

- **`JSDK.JAR`（servlet 開發用的 Java Servlet Development Kit）**：[官方明文](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_RUNNING_SERVLETS_IN_DOMINO.html)指 `<domino>/ndext/`。這條不是 14.5 才加的、[Domino 12.0 同一頁](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_RUNNING_SERVLETS_IN_DOMINO.html)就有同樣文字 — 寫 servlet 編譯時要用新路徑找類別路徑
- **自家 / 第三方擴充 jar**：HCL 沒對「所有擴充 jar 統一搬到 `ndext`」做正式公告、但實務上的替代方案是 `ndext`（跟 `JSDK.JAR` 同一個目錄）。其他更乾淨的選擇是包成 OSGi 插件、或在伺服器設定明確聲明類別路徑

```
V12 時可以：  <domino>/jvm/lib/ext/yourlib.jar   （Java 8 ext 機制掃）
14.x 改成：  <domino>/ndext/yourlib.jar          （或 OSGi 插件 / 明確類別路徑）
```

升級時：把所有原本部署在 `jvm/lib/ext` 的自家 / 第三方 jar 列出來、逐一搬到 `ndext` 或改載入機制。不搬的話、相關類別載入一定失敗。

### 只支援 64 位元 Notes Client

14.0 起、Notes Client **僅支援 64 位元**。原本還在用 32 位元的環境、升級時要先確認用戶端可以跑 64 位元（多數現代 Windows 沒問題）。AutoUpdate 機制可以從 32 位元直接升到 64 位元、不用手動重裝。

### Designer 14.5 / 14.5.1 開發 API

- **14.5**：新的 64 位元 NotesSession API（LotusScript）
- **14.5**：XPages 加 [CSP `unsafe-inline` 程式碼支援](https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_generalupdates.html)、伺服器端可開啟（之前 XPages 寫行內腳本會撞 CSP 政策、現在有路）
- **14.5.1**：[`NotesJSONArray` / `NotesJSONObject` / `NotesJSONElement` 多了 `Copy` 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html)（之前複製 JSON 結構要自己走訪、現在有原生 API、可參考站上[拆 JSON 三劍客那篇](/domino-news/zh-TW/posts/notes-json-array-element-object)）
- **14.5.1**：新的 `NotesSession` 方法（LotusScript）跟 `Session` 方法（Java）、用來從 Domino OIDC Provider 取存取權杖
- **14.5.1**：[XPages 檔案上傳 UI 預設支援多檔選擇](https://help.hcl-software.com/domino/14.5.1/admin/wn_xpages_support_for_multiple_file_uploads.html)、官方原文「The XPages file upload UI now supports multiple selections by default」— 使用者可一次選多個檔案、`fileUpload` 控制項預設行為改變、不需額外屬性設定

---

## 三、XPages 編輯器整個換掉：CKEditor → TinyMCE

這條是 14.5 對 XPages 開發者衝擊最大的一條。

### 變動內容

[Domino Designer 14.5 起、XPages 預設的富文本編輯器從 CKEditor 4 換成 TinyMCE 6.7](https://help.hcl-software.com/dom_designer/14.5.0/basic/wn_generalupdates.html)。**沒有退出選項** — CKEditor 不再隨 Domino 出貨、升級後想用舊的也找不到了。

### 為什麼 HCL 要換

社群實作觀察（[frostillic.us 的這篇整理](https://frostillic.us/blog/posts/2026/2/4/splitting-the-ckeditor-tinymce-difference-in-xpages-on-domino-14-5)）指出兩個原因：

1. **CKEditor 4 在 2023-06 已經 EOL** — 安全性更新斷供
2. **CKEditor 5 拿掉 MPL 授權選項** — 商業使用只剩付費路線

HCL 顯然不想付費延長 CKE4 支援、又不想為 CKE5 付商業授權、就換 TinyMCE。

### 客製化會壞掉的兩個常見地方

如果你之前對 CKEditor 做過客製化、有兩種寫法在 TinyMCE 上不能用：

**1. toolbar 設定的字串值**

```xml
<!-- CKEditor 接受預設設定檔 -->
<xp:attr name="toolbarType" value="Large"/>
```

TinyMCE 把同一個屬性當成「**空格分隔的動作名單**」、`"Large"` 不在 TinyMCE 的內建動作名稱裡、所以**靜默壞掉** — 編輯器跑起來、toolbar 不對。

**2. 用 JavaScript 運算式動態決定屬性**

CKEditor 對某些屬性會丟進 `eval()` 跑、所以可以放動態 JavaScript：

```xml
<xp:attr name="toolbar" value="${javascript:getUserToolbar(...)}"/>
```

TinyMCE **不支援這種動態運算** — 必須事先決定值。

### 跨版本相容寫法

社群建議用 `@Version` 組建編號判斷現在是不是 14.5 以上、**條件式載入兩套設定**：

```xml
<xp:dataContext var="isTinyMce"
                value="${javascript:parseInt(session.evaluate('@Version')[0], 10) >= 495}"/>

<!-- 給 14.5 以下用、CKEditor 風格 -->
<xp:attr name="toolbar" value="Slim" loaded="${not isTinyMce}"/>

<!-- 給 14.5 以上用、TinyMCE 風格（空格分隔的動作） -->
<xp:attr name="toolbar" value="undo redo styles" loaded="${isTinyMce}"/>
```

這寫法不是官方建議、但對需要同一份 XPages 程式碼跨多版本 Domino 伺服器部署的環境很實用。

### 不會壞掉的部分

簡單的屬性（譬如 `skin="oxide-dark"`、`height="400"` 這類靜態值）兩邊都吃、不用改。

### 順帶：Dojo 也升級

[Domino 14.5 把 Dojo 從 1.9.7 升到 1.17.3](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html) — 同樣是「跨大版本不一定相容」的場景。XPages 內部用 Dojo 的元件可能要重新測過。

---

## 四、新功能模組

這節聚焦「新增」、深入細節的留給專文：

### Domino IQ — 伺服器內建 LLM 推論引擎（14.5）

Domino 14.5 把 LLM 推論引擎搬進伺服器程序、讓 Domino 應用可以呼叫本地 AI 而不需外連 OpenAI / Azure。新的 [`NotesLLMRequest` / `NotesLLMResponse` 類別](/domino-news/zh-TW/posts/notes-llm-request)（站上有專文）讓 LotusScript / Java 可以直接互動。配合 [RAG 設定](/domino-news/zh-TW/posts/domino-iq-rag)可以把 NSF 內容當知識庫。

### DQL 整合 `@FTSearch`（14.0）

[Domino 14 把 FTSearch 整合進 DQL 條件](/domino-news/zh-TW/posts/domino-search-decision)、用 `@FTSearch('query')` 或 `@FTS('query')` 把文字檢索條件寫進 DQL 查詢。這讓「文字 + 結構化條件」一次表達、不必再寫兩階段串接。

### AdminCentral — 新的管理應用程式（14.0）

14.0 起、AdminP 自動建立 `admincentral.nsf`、讓多數日常管理任務可以在 Notes Standard 用戶端或 Nomad 網頁直接操作、不必開傳統的 Domino Administrator。對主要用網頁管理的環境是大改善。

### AutoUpdate — 自動更新 Domino（14.0、14.5 強化）

14.0 推出、可以從 My HCLSoftware Portal 拉新版本、分發給指定的 Domino 伺服器群組。**14.5 起 Windows / Linux 上可以全自動更新**（要在 Product Updates 設成「Notify, Download and Update」）；AIX 14.5 可以當下載伺服器或目標伺服器、但不能當安裝目標。

### 64 位元 NotesSession API（14.5）

14.5 加了專為 64 位元設計的 NotesSession API（LotusScript）、處理大型資料時效能跟記憶體用量都改善。

### 其他

- [Mac C API Kit 升級編譯器](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_general_updates.html)（14.5）
- 外部會議邀請的描述上限從 40 KB 拉到 **1 MB**（14.5）
- DAOSmgr Repair Tell 指令掃 DAOS catalog 找漏失物件（14.0）
- Domino Restyle UI 統一色調（14.0）
- InstallAnywhere 升 2024 R1、Notes Client 用 InstallShield 2023 R1（14.5）

---

## 五、棄用 / 移除清單（14.5）

Domino 14.5 [明確不再包含的東西](https://help.hcl-software.com/domino/14.5.0/admin/wn_components_no_longer_included_in_release.html)：

| 移除項目 | 替代方案 |
|---|---|
| **iNotes 使用者介面** | 改用 HCL Verse；想繼續用 iNotes 必須保留一台 14.0 或更早的 Domino 伺服器 |
| `pubnames.ntf` 的「Send upgrade notifications」動作 + 對應 subform | 無 |
| **SNMP MIB** 啟動 / 停止 / 重啟伺服器 | 無 — 改用其他伺服器管理工具 |
| **Domino Configuration Tuner (DCT)** | 無正式替代 |
| **Server Load Utility** 從 Domino Administrator 安裝面板移除 | 無 |

iNotes 移除是這份清單最大的衝擊 — 多數還有 iNotes 使用者的環境得提前做 Verse 切換計畫、或保留一台舊伺服器過渡（不建議長期）。

---

## 六、安全 / 認證（站上已有專文、本節僅指引）

14.5 在這方面有兩個對既有部署影響大的變動、站上都有專文深入：

- **強制連接埠加密**（14.5）：詳見[那篇強制連接埠加密的文章](/domino-news/zh-TW/posts/mandated-port-encryption)
- **TLS 信任儲存從 `cacerts.pem` 改 Domino Directory**（14.5）：詳見 [NotesHTTPRequest 14.5 信任儲存變動那篇](/domino-news/zh-TW/posts/notes-httprequest-14-5-trust-store)

兩條都會讓「之前能跑的程式碼升上去之後突然連不上」、強烈建議升級前先看過。

---

## 升級前的檢查清單

整理成一份管理員 / 開發者都能用的升級前檢查清單：

### 管理員端

- [ ] 確認所有自家批次 / 排程 / 監控腳本沒寫死舊 `notes.ini` 路徑
- [ ] 列出所有 `ExtMgr_Addins` 載入的程式庫、檢查是不是靠 PATH 找到、必要時加 `ExtMgr_Dir<#>=`
- [ ] 把手動設過的 `OS_DISABLE_CACHESET=0` 拿掉、確認 14.5 預設值適用
- [ ] 還有 iNotes 使用者的話：規劃 Verse 切換時程
- [ ] 用 SNMP MIB 做伺服器開關機自動化的話：改其他工具
- [ ] 之前依賴 DCT 的健檢流程：找替代手段
- [ ] IBM i 升到 14.5：先確認作業系統在 7.4 或 7.5、且 Java 17 修補等級符合

### 開發者端

- [ ] 把 V12 時放 `jvm/lib/ext` 的自家 / 第三方 jar 都搬到 `ndext`（或改 OSGi 插件 / 明確類別路徑） — Java 17 移除 ext 機制、14.x 之後這個位置完全不被掃。`JSDK.JAR` 早就在 `ndext`（12.0 就有）、但一般擴充 jar 在 V12 還能放 `jvm/lib/ext`、14 之後必須搬
- [ ] Java 應用程式類別路徑加 `glassfish-corba-omgapi.jar`
- [ ] 32 位元 Notes Client 環境：確認可以全面換 64 位元
- [ ] XPages 應用：搜尋所有用 CKEditor 的地方、看 `toolbar` / `toolbarType` 屬性會不會壞掉
- [ ] XPages 應用：搜尋對 CKEditor 屬性用 `${javascript:...}` 的地方、改成靜態值或用 `@Version` 條件式
- [ ] 升級後跑一次完整 XPages 回歸測試、特別注意 Dojo 元件
- [ ] 自家 Eclipse 插件（如果有的話）：對 Eclipse 4.30 重編譯測試
- [ ] 自己寫的 Java 反射程式：對 Java 17 / 21 跑相容性測試
- [ ] 14.5.1 之後：自家 `fileUpload` 客製化（譬如「限制單檔上傳」的使用者體驗假設）要重看 — 預設行為改成允許多檔選擇

---

## 結語

Domino 14.x 不是 V8 → V9 那種主要 UI 改版、而是「底層執行環境全面換代」— Java 兩次升級、檔案路徑收緊、編輯器砍掉重來、再加上一批安全強化變動。

對既有部署來說、**最容易踩雷的不是「沒注意到新功能」、是「沒注意到舊作法不再能用」**。本文整理的這幾條 — 特別是 `notes.ini` 路徑、`jvm/lib/ext`、跟 CKEditor 客製化 — 是真實會壞掉的點、不是補充知識性質的版本說明條目。

實際升級規劃時、把這份檢查清單跟手上系統對表逐項打勾、會省下不少排除問題的時間。
