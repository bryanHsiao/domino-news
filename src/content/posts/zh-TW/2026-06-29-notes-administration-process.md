---
title: "NotesAdministrationProcess：用 LotusScript 送出 AdminP 請求"
description: "改使用者名稱、乾淨地刪除一個使用者、重新認證、搬移郵件檔、改 Internet 密碼 —— 這些平常你會在 Administration 用戶端點來點去的 AdminP 工作，NotesAdministrationProcess 讓你用程式把同樣的請求送進 admin4.nsf。本文說明 session.CreateAdministrationProcess、各請求方法與它們回傳的 note ID、certifier 屬性，以及三個最常絆倒人的點：它需要 unrestricted 權限、它是非同步的、而 '*' 代表「不變更」。"
pubDate: 2026-06-29T07:30:00+08:00
lang: zh-TW
slug: notes-administration-process
tags:
  - "LotusScript"
  - "Admin"
  - "Tutorial"
sources:
  - title: "NotesAdministrationProcess class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESADMINISTRATIONPROCESS_CLASS.html"
  - title: "RenameNotesUser method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RENAMENOTESUSER_METHOD_ADMINP.html"
  - title: "DeleteUser method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DELETEUSER_METHOD_ADMINP.html"
relatedJava: ["AdministrationProcess"]
relatedSsjs: []
cover: "/covers/notes-administration-process.webp"
coverStyle: "risograph"
---

一個使用者結婚改了姓。在 Administration 用戶端你會打開 person document、選 Rename，然後讓 Administration Process（AdminP）在接下來幾個小時把這個變更擴散到每個資料庫的 ACL、Reader/Author 欄位、群組成員。現在想像你得從一份 HR 資料餵進來、對 200 個使用者做同一件事 —— 用點的不是辦法。

[`NotesAdministrationProcess`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESADMINISTRATIONPROCESS_CLASS.html) 就是通往 AdminP 的 LotusScript 入口。它本身不*執行*管理工作 —— 它把一筆請求送進 Administration Requests 資料庫（`admin4.nsf`），由 AdminP 伺服器工作之後接手執行。類別說明只有一句「代表 administration process」，但它給你的能力是：把那些你平常手動做的例行目錄與伺服器雜務寫成程式。

---

## 重點摘要

- 從 session 取得物件：`Set adminp = session.CreateAdministrationProcess(server$)` —— `server$` 是持有 `admin4.nsf` 的伺服器，**空字串代表本機**。
- 每個請求方法（`RenameNotesUser`、`DeleteUser`、`RecertifyUser`、`MoveMailUser`、`ChangeHTTPPassword`…）都是**送出一筆請求並回傳該請求文件的 note ID** —— 不是完成訊號。
- 它是**非同步**的：你的程式只負責入列，實際工作由 AdminP 伺服器工作稍後做。回傳的 note ID 只是你對那筆請求的把手。
- 它需要 **unrestricted agent / 伺服器權限** —— 一般使用者 agent 無法送這些請求。
- 在 `RenameNotesUser` 裡，名字的某一段傳 **`*` 代表「維持不變」**。
- 會發憑證的請求（例如 `RecertifyUser`）要先設好 certifier —— 用 `CertifierFile` + `CertifierPassword`，或透過 `UseCertificateAuthority` 走 CA。
- **Release 6 新增。**

## 取得物件

沒有建構子 —— 你向 session 要，並指名哪台伺服器的 `admin4.nsf` 要收這些請求：

```lotusscript
Dim session As New NotesSession
Dim adminp As NotesAdministrationProcess
' "" = 本伺服器的 admin4.nsf；傳伺服器名稱則指向遠端那台
Set adminp = session.CreateAdministrationProcess("")
```

## 送出請求

每個請求方法都會把一份文件寫進 `admin4.nsf`，並把它的 note ID 交回給你。最常用的幾個：

| 方法 | 送出什麼 |
|---|---|
| `RenameNotesUser` | 改一個 Notes 使用者名稱的請求 |
| `DeleteUser` | 刪除一個使用者的請求（含郵件檔與 ID vault 的處理）|
| `RecertifyUser` | 重新認證一個使用者的請求（需要 certifier）|
| `MoveMailUser` | 把使用者的郵件檔搬到新 home server 的請求 |
| `ChangeHTTPPassword` | 變更使用者 Internet（HTTP）密碼 |

