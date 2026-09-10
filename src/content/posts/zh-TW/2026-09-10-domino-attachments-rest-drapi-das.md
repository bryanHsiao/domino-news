---
title: "把 Domino 附件用 REST 拋出去：DRAPI 與 DAS 都有附件端點，差在現代 vs 舊版"
description: "前幾篇都是使用者從 UI 上傳附件；但有時你要用 REST 把附件程式化地拋進拋出。Domino 有兩套 REST API：DRAPI（現代、KEEP）與 DAS（舊版、Extension Library）。常見的誤解是「DAS 只能讀」——其實不然，DAS 一樣有專屬的附件端點可以新增／讀取／更新／刪除。真正的差別是現代 vs 舊版，加上一個 DAS 特有的陷阱：別把內嵌附件資料的整份文件拿去 create／update（會回 400），要走專屬附件端點。這篇把兩者的端點與差異對照清楚。"
pubDate: 2026-09-10T07:30:00+08:00
lang: zh-TW
slug: domino-attachments-rest-drapi-das
tags:
  - "Domino REST API"
  - "DevOps"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-attachments-rest-drapi-das.webp"
coverStyle: "collage"
---

前幾篇講的都是**使用者**從一個 UI 把檔案附上去——client 的富文本欄位、web 的 File Upload Control、XPages 的 `xp:fileUpload`。但還有一整類需求是**程式**要用 REST 把附件拋進拋出：一個外部系統來把檔案抓走、一支 SPA 前端把檔上傳到某份文件、一條整合流程把舊附件刪掉。

Domino 有兩套 REST API 能做這件事——**DRAPI**（Domino REST API，前身 Project KEEP）與 **DAS**（Domino Access Services）。DAS 有一個「用文件 body 夾帶附件會回 400」的限制，很容易被讀成「只能讀、不能上傳」——但實際查 DAS 的規格，它一樣有一組專屬的附件端點，能新增、讀取、更新、刪除。兩者真正的差別不在「能不能」，而在**現代 vs 舊版**，外加一個 DAS 特有、很容易踩的文件回寫陷阱。

---

## 重點摘要

- **兩套都有附件端點、都能 CRUD。** DAS 也能上傳附件——那個「只能讀」的印象，其實來自下面的 400 限制被讀錯。
- **DRAPI（現代／KEEP）**：`POST /attachments/{unid}` 上傳、`GET /attachments/{unid}/{attachmentName}` 下載、`DELETE` 刪除；附件以名字定址、帶 `dataSource` scope。
- **DAS（舊版／Extension Library）**：`POST …/documents/unid/{docUnid}/{itemName}`（`multipart/form-data`）新增、`GET`／`PUT`／`DELETE …/{itemName}/{fileName}` 讀／更新／刪；附件掛在指定的富文本 **item** 底下。
- **DAS 的陷阱（400 的真相）**：把 GET 回來、內嵌 base64 附件資料的**整份文件**拿去 create／update 會回 **HTTP 400**——所以官方叫你回寫文件時「remove any attachment data」、附件改走上面那組專屬端點。這不是「DAS 不能上傳」，是「別用文件 body 夾帶附件」。
- **選哪個**：新東西走 **DRAPI**（積極開發、有 Swagger／WOPI／Office Round Trip）；DAS 仍可用，但是舊版。

---

## DRAPI：附件端點，以名字定址

[DRAPI](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/richtext/index.html) 給附件一組專屬端點（都要帶 `dataSource` query 參數指定 scope）：

- **下載**：`GET /attachments/{unid}/{attachmentName}`——官方 spec summary「Retrieve a document's attachment」，回附件原始 binary。
- **刪除**：`DELETE /attachments/{unid}/{attachmentName}`——summary「Removes an attachment」，可帶選填的 `fieldName` 指定從哪個富文本欄位移除。
- **上傳**：`POST /attachments/{unid}`——官方 [Round Trip 教學](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/roundtrip.html)逐字：「You can use the `POST /attachments/{unid}` endpoint in the Swagger UI to add the file as attachment.」（實際 multipart 送法建議在 Swagger UI 上看該端點定義確認。）

要**列出**附件，取文件時讓 form mode 帶入虛擬欄位 **`$FILES`**（大小寫敏感），回應裡就有附件名。rich text 本身可用 `GET /richtext/mime/{unid}`、`GET /richtext/markdown/{unid}`，並以 `richTextAs=`（`html`／`mime`／`md`／`plain`）指定格式——DRAPI 內部以 **MIME／multipart** 掛附件，而非 Notes 原生 CD Rich Text。

