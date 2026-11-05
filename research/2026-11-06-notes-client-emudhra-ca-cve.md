# Research trail — notes-client-emudhra-ca-cve (2026-11-06?)

**Topic**: eMudhra/emSign CA 金鑰外洩波及 **HCL Notes client**。獨立於 Server 篇
(domino-emudhra-ca-cve, 11/05)——使用者指示「Notes client 那條獨立寫一篇」。
**切角刻意不重疊**:Server 篇講「是什麼漏洞 / 9.1 vs 6.8 / cert 清單 / Server 補救
/ CVE 對應」;本篇聚焦 **client 端的規模與佈署難題**(不能逐台 SSH)、client 專屬
信任庫、MarvelClient 佈署、macOS keychain、以及 **EOL 9.x**(使用者實測發現,待補
具體憑證)。深度事實(flaw 本質、完整 cert 清單、指紋)引回 Server 篇,不重炒。

## 新聞/資安類(同 Server 篇),NotebookLM 不適用,已以一手權威來源建 chain。

## 已驗證事實(client 相關)

- **CVE-2026-108015**(HCL CNA,cve.org SPA 沒載 → 用 strix 彙整):HCL **Notes Client**
  outbound 請求憑證信任,MITM。CVSS **9.1**(CVSS 4.0,`AV:N/AC:L/AT:P/PR:N/UI:N/
  VC:H/VI:H/...`),CWE-327,published **2026-10-27**(=108014 的 client 鏡像)。
- **CVE-2026-91403 / 114820**:Notes client 內建 **IBM Semeru JVM** 跟著受影響
  (panagenda:KB0134848 = bundled IBM Semeru JVM)。
- **受影響版本**(Notes client):**12.0.2 FP8↓ / 14.0 FP5↓ / 14.5–14.5.1 FP1**
  (panagenda + strix 一致;strix 字串「<1=2.0.2」為 OCR typo = <=12.0.2 FP8)。
- **KB 號第三方不一致**:strix 說 108015 = **KB0134749**;panagenda 說 108015 =
  **KB0134849**、Semeru = KB0134848、手動步驟 = KB0134844。→ 文章**不硬引 client KB
  URL**(無已驗證可解析的 client KB 連結),以 CVE 號為錨 + 功能描述 + 導回 HCL portal。
  唯一硬引的 HCL URL 仍是 Server 篇用的 KB0134847(已驗標題)——本篇只在「另見 Server
  公告」處提,不當 client 來源。

## client 專屬信任庫(panagenda,Christoph Adler;Notes 端)

- **cacert.pem(Notes data 目錄)**:每台工作站都有同一份;panagenda 原文:沒有內建方法
  一次清很多台 → 要靠佈署工具。
- **內建 Java cacerts**:在 Notes 程式目錄 `jvm\lib\security` 下;寫入要 admin 權限。
- **local names.nsf(Advanced > Certificates)**:KB0134844 表列 AAA Certificate
  Services (Comodo) 可從 Domino Directory、client 的 local names.nsf 移除。
- **macOS keychain**:panagenda 原文「Notes on Mac relies on the macOS keychain
  instead of cacert.pem, so apply the latest macOS updates there.」

## MarvelClient 佈署(panagenda;本篇 client 端的實務核心)

- **cacert.pem**:MarvelClient 可把更新版 cacert.pem 佈到 Notes data 目錄、覆蓋每台既有。
- **names.nsf**:panagenda 有一支 agent 檢查 local names.nsf 的受影響 certifier 並移除,
  透過 MarvelClient 無互動執行,需 MarvelClient Basic 授權;來信 support@panagenda.com 索取。
- **Java cacerts**:MarvelClient Upgrade 可換檔,或用你自己的軟體佈署工具。
- 交叉連結站上 MakeNotesFaster webinar 回顧(panagenda/Christoph Adler, 9/26)作脈絡。

## client 端測試

- Nashed 的 LotusScript `NotesHTTPRequest` 測試鈕 → **只測 LS HTTP 這條**。
- 內嵌瀏覽器、Java client 各自信任庫要分開測。
- Dennis Jackson 的 live 測試站 `emudhra.we-have-a-problem.com`(panagenda 引用)。
- panagenda:瀏覽器/curl 過了不代表同台其他程式安全(各有 trust store)。

## EOL / 9.x(使用者第一手實測,公開來源未涵蓋 — 待使用者給具體憑證/庫)

- 公開來源(HCL bulletin/Nashed/panagenda/CVE)**一律只列支援版本**(12.0.2/14.0/14.5)。
  HCL bulletin 慣例只列支援中版本 → 9.x EOL 被排除,**不代表安全**。
- 漏洞本質 = 信任庫裡有哪些 root;AAA Certificate Services 是老 Comodo root(Nashed 稱
  already retired)、emSign 幾張也早於 12.x → **9.x 的 cacert.pem/bundled JVM/names.nsf
  很可能有同一批**,合乎根因。
- ⚠️ **使用者回報 9.x 也有要移除的**,但**尚未給具體是哪張、哪個庫**。文章以「本站/讀者
  實測」身分、與 HCL 清單**明確區隔**寫,具體憑證**待使用者確認**後再填,不臆測。
- 參考記憶:使用者團隊有真實實測能力(user_role);「實測結論也要再驗」(ldat05 教訓)。

## 矛盾檢查

- 108015 vs 108014:同性質、不同產品面(client vs server),無衝突。
- KB 號不一致 → 不硬引 client KB、以 CVE 號為錨。
- 版本 OCR typo → 以 Notes 慣例還原 12.0.2 FP8,與 panagenda 一致。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/domino-emudhra-ca-cve/` — Server 篇(對照文,深度事實在那)
- `/domino-news/posts/notes-httprequest-14-5-trust-store/` — 14.5 信任來源改動
- `/domino-news/posts/certstore-getting-started/` — 信任庫模型
- （MakeNotesFaster webinar 回顧 slug 待確認後補,panagenda 脈絡）

## 外部來源(diversity:每語言 3+ 不重複,單一 < 40%)

1. cve.org CVE-2026-108015
2. cve.org CVE-2026-91403
3. panagenda remove-emudhra-certificates-hcl-notes（client 補救一手）
4. blog.nashcom.de how-to-remove
5. access.redhat.com CVE-2026-91403（6.8 對照）

## 標題候選

- [選定] 規模切角:`Notes client 的 eMudhra 憑證:難的不是哪張,是幾千台`
  en:`eMudhra on the Notes Client: The Hard Part Isn't Which Cert — It's Thousands of Desktops`

## 驗證清單

- [x] 108015 存在 + CVSS/CWE/日期（strix 彙整,與 108014 鏡像一致）
- [x] client 信任庫 + MarvelClient 佈署（panagenda 一手）
- [x] 不重疊 Server 篇（規模/佈署切角,深度引回）
- [ ] EOL 9.x:待使用者具體憑證 → 以實測身分、區隔 HCL 清單
- [ ] tags: Notes Client / Security / Admin / News
- [ ] 3+ 不重複外部來源 / 語言,diversity < 40%
- [ ] humanizer pass（不嚇人）
- [ ] 本地 build 驗
- [ ] 不設 coversClass（跨切面資安）
- [ ] pubDate / ship path：與使用者確認（11/05 companion 當天 Path B，或 11/06 排程）
