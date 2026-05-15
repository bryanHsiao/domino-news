---
title: "NotesSAXParser 全攻略 — LotusScript 串流式 XML 解析、12 個 SAX 事件、On Event 綁定模式"
description: "NotesSAXParser 用 SAX（Simple API for XML）事件驅動模式處理 XML — 不把整份檔案載入記憶體、而是邊讀邊觸發 SAX_StartElement / SAX_Characters / SAX_EndElement 等 12 個事件。大檔案 / 只讀特定 element / 記憶體吃緊場景的首選。本文整理 SAX vs DOM 的本質差異、CreateSAXParser 初始化、On Event 綁定機制、12 個事件的觸發時機、NotesSAXAttributeList 怎麼拿 attribute、完整 LotusScript 範例、五個踩雷點，跟 Java / SSJS 對照。"
pubDate: 2026-05-16T07:30:00+08:00
lang: zh-TW
slug: notes-sax-parser
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesSAXParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXPARSER_CLASS.html"
  - title: "NotesSAXParser.Parse method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARSE_METHOD_SAXPARSER.html"
  - title: "Examples: NotesSAXParser class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESSAXPARSER_CLASS_EX.html"
  - title: "NotesSAXAttributeList class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXATTRIBUTELIST_CLASS.html"
relatedJava: ["SAXParser"]
relatedSsjs: ["SAXParser"]
cover: "/covers/notes-sax-parser.png"
coverStyle: "risograph"
---

## 重點摘要

