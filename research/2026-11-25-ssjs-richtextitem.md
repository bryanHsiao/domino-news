---
slug: ssjs-richtextitem
title: "XPages 塞 rich text:appendText 不會換段,還有存檔邊界那一刀"
lang: zh-TW · en
pubDate: 2026-11-25T07:30:00+08:00
tags: ["XPages", "SSJS"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — ssjs-richtextitem (2026-11-25)

**Topic**: SSJS `NotesRichTextItem`（XPages 後端）—— 組 body / 加附件。招牌坑:
appendText 不換段（要 addNewLine）、embedObject 的 class 參數是空字串、改了不
doc.save() 就沒了（在 XPages 跟資料源 save 打架）。插旗 `coversClass: RichTextItem`
＋ `apiLang: ssjs`。排程 #2（11/25）。

## 為什麼是這題

- map 缺口:RichTextItem 有 Java 文（java-richtextitem）缺 SSJS 旗。
- SSJS 側實用:XPages 即時組文件 body / mail、夾附件的日常需求。

## 研究來源

- **NotebookLM**：未用，走官方 SSJS reference。
- **WebFetch（web-fetch agent，8 頁全 200）**：
  - `r_domino_RichTextItem.html`（class）→「Represents an item of type rich text.」
    繼承 NotesItem;建立用 createRichTextItem、取既有用 getFirstItem;「the change
    is not written to disk until you call save for the parent NotesDocument object.」
  - `r_domino_RichTextItem_appendText.html` →「New lines (carriage returns) inserted
    in appended text do not cause new paragraphs. To create a new paragraph, use
    addNewLine.」;段落約 35K 自動切。
  - `r_domino_RichTextItem_addNewLine.html` → newparagraph 預設 true「forces the new
    line to be a paragraph separator」。
  - `r_domino_RichTextItem_embedObject.html` → `embedObject(type, class, source, name)`;
    type EMBED_ATTACHMENT=1454 / EMBED_OBJECT=1453(OLE/1);class「Specify an empty
    string ("")」;OLE 不支援 UNIX/Mac、檔案附件全平台支援。
  - `r_domino_RichTextItem_getFormattedText.html` /「strips out non-text data, such as
    bit maps and file attachments.」;`getUnformattedText.html`「Tabs and carriage
    returns are left intact.」
  - createRichTextItem 範例(verbatim)：createRichTextItem("Body")→appendText→
    addNewLine→embedObject(EMBED_ATTACHMENT,"",image,null)→doc.save()。
- **矛盾檢查**：無。方法名 camelCase、類別 NotesRichTextItem 皆確認。

## 獨立審查 (review)

本篇未跑獨立審查模型;以官方逐條查證 + 自我驗證清單為準。review 欄留空。

## 查證 checklist

- [x] map 缺口（RichTextItem 缺 SSJS 旗）、不與 java-richtextitem 重疊
- [x] 官方逐字（web-fetch agent 8 URL 全 200）
- [x] appendText 不換段 / addNewLine newparagraph 預設 / embedObject 空字串 class / 存檔邊界 查準
- [x] 矛盾檢查:無
- [ ] coversClass: RichTextItem + apiLang ssjs（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 3 URL 各 33%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`XPages 的 RichTextItem:組 rich text` — 目錄。
- [選定] 招牌坑＋存檔邊界：`XPages 塞 rich text:appendText 不會換段,還有存檔邊界那一刀`
  — 點出最常踩的 appendText 坑 + XPages 特有的 save 邊界，好搜、不過度承諾。
  en 鏡像：`Rich Text in XPages: appendText Won't Make Paragraphs — and the Save Boundary`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 研究官方 SSJS reference / 寫雙語草稿 / 進 _pending
