---
title: "NotesOutline / NotesOutlineEntry 全攻略 — Domino UI 導覽控件的程式化建構、4 種 entry type、24 個 property"
description: "NotesOutline 是 Domino 應用程式的左側 / 上方導覽控件，由 NotesOutlineEntry 條目以樹狀組成。透過 LotusScript 可以動態建立、修改、走訪 outline — 典型 use case 是多語切換（依 user locale 動態改 Label）、條件式 menu（依 role 顯示／隱藏）、動態使用者連結。本文整理 NotesOutline ↔ NotesOutlineEntry 關係、8 個 tree-walking 方法、6 個 manipulation 方法、24 個 entry property、4 個 Set* 方法、4 種 entry type 常數、9 個 EntryClass 常數、完整 CRUD 範例、五個踩雷點，跟 Java / SSJS 對照。"
pubDate: 2026-05-20T07:30:00+08:00
lang: zh-TW
slug: notes-outline
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "Examples: NotesOutline class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESOUTLINE_CLASS_EX.html"
  - title: "Examples: Outline class properties and methods (Java reference) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_OUTLINE_CLASS_JAVA.html"
relatedJava: ["Outline", "OutlineEntry"]
relatedSsjs: ["Outline", "OutlineEntry"]
cover: "/covers/notes-outline.png"
coverStyle: "collage"
---

## 重點摘要

