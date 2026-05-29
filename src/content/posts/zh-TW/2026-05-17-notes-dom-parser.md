---
title: "NotesDOMParser 全攻略 — XML 整棵樹載入記憶體、14 個 Node 類別、走訪／修改／序列化"
description: "NotesDOMParser 把 XML 整棵載入記憶體蓋成 DOM 樹、用 NotesDOMDocumentNode 當 root、配 14 個 Node 子類別代表不同 XML 元素（Element / Text / Attribute / Comment / CDATA 等）。可任意走訪、可修改、可 Serialize 回 XML。本文整理 DOM 樹結構概念、CreateDOMParser 初始化、14 個 Node class 關係表、NotesDOMNode 的 tree-walking API（FirstChild / NextSibling / NodeType）、完整 parse → walk → modify → serialize 範例、五個踩雷點，跟 Java/SSJS 對照。"
pubDate: 2026-05-17T07:30:00+08:00
lang: zh-TW
slug: notes-dom-parser
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDOMParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html"
  - title: "Examples: NotesDOMParser class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOMPARSER_CLASS_EX.html"
  - title: "NotesDOMNode class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODE_CLASS.html"
  - title: "NotesXMLProcessor class (base) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html"
relatedJava: ["DOMParser"]
relatedSsjs: ["DOMParser"]
cover: "/covers/notes-dom-parser.webp"
coverStyle: "art-deco"
---

## 重點摘要

[`NotesDOMParser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html) — HCL 官方原話「Processes input XML into a standard DOM (Document Object Model) tree structure」。把整份 XML 蓋成一棵 tree、用 14 個 Node 子類別代表不同的 XML 元件。

四個重點：

1. **整棵載入記憶體** — 跟 [SAX 那篇](/domino-news/posts/notes-sax-parser) 相反、適合**小到中型 XML + 需要任意走訪或修改**
2. **`Document` property 是 entry point** — 拿到 `NotesDOMDocumentNode` 當 tree root、用 `FirstChild` / `NextSibling` / `ParentNode` 走訪
3. **14 個 Node 子類別** — 全部繼承自 [`NotesDOMNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODE_CLASS.html)：Element / Text / Attribute / Comment / CDATA / ProcessingInstruction 等
4. **`Serialize` 把 tree 寫回 XML** — 改完 tree 後輸出回原檔 / output stream

跟 [NotesSAXParser 文](/domino-news/posts/notes-sax-parser) 對比：SAX 是 forward-only streaming、DOM 是 random-access tree。

## DOM 樹結構是什麼

把這個 XML：

```xml
<library>
    <book id="b1">
        <title>The Hobbit</title>
        <author>Tolkien</author>
    </book>
    <book id="b2">
        <title>Dune</title>
    </book>
</library>
```

蓋成 DOM tree 長這樣：

```
Document（root，NotesDOMDocumentNode）
└─ library（Element）
   ├─ book（Element，attribute id="b1"）
   │  ├─ title（Element）
   │  │  └─ "The Hobbit"（TextNode）
   │  └─ author（Element）
   │     └─ "Tolkien"（TextNode）
   └─ book（Element，attribute id="b2"）
      └─ title（Element）
         └─ "Dune"（TextNode）
```

每個元件（element、text、attribute、comment）都是一個 **Node 物件**、是 `NotesDOMNode` 的子類別。整棵樹載入記憶體後可以任意走、任意改、任意 serialize 回去。

## 從 NotesSession.CreateDOMParser 開始

