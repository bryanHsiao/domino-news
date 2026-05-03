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
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATENOTECOLLECTION_METHOD_DATABASE.html"
  - title: "NotesDXLExporter (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html"
---

## NotesNoteCollection 是什麼

`NotesNoteCollection` 是 LotusScript 用來**批次操作「note」的類別**。

「note」是 NSF 的內部儲存單位 —— **任何能被分配到一個 Note ID 的東西都算**：資料文件、表單、視圖、資料夾、代理程式、ACL、Profile、樣式表等等都是。

所以這個類別涵蓋的範圍很廣，可以用旗標控制要哪幾類：

- **資料**：資料文件
- **設計元素**：表單（Forms）、視圖（Views）、資料夾（Folders）、頁面（Pages）、子表單（Subforms）、共用欄位（Shared Fields）
- **程式碼**：代理程式（Agents）、Script Libraries、Java Resources、ActionBar、DatabaseScript
- **資源**：圖片資源（Image Resources）、樣式表（Style Sheet Resources）
- **安全 / 設定**：ACL、Profile 文件、複寫公式（Replication Formulas）
- **雜項**：設計索引（Misc Index Elements）、格式元素（Misc Format Elements）、程式碼元素（Misc Code Elements）

它的甜蜜點是：

> **「我要批次處理 NSF 裡的某類 note —— 例如盤點所有代理程式、把整個資料庫的設計做 DXL 匯出版本控制、或一次撈出最近一週改過的所有 note 做稽核。」**

如果你熟悉 `NotesDocumentCollection`：兩者是不同工具。`NotesDocumentCollection` 只處理資料文件；`NotesNoteCollection` 處理 note 級別的所有東西。下面會在範例後面有完整對比表。

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

文檔**沒有** `GetLastNoteID`、`GetPrevNoteID`、`Merge`、`Subtract`、`GetUNID` 這些方法，撰寫程式時請以官方文檔為準。

## 實戰範例 1：批次撈所有代理程式做盤點

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

## 實戰範例 2：列出所有視圖名稱（兩種寫法比較）

實務上常見需求：「**我想拿到資料庫裡所有視圖的名稱清單**」。NotesNoteCollection 可以做，但有更短的路：

```lotusscript
' 方法 A：用 NotesNoteCollection
Set nc = db.CreateNoteCollection(False)
nc.SelectViews = True
Call nc.BuildCollection()

noteID = nc.GetFirstNoteID()
Do Until noteID = ""
    Set doc = db.GetDocumentByID(noteID)
    Print doc.GetItemValue("$TITLE")(0)   ' $TITLE 是「主名稱|別名|別名」
    noteID = nc.GetNextNoteID(noteID)
Loop
```

```lotusscript
' 方法 B：直接用 db.Views
ForAll v In db.Views
    Print v.Name      ' v.Name 已自動處理掉別名
    ' v.Aliases 是別名陣列
End ForAll
```

兩種寫法的取捨：

| | 方法 A（NotesNoteCollection） | 方法 B（`db.Views`） |
|---|---|---|
| 單純拿視圖名單 | 殺雞用牛刀 | ✅ 標準作法 |
| 一次撈視圖 + 資料夾 + 代理程式 | ✅ 加 `SelectFolders=True`、`SelectAgents=True` 即可 | ❌ 要分別呼叫 `db.Views` / `db.Folders` / `db.Agents` |
| 用 `SelectionFormula` 或 `SinceTime` 篩選（如「過去 7 天改過的視圖」） | ✅ 內建支援 | ❌ 要拿全部後自己過濾 |
| 配合 `NotesDXLExporter` 匯出 | ✅ 直接餵給匯出器 | ❌ 要自己組 collection |
| 拿到的物件 | Note ID 字串（要再 `GetDocumentByID`） | 直接是 `NotesView` 物件，可呼叫 `view.AllEntries` 等 |

**選擇原則**：

- 「**就是要視圖名單**」 → `db.Views`，3 行寫完
- 有「**混合多種類型**、**時間/條件篩選**、**接著做 DXL 匯出**」任一需求 → NotesNoteCollection

順帶一提：`db.Views` **包含資料夾**（folder 是 view 的特化）。要嚴格只要視圖、不要資料夾，用 `view.IsFolder` 過濾，或方法 A 只開 `SelectViews=True`（資料夾走獨立的 `SelectFolders` 旗標）。

## 實戰範例 3：取資料文件（可以做，但通常不該這樣寫）

NotesNoteCollection **可以**用來抓資料文件 —— 開 `SelectDocuments = True` 就行：

```lotusscript
Set nc = db.CreateNoteCollection(False)
nc.SelectDocuments = True       ' 只開資料文件
Call nc.BuildCollection()

noteID = nc.GetFirstNoteID()
Do Until noteID = ""
    Set doc = db.GetDocumentByID(noteID)
    Print doc.UniversalID & " | Form=" & doc.Form(0)
    noteID = nc.GetNextNoteID(noteID)
Loop
```

或者用快捷方法 `nc.SelectAllDataNotes(True)` 一次設好所有「資料相關」旗標。

但是 —— **通常你不會這樣寫取資料**。標準作法各有更短的路：

| 需求 | 標準作法 | 為什麼比 NotesNoteCollection 好 |
|---|---|---|
| 拿全部資料文件 | `db.AllDocuments` | 一行就好；直接回 `NotesDocumentCollection`，不用再 `GetDocumentByID` |
| 條件查詢 | DQL（`NotesDominoQuery`），結果再用 [NQRP](/domino-news/posts/notes-query-results-processor) 處理 | 接近 SQL 語法，引擎自動用索引 |
| 公式選取 | `db.Search(formula, ...)` | 直接吃 `@Formula` |
| 走某個視圖的所有條目 | [`NotesViewNavigator`](/domino-news/posts/notes-view-navigator) 或 `view.AllEntries` | 可同時拿到視圖欄位等中介資料 |

### NotesNoteCollection 取資料的甜蜜點

它在以下三種情境才會贏過上面的標準作法：

1. **混合一次撈：資料 + 設計** —— 例如「過去 7 天改過的所有 note（含資料、視圖、代理）」做稽核或備份
   ```lotusscript
   Call nc.SelectAllNotes(True)
   nc.SinceTime = New NotesDateTime(Now - 7)
   Call nc.BuildCollection()
   ```
2. **配合 `NotesDXLExporter`** —— 想連同資料一起匯出做版本控制
3. **需要 Note ID 字串而非 NotesDocument 物件** —— 寫工具或寫日誌時直接記 NoteID

### 一個小細節

`SelectDocuments = True` **不會**包含：

- 刪除存根（deletion stubs）
- 衝突文件（conflict documents）的處理也跟 `NotesDocumentCollection` 略有不同

要做「完整資料庫稽核」需要另外處理這些邊界情況。

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

## 進階：跟 NotesDocumentCollection 的完整對比

如果你已經熟悉 `NotesDocumentCollection`，這個對比表能幫你快速定位兩者差別：

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
