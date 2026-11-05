# Research trail — domino-emudhra-ca-cve (2026-11-05)

**Topic**: HCL Domino 受 eMudhra/emSign CA 金鑰外洩波及的資安事件。這不是
Domino 程式碼漏洞,而是**內建 Java/JVM 信任庫 + Domino 自身對外請求信任鏈**裡,
信任了一組私鑰可被還原的 eMudhra 中繼 CA。**新聞/資安類**(非類別深文):依
skill,news 跳過 NotebookLM + coverage tracker;但資安文更需要一手權威查證,
已建此 sidecar。Path B(今天 2026-11-05 發,突發資安不進 _pending)。

## NotebookLM 適用性(依 CLAUDE.md「無 notebook 要先 flag」)

- **不適用**:站上 notebook 都是參考文件(LS/Java/SSJS/DRAPI/Admin/Formula/IQ),
  沒有、也不可能有「即時 CVE / 資安公告」的 notebook。已向使用者說明,改以
  一手權威來源建立 citation chain(HCL 公告 + Oracle/OpenJDK + NVD + cve.org +
  Red Hat + Domino 社群一手 Nashed/panagenda),符合「source-grounded」精神。

## 使用者框架的查證結果(三點需澄清,皆已對上來源)

1. **「Domino 的 Java 漏洞」** → 更精確:是 Java 信任庫裡的**憑證信任問題**
   (供應鏈/trust-store 性質),不是 Domino 或 Java 的程式碼執行漏洞。CWE-295
   (Improper Certificate Validation)/ CWE-327(Broken/Risky Crypto)。
