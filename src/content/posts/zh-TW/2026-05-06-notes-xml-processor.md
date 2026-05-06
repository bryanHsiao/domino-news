---
title: "NotesXMLProcessor 入門：LotusScript 處理 XML 的共同基底"
description: "NotesXMLProcessor 是 LotusScript 全部 XML 處理類別（DOMParser、SAXParser、DXLExporter、DXLImporter、XSLTransformer）共用的 abstract base class。本文整理它的角色、5 個衍生類別怎麼選、共通的屬性與 SetInput / SetOutput / Process 三個方法、以及 Release 6 起加入後的版本與 COM 限制。"
pubDate: 2026-05-06T07:30:00+08:00
lang: zh-TW
slug: notes-xml-processor
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesXMLProcessor (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html"
  - title: "NotesXMLProcessor.SetInput method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SETINPUT_METHOD_XMLPROCESSOR.html"
  - title: "NotesDXLExporter (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html"
cover: "/covers/notes-xml-processor.png"
coverStyle: "low-poly-3d"
---

## NotesXMLProcessor 在 LotusScript 中扮演什麼角色

[`NotesXMLProcessor`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html) 是「所有 XML 處理類別共用的 base class，含共通屬性與方法」。重點是 — 它**是個 abstract class**，文件原文：「The NotesXMLProcessor class is abstract and you do not create NotesXMLProcessor objects.」要用就一定要透過 `NotesSession` 上對應的 `Create*` 方法拿一個衍生類別實例。

> **版本與限制**：Release 6 起加入；**不支援 COM**（從 LotusScript 用沒問題，但走 COM 自動化就 access 不到）。

## 五個衍生類別 — 怎麼選

| 衍生類別 | 用途 | 用哪個 Create 方法 |
|---|---|---|
| `NotesDOMParser` | 把 XML parse 成 DOM 樹（在記憶體裡走、改、查） | `session.CreateDOMParser` |
| `NotesSAXParser` | 把 XML 當事件流處理（適合大檔、不想全部載入記憶體） | `session.CreateSAXParser` |
| `NotesDXLExporter` | 把 Domino 資料（DB / 文件 / view）匯出為 DXL（Domino XML） | `session.CreateDXLExporter` |
| `NotesDXLImporter` | 把 DXL 匯回 Domino | `session.CreateDXLImporter` |
| `NotesXSLTransformer` | 用 XSLT 轉換 DXL | `session.CreateXSLTransformer` |

**選擇原則**：
- 要「動 Domino 設計或資料」→ DXLExporter / DXLImporter
- 要「parse 別的系統來的 XML」→ DOMParser（小檔，要隨機存取）或 SAXParser（大檔，stream 處理）
- 要「把 DXL 變成別的 XML 格式」（例如餵給其他系統）→ XSLTransformer

## 共通屬性（從 base class 繼承）

- `ExitOnFirstFatalError`（讀寫 Boolean）— 遇到 fatal error 是否立刻終止
- `Log`（唯讀 String）— 處理過程中產生的 warning / error / fatal error，**XML 格式**
- `LogComment`（讀寫 String）— 寫進 Log 開頭的一段註解，方便事後辨識

`Log` 是 XML 不是純文字 — 要分析錯誤的話可以再用一個 DOMParser 把它 parse 起來。

## 共通方法

- [`SetInput`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_SETINPUT_METHOD_XMLPROCESSOR.html) — 指定 XML 處理的輸入。**接受的型別依衍生類別而異**：DXLExporter 接 `NotesDatabase` / `NotesDocumentCollection` / `NotesDocument`；DOMParser / SAXParser 接 `NotesStream` / 檔案路徑字串；DXLImporter 接 DXL 字串 / `NotesStream` 等
- `SetOutput` — 指定輸出位置（同樣依衍生類別而異 — 通常是 `NotesStream` 或檔案路徑字串）
- `Process` — 啟動轉換或解析（同步呼叫，跑完才返回）

## 範例：把整個 DB 匯出為 DXL

最常見的用法是用 [`NotesDXLExporter`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html) 把當前資料庫整個轉成 DXL 檔：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' 開一個 NotesStream 當輸出
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Dim filename As String
    filename = "C:\dxl\" & Left(db.FileName, Len(db.FileName) - 3) & "xml"
    If Not stream.Open(filename) Then
        Messagebox "無法開啟 " & filename, , "錯誤"
        Exit Sub
    End If
    Call stream.Truncate

    ' 建立 DXL exporter（NotesXMLProcessor 是 abstract，從這裡取衍生類別）
    Dim exporter As NotesDXLExporter
    Set exporter = session.CreateDXLExporter

    ' 設好輸入輸出
    Call exporter.SetInput(db)
    Call exporter.SetOutput(stream)

    ' 設成「遇 fatal error 就停」、加個 log 註解
    exporter.ExitOnFirstFatalError = True
    exporter.LogComment = "Exported by " & session.UserName

    ' 真正執行
    Call exporter.Process

    ' 看 log 有沒有 warning / error
    If Len(exporter.Log) > 0 Then
        Print "DXL 匯出 log："
        Print exporter.Log
    End If

    Call stream.Close
    Messagebox "DXL 匯出完成。"
End Sub
```

幾個值得注意的點：

1. **NotesXMLProcessor 從不直接 New** — 永遠是用 `session.CreateXxx` 拿衍生類別。
2. **SetInput / SetOutput 後一定要呼叫 `Process`** — 設好不會自己跑。
3. **Process 是同步的** — 大 DB 匯出時這個 Sub 會 block 到完成為止。
4. **Log 是 XML 格式** — 想結構化分析錯誤就再用一個 DOMParser parse 它。

## 順帶的搭配建議

NSF 內 XML 處理常見組合：

- **匯出做備份 / 版本管理**：`DXLExporter` → 寫到檔案，配合 git 之類追蹤設計變更
- **匯入 DXL 做部署**：`DXLImporter` ← 從受信任來源匯入，注意 ACL 先確認過
- **解析外部系統 XML**：用 `DOMParser`（< 10 MB）或 `SAXParser`（更大檔）
- **DXL 轉外部格式**：`DXLExporter` → 拿到 DXL → `XSLTransformer` 套 XSLT → 輸出目標格式

## 結論

`NotesXMLProcessor` 自己不能用，重要的是它定義了「整個 XML 處理家族」共用的 contract — 一致的 SetInput / SetOutput / Process 三段式 + 一致的 Log 機制。實際寫程式時挑對衍生類別、把 input/output 拼好就能跑。
