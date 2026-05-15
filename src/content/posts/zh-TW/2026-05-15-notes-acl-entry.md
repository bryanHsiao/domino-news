---
title: "NotesACLEntry 全攻略 — Domino 資料庫存取控制的程式化管理、7 個 access level、20 個 property、Roles 機制"
description: "NotesACLEntry 代表 Domino 資料庫 ACL 裡的單一條目（個人、群組或 server）。本文整理 NotesACL ↔ NotesACLEntry 容器關係、拿到 ACL 跟 entry 的三種途徑、7 個 access level 常數、UserType 跟 IsPerson/IsGroup/IsServer 三組旗標、20 個細粒度權限 property、Roles 自訂角色機制、acl.Save 的強制要求、五個踩雷點，跟完整 CRUD 範例。同時跟 14.5 NRPC encryption / trust store 系列文章連結，形成完整的 Domino security 圖譜。"
pubDate: 2026-05-15T07:30:00+08:00
lang: zh-TW
slug: notes-acl-entry
tags:
  - "Tutorial"
  - "LotusScript"
  - "Security"
sources:
  - title: "NotesACLEntry class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "NotesACL class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACL.CreateACLEntry method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEACLENTRY_METHOD.html"
  - title: "NotesACL.Save method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_NOTESACL.html"
relatedJava: ["ACL", "ACLEntry"]
relatedSsjs: ["ACL", "ACLEntry"]
---

## 重點摘要

Domino 資料庫的 ACL（Access Control List）是「**誰可以動這個 db、能做到什麼**」的核心安全機制。透過 LotusScript：

- [`NotesACL`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) — HCL 官方原話「Represents the access control list (ACL) of a database」。整個 list 的容器。
- [`NotesACLEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) — HCL 官方原話「Represents a single entry in an access control list. An entry may be for a person, a group, or a server」。每筆條目。

關鍵要點：

1. **永遠記得 `acl.Save`** — HCL 直白警告「If you don't call Save before closing a database, the changes you made to its ACL will be lost」
2. **7 個 access level 常數** — `ACLLEVEL_NOACCESS` (0) 到 `ACLLEVEL_MANAGER` (6)、由弱到強遞增
3. **NotesACLEntry 有 20 個 property** — 不只 access level，還有 7 個細粒度權限旗標（`CanCreateDocuments`、`CanDeleteDocuments` 等）
4. **不要混用** `db.QueryAccess/GrantAccess/RevokeAccess` 跟 `NotesACL` 物件 — HCL 警告「may produce inconsistent results」

## NotesACL vs NotesACLEntry — 容器 / 條目關係

依官方類別定義，這兩個 class 的關係是 **containment**：

- [`NotesACL`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) — "Contains: NotesACLEntry"
- [`NotesACLEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) — "Contained by: NotesACL"

換句話說：你先拿到一個 ACL 物件、再從 ACL 裡走訪 / 新增 / 修改 / 刪除 entries。

## 拿到 ACL / 拿到 entry

### 拿到 NotesACL

HCL 文件：「Every NotesDatabase contains a NotesACL object representing that database access control list. To get it, use the ACL property in NotesDatabase」

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

### 拿到 NotesACLEntry

「NotesACL provides three ways to access an existing NotesACLEntry」：

| 途徑 | 用途 |
|---|---|
| `acl.GetEntry(name)` | 已知名字、直接拿 |
| `acl.GetFirstEntry()` | 走訪 ACL 用、拿第一筆 |
| `acl.GetNextEntry(entry)` | 走訪 ACL 用、接著拿下一筆 |
| [`acl.CreateACLEntry(name, level)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEACLENTRY_METHOD.html) | **建立**新 entry（不是「拿」） |

## 7 個 access level

[`CreateACLEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEACLENTRY_METHOD.html) 的 `level%` 參數接受這 7 個常數（由弱到強）：

| 常數 | 值 | 直觀理解 |
|---|---|---|
| `ACLLEVEL_NOACCESS` | 0 | 無權限 — 連 db 都不能打開 |
| `ACLLEVEL_DEPOSITOR` | 1 | 只能丟（寫入但看不到）— 例如匿名建議箱 |
| `ACLLEVEL_READER` | 2 | 只能讀 |
| `ACLLEVEL_AUTHOR` | 3 | 能讀、能寫**自己的** doc（要有 Author item） |
| `ACLLEVEL_EDITOR` | 4 | 能讀、能改任何 doc |
| `ACLLEVEL_DESIGNER` | 5 | Editor + 改 db 設計（form / view） |
| `ACLLEVEL_MANAGER` | 6 | 全權 — 改 ACL、刪 db |

實務最常用 4-5 個：Reader / Author / Editor 給 user，Designer / Manager 給開發 / 管理員。Depositor 給匿名提交場景。NoAccess 給「明確封鎖」場景。