官方文件對每個方法的描述都是同一個形狀 —— 例如 [`RenameNotesUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RENAMENOTESUSER_METHOD_ADMINP.html)「在 Administration Requests 資料庫中輸入一筆改使用者名稱的請求」。模式永遠是*現在入列、稍後執行*。

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim adminp As NotesAdministrationProcess
  Dim noteID As String
  Set adminp = session.CreateAdministrationProcess("")

  ' 改名：只改姓；"*" 讓其他部分維持原樣
  noteID = adminp.RenameNotesUser("CN=Jane Doe/O=Acme", "Smith", "*", "*", "*")
  Print "Rename request filed: " & noteID

  ' 變更使用者的 Internet（HTTP）密碼
  noteID = adminp.ChangeHTTPPassword("CN=Jane Doe/O=Acme", "oldPass!", "newPass!")
  Print "HTTP password request filed: " & noteID
End Sub
```

*（官方頁面沒有附這個類別的完整範例，所以上面這段是依驗證過的方法簽名組出來的 —— 每個呼叫與參數都有文件根據。）*

`RenameNotesUser` 的「`*` 代表不變更」慣例值得記牢：你永遠把整串名字段都傳進去，對不動的那幾段用 `*`。[`DeleteUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DELETEUSER_METHOD_ADMINP.html) 收一個郵件檔處理動作（`MAILFILE_DELETE_NONE` / `_HOME` / `_ALL`）和一個 ID vault 動作，讓你控制刪人時是否連郵件檔與 vault 裡的 ID 一起移除。

## Certifier 與 CA

會發或更新憑證的請求 —— 例如重新認證使用者 —— 需要先有一個 certifier 身分。兩條路：

```lotusscript
' 路線 1：磁碟上的 certifier ID 檔
adminp.CertifierFile = "c:\domino\data\cert.id"
adminp.CertifierPassword = "certPassword"
Call adminp.RecertifyUser("CN=Jane Doe/O=Acme")

' 路線 2：Certificate Authority 流程
adminp.UseCertificateAuthority = True
adminp.CertificateAuthorityOrg = "Acme"
Call adminp.RecertifyUser("CN=Jane Doe/O=Acme")
```

當請求由 CA 處理時，方法回傳的是**空字串**而不是 note ID —— 這筆請求走的是 CA 流程、不會落成一份普通的 admin request 文件，所以別把空字串的回傳當成失敗。

## 三個最常絆倒人的點

**1. 一定要 unrestricted 權限。** 每個方法都要 unrestricted agent / 伺服器存取。一個排程 agent 要送 admin 請求，就必須由具備該權限的 ID 簽署，否則呼叫會失敗。這是刻意設計的 —— 送出一筆改名或刪除本來就是特權操作。

**2. 它是非同步的 —— note ID 不等於「做完了」。** 方法在請求文件被寫出的那一刻就回傳。實際的改名／刪除／搬移要等 AdminP 伺服器工作下次執行、處理到那筆請求時才發生（而且很多請求會在數小時內串連出後續請求）。要確認完成，你看的是 `admin4.nsf` 裡那份請求文件的狀態，不是回傳值。

**3. `server$` 空字串代表本機。** 傳 `""` 把請求送進目前伺服器的 `admin4.nsf`；傳伺服器名稱則指向遠端那台。搞錯這個會把請求送進錯的佇列。

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| LotusScript | `NotesAdministrationProcess` | `session.CreateAdministrationProcess(server)` |
| Java | `lotus.domino.AdministrationProcess` | `session.createAdministrationProcess(server)` |
| SSJS / XPages | （透過 session 取同一個後端類別）| `session.createAdministrationProcess(server)` |

Java 後端 API 一個方法對一個方法地對應這個類別（`renameNotesUser`、`deleteUser`…）。SSJS 沒有獨立的包裝類別 —— XPages 程式是透過 session 取到同一個 Domino 後端物件，實務上就是 Java 那一套介面。無論哪種，原則都一樣：你是在*送請求給 AdminP 執行*，不是當場做管理。
