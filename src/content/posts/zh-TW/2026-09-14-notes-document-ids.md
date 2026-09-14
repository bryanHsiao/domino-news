---
title: "NoteID、UNID、@DocumentUniqueID：Domino 文件的三個 ID 到底差在哪"
description: "要指涉一份 Domino 文件，你可能會抓 NoteID、UniversalID（UNID），或在 Formula 用 @DocumentUniqueID——三個長得像、行為卻天差地遠。NoteID 只在單一資料庫檔內有意義、換個 replica 就變了；UNID 是 32 字元、跨所有 replica 都一樣的真身分；@DocumentUniqueID 回的就是 UNID（但不加 @Text 會變成 doclink）。這篇把三者的範圍、穩定性、該用哪個講清楚，含「改 UNID 會變新文件」「存重複 UNID 噴 4000」等雷，以及 web URL 那個 /0/UNID 的由來。"
pubDate: 2026-09-14T07:30:00+08:00
lang: zh-TW
slug: notes-document-ids
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Formula"
sources:
  - title: "UniversalID property (NotesDocument) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_UNIVERSALID_PROPERTY_DOC.html"
  - title: "NoteID property (NotesDocument) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTEID_PROPERTY.html"
  - title: "@DocumentUniqueID (Formula Language) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_DOCUMENTUNIQUEID.html"
  - title: "GetDocumentByUNID (NotesDatabase) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_GETDOCUMENTBYUNID_METHOD.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

你要在程式或連結裡「指涉某一份文件」，Domino 給你好幾個 ID 可抓：`NoteID`、`UniversalID`，Formula 裡還有 `@DocumentUniqueID`。它們都是一串十六進位、長得很像，於是很容易隨手抓一個就用——然後在某個 replica、某次複製貼上之後，突然抓到錯的文件、或抓不到。差別其實很大，這篇一次講清楚。

## 重點摘要

- **NoteID**：8 個字元，只在**單一資料庫檔案內**唯一，代表文件在那個檔裡的位置。**換一個 replica 通常就不一樣**，文件刪掉後編號還可能被重用——只適合「同一個 session、同一個庫」裡的暫時性存取。
- **UniversalID（UNID）**：32 個十六進位字元，**跨所有 replica 都一樣**，是文件真正的身分。要儲存、要做 doclink、要放進 web URL，用這個。
- **`@DocumentUniqueID`**：Formula 裡拿 UNID 的方式，回的就是 UNID——但**不加 `@Text` 會變成一個 doclink、不是可讀文字**。
- **web URL 的 `/0/UNID`**：那個 `0` 是「不透過 view、直接用 UNID 找文件」的慣用寫法，也是附件／doclink URL 長那樣的原因。

## NoteID：只在「這個檔案」裡有意義

[官方定義](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTEID_PROPERTY.html)：NoteID 是一串 8 字元的字母數字組合，在**某個特定資料庫裡**唯一標識一份文件；它代表的是「文件在那個資料庫檔案裡的位置」，所以**互為 replica 的文件，NoteID 通常不一樣**。

這句「代表位置」是關鍵。NoteID 快、在 LotusScript 裡用 `db.GetDocumentByID(noteid)` 一取就到，適合「我現在就要在這個庫、這個 session 裡快速回到這份文件」。但它有兩個致命點：

- **換 replica 就變**：A 伺服器的某文件 NoteID，拿到 B 伺服器的 replica 去 `GetDocumentByID`，指到的多半是**別份文件**（或不存在）。
- **可能被重用**：文件刪掉後，那個位置的編號可能被之後的新文件拿去用。

所以 **NoteID 千萬別存起來、也別跨庫用**。它是「一次性的本地把手」，不是身分證。

## UniversalID（UNID）：跨 replica 的真身分

[官方定義](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_UNIVERSALID_PROPERTY_DOC.html)：「The universal ID, which uniquely identifies a document across all replicas of a database.」——32 個十六進位字元，**跨這個庫的所有 replica 都是同一個**。官方還點明：兩份在不同 replica 的文件，**只要 UNID 相同，它們就是彼此的 replica**。

