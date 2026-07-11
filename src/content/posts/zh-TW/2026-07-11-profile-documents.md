---
title: "Profile documents：Domino 的快取式設定儲存區，以及那個快取為什麼會咬人"
description: "profile document 是一份隱藏、在 view 裡看不到、以名稱（與可選的使用者）為鍵的文件 —— 很適合放應用設定與個人偏好，而且因為有快取所以很快。本文說明 GetProfileDocument、IsProfile / NameOfProfile / Key 屬性、透過 unique key 做個人化 profile，以及快取造成的陷阱：另一個程序的寫入可能對你已開啟的 session 看不見，而且沒有 refresh API 能強制重讀。"
pubDate: 2026-07-11T07:30:00+08:00
lang: zh-TW
slug: profile-documents
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "GetProfileDocument method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCUMENT_METHOD.html"
  - title: "GetProfileDocCollection method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCCOLLECTION_METHOD_DATABASE.html"
  - title: "Key property (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_KEY_PROPERTY.html"
relatedJava: ["Database", "Document"]
relatedSsjs: ["database", "document"]
---

每個像樣的 Domino 應用都需要一個地方放設定 —— 公司 logo、預設頁面大小、每個人的佈景。你可以做一個「config」表單加一個 view，但 Domino 有一個為此打造的機制：**profile document**。它是一份文件，但是特殊的一份 —— 在 view 裡看不到、不計入資料庫的文件數、而且為了速度被快取。那個快取正是 profile 快的原因，也正是絆倒開發者的東西。

---

## 重點摘要

- profile document 儲存應用範圍或個人的設定。依文件，profile「在 view 裡看不到、不計入資料庫的文件數、而且在包含它的資料庫開啟期間被快取」。
- 用 [`db.GetProfileDocument(profileName$ [, uniqueKey$])`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCUMENT_METHOD.html) 取得 —— 它「取得**或建立**」profile，所以永遠回傳一份可用的文件。
- 傳一個 **unique key**（慣例用 `session.UserName`）得到**個人化** profile；不傳它則是單一個共用、資料庫範圍的 profile。
- 用 `NotesDocument.IsProfile`、`NameOfProfile`、`Key` 內省（Key 是那個 unique key —— 注意是 `Key`，不是 `KeyOfProfile`）。
- **快取陷阱：** profile 在資料庫開啟期間被快取在後端。如果另一個程序更新了它，你已載入的副本是舊的 —— 而在同一個 session 裡重新呼叫 `GetProfileDocument` 可能交回快取版本、而非磁碟上的新版。沒有簡單的「refresh 這個 profile」API。

## 讀寫一個 profile

profile 的儲存與讀取跟任何文件一樣；唯一差別在你怎麼取得它。不傳 unique key 得到一個共用、資料庫範圍的 profile：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim profile As NotesDocument
  Set db = session.CurrentDatabase

  ' 不給 unique key => 一個共用 profile。若還不存在會被建立。
  Set profile = db.GetProfileDocument("AppSettings")
  Call profile.ReplaceItemValue("MaxItemsPerPage", 50)
  Call profile.ReplaceItemValue("LastUpdatedBy", session.UserName)
  Call profile.Save(True, False)     ' profile 跟普通文件一樣存
End Sub
```

傳 unique key 得到個人化 profile —— 每個使用者在同一個 profile 名稱下有自己的實例：

```lotusscript
Dim prefs As NotesDocument
Set prefs = db.GetProfileDocument("UserPrefs", session.UserName)
Call prefs.ReplaceItemValue("Theme", "dark")
Call prefs.Save(True, False)

Print prefs.IsProfile & " / " & prefs.NameOfProfile & " / " & prefs.Key
' => True / UserPrefs / CN=Jane Doe/O=Acme
```

三個內省屬性都是唯讀的：`IsProfile` 告訴你一份文件是不是 profile、`NameOfProfile` 回傳 profile 名稱、[`Key`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_KEY_PROPERTY.html) 回傳「profile 的使用者名稱（key）」—— 你傳進去的那個 unique key。要列舉某個名稱的所有 profile（例如迭代所有使用者的偏好），用 [`GetProfileDocCollection(profileName$)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETPROFILEDOCCOLLECTION_METHOD_DATABASE.html)，它回傳一個 `NotesDocumentCollection` —— 不傳名稱則回傳全部 profile。

## 快取陷阱

profile「在包含它的資料庫開啟期間」被快取 —— 那是刻意的效能功能，對讀多寫少的設定來說完全正確：你可以在迴圈裡狂打 `GetProfileDocument`，成本很低。問題在並行下浮現。因為你的 session 在第一次存取後就持有一份快取副本：

- 如果另一個使用者、agent 或伺服器工作更新了同一個 profile，**你載入的副本是舊的** —— 你還在看第一次讀取時的值。
- 在同一個開啟的 session 裡對同一個名稱/key 重新呼叫 `GetProfileDocument`，**可能回傳快取副本**、而非磁碟上剛存的版本。所以你光靠重抓，並不可靠地看到另一個程序的寫入。
- 兩個寫入者可能悄悄互相蓋掉 —— 在舊快取之上 last-writer-wins。

沒有 `.refresh` 之類能乾淨地讓快取 profile 失效的呼叫，這正是為什麼這值得知道。實務指引：

- **profile 用於讀多寫少的設定**，不是高頻變動的資料。把計數器或每次請求的狀態放進 profile 是經典錯誤 —— 快取讓並行遞增遺失更新。
- 要強制跨程序真正重讀，你通常得丟掉並重新取得資料庫（或 session）handle，而不只是再呼叫一次 `GetProfileDocument`。
- 這個行為眾所周知到 HCL 自己的 ideas portal 都有一則長期請求要讓快取變成可選 —— 所以如果它咬到你，你並不孤單，而解法是繞著它設計。

在 XPages/SSJS 裡這個陷阱被放大：伺服器程序長壽且多使用者，所以一個舊的快取 profile 可能橫跨許多請求持續存在，直到資料庫 handle 回收。在那裡把 profile 當讀多寫少對待，真的需要當前資料時就刷新 handle。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `db.GetProfileDocument(name, key)` | `db.getProfileDocument(name, key)` | `database.getProfileDocument(name, key)` |
| `db.GetProfileDocCollection(name)` | `db.getProfileDocCollection(name)` | `database.getProfileDocCollection(name)` |
| `doc.IsProfile / NameOfProfile / Key` | `doc.isProfile() / getNameOfProfile() / getKey()` | 同，camelCase |

API 與快取語意在三種語言裡都一樣。在 Java 裡集合方法需要 profile 名稱參數（LotusScript 讓它可選），但除此之外是同一個機制 —— 也是同樣的建議：profile 是一個快速的快取設定儲存區，最好維持讀多寫少。
