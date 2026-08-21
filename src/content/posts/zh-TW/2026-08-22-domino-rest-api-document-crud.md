---
title: "在 Domino REST API 建文件，為什麼一定要帶 Form 欄位和 dataSource？"
description: "門開好了（schema + scope），這一篇做真正的活：用 REST 對 NSF 裡的文件增刪查改。建立是 POST /document、body 帶一個必填的 Form 欄位，回來的 @meta 裡有 unid；讀取是 GET /document/{unid}/{mode}。每個 CRUD 呼叫都帶 dataSource——而那個值就是你上一篇建的 scope 名字。這篇也講兩個 Domino 開發者會愣一下的點：Form 欄位為什麼必填、mode 是什麼。DRAPI 系列第四篇。"
pubDate: 2026-08-22T07:30:00+08:00
lang: zh-TW
slug: domino-rest-api-document-crud
tags:
  - "Domino REST API"
  - "Tutorial"
sources:
  - title: "Domino REST API — Enable a database (CRUD)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html"
  - title: "Domino REST API — Using the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API — Quickstart"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
---

[上一篇](/domino-news/posts/domino-rest-api-scope-schema)把門開好了——schema 決定露什麼、scope 給它一個名字。這一篇做真正的活：用 REST 對 NSF 裡的文件**增刪查改**，而且全程是 JSON。（還沒把 DRAPI 跑起來的話，先照官方 [quickstart](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 把環境走一遍。）

從 LotusScript 過來的人，這裡會先愣一下：沒有 `NotesDocument`、沒有 `ReplaceItemValue`、也沒有 `.Save`。一份文件就是一包 JSON，一個 HTTP 動詞就是一個操作。但有兩個 Domino 特有的東西你得先認得：**`dataSource`**（就是你的 scope 名）和 **`Form` 欄位**。

---

## 重點摘要

- **每個 CRUD 呼叫都帶 `dataSource` 查詢參數**，值就是[上一篇](/domino-news/posts/domino-rest-api-scope-schema)建的 **scope 名**——[官方文件](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)明講 scope 名會用在所有 CRUD 操作上、當作 `dataSource` 的值。
- **建立**：`POST /api/v1/document?dataSource=<scope>`，body 是一包 JSON，裡面**必須有一個 `Form` 欄位**指明這是哪種文件。回來的 `@meta` 裡有 `unid` 和 `noteid`。
- **讀取**：`GET /api/v1/document/{unid}/{mode}?dataSource=<scope>`。
- **更新／刪除**：`PATCH`（局部更新）／`PUT`（整份取代）／`DELETE`，都打 `/api/v1/document/{unid}`、一樣帶 `dataSource`。
- **`mode` 是 DRAPI 特有的概念**：一個 form 可以有多個 mode（`default`、`odata`、`dql`…），每個 mode 定義「看得到／寫得到哪些欄位」。建立時用第一個 `default` mode。

---

## 建立：POST /document

建一份文件，就是把欄位包成 JSON，POST 到 [document 端點](https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html)，並在查詢字串帶上 scope：

```bash
curl -X POST "http://localhost:8880/api/v1/document?dataSource=customers" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "Form": "Customer",
        "first_name": "Madison",
        "last_name": "Branthwaite",
        "email": "mbranthwaite0@nba.com"
      }'
```

兩個 Domino 味很重的細節：

- **`dataSource=customers`**：`customers` 是你的 **scope 名**，不是檔案路徑、也不是 replica ID。DRAPI 靠這個 scope 找到背後那個 NSF、並套用它的 schema。
- **`Form` 欄位是必填的**：它指明這份文件用哪個表單——DRAPI 靠它去 schema 裡查對應的 mode（欄位與存取規則）。這其實就是 Domino 文件本來就有的 `Form` item，只是現在你在 JSON 裡明寫出來。

建立成功，回來的 JSON 會多一個 `@meta` 物件，裝著這份新文件的識別資訊：

```json
{
  "@meta": { "unid": "A1B2...C3D4", "noteid": 2458, "...": "..." },
  "Form": "Customer",
  "first_name": "Madison"
}
```

那個 `unid` 就是你之後要讀、要改、要刪這份文件的把手。

## 讀取：GET /document/{unid}/{mode}

拿到 `unid` 之後，讀回這份文件：

```bash
curl "http://localhost:8880/api/v1/document/A1B2...C3D4/default?dataSource=customers" \
  -H "Authorization: Bearer <token>"
```

路徑裡的 `default` 就是 **mode**（可省略，省略時就用 `default`）。回來的 JSON 就是這份文件的欄位——Domino 的 item 變成 JSON 的鍵，多值欄位變成 JSON 陣列，再附上一個 `@meta`。

## 更新與刪除

改和刪走的是同一個 `/document/{unid}` 路徑，換 HTTP 動詞：

- **`PATCH /api/v1/document/{unid}?dataSource=<scope>`**：局部更新——body 只帶你要改的欄位，其餘不動。
- **`PUT /api/v1/document/{unid}?dataSource=<scope>`**：整份取代。
- **`DELETE /api/v1/document/{unid}?dataSource=<scope>`**：刪掉。

從 LotusScript 的角度，`PATCH` 大概是你最常用的——它對應「開文件、改幾個欄位、save」那個最日常的動作，只是現在不必自己開、自己 save，一個請求就完成。

## 那個會愣一下的東西：mode

`mode` 是 DRAPI 特有、Domino 傳統沒有的概念，值得單獨講。官方的設計是：一個 form 在 schema 裡可以定義**多個 mode**，每個 mode 是一組「這個角度看得到／寫得到哪些欄位、有什麼存取條件」的規則。

- 建立文件時，用的是第一個、叫 **`default`** 的 mode。
- 讀取時，你在路徑裡指定要用哪個 mode 來投影這份文件。
- 還有些內建用途的 mode，例如 OData 存取要一個叫 `odata` 的 mode。

換句話說，**同一份文件，透過不同 mode 可以露出不同的欄位子集**。這是 DRAPI 把「欄位級的對外控制」做在 schema 裡的方式——你不是把整份文件無差別丟出去，而是依 mode 決定這次露多少。

## 小結

一份 Domino 文件在 REST 這端，就是一包帶著 `@meta` 的 JSON；`POST`／`GET`／`PATCH`／`DELETE` 對應建／讀／改／刪；`dataSource` 永遠是你的 scope 名，`Form` 欄位在建立時指明文件型別，`mode` 決定露出哪些欄位。下一篇進到**查詢**——當你不是要單一份文件、而是要「符合條件的一批」時，怎麼在 REST 上跑 DQL、怎麼讀 view。
