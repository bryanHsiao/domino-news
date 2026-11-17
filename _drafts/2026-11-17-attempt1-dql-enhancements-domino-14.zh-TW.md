---
title: "Domino 14 中的 DQL 增強功能"
description: "探索 HCL Domino 14 中對 Domino 查詢語言（DQL）的增強，包括整合全文檢索和支援 Formula Language，提升資料查詢的靈活性與效率。"
pubDate: "2026-11-17T12:58:45+08:00"
lang: "zh-TW"
slug: "dql-enhancements-domino-14"
tags:
  - "Domino Server"
  - "DQL"
  - "Tutorial"
sources:
  - title: "Domino Query Language Overview"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_overview.html"
  - title: "DQL Syntax"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_syntax.html"
  - title: "Full-Text Search in DQL"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_fulltextsearch.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_overview.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: dql-enhancements-domino-14
-->

## Domino 14 中的 DQL 增強功能

HCL Domino 14 引入了對 Domino 查詢語言（DQL）的多項增強，顯著提升了資料查詢的靈活性與效率。以下是主要的改進：

### 整合全文檢索

在 Domino 14 中，DQL 現在支援直接在查詢語句中使用全文檢索語法。這使得開發者能夠在 DQL 查詢中嵌入全文檢索條件，實現更強大的搜尋功能。例如，您可以使用 `@FTSearch('查詢內容')` 或 `@FTS('查詢內容')` 來執行全文檢索。

### 支援 Formula Language

從 HCL Domino 12 開始，DQL 開始支援在查詢語句中使用 Formula Language。這允許開發者在 DQL 查詢中嵌入複雜的公式語法，實現更靈活的資料篩選和計算。例如，您可以使用 `@formula('@doclength < 2500')` 來篩選文件長度小於 2500 的文件。

### 改進的設計目錄管理

在 Domino 11 中，設計目錄現在被維護在各個資料庫的隱藏視圖中，而不再使用單獨的 GQFdsgn.cat 資料庫。這種變化提高了查詢的效率和管理的便利性。新的 `updall` 命令標誌 `-e` 和 `-d` 用於添加和更新設計目錄。

### 使用 `contains` 運算子進行全文檢索

在 Domino 11 中，DQL 引入了 `contains` 運算子，允許對全文索引進行查詢。這通常是執行 DQL 查詢的最快方法。使用 `contains` 運算子時，資料庫必須具有全文索引。

這些增強使得 DQL 在 HCL Domino 14 中成為更強大且靈活的查詢工具，為開發者提供了更高效的資料存取和管理能力。

了解更多關於 DQL 的資訊，請參閱 [Domino 查詢語言概述](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_overview.html) 和 [DQL 語法](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_syntax.html)。