[`NotesSAXParser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXPARSER_CLASS.html) — HCL 官方原話「Processes input XML as a series of events using a SAX (Simple API for XML) parser」。Release 6 引入、COM 不支援。

四個必懂的點：

1. **SAX 是「事件驅動串流」**，DOM 是「整棵樹載入」— SAX 邊讀邊吐 event、**不把整份 XML 載入記憶體**，所以大檔案首選
2. **12 個 SAX_* 事件**：StartDocument / EndDocument / StartElement / EndElement / Characters / IgnorableWhiteSpace / ProcessingInstruction / Comment / Error / Warning / FatalError / NotationDecl 等
3. **用 LotusScript 的 `On Event` 語法綁** — 不是傳統 callback 註冊、是 LS 內建的 event-handler 機制
4. **`SAX_Characters` 事件對同一段文字可能觸發多次** — parser 內部 buffer 滿就 flush、要自己累加

如果只讀 XML 不修改、或檔案大到 DOM 載不進記憶體、SAX 是正解。

## SAX vs DOM 的本質差異

要先理解兩家為什麼存在：

| 面向 | SAX | DOM |
|---|---|---|
| 模式 | 事件驅動串流 | 整棵樹載入記憶體 |
| 記憶體 | 常數（不管檔案多大） | 跟檔案大小成正比 |
| 走訪方向 | 單向 forward-only | 任意方向 |
| 修改 XML | 做不到（只讀） | 可以 |
| 適合 | 大檔案 / 只讀 / 抽特定 element | 小檔案 / 雙向走訪 / 修改 |

DOM 把整份 XML 載入記憶體蓋出一棵 tree、你可以任意走、任意改、序列化回去。SAX 不蓋 tree、parser 邊讀檔邊**觸發事件**：

```
讀到 <book>     → 觸發 SAX_StartElement("book", attrs)
讀到 "harry"    → 觸發 SAX_Characters("harry")
讀到 </book>    → 觸發 SAX_EndElement("book")
```

你寫的 code 就是這些事件的 handler。處理完事件、那段內容就被 GC 掉。

## 從 NotesSession.CreateSAXParser 開始

```lotusscript
Dim session As New NotesSession
Dim saxParser As NotesSAXParser
Dim xml_in As NotesStream
Dim xml_out As NotesStream

Set xml_in = session.CreateStream
Call xml_in.Open("c:\data\input.xml")

Set xml_out = session.CreateStream
Call xml_out.Open("c:\data\output.txt")
Call xml_out.Truncate

Set saxParser = session.CreateSAXParser(xml_in, xml_out)
```

`CreateSAXParser(input, output)` 接兩個 stream — input 是要解析的 XML、output 是 SAX handler 寫 log / report 的目的地（也可以不用、handler 直接 `Print` 就好）。

## 12 個 SAX_* 事件

依官方 doc，NotesSAXParser 觸發這 12 個事件：

| 事件 | 何時觸發 |
|---|---|
| `SAX_StartDocument` | 開始解析 |
| `SAX_EndDocument` | 解析完成 |
| `SAX_StartElement` | 遇到 `<tag>` 開始標籤 |
| `SAX_EndElement` | 遇到 `</tag>` 結束標籤 |
| `SAX_Characters` | 遇到文字內容（**可能對同一段文字觸發多次**） |
| `SAX_IgnorableWhiteSpace` | DTD 標明可忽略的空白字元 |
| `SAX_ProcessingInstruction` | 遇到 `<?target data?>` processing instruction |
| `SAX_NotationDecl` | DTD 裡的 notation declaration |
| `SAX_UnparsedEntityDecl` | DTD 裡的 unparsed entity |
| `SAX_ResolveEntity` | 解析 external entity 時 |
| `SAX_Error` | 普通錯誤 |
| `SAX_Warning` | 警告（不致命） |
| `SAX_FatalError` | 致命錯誤、parser 會停 |

實務上 90% 場景只用前 5 個（Start/EndDocument、Start/EndElement、Characters）+ 3 個 error 處理。

## On Event 綁定模式

LotusScript 的 SAX handler 不是傳統 callback 註冊、而是用 LS 內建的 [`On Event` 語法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARSE_METHOD_SAXPARSER.html)：

```lotusscript
On Event SAX_StartElement From saxParser Call MyStartElementHandler
On Event SAX_EndElement   From saxParser Call MyEndElementHandler
On Event SAX_Characters   From saxParser Call MyCharactersHandler
On Event SAX_FatalError   From saxParser Call MyFatalErrorHandler
```

語法：`On Event 事件名 From 來源物件 Call 處理 Sub 名稱`。**處理 Sub 的名稱可以是任何合法 LS 名稱** — 不用叫 `SAX_StartElement` 之類。

handler Sub 的**參數簽名**要對應事件。例如 SAX_StartElement 的 handler：

```lotusscript
Sub MyStartElementHandler(Source As NotesSAXParser, Namespace As String, _
    LocalName As String, QName As String, Attributes As NotesSAXAttributeList)
    Print "Start: " & QName
    ' 用 Attributes 物件拿屬性
End Sub
```

SAX_Characters handler 簽名：

```lotusscript
Sub MyCharactersHandler(Source As NotesSAXParser, Chars As String, Start As Long, Length As Long)
    Print "Text chunk: " & Mid(Chars, Start + 1, Length)
End Sub
```

Source、Namespace、LocalName 等參數**順序跟型別必須正確** — 寫錯會在 runtime 噴 type mismatch。

## 完整範例

抓 `<book>` 元素的 title 跟 author，輸出成簡單報表（[改編自 HCL 官方範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESSAXPARSER_CLASS_EX.html)）：

```lotusscript
Option Public

Dim currentElement As String   ' 全域 — handler 之間共用狀態
Dim currentBook As String
Dim currentTitle As String

Sub Initialize
    Dim session As New NotesSession
    Dim saxParser As NotesSAXParser
    Dim xml_in As NotesStream

    Set xml_in = session.CreateStream
    If Not xml_in.Open("c:\data\books.xml") Then
        Print "Cannot open input"
        Exit Sub
    End If

    Set saxParser = session.CreateSAXParser(xml_in, Nothing)

    ' 綁四個 handler
    On Event SAX_StartElement From saxParser Call OnStartElement
    On Event SAX_EndElement   From saxParser Call OnEndElement
    On Event SAX_Characters   From saxParser Call OnCharacters
    On Event SAX_FatalError   From saxParser Call OnFatalError

    Call saxParser.Parse()

    Print "Done"
End Sub

Sub OnStartElement(Source As NotesSAXParser, Namespace As String, _
        LocalName As String, QName As String, Attributes As NotesSAXAttributeList)
    currentElement = LocalName
    currentTitle = ""             ' 進入新 element 清空 buffer

    If LocalName = "book" Then
        currentBook = ""
        ' 從 Attributes 拿 id 屬性
        Dim i As Integer
        For i = 0 To Attributes.Length - 1
            If Attributes.GetLocalName(i) = "id" Then
                Print "Book id = " & Attributes.GetValue(i)
            End If
        Next i
    End If
End Sub

Sub OnCharacters(Source As NotesSAXParser, Chars As String, _
        Start As Long, Length As Long)
    ' Characters 對同一段文字可能多次觸發 — 累加
    If currentElement = "title" Then
        currentTitle = currentTitle & Mid(Chars, Start + 1, Length)
    End If
End Sub

Sub OnEndElement(Source As NotesSAXParser, Namespace As String, _
        LocalName As String, QName As String)
    If LocalName = "title" Then
        Print "  Title: " & currentTitle
    End If
End Sub

Sub OnFatalError(Source As NotesSAXParser, Description As String, _
        SystemId As String, PublicId As String, LineNumber As Long, ColumnNumber As Long)
    Print "FATAL at line " & LineNumber & ": " & Description
End Sub
```

幾個觀察：

- **全域變數做狀態管理** — handler 之間不能傳值、得用 module-level Dim 共用
- **`currentElement` 追蹤現在在哪個 tag 裡** — SAX 沒有「目前位置」的概念、要自己記
- **`currentTitle` 累加** — Characters 可能對 `<title>Harry Potter</title>` 觸發成「Harry」「Pot」「ter」三段（看 parser buffer 大小）
- **`Attributes.GetLocalName(i)` / `Attributes.GetValue(i)`** — 從 [`NotesSAXAttributeList`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXATTRIBUTELIST_CLASS.html) 拿屬性

## 五個踩雷點

### 1. `SAX_Characters` 對一段文字可能觸發多次 — 永遠累加

```xml
<title>The Lord of the Rings</title>
```

直覺以為 Characters 會收到完整字串「The Lord of the Rings」一次 — **錯**。parser 內部 buffer 滿就 flush，可能變成：

- 第 1 次：「The Lord」
- 第 2 次：「 of the Ri」
- 第 3 次：「ngs」

正解：在 StartElement 清空 buffer、Characters 累加、EndElement 時才用：

```lotusscript
Sub OnStartElement(...)
    currentText = ""
End Sub

Sub OnCharacters(Source, Chars, Start, Length)
    currentText = currentText & Mid(Chars, Start + 1, Length)
End Sub

Sub OnEndElement(...)
    Print currentText  ' 完整字串
End Sub
```

新手最常犯這個。

### 2. 全域 / module-level 變數做狀態管理 — 不能傳

SAX handler 之間**沒辦法傳遞 local 變數**（每個 handler 是獨立 Sub）。狀態必須走 module-level（Option Public 宣告的全域）變數。

寫 SAX agent 的典型 pattern：開頭一堆 `Dim currentX As String` 全域、handler 之間透過這些變數溝通。

### 3. forgetting 綁 `SAX_FatalError` — 出錯時靜默失敗

如果 XML 不合法、SAX_FatalError 不綁的話、parser 會停但**你不知道**。永遠至少綁這三個 error handler：

```lotusscript
On Event SAX_Error      From saxParser Call OnError
On Event SAX_Warning    From saxParser Call OnWarning
On Event SAX_FatalError From saxParser Call OnFatalError
```

不綁的話 debug 是噩夢。

### 4. handler 參數順序 / 型別寫錯 — runtime 噴 type mismatch

LS 編譯期不會檢查 handler 簽名是否對得上事件、Runtime 才噴錯。標準簽名請對著官方文件貼 — 例如 SAX_StartElement 一定是 `(Source As NotesSAXParser, Namespace As String, LocalName As String, QName As String, Attributes As NotesSAXAttributeList)`。

### 5. SAX 只能讀、不能改 XML

SAX 的設計就是 forward-only streaming — **沒辦法修改 XML 內容**。要改 XML 用 DOM。要邊讀邊輸出修改後的版本就一邊用 SAX_StartElement / EndElement / Characters event 自己拼新的 XML 字串 — 但這已經不是 SAX 該做的事、用 DOM 比較乾淨。

## NotesSAXAttributeList — 怎麼拿 attribute

`SAX_StartElement` 拿到的 `Attributes` 是 [`NotesSAXAttributeList`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXATTRIBUTELIST_CLASS.html) 物件、有這些 API：

| API | 用途 |
|---|---|
| `Length` | 屬性總數 |
| `GetLocalName(i)` | 第 i 個屬性的 local name |
| `GetQName(i)` | 第 i 個屬性的 qualified name（含 prefix）|
| `GetURI(i)` | 第 i 個屬性的 namespace URI |
| `GetValue(i)` | 第 i 個屬性的值 |
| `GetType(i)` | 第 i 個屬性的型別（DTD 標的） |

實務 iterate：

```lotusscript
Dim i As Integer
For i = 0 To Attributes.Length - 1
    Print Attributes.GetLocalName(i) & " = " & Attributes.GetValue(i)
Next i
```

## What about Java and SSJS?

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesSAXParser` + 12 個 SAX_* event handler |
| Java | `lotus.domino.SAXParser` — 同樣的 SAX 模式、用 javadoc 的 setHandler 系列方法綁 handler；Java 端也可以直接用 `javax.xml.parsers.SAXParserFactory` 走標準 Java SAX |
| SSJS（XPages） | 透過 Java imports — 通常直接用 Java 的 javax.xml.parsers，比 lotus.domino.SAXParser 更彈性 |

**Java 端有兩條路選**：lotus.domino.SAXParser（跟 LS 同模式）或 javax.xml.parsers（標準 Java，更多 library 支援）。LS 沒這個彈性、只能用 NotesSAXParser。

## 結論

SAX 是 LS 處理大量 / 流式 XML 的正解 — 記憶體常數、適合**只讀**場景。三個記得：

1. **`SAX_Characters` 累加、不要單獨用** — 同一段文字多次觸發
2. **用 module-level 全域變數**保存 handler 間狀態 — 沒法傳 local
3. **永遠綁 `SAX_FatalError`** — silent failure 是 debug 噩夢

明天的續篇講 **NotesDOMParser** — 整棵樹載入、任意走訪、可修改、可序列化。再後天的對比文整理「**何時 SAX、何時 DOM**」的決策樹。