[`NotesDOMParser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html) 透過 `session.CreateDOMParser` 建：

```lotusscript
Dim session As New NotesSession
Dim domParser As NotesDOMParser
Dim xml_in As NotesStream
Dim xml_out As NotesStream

Set xml_in = session.CreateStream
Call xml_in.Open("c:\data\library.xml")

Set xml_out = session.CreateStream
Call xml_out.Open("c:\data\library_modified.xml")
Call xml_out.Truncate

Set domParser = session.CreateDOMParser(xml_in, xml_out)
Call domParser.Process()   ' 開始 parse — 把整份載入記憶體蓋 tree
```

注意 `Process()` 是觸發 parsing 的 method（繼承自 [`NotesXMLProcessor`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html) 基底類別）。也有 `Parse()` 方法可用。

## NotesDOMParser 的 property 跟 method

| Property | 用途 |
|---|---|
| `Document` | Read-only。Parse 完拿到 root `NotesDOMDocumentNode` |
| `DoNamespaces` | Read-write。要不要做 namespace 驗證 |
| `ExpandEntityReferences` | Read-write。entity reference 要不要展開成文字 |
| `InputValidationOption` | Read-write。XML declaration 有 DTD 時要不要驗證 |
| `ExitOnFirstFatalError` | Read-write。遇到第一個 fatal error 是不是停下 |
| `Log` / `LogComment` | parsing 過程 warning / error / fatal 的 XML log |

| Method | 用途 |
|---|---|
| `Process()` | 觸發 parsing（繼承自 NotesXMLProcessor）|
| `Parse(input, output)` | 同上、可選擇 override input/output |
| `Serialize()` | 走整棵 tree、輸出 XML 到 output stream |
| `Output(text)` | 直接寫文字到 output |
| `SetInput(stream)` | Override 之前的 input |
| `SetOutput(stream)` | Override 之前的 output |

## 14 個 Node 類別關係表

依官方文件、DOM 樹由這 14 個 Node 類別組成（全部繼承自 `NotesDOMNode`）：

| Class | 代表 |
|---|---|
| `NotesDOMDocumentNode` | 「Represents the entire XML document. The root of the document tree」 |
| `NotesDOMElementNode` | 「Represents an element in an XML document」（`<tag>`）|
| `NotesDOMAttributeNode` | 「Represents an attribute in a NotesDOMElementNode object」 |
| `NotesDOMTextNode` | 「Represents the textual content of an element or attribute」 |
| `NotesDOMCommentNode` | 「Represents a comment in the XML」（`<!-- ... -->`）|
| `NotesDOMCDATASectionNode` | 「Represents a CDATA section in the XML data source」 |
| `NotesDOMProcessingInstructionNode` | 「Represents a processing instruction」（`<?target data?>`）|
| `NotesDOMCharacterDataNode` | 「Represents character data in a DOM node」 |
| `NotesDOMDocumentFragmentNode` | 「Represents a document fragment in the XML」 |
| `NotesDOMDocumentTypeNode` | 「The list of entities that are defined for the document」 |
| `NotesDOMEntityNode` | 「Represents an entity node in the XML」 |
| `NotesDOMEntityReferenceNode` | 「Represents an entity reference node in the XML」 |
| `NotesDOMNotationNode` | 「Represents a notation declared in the DTD」 |
| `NotesDOMXMLDeclNode` | 「The XML declaration which specifies the version of XML being used」 |

實務上 90% code 只動到前 5 個（Document / Element / Attribute / Text / Comment），其他 9 個是 DTD / CDATA / processing instruction 等比較少用的 XML 進階語法。

## NotesDOMNode 的 tree-walking API

所有 Node 共享的走訪 API（繼承自 [`NotesDOMNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODE_CLASS.html)）：

| Property | 用途 |
|---|---|
| `FirstChild` | 「The first child of this node」 |
| `LastChild` | 「The last child of this node」 |
| `NextSibling` | 「The node immediately following this node」 |
| `PreviousSibling` | 「The node immediately before this node」 |
| `ParentNode` | 「The parent of this node」 |
| `NodeType` | 「An integer indicating which type of node this is」 — 配 `DOMNODETYPE_*` 常數判斷 |
| `NodeName` | 「The name of this node, depending on its type」 |
| `NodeValue` | Read-write。「The value of this node, depending on its type」 |
| `Attributes` | 「A NotesDOMNamedNodeMap containing the attributes」 |
| `NumberOfChildNodes` | 「The number of child nodes this node has」 |
| `HasChildNodes` | 「Indicates whether this node has any children」 |
| `LocalName` / `NamespaceURI` / `Prefix` | namespace 處理用 |

| Method | 用途 |
|---|---|
| `AppendChild(newChild)` | 加新 child 到末尾 |
| `RemoveChild(child)` | 移除 child、回傳被移除的 |
| `ReplaceChild(newChild, oldChild)` | 換 child |
| `Clone()` | 「Returns a duplicate of this node」 |

`NodeType` 是判斷「這個 Node 是哪一種」的關鍵。常用常數：

