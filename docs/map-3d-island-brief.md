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

### v1.3：依類別關係排島、只在有關係的島之間架橋（2026-10-29）

回饋：「島上到處都走得到；讓島分開一點，參考各類別間的關係打造可以走到的路線
（參考站允許有人在上面走動，未來可引入）」。

- **關係資料**：`ls_classes.json` 的 197 條 link 中有 80 條跨類別，彙整成 33 組
  類別配對（例：Database⇄Document 7、Session⇄Database 6、Session⇄DOM/XML 6、
  DOM/XML⇄Session File Operations 5、Document⇄Item 5…）。Session 是樞紐
  （14 個關係對象），每個類別至少有一條對外關係。
- **排島**：先放 Session，再依「跟已放的島有幾條關聯」挑下一座，同分時讓關係
  幾乎都指向已放島的小島先選位，並優先貼在關係對象旁邊；多磚島往外長，不把
  樞紐包住。
- **分開**：排好後各島往外推（×1.25），再逐對修正到每條水道至少 1.3（整座島
  剛性平移，同島的磚不分開）。
- **橋只蓋在有關係的島之間**：相鄰的有關係島直接架橋；不相鄰但中間沒有其他島
  擋路的，蓋跨水長橋（≤ 7.5，給還沒有關係橋的島、或 3 條以上的強關係）。最後
  若有島走不到，才補一座「步道」（無直接關聯，懸停會說明）。目前結果：23 座橋
  中 22 座對應真實關係，只有 DominoIQ 一座步道（它只跟 Session 有 1 條關聯，
  Session 周邊放不下所有 14 個對象）；最窄水道 1.3；全部 17 座島都走得到。
  - 核心脊椎全部直達：Session⇄Database、Database⇄Document、Document⇄Item、
    Session⇄DOM/XML、DOM/XML⇄Session File Operations、Session⇄Rich Text。
  - 平面上無法讓每組關係都直達（例如 Item⇄Session 4 條要經 Admin 步行）；
    面板會標示「⇄ 有橋直達 / ⋯ 經其他島步行」。
- **橋的樣式＝關聯強度**：4 條以上寬石橋（矮牆）、2–3 條木橋、1 條窄木橋、
  步道為繩橋；長跨距拱得更高並加橋墩。
- **互動**：滑鼠指橋顯示「A ⇄ B · N 條關聯」與實際經由的類別／成員（如
  `NotesDatabase.CreateDocument → NotesDocument`）；選島時它的橋亮成珊瑚色；
  面板新增「與其他島的關聯」，點了飛過去。
- **為未來行人預留**：`layout.walk` 是行人路網（每塊磚步道環 12 個節點、同島磚
  之間相連、橋兩端相連；共 300 節點），`walkPath()` 可算最短步行路線（例：
  DQL → Database → Session → Session File Operations）。v1 不畫出來，Phase 2/3
  加入走動的人時直接用。

### v1.4：小螢幕改成參考站式的佈局（2026-10-29）

回饋：「小畫面參考參考站佈局；標題框照它設計，搜尋拉出來做成按鈕，其他功能
也做成小按鈕；圖例小螢幕不用呈現」。使用者選擇「檢視切換也併進右側小按鈕列」。

- 760px 以下（手機）滿版檢視：
  - **左上品牌卡**：大字珊瑚色「LotusScript」＋「類別島嶼」＋小覆蓋率膠囊；
    說明文字與搜尋列收起。
  - **右上直排小按鈕**（米白圓角、圖示＋字，寬 100px）：全景（重設視角）、
    搜尋（點了才在品牌卡下展開輸入框，再點收起並清除搜尋）、清單（底部抽屜
    列出 17 座島，點了飛過去），接著是**另外兩個檢視的切換鈕**（目前檢視不
    顯示）。關係圖沒有自己的工具列，切換鈕就接在它的搜尋列下方。
  - **圖例隱藏**（島嶼與關係圖都是）。
- 761–1279px（平板）維持底部分頁列；1280px 以上維持浮在標題列正中。

### v1.5：手機版三個檢視統一成同一套側邊按鈕（2026-10-29）

回饋：「不管哪一個顯示方式，應該都可以使用跟島嶼檢視一樣的側邊按鈕 UI」「可以
呈現 2 個字精簡一點」。

- 760px 以下，**分類檢視、關係圖、島嶼檢視都是同一個版面**：左上品牌卡
  （大字珊瑚色 LotusScript＋檢視名＋覆蓋率）、右上一排小按鈕（寬 68px、圖示＋
  兩字），檢視切換接在各自工具下方、目前檢視不顯示。
  - 分類檢視：搜尋（抽屜：搜尋＋全部／後端／UI）、清單（底部列出 17 個分類，
    點了捲到該區）；圖例與分類跳轉標籤隱藏。按鈕列固定在畫面右上（此檢視會捲動）。
  - 關係圖：全景（全覽）、搜尋（抽屜：搜尋＋分類選單）；標題列變浮動品牌卡、
    圖用滿整個高度；圖例隱藏。
  - 島嶼檢視：全景、搜尋、清單（不變，只是按鈕改窄、英文改短）。
  - 按鈕名稱：全景／搜尋／清單／分類／關係／島嶼（英文 Fit／Find／List／
    Cards／Graph／Isles）。
- 三個檢視的標題統一以 LotusScript 開頭（分類檢視從「HCL Domino 類別地圖」改為
  「LotusScript 類別地圖」）。
