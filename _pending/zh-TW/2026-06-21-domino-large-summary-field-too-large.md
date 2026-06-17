---
title: "「Field is too large (32K)」在騙你：真正的牆通常是 64K summary buffer"
description: "一個 XPages 存檔錯誤：訊息寫「32K」，但你檢查每個欄位都沒破 32K（最大才 26K），照樣存不了。因為它指的數字常常不是你的問題 — 真正撞到的是「整份文件 summary 資料合計 64K」這道牆。本文先建立 summary / non-summary 與兩道大小限制的心智模型，再講 ODS 與 LargeSummary 為什麼是兩件事，最後用「這資料該不該是 summary」這個問題分流出兩種解法。"
pubDate: 2026-06-21T07:30:00+08:00
lang: zh-TW
slug: domino-large-summary-field-too-large
tags:
  - "Domino Server"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Increase the document summary data limit to 16 MB — HCL Domino 14.5.1"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/admn_increase_document_summary_data_limit.html"
  - title: "Enhancements introduced in ODS 55 in Domino 12 — HCL Domino 14.5.1"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/ods_55_introduced_in_domino_12.html"
  - title: "IsSummary (NotesItem - LotusScript) — HCL Domino Designer 14.5.1"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISSUMMARY_PROPERTY.html"
  - title: "ReplaceItemValue (NotesDocument - LotusScript) — HCL Domino Designer 14.5.1"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD.html"
relatedJava: ["Item"]
relatedSsjs: ["Item"]
---

使用者在 XPages 表單按下 Submit，存檔失敗，丟出這句：

```text
Notes error: Field is too large (32K) or View's column & selection formulas are too large
```

你照著訊息去找「哪個欄位超過 32K」。檢查完所有欄位 —— 沒有任何一個破 32K，最大的一個才 26,245 bytes。而且這份文件整體其實**很大**、約 **7,847,405 bytes（接近 8MB）**，但每個欄位都在限制內。看起來都安全，卻就是存不了。把文件複製到測試區，隨便在某個欄位多打幾個字，錯誤穩定重現。

問題在於：**這個錯誤訊息報的數字，常常不是你真正撞到的那道牆。** 它寫「32K」，但這次的牆是另一個你從頭到尾沒看到被點名的數字 —— **整份文件的 summary 資料合計上限 64K**。

先停在這個對比上：**文件本體有近 8MB，卻被一個 64K 的限制擋下。** 這個荒謬感本身就是線索 —— 那 64K 管的根本不是「整份文件」，只是其中被標成 summary 的那一小塊。換句話說，文件可以很大（rich text、夾檔、大段內容都能塞），真正稀缺、會爆的只有 summary 那 64K 額度。

這篇先把背後的心智模型建起來（一份文件裡的兩種 item、兩道大小限制），再講 ODS 跟 LargeSummary 為什麼是兩回事，最後用一個問題把解法分流：**這筆資料到底該不該是 summary？**

---

## 重點摘要

- 一份文件裡的每個 item 都帶一個 **summary 旗標**。summary item 會進一個讓 view / folder / 搜尋快速取用的緊湊區塊；non-summary 不會。
- **兩個數字、兩道牆**：單一 summary item 上限 **32K**；整份文件 summary 合計上限 **64K**。錯誤訊息只寫得出 32K，但很多「明明每欄都沒破」的案例，撞的是 64K 那道。
- `ReplaceItemValue` / `AppendItemValue` 建出的 item **預設是 summary** —— 所以程式寫入最容易在不知不覺中把 64K 填滿。
- **ODS 是瓶子、LargeSummary 是瓶蓋**：ODS55 讓檔案格式「能」放大 summary，但上限要靠 `compact -LargeSummary on` 才真正打開。升 ODS（例如升上 R12）不會自動開這個蓋。
- 解法先問「該不該是 summary」：**該** → 對 DB 開 LargeSummary（64K→16MB）；**不該** → 程式把該 item 設 `IsSummary = False`，移出 summary 區塊。

---

## 一份文件裡其實有兩種 item

要看懂這個錯誤，得先知道 Domino 怎麼存一份文件。文件裡每個 item，都帶一個 **summary / non-summary** 的旗標 —— 這跟「資料大不大」是兩回事，是「這筆值要不要進那個給 view 快速讀取的區塊」。

