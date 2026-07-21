---
title: "DQL view 日期直欄查詢：型別與時區怎麼無聲吃掉你的結果（三個成因）"
description: "「直欄轉成日期反而有些抓得到有些沒抓到，蠻怪的。」一篇實測報告：一個 DQL view 直欄日期查詢結果不一致，拆開來發現有三個獨立成因。DQL 從不自動轉型（所以直欄的輸出型別要跟查詢詞相符）、底層欄位存了文字與日期混型、而 @dt 不帶時區位移就是 UTC——它會在不改變總筆數的情況下弄壞邊界文件。兩個解法皆實測 6/6 全中。"
pubDate: 2026-07-20T07:30:00+08:00
lang: zh-TW
slug: dql-view-date-column
tags:
  - "DQL"
  - "Tutorial"
sources:
  - title: "DQL: date and time — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_date_and_time.html"
  - title: "DQL syntax — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_syntax.html"
  - title: "DQL view column lookups — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html"
  - title: "實測報告：DQL view 日期直欄型別與時區案例（domino-dev-kb）"
    url: "https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-view-date-column/"
relatedJava: ["DominoQuery"]
relatedSsjs: ["DominoQuery"]
cover: "/covers/dql-view-date-column.webp"
coverStyle: "paper-craft"
---

一位工程師帶著一個謎題來找我：「我把 view 直欄轉成日期、用它查詢——但有些文件抓得到、有些抓不到，蠻怪的。」一個對*部分*文件有效的 DQL 日期查詢是最糟的那種 bug，因為它看起來像是會動。我們用單一變數的測試把它拆開，結果那「一個怪 bug」是**三個獨立成因**疊在一起。每一個都無聲失敗——沒有錯誤，只有一個你根本不會去質疑的錯誤筆數。

這就是那篇實測報告。完整的[八組查詢實測矩陣在知識庫案例裡](https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-view-date-column/)；這裡講每個成因是什麼、怎麼拆彈。（環境：Domino 12.0.2，一個 412 份文件的測試資料庫——404 份真實混型文件加 8 份控制組。）

---

## 重點摘要

- **DQL 從不自動轉型。** 你查詢詞的型別必須跟 **view 直欄的最終輸出型別**相符——`'...'` 查文字、`@dt(...)` 查日期。型別不符不報錯；它默默回 0 筆。
- 看直欄公式的*輸出*：`@If(@IsText(x); x; @Text(...))` **兩個分支都輸出文字**，所以那是一個**文字**直欄——用 `'...'` 查、不是 `@dt`。
- **混型來源資料：** 如果底層欄位在部分文件把日期存成文字、部分存成 datetime，`@dt` 查詢只中 datetime 那批。實測中一個 6 份的集合回傳 **4**——文字型那些消失了。404 份真實文件裡有數十筆文字日期、橫跨好幾年，代表有一條輸入路徑還在寫文字日期。要清資料*也要*修源頭。
- **時區陷阱（危險的那個）：** `@dt('...T00:00:00Z')` 沒帶 `+08:00` 位移就是 **UTC**。實測中它回傳同樣的總筆數（6），但一份邊界文件漏抓、另一份誤抓——只驗筆數根本抓不到。你必須逐筆核對邊界文件。
- view 直欄搜尋拒絕只給日期的 `@dt`：`Partial TIMEDATEs NOT supported with view column lookup, specify a full TIMEDATE`。
- **兩個解法，皆實測 6/6：**（A）強制一個補零的 `yyyy/mm/dd` 文字直欄、以文字比較，或（B）用 `@TextToTime` 全部統一成 datetime、以帶 `+08:00` 的完整 timestamp 查詢。

## 成因一：鐵律——DQL 比對型別，不轉換型別

這是其他一切所依賴的鐵律。當你寫一個 view 直欄的 DQL 查詢詞，*你寫的值的型別*決定被搜尋的是什麼型別。文件講得很白——「被搜尋的資料型別，由查詢中指定的資料型別決定」。寫 `'2024/01/01'` 你就在查**文字**；寫 `@dt('2024-01-01T00:00:00+08:00')` 你就在查一個 **datetime**。如果直欄不輸出那個型別，DQL 不轉、也不抱怨——它就是什麼都找不到。

這是 [DQL view 直欄查詢](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html)背後的規則，而微妙處在於：讀直欄公式要看它的*輸出*型別、不是輸入。很多人為了「兩種情況都處理」而寫的公式——

```
@If(@IsText(DocDate); DocDate; @Text(DocDate))
```

——**兩個分支都輸出文字**。它就是文字直欄、沒得商量，即使那個欄位「有時是日期」。用 `@dt` 查它，你默默拿到 0。所以第一個診斷問題永遠是：*這個直欄的公式實際上輸出什麼型別？*

## 成因二：混型來源資料