- 覆蓋率膠囊加滑鼠提示，說明「97 個類別中已有 N 個寫成文章」的意思。

### Phase 2：讓島活起來（2026-10-29）

- **白天夜晚**：清晨／白天／黃昏／夜晚四個時段（`environment.js` 的 `TIMES`），
  切換時約 1.2 秒漸變天空、日光（夜間為月光）方向與顏色、環境光、海色、霧色，
  陰影只在漸變期間重算。夜間係數點亮窗戶、路燈、燈塔與幾個地標的燈（kit 的
  `glass`／`bulb` 零件共用一個會發光的材質），天空出現星星。
- **行人走動**：42 個小人沿 `layout.walk` 路網散步，每次隨機挑另一座島當目的地
  （`walkPath` 最短路徑），走過橋時跟著橋拱起伏（拱高由 layout 算、與畫出來的橋
  一致）。路燈移到緣石、靜止的人移到草地，讓出步道。
- **俯瞰模式**：鏡頭飛到幾乎正上方，可旋轉與縮放；離開或按「全景」回到預設視角。
  選島時在俯瞰下維持俯視角。
- **船隻漂動**：船改用獨立零件，緩慢繞小圈、輕微起伏與搖晃。
- **操作**：桌機在標題卡多一列「晨／日／昏／夜」＋「俯瞰」；手機在右側按鈕列多
  「時間」（顯示目前時段，點一下換下一個）與「俯瞰」。
- **減少動態效果**（`prefers-reduced-motion`）：行人站著不動、船與海面靜止、
  時段與鏡頭直接切換不漸變。

仍留給 Phase 3：搬運動畫（在有關係的島之間搬東西）、197 條類別層級關聯的關係線
疊圖、問卷入口。

另外：名牌改為每幀防重疊——依「選中 → 類別多 → 離鏡頭近」排序擺放，會撞到
已擺好的名牌就縮成只剩編號，滑鼠移上去或選中時展開名稱。

### 人物改版（2026-10-29）

使用者回饋：行人只是「圓柱＋圓球」，像木頭樁，要照參考站的人物做。參考站的人是
Q 版比例：大圓頭（約佔身高一半）、深色髮帽（有的綁包頭）、圓角身體、短腿短手，
不少人雙手捧著黃色箱子。

- 新增 `people.js`：一個人由腿×2、手臂×2、手×2、身體、頭、髮帽、包頭、眼睛×2、
  箱子組成，每個部位一個 InstancedMesh（整群人固定 9 個 draw call）。髮帽是
  往後傾的球冠，前緣露出臉、後緣蓋住後腦；膚色、髮色、上衣、褲子與體型各自隨機。
- **走路動作**：腿前後交替擺、手臂反向擺、身體隨步伐輕微上下；擺動角度按走過的
  距離推進（步幅 0.15），走快走慢腳步都對得上。約三成行人捧著箱子走，雙手
  向前托住（搬運動畫的前身）。
- 島上站著的人改用同一套模型（`props.person` 只記位置與朝向），會投影。
- 人物整體放大到約 0.32 高；鏡頭最近距離從 5 降到 2.2，拉近才看得到人物細節。
- 減少動態效果時行人站著不動、不擺手腳。

### Phase 3a：關聯線、搬運、暫停（2026-10-29）

使用者拍板先做 3a，問卷入口之後另開 PR（題目文案待定）。

- **關聯線**（`links.js`）：197 條類別關聯畫成屋頂到屋頂的弧線，距離越遠拱越高；
  跨島為珊瑚色、島內為青綠色。預設「選取」模式平常不顯示，只有選了島（該島所有
  類別的關聯）、滑鼠指著房子、或指著側欄的類別列時，才亮起相關的線，以流動虛線
  表示 A → B 的方向（A 的方法／屬性回傳 B）。「全部」模式另把所有關聯畫成淡淡的網，
  「關」則完全不畫。房子的提示框多一行「N 條關聯」。線用 three 的 `LineSegments2`
  （可設像素粗細），每次焦點改變重建幾何。
- **搬運**：行人增為 54 人，約四成捧箱子當搬運工。每位搬運工被指派一組有關聯的
  兩座島，按關聯數加權抽選（關聯越多的兩島分到越多人，例如 Database ⇄ Session），
  在兩島之間沿路網來回；每跑三趟改接所在島的另一組關聯。選了某座島時，跑這座島
  的搬運工箱子變珊瑚色。其餘行人照舊隨機散步。
- **暫停**：凍結行人、船、海面、雲與關聯線的流動，鏡頭仍可操作。
- **操作**：桌機標題卡多一列「關聯線 關／選取／全部」＋「暫停」。手機右側按鈕列把
  「時段」與「俯瞰」收進一顆「檢視」（點開在按鈕列左側彈出晨／日／昏／夜與俯瞰，
  點外面收起），另加「連線」（按下＝全部，再按回選取）與「暫停／繼續」，共六顆
  ＋檢視切換兩顆。

### 互動模型：先預覽、再前往（2026-10-29）

使用者要求把「資訊預覽」和「轉跳文章」分開，照參考站「先看基本內容、要過去再連過去」。

