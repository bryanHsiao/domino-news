---
title: "NotesRegistration：用 LotusScript 自動化使用者註冊"
description: "Domino 管理員每天都會收到新人報到、離職、留停的通知 — 一筆一筆在 Admin Client 點滑鼠很快就成為時間殺手。NotesRegistration 是 LotusScript 內建解法、把使用者註冊 / 認證 / ID 檔管理整套搬進可程式化的世界。本文從人事系統觸發的實務場景切入、拆解 RegisterNewUser 的 14 個參數、必要的屬性 setup、跟伺服器權限的關係、跟批次處理的範例。"
pubDate: 2026-05-30T07:30:00+08:00
lang: zh-TW
slug: notesregistration-lotusscript
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRegistration class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html"
  - title: "RegisterNewUser method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD.html"
  - title: "Is it possible to write an agent in Lotus Domino to automate a user registration? — HCL Domino Wiki"
    url: "https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/Is_it_possible_to_write_an_agent_in_Lotus_Domino%C2%AE_to_automate_a_user_registration"
relatedJava: ["Registration"]
relatedSsjs: []
cover: "/covers/notesregistration-lotusscript.webp"
coverStyle: "collage"
---

公司的人事系統收到新人報到單、留停通知、離職單 — 流程的尾端常常會回到 Domino 管理員手上：建一個 Notes 使用者、給一個郵件信箱、加進對應的群組、過陣子可能還要把同一個人改名 / 換部門 / 鎖帳號 / 移除。一筆一筆打開 Admin Client 點滑鼠、十筆還好、上百筆就崩潰。

LotusScript 內建的 `NotesRegistration` 就是為這種場景設計的 — 把使用者註冊、認證、ID 檔管理整套搬進可程式化的流程。配合一支 agent、可以讓人事系統 / 請假系統的進件直接觸發 Domino 帳號異動、管理員只負責設計規則跟看 log。

本文聚焦最常用的 `RegisterNewUser` 方法、拆解 14 個參數、必要的屬性 setup、伺服器權限的前提、跟一個從 CSV 批次建使用者的完整範例。

---

## 重點摘要