| 常數 | 對應 Node 類別 |
|---|---|
| `DOMNODETYPE_ELEMENT_NODE` | NotesDOMElementNode |
| `DOMNODETYPE_TEXT_NODE` | NotesDOMTextNode |
| `DOMNODETYPE_ATTRIBUTE_NODE` | NotesDOMAttributeNode |
| `DOMNODETYPE_COMMENT_NODE` | NotesDOMCommentNode |
| `DOMNODETYPE_CDATA_SECTION_NODE` | NotesDOMCDATASectionNode |
| `DOMNODETYPE_DOCUMENT_NODE` | NotesDOMDocumentNode |
| `DOMNODETYPE_PROCESSING_INSTRUCTION_NODE` | NotesDOMProcessingInstructionNode |

## 完整範例 — parse → walk → modify → serialize

讀 `library.xml`、把每本書的 title 大寫、加新 attribute `modified="true"`、寫回新 XML 檔（[改編自 HCL 官方範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOMPARSER_CLASS_EX.html)）：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim domParser As NotesDOMParser
    Dim xml_in As NotesStream, xml_out As NotesStream

    Set xml_in = session.CreateStream
    If Not xml_in.Open("c:\data\library.xml") Then
        Print "Cannot open input" : Exit Sub
    End If

    Set xml_out = session.CreateStream
    Call xml_out.Open("c:\data\library_modified.xml")
    Call xml_out.Truncate

    Set domParser = session.CreateDOMParser(xml_in, xml_out)
    domParser.ExitOnFirstFatalError = True
    Call domParser.Process()

    ' 拿到 root
    Dim docNode As NotesDOMDocumentNode
    Set docNode = domParser.Document

    ' 走訪、改 title 大寫
    Call WalkAndModify(docNode)

    ' 序列化回 XML 檔
    Call domParser.Serialize()
    Call xml_out.Close()

    Print "Done — output at c:\data\library_modified.xml"
End Sub

Sub WalkAndModify(node As NotesDOMNode)
    If node Is Nothing Then Exit Sub

    ' Element 處理
    If node.NodeType = DOMNODETYPE_ELEMENT_NODE Then
        Dim elem As NotesDOMElementNode
        Set elem = node    ' downcast

        If elem.TagName = "title" Then
            ' 改 title 的 text 為大寫
            If elem.HasChildNodes Then
                Dim textNode As NotesDOMNode
                Set textNode = elem.FirstChild
                If textNode.NodeType = DOMNODETYPE_TEXT_NODE Then
                    textNode.NodeValue = UCase(textNode.NodeValue)
                End If
            End If
        ElseIf elem.TagName = "book" Then
            ' 加新 attribute
            Call elem.SetAttribute("modified", "true")
        End If
    End If

    ' 遞迴 children
    Dim child As NotesDOMNode
    Set child = node.FirstChild
    Do Until child Is Nothing
        Call WalkAndModify(child)
        Set child = child.NextSibling
    Loop
End Sub
```

幾個觀察：

- **`node.NodeType = DOMNODETYPE_ELEMENT_NODE`** 是判斷 Element 的標準寫法
- **`Set elem = node`** — `NotesDOMElementNode` 是 `NotesDOMNode` 的子類別、可以直接 assign（隱式 downcast）
- **`elem.SetAttribute("name", "value")`** — Element 才有的 method
- **`textNode.NodeValue`** — Text node 的內容用 NodeValue（不是 NodeName）

## 五個踩雷點

### 1. Text 是獨立 TextNode、不是 Element 的 property

直覺以為 `<title>Hobbit</title>` 的 element 上會有「text content」property — **錯**。XML 規範 text 是 element 的 **child node**，型別是 `NotesDOMTextNode`：

```lotusscript
' ❌ 錯
Print elem.Text     ' 沒有這個 property

' ✅ 對 — 取 child TextNode
Dim t As NotesDOMNode
Set t = elem.FirstChild
If t.NodeType = DOMNODETYPE_TEXT_NODE Then
    Print t.NodeValue
End If
```

如果 element 有空白 whitespace（縮排）、whitespace 也是 TextNode、`FirstChild` 拿到的可能是 whitespace 不是真實內容 — 要 skip whitespace nodes。

### 2. 走訪時跳過 whitespace TextNode

XML 格式化縮排會產生 whitespace text node。範例 walk 時可能拿到一堆「\n    」這種 node：

```lotusscript
Set child = elem.FirstChild
Do Until child Is Nothing
    If child.NodeType = DOMNODETYPE_TEXT_NODE And Trim(child.NodeValue) = "" Then
        ' skip whitespace
    Else
        ' 真實處理
    End If
    Set child = child.NextSibling
