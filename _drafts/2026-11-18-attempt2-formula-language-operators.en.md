---
title: "Understanding Operators in HCL Domino Formula Language"
description: "This article explores various operators in HCL Domino's formula language, including arithmetic, comparison, logical, and concatenation operators, with practical examples to illustrate their usage."
pubDate: "2026-11-18T12:03:51+08:00"
lang: "en"
slug: "formula-language-operators"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Arithmetic operators"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_ARITHMETIC_OPERATORS.html"
  - title: "Formula Language Rules"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html"
  - title: "Order of evaluation for formula statements"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_ARITHMETIC_OPERATORS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: formula-language-operators
-->

## Overview of Operators in HCL Domino Formula Language

In HCL Domino's formula language, operators are fundamental components that perform various calculations and logical operations. Understanding these operators is crucial for developing efficient and accurate formulas. Below is an exploration of the primary types of operators and their applications.

### Arithmetic Operators

Arithmetic operators perform basic mathematical operations, including addition, subtraction, multiplication, and division.

- `+`: Addition
- `-`: Subtraction
- `*`: Multiplication
- `/`: Division

**Example**:

```lotusscript
result := 10 + 5;  // result is 15
result := 10 - 5;  // result is 5
result := 10 * 5;  // result is 50
result := 10 / 5;  // result is 2
```

Note that division operations may yield decimal results, which should be handled according to your requirements.

### Comparison Operators

Comparison operators compare two values and return a Boolean value (`True` or `False`).

- `=`: Equal to
- `!=` or `<>`: Not equal to
- `>`: Greater than
- `<`: Less than
- `>=`: Greater than or equal to
- `<=`: Less than or equal to

**Example**:

```lotusscript
isEqual := (10 = 5);  // isEqual is False
isGreater := (10 > 5);  // isGreater is True
```

### Logical Operators

Logical operators combine multiple conditions and return a Boolean value.

- `&`: Logical AND
- `|`: Logical OR
- `!`: Logical NOT

**Example**:

```lotusscript
result := (10 > 5) & (5 < 3);  // result is False
result := (10 > 5) | (5 < 3);  // result is True
result := !(10 > 5);  // result is False
```

### Concatenation Operator

The concatenation operator combines two or more strings.

- `+`: Concatenates strings

**Example**:

```lotusscript
fullName := "John" + " " + "Doe";  // fullName is "John Doe"
```

### Operator Precedence

In formula language, operator precedence determines the order in which operations are performed. Generally, the precedence from highest to lowest is as follows:

1. Arithmetic operators: `*`, `/`, `+`, `-`
2. Comparison operators: `=`, `!=`, `>`, `<`, `>=`, `<=`
3. Logical operators: `!`, `&`, `|`

To ensure the desired order of operations, it's advisable to use parentheses explicitly.

**Example**:

```lotusscript
result := (10 + 5) * 2;  // result is 30
```

### Conclusion

Familiarity with the various operators in HCL Domino's formula language and their precedence is essential for writing efficient and accurate formulas. Practicing these operators in real-world scenarios will reinforce your understanding and proficiency.

For more detailed information, refer to the [Arithmetic operators](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_ARITHMETIC_OPERATORS.html) and [Formula Language Rules](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html).
