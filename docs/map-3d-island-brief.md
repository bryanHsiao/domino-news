# /map/ 3D 等角島嶼化 — 起始 brief

- 建立日期：2026-10-28
- 分支：`feat/map-3d-island`
- 狀態：**先蒐集 context，尚未動手實作**。規劃討論在指向本分支的新 session 進行。

這份 brief 只收納「本輪對話已確定的事實與素材」，不含實作計畫或任務清單——
那些留給新 session 討論後再寫。

---

## 起始 context（使用者原話）

> 我想仿照 https://puma.taipei/heart-island 把我的 map 也做成這種方式顯示
> （https://bryanhsiao.github.io/domino-news/map/）。先開 session，後續規劃討論。

附帶的風格回饋脈絡：此前在做 domino-news 的日報文章，這是另一條獨立的視覺改造線，
因此刻意用 feature branch + 新 session 跟文章 thread 分開。

## 參考素材

- **風格參考**：https://puma.taipei/heart-island
  （台北市府「FUTURE SOON. 台北順起來 — HEART 政策島」互動地圖）
- **要改造的頁面**：https://bryanhsiao.github.io/domino-news/map/
- **已附截圖**：參考站的首屏。畫面重點特徵：
  - 3D low-poly 等角島嶼群，每個政策主題一座島，島上有建築/人物/植被
  - 每座島有編號名牌（如「04 教育」「01 市府核心」），浮在島上方
  - 右側欄「THE POLICY INDEX」：大標 + 「14 項政策主題／94 個細項」計數 +
    一份可捲動的主題清單（每項帶細項數與箭頭）+ 搜尋框 + 「政策主題／協作關係」切換 tab
  - 頂部工具列：左側光線時段切換（晨／日／昏／夜四顆）、中段檢視模式
    （名牌／搬運／協作線／暫停／鳥瞰／日誌）、右側 全景／角色／清單／?
  - 一個「你是台北的哪一種人？」七題問卷入口

## 現有 `/map/` 的技術現況（本輪已盤點）

- 頁面：[`src/pages/map.astro`](../src/pages/map.astro)（zh-TW）、
  [`src/pages/en/map.astro`](../src/pages/en/map.astro)（en），約 80 行。
- 目前有**兩種 2D 檢視**，用上方 tab 切換：
  - **分類檢視**：元件 `src/components/ClassDirectory.astro`（依類別分區的卡片）
  - **關係圖**：元件 `src/components/ClassMap.astro`（節點散點／關聯圖）
- **資料來源**：[`data/ls_classes.json`](../data/ls_classes.json) —— HCL Domino
  LotusScript 類別目錄，97 個類別（node 有 `id`/`name`/`category`/`isUI`/`key`/
  `x`/`y`/`description`；link 有 `source`/`target`/`members`）。
  source 來自 OpenNTF/ls-classmap（見 `data/README.md`）。
- 每個 node 若對應到已寫過的文章，會帶上文章 slug 連結（透過 `scripts/lib/coverage.ts`
  的 `buildCoverageReport()` 比對）。
- 既有站台框架：Astro + `BaseLayout.astro`、i18n（`src/i18n/ui`）、既有設計系統 tokens
  （`--color-brand-dark` 等）、雙語。部署走 GitHub Pages。

> 對照：參考站是「政策主題」為單位（14 島），本站現有資料是「LotusScript 類別」
> 為單位（97 類別、分屬數個 category）。島＝什麼分組，是待討論的第一題。

## 待討論（open questions，非決定）

1. **3D 技術選型**：Three.js／R3F 即時渲染，還是預烘焙等角插畫（Blender 出圖）+
   HTML hotspot 疊圖？兩者在效能、可維護性、資料驅動程度上差很多。
2. **「島」的對應**：一座島 = 一個 LotusScript category？還是重新設計分組？
   97 個節點要怎麼收進少數幾座島而不擁擠。
3. **資料與座標**：沿用 `ls_classes.json` 的 x/y 還是重算佈局；是否需要新的
   per-island 佈局資料。
4. **範圍**：是整頁重做、還是在現有兩視圖之外新增第三個「島嶼檢視」tab 當漸進式。
5. **保留功能**：節點→文章連結、搜尋、雙語、覆蓋率計數要不要都接上。
6. **效能／行動裝置**：參考站在手機上的體驗、首屏載入、低階裝置 fallback。
7. **與現有設計系統整合**：配色、字體、深淺色主題要不要延續站台既有 tokens。

