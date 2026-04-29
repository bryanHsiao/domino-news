---
title: "NotesNoteCollection 入門：操作 NSF 設計元素的瑞士刀"
description: "NotesNoteCollection（筆記集合）跟 NotesDocumentCollection 不同，它代表的是 NSF 裡所有「note」—— 包含資料文件、表單、視圖、ACL、代理程式、程式庫等設計元素。本文整理 32 個屬性、14 個方法、CreateNoteCollection 的 True/False 兩種起始模式，以及最常用的場景：DXL 匯出。"
pubDate: "2026-04-29T10:50:36+08:00"
lang: "zh-TW"
slug: "notes-note-collection"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
  - "DevOps"
sources:
  - title: "NotesNoteCollection (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html"
  - title: "NotesDatabase CreateNoteCollection method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATENOTECOLLECTION_METHOD.html"
  - title: "NotesDXLExporter (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html"
---

## 跟 NotesDocumentCollection 不一樣的點

`NotesDocumentCollection` 處理的是「資料文件」—— 你建一筆 Memo、一筆 Customer，都是它的範圍。`NotesNoteCollection` 處理的是 NSF 裡**所有種類的 note**：

- 資料文件（跟 NotesDocumentCollection 一樣的對象）
- 設計元素：表單（Forms）、視圖（Views）、資料夾（Folders）、代理程式（Agents）、頁面（Pages）、子表單（Subforms）、共用欄位（Shared Fields）
- 程式碼：ScriptLibraries、JavaResources、ActionBar、DatabaseScript
- 資源：圖片資源（ImageResources）、樣式表（StyleSheetResources）
- 安全：ACL、Profile 文件
- 雜項：複寫公式（ReplicationFormulas）、設計索引（MiscIndexElements）、格式元素（MiscFormatElements）

「note」是 NSF 內部的概念 —— 任何能被分配到一個 Note ID 的東西都算。所以 NotesNoteCollection 的甜蜜點是：

> **「我要批次處理一個資料庫的某類設計元素，例如全部的代理程式、全部的視圖、或者連同資料一起做 DXL 匯出。」**

`NotesDocumentCollection` 做不到這件事，它只看資料文件。

## 建立：`CreateNoteCollection(Boolean)`

從 `NotesDatabase` 取得：

```lotusscript
Set nc = db.CreateNoteCollection(False)
```

那個布林參數決定**所有 `Select*` 屬性的起始狀態**：

- `True` → 所有 `Select*` 都先設為 `True`（要拿全部，再用 `False` 關掉不要的）
- `False` → 所有 `Select*` 都先設為 `False`（什麼都不選，再用 `True` 開啟想要的）

實務上 `False` 比較常見 —— 你通常知道自己只要某幾類元素，挑出來開就好。

## 32 個屬性 —— 看你要什麼

文檔列出的全部屬性：

### 一般

| 屬性 | 用途 |
|---|---|
| `Count` | 集合涵蓋的 note 總數 |
| `Parent` | 所屬的 `NotesDatabase` |
| `LastBuildTime` | 上次 `BuildCollection` 完成的時間 |
| `SinceTime` | 只收這個時間之後修改過的 note |
| `SelectionFormula` | 額外用 `@Formula` 篩選 |

### 27 個 `Select*` 開關（每一個對應一類 note）

| 類型 | 屬性 |
|---|---|
| **資料 / 設計流程** | `SelectDocuments`、`SelectFolders`、`SelectViews` |
| **表單系列** | `SelectForms`、`SelectSubforms`、`SelectSharedFields`、`SelectFrameSets`、`SelectPages` |
| **程式碼** | `SelectAgents`、`SelectScriptLibraries`、`SelectActions`、`SelectDatabaseScript` |
| **資源** | `SelectImageResources`、`SelectJavaResources`、`SelectStyleSheetResources`、`SelectIcon` |
| **大綱 / 導覽** | `SelectOutlines`、`SelectNavigators` |
| **安全 / 設定** | `SelectACL`、`SelectProfiles`、`SelectReplicationFormulas`、`SelectDataConnections` |
| **說明** | `SelectHelpAbout`、`SelectHelpUsing`、`SelectHelpIndex` |
| **雜項** | `SelectMiscCodeElements`、`SelectMiscFormatElements`、`SelectMiscIndexElements` |

每個都是布林。你想拿全部代理程式跟視圖：

```lotusscript
Set nc = db.CreateNoteCollection(False)
nc.SelectAgents = True
nc.SelectViews = True
Call nc.BuildCollection()
```

## 14 個方法 —— 三種用途

### 生命週期

| 方法 | 用途 |
|---|---|
| `BuildCollection` | 根據 `Select*` 旗標跟 `SelectionFormula` 把 note 蒐集進來。一定要呼叫，否則 `Count = 0` |
| `ClearCollection` | 清空集合（不重設 `Select*` 旗標） |

### 集合操作

| 方法 | 用途 |
|---|---|
| `Add(noteOrCollection)` | 把另一個 note 或 collection 加進來 |
| `Remove(noteOrCollection)` | 從集合移除 |
| `Intersect(otherCollection)` | 交集（只留兩邊都有的） |

### 批次預設