- **房子（類別）**：點了不再直接開文章，改開類別介紹卡：類別名、所屬 category（可點
  回該島）、後端／UI／key class 標籤、關聯數、HCL 的 description。文章連結是卡片裡的
  次要按鈕「前往文章 →」（連到主要文章），下面列出這個類別的文章，點了換成文章預覽卡。
  島嶼清單裡的類別列也改成開介紹卡。卡片開著時，該類別的關聯線保持亮起。
- **人物＝文章**：每個已寫成文章的類別，房子門口站著 1～3 個人，一人代表一篇主要文章
  （共 97 個類別、134 人）。人站在房子背對島中心的那一側、面朝外。點人跳出文章預覽卡：
  標題、日期、文章 description、「前往文章 →」、「關於 NotesX」（點回類別卡），以及同
  類別的其他文章。不會直接轉跳。路上散步的行人和搬運工仍是裝飾，不能點。
- **主要文章怎麼算**（`src/lib/classArticles.ts`）：從 coverage 報告（文章 sources 或
  內文連到該類別或其成員的 HCL 文件）出發，只留「類別名出現在標題」或「類別自己的文件頁
  在 sources 裡」的文章；前者排前面，同分新的在前，最多 3 篇。只是順帶提到的文章不算。
  標題與 description 依頁面語言取自已發布的中／英文版。
- **資料模型留了擴充空間**：每個類別帶 `articles: [{ lang, title, desc, url, date }]`，
  目前 `lang` 一律 `'ls'`。之後若有同一類別的 Java／SSJS 文章，加進同一陣列、各帶自己的
  `lang` 即可，人物也可依 `lang` 上色。這次只做 LotusScript。
- 提示框：指著房子顯示「點一下看類別介紹」，指著人顯示文章標題與「點一下看文章預覽」；
  點水面會關掉卡片。

---

## 多語言架構（coversClass / coversIsland / apiLang）（2026-10-29）

地圖原本只畫 LotusScript 的 97 個類別。這一節定義「地圖也納入 Java 與 SSJS」
的**資料層架構**。這次只做資料層（新增 frontmatter 欄位＋讓 build 接受＋回標
現有語言文），**3D 渲染本身（實際點亮語言燈、畫出 XPages 島）留待後續 PR**；
對應的渲染 helper（讀 frontmatter → 算每個節點的 `{ls,java,ssjs}` 燈、XPages
島成員）也一併留待後續。

### 已拍板的決策（母 session 規劃收斂，不重新討論）

多語言用「依內容本質」的**混合**做法，Java 與 SSJS 刻意不對稱：

1. **後端類別文**（Java 幾乎全部、少數講後端類別的 SSJS 文）→ 在**既有節點掛
   語言燈**，不另開島。因為後端類別在 LS／Java／SSJS 幾乎 1:1 同構
   （`NotesSession` / `NotesDocument` / `NotesDateTime`… 是同一個類別換語言
   綁定），另開島會把 97 個節點整組複製、九成是空的。
2. **XPages／網頁層概念文**（scope variables、partial refresh、managed beans、
   `sessionAsSigner`、binding 生命週期… 沒有對應的 Notes 類別）→ 進一座獨立的
   **「XPages／網頁層」島**。
3. **真相來源用文章自己的 frontmatter**，不是中央 JSON。以後寫新語言文加一行
   frontmatter 就自動長燈／進島——這是「**累積方向**」。
4. ⚠️ **不能**用 `coverage.ts` 現有的 `javaMentions` / `ssjsMentions` 當燈號：
   它們是從 **LS 文**的 `relatedJava` / `relatedSsjs` 建的、指回 LS 文本身，
   不是 Java／SSJS 獨立文；URL 也接不起來（javadoc URL vs `dom_designer`
   的 LS doc URL）。新欄位方向相反、獨立於它（見下）。

### 三個欄位（都是 optional，定義在 `src/content.config.ts`）

| 欄位 | 型別 | 意義 |
|---|---|---|
| `coversClass` | 字串或字串陣列 | 值＝`data/ls_classes.json` 的節點 id（全名，如 `NotesSession`），或 Java 原名（如 `Stream`，2026-10-30 起自動換算，見下方「Java 執行環境島與名稱換算」）。表示這篇教的是哪個 Notes 類別 → 該節點點亮 `apiLang` 的燈。一篇同時教兩個類別時用陣列（如 DXL 的 `NotesDXLExporter` / `NotesDXLImporter`）。 |
| `coversIsland` | 字串 | `"xpages"`（網頁層概念文、沒有對應類別 → XPages 島）或 `"java-runtime"`（Java 專屬執行環境 → Java 執行環境島，2026-10-30 加）。 |
| `apiLang` | `"java"` \| `"ssjs"` | 這篇是哪個程式語言。LS 文不設、維持現狀。 |

**規則（schema 的 `superRefine` 強制，違反時 build 失敗）**：一篇最多設
`coversClass` 或 `coversIsland` **其一**；只要設了其一，就**必須**有 `apiLang`。

### 決策規則（一句話）

> **這篇在講一個現有 Notes 類別嗎？** → `coversClass`（+`apiLang`）。
> **在講 XPages／網頁層、沒有對應類別嗎？** → `coversIsland: "xpages"`（+`apiLang`）。
> **在講 Java 專屬執行環境嗎？**（Factory／Thread／Exception／AgentContext／
> recycle）→ `coversIsland: "java-runtime"`（+`apiLang: "java"`）。（2026-10-30 加）
> **純跨切面概念、以上皆非** → 兩個都不設，先不上地圖。