## 建議的下一步（在新 session）

- 把新 session 的分支切到 `feat/map-3d-island`，先讀這份 brief。
- 先把上面「待討論 1、2、4」收斂（技術選型、島的對應、範圍），再談資料與實作。
- 需要時用瀏覽器實際打開參考站與現有 `/map/` 對照互動行為。

---

## 規劃決議（2026-10-28）

母 session 的規劃討論已收斂，下列四項為**定案**，不再重新選型。接著在
`feat/map-3d-island` 的子分支上實作 v1。

### 四項定案

1. **技術選型 → 即時 Three.js**。真 3D、程序化生成，不走預烘焙插畫 +
   hotspot 疊圖。理由：島與建築要資料驅動（島大小、建築數跟著
   `ls_classes.json` 走），插畫路線每次資料變動都要重出圖、維護成本高。
2. **島的對應 → 17 個 category 一對一**。一座島 = 一個 LotusScript
   category，共 17 座；**島的大小 ∝ 該 category 的 class 數**。不重新設計
   分組、不把 97 個節點硬收進少數幾座島。
   - 數量分佈（已核對 `data/ls_classes.json`，97 class / 197 link）：
     DOM/XML 25、Session 10、Rich Text 9、UI 8、Database 7、Document 6、
     Item 5、View 5、Admin 4、JSON 4、Calendar 3、GPS 3、DQL 2、
     DominoIQ 2、Composite Apps 2、HTTP 1、Session File Operations 1。
3. **範圍 → 新增第三個「島嶼檢視」tab**。漸進式，不動現有兩個視圖
   （分類檢視 `ClassDirectory.astro`、關係圖 `ClassMap.astro`）。這兩個
   tab 必須維持原樣能跑。
4. **v1 精緻度 → 靜態精緻**。先把靜態的島群做漂亮、互動做順，先不做
   日夜光照、搬運動畫、協作線——那些排進 Phase 2/3。

### v1 實作骨架

- **新元件** `src/components/ClassIslands.astro`，比照 `ClassMap.astro` /
  `ClassDirectory.astro` 既有慣例：
  - props：`lang` / `data`（`{nodes,links}`）/ `coveredCount` / `total`，
    由 `src/pages/map.astro`（及 en）傳入，與另兩個元件同一組。
  - 雙語 `T` 字串物件（zh-TW / en 兩套）。
  - `<style is:global>` 全部作用域包在 `#ci` 底下；深淺色主題比照另兩個
    元件（`@media (prefers-color-scheme: dark)` + `:root[data-theme=...]`）。
  - JSON payload 塞 `<script type="application/json">`；init 綁
    `document.addEventListener('astro:page-load', ...)`，用 `dataset.ready`
    防重入。
- **Three.js 延遲載入**：用動態 `import()`，只在第一次切到島嶼 tab 時才載
  three，不拖累現有兩視圖首屏。three 從 npm 裝（`three` + `@types/three`）。
  偵測 WebGL 不可用時 fallback（顯示提示 + 導回分類檢視）。
- **程序化島佈局**：17 個擠出六邊形島台，大小 ∝ class 數；六邊形環狀排盤
  （core 脊椎 Session / Database / View / Document / Item / Rich Text 置中，
  其餘依數量繞外圈）。排序固定讓島不跳位。**純程序化算，不新增手刻佈局
  資料檔**。
- **建築**：每島上每個 class 一個 instanced 方塊（共 97 個），顏色 / 高度
  帶出 已涵蓋 / UI / key（沿用 be / ui / un / key 語意與配色）。
- **名牌**：每島一個浮空 HTML overlay，把 3D world 座標投影到螢幕 —— 編號
  + category 名 + class 數。
- **互動**：OrbitControls 自由轉看；點島 → 相機聚焦該島 + 右側面板列出該
  category 的 classes（沿用 `ClassDirectory` 面板 UX / 樣式）；點建築 →
  開該 class 文章（`node.url`）；搜尋框過濾；97/97 覆蓋率徽章；全雙語。
- **設計系統**：UI chrome（名牌 / 面板 / tab）沿用站台 dark navy
  `--color-brand-dark` + 金色 `--color-brand`（#fbbf24）；3D 場景本身用
  溫暖 low-poly 配色調和。
