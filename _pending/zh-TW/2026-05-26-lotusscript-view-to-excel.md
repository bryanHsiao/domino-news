---
title: "LotusScript 把 NotesView 匯出 Excel：四條路、CSV 預設、何時要升 POI"
description: "「把這個 view 匯出 Excel 給 user」是 Domino 圈最常被問的需求之一。四條路 — CSV via NotesStream（推薦預設）、HTML-as-xls（舊版格式技巧）、OLE Excel.Application（僅 client 端臨時用）、Apache POI via Java agent（正式環境級 .xlsx） — 各有適用場景。本文整理四條路的取捨表、CSV 完整實作（含 UTF-8 BOM、CSV escape、用 NotesViewNavigator 加速 5-10x）、HTML-as-xls / OLE / POI 的何時用何時不該用、Web download 模式、跟三個常見坑（BOM 漏寫、escape 不對、用 GetFirstDocument 而不是 ViewNavigator）。"
pubDate: 2026-05-26T07:30:00+08:00
lang: zh-TW
slug: lotusscript-view-to-excel
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesStream class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "NotesViewNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesView class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
  - title: "Apache POI — Java library for Office formats"
    url: "https://poi.apache.org/"
  - title: "RFC 4180 — Common Format for CSV Files"
    url: "https://datatracker.ietf.org/doc/html/rfc4180"
relatedJava: []
relatedSsjs: []
cover: "/covers/lotusscript-view-to-excel.png"
coverStyle: "bw-grain"
---

## 重點摘要

- 「NotesView → Excel」有 **四條路**：CSV / HTML-as-xls / OLE Excel / POI Java
- 9 成場景 **預設選 CSV via [NotesStream](/posts/notes-stream/)**：跨平台、不依賴 Excel 安裝、跑 server agent / Linux Domino 都行
- **必加 UTF-8 BOM**（`EF BB BF`）— Excel 沒 BOM 預設用系統 codepage、中文直接亂碼
- **大 view 用 [`NotesViewNavigator`](/posts/notes-view-navigator/) 比逐筆 `GetFirstDocument` 快 5-10 倍** — 前者讀 view index、後者 deserialize 整份 doc
- **CSV escape**：含 `,` / `"` / `\r\n` 的欄位要包雙引號、內部 `"` 變 `""`（[RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180)）
- 要 .xlsx 真檔 + 格式樣式 → Apache POI Java agent；僅 client 端臨時用 → OLE；要 cell 顏色但不想搞 POI → HTML-as-xls

---

## 四條路取捨

| 路 | 機制 | 跑在哪 | 適合 | 不適合 |
|---|---|---|---|---|
| **1. CSV（推薦預設）** | NotesStream 寫 .csv、Excel 直接開 | 任何地方（LS only）| 純資料 dump、排程報表、大量資料 | 要格式樣式 / 多 sheet / 公式 |
| **2. HTML-as-xls** | 寫 `<table>` HTML、副檔名取 `.xls` | 任何 LS | 要簡單 cell 顏色 / 框線、一次性報表 | Excel 開會跳「這不是 .xls」警告、Microsoft 已棄用 |
| **3. OLE Excel.Application** | `CreateObject("Excel.Application")` 操控 Excel | **僅 Windows + Excel 已裝** | 桌面臨時 script、要 pivot / 圖表 | server agent 不能用（Linux Domino、沒裝 Excel） |
| **4. Apache POI via Java agent** | Java agent 用 POI 寫 .xlsx、LS 用 LS2J 呼叫 | server 端、正式環境 | 真 .xlsx、格式樣式、大量資料、Linux Domino | 多一個相依套件、Java agent 學習曲線 |

實務上 9 成需求 CSV 就解了 — 只有「要格式樣式」/「要 .xlsx 真檔」才升 POI。

---

## 預設路徑 — CSV via NotesStream

完整可跑的 [NotesView](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) 匯出函式：

