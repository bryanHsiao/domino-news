---
title: "The @Exp Function in Formula Language: A Handy Tool for Exponential Calculations"
description: "Explore the @Exp function in HCL Domino Designer's Formula Language and learn how to effectively perform exponential calculations in your applications."
pubDate: "2026-11-22T10:53:21+08:00"
lang: "en"
slug: "formula-language--exp-function"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Exp (Formula Language)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXP.html"
  - title: "Formula Language Rules"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html"
  - title: "Using @functions"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_WAYS_TO_USE_FUNCTIONS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXP.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: formula-language--exp-function
-->

## Introduction

In HCL Domino Designer's Formula Language, the `@Exp` function is a powerful tool for calculating the constant e (approximately 2.718282) raised to a specified power. This is particularly useful in applications requiring exponential computations.

## Syntax of @Exp Function

```formula
@Exp( power )
```

- **power**: A number or list of numbers representing the exponent to which e is raised. Note that Notes/Domino can only compute this function when the number is between -11355.1371 and 11356.5234. Values outside this range will return the value `@ERROR`.

## Return Value

The function returns a number or list of numbers representing e raised to the specified power.

## Usage Examples

1. Calculating e raised to the power of 1.25:

   ```formula
   @Exp(1.25)
   ```

   Returns approximately 3.49034295746184.

2. Calculating e raised to the power of -1.25:

   ```formula
   @Exp(-1.25)
   ```

   Returns approximately 0.28650479686019.

3. Calculating e raised to the powers of 1.25 and -1.25, returning a list:

   ```formula
   @Exp(1.25 : (-1.25))
   ```

   Returns a list containing approximately 3.49034295746184 and 0.28650479686019.

## Important Considerations

- If the parameter is a list, the `@Exp` function operates on each element of the list, returning a list with the same number of elements.

- Ensure that the input values are within the permissible range to avoid returning `@ERROR`.

## Conclusion

The `@Exp` function is invaluable for performing exponential calculations within Formula Language applications. By understanding its syntax and usage, developers can effectively implement complex mathematical operations in HCL Domino Designer.

For more information, refer to the [@Exp (Formula Language)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXP.html) and [Formula Language Rules](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html).