- **接線**：`map.astro`（zh-TW）與 `en/map.astro`（en）各加第三個 tab
  按鈕「島嶼檢視 / Islands」與 `#mv-islands` 容器，掛 `ClassIslands`；
  沿用 map.astro 既有那段 inline tab-switch script（切到島嶼 tab 時比照
  graph 發 resize / 觸發 lazy-init）。

### Phase 2 / 3 roadmap（本次不做）

- **Phase 2**：日夜光照切換（晨 / 日 / 昏 / 夜）、鳥瞰視角、島「呼吸」
  （細微起伏動態）。對應參考站頂部的光線時段與鳥瞰工具。
- **Phase 3**：協作線 —— 把 `ls_classes.json` 的 197 條 links 畫成島與島
  之間的連線 / 搬運動畫（「A 的方法回傳 B」的關係在 3D 場景裡視覺化）。

### 分支與基礎建設定位

- 這條線在 feature branch `feat/map-3d-island`，與站上日報文章工作分開。
  本次實作落在從 `feat/map-3d-island` 切出的子分支，commit 先進子分支，
  之後再 merge 回 `feat/map-3d-island`。
- 這是**站台基礎建設（元件 / build）**，不是技術文章，所以**不需要**跑
  CLAUDE.md 的 NotebookLM 研究鏈 —— 程式碼靠 build 驗證自己。

---

## 參考站研究與 v1.1 視覺規格（2026-10-29）

v1 第一版（單一六角柱 + 方塊建築 + 深色海）使用者看過後回饋「外觀差距蠻大」。
重新實地拆解參考站後的結論與改版規格如下。

### 參考站實際做法（2026-10-29 用瀏覽器拆解）

- **全程序化，沒有任何 3D 模型或貼圖檔**。Three.js r160，只用到
  `RoundedBoxGeometry`、`SimplexNoise`、`BufferGeometryUtils`、`OrbitControls`、
  `CSS2DRenderer`；所有建築、樹、人、船都由小零件（圓角方塊、四角錐屋頂、
  抖動過的 icosahedron 樹冠…）拼成，依幾何種類收成 InstancedMesh。
  → 我們選的「即時程序化」路線是對的，差距在手工細節與密度。
- **島＝同尺寸的尖頂六角磚**，在 axial hex grid 上緊密排列，鄰島之間架橋。
  每塊磚：有花紋的地面（canvas 產生的草地 / 地磚 / 木棧板…）、一圈步道鋪面、
  緣石、**島緣裝飾帶**（磚牆、木板、條紋…）、往下的裙邊用「淺水色→海水色」
  漸層（看起來是從淺灘浮出，不是一面土牆）、外圍一圈淺水光暈 + 白色浪花。
- **環境**：天空球漸層 shader、暖米色霧（`#f4eee3`）、藍綠色海面 shader、
  SimplexNoise 做出環繞城市的盆地山脈（鏡頭那側壓低），山上散布樹與小屋，
  海上有小島、燈塔、船、雲。
- **算圖**：fov 32°（接近等角）、ACES Filmic tone mapping、PCF 軟陰影只算一次、
  鏡頭仰角 25–70°、不可平移。
- **名牌**：米白圓角膠囊、珊瑚色等寬編號、深色字，掛在每座島的前緣
  （不是浮在島正上方）；選中時反白（深底 + 黃編號），其他名牌變淡。

### v1.1 改版規格（取代 v1 外觀）

- **島大小 ∝ class 數 → 改用「磚數」表現**：每個 category 是一座由
  `ceil(class 數 / 6)` 塊六角磚組成的島（DOM/XML 5 塊、Session / Rich Text /
  UI / Database 各 2 塊、其餘 1 塊，共 25 塊）。同島相鄰磚之間補地面接起來，
  不同島相鄰處架木橋。仍維持決議 2「17 島一對一、大小 ∝ class 數」。
- **排盤**：核心脊椎先放在中央，其餘依數量往外長；以決定性規則挑格子
  （距中心距離、角度、座標依序比較），同一份資料永遠得到同一張地圖。
- **建築**：每個 class 一棟小房子（圓角牆身、四角錐屋頂、窗、門、底座），
  **屋頂顏色**帶語意：後端＝藍、UI＝紫、未涵蓋＝灰色平頂且較矮、
  key class＝金色屋頂 + 三層樓 + 屋頂小旗。空位種樹，磚上加步道、路燈、
  灌木、行人增加密度。
