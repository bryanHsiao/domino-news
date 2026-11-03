# Research trail — ssjs-database (2026-11-06)

**Topic**: SSJS 的 Database —— `database` 全域是現成的,真正的問題是「它用誰的
權限開的」。session vs `sessionAsSigner` vs `sessionAsSignerWithFullAccess` 的
XPages 安全模型。插旗:`coversClass: Database` ＋ `apiLang: ssjs`(給 Database
節點補**第三支旗**,湊成 LS+Java+SSJS = ● ● ●)。「Java/SSJS 對應週」第 3 篇(11/06)。

## 非重炒防呆

- 第 1 篇 ssjs-backend-document(11/04)已講**文件層**(NotesXspDocument 包裝 vs
  後端 NotesDocument、save-conflict)。本篇走**資料庫層 + 權限模型**,不重疊;
  文件側交叉引用 #1。
- recycle 深入已有 java-recycle-memory;本篇只說「SSJS 的 request-scope 全域由
  框架管、你不像 Java standalone 那樣自己 recycle」,交叉引用。

## NotebookLM

- Notebook: SSJS / XPages reference
  `https://notebooklm.google.com/notebook/0c88f101-7fb7-4ce2-b35e-37a87d3547ec`
- **有回答(能用)**,但答案漂向 #1 已寫的 NotesXspDocument / save-conflict 內容
  (疑似上次問 #1 的輕微 chat 殘留,或來源偏重文件側),對本篇「database 全域 +
  權限」著墨不足。故本篇核心改以官方頁為準(WebFetch),notebook 僅作背景。

## WebFetch / WebSearch（官方 HCL 14.5.1,皆確認真頁）

- `.../reference/r_wpdr_globals_r.html`（Global objects and functions, JavaScript）
  → 列出全域物件確切名稱:applicationScope、context、currentDocument、**database**、
  document1/2、facesContext、param、requestScope、**session**、**sessionAsSigner**、
  **sessionAsSignerWithFullAccess**、sessionScope、view、viewScope…。
  `database` 逐字:「represents the HCL Domino® database currently being used as a
  data source」。`sessionAsSignerWithFullAccess` 逐字:「represents the current
  Domino® session with credentials based on the XPage signer with full access」。
- `.../xpageuser/wpd_scripts_server.html`（Server-side scripting）→ 權限模型逐字:
  `session`「assigns credentials based on the user」(受 ACL + 伺服器 Domino
  Directory 安全頁限制);`sessionAsSigner`「assigns credentials based on the
  signer of the ... XPages design element」(同受 ACL/安全限制);
  `sessionAsSignerWithFullAccess`「allows full administrative access to the
  application's data」+「signer must have that right, or the session is not
  created」。受限操作:interpreter「Rejects embedded Java™ statements in
  JavaScript™ only when executing restricted methods and operations」若
  「the XPages Signer is not granted permission to perform restricted operations」。
  Signing XPages:「XPages are signed with the ID of the current Domino Designer
  user upon saving the XPage design element.」
- `.../reference/r_domino_Session.html`（NotesSession, JavaScript）→ 類別是
  「the root of the Domino® Objects containment hierarchy」。方法:
  `getDatabase`「Creates a NotesDatabase object that represents the database
  located at the server and file name you specify」+「opens the database, if
  possible」;`getCurrentDatabase`「...represents the current database and opens
  the database」;`getDbDirectory`「Gets a directory of databases」。
  （createDatabase 此頁未列 → 不提。）

## identifier 查核（重要,避免重蹈 XML 覆轍）

- 我原記憶是 `sessionAsSignerFullAccess`(無 With)→ **錯**。官方 globals
  reference 與 server-side scripting 兩頁一致用 **`sessionAsSignerWithFullAccess`**
  (有 With),搜不到無 With 版。文章一律用官方確切名 `sessionAsSignerWithFullAccess`,
  不寫未經官方確認的別名。

## 矛盾檢查

- globals reference 與 server-side scripting 對三種 session 權限描述一致、無衝突。
- `database` = 當前資料源,與 `session.getCurrentDatabase()` 語意一致。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/ssjs-backend-document/` — 文件層(#1,NotesXspDocument vs 後端)
- `/domino-news/posts/java-database/` — Java 的 Database handle（#2,跨語言對照）
- `/domino-news/posts/java-recycle-memory/` — Java recycle(對照「SSJS 不用自己管」)
- `/domino-news/posts/notes-session/` — LS NotesSession

## 標題候選（標題優化 loop）

- [汰除] 純功能:`SSJS 的 database 全域與 session.getDatabase` — 像目錄、無 hook。
- [汰除] 只打 signer:`XPages 的 sessionAsSigner:用簽署者權限開庫` — hook 夠但窄。
- [選定] 現成＋真問題合併:`XPages 的 database 是現成的,問題在「用誰的權限開」`
  — 涵蓋全篇(現成 database + 權限模型)、有 hook、好搜(XPages/database)、不過度承諾。
  en 鏡像:`In XPages the Database Is Free — the Question Is Whose Rights Opened It`

## 驗證清單

- [x] 既有覆蓋查核,鎖定不重疊(資料庫層+權限,非文件層)
- [x] NotebookLM 先問(SSJS notebook,能用但漂向 #1)→ 核心改官方頁
- [x] WebFetch 補,每頁確認真頁、identifier 查準(sessionAsSignerWithFullAccess)
- [x] 矛盾檢查
- [ ] coversClass: Database + apiLang: ssjs（stage 前跑 map-lang-report → 預期 ● ● ●）
- [ ] 3 個不重複外部來源 + 內部交叉連結,diversity < 40%
- [ ] humanizer pass
- [ ] temp-copy build 驗 frontmatter
