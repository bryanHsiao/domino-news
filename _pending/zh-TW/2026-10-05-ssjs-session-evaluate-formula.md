---
title: "從 SSJS 跑 @Formula：session.evaluate 的回傳、限制，與「不能改文件」這件事"
description: "你已經有一段 Formula 邏輯——一個 @DbLookup、一段 @Name 格式化——不想在 SSJS 裡重寫一遍。session.evaluate() 讓你直接從 SSJS 跑一段 Formula 字串、把結果拿回來。但它有幾個利角：回傳的是 java.util.Vector（不是純量），公式引用到欄位時要用兩參數版把 document 傳進去，UI 類的 @functions（@Command／@Prompt／@PickList…）在裡面不能用，而且它不能改文件、只能算出結果。這篇整理 session.evaluate 的兩種寫法、回傳與限制，以及要改文件時該怎麼把結果寫回去。"
pubDate: 2026-10-05T07:30:00+08:00
lang: zh-TW
slug: ssjs-session-evaluate-formula
tags:
  - "SSJS"
  - "Formula"
  - "XPages"
sources:
  - title: "evaluate (Session - Java) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EVALUATE_METHOD_JAVA.html"
  - title: "Global objects and functions (JavaScript) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html"
  - title: "Server-side scripting — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html"
relatedJava: []
relatedSsjs: []
---

你手上已經有一段 Formula 邏輯——一個查表的 `@DbLookup`、一段把名字格式化的 `@Name`——在 XPages 裡不想整段用 SSJS 重寫。`session.evaluate()` 就是拿來做這件事的:**從 SSJS 直接跑一段 Formula 字串,把結果拿回來**。

但它有幾個利角,不知道會被咬:回傳的是 `Vector`(不是你以為的純量)、公式引用到欄位時要把 document 傳進去、UI 類的 @functions 在裡面通通不能用,而且——**它不能改文件,只能算出結果**。

這篇把 `session.evaluate` 的兩種寫法、回傳與限制講清楚。

---

## 重點摘要

- **`session.evaluate(formula)` → `java.util.Vector`**:結果放在 Vector 裡,純量結果在**第一個元素**(`firstElement`)。
- **公式引用欄位 → 用兩參數版 `evaluate(formula, doc)`**:把 document 當第二個參數傳進去,公式才取得到欄位值。
- **UI 類 @functions 不能用**:`@Command`、`@Prompt`、`@PickList`、`@DialogBox`、`@PostedCommand`、`@DbName`、`@DbTitle`、`@ViewTitle`、`@DDE*`、`@DbManager` 在 evaluate 裡都失效。
- **不能改文件**:官方明說「You cannot change a document with evaluate; you can only get a result」——要落地,得自己用 `replaceItemValue` 把結果寫回去。
- **SSJS 本來就內建一批 @functions**:很多 @function 在 SSJS 可以直接呼叫,不必透過 evaluate。
- **用途**:重用既有的 Formula(查表、名字格式化)而不用移植成 SSJS。

## session.evaluate：跑一段 Formula、拿回 Vector

官方 [evaluate (Session)](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EVALUATE_METHOD_JAVA.html) 的兩個 signature:

```
public java.util.Vector evaluate(String formula)
public java.util.Vector evaluate(String formula, Document doc)
```

回傳一律是 `java.util.Vector`——「A scalar result is returned in firstElement」。所以就算你的公式只算出一個值,也要從 Vector 的第一個元素取:

```javascript
var v = session.evaluate("@Name([Abbreviate]; @UserName)");
var name = v.firstElement();     // 純量結果在第一個元素
```

## 帶 document：公式引用欄位時

公式裡只要提到欄位名,就得用**兩參數版**、把 document 傳進去,否則取不到值:

```javascript
var doc = currentDocument.getDocument();     // 或任何 NotesDocument
var total = session.evaluate("Qty * UnitPrice", doc).firstElement();
```

不帶 doc 的話,`Qty`、`UnitPrice` 這些欄位名 evaluate 無從解析。

## 兩個限制：UI @functions 不能用、不能改文件

**① UI 類 @functions 失效**。evaluate 是後端計算,沒有前端 UI,所以官方列出這些會影響 UI 的 @function「do not work」:`@Command`、`@DbManager`、`@DbName`、`@DbTitle`、`@DDEExecute`、`@DDEInitiate`、`@DDEPoke`、`@DDETerminate`、`@DialogBox`、`@PickList`、`@PostedCommand`、`@Prompt`、`@ViewTitle`。要跳對話框、下 UI 指令,得走別的路(見 [@Prompt／@PickList](/domino-news/posts/formula-prompt-picklist) 與 [@Command](/domino-news/posts/formula-command-postedcommand),那些也都是 client 前端才有的)。

**② 不能改文件**。這點最容易誤會。官方原話:

> You cannot change a document with evaluate; you can only get a result. To change a document, write the result to the document with a method such as Document.replaceItemValue.

也就是說,公式裡就算寫了 `FIELD X := ...` 之類,evaluate **不會**幫你寫回文件;它只回一個結果。要落地,自己接手:

```javascript
var result = session.evaluate("@Trim(@Name([CN]; Owner))", doc).firstElement();
doc.replaceItemValue("OwnerCN", result);     // 自己寫回去
```

## SSJS 本來就有一批 @functions

不是所有事都得透過 evaluate。SSJS 執行環境([Server-side scripting](https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html) 與 [Global objects and functions](https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html))本身就提供一批 @function,可以在 SSJS 直接呼叫,不必包成字串丟給 evaluate。簡單的格式化、判斷,直接用原生 @function 或 SSJS 語法更直觀;`session.evaluate` 的價值是在**重用一整段既有 Formula**(尤其動態組出來的公式字串、或既有 @DbLookup 邏輯)時。

## 什麼時候用

- **重用既有 Formula 邏輯**(查表、複雜的 @公式)而不想移植 → `session.evaluate`。
- **公式是動態組出來的字串** → evaluate 剛好吃字串。
- **只是簡單格式化／判斷** → 直接用 SSJS 或原生 @function,不必 evaluate。
- **算完要存** → 記得 evaluate 只回結果,自己 `replaceItemValue` 寫回。

## 同類別在其他語言

- **LotusScript**:對應 `Evaluate`(`NotesSession.Evaluate` / 全域 `Evaluate`),語意一樣——回一個陣列、不改文件、UI @function 不能用。站上 [LotusScript Evaluate 那篇](/domino-news/posts/lotusscript-evaluate)講過 LS 版;這篇是 SSJS 版。
- **Java**:`session.evaluate(...)` 本來就是 Java 方法(SSJS 呼叫的就是它),回 `java.util.Vector`,用法一致。
