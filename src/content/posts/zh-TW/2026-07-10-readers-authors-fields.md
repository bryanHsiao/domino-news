---
title: "用程式做 Readers 與 Authors 欄位：靠一個 NotesItem 旗標設定的文件層級安全"
description: "Domino 的文件層級存取控制不是什麼特殊 API —— 它就是一個帶旗標的普通 item。本文說明怎麼在 LotusScript 用 ReplaceItemValue 加上 NotesItem.IsReaders / IsAuthors 建立 Readers 與 Authors 欄位、安全模型（沒有 Readers item = 所有人可見；有 Readers item = 只有列出的人）、以及鎖死陷阱：把自己和 agent 漏在清單外，你會把一份文件對所有人藏起來，包括產生它的那段程式。"
pubDate: 2026-07-10T07:30:00+08:00
lang: zh-TW
slug: readers-authors-fields
tags:
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "IsReaders property (NotesItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISREADERS_PROPERTY.html"
  - title: "IsAuthors property (NotesItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISAUTHORS_PROPERTY.html"
  - title: "NotesItem class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS.html"
relatedJava: ["Item", "Document"]
relatedSsjs: ["item", "document"]
---

你做一個 HR 應用，每筆紀錄應該只有員工本人和他的主管看得到。資料庫 ACL 給所有人 Reader 存取 —— 那太粗了。你要的是*逐文件*的控制，而在 Domino 裡它住在 ACL 下一層、在文件本身：一個 **Readers 欄位**。對從其他平台過來的人來說，意外的是它根本不是什麼特殊的安全 API —— 它是一個普通 item，上面設了一個旗標。

那個旗標就是 [`NotesItem.IsReaders`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISREADERS_PROPERTY.html)（以及它的手足 `IsAuthors`）。旗標設對，你就有了文件層級安全；設錯，你可能把一份文件對所有人鎖起來 —— 包括建立它的那個 agent。

---

## 重點摘要

- 一個 **Readers item**「包含一份 Notes 使用者名稱清單，指出哪些人對某份特定文件有 Reader 存取」。**Authors item** 對 Author 層級的編輯存取做同樣的事。
- **模型：** 一份**沒有** Readers item 的文件，對所有有 DB 讀取權的人可見。加上一個 Readers item，文件就變成**只有**其中列出的名字、群組、角色看得到。這是疊在 ACL 之上的*限制* —— 它從不*授予*超過 ACL 允許的權限。
- **用程式建立**用兩步驟：`ReplaceItemValue` 寫入名字，然後把回傳的 item 設 `.IsReaders = True`（或 `.IsAuthors = True`）。設這個旗標會自動把 `IsSummary` 設為 True。
- **鎖死陷阱：** 一個空的（但存在的）Readers item 會把文件對*所有人*藏起來。永遠要包含你自己的名字，以及需要存取的伺服器／agent／群組。
- **Agent：** 一個排程或 web agent 要讀到受 Readers 保護的文件，它的**簽署者必須在 Readers 清單裡**（直接、或透過群組／角色）。
- Authors 欄位只授予編輯權給那些在 ACL 裡已經有 **Author** 存取的使用者 —— 它不會把 Reader 層級的使用者升級。

## 安全模型

兩條規則就是全部：

1. **沒有 Readers item → 所有人可見**（受 ACL 約束）。這就是為什麼一份你從沒給過 Readers 欄位的文件，對所有有資料庫存取的使用者都可讀。
2. **有 Readers item → 恰好列出的那些人可見** —— 並且，隱含地，其他人都不行。因此一個*空的* Readers item 會把文件對所有人藏起來，這是最經典的自傷。

Authors 欄位是編輯的對應：一個使用者要能編輯，需要在 ACL 裡至少有 Author 存取*而且*被列在某個 Authors 欄位裡（或文件根本沒有 Authors 欄位）。Authors 欄位從不把 Reader 存取的使用者升成編輯者 —— 它只在已經有 Author 存取的使用者之間才有意義。

## 用程式建立這些欄位

沒有專門的「做一個 Readers 欄位」呼叫 —— 你寫一個普通 item、再把它加旗標。`ReplaceItemValue` 回傳它建立的 [`NotesItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS.html)，你在那上面設型別旗標：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim doc As NotesDocument
  Dim readItem As NotesItem
  Dim authItem As NotesItem
  Set db = session.CurrentDatabase
  Set doc = db.CreateDocument
  Call doc.ReplaceItemValue("Form", "Record")
  Call doc.ReplaceItemValue("Subject", "Confidential HR record")

  ' Readers 欄位：限制可見範圍。
  ' 包含你自己 + 必須仍能讀它的伺服器／agent。
  Set readItem = doc.ReplaceItemValue("DocReaders", _
      Array(session.UserName, "Jane Doe/Acme", "[HRAdmin]", "LocalDomainServers"))
  readItem.IsNames = True        ' 當作 Names 欄位
  readItem.IsReaders = True      ' 變成 Readers 欄位；自動設 IsSummary

  ' Authors 欄位：哪些（有 Author ACL 存取的）人可以編輯。
  Set authItem = doc.ReplaceItemValue("DocAuthors", _
      Array(session.UserName, "Jane Doe/Acme"))
  authItem.IsNames = True
  authItem.IsAuthors = True

  Call doc.Save(True, False)
End Sub
```

*（依文件的 `ReplaceItemValue` → 設旗標模式、以及官方 IsReaders 範例改寫。）*

設 `IsReaders`「會自動把 IsSummary 設為 True，所以你不需要另外明確設定 summary 旗標」—— [`IsAuthors`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISAUTHORS_PROPERTY.html) 與 `IsNames` 也一樣。加上 `IsNames = True` 把欄位標記為 Names 欄位，讓名字格式化行為一致；內部這三者都以文字儲存。

## 會咬人的陷阱

- **空清單 = 對所有人隱形。** 最常見的錯誤：把一個 item 設 `IsReaders = True`、卻讓名字留空（或把它們全篩掉），文件就對所有人消失 —— 包括你自己。永遠要填清單。
- **把你的伺服器／agent 漏掉，它們就處理不到。** 一個每晚對這些文件運算的 agent，它的簽署者必須在 Readers 欄位裡，否則它根本看不到那些文件。加 `LocalDomainServers` 或那個特定簽署者／群組。
- **名字要用正確形式。** 用正規（`CN=Jane Doe/O=Acme`）或縮寫（`Jane Doe/Acme`）Notes 名稱；純顯示用的字串解析不了。
- **角色與群組是你的好朋友。** 一個 Readers item 可以在個別使用者之外放群組名稱與 ACL 角色名稱（像 `[HRAdmin]`）—— 比列出每個使用者好維護太多，也是把逐文件限制與角色式存取結合的方式。
- **文字清單上限 64K。** 對一個很大的 Readers 欄位附加名字可能撞到上限 ——「如果對既有文字清單附加一個新值會讓清單超過 64K，這個新值不會被附加」。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesItem.IsReaders` | `Item.isReaders()` / `setReaders()` | `item.isReaders()` |
| `NotesItem.IsAuthors` | `Item.isAuthors()` / `setAuthors()` | `item.isAuthors()` |

Java 的 `lotus.domino.Item` 攤出 `isReaders()`/`setReaders()`、`isAuthors()`/`setAuthors()`、`isNames()`/`setNames()`；XPages SSJS 取到同一個後端 `Item` 類別。安全模型是 Domino 資料的性質、不是語言的 —— 「空 Readers 等於所有人」這條規則、以及 agent 的「簽署者必須被列出」這條規則，不管哪個語言設旗標都一樣成立。