- **summary item**：值會被放進文件的 **summary buffer**。view、folder、selection formula、部分搜尋與索引路徑，靠的就是讀這個 buffer，不必打開整份文件就能顯示、排序、分類、篩選。狀態、分類、日期、關鍵欄位 —— 這些要出現在清單上的值，本來就該是 summary。
- **non-summary item**：值不進 buffer，只存在文件本體。大段文字、rich text、JSON、附件這類「只在文件頁面用、不需要出現在清單」的內容，屬於這類（rich text 天生就是 non-summary）。

[`NotesItem.IsSummary`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISSUMMARY_PROPERTY.html) 這個讀寫 `Boolean` 就是那個旗標。官方定義：「Indicates whether an item contains summary or non-summary data.」`True` = summary（可出現在 view / folder），`False` = non-summary（不能）。

**關鍵在於「整份文件的 summary item 合計大小有上限」。** 所以「每個欄位都沒破 32K」根本不足以證明安全 —— Domino 在意的不是你表單上哪個欄位看起來最大，而是 summary buffer 整體有沒有滿。

## 兩個數字、兩道牆

把限制講白：

| 牆 | 限制 | 撞到的情境 |
|---|---|---|
| 單一 summary item | **32K** | 某一個欄位的值自己就太大 |
| 整份文件 summary 合計 | **64K** | 一堆中等大小的 summary 欄位加起來太大 |

錯誤訊息 `Field is too large (32K)` 只報得出第一道（而且還跟「view formula 太大」混在同一句）。但實務上最容易讓人鬼打牆的，是第二道：**沒有任何單一欄位破 32K，但十幾個二十幾 K 的 summary 欄位加起來，連同儲存 overhead，就跨過了 64K。** 本案就是這種 —— 最大欄位 26K、整份文件 summary 卻已經貼著 64K 在跑，所以「多打幾個字」就爆。

> 提醒一個方向題：如果錯誤是在**開 view、重建索引、改 view design** 時出現，那要查的是訊息後半段「view column / selection formula 太大」，跟 summary buffer 無關。本案是**存檔時**出現、且加字可重現，方向明確指向 summary。

## 為什麼程式寫入最容易撞牆