與 `relatedJava` / `relatedSsjs` 的差異見 `CLAUDE.md` 的「Cross-language
linking strategy」一節。

### 本次回標結果（2026-10-29）

**`coversClass`（`apiLang: java`）— 6 篇**

| slug | coversClass |
|---|---|
| `java-session-notesfactory` | `NotesSession` |
| `java-document-items` | `NotesDocument` |
| `java-datetime` | `NotesDateTime` |
| `java-dql-dominoquery` | `NotesDominoQuery` |
| `java-dxl-exporter-importer` | `NotesDXLExporter`, `NotesDXLImporter` |
| `java-agent-anatomy` | `NotesAgent` |

**`coversClass`（`apiLang: ssjs`）— 2 篇**

| slug | coversClass |
|---|---|
| `ssjs-session-evaluate-formula` | `NotesSession` |
| `ssjs-vector-multivalue` | `NotesItem` |

**`coversIsland: "xpages"`（`apiLang: ssjs`）— 10 篇**

`xpages-attachment-multi-delete`、`xpages-save-conflicts`、
`xpages-scope-variables`、`xpages-sessionassigner`、`xpages-managed-beans`、
`xpages-partial-refresh-execution`、`xpages-multi-column-category-document`、
`xpages-ssjs-runonserver-stale-document`、`xpages-getdocument-applychanges`、
`xpages-binding-rendered-loaded-performance`。

每篇 en 與 zh-TW 兩份都已回標（共 19 slug × 2 = 38 檔）。

亮燈結果（`npm run map-lang-report` 實跑核對）：Java 燈共點亮 **8 個節點**
（`NotesSession`、`NotesDocument`、`NotesDateTime`、`NotesDominoQuery`、
`NotesDXLExporter`、`NotesDXLImporter`、`NotesAgent`、`NotesLLMRequest`——6
篇 Java coversClass 文裡 DXL 一篇覆蓋兩個節點，再加判斷題的 `NotesLLMRequest`，
故 6 篇 → 8 節點）；SSJS 燈落在 **2 個節點**（`NotesSession`、`NotesItem`）；
XPages 島 **10 個成員**。`NotesSession` 同時有 Java 與 SSJS 燈（分別來自
`java-session-notesfactory` 與 `ssjs-session-evaluate-formula`）。

### 判斷題（照決策規則自定，附理由）

> 2026-10-30 更新：下表前四列（recycle／collection-iteration／notesexception／
> notesthread）已改判，現行決定見下方「Java 執行環境島與名稱換算」一節；這張表
> 保留 10-29 當時的判斷與理由。

| slug | 決定 | 理由 |
|---|---|---|
| `java-recycle-memory` | 兩欄都不設 | 跨切面記憶體管理（`recycle()`），不教單一類別 → 先不上地圖。 |
| `java-collection-iteration` | 兩欄都不設（borderline） | 核心教訓是「先取下一個再 recycle 這個」的**記憶體／順序模式**，與 `java-recycle-memory` 同一主題；標題雖點名 DocumentCollection（`NotesDocumentCollection` 確實是節點），但不教該類別的方法／屬性，掛 Java 燈會讓地圖**過度承諾**「有一篇教這個類別」。若日後覺得該亮，改 `coversClass: NotesDocumentCollection` 一行即可。 |
| `java-notesexception` | 兩欄都不設 | error handling 跨切面；`NotesException` 在 LS 目錄中根本沒有對應節點（Java-only 例外類別）。 |
| `java-notesthread` | 兩欄都不設 | threading 跨切面；`NotesThread` 在 LS 目錄中沒有對應節點（Java-only）。 |
| `domino-iq-timeout-java-ssjs` | `coversClass: NotesLLMRequest`，`apiLang: java` | 內容實教 `LLMReq`／`NotesLLMRequest` 類別（`session.createLLMRequest()` 工廠、`completionStream` 方法、`CompletionStreamCallback`），不只是逾時運維。主語言是 Java；文內明言「SSJS 沒有原生 LLM 類別、是直接呼叫 Java API」，所以 `apiLang` 單填 `java` 是**正確**（而非妥協）——SSJS 端並沒有一個 SSJS 版 LLM 類別可點燈。 |

### 留待後續（這次不做）

- 3D 渲染：節點上實際畫出 Java／SSJS 語言燈、XPages 島的建模與擺位。
- 資料層 helper：讀所有文章 frontmatter → 算每節點 `{ls,java,ssjs}` 燈狀態、
  XPages 島成員清單，餵給渲染層（`npm run map-lang-report` 是這個 helper 的
  雛形，目前只印到 console 供核對）。
- `ClassIslands.astro` 與 `src/components/islands/*` 由另一條 session 負責，
  本次未動。

### Java 執行環境島與名稱換算（2026-10-30）

**1. coversClass 名稱自動換算＋排程時檢查。** 以前 `coversClass` 一定要寫 LS 式
節點 id，寫成 Java 原名（例如 `Stream`）build 照樣會過，但旗子不會出現，也不會有
任何提示。現在由 `scripts/lib/mapLanguages.ts` 的 `resolveClassId` 換算，不分
大小寫，依序比對：節點 id → `"Notes"`＋值 → 例外表。依據是 HCL Java A–Z 索引：
58 個類別中有 57 個對得到節點；「Notes＋名稱、不分大小寫」能涵蓋 55 個（其中
`DxlExporter`、`DxlImporter`、`RichTextDoclink` 三個跟節點只差大小寫）；例外只有
`LLMReq` → `NotesLLMRequest`、`LLMRes` → `NotesLLMResponse`。SSJS 的 HCL 文件
標題本來就是「NotesStream (JavaScript)」，跟節點 id 一樣，不需要換算。