```lotusscript
Sub ExportViewToCSV(view As NotesView, outputPath As String)
    Dim session As New NotesSession
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Call stream.Open(outputPath, "UTF-8")
    Call stream.Truncate

    ' --- 1. UTF-8 BOM、不寫的話 Excel 中文會亂碼 ---
    Call stream.WriteByte(239)  ' EF
    Call stream.WriteByte(187)  ' BB
    Call stream.WriteByte(191)  ' BF

    ' --- 2. Header row（從 view column 自動取）---
    Dim cols As Variant
    cols = view.Columns
    Dim headerLine As String
    ForAll c In cols
        headerLine = headerLine & CsvEscape(c.Title) & ","
    End ForAll
    Call stream.WriteText(Left$(headerLine, Len(headerLine) - 1) & Chr(13) & Chr(10))

    ' --- 3. Data rows — 用 NotesViewNavigator 比 GetFirstDocument 快 5-10x ---
    Dim nav As NotesViewNavigator
    Set nav = view.CreateViewNav()
    Dim entry As NotesViewEntry
    Set entry = nav.GetFirst()
    Do Until entry Is Nothing
        Dim line As String
        line = ""
        ForAll v In entry.ColumnValues
            line = line & CsvEscape(CStr(v)) & ","
        End ForAll
        Call stream.WriteText(Left$(line, Len(line) - 1) & Chr(13) & Chr(10))
        Set entry = nav.GetNext(entry)
    Loop

    Call stream.Close
End Sub

Function CsvEscape(s As String) As String
    ' RFC 4180：含 , " \r \n 就要包雙引號、內部 " 變 ""
    If InStr(s, ",") > 0 Or InStr(s, """") > 0 _
       Or InStr(s, Chr(13)) > 0 Or InStr(s, Chr(10)) > 0 Then
        CsvEscape = """" & Replace(s, """", """""") & """"
    Else
        CsvEscape = s
    End If
End Function
```

呼叫：

```lotusscript
Dim view As NotesView
Set view = db.GetView("ByDate")
Call ExportViewToCSV(view, "C:\temp\report.csv")
```

跑 50K rows 級的 view 在中等規格 server 上約 5-15 秒。

---

## 三個多數人會忘的關鍵點

### 1. UTF-8 BOM 是強制的

不寫 BOM、Excel 預設用系統 codepage 讀檔（Windows 中文版常是 Big5）、UTF-8 的中文被當 Big5 解就是亂碼。**寫 3 個 byte (`EF BB BF`) 就解決**。

不要走 `stream.WriteText("﻿")` — 那會被 NotesStream 編碼成 UTF-8 三 byte 沒錯、但同時可能被當文字內容、不一定當 BOM 處理。直接 WriteByte 最穩。

### 2. CSV escape 規則 — RFC 4180

含**逗號 / 雙引號 / 換行字元**的欄位要包雙引號、內部雙引號 escape 成 `""`：

```
Hello, World      → "Hello, World"
She said "hi"     → "She said ""hi"""
Line1\nLine2      → "Line1\nLine2"
Plain text        → Plain text（不用包）
```

忘了 escape 包雙引號、Excel 開出來欄位會錯位。

### 3. 大 view 必用 NotesViewNavigator

兩種走法效能差距很大：

```lotusscript
' ❌ 慢 — 每筆 deserialize 整份 doc（含所有 item）
Dim doc As NotesDocument
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    Print doc.GetItemValue("FieldA")(0)  ' 對每筆只讀 1 個欄位、但 LS 把整份 doc 都 load 了
    Set doc = view.GetNextDocument(doc)
Loop

' ✅ 快 — 只讀 view index 裡的 ColumnValues（已存在 view 裡）
Dim nav As NotesViewNavigator
Set nav = view.CreateViewNav()
Dim entry As NotesViewEntry
Set entry = nav.GetFirst()
Do Until entry Is Nothing
    Print entry.ColumnValues(0)  ' 直接讀 view 索引、不 load doc
    Set entry = nav.GetNext(entry)
Loop
```

差距：[`NotesViewNavigator` 那篇](/posts/notes-view-navigator/) 實測 50K rows 差 **5-10 倍**。

