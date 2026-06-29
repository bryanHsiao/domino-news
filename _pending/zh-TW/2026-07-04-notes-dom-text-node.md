---
title: "承載內容的 DOM 節點：LotusScript 的 TextNode、AttributeNode、Comment、CDATASection"
description: "當你開始巡覽解析後的 DOM，真正的資料住在內容節點裡 —— 文字、屬性、註解、CDATA。本文說明繼承關係（CharacterData 是 Text/Comment/CDATA 的基底；CDATA 衍生自 Text；AttributeNode 自成一格）、CharacterData 的編輯方法，以及最大的陷阱：LotusScript 繫結是透過 NodeValue 讀內容 —— 沒有 W3C 風格的 Data、Length、Name 或 Value 屬性。"
pubDate: 2026-07-04T07:30:00+08:00
lang: zh-TW
slug: notes-dom-text-node
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMCharacterDataNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMCHARACTERDATANODE_CLASS.html"
  - title: "NotesDOMTextNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMTEXTNODE_CLASS.html"
  - title: "NotesDOMAttributeNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMATTRIBUTENODE_CLASS.html"
relatedJava: []
relatedSsjs: []
---

[上一篇](/domino-news/zh-TW/posts/notes-dom-document-node)講了在解析後的 DOM 裡四處走動 —— document、元素、node list。但元素多半只是骨架；*資料*在葉子上：標籤裡的文字、屬性的值、一段註解、一塊 CDATA。這些是承載內容的節點，而它們的 LotusScript 繫結有一個大到足以讓你第一次嘗試就壞掉的意外。

如果你從 JavaScript 或 Java 過來，你會去找 `.data`、`.length`、`.name`、`.value` —— 它們一個都不存在。Domino 的 LotusScript DOM 是透過繼承來的 **`NodeValue`** 來讀字元內容、透過 **`AttributeName` / `AttributeValue`** 來讀屬性名稱與值。用 W3C 的名字，程式編不過。

---

## 重點摘要

- **用 `NodeValue` 讀 text/comment/CDATA 內容**（繼承自 `NotesDOMNode`）。這個繫結裡**沒有 `Data`、也沒有 `Length` 屬性**。
- **屬性的名稱與值是 `AttributeName`（唯讀）與 `AttributeValue`（可讀寫）** —— 不是 `Name`/`Value`。另有 `IsSpecified`（在來源裡有沒有被明確設值？）。
- 繼承：[`NotesDOMCharacterDataNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMCHARACTERDATANODE_CLASS.html) 是 **TextNode**、**CommentNode**、**CDATASectionNode** 的抽象基底；**CDATASection 衍生自 Text**；**AttributeNode** 直接掛在 `NotesDOMNode` 上，不在 CharacterData 底下。
- CharacterData 編輯方法：`SubstringData`、`AppendData`、`InsertData`、`DeleteData`、`ReplaceData`。
- [`NotesDOMTextNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMTEXTNODE_CLASS.html) 多了 `SplitText` ——「在指定 offset 把這個節點切成兩個節點，兩個都留在樹裡當 sibling」。CDATASection 繼承它；Comment 沒有。
- 全部 **Release 6 新增、不支援 COM**。

## 繼承關係，以及它為什麼重要

```
NotesDOMNode
├─ NotesDOMCharacterDataNode   (抽象 — 不直接建立)
│   ├─ NotesDOMTextNode
│   │   └─ NotesDOMCDATASectionNode
│   └─ NotesDOMCommentNode
└─ NotesDOMAttributeNode        (自成一格 — 不是 character data)
```

`NotesDOMCharacterDataNode` ——「代表一個 DOM 節點裡的字元資料」—— 是抽象的：「你不建立 NotesDOMCharacterDataNode 物件。而是用衍生節點類別來建立特定物件。」它的價值在於 Text、Comment、CDATASection 都從它繼承同一組五個編輯方法。那條兩層的鏈（CDATASection → Text → CharacterData）代表一個 CDATA 節點*也*有 `SplitText`，而 Comment 沒有。而 `NotesDOMAttributeNode` 刻意擺在旁邊 —— 屬性雖然像字元、卻不是 CharacterDataNode，所以它有自己的 `AttributeName` / `AttributeValue` 存取子，而非那組編輯方法。

