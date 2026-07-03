---
title: "用 LotusScript 巡覽解析後的 XML DOM：DocumentNode、ElementNode、NodeList、NamedNodeMap"
description: "NotesDOMParser 把 XML 解析完之後，你用一組節點類別來導覽結果。本文說明怎麼從 domParser.Document 取得根、用 DocumentElement 抵達根元素、用 GetElementsByTagName 查詢（回傳 NotesDOMNodeList）、透過元素的 NamedNodeMap 讀屬性，以及 LotusScript 特有的眉角：GetItem 是 1-based、沒有 ChildNodes 屬性（用 FirstChild/NextSibling 走）、也沒有 GetItemByName。"
pubDate: 2026-07-03T07:30:00+08:00
lang: zh-TW
slug: notes-dom-document-node
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMDocumentNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTNODE_CLASS.html"
  - title: "NotesDOMElementNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMELEMENTNODE_CLASS.html"
  - title: "NotesDOMNamedNodeMap class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNAMEDNODEMAP_CLASS.html"
relatedJava: []
relatedSsjs: []
---

你把一份 XML 餵進 [`NotesDOMParser`](/domino-news/zh-TW/posts/notes-dom-parser) 並呼叫了 `Process`。現在記憶體裡有一棵樹，你得把值從裡面撈出來 —— 根元素、它底下每個 `<item>`、每個上面的 `id` 屬性。導覽介面是一小組節點類別，雖然它照著 W3C DOM 的形狀，但 LotusScript 的繫結有幾個鋒利的邊角，值得在寫迴圈之前先知道。

這是 Domino DOM 節點類別三篇系列的第一篇：這篇講導覽，[承載內容的節點類型](/domino-news/zh-TW/posts/notes-dom-text-node)是下一篇，[DTD/宣告層加上 SAX 錯誤處理](/domino-news/zh-TW/posts/notes-dom-xmldecl-node)是再下一篇。

---

## 重點摘要

- 在 `Set domParser = session.CreateDOMParser(inStream, outStream)` 與 `domParser.Process` 之後，根是 `domParser.Document` —— 一個 `NotesDOMDocumentNode`。「一棵 DOM 樹裡只有一個 document node。」
- 根*元素*是 `documentNode.DocumentElement`；document node 本身在它上面。
- `GetElementsByTagName(name)`（在 document 或任何元素上）回傳一個 `NotesDOMNodeList`，裝著符合的元素。
- **`GetItem` 是 1-based** —— 用 `For i = 1 To list.NumberOfEntries` 迭代。這是從 JavaScript/Java DOM 過來最大的陷阱。
- 元素的屬性來自它的 `Attributes` 屬性，型別是 `NotesDOMNamedNodeMap` —— 一樣是 1-based `GetItem`。要依名稱取單一屬性，用元素的 `GetAttribute(name)` / `GetAttributeNode(name)` —— **沒有 `GetItemByName`**。
- **沒有 `ChildNodes` NodeList 屬性** —— 用 `FirstChild` + `NextSibling`（加 `NumberOfChildNodes`）走子節點。
- 這些類別都是 **Release 6 新增、不支援 COM**。

## 樹的形狀

每個節點 —— document、element、text、attribute —— 都衍生自 `NotesDOMNode`，由它承載導覽屬性：`NodeName`、`NodeType`、`NodeValue`、`ParentNode`、`FirstChild`、`LastChild`、`NextSibling`、`PreviousSibling`、`Attributes`、`NumberOfChildNodes`，以及至關重要的 `IsNull` 防呆。你用 `NodeType` 跟 `DOMNODETYPE_*` 常數比對來區分節點種類：

| 常數 | 值 |
|---|---|
| `DOMNODETYPE_ELEMENT_NODE` | 1 |
| `DOMNODETYPE_ATTRIBUTE_NODE` | 2 |
| `DOMNODETYPE_TEXT_NODE` | 3 |
| `DOMNODETYPE_COMMENT_NODE` | 8 |
| `DOMNODETYPE_DOCUMENT_NODE` | 9 |

（完整清單從 0 到 13；其餘的會在[後面幾篇](/domino-news/zh-TW/posts/notes-dom-text-node)出現。）

[`NotesDOMDocumentNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTNODE_CLASS.html) 坐在最上面 ——「文件樹的根」—— 它比基底節點多一個關鍵屬性：`DocumentElement`，讓你直接跳到根元素。[`NotesDOMElementNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMELEMENTNODE_CLASS.html) 則多了 `TagName` 以及屬性存取子 `GetAttribute` / `GetAttributeNode`。

