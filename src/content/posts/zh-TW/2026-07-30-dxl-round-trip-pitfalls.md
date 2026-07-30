---
title: "DXL round-trip 陷阱：為什麼匯出再匯入給你的是重複文件、不是同一批文件"
description: "你把文件匯出成 DXL、把 DXL 匯入另一個資料庫，結果拿到的是一批帶著全新 UNID 的副本、而不是同一批文件在原地更新 —— 因為匯入器預設是「建立」，只有在你明講時才按 UNID 比對。一篇 DXL round-trip 的實測報告：決定 create 還是 replace 的 DocumentImportOption、為什麼預設的 rich text 不是位元一致（以及何時該切到 RAW）、還有那個把整件事藏起來的 stale-handle 陷阱。"
pubDate: 2026-07-30T07:30:00+08:00
lang: zh-TW
slug: dxl-round-trip-pitfalls
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "DocumentImportOption (NotesDXLImporter, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTIMPORTOPTION_PROPERTY_IMPORTER.html"
  - title: "RichTextOption (NotesDXLExporter, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTOPTION_PROPERTY_EXPORTER.html"
  - title: "NotesDXLImporter (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
relatedJava: ["DxlExporter", "DxlImporter"]
relatedSsjs: ["DxlExporter", "DxlImporter"]
cover: "/covers/dxl-round-trip-pitfalls.webp"
coverStyle: "bw-grain"
---

計畫很簡單：把一組文件匯出成 DXL、搬走檔案、匯入第二個資料庫，然後兩個資料庫就一致了。你跑了，匯入成功、沒有錯誤 —— 而目標資料庫的文件數是你預期的*兩倍*，或者你本想原地更新的每一份都多了一份新副本。每一份匯入的文件都帶著全新的 UNID，跟它在來源端那個毫無關係。這趟 round-trip 沒有搬動文件；它把文件複製了。

那不是 bug，那是預設。這是一篇讓 DXL round-trip 做你本意的實測報告 —— 決定 create 還是 replace 的那一個匯入選項、多數 round-trip 擺錯位置的那個 rich-text 保真開關、以及那個「讓整件事看起來成功、其實沒有」的 stale-handle 陷阱。它接續 [`NotesDXLImporter`](/domino-news/zh-TW/posts/notes-dxl-importer) 那篇的走訪；這篇專講 round-trip。

---

## 重點摘要

- [匯入器](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html)**預設建立新文件**，即使 DXL 的 `<noteinfo>` 帶著原本的 UNID，也還是分配新的。在你明講之前，匯出再匯入是複製、不是更新。
- 把 `DocumentImportOption` 設成 `DXLIMPORTOPTION_REPLACE_ELSE_CREATE`（或 `UPDATE_ELSE_CREATE`），讓進來的文件**按 UNID** 對上現有的、並取代它們 —— 這個選項把複製變成真正的 round-trip。
- rich text 預設匯出成結構化的 `<richtext>`（`DXLRICHTEXTOPTION_DXL`），可讀、但不保證位元一致。當一份匯出的唯一用途就是再匯入時，用 `DXLRICHTEXTOPTION_RAW` —— `<rawitemdata>`、Base64、位元精確。
- 匯入之後，**重新抓文件**。你匯入前握著的那個文件 handle 不會反映匯入器寫了什麼。

## 重複 UNID 的陷阱

一份文件的 DXL 把它的身分帶在一個 `<noteinfo>` 元素裡 —— UNID、序號、日期。它就在檔案裡，所以你很自然會以為匯入器會用它。它不會，預設不會。文件說得明白，匯入器「即使存在相符的 UNID，也建立新文件，除非 `DocumentImportOption` 被適當設定」。預設是建立，而建立永遠鑄一個新 UNID。

所以解法是挑一個符合你本意的 [`DocumentImportOption`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENTIMPORTOPTION_PROPERTY_IMPORTER.html)。這個屬性「指出進來的文件如何處理：create、ignore、replace、或 update」，而 round-trip 住在那些複合常數裡：

