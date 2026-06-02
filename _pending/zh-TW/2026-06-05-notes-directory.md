---
title: "NotesDirectory + NotesDirectoryNavigator：LotusScript 查詢 Domino 目錄"
description: "Domino 目錄（Domino Directory）是整個 Notes 環境的使用者資料庫 — 人員、群組、伺服器都在裡面。LotusScript 的 NotesDirectory 提供高層次的查詢 API（不需要自己開 names.nsf 走 view）。本文拆解取得方式（session.GetDirectory）、LookupNames 依名稱查詢指定欄位、LookupAllNames 掃全部、GetMailInfo 取郵件伺服器資訊、CreateNavigator 建立 NotesDirectoryNavigator 走訪快取結果、以及 SearchAllDirectories / LimitMatches 兩個影響效能跟結果數量的屬性。"
pubDate: 2026-06-05T07:30:00+08:00
lang: zh-TW
slug: notes-directory
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDirectory class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS.html"
  - title: "NotesDirectoryNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS.html"
  - title: "GetDirectory method (NotesSession) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDIRECTORY_METHOD.html"
relatedJava: ["Directory", "DirectoryNavigator"]
relatedSsjs: []
---

你的 agent 需要查使用者的郵件伺服器、確認某個群組的成員清單、或驗證一個 Notes 名稱是不是存在。最直接的做法是 `db.GetView("($Users)")` 然後逐行找 — 但這樣要自己開 names.nsf、管 view 快取、處理多個目錄來源。

LotusScript 從 Notes 7 起有 [`NotesDirectory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS.html) — 一個高層次的目錄查詢 API、Domino server 背後可能有多個目錄（primary + extended / LDAP）、這個 class 統一處理、不用你知道底層結構。

---

## 重點摘要

- `NotesDirectory` 是「查 Domino 目錄」的高層 API、不需自己開 names.nsf
- **取得方式**：[`session.GetDirectory(serverName)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDIRECTORY_METHOD.html)、`serverName` 是空字串 `""` 表示本地
- **`LookupNames(view, names, items)`** — 指定 view 名稱、查一批名稱的指定欄位、快取進物件
- **`LookupAllNames`** — 掃整個 view 的所有名稱
- **[`GetMailInfo(name)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETMAILINFO_METHOD.html)** — 快速取一個使用者的郵件伺服器跟郵件路徑、不需手動 lookup
- **查詢結果用 `NotesDirectoryNavigator` 走訪** — `FindFirstName` / `FindNextName` / `GetFirstItemValue`
- `LimitMatches = True` 限制單次最多 50 筆（效能保護）、`SearchAllDirectories = True` 搜所有已配置的目錄

---

## 取得 NotesDirectory 物件

```lotusscript
Dim session As New NotesSession

' 查本 server 的目錄
Dim dir As NotesDirectory
Set dir = session.GetDirectory("")

' 查指定 server 的目錄
Set dir = session.GetDirectory("MailServer/ACME")

Print "目錄 server：" & dir.Server
```

---

## LookupNames — 查指定名稱的欄位值

```lotusscript
' 查 jsmith 和 alice 兩個人的 FullName + MailServer + MailFile
Dim names(1) As String
names(0) = "John Smith"
names(1) = "Alice Chen"

Dim items(2) As String
items(0) = "FullName"
items(1) = "MailServer"
items(2) = "MailFile"

' LookupNames(view, names, items) — 快取結果到 dir 物件
Call dir.LookupNames("($Users)", names, items)

' 建 navigator 走訪結果
Dim nav As NotesDirectoryNavigator
Set nav = dir.CreateNavigator()

If nav.FindFirstName() Then
    Do
        Print "姓名：" & nav.GetFirstItemValue()
        If nav.FindFirstItem("MailServer") Then
            Print "郵件伺服器：" & nav.GetFirstItemValue()
        End If
        If nav.FindFirstItem("MailFile") Then
            Print "郵件路徑：" & nav.GetFirstItemValue()
        End If
    Loop While nav.FindNextName()
End If
```

---

## GetMailInfo — 快速取郵件資訊

不需要手動 `LookupNames`、直接用 `GetMailInfo` 取一個使用者的郵件設定：

```lotusscript
Dim mailInfo As Variant
mailInfo = dir.GetMailInfo("John Smith")

' mailInfo(0) = MailServer（含 Notes 路徑，如 MailServer/ACME）
' mailInfo(1) = MailFile（如 mail/jsmith.nsf）
' mailInfo(2) = MailDomain
' mailInfo(3) = MailSystem（常數：MAIL_NOTES_TYPE = 1）

If Not IsNull(mailInfo) Then
    Print "郵件伺服器：" & mailInfo(0)
    Print "郵件路徑：" & mailInfo(1)
End If
```

實務上這是最常用的 API — 要自動轉寄、找使用者信箱、或開 mail.nsf 時、用 `GetMailInfo` 不用自己 lookup。

---

## LookupAllNames — 掃整個 view

```lotusscript
Dim items(0) As String
items(0) = "FullName"

' 掃 $Users view 的所有人
Call dir.LookupAllNames("($Users)", items)

Dim nav As NotesDirectoryNavigator
Set nav = dir.CreateNavigator()

Dim count As Integer
count = 0
If nav.FindFirstName() Then
    Do
        count = count + 1
        Set nav = Nothing ' 不用 nav 也可以只數數
    Loop While nav.FindNextName()
End If
Print "目錄共 " & count & " 個使用者"
```

注意：`LimitMatches = True` 時只回傳前 50 筆、要掃全部要先設 `dir.LimitMatches = False`。

---

## NotesDirectoryNavigator 走訪

[`NotesDirectoryNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS.html) 是走訪 `LookupNames` 快取結果的游標：

| 方法 | 說明 |
|---|---|
| `FindFirstName()` | 移到第一個名稱（重置位置）|
| `FindNextName()` | 移到下一個名稱 |
| `FindFirstItem(itemName)` | 在目前名稱下移到指定欄位 |
| `FindNextItem()` | 移到同欄位的下一個值（多值欄位用）|
| `GetFirstItemValue()` | 取目前欄位的第一個值 |
| `GetNextItemValue()` | 取同欄位的下一個值 |

---

## 兩個關鍵屬性

```lotusscript
' 搜尋所有已配置的目錄（primary + extended + LDAP）
dir.SearchAllDirectories = True

' 限制每次 LookupNames 最多 50 筆（預設 True）
' 全掃時要改 False、但注意效能
dir.LimitMatches = False
```

`SearchAllDirectories = False`（預設）只搜主要 Domino Directory、速度較快。`True` 會納入所有已設定的輔助目錄（更多屬性說明見[官方 NotesDirectory class 文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS.html)）。

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesDirectory` / `NotesDirectoryNavigator` |
| Java | `lotus.domino.Directory` / `DirectoryNavigator`（去掉 Notes 前綴、用完要 `.recycle()`）|
| SSJS | 沒有直接對應 — 目錄查詢在 XPages 通常透過 Domino REST API 完成 |
