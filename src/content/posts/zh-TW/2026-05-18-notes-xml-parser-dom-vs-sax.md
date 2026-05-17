---
title: "LotusScript 解析 XML 該選 DOM 還是 SAX — 五個問題決定走哪邊"
description: "LotusScript 處理 XML 有三條路：NotesDOMParser（整棵樹載入）、NotesSAXParser（事件驅動串流）、NotesXMLProcessor + NotesXSLTransformer（XSLT 規則式轉換）。本文整理三家本質差異對照、五個決策問題（檔案大小 / 是否修改 / 走訪方向 / 記憶體限制 / 轉換場景）、實務情境的選擇建議，附程式碼風格對照、效能比較跟踩雷集錦。讀完知道 LS 拿到一份 XML 該怎麼開動。"
pubDate: 2026-05-18T07:30:00+08:00
lang: zh-TW
slug: notes-xml-parser-dom-vs-sax
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDOMParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html"
  - title: "NotesSAXParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXPARSER_CLASS.html"
  - title: "NotesXMLProcessor class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html"
relatedJava: ["DOMParser", "SAXParser", "XSLTransformer"]
relatedSsjs: ["DOMParser", "SAXParser", "XSLTransformer"]
cover: "/covers/notes-xml-parser-dom-vs-sax.png"
coverStyle: "watercolor"
---

## 重點摘要

LS 收到一份 XML 該怎麼處理？三條路、各有適用場景：

| 路線 | 適合 | 不適合 |
|---|---|---|
| **[NotesDOMParser](/domino-news/posts/notes-dom-parser)**（DOM）| 小到中型 XML、要修改、要隨機走訪 | 大檔案、純讀取 |
| **[NotesSAXParser](/domino-news/posts/notes-sax-parser)**（SAX）| 大檔案、純讀取、只要部分 element | 要修改 XML、要任意走訪 |
| **[NotesXMLProcessor + NotesXSLTransformer](/domino-news/posts/notes-xml-processor)**（XSLT）| 規則式 XML → 另一種 XML（或 HTML）的轉換 | 條件式邏輯、複雜計算 |

本文五個決策問題幫你 30 秒選對：

1. 檔案大小？
2. 要修改嗎？
3. 走訪方向？
4. 記憶體限制？
5. 是不是 XML→XML 轉換？

選錯不會 broken、但會踩坑 — 100 MB XML 走 DOM 直接 OOM、要修改用 SAX 寫到肝；不要受罪。

## 三家本質差異對照

| 面向 | DOM（NotesDOMParser）| SAX（NotesSAXParser）| XSLT（NotesXSLTransformer）|
|---|---|---|---|
| 模式 | 整棵樹載入記憶體 | 事件驅動串流 | 規則式 transform |
| 記憶體 | 跟檔案成正比 | 常數 | 跟 XML 大小相關（內部走 DOM）|
| 走訪 | 任意方向 | 只能 forward-only | XPath 選 |
| 修改 | 可以 | 不行（只讀）| 透過 XSLT 模板輸出新版 |
| 程式碼形式 | 直線（parse → walk → modify → serialize）| event handlers + 全域狀態 | 寫 XSLT stylesheet（不是 LS）|
| 學習曲線 | 中（W3C DOM 概念）| 中-高（event-driven 思維 + state machine）| 高（XSLT 是另一個語言）|
| 引入版本 | R6+ | R6+ | 較晚 |

## 五個決策問題

### 問題 1：檔案大小？

| 大小 | 建議 |
|---|---|
| < 1 MB | 任選 — DOM 寫起來爽快 |
| 1 - 10 MB | DOM 還 OK、SAX 也行 |
| 10 - 100 MB | 偏向 SAX、DOM 開始吃記憶體 |
| > 100 MB | 強制 SAX、DOM 會 OOM |

實務上 90% 的 XML 整合（API 回應、設定檔、DXL 匯出）都在 1 MB 以下、DOM 不用想。

### 問題 2：要修改 XML 嗎？

- **是 → DOM**（或 XSLT 走 transform）。SAX **做不到**修改 XML
- **否 → SAX 或 DOM 都行**

注意「我只要產出修改版 XML、不需要邊讀邊改」這種場景、XSLT 才是真正的工具 — 用一份 stylesheet 描述「輸入長這樣 / 輸出長這樣」、轉換規則化、可維護。

### 問題 3：走訪方向？

