---
title: "Formula 的日期運算：@Adjust 加減、@Now/@Today 取現在、@Modified 的兩個版本要分清"
description: "在 formula 裡算日期沒有什麼日期函式庫，就是幾個 @function。加減用 @Adjust（年月日時分秒七個位置、正負皆可）；取現在用 @Now（完整時戳）或 @Today（只到日）；文件時間用 @Created／@Modified。這篇也點兩個坑：@Now 每次都重算、放進 column／selection 公式會拖效能；還有 @Modified（初次修改）和 @ModifiedInThisFile（本檔最後修改）在有 replica 時是兩回事。Formula @function 系列第五篇。"
pubDate: 2026-08-29T07:30:00+08:00
lang: zh-TW
slug: formula-date-time
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Adjust — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADJUST.html"
  - title: "@Now — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOW.html"
  - title: "@Modified — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MODIFIED.html"
cover: "/covers/formula-date-time.webp"
coverStyle: "art-deco"
---

在 formula 裡做日期運算，沒有什麼龐大的日期函式庫——就是幾個 @function。加減日期用一個、取「現在」用一個、拿文件的建立／修改時間又是一個。這篇把它們串起來，並點出兩個很容易踩的坑。

---

## 重點摘要

- **加減用 [`@Adjust`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADJUST.html)**：`@Adjust(日期; 年; 月; 日; 時; 分; 秒; [DST])`——七個位置對應七個單位，不調的填 `0`，正負皆可。
- **取現在**：`@Now` 回完整時戳、`@Today` 只到日。
- **文件時間**：`@Created`（建立）、`@Modified`（修改）。
- **兩個時戳相減 = 相差幾秒**（一個數字）；要加時間才用 `@Adjust`。
- **兩個坑**：`@Now` 每次都重算、放進 column／selection 公式會拖效能；`@Modified` 和 `@ModifiedInThisFile` 在有 replica 時**不是同一件事**。

---

## @Adjust：日期加減的主力

要「三十天後」「一個月前」「兩小時後」，都用 `@Adjust`。官方定義：「Adjusts the specified time-date value by the number of years, months, days, hours, minutes, and/or seconds you specify. The amount of adjustment may be positive or negative.」

七個位置就是七個單位——**年、月、日、時、分、秒**，加上最後一個可選的 `[DST]`（處理日光節約）：

```
@Adjust(Date; 0; 0; 30; 0; 0; 0)      → 30 天後
@Adjust(Date; 0; 1; 0; 0; 0; 0)       → 一個月後
@Adjust(Date; 0; 0; -7; 0; 0; 0)      → 7 天前
@Adjust(@Now; 0; 0; 0; 2; 0; 0)       → 兩小時後
```

不調整的單位一律填 `0`（**都是必填**，不能省）。可以吃單一日期、也可以吃一串日期。負數就是往前。用 `@Adjust` 而不是自己硬算秒數，好處是月底、閏年這些日曆邊界都由它替你算，不必自己處理。

## @Now／@Today：取「現在」

- **[`@Now`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOW.html)**：官方一句「Returns the current time-date」——完整的日期＋時間。預設取本機時間，加 `[SERVERTIME]` 則取 server 的時間（分散式應用要同步時戳時用）。
- **`@Today`**：只到「日」，不含時分秒。

一個要記的坑：**`@Now` 每次公式執行都會重新求值**——它不是一個存下來的定值。官方直接警告：「using @Now in column or selection formulas may impact the efficiency of your application」，還會讓 view 一直顯示「需要重整」。所以在 view 的欄公式、選取公式裡用 `@Now`／`@Today` 要很小心；要「文件建立當下的時間」就該用 `@Created`，不是 `@Now`。

## @Created／@Modified：文件的時間

- **`@Created`**：文件建立的時間。
- **[`@Modified`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MODIFIED.html)**：文件修改的時間。

這裡有一個 replica 環境下的細節值得分清楚。官方對兩個相近函式的定義是：

- `@Modified`「returns a time-date value indicating when the document was modified initially」。
- `@ModifiedInThisFile`「returns a time-date value indicating when the document was last modified in the current file」。

差別在**「這一份檔案」**：同一份文件在不同 replica 裡，`@ModifiedInThisFile` 各自記的是「在這個副本裡最後被改的時間」，可能彼此不同。要判斷「這份文件在我手上這個副本最後動過沒」，用 `@ModifiedInThisFile`；別跟 `@Modified` 混用。

## 取出日期的某一段、算相差

要日期的某個部分，有一組取值函式：`@Year`、`@Month`、`@Day`、`@Hour`、`@Minute`、`@Second`、`@Weekday`（星期幾）。

要算「相差多久」，直接把兩個時戳**相減**——結果是**相差的秒數**（一個數字）：

```
(@Now - Created) / 86400      → 這份文件建立到現在幾天
```

（`86400` 是一天的秒數。）注意方向：**相減得數字（秒差）**、**要往上加時間才用 `@Adjust`**——這兩個別搞混。

## 小結

日期加減用 `@Adjust`（七個單位、正負、必填）、取現在用 `@Now`（完整、每次重算的坑）或 `@Today`、文件時間用 `@Created`／`@Modified`（`@ModifiedInThisFile` 分清 replica）、相差直接相減拿秒數。

下一篇轉到把這些**組起來**的東西：**控制流與變數**——`@If`、`@Do`、暫存變數 `x := ...`、`@While`／`@For`，怎麼把一段複雜公式結構化。
