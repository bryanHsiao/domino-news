---
title: "Mastering the @Transform Function: List Processing in HCL Domino"
description: "Explore the @Transform function in HCL Domino, learning how to apply formulas to each element of a list and return the results as a new list."
pubDate: "2026-08-04T08:11:41+08:00"
lang: "en"
slug: "at-transform-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Transform (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language"
  - title: "Working with @functions"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html"
  - title: "@Nothing"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=functions-nothing"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 2
slug: at-transform-formula
topicOverlap: false
issues:
  [critical] Reference: https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language
      problem: Primary citation points to IBM documentation for Domino Designer 10.0.1. HCL acquired Domino from IBM and maintains its own documentation portal. The authoritative current source is help.hcl-software.com, not ibm.com. Publishing an IBM docs link as the main reference for an HCL Domino article is factually misleading about who owns and maintains the product.
      fix:     Replace with the equivalent HCL documentation URL, e.g. https://help.hcl-software.com/dom_designer/14.0.0/basic/H_TRANSFORM_FORMULA_LANGUAGE.html (verify liveness). Drop the IBM link entirely.
  [critical] Reference: https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=functions-nothing
      problem: The @Nothing reference points to IBM Domino Designer 8.5.3 documentation — a version that is many years out of support. This is both a branding problem (IBM, not HCL) and a version-accuracy problem. Citing an 8.5.3 doc page for a concept being presented as current best practice is not acceptable for publication.
      fix:     Replace with the HCL documentation equivalent for a supported release (12.x or 14.x). Verify the correct URL on help.hcl-software.com.
  [major] Example 3: Filter Specific Elements from a List / @Nothing behaviour
      problem: The article states that @Nothing 'indicates that the element will not be included in the result list' as if this is straightforward. In practice @Nothing inside @Transform removes the element from the output list, but @Nothing's behaviour is context-sensitive: outside of list-building contexts it collapses to an empty string or can cause unexpected results. The article presents filtering via @Nothing as a simple general technique without any caveat about its context-dependence or that the output list will be shorter than the input list (which can break index-parallel list assumptions).
      fix:     Add a note that when @Nothing is returned for one or more elements, the output list will be shorter than the input list. Warn readers that downstream formulas relying on positional correspondence between the original list and the transformed list will break. Also note that @Nothing behaviour is context-sensitive.
  [major] The first returned value determines the data type of the list; subsequent values must be of the same type.
      problem: This is an oversimplification. The behaviour when subsequent iterations return a different type from the first is not simply 'must be the same type' — Domino formula language will attempt coercion in some cases and produce an error in others. Stating it as a hard rule without explaining the coercion/error behaviour could mislead developers into thinking mixed-type results always error, or that coercion is always safe.
      fix:     Clarify that mixed types will cause a type-mismatch error; coercion does not reliably occur across all type combinations. Recommend ensuring the formula always returns a consistent type, and consider adding a note about what happens when @Nothing is the only result (empty list).
  [major] combines the results into a new list … particularly useful for batch processing
      problem: The article frames @Transform purely as a list-transformation tool and does not mention the important alternative of @For/@While loops in formula language for iterative processing, nor does it compare @Transform with the @Explode/@Implode pattern or with computed subforms/column formulas where @Transform is especially common. Readers unfamiliar with formula language may not realise when @Transform is the right tool versus alternatives.
      fix:     Add a brief 'When to use @Transform vs alternatives' section noting @For/@While for stateful iteration, and @Explode/@Implode for string-splitting scenarios. This would make the article genuinely educational rather than just a syntax summary.
  [minor] variableName: The name of a variable representing the list element in the formula.
      problem: The article does not mention that variableName must be passed as a string literal (quoted), not as an actual variable reference. The examples show this correctly, but the parameter description does not make it explicit. A beginner could write @Transform(list; myVar; ...) without quotes and be confused by the error.
      fix:     Add '(must be supplied as a quoted string literal, e.g. "name")' to the variableName parameter description.
  [minor] Article title: Mastering the @Transform Function
      problem: The article is a shallow introduction covering syntax and three basic examples. The word 'Mastering' overpromises significantly. There is no coverage of nested @Transform calls, interaction with multi-value field storage separators, performance considerations on large lists, or use inside column formulas vs. agent formulas.
      fix:     Retitle to something like 'A Practical Introduction to @Transform: List Processing in HCL Domino' or substantially expand the content to justify 'Mastering'.
-->

## What is the @Transform Function?

In HCL Domino's formula language, the `@Transform` function allows you to apply a specific formula to each element of a list, combining the results into a new list. This is particularly useful for batch processing of list elements.

**Syntax:**

```plaintext
@Transform( list ; variableName ; formula )
```

- `list`: The text, number, or time-date list to be processed.
- `variableName`: The name of a variable representing the list element in the formula.
- `formula`: The formula applied to each list element, which must return a value.

**Return Value:**

Returns a list resulting from applying the formula. The first returned value determines the data type of the list; subsequent values must be of the same type.

## Usage Examples

### Example 1: Convert Each Element of a List to Uppercase

Suppose you have a list of names and want to convert each name to uppercase.

```plaintext
@Transform(NamesList; "name"; @UpperCase(name))
```

In this example, the `@UpperCase` function is applied to each element in `NamesList`, resulting in a new list where all names are in uppercase.

### Example 2: Double Each Number in a List

If you have a list of numbers and want to double each number.

```plaintext
@Transform(NumbersList; "num"; num * 2)
```

This returns a new list where each number is twice the corresponding number in the original list.

### Example 3: Filter Specific Elements from a List

You can use `@Transform` in combination with `@If` to filter a list. For example, to remove all elements with the value "N/A" from a list.

```plaintext
@Transform(DataList; "item"; @If(item = "N/A"; @Nothing; item))
```

In this example, the `@If` function checks if each element is "N/A". If it is, `@Nothing` is returned, indicating that the element will not be included in the result list. Otherwise, the element is retained.

## Important Considerations

- If any iteration of the formula returns an error, `@Transform` will return an error.
- If any iteration of the formula returns `@Nothing`, that element will not be added to the returned list.

By mastering the `@Transform` function, you can efficiently process and transform list data in HCL Domino, enhancing the flexibility and functionality of your applications.

**References:**

- [@Transform (Formula Language)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language)
- [Working with @functions](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html)
- [@Nothing](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=functions-nothing)
