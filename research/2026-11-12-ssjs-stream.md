# Research trail — ssjs-stream (2026-11-12)

**Topic**: `NotesStream`(SSJS/XPages)—— 在 XPages 用 Stream **產檔案給下載**
(`getContents` 直接倒進 HTTP response 的 OutputStream)與**讀上傳檔**;charset
同樣預設 System(深講指回 java-stream)、writeText 預設 EOL_NONE、thread 限定。
插旗 `coversClass: Stream` ＋ `apiLang: ssjs`。Path A，排程 #2(11/12)。

## 為什麼是這題

- map 缺口:Stream 缺 SSJS 旗(LS ● / Java 剛由 #1 點亮 / SSJS ·)。
- SSJS **確認有**(WebFetch r_domino_Stream*,逐字驗)——不重蹈 DQL。
- 與 #1(java-stream)區隔:#1 講 charset 預設坑 + java.io 橋接的底層;這篇講
  **XPages 場景**(產檔下載、讀 fileUpload 上傳檔),charset 只點到、指回 #1。

## 官方 HCL 14.5.1（SSJS reference，WebFetch 逐字驗）

- `.../reference/r_domino_Stream.html`(class)→「Represents a stream of binary
  or character data. The stream can be associated with a file.」「Use of a
  NotesStream object is limited to the thread in which is created.」getContents
  「Copies contents to a java.io.OutputStream or java.io.Writer」、setContents
  「Copies from a java.io.InputStream or java.io.Reader」。
- `.../reference/r_domino_Stream_open.html`(open)→ `open(pathname)` /
  `open(pathname, charset)`→boolean;charset「Defaults to System.」有效值含
  Big5、Shift-JIS、UTF-8、Unicode(=UTF-16)、Binary(限 byte)…。open 不存在
  會建檔;已開/有內容/charset 無效則回 false。
- `.../reference/r_domino_Stream_writeText.html`(writeText,非 404)→
  `writeText(text)` / `writeText(text, endOfLine)`→int;EOL_CRLF(0)/LF(1)/
  CR(2)/PLATFORM(3)/NONE(5 預設)。「The default is NotesStream.EOL_NONE.」

## identifier / 行為查核

- `session.createStream()` 在 SSJS session 上(同 Java/LS)。
- getContents(response.getOutputStream()) 合法:response 的 OutputStream 就是
  java.io.OutputStream → 把 stream 內容直接串給下載,不落地暫存檔。
- 讀上傳檔:xp:fileUpload 會把檔存成伺服器端暫存檔,拿它的路徑 open stream 讀。
- charset 預設 System 跟 Java 一樣會咬 → 指回 java-stream 深講,這篇只給修法。
- thread 限定 → 別把 stream 塞進 scope 變數跨 request 重用。

## 矛盾檢查

- 無(SSJS 與 Java 的 Stream 是同一後端類別,行為一致)。

## 交叉引用（內部）

- `/domino-news/posts/java-stream/` — charset 預設坑的深講(#1)
- `/domino-news/posts/ssjs-backend-document/` — XPages 後端文件
- `/domino-news/posts/xpages-scope-variables/` — scope / 生命週期(別跨 request)

## 外部來源（diversity:每語言 3 不重複 URL，各 33%）

1. NotesStream (SSJS) — r_domino_Stream.html
2. open (NotesStream - SSJS) — r_domino_Stream_open.html
3. writeText (NotesStream - SSJS) — r_domino_Stream_writeText.html

## 標題候選

- [汰除] 純功能:`XPages 的 Stream:讀寫檔案` — 目錄、與 #1 太像。
- [選定] concept＋好處:`XPages 的 Stream:用 getContents 產檔下載,charset 要自己給`
  — XPages 專屬 hook(getContents→response)、好搜、不過度承諾。
  en 鏡像:`Stream in XPages: Build a Download with getContents, and Set the Charset Yourself`

## 驗證清單

- [x] SSJS 真有 Stream + 全方法(逐字驗 r_domino_Stream*)
- [x] 官方逐字(class/open/writeText)、charset 預設 System、EOL_NONE
- [x] 與 #1 java-stream 區隔(XPages 場景、charset 指回不重講)
- [ ] coversClass: Stream + apiLang: ssjs(map-lang-report → SSJS 燈)
- [ ] 3 不重複外部來源 < 40%
- [ ] humanizer / temp-copy build