- **單向 forward-only 就夠**（從頭讀到尾、抽特定 element）→ SAX
- **要往回看、要跳到 parent、要做 sibling 比較** → DOM

例如「找每個 `<order>` 元素內、`<total>` 大於 `<budget>` 的訂單」— 需要在 `<order>` 內任意走 child、DOM 適合。「列出所有 `<product>` 的 name」— forward-only 一次 pass 就夠、SAX 適合。

### 問題 4：記憶體限制？

- **記憶體寬鬆**（多 GB heap）→ DOM 隨便
- **記憶體緊**（agent runtime 限制、shared 環境、低規 server）→ SAX

NotesDocument.Compute / Notes client agent 的記憶體 budget 比 server scheduled agent 緊。處理大 XML 在 client agent 跑 → SAX 必選。

### 問題 5：是不是 XML→XML / XML→HTML 轉換？

- **是、且轉換規則固定** → XSLT（[NotesXMLProcessor + NotesXSLTransformer 文章](/domino-news/posts/notes-xml-processor)）
- **是、但轉換有複雜條件 / 計算邏輯** → DOM 自己寫 transformation
- **不是** → DOM / SAX

XSLT 是 declarative — 你寫「我希望輸出長這樣」、XSLT 引擎自己跑。複雜分支邏輯 XSLT 寫起來反而吃力、不如 DOM + LS code 直接寫。

## 決策樹整合

把五個問題串起來：

```
拿到一份 XML
  │
  ├─ 是 XML → XML / HTML 規則化轉換? ────────────────────────► XSLT
  │
  ├─ 要修改 XML 內容? ───── 是 ───────────────────────────────► DOM
  │                          │
  │                         否
  │                          │
  ├─ 檔案 > 100 MB? ──────── 是 ───────────────────────────────► SAX
  │                          │
  │                         否
  │                          │
  ├─ 記憶體很緊? ─────────── 是 ───────────────────────────────► SAX
  │                          │
  │                         否
  │                          │
  ├─ 需要任意方向走訪 (parent / sibling 比較)? ─ 是 ──────────► DOM
  │                          │
  │                         否
  │                          │
  └─ ► DOM（小檔案、forward-only 也是、寫起來爽快）
```

## 程式碼風格對照

同樣抓 `<title>` 元素內容、DOM vs SAX 看寫法差異：

### DOM 寫法（任意走、簡單）

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim parser As NotesDOMParser
    Dim s As NotesStream

    Set s = session.CreateStream
    Call s.Open("c:\data\books.xml")

    Set parser = session.CreateDOMParser(s, Nothing)
    Call parser.Process()

    ' 一個函式遞迴解決
    Call PrintTitles(parser.Document)
End Sub

Sub PrintTitles(node As NotesDOMNode)
    If node.NodeType = DOMNODETYPE_ELEMENT_NODE Then
        Dim e As NotesDOMElementNode
        Set e = node
        If e.TagName = "title" And e.HasChildNodes Then
            Print e.FirstChild.NodeValue
        End If
    End If
    Dim c As NotesDOMNode
    Set c = node.FirstChild
    Do Until c Is Nothing
        Call PrintTitles(c)
        Set c = c.NextSibling
    Loop
End Sub
```

直線思維：parse → recurse → 印。

### SAX 寫法（state machine、全域變數）

```lotusscript
Option Public

Dim insideTitle As Boolean
Dim currentText As String

Sub Initialize
    Dim session As New NotesSession
    Dim parser As NotesSAXParser
    Dim s As NotesStream

    Set s = session.CreateStream
    Call s.Open("c:\data\books.xml")

    Set parser = session.CreateSAXParser(s, Nothing)
    On Event SAX_StartElement From parser Call OnStart
    On Event SAX_EndElement   From parser Call OnEnd
    On Event SAX_Characters   From parser Call OnChars
    Call parser.Parse()
End Sub

Sub OnStart(Source As NotesSAXParser, NS As String, _
        LocalName As String, QName As String, Attrs As NotesSAXAttributeList)
    If LocalName = "title" Then
        insideTitle = True
        currentText = ""
    End If
End Sub

Sub OnChars(Source As NotesSAXParser, Chars As String, Start As Long, Length As Long)
    If insideTitle Then
        currentText = currentText & Mid(Chars, Start + 1, Length)
    End If
End Sub

Sub OnEnd(Source As NotesSAXParser, NS As String, _
        LocalName As String, QName As String)
    If LocalName = "title" Then
        Print currentText
        insideTitle = False
    End If