- `DXLIMPORTOPTION_REPLACE_ELSE_CREATE` ——「用進來 DXL 裡相符（按 UNID）的文件取代輸出資料庫裡的文件，並加入任何新文件」。這就是真正的 round-trip：現有文件原地更新、真正新的則被建立。
- `DXLIMPORTOPTION_REPLACE_ELSE_IGNORE` —— 取代相符的、靜靜丟掉任何對不上的。用在「這份 DXL 只該更新、絕不引入新的」時。
- `DXLIMPORTOPTION_UPDATE_ELSE_CREATE` / `_UPDATE_ELSE_IGNORE` —— update 變體，用來合併欄位、而不是整份取代。
- `DXLIMPORTOPTION_CREATE` —— 預設；每一份進來的文件都是新的。對「種一個全新資料庫」是對的，對「同步兩個」是錯的。

```lotusscript
Dim importer As NotesDXLImporter
Set importer = session.CreateDXLImporter()
importer.DocumentImportOption = DXLIMPORTOPTION_REPLACE_ELSE_CREATE
Call importer.Import(dxlText, targetDb)   ' 按 UNID 比對、原地更新
```

一行，複製就變成 round-trip。漏掉它，你拿到的是副本 —— 那是最常見的 DXL 意外。

## rich text：可讀還是一致，二選一

另一個保真開關在匯出端。匯出器預設把 rich text 寫成一個結構化的 `<richtext>` 元素（`DXLRICHTEXTOPTION_DXL`）—— 人類可讀的形式，段落與 run 用 XML 拼寫出來。當一個人或另一個工具需要讀或轉換內容時，那是對的選擇。它*不*保證回去時位元一致。

當 DXL 的唯一去處是另一個 Domino 資料庫時，把 [`RichTextOption`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RICHTEXTOPTION_PROPERTY_EXPORTER.html) 切到 `DXLRICHTEXTOPTION_RAW`。文件對這個取捨講得很直白：RAW 寫出一個 `<rawitemdata>` 元素 —— rich-text 的原始 CD 記錄、Base64 編碼 ——「確保匯入的資料跟原本的精確相同」。位元精確、而且完全不透明；你讀不了也編不了，只能 round-trip 它。判準是：要轉換或檢視內容 → DXL；要忠實地在資料庫之間搬 → RAW。文件點出的一個但書：對*設計*note，RAW 讓你拿到位元一致，但「除非你同時用 note format（`ForceNoteFormat` 屬性），否則可能功能上不完全一致」。

## stale-handle 陷阱

那個把另外兩個藏起來的陷阱：匯入之後，你匯入前握著的記憶體物件不會反映改了什麼。如果你匯出一份文件、把一份編輯過的 DXL 匯回蓋掉它、然後從*原本*那個 `NotesDocument` handle 讀欄位，你會看到舊值、下結論說匯入沒生效 —— 但它生效了，進了資料庫，只是沒進你那個過期的 handle。丟掉匯入前的 handle、重新抓文件（按 UNID，既然你現在保留了它）再相信你讀到的。這就是那個「讓一個設定正確的 round-trip *看起來*壞掉」的陷阱，每次都要你賠一個下午。

## 關於 DOCTYPE 的一點

一個較小、但值得知道的匯出旋鈕，因為它接到[別處](/domino-news/zh-TW/posts/notes-dom-dtd-nodes)寫過的一個角落：`OutputDOCTYPE` 控制匯出的 DXL 帶不帶一行 `<!DOCTYPE>`，而 `DoctypeSYSTEM` 設它的 system 識別碼。對 Domino 資料庫之間的 round-trip 它很少有影響 —— 匯入器不需要 DTD 就能讀 DXL。它有影響的時候是：DXL 被一個外部 XML 工具消費、而那工具要對 Domino DTD 做驗證。如果那不是你的情況，把 DOCTYPE 留在外面能讓檔案更小更簡單；它不是一個 Domino 對 Domino 的 round-trip 會依賴的東西。

## 同類別在其他語言

這一個有直接對應，而且行為一模一樣。Java 的 `DxlExporter` / `DxlImporter` 與 SSJS 的 `DxlExporter` / `DxlImporter` 暴露同樣的 `DocumentImportOption` 與 `RichTextOption`、同樣的常數、同樣的預設 —— 所以重複 UNID 陷阱與 RAW-對-DXL 的選擇跟語言無關。這行為是 DXL 引擎的性質，不是 LotusScript 包裝的。如果你把一個遷移程序搬到 Java 或一個 XPages 工作，把那兩個設定原封不動帶過去；要避開的錯誤是以為換個語言就改了「預設建立」的行為。它沒有。
