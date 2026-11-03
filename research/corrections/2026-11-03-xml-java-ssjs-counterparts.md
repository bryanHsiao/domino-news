---
title: "更正：XML 系列文的 Java／SSJS 對應類別"
created: 2026-11-03
requester: 使用者（語言透鏡 PR #40 的資料核對時發現）
author_model: Claude Opus 5.5
status: shipped
---

# 更正：XML 系列文的 Java／SSJS 對應類別

放在 `research/corrections/` 而不是 `research/` 頂層：`/how-its-made` 會把頂層每個
`YYYY-MM-DD-*.md` 當成一篇文章的 sidecar 渲染，這份是跨多篇的更正紀錄，不是一篇新文章。

## 發現經過

地圖語言透鏡（PR #40）的 `scripts/lib/apiVersions.ts` 以 HCL 官方類別索引為準判斷「某類別有沒有
Java／SSJS 版本」，結果把 4 篇 XML 文 `relatedJava`／`relatedSsjs` 裡的 `DOMParser`／`SAXParser`／
`XSLTransformer`／`XMLProcessor` 列為 rejected（兩份索引都沒有）。回頭查文章，文末
「What about Java and SSJS?」正文也寫了不存在的 `lotus.domino.DOMParser` 等類別與
`session.createXSLTransformer`。

## 研究來源（WebFetch，皆 14.5.1、皆非 404）

- `H_10_NOTES_CLASSES_ATOZ_JAVA.html`（Java Classes A–Z）— 53 個類別，**沒有** DOMParser／SAXParser／
  XSLTransformer／XMLProcessor／XSLTResultTarget。
- `H_NOTESSESSION_CLASS_JAVA.html`（Session Java）— 36 個方法，有 `createDxlExporter`／`createDxlImporter`，
  **沒有** `createDOMParser`／`createSAXParser`／`createXSLTransformer`。
- `reference/r_domino.html`（SSJS Domino library）— 56 個類別，**沒有** NotesDOMParser／NotesSAXParser／
  NotesXSLTransformer／NotesXMLProcessor；**有** `NotesXSLTResultTarget`；另連到獨立的
  DOM（JavaScript）library。
- `reference/r_wpdr_dom6_r.html`（DOM JavaScript library）— 伺服器端 XML DOM：DOMDocument、DOMElement、DOMNode…
- `reference/r_domino_XSLTResultTarget.html` — 「Contains the result of a transformation by the XSL processor」，
  建構子可接 DOM node／`java.io.Writer`／`java.io.OutputStream`／檔名或 URL。
- `H_GENERATEXML_METHOD_DOCUMENT_JAVA.html` — `generateXML(Object style, XSLTResultTarget result)`。
- `H_NOTESITEM_CLASS_JAVA.html` — Methods 列出 `parseXML`、`transformXML`（無說明、無連結）。
  `H_PARSEXML_METHOD_ITEM_JAVA.html`／`H_TRANSFORMXML_METHOD_ITEM_JAVA.html` 兩個推測網址為 404，
  所以文章只寫「Item 有 parseXML 方法」，不寫回傳型別。

NotebookLM：這次未查（純更正、以官方索引為唯一依據；索引頁本身就是最權威的「有沒有這個類別」來源）。

矛盾檢查：三份官方頁（Java 索引、Session 方法、SSJS 索引）一致，與文章原文矛盾，以官方為準。

## 更正內容

| 文章 | 改了什麼 |
|---|---|
| 2026-05-16-notes-sax-parser（中英） | 文末表格與結語：Java／SSJS 沒有 Domino SAX 類別，走標準 `javax.xml.parsers.SAXParserFactory`；拿掉「Java 有兩條路」 |
| 2026-05-17-notes-dom-parser（中英） | Java 走 `DocumentBuilderFactory`（另提 `Item.parseXML`）；SSJS 指向 DOM（JavaScript）library |
| 2026-05-18-notes-xml-parser-dom-vs-sax（中英） | 比較表改為標準 JAXP／`Document.generateXML(…, XSLTResultTarget)`／DOM library；拿掉「Streaming XPath」 |
| 2026-07-19-notes-xsl-transformer（中英） | 拿掉 `lotus.domino.XSLTransformer`、`session.createXSLTransformer`；改為 `generateXML` + `XSLTResultTarget` 或 `javax.xml.transform`；SSJS 指向 `NotesXSLTResultTarget` |
| 2026-05-06-notes-xml-processor（en） | 只有 frontmatter：`relatedJava`／`relatedSsjs` 拿掉 `XMLProcessor`，保留 `DxlExporter` |

前四篇的 `relatedJava`／`relatedSsjs` 改為 `[]`（CLAUDE.md：無對應類別用空陣列）；九個檔都加 `updatedDate: 2026-11-03`。

## 查證 checklist

- [x] 三份官方索引／方法頁交叉核對，結論一致
- [x] 新增引用 URL 皆 WebFetch 非 404
- [x] 全站 grep 無殘留 `lotus.domino.DOMParser` 等寫法
- [x] `npm run build` 通過
- [x] `npm run coverage` 重跑
- [x] `npm run map-lang-report` 通過

## 異動日誌

- 2026-11-03 Claude Opus 5.5：PR #40 資料核對發現 rejected 名單 → 使用者要求查證 → WebFetch 官方索引確認錯誤
- 2026-11-03 Claude Opus 5.5：使用者要求修正 → 改 9 個檔、補本紀錄
- 2026-11-03 Domino News[5] session 獨立查證：結論一致（四個 parser 類別不存在、DXL 在 Java 存在）。它另主張「XSLTResultTarget 也不是 lotus.domino 的東西」，與官方 `H_GENERATEXML_METHOD_DOCUMENT_JAVA.html` 的簽名 `generateXML(Object style, XSLTResultTarget result)` 矛盾（頁面另註明與 EmbeddedObject／Item／MIMEEntity／RichTextItem 的 transformXML 同參數），不採用；但 Java 版 XSLTResultTarget 類別頁（`H_NOTESXSLTRESULTTARGET_CLASS_JAVA.html`）與 generateXML 範例頁皆 404，package 與建構子無 Java 端出處 → xsl-transformer 文改為明確標註「建構子依 SSJS 參考頁」
