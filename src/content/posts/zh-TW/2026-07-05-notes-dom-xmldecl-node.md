---
title: "LotusScript 裡的 XML 宣告、DTD 節點與 SAX 錯誤"
description: "Domino DOM 裡很少見的那一層 —— XML 宣告、DOCTYPE、processing instruction、notation、entity —— 加上 SAX 那一側的 NotesSAXException。本文說明每個節點實際給你什麼（多半：沒什麼）、你必須先設好才看得到宣告的 AddXMLDeclNode 旗標，以及為什麼 NotesSAXException 是解析出錯時唯一能拿到含行列號豐富錯誤資料的地方。"
pubDate: 2026-07-05T07:30:00+08:00
lang: zh-TW
slug: notes-dom-xmldecl-node
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMXMLDeclNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMXMLDECLNODE_CLASS.html"
  - title: "AddXMLDeclNode property (NotesDOMParser) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDXMLDECLNODE_PROPERTY_DOMPARSER.html"
  - title: "NotesSAXException class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXEXCEPTION_CLASS.html"
relatedJava: []
relatedSsjs: []
---

[導覽](/domino-news/zh-TW/posts/notes-dom-document-node)與[內容](/domino-news/zh-TW/posts/notes-dom-text-node)那兩篇講的是你每天都會用到的 DOM 節點。這一篇講你幾乎不會碰的那一層 —— XML 宣告、DOCTYPE、processing instruction、entity、notation —— 加上 SAX 那一側唯一真正有用的類別 `NotesSAXException`。老實說的主題是：在 Domino 的 LotusScript 繫結裡，這個 DTD/宣告層多半是*導覽*層、不是*資料*層。這裡好幾個類別除了基底節點成員之外什麼都不給你。

---

## 重點摘要

- **XML 宣告**（`<?xml version="1.0" encoding="UTF-8"?>`）只有在你解析*之前*設了 `domParser.AddXMLDeclNode = True` 才會出現在樹裡 —— 屆時它是 document node 的 `FirstChild`，一個帶 `Version` / `Encoding` / `Standalone` 的 `NotesDOMXMLDeclNode`。
- **Processing instruction**（`NotesDOMProcessingInstructionNode`）給你 `Target` 與 `Data`。**Notation**（`NotesDOMNotationNode`）給你 `PublicID` / `SystemID`。
- **DocumentType、Entity、EntityReference 節點在這個繫結裡不提供任何類別專屬屬性** —— 你能用 `NodeType` 偵測它們、能巡覽它們，但 LS API 不把它們的 DTD 內部（`Entities`、`Notations`、`Name`、`PublicID`…）攤出來。這相對於 W3C 介面是個實際的缺口。
- **`NotesSAXException`** 是 SAX 那一側的回報：「代表 SAX 解析期間發生的錯誤與警告資訊」，含 `Message`、`Row`、`Column`、`PublicID`、`SystemID`。你在 `SAX_Error` / `SAX_FatalError` / `SAX_Warning` 事件裡收到它。
- 全部 **Release 6 新增、不支援 COM**。

## 看見 XML 宣告

預設情況下 parser 會把 `<?xml … ?>` 宣告丟掉。要拿到一個 [`NotesDOMXMLDeclNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMXMLDECLNODE_CLASS.html)，在解析前把 parser 上的 [`AddXMLDeclNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDXMLDECLNODE_PROPERTY_DOMPARSER.html) 旗標打開 —— 文件說它會讓宣告的「version、encoding、standalone 屬性……被包進結果 DOM 樹裡的一個 NotesDOMXMLDeclNode 物件」，並以 document node 的 `FirstChild` 出現：

```lotusscript
Dim domParser As NotesDOMParser
Set domParser = session.CreateDOMParser(inStream, outStream)
domParser.AddXMLDeclNode = True       ' 必須在解析「之前」設
domParser.Process

Dim n As NotesDOMNode
Set n = domParser.Document.FirstChild
Do Until n.IsNull
  Select Case n.NodeType
  Case DOMNODETYPE_XMLDECL_NODE        ' 13
    Dim decl As NotesDOMXMLDeclNode
    Set decl = n
    Print "version=" & decl.Version & " encoding=" & decl.Encoding & _
          " standalone=" & decl.Standalone
  Case DOMNODETYPE_PROCESSINGINSTRUCTION_NODE  ' 7
    Dim pi As NotesDOMProcessingInstructionNode
    Set pi = n
    Print "PI target=" & pi.Target & " data=" & pi.Data
  End Select
  Set n = n.NextSibling
Loop
```

