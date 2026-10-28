---
title: "@Transform 函數的應用指南"
description: "深入探討 @Transform 函數的語法、參數和實際應用，幫助開發者有效地處理列表資料。"
pubDate: "2026-10-28T10:03:25+08:00"
lang: "zh-TW"
slug: "at-transform-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Transform (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language"
  - title: "@Nothing (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=functions-nothing-formula-language"
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/dql_formulalanguage.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "at-transform-formula" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: at-transform-formula
-->

## @Transform 函數的應用指南

在 HCL Domino 的公式語言中，`@Transform` 函數是一個強大的工具，允許開發者對列表中的每個元素應用特定的公式，並返回處理後的新列表。本文將深入探討 `@Transform` 的語法、參數和實際應用，幫助開發者有效地處理列表資料。

### 語法與參數

`@Transform` 的基本語法如下：

```plaintext
@Transform( list ; variableName ; formula )
```

- **list**：要處理的文本、數字或日期時間列表。
- **variableName**：在公式中引用當前列表元素的變數名稱。
- **formula**：應用於每個列表元素的公式，必須返回一個值。

### 返回值

`@Transform` 返回一個新的列表，其中包含對原始列表每個元素應用公式後的結果。返回列表的數據類型由公式的第一個返回值決定，後續返回值必須與之匹配。

### 使用注意事項

- 如果公式的某次迭代返回 `@Nothing`，則該元素不會被添加到返回列表中。
- 如果任何一次迭代的公式返回錯誤，`@Transform` 也會返回錯誤。

### 實際應用示例

1. **計算平方根並保留符號**

   假設有一個包含數字的列表，我們希望對每個數字計算其平方根，並保留原始數字的符號。

   ```plaintext
   @Transform(OriginalList; "x";
   @If(x >= 0; @Sqrt(x); -@Sqrt(@Abs(x))))
   ```

   在此示例中，對於非負數，計算其平方根；對於負數，計算其絕對值的平方根，並添加負號。

2. **處理空列表**

   如果 `OriginalList` 為空，我們希望返回空值而不是錯誤。

   ```plaintext
   @If(OriginalList = @Nothing; @Nothing;
   @Transform(OriginalList; "x";
   @If(x >= 0; @Sqrt(x); -@Sqrt(@Abs(x)))))
   ```

   這樣可以避免在處理空列表時出現錯誤。

3. **過濾負數**

   我們希望僅對非負數計算平方根，並忽略負數。

   ```plaintext
   @If(OriginalList = @Nothing; @Nothing;
   @Transform(OriginalList; "x";
   @If(x >= 0; @Sqrt(x); @Nothing)))
   ```

   在此示例中，對於負數，公式返回 `@Nothing`，因此這些元素不會被添加到返回列表中。

4. **文本處理：添加前綴**

   假設有一個文本列表，我們希望為每個不以星號開頭的元素添加星號前綴。

   ```plaintext
   FIELD originalCorrected := @Transform(original; "var";
   @If(@Begins(var; "*");
   var;
   "*" + var))
   ```

   這樣可以確保所有元素都以星號開頭。

### 結論

`@Transform` 函數為處理列表提供了靈活且高效的方法，允許開發者對列表中的每個元素應用自定義的公式。通過理解其語法和應用場景，開發者可以更有效地處理和轉換列表數據。

有關更多詳細信息，請參閱 [@Transform 函數的官方文檔](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language)。