## DAS：一樣有附件端點，但掛在富文本 item 底下

[DAS](https://github.com/OpenNTF/das-api-specs) 隨 XPages Extension Library 出貨（Data 服務自 Domino 8.5.3；OpenNTF 上的規格版本是 9.0.1）。它同樣有一組**專屬附件端點**——只是定址方式不同，是掛在文件的某個富文本 **item 名稱**底下：

- **新增**：`POST …/api/data/documents/unid/{docUnid}/{itemName}`——`consumes: multipart/form-data`、summary「Adds an attachment to an item in a document.」，成功回 **201**。**這就是 DAS 上傳附件的端點。**
- **讀取**：`GET …/documents/unid/{docUnid}/{itemName}/{fileName}`——「Reads an attachment.」
- **更新**：`PUT …/{itemName}/{fileName}`——`consumes: application/octet-stream`、「Updates an attachment.」
- **刪除**：`DELETE …/{itemName}/{fileName}`——「Deletes an attachment.」

取整份文件（`GET …/api/data/documents/unid/{UNID}`）時，附件預設**以 base64 內嵌**在富文本欄位的 JSON 裡；也可以加 `attachmentlinks=true`，讓回應改給每個附件一條連結、「access the attachment as a separate resource」，不把資料整包塞進來。

## DAS 的陷阱：別把附件資料夾在文件 body 回寫

那個「DAS 回 400」的說法從哪來的？它是真的，但範圍很窄，值得講清楚——因為正是它讓人把 DAS 讀成「不能上傳」。

DAS 明確的限制是：**你不能用「建立／更新文件」這條路去夾帶附件**——嘗試在文件的富文本欄位裡放附件或 embedded object 來 create／update，會回 **HTTP 400（Bad Request）**。所以官方提醒：如果你把 GET 回來的文件資料（裡面帶著 base64 附件）直接拿去 update／create，要先「remove any attachment data」。

換句話說，400 不是「DAS 不給你上傳附件」，而是「附件不要走文件 body 這條路」——要上傳，走上一節那個 `POST …/{itemName}` 的專屬端點。把這兩件事分開，DAS 的附件行為就通了。

（DAS 這些限制細節來自較舊的 DAS 文件；端點與參數則來自 OpenNTF 上的 das-api-specs（v9.0.1）。要在正式流程依賴時，以你手上的 Domino 版本實測為準。）

## 該用哪一套

| | DRAPI（現代／KEEP） | DAS（舊版／Ext. Library） |
| --- | --- | --- |
| 附件 CRUD | ✅ 有專屬端點 | ✅ 也有專屬端點 |
| 定址方式 | `/attachments/{unid}/{name}` + `dataSource` | `…/documents/unid/{unid}/{itemName}[/{fileName}]` |
| 上傳 | `POST /attachments/{unid}` | `POST …/{itemName}`（multipart） |
| 文件內附件表示 | rich text 走 MIME／multipart | GET 文件時 base64 內嵌，或 `attachmentlinks` 給連結 |
| 要避開的坑 | — | 別用文件 body 夾帶附件回寫（回 400） |
| 定位 | 積極開發、Swagger／WOPI／Office Round Trip | 舊版、隨 Extension Library（v9.0.1） |

兩套都能上傳下載刪除；**新專案走 DRAPI**（現代、維護中、功能面更廣），DAS 仍可用但屬舊世代。真要在 DAS 上動附件，記得走專屬端點、別走文件 body。

## 小結

所以「DAS 只能讀」並不準確——它一樣有新增／讀取／更新／刪除的專屬附件端點。DRAPI 與 DAS 的差別不在能不能上傳，而在**現代 vs 舊版**：DRAPI（KEEP）是積極開發、以 `/attachments/{unid}/{name}` 定址的現代線；DAS 是隨 Extension Library 出貨的舊線，附件掛在富文本 item 底下，並有一個「別用文件 body 夾帶附件回寫、否則 400」的陷阱要避。底層沒變——不管哪套 REST，附件在 Domino 裡仍是富文本欄位上的那個附件，這條主線從[「三種上傳法」](/domino-news/posts/domino-attachments-three-ways)到[多檔與批次刪除](/domino-news/posts/domino-attachments-bulk)一路都是同一個。