就算查詢型別對了，如果*來源欄位*本身型別不一致，你還是會掉文件。測試資料庫裡 `DocDate` 欄位在 404 份真實文件裡**同時**存了字串與 datetime——正是原本那個直欄公式會有 `@IsText(DocDate)` 分支的原因。重現它（一個混型直欄用 `@dt` 查）回傳 **6 份中的 4 份**：datetime 型的中了、文字型的無聲掉出去。

兩個心得。第一，這裡的部分結果不是「有些文件是錯的」——是「另一種型別的文件對這個查詢型別是隱形的」。第二，數十筆文字日期散在好幾年，代表這不是一次性的匯入異常；**有東西還在寫文字日期**。清既有資料能解決今天；找出並修好輸入路徑才能止住它復發。

## 成因三：改變成員卻不改變筆數的時區

這是能撐過隨手測試的那個。依 [DQL 日期與時間文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_date_and_time.html)，「沒有時區修飾符（+ 或 – hh:mm 後綴）時，所有時間都被當成 UTC 值（GMT）」。所以 `@dt('2024-01-01T00:00:00Z')`——或任何你沒帶 `+08:00` 寫的 `@dt`——問的是 **UTC 午夜**，在台北是那天早上 08:00。正好落在日界的文件就落到錯的一邊。

實測裡最惡劣的部分：漏帶 `+08:00` 回傳**跟正確查詢一樣的總筆數**——兩邊都是 6——但一份*應該*中的邊界文件（T1）被排除、一份*不該*中的（T4）被納入。如果你的測試是「我拿到預期的列數了嗎？」，這會過關。唯一能抓到的方法，是**逐筆核對邊界文件**、不是看筆數。

## partial-TIMEDATE 錯誤

實驗時你會撞到的一道相關的牆：只給日期的 `@dt` 對 view 直欄查詢根本不能用。`'myview'.datefield < @dt('2024-01-01')` 會報：

> Partial TIMEDATEs NOT supported with view column lookup, specify a full TIMEDATE

文件用比較溫和的話說同一件事——「partial date 值無法用 view 搜尋找到」——並給修法：「指定完整的值，例如 `@dt('2018-09-01T00:00:00.000Z')`。」對 view 查詢你永遠給完整的 timestamp（而且依成因三，把真正的位移帶上去）。

## 兩個解法——皆實測 6/6

**解法 A——把直欄正規化成補零文字、以文字比較。** 陷阱是 `@Text(@Date(...))` 跟著機器的地區設定走、可能*不*補零（它產出 `2024/1/5`，排序與比較都會錯）。所以你在公式裡強制補零：

```
_d := @If(@IsText(DocDate); @TextToTime(DocDate); DocDate);
@Text(@Year(_d)) + "/" + @Right("0" + @Text(@Month(_d)); 2) + "/" + @Right("0" + @Text(@Day(_d)); 2)
```

然後對那個直欄以文字查詢：

```
'viewName'.$123 >= '2024/01/01'
```

補零的 `yyyy/mm/dd` 文字會依時序排序，所以範圍比較會對。實測結果：**6/6**。

**解法 B——統一成 datetime、以帶位移的完整 timestamp 查詢。** 在直欄裡把混型收斂成真正的日期，然後永遠傳完整的 `@dt`：

```
@If(@IsText(DocDate); @TextToTime(DocDate); DocDate)
```

```
'viewName'.$123 >= @dt('2024-01-01T00:00:00+08:00')
```

實測結果：**6/6**，並在查詢計畫裡確認走了索引。兩個解法都行；直欄本來就要顯示就挑文字正規化，下游需要真正日期運算就挑 datetime。

## 還有一個值得排除的第四成因

如果做完這一切、查詢還是短少，還有一個跟型別或時區都無關的無聲篩選：當 view 的**選取公式不是 `@All`**，被那個選取排除的文件根本不在 view 裡、DQL 找不到——又一種讓列「消失」而不報錯的方式。那個機制是姊妹篇 [DQL @All 踩坑筆記](/domino-news/zh-TW/posts/dql-pitfalls)的主題；當筆數不對、型別卻對時，它是第四個要檢查的東西。

## 同類別在其他語言

| 語言 | DQL 進入點 |
|---|---|
| LotusScript | `NotesDominoQuery`（`db.CreateDominoQuery()`）|
| Java | `lotus.domino.DominoQuery` |
| SSJS / XPages | 透過 Java 後端的 `DominoQuery` |

DQL 是一個查詢引擎、經由各語言的薄包裝抵達，所以這些都不是語言特有的：型別比對規則、`@dt` 的 UTC 預設、view 查詢的完整-timestamp 要求，不管你用 LotusScript、Java 或 SSJS 建查詢都一樣。查詢語言本身的入門見 [DQL 入門](/domino-news/zh-TW/posts/dql-getting-started)。