## UserType vs IsPerson / IsGroup / IsServer

`NotesACLEntry` 有兩套標示「這條目是什麼類型」的機制：

- **`UserType` property** — 官方原話「Read-write. Indicates the type of user for a particular entry」。比較新、表達力強。
- **`IsPerson` / `IsGroup` / `IsServer`** — 三個 boolean、各自獨立、舊式的便利 flag

兩套**會自動同步** — 你設 `IsPerson = True` 之後 `UserType` 就會反映 person。但若 entry 是 mixed group（同時有 person 跟 server）這種 case，便利 flag 就不夠表達，要看 `UserType`。

實務上：

- 寫新 code 偏好用 `UserType`
- 讀既有 code 看到 `If entry.IsPerson Then ...` 也合理
- 處理 group 進階情境時必看 `UserType`

## 20 個細粒度權限 property

`NotesACLEntry` 不只有 access level、還有 20 個 property 控制更細的權限：

| Property | 描述（verbatim from HCL） |
|---|---|
| `Level` | ACL access level（即上面 7 個常數）|
| `Name` | Entry 的 name (Person/Group/Server 的名字) |
| `NameObject` | 進階 `NotesName` 物件（拆出 CN / OU / O 等） |
| `Parent` | 回到 NotesACL |
| `Roles` | "The roles that are enabled for an entry" |
| `UserType` | "Indicates the type of user for a particular entry" |
| `IsPerson` | 是否為 person |
| `IsGroup` | 是否為 group |
| `IsServer` | 是否為 server |
| `IsAdminReaderAuthor` | 是否為 admin reader / author |
| `IsAdminServer` | 是否為 administration server |
| `IsPublicReader` | "Can read public documents" |
| `IsPublicWriter` | "Can write public documents" |
| `CanCreateDocuments` | "For an entry with Author access to a database, indicates whether the entry is allowed to create new documents" |
| `CanDeleteDocuments` | "For an entry with Author access or higher to a database, indicates whether an entry can delete documents" |
| `CanCreatePersonalAgent` | "Indicates whether an entry can create private agents in a database" |
| `CanCreatePersonalFolder` | "Indicates whether an entry can create personal folders in a database" |
| `CanCreateSharedFolder` | "For an entry with Editor access to the database, indicates whether the entry can create shared folders" |
| `CanCreateLSOrJavaAgent` | "For an entry with Reader access, indicates whether the entry is allowed to create LotusScript or Java agents" |
| `CanReplicateOrCopyDocuments` | "For an entry with Reader access or higher to a database, indicates whether an entry can replicate or copy documents" |

注意這幾個有「**access level 前提**」的：例如 `CanCreateDocuments` 只對 Author 級以上的 entry 有意義、對 NoAccess 設了也沒用。

## Roles — 自訂角色機制

ACL 除了 access level，還支援**自訂 Roles**（用 `[Manager]`、`[Approver]` 之類在中括號裡的角色名）。Form / view / agent / Reader 欄位可以用這些 role 名做更細的存取控制。

- `acl.Roles` — 「All the roles defined in an access control list」 — 整個 db ACL 定義了哪些 role
- `entry.Roles` — 「The roles that are enabled for an entry」 — 該 entry 啟用了哪些 role
- `entry.EnableRole(name)` — 「Given the name of a role, enables the role for an entry」
- `entry.DisableRole(name)` — 「Given a role, disables the role for an entry」
- `entry.IsRoleEnabled(name)` — 「Given a role, indicates whether the role is enabled for an entry」

實務模式：define 一個 `[Approver]` role、在 form 的 Reader field 上用 `@UserRoles` 檢查 — 只有被 enable 該 role 的 user 看得到 / 改得到。

## 完整 CRUD 範例

### 1. 走訪所有 entry

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry

    Set db = session.CurrentDatabase
    Set acl = db.ACL

    Set entry = acl.GetFirstEntry()
    Do Until entry Is Nothing
        Print entry.Name & " — Level: " & entry.Level _
            & " — Roles: " & Join(entry.Roles, ", ")
        Set entry = acl.GetNextEntry(entry)
    Loop
End Sub
```

### 2. 新增 entry

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("Bryan Inc./ACME", ACLLEVEL_EDITOR)
entry.IsPerson = False
entry.IsGroup = True              ' 標記為 group
entry.CanCreateDocuments = True
entry.CanDeleteDocuments = False  ' Editor 預設可刪、明確關掉

Call entry.EnableRole("Approver") ' 啟用 [Approver] role

Call acl.Save                     ' ❗ 必呼叫
```

### 3. 修改 entry

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("Bryan Inc./ACME")

If entry Is Nothing Then
    Print "Entry not found"
    Exit Sub
End If

entry.Level = ACLLEVEL_DESIGNER  ' 升到 Designer
Call entry.DisableRole("Approver")

