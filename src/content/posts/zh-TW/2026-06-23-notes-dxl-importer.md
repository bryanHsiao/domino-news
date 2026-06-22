---
title: "NotesDXLImporter：把 DXL 灌回 Domino，設計元素 / 文件 / ACL 各有匯入策略"
description: "你用 NotesDXLExporter 把設計或文件匯出成 DXL（Domino XML）之後，怎麼把它灌回資料庫？NotesDXLImporter 就是反向那一半。本文拆解它的建立、三個關鍵匯入策略（DesignImportOption / DocumentImportOption / ACLImportOption 各自的 create / ignore / replace / update）、Import 方法與取回匯入 note 的方式，以及它跟 DXLExporter 怎麼組成完整的 DXL round-trip。"
pubDate: 2026-06-23T07:30:00+08:00
lang: zh-TW
slug: notes-dxl-importer
tags:
  - "LotusScript"
  - "Tutorial"
  - "DevOps"
sources:
  - title: "NotesDXLImporter class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
  - title: "NotesDXLExporter class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
  - title: "Import method (NotesDXLImporter) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IMPORT_METHOD_DXLIMPORTER.html"
relatedJava: ["DxlImporter"]
relatedSsjs: ["DxlImporter"]
---

站上先前在 [`NotesXMLProcessor`](/domino-news/posts/notes-xml-processor/) 那篇介紹過 `NotesDXLExporter` —— 把 Domino 的設計元素或文件匯出成 **DXL（Domino XML）**。那反過來的問題自然是：拿到一份 DXL，怎麼把它**灌回**資料庫？

那就是 [`NotesDXLImporter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html) 的工作。官方定義：「Represents the conversion of DXL (Domino XML) to Domino data.」它把 DXL 轉回 Domino 資料 —— 設計元素、文件、ACL 都能匯。常見用途：**程式化部署設計**（把某幾個 form / view 推到多顆庫）、**從備份 DXL 還原文件**、或在系統間搬資料。

---

## 重點摘要

- 用 `session.CreateDXLImporter()` 建立；輸入是 DXL（字串 / 檔案 / stream），輸出用 `SetOutput()` 指定目標資料庫。
- **三個關鍵匯入策略**，分別控制三類東西的處理方式：
  - `DesignImportOption` —— 設計元素：create / ignore / replace
  - `DocumentImportOption` —— 文件：create / ignore / replace / update
  - `ACLImportOption` —— ACL 條目：ignore / replace / update
- `Import(dxl, db)` 執行匯入；`ImportedNoteCount` 回匯入了幾個 note；`GetFirstImportedNoteID` / `GetNextImportedNoteID` 走訪匯入結果。
- 其他控制：`ReplaceDbProperties`、`ReplicaRequiredForReplaceOrUpdate`、`InputValidationOption`（依 DTD 驗證）、`ExitOnFirstFatalError`、`Log` / `LogComment`。
- 跟 `NotesDXLExporter` 成對 —— 一export 一import，組成完整的 DXL round-trip。

## 建立與基本流程

```lotusscript
Dim session As New NotesSession
Dim importer As NotesDXLImporter
Set importer = session.CreateDXLImporter()

' 設定匯入策略（見下）
importer.DocumentImportOption = DXLIMPORTOPTION_CREATE

' 執行：把 dxl 匯進 targetDb
Call importer.Import(dxlString, targetDb)
Print "匯入了 " & importer.ImportedNoteCount & " 個 note"
```

`dxl` 來源可以是字串、檔案或 stream；`targetDb` 是要灌進去的 [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html)。

## 三個關鍵：Design / Document / ACL ImportOption

匯入最該想清楚的，是「碰到既有東西時要怎麼處理」。DXL 裡可能同時有設計、文件、ACL，三類各有自己的策略屬性：

| 屬性 | 控制 | 可選策略（官方原文摘要） |
|---|---|---|
| `DesignImportOption` | 設計元素 | 「create, ignore, or replace」 |
| `DocumentImportOption` | 文件 | 「create, ignore, replace, or update」 |
| `ACLImportOption` | ACL 條目 | 「ignore, replace, or update」 |

幾個實務判斷：

- **部署設計**：通常 `DesignImportOption = replace`（蓋掉舊版設計），文件多半 `ignore`（別動使用者資料），ACL 看情況 `ignore`（別覆蓋目標庫的權限）。
- **還原 / 匯入文件**：`DocumentImportOption = create`（全新建）或 `update`（依 UNID 更新既有文件）。`update` 跟 `replace` 的差別是 update 會配對既有文件，這時 `ReplicaRequiredForReplaceOrUpdate` 決定「是否要求 replica ID 相符」才肯更新 —— 跨非副本的庫匯入時要特別留意這個。

選錯策略最常見的災難就是「本來只想更新文件、結果把目標庫的設計或 ACL 也蓋了」。**匯入前先想清楚 DXL 裡有什麼、三個 option 各設什麼。**

## 取回匯入結果與除錯

- `ImportedNoteCount` —— 匯入了幾個 note。
- `GetFirstImportedNoteID()` / `GetNextImportedNoteID(noteid)` —— 走訪剛匯入的那些 note 的 note ID，方便後續處理或驗證。
- `InputValidationOption` —— 若 XML 宣告了 DTD，用它驗證輸入格式。
- `ExitOnFirstFatalError` —— 遇到第一個致命錯誤就停，還是盡量繼續。
- `Log` / `LogComment` —— 把匯入過程記下來，批次部署時很需要。

## 跟 DXLExporter 成對：完整的 round-trip

`NotesDXLImporter` 跟 [`NotesDXLExporter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html) 是鏡像的一對：

```text
Domino 資料  --(DXLExporter)-->  DXL (XML)  --(DXLImporter)-->  Domino 資料
```

這條 round-trip 是很多「以文字檔管理 Domino 設計 / 資料」做法的基礎 —— 把設計匯出成 DXL 進版控、需要時再 import 回去部署。也是 source-control-for-Domino、自動化部署這類 DevOps 流程的底層機制。

## 同類別在其他語言

| 語言 | 對應類別 | 建立方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `DxlImporter` | `session.createDxlImporter()` |
| SSJS / XPages | `DxlImporter` | `session.createDxlImporter()` |

三邊一致：同樣的三組 import option、`importDxl()` / `setDocumentImportOption()` 等。要做 Domino 的自動化部署工具，Java 端的 `DxlImporter` 加上這篇的策略判斷可以直接套。
