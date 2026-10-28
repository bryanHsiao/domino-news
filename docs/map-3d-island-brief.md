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
