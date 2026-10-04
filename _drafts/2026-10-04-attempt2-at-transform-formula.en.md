---
title: "Mastering the @Transform Function in HCL Domino: A Guide to Processing List Elements"
description: "Explore the @Transform function in HCL Domino's formula language to apply specific formulas to each element in a list, returning a processed list."
pubDate: "2026-10-04T10:27:47+08:00"
lang: "en"
slug: "at-transform-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Transform (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language"
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
  - title: "Evaluating Formulas - HCL Domino C API Documentation"
    url: "https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Evaluating_Formulas/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "at-transform-formula" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html" was already cited by [notes-formula-language-introduction] on 2026-09-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: at-transform-formula
-->

In HCL Domino's formula language, the `@Transform` function is a powerful tool that allows developers to apply a specific formula to each element in a list, returning a new list with the processed elements. This is particularly useful for batch processing list elements efficiently.

## Syntax

```
@Transform( list ; variableName ; formula )
```

- **list**: The text, number, or time-date list to be processed.
- **variableName**: The name of a variable used in the formula to refer to the current list element being processed.
- **formula**: A valid formula applied to each element of the input list, which must return a value.

## Usage Examples

### Example 1: Calculating Square Roots

Suppose you have a list of numbers and want to calculate the square root of each number. If the number is negative, return the negative square root of its absolute value.

```
@Transform(OriginalList; "x";
@If(x >= 0; @Sqrt(x); -@Sqrt(@Abs(x))))
```

This formula processes each element `x` in `OriginalList`, returning a new list containing the square root or negative square root of each element.

### Example 2: Adding a Prefix

Suppose you have a text list and want to add an asterisk (*) at the beginning of each element, but only if it doesn't already start with one.

```
FIELD originalCorrected := @Transform(original; "var";
@If(@Begins(var; "*");
var;
"*" + var))
```

This formula creates a new field `originalCorrected` containing the processed list.

## Important Considerations

- If any iteration of the formula returns `@Nothing`, that element is not added to the returned list.
- If any iteration of the formula returns an error, `@Transform` will return an error.

By leveraging the `@Transform` function, developers can efficiently batch process list elements, simplifying code and enhancing performance.

For more detailed information, refer to the [official @Transform function documentation](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language).
