---
title: "LotusScript 的文件鎖定：Lock、LockProvisional，與每個人都忘記的前置條件"
description: "Domino 能鎖定一份文件、讓兩個使用者不會同時編輯它 — NotesDocument 上的 Lock、LockProvisional、UnLock、LockHolders。但這些方法會拋錯，除非資料庫啟用了鎖定（IsDocumentLockingEnabled）而且設好了 master lock server；persistent 與 provisional 鎖取決於那台伺服器是否可達；而鎖在 web 應用裡根本不能用。本文說明 API 與每個前置條件。"
pubDate: 2026-07-16T07:30:00+08:00
lang: zh-TW
slug: notes-document-locking
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocument.Lock method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCK_METHOD_DOC.html"
  - title: "NotesDatabase.IsDocumentLockingEnabled property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISDOCUMENTLOCKINGENABLED_PROPERTY_DB.html"
  - title: "Locking documents and design elements — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCKING_DOCUMENTS_AND_DESIGN_ELEMENTS.html"
relatedJava: ["Document", "Database"]
relatedSsjs: ["document", "database"]
---

兩個使用者打開同一份文件、都編輯、都存檔 — 現在你有一個 replication 或存檔衝突，某個人的工作不見了。Domino 的答案是文件鎖定：認領一份文件、編輯它、釋放它，而在你持有鎖的期間沒有別人能覆蓋你的存檔。API 是 `NotesDocument` 上的四個成員加上 `NotesDatabase` 上的一個開關。陷阱是：這一切都會拋錯，除非幾個前置條件到位 — 而那些前置條件正是大家會忘記的。

---

## 重點摘要

- **先在資料庫啟用鎖定。** [`db.IsDocumentLockingEnabled`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISDOCUMENTLOCKINGENABLED_PROPERTY_DB.html) 必須是 `True`，否則每個鎖定方法都會拋錯。資料庫還需要一台由管理員設定的 **administration（master lock）server**。
- [`flag = doc.Lock([name][, provisionalOK])`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCK_METHOD_DOC.html) 放置一個鎖。拿到（或已持有）回傳 `True`；別人持有回傳 `False`。
- **Persistent vs provisional：** persistent 鎖登記在 master lock server 上；provisional 鎖是那台伺服器不可達時用的本地盡力鎖。`Lock(name, True)` 在伺服器掛掉時降級為 provisional；`Lock(name, False)` 則改為拋錯；`LockProvisional` 永遠是 provisional。
- `doc.UnLock` 釋放它 — 但「若目前使用者不是鎖持有者之一、且沒有 lock breaking 權限，會拋錯」。
- `doc.LockHolders` 是一個唯讀字串陣列、裝著誰持有鎖；**未鎖定時它是一個單元素、內容為空字串的陣列**（`("")`），所以判斷 `holders(0) = ""`。
- **鎖在 web 應用裡不支援** — 這是 Notes 用戶端／agent 的功能。

## 前置條件

在任何鎖定方法能運作之前，兩件事必須成立：

1. **資料庫啟用了鎖定。** `IsDocumentLockingEnabled` 是一個可讀寫 Boolean；「True 代表文件鎖定已啟用」。每個 `Lock` / `LockProvisional` / `UnLock` / `LockHolders` 呼叫在它為 `False` 時都「拋錯」。你可以用程式設定（`db.IsDocumentLockingEnabled = True`），但那是對資料庫的 manager 層級設計變更。
2. **存在一台 master lock server。** 依 [概覽頁](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCKING_DOCUMENTS_AND_DESIGN_ELEMENTS.html)，「資料庫必須有一台 administration（master lock）server」。那是管理員設定 — LotusScript API 放置與讀取鎖，但不指定那台伺服器。

漏了其中之一，你的第一個 `Lock` 呼叫會用拋錯、而不是回傳 `False`。

## Persistent 與 provisional 鎖

這個區別完全取決於 master lock server 是否可達：

- **persistent 鎖**「在 administration server 可用時」放置、並登記在那裡，所以它有權威性、跨 replica 可見。
- **provisional 鎖**「在 administration server 不可用時」放置 — 一個本地、盡力而為的認領，不像 persistent 那樣被持久化。

`Lock` 可選的第二個參數控制伺服器掛掉時發生什麼：`Lock(name, True)` 說「如果放不了 persistent 鎖，provisional 鎖可接受」，所以它會優雅降級；`Lock(name, False)`（預設）則改為拋錯、而非退而求 provisional。`LockProvisional(name)` 直接跳到 provisional 鎖。「有鎖總比沒鎖好」時用 `Lock(..., True)`；只有權威鎖才行時用嚴格形式。

## Lock、UnLock、與查持有者

```lotusscript
%INCLUDE "lsxbeerr.lss"

Sub Click(Source As Button)
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase

  If Not db.IsDocumentLockingEnabled Then
    Print "Document locking not enabled"
    Exit Sub
  End If

  Dim dc As NotesDocumentCollection
  Dim doc As NotesDocument
  Set dc = db.UnprocessedDocuments
  Set doc = dc.GetFirstDocument

  On Error GoTo errh
  ' 為 "Guys" 放 persistent 鎖；伺服器掛掉則退回 provisional
  If doc.Lock("Guys", True) Then
    doc.Subject = "Edited under lock"
    Call doc.Save(True, False)     ' 在整個 read-edit-save 期間持有鎖
    Call doc.UnLock                ' 做完釋放
    Print "Locked, edited, unlocked"
  Else
    Print "Document is locked by someone else"
  End If
  Exit Sub
errh:
  If Err() = lsERR_NOTES_LOCKED Then
    Print "Document NOT locked"
  Else
    MessageBox "Error " & Err() & ": " & Error(),, "Error"
  End If
End Sub
```

這個骨架（`IsDocumentLockingEnabled` 把關、`lsERR_NOTES_LOCKED` 攔截、`UnprocessedDocuments` 選取）是官方範例的寫法；編輯與解鎖步驟是改寫。兩個要注意的行為：`Lock` 在文件*已經*被另一個使用者鎖住時回傳 `False`，但如果別人在你的鎖放上去之前改過它，則*拋出*錯誤（`lsERR_NOTES_LOCKED`，由 `%INCLUDE "lsxbeerr.lss"` 帶入）— 所以兩者都要處理。而鎖不會自動存檔：你在整個 read-edit-`Save` 期間持有它、然後 `UnLock`。

要看誰持有鎖，讀 `LockHolders` — 但記住那個空狀態慣用法：

```lotusscript
Dim holders As Variant
holders = doc.LockHolders
If holders(0) = "" Then
  Print "Not locked"
Else
  Forall h In holders
    Print "Held by: " & h
  End Forall
End If
```

`UnLock` 有它自己的把關：它「若目前使用者不是鎖持有者之一、且沒有 lock breaking 權限，會拋錯」。一個 manager（或有 lock-breaking 權的人）可以破壞別人的鎖；一般使用者只能釋放自己的。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.Lock` / `LockProvisional` / `UnLock` | `doc.lock(...)` / `lockProvisional(...)` / `unlock()` | `document.lock(...)` / … |
| `doc.LockHolders` | `doc.getLockHolders()` | `document.getLockHolders()` |
| `db.IsDocumentLockingEnabled` | `db.isDocumentLockingEnabled()` / `setDocumentLockingEnabled()` | `database.isDocumentLockingEnabled()` |

Java 與 SSJS 對應同一組成員（Java 對資料庫旗標用明確的 getter/setter）。每個前置條件都沿用：鎖定必須啟用、persistent 鎖需要 master lock server、而整套機制不管從哪個語言呼叫都對 web 應用不可用。