忘了 `AddXMLDeclNode = True` 是「我的 XMLDeclNode 怎麼都不在」的第一名原因 —— 否則那個節點根本不會被產生出來。

## 薄薄的那一層

其餘宣告層的類別刻意都很薄：

| 類別 | NodeType | 它實際給你什麼 |
|---|---|---|
| `NotesDOMProcessingInstructionNode` | 7 | `Target`、`Data` |
| `NotesDOMNotationNode` | 12 | `PublicID`、`SystemID` |
| `NotesDOMDocumentTypeNode` | 10 | **只有繼承來的節點成員** |
| `NotesDOMEntityNode` | 6 | **只有繼承來的節點成員** |
| `NotesDOMEntityReferenceNode` | 5 | **只有繼承來的節點成員** |

值得注意的缺口：`NotesDOMDocumentTypeNode` 的一句說明是「文件所定義的 entity 清單」，但 LotusScript 繫結在它身上**沒有**任何 `Entities`、`Notations`、`Name`、`PublicID`、`SystemID` 存取子 —— 不同於它名義上對應的 W3C `DocumentType` 介面。實務上你只在巡覽樹時*觀察到*這些節點；你能對它們的 `NodeType` 分支、讀 `NodeName`/`NodeValue`，但無法透過它們檢視 DTD。你會不會看到 entity-reference 節點（type 5），取決於 parser 的 `ExpandEntityReferences` 設定。

所以除非你在處理 processing instruction（`Target`/`Data`）或讀宣告（`Version`/`Encoding`），這一層是你在 `Select Case` 裡略過的東西，不是你拿來挖資料的對象。

## NotesSAXException —— 錯誤資料住的地方

SAX parser 是 DOM 的串流式替代方案，而它唯一值得深看的類別是那個例外。[`NotesSAXException`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXEXCEPTION_CLASS.html) ——「代表 SAX 解析期間發生的錯誤與警告資訊」—— 是你終於拿得到豐富診斷的地方：不只一句訊息，還有解析出錯的 `Row` 與 `Column`，加上 `PublicID` / `SystemID`。你不去建立它；是 SAX parser 把它交給你的事件處理器：

```lotusscript
Dim saxParser As NotesSAXParser   ' 模組層級，事件才綁得到

Sub RunSaxParse()
  Dim session As New NotesSession
  Dim inStream As NotesStream, outStream As NotesStream
  Set inStream = session.CreateStream  : Call inStream.Open("c:\xml\in.xml")
  Set outStream = session.CreateStream : Call outStream.Open("c:\xml\saxlog.txt")

  Set saxParser = session.CreateSAXParser(inStream, outStream)
  On Event SAX_Error      From saxParser Call SaxError
  On Event SAX_FatalError From saxParser Call SaxError
  On Event SAX_Warning    From saxParser Call SaxError
  Call saxParser.Process
End Sub

Sub SaxError(Source As NotesSAXParser, Exception As NotesSAXException)
  Call Source.Output("row " & Exception.Row & " col " & Exception.Column & _
                     ": " & Exception.Message & Chr(10))
End Sub
```

*（改寫自文件裡的 SAX 事件簽名 —— 官方範例把每個事件寫到一個輸出檔。）*

那組 `Row`/`Column` 正是你需要告訴使用者他們的 XML *哪裡*壞掉時、該用 SAX（或攔這個例外）的理由 —— DOM parser 的失敗在位置上精確度差很多。

這是 Domino DOM 節點類別三篇系列的第三篇，接在[導覽](/domino-news/zh-TW/posts/notes-dom-document-node)與[內容節點](/domino-news/zh-TW/posts/notes-dom-text-node)之後。

## 同類別在其他語言

跟 Domino DOM 家族其餘部分一樣，沒有 `lotus.domino` 對應物可映 —— Java 與 XPages 用的是標準 `org.w3c.dom` 介面（`ProcessingInstruction`、`DocumentType`、`Notation`、`Entity`）與 JAXP 的 SAX 類別（`org.xml.sax.SAXParseException`，它帶著跟 `NotesSAXException` 一樣的行列號資料）。所以 `relatedJava` 與 `relatedSsjs` 維持留空。真要說，這裡 W3C 的 `DocumentType` 介面*比* Domino 的豐富 —— 上面提到的缺口是 LotusScript 繫結特有的。
