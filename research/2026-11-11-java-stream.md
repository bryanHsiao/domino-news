# Research trail — java-stream (2026-11-11)

**Topic**: `lotus.domino.Stream`(Java)—— 在 Java 讀寫檔案/位元組,重點是
**charset 的預設陷阱**:新建 Stream 的 `Charset` 是 Unicode,但 `open(path)`
不帶 charset 時預設是 "System"(平台編碼),中文會亂碼;外加 `writeText`
預設 `EOL_NONE` 不加行尾、Binary 模式、thread 限定、recycle。插旗
`coversClass: Stream` ＋ `apiLang: java`。Path A(_pending),11/11 當天(會手動
觸發 publish-pending,不賭 cron)。這是 11/11–11/23 排程 #1。

## 為什麼是這題

- map 缺口:`Stream` 有 LS(notes-stream / notes-stream-encoding)但缺 Java 旗。
- Java 側 Stream 有獨特角度:charset 預設差異、EOL 常數、getContents/setContents
  接 `java.io.*`、是 MIMEEntity/附件底層用的串流。不跟 LS 文重疊(LS 文講
  LotusScript 的 NotesStream;這篇講 Java 的坑與 java.io 橋接)。

## 官方 HCL 14.5.1（WebFetch 逐字驗;NotebookLM Java notebook 本次中 chat 污染，
## 問 Stream 回 RichTextItem，改走 WebFetch — 已向使用者說明）

- `.../basic/H_NOTESSTREAM_CLASS_JAVA.html`(Stream class)→
  「Represents a stream of binary or character data.」「This class is new with
  Release 6.」「To create a Stream object, use the createStream method in
  Session.」新 stream:Bytes 0、**Charset = Unicode**、IsEOS true、IsReadOnly
  false、Position 0。「Use of a Stream object is limited to the thread in which
  is created.」屬性:Bytes / Charset / IsEOS / IsReadOnly / Position。方法:
  open / read / readText / write / writeText / getContents / setContents /
  truncate / close / recycle。
- `.../basic/H_OPEN_METHOD_STREAM_JAVA.html`(open)→
  `public boolean open(String pathname)` /
  `public boolean open(String pathname, String charset)`。
  pathname:「The full path name of a file. Must be valid for the current
  platform.」charset:「The character set used by the file... **Defaults to
  "System."**」有效值:ASCII、UTF-8、UTF-16/BE/LE、ISO-8859-1..9、Shift-JIS…
  **Binary**(限 byte 操作)、**Unicode = UTF-16**、Unicode-1-1。open 會在檔案
  不存在時建立;若 stream 已開、已有內容、charset 無效則失敗。→ **關鍵落差**:
  新建 Stream 的 Charset 是 Unicode,但 open(path) 不帶 charset 預設是 System。
- `.../basic/H_WRITETEXT_METHOD_STREAM_JAVA.html`(writeText,14.5.1 確認非 404)→
  `public int writeText(String text)` /
  `public int writeText(String text, int endOfLine)`,回傳寫入字元數。EOL:
  EOL_CRLF(0)CR+LF、EOL_LF(1)LF、EOL_CR(2)CR、EOL_PLATFORM(3)平台慣例、
  **EOL_NONE(5)不加、Default**。

## identifier / 行為查核（逐字驗，吸取 DQL 教訓）

- `createStream()` 在 `Session` 上(非 Database)。
- open 預設 charset = "System"(平台),**不是** class 預設的 Unicode → 寫中文
  不指定 charset 會用伺服器 locale 編碼,易亂碼。明確傳 `open(path,"UTF-8")`。
- `writeText` 單參數版不加行尾(EOL_NONE);要逐行寫要傳 `Stream.EOL_CRLF`。
- `getContents(OutputStream/Writer)` / `setContents(InputStream/Reader)` → 與
  `java.io.*` 橋接(Java 專屬便利,LS 沒有)。
- thread 限定 + recycle(接 java-recycle-memory)。

## 矛盾檢查

- 無。class 頁與 open 頁對 charset 預設的「落差」不是矛盾,而是兩個不同時機
  (new stream vs open 時)—— 正是文章要講的坑。

## 交叉引用（內部,不計 diversity）

- `/domino-news/posts/notes-stream-encoding/` — LS 的 Stream 編碼
- `/domino-news/posts/notes-stream/` — LS NotesStream
- `/domino-news/posts/java-recycle-memory/` — recycle 紀律
- `/domino-news/posts/java-embeddedobject/` — 附件(Stream 的上游來源之一)

## 外部來源（diversity:每語言 3 個不重複 URL,各 33%）

1. Stream class (Java) — H_NOTESSTREAM_CLASS_JAVA.html
2. open (Stream - Java) — H_OPEN_METHOD_STREAM_JAVA.html
3. writeText (Stream - Java) — H_WRITETEXT_METHOD_STREAM_JAVA.html

## 標題候選（標題優化 loop;自決一版、記錄候選）

- [汰除] 純功能:`Java 的 Stream:讀寫檔案與編碼` — 目錄、無 hook。
- [汰除] 好處先行:`Java 用 Stream 讀寫檔案:一個參數決定不亂碼` — 稍模糊。
- [選定] 問題＋concept:`Java 的 Stream 讀寫檔案:預設 charset 不是 Unicode,是 System`
  — 點出確切的坑(open 預設 System)、好搜(Java Stream charset)、不過度承諾。
  en 鏡像:`Files in Java with Stream: the Default Charset Is System, Not Unicode`

## 驗證清單

- [x] map 缺口確認(Stream 缺 Java 旗)、不與 LS 文重疊
- [x] 官方逐字驗(class / open / writeText 三頁,含 14.5.1 writeText 非 404)
- [x] charset 預設落差查準(new=Unicode vs open 預設=System)、EOL_NONE 預設
- [ ] coversClass: Stream + apiLang: java(map-lang-report → Java 燈)
- [ ] 3 不重複外部來源,diversity < 40%
- [ ] humanizer pass
- [ ] temp-copy build 驗 frontmatter → 進 _pending