2. **「CVE-2026-91403 / 9.1 / 10」** → 91403 是**上游 Oracle Java/OpenJDK**的 CVE
   (Oracle CNA,2026-10-21 隨 Oracle CPU)。CVSS **Oracle 給 9.1**
   (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`,來源 cve.org/NVD/OpenCVE),
   **Red Hat 給 6.8**(`AV:N/AC:H/PR:N/UI:R/...`,因真正 MITM 路徑要中間人位置+
   使用者互動)。兩分數都寫、說明差異,不只喊 9.1。
3. **「10/27 HCL 正式公告、R12/R14 都中」** → **日期正確**,但 10/27 那天的主角是
   **CVE-2026-108014**(HCL CNA,HCL Domino **Server** 對外請求憑證信任,CVSS 9.1
   CVSS4.0,CWE-327,published 2026-10-27,last modified 11-04)。受影響版本
   **12.0.2 FP8↓ / 14.0 FP5↓ / 14.5–14.5.1 FP1**,所以 R12(12.0.2)、R14(14.0/14.5)
   確實都中。使用者把 10/27 掛到 91403,實際 10/27 = 108014。

## CVE / 公告全貌(已交叉核對)

- **CVE-2026-91403**(Oracle,10-21):Oracle Java SE/GraalVM/OpenJDK JSSE 的
  eMudhra distrust。CVSS 9.1(Oracle)/ 6.8(Red Hat)。
- **CVE-2026-114820**:第一版修法(只擋中繼 CA)被繞過 → OpenJDK 直接移除 root CA,
  另開此號。Red Hat 聲明不會發「宣稱修 91403」的更新(視為修法不正確),改由
  ca-certificates(CVE-2026-114406)處理。
- **CVE-2026-108014**(HCL,10-27):HCL Domino **Server** outbound 請求憑證信任,
  CVSS 9.1,CWE-327。
- **CVE-2026-108015**(HCL):Notes **client** outbound 功能。CVSS 9.1。
- HCL 公告家族(KB 號在第三方彙整來源間**有出入**,只硬性引用已驗證者):
  - **KB0134847** = Domino **Server**,標題逐字(WebFetch 使用者連結驗到):
    "Security Bulletin: eMudhra Compromised Certificate vulnerabilities in Java
    impact HCL Domino Server (CVE-2026-91403, CVE-2026-114820)"。← 使用者連結,硬引用。
  - KB0134848 = Notes client 內建 IBM Semeru JVM(91403/114820)。(panagenda)
  - KB0134849 = CVE-2026-108015 Notes client outbound。(panagenda)
  - KB0134844 = 手動移除憑證步驟(待 fixed release)。(panagenda + 一般搜尋)
  - ⚠️ strix 把 108014 的 KB 抓成 KB0134742 → KB 號第三方不一致,文章**只硬引 KB0134847**,
    其餘以「HCL 的手動移除 KB」描述,並要讀者回 HCL portal 查權威清單。

## 要移除的憑證(HCL 手動 KB,經 Nashed + panagenda 轉述;文章附「以 HCL 清單為準」)

| 憑證 | 移除自 | SHA-256 |
|---|---|---|
| emSign ECC Root CA – G3（主要） | cacert.pem + Java cacerts | 86:A1:EC:BA:08:9C:4A:8D:3B:BE:27:34:C6:12:BA:34:1D:81:3E:04:3C:F9:E8:A8:62:CD:5C:57:A3:6B:BE:6B |
| emSign Root CA – C1 | cacert.pem | 12:56:09:AA:30:1D:A0:A2:49:B9:7A:82:39:CB:6A:34:21:6F:44:DC:AC:9F:39:54:B1:42:92:F2:E8:C8:60:8F |
| emSign ECC Root CA – C3 | cacert.pem | BC:4D:80:9B:15:18:9D:78:DB:3E:1D:8C:F4:F9:72:6A:79:5D:A1:64:3C:A5:F1:35:8E:1D:DB:0E:DC:0D:7E:B3 |
| AAA Certificate Services (Comodo) | Domino Directory / client names.nsf / 舊版 cacert.pem | D7:A7:A0:FB:5D:7E:27:31:D7:71:E9:48:4E:BC:DE:F7:1D:5F:0C:3E:0A:29:48:78:2B:C8:3E:E0:EA:69:9E:F4 |

- Nashed:**G3 與 Comodo cross-cert 兩個都要移**,只移一個會從另一條路徑把鏈建起來
  (「not optional」)。**依指紋比對、不要依名稱**(panagenda 原文:match by fingerprint)。
- 8 支 eMudhra 中繼 CA(6 TLS + 2 code-signing)私鑰可還原,跨簽在 AAA root 下。

## 信任庫範圍 nuance(非常重要,避免誇大)

- Nashed(10/22):**certstore.nsf 預設只有 Let's Encrypt roots**;標準 **Domino
  Directory 預設不含**這些公開 root。→ 多數 server 真正中的是**內建 Java cacerts**
  (現為 PKCS12 .p12、仍叫 `cacert` 無副檔名)與**舊版用到的 cacert.pem/cacerts.pem**。
  certstore.nsf / Domino Directory 只在你**自己加過**這些 root 才中。
- 14.5 起 server 端 NotesHTTPRequest 預設從 Domino Directory 拿 root(見站上
  notes-httprequest-14-5-trust-store 5/10)→ 本 CVE 正是「那些信任庫裡放了什麼」的問題。

## WebFetch / WebSearch(皆確認,標來源強度)

- cve.org / NVD REST(services.nvd.nist.gov JSON)/ OpenCVE:91403 存在,9.1,向量,
  CWE-295/327,published 10-21。【權威】
- access.redhat.com/security/cve/cve-2026-91403:Red Hat 6.8 + 向量 + 修法演進 +
  114820 + 「不發修 91403 的更新」。【權威】
- strix.ai/cve/CVE-2026-108014:108014 = Domino Server,9.1 CVSS4.0,CWE-327,
  published 10-27,版本範圍(「<1=2.0.2」為 OCR typo = <=12.0.2 FP8)。【彙整,已交叉核對】
- blog.nashcom.de(why-serious 10/22 + how-to-remove):Domino 社群一手;信任庫範圍、
  兩個 cert 都要移、測試用 NotesHTTPRequest LS 片段、依指紋比對。【社群一手,HCL-adjacent】
- panagenda.com(Christoph Adler):cert 清單 + 指紋 + 各信任庫 + KB 對應 + Notes 版本。【社群】
- HCL KB0134847(使用者連結):SPA,僅抓到標題(已驗 = Domino Server / 91403+114820)。
  body 未載 → server 版本/日期改以 108014 的 cve.org 記錄 + Nashed/panagenda 補。

## 矛盾檢查

- CVSS 9.1 vs 6.8:非矛盾,是**不同評分者對不同攻擊路徑**(Oracle 泛 JSSE/untrusted-code
  vs Red Hat MITM-TLS)。文章兩者並陳 + 解釋。
- KB 號第三方不一致 → 只硬引 KB0134847,其餘描述化 + 導回 HCL portal。
- 版本字串 OCR typo(<1=2.0.2)→ 以 Notes/Domino 慣例版號還原為 12.0.2 FP8,並與
  panagenda 的 Notes 版本範圍一致。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/notes-httprequest-14-5-trust-store/` — 14.5 信任庫來源改動(背景錨)
- `/domino-news/posts/certstore-getting-started/` — certstore.nsf / CertMgr 信任庫模型
- `/domino-news/posts/drapi-keycloak-oidc/` — DRAPI 只吃 JVM truststore 的脈絡

## 外部來源(diversity:每語言用 3+ 個不重複 URL,單一 < 40%)

1. HCL KB0134847(Domino Server 公告)
2. cve.org CVE-2026-91403
3. cve.org CVE-2026-108014
4. access.redhat.com/security/cve/cve-2026-91403(6.8 vs 9.1 的對照)
5. blog.nashcom.de how-to-remove(Domino 實務)

## 標題候選

- [汰除] 純報導:`HCL 發布 CVE-2026-91403 資安公告` — 無資訊、像新聞稿。
- [選定] 點破本質 + 可行動:`Domino 的 eMudhra 憑證警報:9.1 分的真相,與該清哪個信任庫`
  — 點出(a)這是信任庫問題不是程式漏洞(b)9.1 有兩種讀法(c)行動在哪。好搜、不誇大。
  en:`Domino's eMudhra Certificate Alert: What the 9.1 Really Means, and Which Trust Store to Clean`

## 驗證清單

- [x] CVE 真偽:NVD/cve.org/OpenCVE/Red Hat/Oracle(via NVD)交叉確認存在
- [x] CVSS 9.1(Oracle)vs 6.8(Red Hat)雙分數 + 向量 + 差異解釋
- [x] 日期/版本:108014 = 10-27 = 使用者的日期;R12/R14 版本範圍對上
- [x] 本質澄清:trust-store/供應鏈,非 Domino 程式碼漏洞;CWE-295/327
- [x] 信任庫範圍 nuance(certstore.nsf 預設只有 LE root)→ 不誇大
- [x] cert 清單 + 指紋,附「以 HCL 公告為準、依指紋比對」強制 caveat
- [ ] tags: Domino Server / Security / Admin / News(非 Tutorial,不過度承諾)
- [ ] 3+ 不重複外部來源 / 語言,diversity < 40%
- [ ] humanizer pass(不嚇人語言)
- [ ] 本地 build 驗(Path B 直接寫 posts/)
- [ ] 不設 coversClass/coversIsland(跨切面資安,不上地圖)