`npm run map-lang-report` 改成也掃 `_pending/{en,zh-TW}`，會列出每個 Java
原名換算成哪個節點；只要有 coversClass 或 coversIsland 的值對不到就 exit 1。
寫作流程是 stage 前跑一次。**刻意不在 content schema 擋**：build 不讀
`_pending/`，若在 schema 擋，錯誤要等到發布當天 deploy 才爆出來（跟 CLAUDE.md
記的 YAML 空字串事故是同一類）。

**2. Java 執行環境島（`coversIsland: "java-runtime"`）。** 比照 XPages 島做成
外海島：一篇文章一棟房子，靠長橋連到最近的類別島，點房子會先顯示文章預覽。島名
中文是「Java 執行環境」，英文是「Java runtime」。屋頂用後端藍（XPages 是 UI 紫），
每棟都插 Java 旗（炭墨色，見下方「Java 語言色改炭墨」）。資料層把 `xpages` 改成泛化的 `islands`（`MAP_ISLANDS`），
`ClassIslands.astro` 用 `OFFSHORE` 表列出這兩座島，`layout.js` 不用改：第二座
外海島本來就會沿 `OFFSHORE_ANGLE + 0.7` 放出去，落在群島左前方。

- **不跟 Session 島牽橋。** 雖然 NotesFactory／NotesThread／AgentContext 都是
  取得 session 的入口，但 Session 是群島正中央的樞紐，從外海拉一座橋過去一定會
  穿過別的島。所以照 XPages 的做法，長橋接最近的類別島。這層關係改寫進島嶼說明
  文字（「NotesFactory／NotesThread／例外／recycle」），不靠橋表現。
- **回標**（en＋zh-TW 兩份）：`java-recycle-memory`、`java-notesexception`、
  `java-notesthread` → `coversIsland: "java-runtime"` + `apiLang: "java"`，島上 3 棟。
- **`java-collection-iteration` → `coversClass: ["NotesDocumentCollection",
  "NotesViewNavigator"]`，不進島。** 理由：決策規則先問「在講現有 Notes 類別
  嗎？」，這篇的答案是「是」。標題點名 DocumentCollection；sources 前兩條就是
  `DocumentCollection` 與 `ViewNavigator` 的類別文件；正文實際教這兩個類別的走訪
  API（`getFirstDocument`／`getNextDocument`、`isValid`、什麼時候改用
  ViewNavigator）。recycle 的順序是套用在這兩個類別的迴圈上，不是脫離類別的
  執行環境主題。（10-29 判「borderline 不設」，當時理由是怕過度承諾；現在有了
  「Java 原名可用＋執行環境島」這組選項，它比較像類別文。）
- `java-session-notesfactory` 維持 `coversClass: NotesSession`，不動。

結果（`npm run map-lang-report`）：Java 旗 10 個節點（新增 `NotesDocumentCollection`、
`NotesViewNavigator`）、SSJS 旗 2 個、XPages 島 10 篇、Java 執行環境島 3 篇。

**3. Java 語言色改炭墨（`#2d2d3a`）。** 原本 Java 用藍色 `#4f86c6`，跟後端屋頂
（`ROOF.be`／`--roof-be`）是同一個色碼，右側清單的後端藍點和 Java 旗完全分不出來。母 session
做過色差評估（含綠色弱、紅色弱模擬），炭墨是唯一在三種視覺下都能跟現有顏色（後端藍、UI 紫、
核心金、LS 珊瑚、SSJS 綠、島內關聯線青綠、未寫灰）拉開距離的候選色。改的地方：`world.js` 的
`LANG_FLAG.java`、`signs.js` 的 `LANG_BADGE.java`、`ClassIslands.astro` 的 `.sw.flag.java`／
`.pdot.java` 和說明文字。後端屋頂的藍色不動。深色旗在夜景容易隱沒，所以處理如下：
- Java 旗後面墊一片稍大、較薄的米白板（`FLAG_RIM`），旗面兩側看起來都有一圈淺色邊。
- 門口告示牌的圓章本來就貼在米白底板上，底板就是它的淺色框。
- 清單裡的 `.pdot.java` 加一圈 1px 半透明白環，深色模式的面板上才看得到；淺色背景上看不出這圈環。


## 島外風景、外海 XPages 島、自行車、時段跟時鐘（2026-10-29）

使用者回饋：島外要像參考站一樣有變化、行人可以騎腳踏車；XPages 不算類別，
跟類別群島放一起會誤導，希望離開一點；時段要跟著現在時間切換。

- **XPages 島移到外海**（`layout.js`）：凡是成員帶 `island: true` 的分類（目前只有
  XPages）都算「外海島」，不參與群島的蜂巢排列和推開步驟。改成沿
  `OFFSHORE_ANGLE`（約 63°，右前方、面向預設鏡頭）放出去，跟最近的類別島之間至少留
  `OFFSHORE_GAP` 的水面（原為 6，2026-10-29 使用者覺得太遠，改成 3，跟參考站外圍小島的距離差不多）。間距沿這個方向量，所以每塊地磚都保證留得到。
  一開始放正右方，但手機上名牌會被右側按鈕列蓋住，所以改成右前方。