唯一例外：如果你要的欄位**不在 view column 裡**、那要 entry 拿 `doc = entry.Document` 退回 doc-level、那就跟 GetFirstDocument 差不多。所以 view 設計時把要匯出的欄位全部當 column 列上去最有效率。

---

## 路 2：HTML-as-xls — 要 cell 顏色但不想搞 POI

寫 HTML `<table>`、副檔名取 `.xls`、Excel 會用 HTML viewer 開：

```lotusscript
Sub ExportViewAsHtmlXls(view As NotesView, outputPath As String)
    Dim session As New NotesSession
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Call stream.Open(outputPath, "UTF-8")
    Call stream.Truncate

    ' UTF-8 BOM
    Call stream.WriteByte(239)
    Call stream.WriteByte(187)
    Call stream.WriteByte(191)

    Call stream.WriteText("<html><head><meta charset='UTF-8'></head><body><table border='1'>")

    ' Header（背景色）
    Call stream.WriteText("<tr style='background:#cce5ff;font-weight:bold'>")
    ForAll c In view.Columns
        Call stream.WriteText("<th>" & c.Title & "</th>")
    End ForAll
    Call stream.WriteText("</tr>")

    ' Data
    Dim nav As NotesViewNavigator
    Set nav = view.CreateViewNav()
    Dim entry As NotesViewEntry
    Set entry = nav.GetFirst()
    Do Until entry Is Nothing
        Call stream.WriteText("<tr>")
        ForAll v In entry.ColumnValues
            Call stream.WriteText("<td>" & CStr(v) & "</td>")
        End ForAll
        Call stream.WriteText("</tr>")
        Set entry = nav.GetNext(entry)
    Loop

    Call stream.WriteText("</table></body></html>")
    Call stream.Close
End Sub
```

**注意點**：

- Excel 開檔會跳「副檔名跟內容不符」警告、按「是」開檔正常 — 但 user 第一次看會嚇到
- 對 HTML 內含 `<` `>` `&` 的欄位要 escape 成 `&lt;` `&gt;` `&amp;`、不然會被當 HTML 標籤吃掉
- 不是真 .xlsx — 存檔時 Excel 會問要不要轉成 .xlsx 才能保格式樣式
- Microsoft 從 Office 2007 開始把這條路棄用、長期不建議

適用場景：**內部用、一次性、需要簡單格式樣式** 的報表。正式環境別走這條。

---

## 路 3：OLE Excel.Application — 僅 Windows 桌面

`CreateObject("Excel.Application")` 直接驅動 Excel、完整功能、但 **Excel 必須裝在跑 agent 的機器上**：

```lotusscript
Sub ExportViewViaOLE(view As NotesView, outputPath As String)
    Dim xlApp As Variant
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False

    Dim wb As Variant
    Set wb = xlApp.Workbooks.Add
    Dim ws As Variant
    Set ws = wb.ActiveSheet

    ' Header
    Dim colIdx As Integer
    colIdx = 1
    ForAll c In view.Columns
        ws.Cells(1, colIdx).Value = c.Title
        ws.Cells(1, colIdx).Font.Bold = True
        colIdx = colIdx + 1
    End ForAll

    ' Data
    Dim rowIdx As Integer
    rowIdx = 2
    Dim nav As NotesViewNavigator
    Set nav = view.CreateViewNav()
    Dim entry As NotesViewEntry
    Set entry = nav.GetFirst()
    Do Until entry Is Nothing
        colIdx = 1
        ForAll v In entry.ColumnValues
            ws.Cells(rowIdx, colIdx).Value = v
            colIdx = colIdx + 1
        End ForAll
        rowIdx = rowIdx + 1
        Set entry = nav.GetNext(entry)
    Loop

    ' 存成 .xlsx (51 = xlOpenXMLWorkbook constant)
    Call wb.SaveAs(outputPath, 51)
    Call wb.Close()
    Call xlApp.Quit()
    Set xlApp = Nothing
End Sub
```

**適用 / 不適用**：

