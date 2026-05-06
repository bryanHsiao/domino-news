---
title: "OpenNTF LotusScript Class Map：97 個類別一張圖，資料開源可拿"
description: "OpenNTF 在 2026 年釋出了基於 HCL Domino 14.5.1 的 LotusScript Class Map — 97 個 class、1001 個 property、997 個 method、72 個 event 全部攤在一張可互動的視覺地圖上，點任一節點就跳到 HCL 官方文件。本文介紹這個工具的功能、開源授權、底層 JSON 資料怎麼取，以及對開發者選題、學習、API 探索的價值。"
pubDate: 2026-05-08T07:30:00+08:00
lang: zh-TW
slug: openntf-lotusscript-class-map
tags:
  - "Community"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "LotusScript Class Map (live demo) — OpenNTF"
    url: "https://openntf.org/ls/index.html"
  - title: "OpenNTF/ls-classmap — GitHub repo"
    url: "https://github.com/OpenNTF/ls-classmap"
  - title: "OpenNTF — open community for Notes/Domino"
    url: "https://openntf.org/"
cover: "/covers/openntf-lotusscript-class-map.png"
coverStyle: "paper-craft"
---

## 一張圖看完 LotusScript 全部 97 個 class

[OpenNTF](https://openntf.org/) 在 2026 年推出了 [LotusScript Class Map v0.9](https://openntf.org/ls/index.html) — 把 HCL Domino 14.5.1 全部 LotusScript class 用一張互動式視覺圖呈現。靈感是 1997 年 Lotus 出版的「Domino Objects for LotusScript/COM/OLE」海報，把一整面牆的紙本地圖搬到 web。

規格：

- **97 classes**（NotesSession / NotesDocument / NotesView / NotesRichTextItem / 全部都在）
- **1,001 properties**
- **997 methods**
- **72 events**

每個節點點下去會展開該 class 的全部 properties、methods、events，每個項目都有「跳到 HCL 官方文件」的連結。

## 為什麼這個工具值得用

**互動式 vs 靜態文件**：HCL 官方文件結構是 hierarchical 列表，要從 `NotesSession` 順著「session.GetDatabase → db.GetView → view.GetEntryByKey → entry.Document → doc.Items → item.IsReaders」這條鏈追下去，每換一頁要 reload。Class Map 把全部關係視覺化在同一個 canvas 上，hover 一個節點就高亮直接相關的鄰居 + 連線，**架構感**一秒就出來。

幾個關鍵互動：

- **Search** — 同時 filter 側邊欄列表 + 高亮地圖上 match 的節點
- **Filter by type** — 只看 UI classes、只看 Backend classes、只看有 events 的 classes
- **Hover 節點** — 直接相關的鄰居高亮，其餘變淡，看 connection 一目了然
- **Hover 連線** — 顯示「是哪個 method/property 創造了這個關係」（縮放 60% 以上才顯示）
- **拖曳排版** — 排好的位置自動存到 localStorage，下次打開保持你習慣的版面
- **Konami code 彩蛋**（↑↑↓↓←→←→BA）— 致敬 1997 年原版海報

## 規格底層：資料來源 + 授權

**資料來源**：HCL Domino Designer 14.5.1 官方文件（`https://help.hcl-software.com/dom_designer/14.5.1/`）— 這也是站台技術文章一直引用的同一份 reference。

**授權**：Apache License 2.0（程式碼）+ HCL 文件的 metadata（reference data）。整個 web app 是 client-side static — 沒 backend，所有資料都從一個 JSON 檔 fetch 出來。

**底層資料是現成的**：[ls-classmap repo](https://github.com/OpenNTF/ls-classmap) 的 `src/main/resources/WebContent/data/ls_classes.json`（1.6 MB），裡面就是全部 97 個 class 的結構化資料：

```json
{
  "nodes": [
    {
      "id": "NotesDocument",
      "name": "NotesDocument",
      "isUI": false,
      "description": "...",
      "docUrl": "https://help.hcl-software.com/.../H_NOTESDOCUMENT_CLASS.html",
      "props": [ ... ],
      "methods": [ ... ],
      "events": [ ... ]
    },
    ...
  ]
}
```

換句話說 — 你想用這份資料做別的工具，**直接 `curl` 那個檔案就有了**，不用爬 HCL 文件。Apache 2.0 允許你在自家專案內整合。

## 怎麼用

**線上版**：直接打開 `https://openntf.org/ls/index.html` — 推薦 Chrome / Firefox（Safari 因為 [WebKit bug #23113](https://bugs.webkit.org/show_bug.cgi?id=23113) 對 SVG 內 `foreignObject` 渲染有問題，所以不支援）。

**自架**：clone repo 後用任何 static server serve（不能直接 file:// 開，因為要 `fetch()` JSON）：

```bash
# Python 內建
cd src/main/resources/WebContent
python3 -m http.server 8080

# 或 Node
npx serve src/main/resources/WebContent
```

## 對誰最有用

幾個典型場景：

1. **新進 Domino 開發者**：以前要熟 LS 環境得讀完整本 Designer help。Class Map 提供一個「全景 → 細節」的入口，從架構看而不是一頁一頁讀。
2. **API 探索**：知道要做什麼但不知道用哪個 class — search 關鍵字（例如「mime」、「stream」、「query」），相關 classes 直接高亮在地圖上。
3. **學習路徑規劃**：filter「Backend」看到全部後端 class，按 connection 強度決定先學哪個（NotesSession 是 hub、最該先熟）。
4. **內容創作 / 教學選題**：（這就是我們站台的用法）把 JSON 拉下來對照「站上寫過哪些 class」，剩下哪些沒寫一目了然，不必每次選題都人腦回想。

## 順便 — 那份 JSON 可以做別的事

對 OpenNTF 那份 `ls_classes.json` 感興趣的人，可以做：

- 自家 codebase 的 LS 用法掃描（grep class name 對照 reference）
- IDE / 編輯器的 LS autocomplete 資料源
- 教材 / blog 的 class index（自動產 markdown 表）
- 測試 coverage 報告（哪些 class 有 unit test、哪些沒）

Apache 2.0 + 結構化 + 與官方 doc 對齊（每個 entry 都有 `docUrl`）— 這份資料的「reusability」比同類資源高。

## 結論

OpenNTF Class Map 的價值有兩層：**對使用者**是一個更快理解 LotusScript 全貌的視覺工具；**對開發者**是一份結構化、開源、跟官方 doc 對齊的 JSON 資料。第一層對日常工作友善，第二層讓社群可以拿這份資料做更多衍生工具。

對照原版 1997 年 Lotus 海報跟 2026 年的這個 web app — 同一個目標、隔了將近 30 年，但解決的問題沒變：**Notes/Domino 的 API 表面太大，一張全景圖比一千頁文件更能幫你下手**。