| 方法 | 用途 |
|---|---|
| `SelectAllNotes(Boolean)` | 一次設定所有 27 個 `Select*` 為 True 或 False |
| `SelectAllDataNotes(Boolean)` | 只設「資料相關」（`SelectDocuments` 等）為 True/False |
| `SelectAllDesignElements(Boolean)` | 只設「設計元素」為 True/False |
| `SelectAllAdminNotes(Boolean)` | 只設「管理用」（ACL、Profile 等）為 True/False |
| `SelectAllCodeElements(Boolean)` | 只設「程式碼」為 True/False |
| `SelectAllFormatElements(Boolean)` | 只設「格式」為 True/False |
| `SelectAllIndexElements(Boolean)` | 只設「索引」為 True/False |

### 遍歷

| 方法 | 用途 |
|---|---|
| `GetFirstNoteID` | 取第一個 Note ID（字串形式，如 `"NT00001ABC"`） |
| `GetNextNoteID(currentID)` | 取下一個 Note ID |

> 注意：文檔**沒有** `GetLastNoteID`、`GetPrevNoteID`、`Merge`、`Subtract`、`GetUNID`。
> AI 寫 NotesNoteCollection 文章時常常幻覺出這些方法 —— 都不存在，請以官方文檔為準。

## 典型用法：批次撈所有代理程式做盤點

```lotusscript
Sub AuditAgents(db As NotesDatabase)
    Dim nc As NotesNoteCollection
    Dim noteID As String
    Dim doc As NotesDocument

    Set nc = db.CreateNoteCollection(False)
    nc.SelectAgents = True
    Call nc.BuildCollection()

    Print "找到 " & nc.Count & " 個代理程式"

    noteID = nc.GetFirstNoteID()
    Do Until noteID = ""
        Set doc = db.GetDocumentByID(noteID)
        Print doc.GetItemValue("$TITLE")(0) & _
              " | LastModified: " & doc.LastModified
        noteID = nc.GetNextNoteID(noteID)
    Loop
End Sub
```

幾個重點：

1. `CreateNoteCollection(False)` —— 從零開始，再開啟想要的類別
2. `nc.SelectAgents = True` —— 只開代理程式
3. `BuildCollection()` —— 一定要呼叫才會真的蒐集到 note
4. `GetFirstNoteID` / `GetNextNoteID` —— 注意是 **Note ID 字串**，不是 `NotesDocument` 物件，要再用 `db.GetDocumentByID()` 撈出來

## 最常用的場景：DXL 匯出

`NotesNoteCollection` 在實務上最常見的用途是搭配 [`NotesDXLExporter`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html)：

```lotusscript
Sub ExportAllDesignToDXL(db As NotesDatabase, outputPath As String)
    Dim nc As NotesNoteCollection
    Dim exporter As NotesDXLExporter
    Dim s As New NotesSession
    Dim stream As NotesStream

    ' 1. 收集所有設計元素（不含資料文件）
    Set nc = db.CreateNoteCollection(False)
    Call nc.SelectAllDesignElements(True)
    Call nc.BuildCollection()

    ' 2. 開檔準備寫入
    Set stream = s.CreateStream()
    Call stream.Open(outputPath, "UTF-8")

    ' 3. 用 DXL Exporter 把整個集合輸出成 XML
    Set exporter = s.CreateDXLExporter()
    Call exporter.SetInput(nc)
    Call exporter.SetOutput(stream)
    Call exporter.Process()

    Call stream.Close()
    Print "匯出完成：" & outputPath
End Sub
```

這就是「templating tool」式的用法 —— 要把一整個範本資料庫的設計另存 XML 做版本控制、跨環境部署、或單純備份，這條路是首選。

## 跟 NotesDocumentCollection 的對比

| | `NotesDocumentCollection` | `NotesNoteCollection` |
|---|---|---|
| 範圍 | 只有資料文件 | 所有 note（設計 + 資料） |
| 元素類型 | 一律是 `NotesDocument` | Note ID 字串（要自己 `GetDocumentByID`） |
| 建立 | `db.AllDocuments`、`view.AllEntries.GetAllDocuments` 等多種 | 只能 `db.CreateNoteCollection(Boolean)` |
| 篩選方式 | 來源端就限定（view、folder、查詢結果） | `Select*` 旗標 + `SelectionFormula` |
| 集合操作 | `Add` 後就撈不出原本的資料文件 | `Add` / `Remove` / `Intersect` 三件式 |
| 主要用途 | 走資料、搜尋、批次更新 | 設計元素盤點、DXL 匯出、版本控制工具 |

## 什麼時候 *不* 用 NotesNoteCollection

- 純粹批次操作資料文件 → `NotesDocumentCollection` 或 DQL（`NotesDominoQuery`）
- 要跟視圖一起走 entry 中介資料 → [`NotesViewNavigator`](/domino-news/posts/notes-view-navigator)
- 只想拿資料庫設計清單 → `NotesDatabase.GetView()` / `GetForm()` / `GetAgent()` 等個別 API 比較直覺

它的甜蜜點就是 **「我要批次處理 note 級別的東西，特別是設計元素」**。對到這個情境，沒有更好的工具。