- [`NotesOutline`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html) — HCL 原話「Represents an outline in a database. An outline supports a hierarchy of OutlineEntries and the NotesOutline class provides methods for navigation and manipulation of the individual OutlineEntries」
- [`NotesOutlineEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html) — HCL 原話「Represents an entry within an outline」
- **容器關係**：`NotesOutline` Contains `NotesOutlineEntry`、Contained by `NotesDatabase`
- **4 種 entry target type**：`OUTLINE_TYPE_NOTELINK`（文件連結）/ `OUTLINE_TYPE_NAMEDELEMENT`（view / form / folder 等設計元素）/ `OUTLINE_TYPE_URL`（URL 連結）/ `OUTLINE_TYPE_ACTION`（執行 formula）
- ⚠️ **Outline 是 legacy design element** — XPages / Modern Notes UI 多半取代了它在 client UI 上的角色，但**程式化動態建構 outline** 在多語切換 / 條件式 menu / 個人化導覽場景還是常用工具

## 什麼是 Outline

Outline 是 Domino 應用程式的**導覽控件**設計元素（design element）—— 開啟一個 Notes app 時左側那條 menu 就是 outline。每個 entry 可以是 view 連結、文件連結、URL、或執行一段 formula 的 action。

實務上 outline 多半在 Designer 手動設計、靜態存在。但**程式化建構 / 修改 outline** 的場景在：

- **多語切換** — 依 user locale 動態改每個 entry 的 `Label`
- **條件式 menu** — 依 ACL role 動態 hide / show entries
- **個人化導覽** — 加 user-specific 連結（bookmark、最近開過的 doc）
- **DXL 匯出 / 匯入** — outline 結構搬移、版本控制

## NotesOutline ↔ NotesOutlineEntry 容器關係

依官方類別定義：

- `NotesOutline` — Contained by `NotesDatabase`、Contains `NotesOutlineEntry`
- `NotesOutlineEntry` — Contained by `NotesOutline`

換句話說：先拿到 outline、再走訪 / 新增 / 修改 / 刪除 entries。outline 自己沒有「list of entries」property，要走 `GetFirst` + `GetNext` 用 tree-walk 拿。

## 拿到 outline + 走 entry 樹

### 拿到 outline

從 `NotesDatabase` 的兩個方法：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline

Set db = session.CurrentDatabase

' 拿既有
Set outline = db.GetOutline("MainOutline")

' 或建新
Set outline = db.CreateOutline("MyNewOutline")
```

`GetOutline` 失敗（outline 不存在）回 Nothing、不噴錯。`CreateOutline` 建好後**必須 `outline.Save`** 才會真的存進 db。

### 8 個 tree-walking 方法

依官方文件、`NotesOutline` 提供以下 8 個 navigation 方法：

| 方法 | 用途 |
|---|---|
| `GetFirst()` | 「Gets the first entry of an outline」 |
| `GetLast()` | 「Gets the last entry of an outline」 |
| `GetNext(entry)` | 「Given an entry in an outline, returns the entry immediately following it」 |
| `GetPrev(entry)` | 「Given an entry in an outline, returns the entry immediately preceding it」 |
| `GetParent(entry)` | 「Given a response entry in an outline, returns its parent entry」 |
| `GetChild(entry)` | 「Returns the child of the specified entry」 |
| `GetNextSibling(entry)` | 「Given an entry in an outline, returns the entry immediately following it at the same level」 |
| `GetPrevSibling(entry)` | 「Given an entry in an outline, returns the entry immediately preceding it at the same level」 |

典型走訪整個 outline 的 pattern：

```lotusscript
Dim entry As NotesOutlineEntry
Set entry = outline.GetFirst()
Do Until entry Is Nothing
    Print entry.Label & " (Level " & entry.Level & ")"
    Set entry = outline.GetNext(entry)
Loop
```

`GetNext` 走的是 depth-first 順序、會走進 children 再走 sibling、整棵都走完。要只走同層用 `GetNextSibling`。

### 6 個 manipulation 方法

| 方法 | 用途 |
|---|---|
| `Save()` | 「Saves any changes you have made to the outline」 — **必呼叫**否則改動丟失 |
| `CreateEntry(label, parent, type, after)` | 「Creates a new entry and adds it to the outline」 |
| `CreateEntryFrom(existingEntry, parent, after)` | 「Creates a copy of an existing outline entry」 |
| `AddEntry(entry, parent, after)` | 「Adds a new entry to the outline」（從 free-standing entry 加進來） |
| `MoveEntry(entry, parent, after)` | 「Moves an outline entry and subentries from one location to another」 |
| `RemoveEntry(entry)` | 「Deletes an entry and its subentries from an outline」 |

## NotesOutlineEntry 的 24 個 property

### Read-write（可改）

| Property | 用途 |
|---|---|
| `Label` | 顯示文字 — 多語場景就是改這個 |
| `Alias` | 程式存取用的內部代號 |
| `HideFormula` | 隱藏條件 formula |
| `UseHideFormula` | 是否啟用 hide formula |
| `IsHidden` | 任何 context 都隱藏 |
| `IsHiddenFromNotes` | Notes client 隱藏 |
| `IsHiddenFromWeb` | Web 隱藏 |
| `FrameText` | 顯示在哪個 frame |
| `ImagesText` | entry icon 圖檔名 |
| `KeepSelectionFocus` | 點選後 focus 行為 |

### Read-only

| Property | 用途 |
|---|---|
| `Parent` | 回到 NotesOutline |
| `Type` | entry target 類型（4 種常數、下節詳列） |
| `EntryClass` | 連結的設計元素類別（9 種常數）|
| `Level` | 階層深度 |
| `HasChildren` | 有沒有子 entry |
| `IsInThisDb` | 連結目標是否在同一 db |
| `IsPrivate` | 是不是 user-specific |
| `Formula` | action entry 的 formula |
| `URL` | URL entry 的 URL 字串 |
| `NamedElement` | named element entry 的元素名 |
| `View` | view entry 的 view 物件 |
| `Database` | database entry 的 db 物件 |
| `Document` | document entry 的 doc 物件 |

## 4 個 Set* 方法 — 設定 entry 的 target

[`NotesOutlineEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html) 提供 4 個設定 target 的 method（**對應 4 種 Type**）：

| Method | 設成什麼 | 對應 Type |
|---|---|---|
| `SetNoteLink(notelinkable)` | 連結到特定 doc / db / view（傳 NotesDocument / NotesDatabase / NotesView 之一） | `OUTLINE_TYPE_NOTELINK` |
| `SetNamedElement(db, name, class)` | 連結到 db 內某個設計元素（指定 EntryClass：VIEW / FORM / FOLDER / 等） | `OUTLINE_TYPE_NAMEDELEMENT` |
| `SetURL(url)` | 連結到 URL | `OUTLINE_TYPE_URL` |
| `SetAction(formula)` | 執行一段 @Formula | `OUTLINE_TYPE_ACTION` |

⚠️ **沒有 `SetView` 方法** — 網路上很多範例（包括 AI 寫的）會出現 `entry.SetView(db, "ViewName")`、那是**錯的、HCL doc 沒這個 method**。要連結到 view 用 `SetNamedElement(db, "ViewName", OUTLINE_CLASS_VIEW)`。

## 4 種 Type 常數（target 類型）

```
OUTLINE_TYPE_NOTELINK         ' 連結到 doc / db / view（透過 SetNoteLink）
OUTLINE_TYPE_NAMEDELEMENT     ' 連結到 named design element（透過 SetNamedElement）
OUTLINE_TYPE_URL              ' 連結到 URL（透過 SetURL）
OUTLINE_TYPE_ACTION           ' 執行 formula（透過 SetAction）
```

外加三個系統用 type 常數（讀 outline 時可能撞到、不常自己設）：

```
OUTLINE_OTHER_FOLDERS_TYPE    ' 系統「其他 Folders」項目
OUTLINE_OTHER_VIEWS_TYPE      ' 系統「其他 Views」項目
OUTLINE_OTHER_UNKNOWN_TYPE    ' 未知類型
```

## 9 種 EntryClass 常數（連結到什麼設計元素）

當 entry 的 `Type` 是 `OUTLINE_TYPE_NAMEDELEMENT` 時、`EntryClass` 告訴你連到哪種設計元素：

```
OUTLINE_CLASS_DATABASE        ' 整個 db
OUTLINE_CLASS_VIEW            ' view
OUTLINE_CLASS_FOLDER          ' folder
OUTLINE_CLASS_FORM            ' form
OUTLINE_CLASS_DOCUMENT        ' document
OUTLINE_CLASS_FRAMESET        ' frameset
OUTLINE_CLASS_NAVIGATOR       ' navigator
OUTLINE_CLASS_PAGE            ' page design element
OUTLINE_CLASS_UNKNOWN         ' 未知
```

## 完整範例 — 建 outline、加多種 entry、走 tree、save

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Dim entryView As NotesOutlineEntry
    Dim entryUrl As NotesOutlineEntry
    Dim entryAction As NotesOutlineEntry
    Dim entryHeader As NotesOutlineEntry

    Set db = session.CurrentDatabase
    Set outline = db.CreateOutline("DynamicNav")

    ' (1) Header — 一個 group 的標題（沒 target、純標示）
    Set entryHeader = outline.CreateEntry("Quick Links", Nothing, "", Nothing)
    entryHeader.Label = "快速連結"  ' 多語 — 改 Label

    ' (2) View 連結 — 用 SetNamedElement + OUTLINE_CLASS_VIEW
    Set entryView = outline.CreateEntry("AllOrders", entryHeader, "", Nothing)
    entryView.Label = "全部訂單"
    Call entryView.SetNamedElement(db, "(AllOrders)", OUTLINE_CLASS_VIEW)

    ' (3) URL 連結
    Set entryUrl = outline.CreateEntry("HCLDocs", entryHeader, "", Nothing)
    entryUrl.Label = "HCL Docs"
    Call entryUrl.SetURL("https://help.hcl-software.com/")

    ' (4) Action entry — 執行 formula
    Set entryAction = outline.CreateEntry("RefreshAll", entryHeader, "", Nothing)
    entryAction.Label = "重新整理"
    Call entryAction.SetAction({@Command([RefreshHideFormulas])})

    ' (5) 必呼叫 Save
    Call outline.Save()

    ' 走訪確認
    Dim entry As NotesOutlineEntry
    Set entry = outline.GetFirst()
    Do Until entry Is Nothing
        Print String(entry.Level * 2, " "); entry.Label _
            & " [type=" & entry.Type & ", class=" & entry.EntryClass & "]"
        Set entry = outline.GetNext(entry)
    Loop
End Sub
```

幾個觀察：

- **`CreateEntry(label, parent, type, after)` 的 `parent` 傳 Nothing** 表示加到 root level；傳一個 existing entry 表示這個是它的 child
- **`String(entry.Level * 2, " ")` 做縮排顯示** — Level 0 是 root、Level 1 是 root 的 child
- **多語場景 — `entry.Label = ...` 動態改、Save 後生效**
- **outline.Save 一定要呼叫** — 跟 NotesACLEntry 同性質的 silent bug

## 五個踩雷點

### 1. 忘 `outline.Save` — 改動 silent 丟失

跟 [NotesACLEntry](/domino-news/posts/notes-acl-entry) 同類 silent bug。改了 entry.Label / SetURL / EnableRole 等等、忘 `Call outline.Save` 就全部沒寫入。**Code review 永遠 grep：每個 outline modification 後是不是有 `.Save`**。

### 2. `SetView` 不是 method — 用 `SetNamedElement` + `OUTLINE_CLASS_VIEW`

很多老 LS code 跟 AI 寫的範例會出現：

```lotusscript
Call entry.SetView(db, "ViewName")    ' ❌ HCL doc 沒這個 method
```

正解：

```lotusscript
Call entry.SetNamedElement(db, "ViewName", OUTLINE_CLASS_VIEW)
```

NotesOutlineEntry 只有 **4 個 Set 方法**：`SetAction` / `SetNamedElement` / `SetNoteLink` / `SetURL`。其他都是 property 直接 assign。

### 3. `HideFormula` 不會自動生效 — 要 `UseHideFormula = True`

設了 hide formula 但 entry 還是顯示？檢查 `UseHideFormula`：

```lotusscript
entry.HideFormula = {@IsMember("[Admin]"; @UserRoles) = False}
entry.UseHideFormula = True   ' 必加
```

`UseHideFormula` 是隱藏 formula 的開關 — 不設等同 formula 不存在。

### 4. `GetNext` 是 depth-first、不是 sibling-only

```lotusscript
Set entry = outline.GetFirst()
Do Until entry Is Nothing
    ' 這個 loop 會走過所有 entries（含 children）、不只 root level
    Set entry = outline.GetNext(entry)
Loop
```

要**只走同層**用 `GetNextSibling`：

```lotusscript
Set entry = outline.GetFirst()  ' 第一個 root entry
Do Until entry Is Nothing
    ' 只走 root level
    Set entry = outline.GetNextSibling(entry)
Loop
```

混用兩種會走出意外結果。

### 5. Outline 是 legacy element — 新 design 要評估 XPages / Modern UI

Outline 從 Notes 6 引入、設計目標是 Notes client 的左側 menu。**XPages 之後、新 design 大多走 XPages 的 ApplicationLayout 或現代 web UI 取代了 outline 的 client UI 角色**。

實務上仍用 outline 的場景：

- **legacy Notes client app 維護** — 既有 outline 要動態修改
- **DXL 匯出 outline 結構** — 拿來做版本控制 / 跨 db 同步
- **多語 Notes app** — 程式化建 outline 比 Designer 設計 multilingual 容易

新 Domino app 走 XPages / REST API 通常不用 outline。寫 outline 程式碼前先確認**這支 app 真的會用到 outline**。

## What about Java and SSJS?

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesOutline` / `NotesOutlineEntry` |
| Java | `lotus.domino.Outline` / `lotus.domino.OutlineEntry` — method 名 camelCase (`getFirst`、`createEntry`、`setNamedElement`、`save`)；常數同名（`OutlineEntry.OUTLINE_TYPE_NOTELINK` 等）|
| SSJS（XPages） | 同 Java；XPages 應用通常用 ApplicationLayout custom control 取代 outline、實務少直接操作 |

跨語言一致 — Java 端記得 `outline.recycle()` / `entry.recycle()` 釋放 C++ memory。LS 自動 recycle。

## 結論

NotesOutline / NotesOutlineEntry 是 LS 程式化建構 Domino UI 導覽控件的工具。三個重點：

1. **`outline.Save` 必呼叫** — 跟其他 `Set*` 物件同性質的 silent bug
2. **沒有 SetView method** — 連 view 用 `SetNamedElement` + `OUTLINE_CLASS_VIEW`
3. **Outline 是 legacy** — 新 design 走 XPages / 現代 UI 評估、別預設要用 outline

但對既有 Notes client app 的動態 menu 維護、多語切換、條件式顯示等場景、outline 還是當下最直接的工具。