Call acl.Save
```

### 4. 刪除 entry

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("Bryan Inc./ACME")

If Not entry Is Nothing Then
    Call entry.Remove()    ' 直接從 entry 物件 remove
    Call acl.Save
End If
```

注意 `Remove` 是 NotesACLEntry 上的 method、不是 NotesACL 上的 — 你要先拿到 entry 才能 remove。

## 五個踩雷點

### 1. 忘 [`acl.Save`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_NOTESACL.html) — 所有改動消失、沒任何錯誤

HCL 文件直白警告：「If you don't call Save before closing a database, the changes you made to its ACL will be lost」

agent 改了 ACL 但沒 `Call acl.Save`、agent 結束、所有改動**在記憶體裡**、db 關閉時就丟了。**最常見的 silent bug**。code review 永遠 grep：每次動 ACL 後是不是有 `.Save`。

### 2. `GetEntry` 找不到時回 `Nothing`、不是 raise error

```lotusscript
Set entry = acl.GetEntry("Someone Not In ACL")
entry.Level = ACLLEVEL_EDITOR     ' ❌ Object variable not set
```

正解：

```lotusscript
If entry Is Nothing Then
    Print "Entry not found"
    Exit Sub
End If
```

### 3. 不要混用 `db.QueryAccess` / `GrantAccess` / `RevokeAccess` 跟 NotesACL 物件

HCL 警告：「The Database class has three methods that you can use to access and modify an ACL without getting an ACL object: QueryAccess, GrantAccess, and RevokeAccess. However, using these methods at the same time that an ACL object is in use may produce inconsistent results」

實務原則：寫一支 agent 就**選一條路** — 走 NotesACL 物件、或走 NotesDatabase 的便利 method、不要兩種混用。

### 4. 想改 ACL、自己的 ACL 等級要夠

修改 ACL 本身**需要 Manager 等級**。如果 agent signer 自己只是 Editor、就算寫了 `acl.Save` 也會 fail（但 LS 可能不會明顯噴錯、看起來像 silent failure）。

- Server 上跑：signer 在那個 db 的 ACL 等級要是 Manager
- Client 跑：當前 user 要是 Manager

### 5. Effective access vs entry-level access — group 重疊

一個 user 可能同時在多個 ACL entry 裡（例如自己是 Editor、又是 `[ALL_USERS]` group 的 member 該 group 是 Reader）。**effective access 不是「最低」也不是「平均」、是「最高」** —— 任一條對 user 適用的 entry 中等級最高那個生效。

寫 audit 想知道某 user 真正能做什麼用 `db.QueryAccess(name)`、回的就是 effective level、不是某條 entry 的 level。

## 跟 14.5 安全 mini-series 的關係

這篇 NotesACLEntry 講的是 **db-level ACL**（誰能存取這個 nsf、能做什麼）。前幾天的 14.5 安全系列從不同角度切：

| 文章 | 範圍 |
|---|---|
| [5/10 NotesHTTPRequest trust store](/domino-news/posts/notes-httprequest-14-5-trust-store) | LS 對外打 HTTPS 的 TLS 信任 store |
| [5/11 Mandated Port Encryption 概念](/domino-news/posts/mandated-port-encryption) | NRPC（server↔server / client↔server）通訊加密強制 |
| [5/12 Mandated Port Encryption 實務](/domino-news/posts/mandated-port-encryption-enabling) | 同上、啟用步驟 |
| **5/15（本篇）NotesACLEntry** | **db 層 ACL** — 連到 db 後、能對 db / doc 做什麼 |

完整 Domino security 圖譜：**傳輸加密**（5/11/12）+ **對外信任**（5/10）+ **db 層權限**（本篇）。三層缺一不可。

## What about Java and SSJS?

| 語言 | 對應 class |
|---|---|
| LotusScript | `NotesACL` / `NotesACLEntry` |
| Java | `lotus.domino.ACL` / `lotus.domino.ACLEntry` — method camelCase (`getEntry`、`createACLEntry`、`save`、`enableRole`) |
| SSJS（XPages） | 同 Java、`database.getACL()` 拿到 |

跨語言一致 — Java 端記得 `acl.recycle()` / `entry.recycle()` 釋放 C++ memory。LS 自動 recycle。

## 結論

Domino 開發者大部分時間在跟 doc 跟 view 打交道、ACL 通常設一次就忘了。但要做**動態權限調整**（按組織架構自動分 group、按 workflow 階段切 role）—— 就一定會碰到 NotesACL / NotesACLEntry。

三個最容易踩的：

1. **忘 `acl.Save`** — agent 跑了、ACL 沒動、找半天
2. **`GetEntry` 找不到回 Nothing** — 永遠先 `Is Nothing` 檢查
3. **不要混用 db method + ACL object** — 一支 agent 一條路

加上「想改 ACL 自己要是 Manager」這個前置條件 — 就有了實務寫 ACL 自動化的基本盤。