- **靠渡輪往返、不架橋**（`ferry.js`）：最近的類別島和 XPages 島各伸出一座木棧碼頭
  （有燈），一艘雙頭渡輪在兩座碼頭之間往返，每端停約 3 秒。外海島沒有橋，也不算
  「關聯」；行人路網因此分成兩塊，散步的人只在自己那塊挑目的地（`scene.js` 的
  `region`）。
- **島外風景**（`environment.js`）：
  - 湖岸伸出 5 座木棧碼頭，多數旁邊停小船。
  - 近岸沙灘有三組陽傘加浴巾。
  - 水上有兩座疊滿彩色貨箱的浮台，一座浮動自行車道（綠色車道、白虛線、欄杆、
    一端有階梯、旗桿），還有 12 個夜裡會亮的浮標。
  - 衛星小島多了風車島（兩座白色風力機）和陽傘野餐島。
  - 擺放互相避開（`spots`）。
- **自行車**（`people.js`）：非搬運工的行人裡約三成騎車（`CYCLISTS = 0.3`）。車身包括
  兩個輪子、六根車架管、把手和坐墊；騎車的人身體抬到坐墊高度、腿輪流踩、手握把手。
  車速大約是步行的兩倍，踩踏節奏跟車速連動。
- **時段跟時鐘**：開場照訪客本地時間決定時段（05–08 晨、08–17 日、17–19 昏、其餘夜），
  之後每 20 秒檢查一次，跨過時段就自動漸變，並透過 `onTime` 同步按鈕狀態。
  手動點過時段按鈕後就不再自動跟時鐘。

## OpenNTF 港口、XPages 改長橋、門口改告示牌（2026-10-29）

使用者決定：OpenNTF 採方案 B（岸邊社群港）；XPages 不用船、改長長的橋；
OpenNTF 才用船。另外門口的「人」改成帶「i」圖示的告示牌，讓人一看就知道是介紹。

- **港口成員**：文章 frontmatter 加 `coversHarbour: "openntf"`（`src/content.config.ts`，
  不需 `apiLang`）。目前標了 4 篇（zh＋en）：`openntf-lotusscript-class-map`、
  `openntf-home-drapi-jakarta`、`openntf-nsf-odp-tooling-4-1-0`、
  `openntf-domino-iq-rag-webinar`。`islandArticles()` 回傳 `harbour`，文章語言記為
  `other`，卡片上顯示「社群／Community」。
- **港口位置**（`layout.js`）：成員帶 `harbour: true` 的分類不進蜂巢，放在湖的左後方岸上
  （`HARBOUR_ANGLE`），中心在群島外接圓外 `HARBOUR_OUT`＝3.6。港口不計入
  `bounds`，所以鏡頭取景和湖的大小都不變。左前方試過，但預設視角拍不到，所以改到後岸。
  索引上方的「N 座島」不把港口算進去，港口的編號排最後。
- **港口地形**（`environment.js`）：港口靠陸地的一側和正下方整平成一塊平台，靠湖那側保留
  開放水面，讓碼頭邊緣露出來。樹、小屋、衛星小島、湖岸碼頭、浮台都會避開港口。
- **港口造景**（`harbour.js`，取代 `ferry.js`）：
  - 港口島的地面固定用 boardwalk 木板；地標是燈塔加守塔小屋（`landmarks.js` 的 `beacon`）。
  - 一座 3 單位長的碼頭伸進湖裡，旁邊停兩艘小船。
  - 3 艘載著黃色貨箱的貨船從碼頭開到最近、而且直線航道不會撞島的 3 座島，
    靠岸停一下、調頭，再開回來。
- **XPages 長橋**：外海島改用一座長木橋，從最近的類別島連過去（`bridge.long`，
  `bridgeStyle(0, true)`，橋寬 0.42，每約 2.2 單位一根橋墩）。行人可以走上 XPages 島。
- **門口告示牌**（`signs.js`）：一篇文章一面告示牌，白底板加一個依文章語言上色的圓章
  （LS 珊瑚、Java 炭墨〔2026-10-30 前為藍〕、SSJS 綠、社群灰），圓章裡是白色「i」。點牌子會開文章預覽，
  跟原本點人一樣。原本站在門口的人已經移除，路上走的行人和騎車的人還在。
  告示牌位置：使用者要求放在門口那一側，所以改成站在房子正面（每棟房子的門都在 +z
  面中央）的門前，依序放在門右、門左，再往外排，不會擋到門（`world.js residents()`；
  `house()` 會回傳 `{ top, depth }`）。

### 工具列單列、開場取景依畫面大小（2026-10-29）

- **工具列只排一列**（照參考站）：時段改用四個圖示（日出、太陽、日落、月亮；
  名稱放在 title／aria-label），接著是「關聯線 關／選取／全部」，最後是「全景、名牌、
  暫停、俯瞰」，放在品牌卡右邊。手機版不變。
- **放不下一列就改直排**（使用者要求，照參考站小畫面）：script 會實際量這一列的右緣，
  只要會碰到右上的檢視切換，就在 `#ci` 加上 `.bar-col`。這時這一列隱藏（只設
  visibility，方便繼續量），改成在檢視切換下方、靠右顯示直排按鈕：全景、檢視（彈出
  時段／俯瞰／名牌）、連線、暫停。這組按鈕直接沿用手機版的 `.ci-tools`；搜尋和清單
  留在右側的索引面板。視窗縮放、字型載入完成、切換分頁時都會重新判斷。實測 1536 寬
  維持一列，1100 和 1024 寬改成直排。