- **環境**：照搬上述天空 / 霧 / 海 / 盆地山脈 / 衛星小島 / 燈塔 / 船 / 雲的
  做法（自行實作，參數取同一套暖色系）。場景永遠是白天，不跟站台深色模式切換
  —— 參考站本來就只有「場景內」的時段，沒有網頁深色主題。
- **名牌與面板**：場景內的覆蓋層（名牌、懸停提示、右側面板、圖例）改用
  參考站的米白 / 珊瑚 / 墨色配色，才會跟明亮場景搭；**頁面標題列、tab、
  覆蓋率徽章仍用站台 tokens**（navy + 金）。這是對 v1「UI chrome 沿用站台
  配色」的刻意修正：只限縮到場景外的 chrome。
- **互動**：維持 v1（點島聚焦出面板、點建築開文章、搜尋、重設、雙語、
  WebGL fallback、延遲載入），新增**滑鼠懸停建築顯示 class 名稱**提示
  （不然看不出哪棟是哪個類別）。
- **程式結構**：3D 部分從 `.astro` 拆到 `src/components/islands/*.js`
  （layout / textures / kit / world / environment / scene），整包在切到
  島嶼 tab 時才動態載入。

### 仍屬 Phase 2/3、這次不做

日夜光照切換、行人搬運動畫、協作線（197 條 links）、鳥瞰模式、問卷入口。

---

## v1.2 回饋修正（2026-10-29）

使用者看過 v1.1 後的三點回饋與處理：

1. **「範圍擴大、跟參考站一樣；關係圖也該大一點，不該侷限在那個區塊」**
   → 關係圖與島嶼檢視改成**滿版**：寬度撐滿視窗（JS 量 `clientWidth`，避開
   捲軸造成的橫向捲動），高度從 header 下緣一路填到視窗底。分類檢視是閱讀用
   卡片清單，維持站台 1200px 內容寬度。島嶼檢視的標題、覆蓋率、搜尋、重設
   改成浮在場景左上的米白卡片（對應參考站左上的品牌卡）。
2. **「切換 tab 卡在中間很怪」** → 寬螢幕（≥1280px）在滿版檢視時，切換鈕
   浮在內容上緣正中（對應參考站頂部工具列）；窄螢幕中間沒空位，維持在內容
   最上方。
3. **「每個島要依屬性有自己的主題建築，不要每個島都一樣」** → 新增
   `islands/landmarks.js`：
   - **每座島一個地標**，放在最靠近島中心的那塊磚上：Session 市政廳（柱廊＋
     鐘樓）、Database 疊層圓柱塔（資料庫圖示）、View 瞭望塔、Document 紙堆＋
     郵筒、Item 貨箱場＋吊車、Rich Text 劇院（跑馬燈、屋頂字塊）、DOM/XML
     節點樹、UI 按鈕控制台、Admin 管制塔、JSON 貨櫃港、Calendar 鐘塔、GPS
     衛星碟＋羅盤、Composite Apps 積木塔、DominoIQ 玻璃圓頂＋帶環光球、
     DQL 天文台、HTTP 電波塔、Session File Operations 檔案櫃。
   - **每座島的房子用自己的建築語彙**：屋頂形狀（四角錐 / 人字 / 平頂 /
     鋸齒 / 圓頂 / 尖錐）、方形或圓柱牆身、牆色、高瘦或矮寬比例、空位植栽
     （闊葉 / 松樹 / 櫻花 / 秋色 / 貨箱）。
   - **屋頂顏色不跟主題走**，維持圖例語意（藍後端 / 紫 UI / 灰未寫 / 金 key）。
   - 未來 catalogue 新增的 category 走 fallback 主題（方尖碑地標），不會壞。

4. **「分類檢視也跟關係圖一樣排版，看起來比較一致」** → 分類檢視也滿寬，
   標題列與搜尋列改成跟 `ClassMap` 同一套（全寬標題列：左標題＋說明、右深色
   覆蓋率膠囊；下方全寬搜尋列）。寬螢幕下三個檢視的切換鈕都浮在標題列正中。
   順手修掉分類明細面板捲動時鑽到 sticky header 底下的舊問題。

另外：名牌改為每幀防重疊——依「選中 → 類別多 → 離鏡頭近」排序擺放，會撞到
已擺好的名牌就縮成只剩編號，滑鼠移上去或選中時展開名稱。