純 Notes 表單欄位，設計時大概知道哪些該不該進 view。但 XPages、agent、WebQuerySave、後端服務這些**用程式寫文件**的情境，有個預設值很容易忘：[`ReplaceItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD.html) 建出來的新 item，`IsSummary` **預設是 `True`**。

也就是說，這段看起來人畜無害的程式，把一坨 payload 放進了 summary buffer：

```lotusscript
Call doc.ReplaceItemValue("LargePayload", payload)
Call doc.Save(True, False)
```

如果 `LargePayload` 只是 JSON、簽核歷程、外部系統回傳、純備註這類「不需要出現在清單、不拿來排序篩選」的東西，它**根本不該佔用 summary 額度**。每多塞一個這種欄位，64K 就被吃掉一塊，直到某天使用者多打幾個字就爆。

## ODS 是瓶子，LargeSummary 是瓶蓋

這次案例最容易誤判的點：**「DB 都已經是 ODS55 了，怎麼還會中 64K？」**

因為 ODS 跟 LargeSummary 是兩件事：

- **ODS55（瓶子）** 是檔案格式的能力。[官方 ODS55 說明](https://help.hcl-software.com/domino/14.5.1/admin/ods_55_introduced_in_domino_12.html)：Domino 12 起的 ODS55 把單一 summary field 上限提高到 **16 MB**、non-summary 欄位可到約 1 GB、文件最大 4 GB。
- **LargeSummary（瓶蓋）** 是那個能力要不要對「這個資料庫」打開。要靠 `compact -LargeSummary on` 啟用 —— **ODS 升上去不會自動開這個蓋**。

這正是本案的陷阱：資料庫從 R9.0.1 FP6 一路用上來、去年升級到 R12，ODS 跟著升到了 55，但 **LargeSummary 這個旗標從來沒被打開**。`show directory` 一看，果然沒啟用。瓶子換大了，蓋子卻還鎖著。

官方也標了兩個要記住的邊界：

- view 的 **key length + data length 仍不能超過 64KB**（這條 LargeSummary 救不到）。
- 啟用後若文件真的出現大於 **65,406 bytes** 的 item，**pre-R12 的 Notes client / Domino server 可能無法存取** —— 混版環境要留意。

## 解法：先問「這資料該不該是 summary」

不要看到這個錯誤就反射性開 LargeSummary。先問一個問題，再分流：

### 該是 summary → 對資料庫開 LargeSummary

如果這些大欄位**確實需要被 view 顯示、被 DQL / 搜尋取用、被排序分類**，那它們本來就該是 summary，要做的是讓資料庫支援更大的 summary。這也是本案的選擇。

**動手前先確認現況。** 本案我在 server console 用 `show directory`（`sh dir`）確認這個 DB 目前的 LargeSummary 狀態 —— 結果顯示沒啟用，正好對上「ODS 升了、旗標沒開」的判斷。確認是「能力在、開關沒開」之後，才執行：

```text
load compact -c -LargeSummary on "xxx.nsf"
```

官方也有縮寫 `-ls on`。上限從 64K 拉到 16 MB。幾個要記住的：

- **這是結構性維護，不是日常清空間的 compact。** 先確認可回復、選維護時段、確認 replica / cluster / client 版本都接受。舊環境升上來、ODS 升了但旗標沒開，是非常常見的落差。
- ⚠️ **LargeSummary 只對 Domino server 有效。官方明寫「The Notes client's document summary data limit is only 32 KB」** —— 純走 Web / XPages（server 端）沒問題，但若同一批文件也會用 Notes client 開啟編輯，client 端的限制不會因為 server 開了 LargeSummary 而放寬。
- 關閉就是把 `on` 改 `off`，但別當日常開關亂切 —— 已經寫進去的大 summary 不會因為你關掉就自動變安全。

### 不該是 summary → 程式把它設成 non-summary

如果這些大欄位其實是 payload、根本不需要進 view（JSON、簽核全文、外部同步資料、只在詳細頁顯示的長文），那正解不是抬高天花板，而是把它**移出 summary buffer**。

回想開頭那份近 8MB 的文件：它能長到那麼大、卻只有 summary 那一塊爆掉 —— 這正說明大 payload 本來就該待在 non-summary。non-summary 那邊空間多得是（單欄位可到約 1GB、文件可到 4GB），別讓一坨夾檔或大段 JSON 跑去跟只有 64K 的 summary 額度搶位子。寫法是：

```lotusscript
Dim item As NotesItem
Set item = doc.ReplaceItemValue("ExternalPayload", payload)
item.IsSummary = False
```

既有資料則寫一支修正 agent，逐筆把目標 item 取出、改 `IsSummary` 再存回。兩個要注意：

- ⚠️ **別無腦全改。** 只要某欄位被 view column、selection formula、分類、排序或既有程式依賴，改成 non-summary 就會讓清單空白、篩選失效或查詢結果改變。
- ⚠️ **小心被「重設」。** 一個實務上常見的坑：若這份文件之後被「**含該欄位的 Notes 表單**」開啟並存檔，該欄位的 summary 旗標可能被表單定義重新套回預設（變回 summary）。官方屬性頁沒明寫這行為，但混用 client 表單 + 後端程式的環境要特別防。

## 我會怎麼排查

```text
1. 看錯誤發生點：存檔 → 查 item / summary；開 view / 重建索引 → 查 view design
2. 複製問題文件到測試區，少量加字，確認能否穩定跨線重現
3. 列出文件 items，看每個的 ValueLength / Type / IsSummary
4. 確認 DB 的 ODS 版本 + LargeSummary 是否啟用
5. 判斷大 item 到底該不該是 summary
6. 該是 → 開 LargeSummary；不該是 → 改程式 + 修既有資料成 non-summary
```

本案的關鍵就在第 2 步：單欄沒破 32K、但加一點字就爆 —— 這個訊號幾乎等於宣告「這份文件早就貼著某個總量限制在跑」，把方向從「找那個大欄位」拉回「整份 summary 合計」。

**一句話記住這個判斷點：當「每個欄位都沒破限制、但隨便加幾個字就爆」時，問題不在某一個欄位，而在整份 summary 的總量。** 本案那份近 8MB、單欄最大才 26K 的文件，就是這個訊號最大聲的版本 —— 文件多大都不是重點，重點永遠是那 64K 的 summary 額度滿了沒。

## 同類別在其他語言

- **Java（`lotus.domino.Item`）**：同樣有 `isSummary()` / `setSummary()`，概念一致；`getValueLength()` 回的是含 overhead 的內部儲存 bytes，拿來盤點 summary 用量很實用。
- **SSJS / XPages**：後端 `NotesItem` 也有 `IsSummary`。XPages 寫文件時，要留意你的資料來源與最後建立出來的 item 是不是還是 summary。

一句話總結：**這篇的重點不是「看到錯誤就開 LargeSummary」，而是先判斷資料該不該是 summary 資料 —— 該是，就讓資料庫撐得住它；不該是，就把它移出 summary buffer。**