- **開場取景依舞台寬度調整**（參考站也是這樣）：舞台寬約 1150px 以上時，鏡頭距離是
  「框住全部」的 0.7 倍，群島幾乎塞滿畫面，外圍小島、港口、XPages 會超出邊緣；
  600px 以下（含手機）維持框住整個湖；兩者之間平滑過渡（`HOME_ZOOM`、`ZOOM_FROM`、
  `ZOOM_TO`）。縮放上限仍以框住全部為準，拉遠就看得到全部。
  - **2026-10-30 改掉**：使用者回報開場看不到 XPages 島和 Java 執行環境島，要拖曳
    才找得到。現在開場和「全景」改用 `scene.js` 的 `fitHome()`：把湖裡每座島（類別
    群島加兩座外海島，每塊地磚取前後左右四個端點）投影到螢幕，反覆調整鏡頭目標和
    距離，讓它們剛好塞進「沒被介面蓋住的區域」。要扣掉的介面由 `chrome()` 的矩形
    算出：上方是品牌卡、工具列和分頁；下方是圖例；右側高的直排按鈕列（手機）會
    把右緣往內推，所以外海島不會被蓋住。舞台外的索引面板不算。用投影框比外接圓緊，
    所以群島不會縮太小。港口和外圍小島照舊可以超出邊緣。`HOME_ZOOM`、`ZOOM_FROM`、
    `ZOOM_TO` 已移除。
    實測 1280、1440、1920 寬的桌機和 375 寬的手機，開場都看得到兩座外海島，按
    「全景」回到的畫面跟開場一樣。
  - **2026-10-30 視角實驗**：使用者覺得 #29 的開場偏小。條件是兩座外海島仍要入鏡，
    而且先只調視角、不搬島。量法：把島中心一個小人（高約 0.32）投影到螢幕，量它
    幾 px 高。主要比較的視窗是 1920×873，跟使用者的截圖一樣；這時舞台是
    1580×798，扣掉了網站表頭和右側索引。

    | 方案 | Session 小人 | Document 小人 | 外海島小人 | 外海島入鏡 | 卡在 |
    |---|---|---|---|---|---|
    | #29：57°／0°／FOV 32，只框地磚 | 8.9 px | 9.7 | 12 | 兩座都在 | 高度 |
    | 68°／10°／FOV 24（第一輪試的） | 9.7 | 10.8 | 13–14 | 兩座都在 | 高度 |
    | **最佳角度：70°／3°／FOV 32**（PR #30） | **9.9** | **11.3** | 16–17 | 兩座都在，名牌完整 | 高度（地磚只占寬 77%、高 64%） |
    | 緊湊版＋最佳角度（分支 `claude/map-exp-compact`） | 10.8 | 12.2 | 17–18 | 兩座都在 | 高度 |
    | 最佳角度＋拿掉網站表頭 | 11.0 | 12.6 | 18–19 | 兩座都在 | 高度（寬 87%） |
    | 最佳角度＋拿掉表頭＋圖例不算 | 11.4 | 13.0 | 19–20 | 兩座都在 | 寬高接近 |
    | 最佳角度＋共用頂欄（分支 `claude/map-exp-fullbleed`） | 10.6 | 12.2 | 18–19 | 兩座都在 | 高度 |
    | 緊湊版＋拿掉表頭＋圖例不算 | 12.4 | 14.1 | 20–21 | 兩座都在 | 寬高接近 |
    | 緊湊版＋共用頂欄 | 11.5 | 13.2 | 18–20 | 兩座都在 | 高度 |
    | 參考站 puma.taipei/heart-island（舞台 1500×1000） | 約 25–30 | — | — | — | — |

    手機（375 寬）：#29 是 2.5 px，最佳角度是 2.9 px；兩座外海島都入鏡，也沒被按鈕列
    蓋住。手機是被寬度卡住。

    - **最佳角度**是使用者自己在線上版轉出來的構圖：鏡頭壓到控制器允許的最低
      （70°），稍微轉 3°，Java 執行環境落在左下前景，XPages 落在右下前景，主群島在
      中間偏上，OpenNTF 港口在最遠的左上。參數是用使用者描述的島嶼位置反推的
      （FOV 沿用線上的 32）。`fitHome()` 現在也把屋頂和地標頂端納入取景，所以
      Session 雙塔不會被切；在 70° 這麼斜的角度，迭代要加阻尼才不會發散。
    - **為什麼還是比參考站小**：參考站是 14 塊六角磚緊貼成一整塊；我們主群島有 25 塊
      磚、分成 17 座島，中間還有水道和橋，範圍大約 28×26，另外還有兩座外海島。以人
      跟磚的比例看，我們的小人其實比較大（約 9%，參考站約 3–4%），差別在要框進來的
      範圍。所以**不要用放大小人解決**。
    - 各項加總：視角約 +11%，緊湊約 +9%，拿掉表頭約 +11%，圖例不算約 +4%。全部
      疊起來約 +40%（8.9 → 12.4 px），離參考站大約還差一倍。
    - 共用外框 mockup 在 `claude/map-exp-fullbleed`：/map/ 用一條細頂欄取代網站表頭，
      三個檢視共用；檢視切換和語言切換固定在右邊，「← HCL Domino 日報」放在左邊
      當回首頁的連結。島嶼的品牌卡、關係圖和分類的標題列跟頂欄重複，所以都拿掉。
      目前只做了中文頁，等使用者決定要不要採用。