- ✅ 桌面跑的 client agent、user 機器上有 Excel、要做 pivot / chart / 複雜公式
- ❌ Server agent（Linux Domino 沒 Excel、Windows server 通常也不裝）
- ❌ 高頻 / 高量 — OLE 呼叫額外開銷大、跑 10K rows 可能要 30 秒以上
- ❌ Excel process 殘留風險 — 沒 `xlApp.Quit()` 或 exception 跳出沒清理、process 留在 Task Manager

---

## 路 4：Apache POI via Java agent — 正式環境級 .xlsx

要真 .xlsx + 正式環境級穩定性：**Java agent + [Apache POI](https://poi.apache.org/)**。

LS side 用 LS2J 呼叫 Java agent、或 LS agent run Java agent 都可以。Java 那邊用 POI 的 `XSSFWorkbook` / `SXSSFWorkbook`（前者全載入記憶體、後者串流寫適合大量資料）：

```java
// Java agent — 概念示意、實際要做 NotesView traversal + POI workbook 寫入
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.ss.usermodel.*;

public void NotesMain() {
    SXSSFWorkbook wb = new SXSSFWorkbook(100);  // keep 100 rows in memory
    Sheet sheet = wb.createSheet("Export");
    
    // 從 NotesView 拿 entry、塞進 sheet.createRow(...).createCell(...).setCellValue(...)
    // ... 完整實作見 POI quick guide
    
    wb.write(new FileOutputStream("output.xlsx"));
    wb.close();
}
```

**為什麼適合正式環境**：

- 真 .xlsx — Excel 開不會跳警告、保留格式樣式 / 公式 / 多 sheet
- 跨平台 — Linux Domino 也能跑
- 大量資料友善 — `SXSSFWorkbook` 串流寫、不會吃光記憶體
- 有社群、bug 修得快

**門檻**：

- 要把 POI .jar 上傳到 Domino agent 的 jar 資源裡
- Java agent 跟 LS agent 互通要走 LS2J 或 run agent 模式、debug 比純 LS 麻煩
- LotusScript 為主的 team 多一個語言要學

實務上正式環境級報表的標準做法就是這條 — 痛一次設好之後可以重用。

---

## 附帶：Web download 模式

從 web app 觸發下載：寫 REST agent、CSV 直接 stream 到 response、加 `Content-Disposition` header 觸發瀏覽器下載：

```lotusscript
' Web Query Open agent，直接 print response
Print "Content-Type: text/csv; charset=UTF-8"
Print "Content-Disposition: attachment; filename=""report.csv"""
Print ""  ' header / body 之間空行

Print Chr(239) & Chr(187) & Chr(191)  ' UTF-8 BOM
Print "Name,Date,Amount"

' ...loop CSV rows、Print 出去...
```

URL `https://yourserver/yourdb.nsf/yourview?OpenAgent` 一打、瀏覽器就觸發下載 `report.csv`、user 雙擊用 Excel 開。

---

## 三條路怎麼選 — 一張對照表

| 你的需求 | 選 |
|---|---|
| 純資料、排程跑、跨平台 | **CSV via NotesStream** |
| 要簡單 cell 顏色、內部用、一次性 | HTML-as-xls |
| 桌面臨時用、Excel 已裝、要 pivot/chart | OLE Excel.Application |
| 真 .xlsx、正式環境級、格式樣式 / 多 sheet | Apache POI Java agent |
| Web app 觸發、user 瀏覽器下載 | REST agent + CSV + Content-Disposition |

90% case CSV 就解了。先寫 CSV、撞到「要 formatting」再升 POI、不要一開始就上 OLE / POI。

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | NotesStream 寫 CSV、或 OLE Excel.Application |
| Java | Apache POI（XSSFWorkbook / SXSSFWorkbook）— 業界標準、正式環境 .xlsx 都走這條 |
| SSJS / XPages | 用 [POI](https://poi.apache.org/) 或 ExtLib 的 ExcelReader/Writer、或前端 SheetJS 處理（不依賴 server） |

SSJS 場景近年很多人不從 server 端組 xlsx、改走「server REST 回 JSON、瀏覽器用 SheetJS 即時生 xlsx 給 user 下載」— 把 CPU 推給 client、省 server。Domino REST API 14.5 起 JSON response 很完善、跟這個 pattern 配合得不錯。