- [`NotesRegistration`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html) 從 Release 4.6 就在、用來建立 / 管理 Notes ID 檔、是管理員自動化的基礎 class
- **兩步驟模式**：先設**屬性**（憑證者路徑、註冊伺服器、郵件範本等）、再呼叫**方法**（[`RegisterNewUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD.html) / `RegisterNewServer` / `Recertify` 等）
- 共 **32 個屬性 + 10+ 個方法**、涵蓋 ID 建立、加進目錄、漫遊使用者、郵件配額、認證者管理
- **必須有憑證者 ID 檔（`cert.id`）** + 對應密碼、否則無法簽出新 ID
- **多數方法需要連到 Domino 伺服器**、agent 要有管理員權限執行
- 跟 ID Vault 並用時、新建的 ID 會依政策自動匯入 vault、不必額外處理
- 跨語言：Java 對應 `lotus.domino.Registration`、SSJS 沒有對應（純伺服器端管理操作、不適合在 XPages 跑）

---

## 為什麼這個 class 還值得學

Domino 14.x 之後已經有更多更現代的方案 — ID Vault 集中保管使用者 ID、IdP 整合走 SAML / OIDC、Person doc 可以靠 directory sync 工具同步。但對多數仍在跑 Domino 的組織來說：

- **舊 NSF + 舊流程還在用** — 重做整套認證體系成本太高、能用 LotusScript 補一層自動化最務實
- **人事系統不會直接懂 Domino** — 兩邊 schema 對不上、需要一層 adapter agent 把人事的進件翻譯成 Domino 操作、`NotesRegistration` 就是 adapter 寫 code 的核心 API
- **批次場景不可能手點** — 一次併購、一次組織重整、一次大規模到期憑證更換、沒有自動化就是地獄

所以這個 class **不是過時**、而是「中型 Domino 環境的剛性需求」。HCL Domino Wiki 的一篇舊問答 — [Is it possible to write an agent in Lotus Domino to automate a user registration?](https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/Is_it_possible_to_write_an_agent_in_Lotus_Domino%C2%AE_to_automate_a_user_registration) — 直接示範了用 agent 包這個 class 自動化的最小例子、放著至今十多年仍是常被引用的入門範本。

---

## 兩步驟模式：屬性先設、方法再叫

`NotesRegistration` 的設計跟一般 class 不太一樣 — 屬性不是讀資料用、是**控制方法行為的設定值**。官方文件明確說：「The properties are intended to be set before calling the methods.」

意思是這個 class 像個「會帶身世背景的工具人」：

```lotusscript
Dim reg As New NotesRegistration

' 第一步：先把這個 reg 物件「裝備」起來
reg.CertifierIDFile = "C:\Domino\Data\cert.id"
reg.RegistrationServer = "MailServer/ACME"
reg.CreateMailDb = True
reg.MailTemplateName = "StdR14Mail"
' ... 還有 28 個屬性可設

' 第二步：呼叫方法、用上面的設定執行操作
Call reg.RegisterNewUser("陳", _
        "C:\Domino\Data\ids\chen.id", _
        "MailServer/ACME", _
        "小明", "", "certpwd", _
        "", "", "mail\chen.nsf", _
        "", "userpwd")
```

屬性設一次、可以反覆呼叫方法建多個使用者 — 這是批次建立的關鍵：屬性設定 cost 攤分掉、迴圈內只跑變動的部分。

---

## 必要屬性 — 最少設這些

32 個屬性裡、大部分是**選用**（有合理 default 或對應特定情境）。實際建一個基本使用者、最少要設這幾個：

| 屬性 | 型別 | 意義 |
|---|---|---|
| `CertifierIDFile` | String | 憑證者 ID 檔的完整路徑、通常是 `cert.id`、必須能讀 |
| `CertifierName` | String | 憑證者名稱、譬如 `/ACME` |
| `RegistrationServer` | String | 執行註冊的伺服器、通常是郵件主機 |
| `CreateMailDb` | Boolean | 是否同時幫使用者建郵件信箱（多數情境要設 `True`）|
| `MailServer` | String | 郵件信箱要放在哪台伺服器 |
| `MailTemplateName` | String | 郵件範本名稱、譬如 `StdR14Mail` |
| `StoreIDInAddressBook` | Boolean | 是否把 ID 檔附在 Person 文件裡（給 ID Vault 用就要 `True`）|

進階情境額外設：

- `IsRoamingUser` / `RoamingServer` / `RoamingSubdir`：漫遊使用者設定
- `MailQuotaSizeLimit` / `MailQuotaWarningThreshold`：信箱容量
- `PolicyName`：套用管理員政策
- `MailInternetAddress`：對外的 SMTP 位址（譬如 `chen@acme.com`）
- `Expiration`：ID 檔到期日

---

## `RegisterNewUser` 完整呼叫格式

14 個參數、前 3 個必填、後 11 個選用：

```lotusscript
variant = notesRegistration.RegisterNewUser( _
    lastname$, _              ' 必填：姓
    idfile$, _                ' 必填：要存到本機哪個路徑
    mailserver$, _            ' 必填：信箱伺服器
    [firstname$], _           ' 選用：名
    [middle$], _              ' 選用：中間名 / 英文 middle initial
    [certpw$], _              ' 選用：憑證者密碼
    [location$], _            ' 選用：Person 文件的 Location 欄
    [comment$], _             ' 選用：Person 文件的 Comment 欄
    [maildbpath$], _          ' 選用：信箱路徑（譬如 mail\chen.nsf）
    [fwddomain$], _           ' 選用：轉寄網域
    [userpw$], _              ' 選用：使用者 ID 檔的密碼
    [usertype%], _            ' 選用：用戶端類型常數
    [altname], _              ' 選用：替代名稱（R5.0.2+）
    [altnamelang] _           ' 選用：替代名稱的語言（R5.0.2+）
)
```

幾個常踩坑的點：

- `idfile$` 是 ID 檔要**存到本機**哪裡 — 不是讀檔、是寫檔。路徑要寫得到
- `maildbpath$` 是**相對於郵件目錄**的路徑、不是絕對路徑、譬如 `mail\chen.nsf` 不是 `C:\Domino\Data\mail\chen.nsf`
- `certpw$` 是**憑證者**的密碼、不是新使用者的密碼。後者是 `userpw$`、容易搞混
- `usertype%` 用內建常數 `NOTES_DESKTOP_CLIENT` / `NOTES_FULL_CLIENT` / `NOTES_LIMITED_CLIENT` 之一

回傳值是 Variant — 通常忽略、有錯會直接 throw exception。

---

## 實戰範例：人事系統 CSV 批次建立

從一份 CSV 讀進員工資料、迴圈呼叫 `RegisterNewUser`、出錯時記到 log 不中斷整批：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim reg As New NotesRegistration

    ' === 共用屬性、設一次 ===
    reg.CertifierIDFile = "C:\Domino\Data\cert.id"
    reg.CertifierName = "/ACME"
    reg.RegistrationServer = "MailServer/ACME"
    reg.CreateMailDb = True
    reg.MailServer = "MailServer/ACME"
    reg.MailTemplateName = "StdR14Mail"
    reg.StoreIDInAddressBook = True   ' ID Vault 需要
    reg.UpdateAddressBook = True

    ' === 開啟 CSV ===
    Dim fnum As Integer
    fnum = FreeFile
    Open "C:\Onboarding\new-hires.csv" For Input As #fnum

    Dim line As String
    Dim parts() As String
    Dim okCount As Integer
    Dim errCount As Integer

    ' === 略過標頭 ===
    Line Input #fnum, line

    Do Until EOF(fnum)
        Line Input #fnum, line
        parts = Split(line, ",")
        ' parts(0)=姓 parts(1)=名 parts(2)=員工編號 parts(3)=部門

        On Error Resume Next
        Call reg.RegisterNewUser( _
            parts(0), _
            "C:\Domino\Data\ids\" & parts(2) & ".id", _
            "MailServer/ACME", _
            parts(1), _
            "", _
            "certpwd-do-not-hardcode", _
            "", _                          ' Location
            "員工編號 " & parts(2), _      ' Comment
            "mail\" & parts(2) & ".nsf", _ ' 信箱路徑
            "", _
            "TempPass-" & parts(2), _      ' 初次密碼、強制首次登入更改
            NOTES_DESKTOP_CLIENT)

        If Err <> 0 Then
            Print "[ERR] " & parts(2) & " " & parts(0) & parts(1) & ": " & Error()
            errCount = errCount + 1
            Err = 0
        Else
            Print "[OK] " & parts(2) & " " & parts(0) & parts(1) & " 已註冊"
            okCount = okCount + 1
        End If
        On Error Goto 0
    Loop

    Close #fnum
    Print "完成：成功 " & okCount & " 筆、失敗 " & errCount & " 筆"
End Sub
```

幾個正式環境注意事項：

- **`certpwd` 不要寫死在 code 裡** — 應該從 `NotesSession.GetEnvironmentString` 讀或從外部 vault 拿
- **初次密碼策略** — 用可預測的規則（譬如員工編號）+ 設政策強制首次登入改密碼
- **錯誤恢復** — 用 `On Error Resume Next` 保證單筆失敗不會中斷整批、把錯誤累積在 log 等管理員處理
- **冪等性** — RegisterNewUser 對同名使用者會 throw 錯、所以重跑 batch 要先過濾已存在的（用 `GetUserInfo` 檢查）

---

## 常見坑

### 憑證者 ID 檔的路徑跟密碼

`CertifierIDFile` 是 agent 跑的時候要能讀到的路徑 — 不是管理員在 Admin Client 看到的路徑。如果 agent 跑在伺服器上、就要把 `cert.id` 放到伺服器上、且 agent 簽署人要有讀檔權限。

更安全的做法：用 CA（Certificate Authority）取代直接放 `cert.id`、設 `UseCertificateAuthority = True`、`CertifierName` 改用 CA 註冊過的憑證者。

### 跟 ID Vault 的互動

部署了 ID Vault 後、`StoreIDInAddressBook = True` 會讓新 ID 自動進 vault — 條件是組織已經設好對應的 ID Vault 政策。從管理員的角度看：使用者改密碼、重設、跨機器登入都不再需要傳 `.id` 檔、是現代 Domino 環境的標配。

但 vault 不取代 `NotesRegistration` — 還是要先建出 ID、vault 才有東西收進去。

### 必須在伺服器上跑、不是用戶端

`RegisterNewUser` 的前提：

- agent 跑在 Domino 伺服器上（不是裝在 Notes Client 那台的 client agent）
- agent 簽署人在 Server 文件的「Programmability Restrictions」裡有「Run unrestricted methods」權限
- agent 簽署人對 `cert.id` 跟目標伺服器有讀寫權限

從 Notes Client 跑這支 agent 通常會在 `RegistrationServer` 那行就拋錯。要在管理員身份下、且伺服器明確允許。

### `RegisterNewUser` 不會自動加群組

新使用者建好後、預設**只有 Person 文件**、沒有加進任何群組。要靠額外的 [`NotesACL`](/domino-news/zh-TW/posts/notes-acl-entry) 操作或目錄裡的群組維護程式碼補上。實務常見作法：註冊完馬上呼叫一段輔助函式把使用者加進預設群組（譬如 `AllEmployees` 跟部門群組）。

---

## 跟其他方法的關係

`NotesRegistration` 有完整一套 ID 生命週期方法、不只 `RegisterNewUser`：

| 方法 | 用途 |
|---|---|
| `RegisterNewUser` | 建一個新使用者 ID + Person 文件 + 信箱 |
| `RegisterNewServer` | 建一個新伺服器 ID |
| `RegisterNewCertifier` | 建一個新憑證者 ID（建 OU 階層用）|
| `AddUserToAddressBook` | 已經有 ID 檔、補上 Person 文件 |
| `Recertify` | 重新認證一個現有 ID（憑證者更換 / OU 異動 / 到期延展）|
| `CrossCertify` | 跨組織交叉認證 |
| `GetUserInfo` | 從目錄查使用者資訊（用來檢查是否已存在）|
| `GetIDFromServer` | 從 Person 文件下載附在裡面的 ID 檔 |
| `DeleteIDOnServer` | 從 Person 文件移除附著的 ID 檔（不是刪使用者）|

實務上、人事系統的自動化通常會用到至少 4 個：

- 報到 → `RegisterNewUser`
- 改名 / 換部門 → `Recertify`
- 離職 → 改 Person 文件狀態 + 從群組移除（用 [`NotesACL`](/domino-news/zh-TW/posts/notes-acl-entry) / `NotesDocument` 改、不是這個 class 處理）
- 留停 → 設 `Expiration` 屬性然後 `Recertify` 把 ID 改成短效期

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesRegistration` |
| Java | `lotus.domino.Registration`（去掉 `Notes` 前綴、用完要 `.recycle()`）|
| SSJS | 沒有對應 — `NotesRegistration` 是純伺服器管理操作、不適合在 XPages / 一般 SSJS 場景跑、需要管理員權限 |

如果你的環境是 XPages 應用要做使用者管理：把這段邏輯包成 scheduled agent 跑在伺服器上、XPages 介面把使用者進件寫成 request 文件、agent 抓 request 跑 `NotesRegistration`、把結果寫回 response 文件給 UI 顯示。這是分隔權限 + 介面職責的標準作法。