### 三個檢視共用的滿版頂欄（2026-10-30）

/map/ 不再顯示網站表頭（`BaseLayout` 新增 `siteHeader={false}`，只有這兩頁傳入）。
改由 `src/components/MapBar.astro` 的一條細頂欄，給三個檢視共用。

- **左邊**：「← HCL Domino 日報」回首頁，是一般連結，`aria-label` 寫「回到 HCL Domino 日報首頁」；
  接著是頁面的 h1「類別地圖」和 LotusScript · Java · SSJS 標記。
- **右邊**：分類／關係／島嶼切換，三個檢視都在同一個位置；語言切換（文／A）；
  ☰ 網站選單，用 `<details>` 做，裡面有首頁、所有文章、搜尋、類別地圖、關於，點旁邊或按 Esc 會關掉。
- 目前的檢視會記在網址 `?view=dir|graph` 上（島嶼是預設，不加參數），所以重新整理不會跑掉；
  語言切換的連結也跟著帶上，切語言後還是同一個檢視。
- 跟頂欄重複的東西拿掉：島嶼的品牌卡、關係圖和分類的標題列。只有覆蓋率還沒到 100%
  時，品牌卡或標題列才會留著，用來顯示覆蓋率。
- 手機版只留「←」、標題、三個檢視圖示、語言切換和選單，高 46px。
- 開場取景沿用 `fitHome()`：品牌卡拿掉之後，上方只需要避開工具列；切換鈕已經移到
  舞台外面，所以不再擋到島嶼工具列，工具列在寬螢幕上也能維持一列。
  實測 1920×873 視窗（舞台 1580×823），Session 小人 10.6 px（#30 是 9.9 px）。

### 名牌靠近介面就淡出（2026-10-29，照參考站）

參考站的島名牌移到工具列、品牌卡附近時會淡出，不會鑽到按鈕底下。我們也照這樣做：
`ClassIslands.astro` 傳一個 `chrome()` 給場景，回傳畫面上蓋在場景上的介面元件的位置：
品牌卡、工具列（改直排時換成直排按鈕）、檢視彈出選單、圖例、手機底部面板、檢視切換。
`scene.js` 的 `placeLabels()` 每一格畫面都檢查：名牌碰到這些元件外擴 10px 的範圍，
就加上 `.tucked`（透明度 0、不能點，淡出），移開後再淡回來。淡出的名牌也不參與
「互相重疊就縮成編號」的判斷，所以不會讓其他名牌無故縮小。

### 涵蓋數徽章只在還有沒寫完的類別時顯示（2026-10-29）

97 個類別都寫完之後，「97 / 97 已涵蓋」永遠是滿格，沒有資訊量，所以使用者同意改成：
三個檢視的涵蓋數徽章（`.ci-stat`／`.cm-stat`／`.cd-stat`）和圖例的「尚未寫成文章／未涵蓋」，
都只在 `coveredCount < total` 時才渲染。之後重抓 `data/ls_classes.json`
（見 `data/README.md`），只要多出還沒寫的類別，這兩樣就會自動回來。

### 房子面向街道（2026-10-29）

使用者覺得房子全部朝同一個方向太死板，選了 A 方案：外圈房子的門朝向步道環（街道），
地磚中央那棟仍面向預設鏡頭（`world.js` 用 `yaw = atan2(ox, oz)`）。

- `house()` 新增 `yaw` 參數，所有零件以房子中心旋轉（`P()` 統一處理），屋頂、窗戶、
  旗子會整組跟著轉。
- 每棟房子的背面也補上窗戶，從背面看不會是一片白牆。
- 告示牌跟著房子一起轉，一樣站在門旁邊。
- 順手修正：灰屋頂（尚未寫成文章）的房子以前回傳數字，現在跟其他房子一樣回傳
  `{ top, depth }`。
- 代價：後排房子的門會背對預設鏡頭，要轉視角才看得到那面的告示牌，點擊不受影響。

### 房子高度＝關聯數（2026-10-29）

使用者想一眼看出類別之間的依賴程度：被很多類別連到的（例如 Session）應該是摩天樓。

- 樓層由類別的關聯數（進出都算，跟類別卡上的「N 個關聯」是同一個數字）決定：
  `floorsFor(deg) = max(1, round(deg ^ 0.62))`。對照：43 條（NotesSession）約 10 層，
  27 條（NotesDOMNode）8 層，24 條（NotesDatabase）7 層，12 條 5 層，3 條 2 層，0–1 條 1 層。
  分佈很不平均，大多數類別只有 1–4 條，用次方曲線是為了讓幾個樞紐突出，
  又不會把其他類別壓到都一樣高。
- 6 層以上視為塔樓：改成平頂，加一根天線，天線頂端晚上會亮。
- 主題的 `tall` / `wide` 不再改樓層數（避免高度失去意義），只調整房子的面寬和深度。
  key class 仍是金色屋頂加旗子。
- 關聯數由 `ClassIslands.astro` 從 `data.links` 算出，以 `deg` 放進每個節點。
  XPages／港口的建築沒有類別關聯，維持小房子。
- 圖例新增「樓越高＝關聯越多」（階梯圖示），說明文字也一起補上。