## 讀內容 —— 透過 NodeValue

當你巡覽到一個 text、comment 或 CDATA 節點時，內容在 `NodeValue` 裡：

```lotusscript
Select Case node.NodeType
Case DOMNODETYPE_TEXT_NODE          ' 3
  Print "Text: [" & node.NodeValue & "]"
Case DOMNODETYPE_COMMENT_NODE       ' 8
  Print "Comment: " & node.NodeValue
Case DOMNODETYPE_CDATASECTION_NODE  ' 4
  Print "CDATA: " & node.NodeValue
End Select
```

官方 walk-tree 範例正是這樣讀的 —— 三種都用 `node.NodeValue`。沒有 `.Data`；去找它，是大家把 DOM 程式搬進 LotusScript 時撞到的第一名編譯錯誤。

## 屬性 —— AttributeName / AttributeValue

[屬性節點](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMATTRIBUTENODE_CLASS.html)來自元素的 `Attributes` map。用型別專屬的存取子讀它（繼承來的 `NodeName` / `NodeValue` 也行，官方範例就是用這個）：

```lotusscript
Dim attrs As NotesDOMNamedNodeMap
Set attrs = element.Attributes
Dim i As Integer
For i = 1 To attrs.NumberOfEntries
  Dim a As NotesDOMAttributeNode
  Set a = attrs.GetItem(i)
  Print a.AttributeName & " = " & a.AttributeValue
  If Not a.IsSpecified Then Print "  (預設值，不在來源裡)"
Next
```

`IsSpecified`「指出這個屬性在原始文件裡有沒有被明確賦值」—— 當 DTD 提供預設值、而你想知道哪些屬性是作者真的寫出來的時候很有用。注意**缺了什麼**：沒有 `Name`、沒有 `Value`、沒有 `Specified`、沒有 `OwnerElement`。這個繫結是 W3C DOM 的「改名子集」，不是它的鏡像。

## 編輯字元資料

那五個 `CharacterData` 方法讓你就地操作內容 —— 在重新序列化之前轉換一棵解析後的樹時很有用：

```lotusscript
' textNode 目前裝著 "Hello"
Call textNode.AppendData(" World")              ' -> "Hello World"
Call textNode.InsertData(5, ",")                ' -> "Hello, World"
Print textNode.SubstringData(0, 5)              ' -> "Hello"
Call textNode.DeleteData(5, 1)                  ' 移除逗號
Call textNode.ReplaceData(0, 5, "Howdy")        ' -> "Howdy World"

' 只有 Text 有：在 offset 5 切成兩個 sibling text 節點
Dim tail As NotesDOMTextNode
Set tail = textNode.SplitText(5)
```

`SplitText` 是 Text 獨有（並由 CDATASection 繼承）的方法 —— Comment 節點沒有它，因為把一段註解切成兩半在樹的語意上沒有意義。

這是 Domino DOM 節點類別三篇系列的第二篇 —— [第一篇](/domino-news/zh-TW/posts/notes-dom-document-node)講導覽，[第三篇](/domino-news/zh-TW/posts/notes-dom-xmldecl-node)講 DTD/宣告層與 SAX 錯誤處理。

## 同類別在其他語言

跟導覽類別一樣，沒有乾淨的 Domino-API 對應可指 —— Java 與 XPages 的 XML DOM 工作走的是標準 `org.w3c.dom` 介面（`Text`、`Attr`、`Comment`、`CDATASection`），不是 `lotus.domino` 類別。那些 W3C 介面值得認識，正因為它們就是這個 LotusScript 繫結*改名前*的名字：W3C 叫 `Node.getNodeValue()` / `CharacterData.getData()` / `Attr.getValue()` 的，在這裡收斂成 `NodeValue` 與 `AttributeValue`。所以 `relatedJava` 與 `relatedSsjs` 留空 —— 那些語言裡的對應物是平台 DOM，不是 Domino 物件。
