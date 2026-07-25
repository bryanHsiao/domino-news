---
title: "NotesDOM 你略過的那些節點 —— 直到一次 round-trip 把註解吃掉"
description: "你用 NotesDOMParser 建好了處理 element 與 text 節點的流程。然後來了一份帶註解、CDATA 區塊、processing instruction 的 XML，你改一個值、序列化回去 —— 註解和 PI 不見了，CDATA 變成被跳脫的純文字。一篇 NotesDOM 節點家族長尾的實測報告：NodeList 那個 1-based 的 GetItem（不是 W3C 的 0-based item()）、用來批次插入的 DocumentFragment，以及你得自己建立、才留得住的 CDATA／註解／processing instruction 節點。"
pubDate: 2026-07-24T07:30:00+08:00
lang: zh-TW
slug: notes-dom-content-nodes
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMNodeList (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODELIST_CLASS.html"
  - title: "NotesDOMDocumentFragmentNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTFRAGMENTNODE_CLASS.html"
  - title: "NotesDOMProcessingInstructionNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPROCESSINGINSTRUCTIONNODE_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-dom-content-nodes.webp"
coverStyle: "oil-chiaroscuro"
---

你用過 [`NotesDOMParser`](/domino-news/zh-TW/posts/notes-dom-parser) —— 用 `GetFirstChild` / `GetNextSibling` 走一趟樹、讀 element 跟 text 節點，收工。然後桌上來了一份真實文件：一個開頭寫著 `<!-- generated, do not edit -->` 註解的 XML 設定檔、一個裝了一段 markup 的 `<![CDATA[ ... ]]>` 區塊、最上面還有一行 `<?xml-stylesheet ... ?>` processing instruction。你解析它、改一個屬性、序列化回去 —— 註解跟 PI 不見了，CDATA 變成被跳脫的文字。沒有任何錯誤。輸出就是靜靜地錯了。

原因是 element / text / attribute 以外的那些 DOM 節點型別。多數你這輩子不會親手 new 出來，但其中兩個（`NotesDOMNodeList`、`NotesDOMDocumentFragmentNode`）在日常程式裡站得住腳，另外三個（CDATA／註解／processing-instruction 節點）則是「忠實的 round-trip」跟「有損的 round-trip」之間的差別。這是那條長尾的實測報告，測於 LotusScript DOM parser。這幾個類別都是同一個年份的 —— Release 6 新增，而且都不支援 COM。

---

## 重點摘要

- `NotesDOMNodeList.GetItem(i)` 是 **1-based** —— 迴圈寫 `For i = 1 To list.NumberOfEntries`。那是 LotusScript 的慣例，跟 W3C DOM 的 0-based `item()` 剛好相反。把 JavaScript 的迴圈原封不動搬過來，就是一個等著發生的 off-by-one。
- `NotesDOMDocumentFragmentNode` 是一個暫存容器：把節點都掛上去、再插入「它」，然後「插進去的是 fragment 的子節點，不是 fragment 本身」。一次插入取代 N 次。
- 註解、CDATA 區塊、processing instruction 各自是獨立的節點型別。一趟只認 element 與 text 的解析走訪會跳過它們，一趟從不重建它們的序列化會把它們丟掉。要留住，就得明確處理這些節點型別。
- 那些要手動建的，都從 document 節點生：`CreateCommentNode`、`CreateCDATASectionNode`、`CreateProcessingInstructionNode(target, data)`。

## NodeList：那個 1-based 的 GetItem

`NotesDOMNodeList` 是樹查詢交回來給你的東西 —— 對 document 或 element 節點呼叫 `GetElementsByTagName` 會拿到一個，子節點集合的存取也是。它剛好只有一個屬性、一個方法：[`NumberOfEntries`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODELIST_CLASS.html)（唯讀）與 `GetItem`，後者回傳「list 中位置 `index&` 的節點，若非有效索引則回 null」。

陷阱在索引基準。這個 list 從 **1** 起算、不是 0：

```lotusscript
Dim nl As NotesDOMNodeList
Set nl = docNode.GetElementsByTagName("item")
Dim i As Long
For i = 1 To nl.NumberOfEntries
    Dim n As NotesDOMNode
    Set n = nl.GetItem(i)
    Print n.NodeName
Next
```

如果你在瀏覽器 DOM 裡待久了，手指會自動寫出 `for (i = 0; i < list.length; i++)`、翻成 `For i = 0 To nl.NumberOfEntries - 1`。那會默默跳過第一個節點、又讀過尾端一格（回 null，接著在下一次取屬性時炸掉）。LotusScript 的集合一律 1-based；`NotesDOMNodeList` 也不例外，即使它對應的是一個 0-based 的 W3C 介面。拿不準的時候，把迴圈錨在 `NumberOfEntries`、從 1 開始。

## DocumentFragment：一次呼叫插入 N 個節點

[`NotesDOMDocumentFragmentNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTFRAGMENTNODE_CLASS.html) 是一個永遠不會出現在完成後那棵樹裡的節點。你用 document 節點上的 `CreateDocumentFragmentNode` 做一個、把要的節點都掛上去、再把這個 fragment 掛到一個真正的父節點底下。文件寫的行為正是重點：「插進去的是 fragment 的子節點，不是 fragment 本身」。

```lotusscript
Dim frag As NotesDOMDocumentFragmentNode
Set frag = docNode.CreateDocumentFragmentNode()
Dim r As NotesDOMElementNode
Forall row In rows
    Set r = docNode.CreateElementNode("row")
    Call r.SetAttribute("id", row)
    Call frag.AppendChild(r)
End Forall
Call tableNode.AppendChild(frag)   ' 這些 row 落在 tableNode 底下，fragment 本身不會
```

沒有 fragment 的話，你會把每個 row 直接 `AppendChild` 到 `tableNode` 底下、每一列都動一次活的樹。fragment 讓你在旁邊組好、再用單一操作把整批接進活樹。幾個節點時這是可讀性的贏；在迴圈裡建幾百個時，這就是讓建構過程不會爬得半死的那個差別。

## 註解、CDATA、PI：你得主動選擇的 round-trip

這三種「內容」節點型別容易被忘記，因為一趟天真的走訪根本不會讓它們浮出來。如果你的走訪只在 element 跟 text 節點上分支，那麼一個註解節點、一個 CDATA 節點、一個 processing-instruction 節點都會漏掉 —— 而如果你的序列化只重新輸出 element 跟 text，它們就再也回不來。要留住，就是進來時認出這些節點型別、出去時重建它們。

建立它們的方式是一致的 —— 每一種都在 document 節點上有個工廠方法：

```lotusscript
Dim c As NotesDOMCommentNode
Set c = docNode.CreateCommentNode(" generated, do not edit ")

Dim cd As NotesDOMCDATASectionNode
Set cd = docNode.CreateCDATASectionNode("<b>literal markup</b>")

Dim pi As NotesDOMProcessingInstructionNode
Set pi = docNode.CreateProcessingInstructionNode("xml-stylesheet", "type=""text/xsl"" href=""view.xsl""")
```

兩個細節要分清楚。第一是繼承：CDATA 節點**是一種** text 節點 —— `NotesDOMCDATASectionNode` 繼承 `NotesDOMTextNode`、後者繼承 `NotesDOMCharacterDataNode` —— 而註解節點直接繼承 `NotesDOMCharacterDataNode`。所以那些字元資料的編輯方法（`AppendData`、`InsertData`、`SubstringData`、`ReplaceData`、`DeleteData`）在這三種上都能用，方便，但也是個陷阱：CDATA 節點查起來像字元資料，代表一趟把「有字元資料」當成「是 text」的走訪會把它分類錯。要在節點型別上分支，不是在 `NodeValue` 有沒有值上分支。

第二，[processing-instruction 節點](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPROCESSINGINSTRUCTIONNODE_CLASS.html)把內容拆成兩個具名部分 —— `Target`（這道指令針對的應用程式，上面的 `xml-stylesheet`）與 `Data`（它後面的全部）。PI 是「一種把處理器專屬資訊留在文件文字裡的方式」，所以如果你在轉換一份接了 stylesheet 的 XML、又想讓那個連結活下來，你就從舊節點讀出 `Target` 與 `Data`、重建這一對，而不是想手工把 `<? ?>` 的文字兜回來。

## 同類別在其他語言

這裡沒有跨語言對照表可畫，而這正是有意思的地方。`NotesDOM*` 這組類別是 LotusScript DOM parser 自己的物件模型。在 Java 這邊你根本不會伸手拿 Domino 類別 —— 你用標準的 `org.w3c.dom` 介面（`NodeList`、`DocumentFragment`、`Comment`、`CDATASection`、`ProcessingInstruction`），透過一個 JAXP parser，而那裡的 `NodeList.item()` 是 **0-based**。在 SSJS／XPages 裡你通常在瀏覽器或伺服器端的 JavaScript DOM，一樣 0-based。節點的*概念*到哪都是同一套 W3C 模型；只有 LotusScript 這個面把 list 重新從 1 編號。跨 LotusScript 與另外兩者搬一個 DOM 迴圈時，這個重新編號就是唯一要記在腦子裡的東西。