Loop
```

或者 parsing 前 `DoNamespaces = False` + 用 `IgnorableWhiteSpace` 設定 — 但最直接還是 walk 時自己 skip。

### 3. 沒有 `GetElementsByTagName` 等便利方法 — 要自己遞迴

跟瀏覽器端 JavaScript DOM 不同、LotusScript 的 NotesDOMNode **沒有 `GetElementsByTagName` / `GetElementById` 之類**便利方法。要找特定 element 一律自己**遞迴走訪**：

```lotusscript
Function FindByTagName(node As NotesDOMNode, tagName As String) As NotesDOMElementNode
    If node.NodeType = DOMNODETYPE_ELEMENT_NODE Then
        Dim e As NotesDOMElementNode
        Set e = node
        If e.TagName = tagName Then
            Set FindByTagName = e
            Exit Function
        End If
    End If
    Dim child As NotesDOMNode
    Set child = node.FirstChild
    Do Until child Is Nothing
        Dim found As NotesDOMElementNode
        Set found = FindByTagName(child, tagName)
        If Not found Is Nothing Then
            Set FindByTagName = found
            Exit Function
        End If
        Set child = child.NextSibling
    Loop
End Function
```

寫過幾次後通常會包成 utility script library。

### 4. 改完 tree 一定要 `Serialize()` — 不然改動不會寫進 output

`Serialize()` 才是把記憶體裡的 DOM tree 寫回 XML 輸出。漏寫 `Call domParser.Serialize()` 的話 — output 檔是空的 / 沒改的版本。**跟 NotesDocument 漏 `.Save` 同性質**的 silent bug。

### 5. 大檔案吃記憶體 — 數十 MB 以上要小心

DOM 整棵載入、檔案 1 MB → 記憶體實際佔用大約 5-20 MB（依結構而定）。**100 MB 的 XML 檔載 DOM 可能直接 OutOfMemory**。檔案大 + 不需要修改 → 用 SAX。

## NotesDOMNamedNodeMap + NotesDOMNodeList 兩個 helper 類別

走訪 attributes 或 NodeList 時會碰到這兩個 helper：

- **`NotesDOMNamedNodeMap`** — 「Used by methods of the NotesDOMNode class for returning the list of an element node's attributes」。`elem.Attributes` 回的就是這個。可以用名字 `GetNamedItem("id")` 取屬性、或用 index `Item(i)` 取
- **`NotesDOMNodeList`** — 「Used by methods of the NotesDOMNode class for returning the list of an element node's child elements」。`elem.ChildNodes` 回的就是這個（不過實務常直接用 `FirstChild` + `NextSibling`）

## What about Java and SSJS?

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesDOMParser` + 14 個 NotesDOM*Node 子類別 |
| Java | `lotus.domino.DOMParser` — 同 DOM model；Java 端也可以直接用 `javax.xml.parsers.DocumentBuilderFactory` 走標準 Java DOM、API 更完整（有 `getElementsByTagName` 等）|
| SSJS（XPages） | 通常直接用 Java 的 javax.xml.parsers + W3C DOM、比 lotus.domino.DOMParser 強大 |

LS 的 NotesDOMParser 設計上是「W3C DOM Level 2 的子集」、缺一些便利 method。Java/SSJS 端有得選的話建議用 javax.xml.parsers。

## 結論

DOM 是 LS 處理小到中型 + 需要修改 / 隨機走訪 XML 的標準工具。三個記得：

1. **Text 是獨立 TextNode** — 不是 element 的 property、要從 `FirstChild` 取
2. **沒有 `GetElementsByTagName`** — 自己遞迴
3. **改完 tree 一定 `Serialize()`** — 跟 NotesDocument 漏 `.Save` 同類

對比文 [DOM vs SAX 決策](/domino-news/posts/notes-xml-parser-dom-vs-sax) 整理「**何時 SAX、何時 DOM、何時 NotesXMLProcessor（XSLT）**」的決策樹 — 三條 XML 路線一次釐清。