## 查詢與讀屬性

`GetElementsByTagName`「回傳一個 NotesDOMNodeList，裝著所有具該標籤名稱的後代元素，順序為遇到它們的順序」。這個 list 提供 `NumberOfEntries` 與一個 **1-based** 的 `GetItem`：

```lotusscript
Dim session As New NotesSession
Dim inStream As NotesStream, outStream As NotesStream
Set inStream = session.CreateStream
Call inStream.WriteText(|<order id="A1"><line sku="X9">Widget</line><line sku="Z2">Gadget</line></order>|)
inStream.Position = 0
Set outStream = session.CreateStream

Dim domParser As NotesDOMParser
Set domParser = session.CreateDOMParser(inStream, outStream)
domParser.Process

Dim docNode As NotesDOMDocumentNode
Set docNode = domParser.Document

Dim root As NotesDOMElementNode
Set root = docNode.DocumentElement
Print "Root element: " & root.TagName & ", id=" & root.GetAttribute("id")

Dim lines As NotesDOMNodeList
Set lines = root.GetElementsByTagName("line")
Dim i As Integer
For i = 1 To lines.NumberOfEntries          ' 1-based！
  Dim el As NotesDOMElementNode
  Set el = lines.GetItem(i)
  Print "line sku=" & el.GetAttribute("sku")
Next
```

*（改寫 —— parser 需要一個 `NotesStream`，所以 XML 是寫進 stream 裡、而非當字串傳入。）*

要列舉一個元素的*所有*屬性、而不是依名稱取一個，走它的 `Attributes` 屬性 —— 一個 [`NotesDOMNamedNodeMap`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNAMEDNODEMAP_CLASS.html)，「供 NotesDOMNode 類別的方法用來回傳一個元素節點的屬性清單」。一樣是 1-based `GetItem`：

```lotusscript
Dim attrs As NotesDOMNamedNodeMap
Set attrs = root.Attributes
For i = 1 To attrs.NumberOfEntries
  Print attrs.GetItem(i).NodeName & " = " & attrs.GetItem(i).NodeValue
Next
```

map 上沒有 `GetItemByName` —— 當你知道屬性名稱時，元素的 `GetAttribute(name)` 是直達路線。

## 完整的遞迴巡覽

當你事先不知道結構時，用 `FirstChild` / `NextSibling` 遞迴、依 `NodeType` 分支。這是官方的寫法：

```lotusscript
Sub walkTree(node As NotesDOMNode)
  If node.IsNull Then Exit Sub
  Select Case node.NodeType
  Case DOMNODETYPE_DOCUMENT_NODE
    Dim child As NotesDOMNode
    Set child = node.FirstChild
    Dim n As Integer
    n = node.NumberOfChildNodes
    While n > 0
      Call walkTree(child)
      Set child = child.NextSibling
      n = n - 1
    Wend
  Case DOMNODETYPE_ELEMENT_NODE
    Print "Element: " & node.NodeName
    Dim kid As NotesDOMNode
    Set kid = node.FirstChild
    Dim m As Integer
    m = node.NumberOfChildNodes
    While m > 0
      Call walkTree(kid)
      Set kid = kid.NextSibling
      m = m - 1
    Wend
  Case DOMNODETYPE_TEXT_NODE
    Print "Text: " & node.NodeValue
  End Select
End Sub
```

這個形狀 —— `IsNull` 防呆、`Select Case node.NodeType`、用 `FirstChild`/`NextSibling` 依數量走子節點 —— 正是[官方 `NotesDOMParser` walk-tree 範例](/domino-news/zh-TW/posts/notes-dom-parser)用的。注意沒有 `node.ChildNodes` 可迭代；`NumberOfChildNodes` 加上一步步走 sibling，才是你遍歷的方式。

## 同類別在其他語言

這是少數**沒有乾淨 Domino-API 對應**的情況。`NotesDOM*` 節點家族是 Domino API 裡的 LotusScript（與 Java agent）設施；在 Java 與 XPages 裡做 XML DOM 的標準路線是平台自己的 `org.w3c.dom` / JAXP 那一套，不是 `lotus.domino` 類別。所以這裡的 `relatedJava` 與 `relatedSsjs` 刻意留空 —— 如果你在 Java 裡做，你會拿 `javax.xml.parsers.DocumentBuilder` 與 W3C 介面，而那些（不同於 Domino 繫結）是 0-based、用 `getData()` / `getChildNodes()` 這種正統 W3C 形狀。