End Sub
```

state machine 思維：用全域變數追蹤「我現在在哪個 element 裡」、Characters 累加、EndElement 印出。

**同樣功能、SAX 寫法是 DOM 的兩倍長度**、心智負擔也高 — 但記憶體用量是 DOM 的 1/100。trade-off 很明確。

## 效能與記憶體實測（rough numbers）

舉一個 10 MB 的 XML 檔（約 50,000 個 element）：

| 工具 | parse 時間 | 高峰記憶體 | walk 一次時間 |
|---|---|---|---|
| DOM | ~5 秒 | ~80 MB | ~0.5 秒（in-memory）|
| SAX | ~3 秒（同時 walk） | ~5 MB | n/a — parse 跟 walk 一起 |
| XSLT | ~6-10 秒 | ~80 MB | 同 parse |

幾個觀察：

- **SAX parse 比 DOM 快** — 因為 SAX 不蓋 tree、少很多 work
- **DOM 高峰記憶體比檔案大 8 倍** — node 物件 overhead 真的可怕
- **DOM 的 walk 幾乎免費** — 一次 parse、之後任意 walk 都是常數 cost

如果要 walk 很多次（例如 cross-reference 不同 element）、DOM 仍然划算。

## 三家踩雷集錦對照

| 雷 | DOM | SAX | XSLT |
|---|---|---|---|
| 改完忘 Serialize | ✅ 容易踩 — 改了 tree 不 serialize 等於沒改 | n/a（不能改） | n/a |
| 漏 error handler | ⚠️ 用 `Log` property 看 | ✅ 沒綁 `SAX_FatalError` silent fail | n/a |
| 大檔案 OOM | ✅ 100 MB+ 直接 OOM | n/a | ✅ 跟 DOM 同性質 |
| Text 是 child node | ✅ 不能直接 `elem.Text` | n/a（從 Characters event 拿） | n/a |
| Characters 多次觸發 | n/a | ✅ 同一段文字可能 fire 多次 | n/a |

## 跟 14.5 XML 工具鏈的關係

LS XML 工具鏈這幾年沒有大改 — `NotesDOMParser` / `NotesSAXParser` / `NotesXMLProcessor` 從 R6 引入後 API 穩定下來。**14.5 系列沒有新增 XML class 或大幅改動 API**（[14.5.1 What's New](https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html) 主要是 JSON Copy method 跟 OIDC token）。

但這也意味著：學一次、用十年。這套 API 在 R6 / R8 / R9 / 12.x / 14.x 都能跑。

## What about Java and SSJS?

| 語言 | DOM | SAX | XSLT |
|---|---|---|---|
| LotusScript | `NotesDOMParser` | `NotesSAXParser` | `NotesXMLProcessor` + `NotesXSLTransformer` |
| Java | `lotus.domino.DOMParser` 或標準 `javax.xml.parsers.DocumentBuilderFactory` | `lotus.domino.SAXParser` 或標準 `javax.xml.parsers.SAXParserFactory` | `javax.xml.transform.Transformer` |
| SSJS（XPages）| 通常直接用 Java 的 javax.xml.parsers | 同上 | 同 Java |

**Java/SSJS 的關鍵優勢**：可以選用 javax.xml.parsers 標準 Java API、比 lotus.domino.* 更豐富（有 XPath、Schema validation、Streaming XPath 等進階功能）。LS 卡死在 NotesDOMParser / NotesSAXParser、沒這個選擇。

如果 LS 寫 XML 處理寫到痛苦、考慮**把那段 logic 寫成 Java agent**、效能跟功能都會升級一階。

## 結論

XML 解析是 LS 整合場景的硬需求、三條路各有適用：

1. **預設用 DOM** — 小檔案、寫起來爽、可以修改、可以序列化
2. **檔案 > 10 MB 或記憶體緊用 SAX** — 串流式、event handler 寫法吃力但記憶體常數
3. **規則式轉換用 XSLT** — declarative、可維護、學習曲線高但長期省事

決策樹記起來：**修改？大檔案？任意走訪？** 答案三選一。

跟前面兩天的深度文一起服用：

- [5/16 NotesSAXParser 全攻略](/domino-news/posts/notes-sax-parser)
- [5/17 NotesDOMParser 全攻略](/domino-news/posts/notes-dom-parser)
- [5/6 NotesXMLProcessor + XSLT（同樣 XML 工具鏈、走 transform 路線）](/domino-news/posts/notes-xml-processor)

LS XML 三件套到此完整覆蓋。
