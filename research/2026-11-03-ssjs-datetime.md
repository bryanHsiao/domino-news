# Research trail — ssjs-datetime (2026-11-03)

**Topic**: XPages SSJS 的 NotesDateTime —— 在 SSJS 要同時雜耍三種日期型別
(NotesDateTime / java.util.Date / JS Date),搞清楚手上是哪個、怎麼轉。插旗:
`coversClass: DateTime` ＋ `apiLang: ssjs`(給 NotesDateTime 節點補 **SSJS 燈**,
從 ● ● · 變 ● ● ●)。**11/03 空檔補文**(非對應週 7 篇之一;郵件 cluster 到
11/02、對應週 11/04 起,11/03 本來沒排,使用者要補一篇且要能插旗)。Path B(今天發)。

## 非重炒防呆

- 既有 datetime 文:notes-datetime(LS, 5/25)、notes-datetime-timezone(LS, 7/13)、
  java-datetime(Java, 8/15)、formula-date-time(Formula, 8/29)。**無 SSJS 版** →
  本篇補 SSJS 視角,不重疊,且 4 篇都可當交叉連結。
- java-datetime 已講 Java 的 recycle/型別;本篇聚焦 SSJS 的「三型別雜耍 + createDateTime」,
  recycle 只一句點到。

## NotebookLM

- Notebook: SSJS / XPages reference(0c88f101-...)
- **無產出(卡住/污染)**:問 NotesDateTime,回的卻是跟 #3 一字不差的 NotesXspDocument /
  save-conflict 罐頭答案(ask X 答 Y)。使用者只清了 Java notebook、沒清這個 SSJS notebook。
  依 CLAUDE.md 轉 WebFetch,未自行清(需授權)。已告知使用者。

## WebFetch / WebSearch（官方,皆確認真頁/活頁）

- `.../reference/r_domino_DateTime.html`（NotesDateTime, JavaScript)→ 「Represents a
  date and time.」;「To create a new NotesDateTime object, use createDateTime in
  NotesSession.」;`toJavaDate`「Converts a NotesDateTime object to a Date object.」;
  方法:adjustDay「Increments a date-time by a number of days.」/adjustHour/Month/
  Minute/Second/Year、setNow「Sets the value of a date-time to the current date and
  time.」、setAnyDate/setAnyTime(wildcard)、timeDifference「Finds the difference in
  seconds between one date-time value and another.」、convertToZone「Changes the
  TimeZone and IsDST properties...」;屬性:DateOnly、TimeOnly、GMTTime「converted to
  Greenwich Mean Time」、IsDST(大小寫是 IsDST)、LocalTime(RW)、ZoneTime。
  **timezone 坑(官方)**:新物件 TimeZone 取自 Domino 設定;只有日期沒時間、或只有時間
  沒日期 → TimeZone 無效回 0;「Today/Tomorrow/Yesterday 用 Domino 當前日期、不設時間」→
  要 setNow 或給明確時間如 "Today 12:00:00 AM"。
- `.../reference/r_domino_Session.html`（NotesSession, JavaScript)→ `createDateTime`
  「Creates a NotesDateTime object that represents a specified date and time.」
- `ds-infolib.hcltechsw.com/.../NotesDateTime_sample_JavaScript_code_for_XPages`
  （HCL 官方 ddwiki,活頁,2011 最後編輯但仍在)→ SSJS NotesDateTime 範例:setNow、
  adjustDay/Month/Year/Hour、convertToZone、toJavaDate;範例行
  `var dt:NotesDateTime = session.createDateTime("Today 12");`。

## identifier / 行為查核（避免重蹈 XML/臆測覆轍）

- **@Today 在 SSJS 回什麼?** 社群論壇(developer.ds.hcl-software.com)回報:@Today
  回的是 **java.util.Date、不是 NotesDateTime**,直接丟 replaceItemValue 會出錯;穩的
  做法是 `session.createDateTime("Today")`。**但這是社群、非官方**,搜尋本身也提醒要驗。
  → 文章錨定官方 `createDateTime`,@Today 只作「社群回報、請自驗」的註記,不斷言回傳型別。
- IsDST 大小寫:官方寫 `IsDST`(非 isDST),照官方。

## 矛盾檢查

- createDateTime(Session 頁)與 NotesDateTime 頁的「用 createDateTime 建立」一致。
- toJavaDate 官方描述明確(轉 java.util.Date),與「三型別」角度一致、無衝突。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/java-datetime/` — Java 的 NotesDateTime + recycle(跨語言對照)
- `/domino-news/posts/notes-datetime/` — LS NotesDateTime
- `/domino-news/posts/notes-datetime-timezone/` — LS 時區深入
- `/domino-news/posts/ssjs-backend-document/` — SSJS 後端文件(讀日期欄位的脈絡)

## 標題候選（標題優化 loop）

- [汰除] 純功能:`SSJS 的 NotesDateTime 與 session.createDateTime` — 無 hook。
- [選定] 痛點:`XPages 的日期有三種,你得知道手上是哪一種`
  — 點出核心(NotesDateTime/java.util.Date/JS Date 三型別雜耍)、有 hook、好搜、不過度承諾。
  en 鏡像:`Three Kinds of Date in XPages — You Have to Know Which One You're Holding`

## 驗證清單

- [x] 既有覆蓋查核(無 SSJS datetime)、鎖定不重疊
- [x] NotebookLM 先問(SSJS notebook 卡住)→ 轉官方頁、告知使用者
- [x] WebFetch 補,每頁驗真頁/活頁;@Today 行為以社群+自驗註記處理,不臆測
- [x] 矛盾檢查
- [ ] coversClass: DateTime + apiLang: ssjs（map-lang-report → 預期 NotesDateTime ● ● ●)
- [ ] 3 個不重複外部來源,diversity < 40%
- [ ] humanizer pass
- [ ] 本地 build 驗(Path B 直接在 posts/,本地 build 會驗 frontmatter)
