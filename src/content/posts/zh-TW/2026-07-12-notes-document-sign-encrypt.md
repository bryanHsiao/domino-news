---
title: "用 LotusScript 簽章與加密文件：Sign、Encrypt，與 Save 的順序規則"
description: "Domino 能簽章一份文件以證明是誰寫的、能加密 item 讓只有持金鑰的人讀得到 —— 兩者都能用 LotusScript 做、也都有陷阱。本文說明 NotesDocument.Sign 與它在伺服器 agent 需要的權限、Encrypt 那個必要的「標記 item / Encrypt / Save」順序、逐 item 選擇性加密，以及為什麼 EncryptOnSend 跟「加密儲存的副本」是完全兩回事。"
pubDate: 2026-07-12T07:30:00+08:00
lang: zh-TW
slug: notes-document-sign-encrypt
tags:
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "Sign method (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SIGN_METHOD.html"
  - title: "Encrypt method (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPT_METHOD.html"
  - title: "EncryptionKeys property (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPTIONKEYS_PROPERTY.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

Domino 兩個最老的安全功能各是一個方法呼叫 —— 而兩者只要你把順序弄錯就會安靜地失敗。[`Sign`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SIGN_METHOD.html) 附上一個證明是誰寫了這份文件的加密簽章；[`Encrypt`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPT_METHOD.html) 把選定的 item 打亂，讓只有持金鑰的人讀得到。陷阱不在密碼學 —— 在*變更何時落盤*，以及*誰的身分在做事*。

---

## 重點摘要

- **`doc.Sign`** 用目前使用者（或簽署者）的 ID 簽章。「如果你要讓簽章被儲存，你必須在簽章後呼叫 Save 方法」—— 光 Sign 不會持久化。
- **在伺服器 agent 裡，簽章需要權限：** 簽署者必須被列在伺服器文件的「Run unrestricted methods and operations」裡，否則你會得到錯誤 4165。
- **加密是逐 item 且需選擇性開啟：** 對你要保護的每個 item 設 `item.IsEncrypted = True`，然後呼叫 `doc.Encrypt`，再 `doc.Save`。你沒標記的 item「對任何使用者仍然可見，即使該使用者沒有正確的加密金鑰」。
- **順序是強制的：** 標記 item → `Encrypt` → `Save`。「加密後的文件要到你呼叫 Save 方法才會被寫到磁碟。」
- 不設金鑰時，`Encrypt` 用使用者的**公開金鑰**（只有他能解密）。設 `EncryptionKeys` 為一或多個**具名密鑰**來分享存取。
- **寄信是分開的：** `EncryptOnSend` / `SignOnSend` 只在文件被*寄出*時作用，且「對文件存到資料庫時是否加密沒有影響」。寄信時 `EncryptionKeys` 被忽略 —— 改用收件者的公開金鑰。

## 簽章

`Sign` 不收參數 —— 它用執行程式的身分簽章，而你必須存檔才能留住它：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Main Topic"
doc.Subject = "A signed document"
Call doc.Sign
Call doc.Save(False, True)
Print "Signed by: " & doc.Signer & ", verified by: " & doc.Verifier
```

這是官方範例。簽章後，`doc.IsSigned` 是 `True`、`doc.Signer` 指出誰簽的、`doc.Verifier` 指出替他背書的憑證（若未簽章或簽署者不受信任，兩者皆空）。

身分問題在 agent 裡最重要。`Sign` 用「目前使用者的 Notes ID」—— 而在背景 agent 裡，*那是誰*取決於 session 怎麼取得的（普通 `NotesSession` 以 agent 簽署者身分執行；`sessionAsSigner` 是以設計元件簽署者身分簽章的機制）。無論哪種，文件寫明的硬性要求是權限：一個會簽章的伺服器 agent，其簽署者必須在伺服器的「Run unrestricted methods and operations」清單裡，否則會以 `lsERR_NOTES_SIGN_NOPERM`（4165）失敗。

## 加密

加密是逐 item 選擇性開啟、且有嚴格順序的。你標記要保護的 item、呼叫 `Encrypt`、再 `Save` —— 這是具名密鑰的官方寫法：

```lotusscript
Dim doc As NotesDocument
Dim itemA As NotesItem
Dim itemB As NotesItem
'...set value of doc...
Set itemA = doc.GetFirstItem("Subject")
Set itemB = doc.GetFirstItem("Body")
itemA.IsEncrypted = True
itemB.IsEncrypted = True
doc.EncryptionKeys = "Top Secret"
Call doc.Encrypt
Call doc.Save(True, True)
```

這裡有三條規則在運作。第一，**只有被標記的 item 會被加密** —— 任何沒有 `IsEncrypted = True` 的都保持任何人可讀，所以加密「這份文件」其實是加密你標記的那些 item。第二，**光設旗標本身什麼都不做**：「item 要到你對父 NotesDocument 呼叫 Encrypt 方法時才真正被加密。」第三，**`Encrypt` 不碰磁碟** ——「加密後的文件要到你呼叫 Save 方法才會被寫到磁碟。」漏了 `Save`，你什麼都沒加密到。

[`EncryptionKeys`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPTIONKEYS_PROPERTY.html) 屬性選擇*誰*能解密。不設金鑰時，`Encrypt` 用目前使用者的公開金鑰 —— 只有他讀得回來，這對共用資料很少是你要的。設一或多個具名密鑰（收件者的 ID 裡必須有這些金鑰）來分享存取。對代替別人加密的伺服器 agent，`Encrypt(userid)` / `Encrypt(idfile, password)` 多載讓你用特定身分的金鑰加密，通常透過 `NotesIDVault` 取得。

## 寄信是另一個機制

最常見的混淆：`EncryptOnSend` 與 `SignOnSend` *不*等於 `Encrypt`/`Sign`。它們只在文件被**寄出**時作用，而文件直白地說 `EncryptOnSend`「對文件存到資料庫時是否加密沒有影響」。兩個值得內化的後果：

- 寄信時 `EncryptionKeys` 被忽略 —— Domino 改為「在 Domino Directory 裡尋找每個收件者的公開金鑰」。而如果它找不到某個收件者的公開金鑰，它會「寄一份未加密的文件副本給該收件者」—— 一個容易被漏看、悄悄降級成明文的行為。
- 要保護資料庫裡*儲存*的副本，用 `Encrypt`；要保護*寄出*的副本在傳輸中的安全，用 `EncryptOnSend`。它們解決不同的問題，而你有時兩個都要。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.Sign` / `doc.Encrypt` | `doc.sign()` / `doc.encrypt()` | `document.sign()` / `document.encrypt()` |
| `doc.EncryptionKeys` | `doc.getEncryptionKeys() / setEncryptionKeys()` | 同，camelCase |
| `doc.IsSigned / IsEncrypted / Signer` | `doc.isSigned() / isEncrypted() / getSigner()` | 同 |

`lotus.domino.Document` 的介面在 Java 與 SSJS 都與 LotusScript 對應，而每個提醒都沿用：標記 item→加密→存檔、簽章 agent 的伺服器權限、以及資料庫副本加密（`encrypt`）與寄信時加密（`encryptOnSend`）之間的嚴格區分。