這才是你要「記住一份文件」時該存的東西：跨伺服器、跨複本都認得，doclink、web URL、外部系統的 reference，一律用 UNID。LotusScript 用 [`db.GetDocumentByUNID(unid)`](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_GETDOCUMENTBYUNID_METHOD.html) 取回。

**兩個要小心的雷**（都在官方 UniversalID 頁）：`UniversalID` 是**可寫**的，但——

- **改一份既有文件的 UNID，等於把它變成一份新文件**（「Modifying the UNID of an existing document transforms it into a new document」）。
- **想存一份跟現有文件同 UNID 的文件，會噴 `lsERR_NOTES_ERROR`（4000）**。

換句話說，UNID 可寫不代表你該去改它；除非你很清楚在做「建立 replica 關係」這種事，否則別碰。另外提醒：在 Notes 用戶端**複製貼上**一份文件，貼出來的是**新 UNID**（不是同一份），這也是很多人以為「複製後還是同一份」卻對不上的原因。

## `@DocumentUniqueID`：Formula 裡的 UNID（記得 `@Text`）

在 Formula（計算欄位、view 欄位、agent）裡拿 UNID，用 `@DocumentUniqueID`。[官方](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_DOCUMENTUNIQUEID.html)特別提醒一句很多人踩的坑：

> 「To display the UNID, you must convert the result of this function to text, that is, you must specify `@Text(@DocumentUniqueID)`.」

不加 `@Text`，`@DocumentUniqueID` 回的是一個**指向該文件的 doclink**、不是那串 32 字元文字——你想把 UNID 拼進 URL 或顯示出來時，忘了 `@Text` 就會拿到怪東西。相對地，Formula 的 `@NoteID` 回的是 `"NT"` 開頭加十六進位的 NoteID（同樣只在本庫有意義）。

## web URL 的 `/0/UNID` 是怎麼回事

你一定看過 Domino 的文件／附件 URL 長這樣：`…/db.nsf/0/<32位UNID>?OpenDocument`，或附件的 `…/db.nsf/0/<UNID>/$FILE/檔名?OpenElement`。那個 **`0`** 不是打錯——標準 web URL 格式是 `/db.nsf/<view>/<document>`，而 `0` 是一個特殊佔位，意思是「**不透過任何 view，直接用後面的 UNID 找文件**」。因為 UNID 跨 replica 唯一，用它當 web 定位最穩——這也是我們在[附件系列](/domino-news/posts/domino-web-attachment-ui)自畫下載連結時，URL 會用 `@Text(@DocumentUniqueID)` 拼進 `/0/…/$FILE/…` 的原因。

## 一張表看懂

| | NoteID | UniversalID（UNID） |
|---|---|---|
| 長度 | 8 字元 | 32 字元（hex） |
| 範圍 | 單一資料庫檔案 | 跨所有 replica |
| 換 replica | **會變** | 不變 |
| 刪除後 | 可能被重用 | — |
| 該不該存／傳 | **不要** | 要存就存這個 |
| LotusScript 取回 | `GetDocumentByID` | `GetDocumentByUNID` |
| Formula | `@NoteID`（`"NT…"`） | `@Text(@DocumentUniqueID)` |

（另外別跟 **Replica ID** 搞混：那是**資料庫層級**的 ID、標識「這些檔案是同一個庫的複本」，跟上面兩個「文件層級」的 ID 不是同一回事。）

## 小結

一句話記住：**NoteID 是「一次性的本地把手」——快、但換個庫／過陣子就不算數；UNID 才是文件的身分證——要存、要連、要放 URL 都用它**（Formula 記得 `@Text(@DocumentUniqueID)`）。分清楚這兩個，就不會再遇到「在另一台 replica 上抓到錯文件」或「複製後對不上」這類鬼打牆。想看 UNID 在 web URL 怎麼實際用，見[傳統 web 附件 UI](/domino-news/posts/domino-web-attachment-ui)。
