---
title: "使用 LotusScript 中的 NotesRegistration 類別自動化用戶註冊"
description: "深入探討如何在 HCL Domino 中使用 LotusScript 的 NotesRegistration 類別來自動化用戶註冊，包括主要屬性、方法和實作範例。"
pubDate: "2026-05-23T07:30:08+08:00"
lang: "zh-TW"
slug: "notesregistration-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesRegistration (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html"
  - title: "RegisterNewUser (NotesRegistration - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_REGISTERNEWUSER_METHOD.html"
  - title: "Is it possible to write an agent in Lotus Domino® to automate a user registration?"
    url: "https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/Is_it_possible_to_write_an_agent_in_Lotus_Domino%C2%AE_to_automate_a_user_registration"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesregistration-lotusscript
-->

## 簡介

在 HCL Domino 環境中，管理用戶帳號是一項關鍵任務。LotusScript 提供了 `NotesRegistration` 類別，允許開發者以程式方式自動化用戶註冊流程。本文將介紹如何使用 `NotesRegistration` 類別來創建新用戶，包括其主要屬性、方法和實作範例。

## NotesRegistration 類別概述

`NotesRegistration` 類別代表 ID 文件的創建或管理。它包含多個屬性和方法，允許開發者設定用戶資訊並執行註冊操作。該類別由 `NotesSession` 包含。

## 主要屬性

- **CertifierIDFile**：指定用於註冊的認證者 ID 文件的路徑。
- **CertifierName**：認證者的名稱。
- **CreateMailDb**：布林值，指示是否為新用戶創建郵件資料庫。
- **MailServer**：郵件伺服器的名稱。
- **MailTemplateName**：郵件資料庫的模板名稱。
- **RegistrationServer**：執行註冊操作的伺服器名稱。

## 主要方法

- **RegisterNewUser**：創建用戶 ID 並可選擇性地將其添加到 Domino 目錄中。
- **AddUserToAddressBook**：將用戶添加到地址簿中。
- **GetIDFromServer**：從伺服器獲取用戶 ID 文件。

## 使用範例

以下範例展示如何使用 `NotesRegistration` 類別來註冊新用戶：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim reg As New NotesRegistration
    
    ' 設定認證者資訊
    reg.CertifierIDFile = "C:\Certifier\cert.id"
    reg.CertifierName = "CN=Certifier/O=Organization"
    reg.RegistrationServer = "DominoServer/Organization"
    reg.CreateMailDb = True
    reg.MailServer = "MailServer/Organization"
    reg.MailTemplateName = "StdR7Mail"
    
    ' 註冊新用戶
    Call reg.RegisterNewUser("Doe", "C:\NotesData\jdoe.id", "MailServer/Organization", "John", "", "certpassword", "", "", "mail\jdoe.nsf", "", "userpassword")
End Sub
```

在此範例中，我們：

1. 創建了一個新的 `NotesRegistration` 對象。
2. 設定了認證者 ID 文件、名稱和註冊伺服器。
3. 啟用了郵件資料庫的創建，並指定了郵件伺服器和模板。
4. 使用 `RegisterNewUser` 方法註冊了一個新用戶，提供了必要的參數，如姓氏、ID 文件路徑、郵件伺服器、名字、認證者密碼、郵件資料庫路徑和用戶密碼。

## 注意事項

- 確保 `CertifierIDFile` 和 `CertifierName` 正確無誤，並且具有適當的權限。
- 在註冊用戶之前，請確認 `RegistrationServer` 可用且配置正確。
- 設定 `CreateMailDb` 為 `True` 時，請確保郵件伺服器和模板名稱正確無誤。

透過使用 `NotesRegistration` 類別，開發者可以有效地自動化用戶註冊流程，減少手動操作，提高管理效率。

有關 `NotesRegistration` 類別的更多資訊，請參閱 [官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html)。
