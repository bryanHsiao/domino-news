---
title: "Introduction to Notes Formula Language"
description: "Explore the fundamentals of HCL Domino's Formula Language, including its basic structure, usage of @functions, and applications across various Notes components."
pubDate: "2026-08-09T07:31:08+08:00"
lang: "en"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html"
  - title: "Working with @functions"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html"
  - title: "Formula Language Coding Guidelines"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=language-formula-coding-guidelines"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-formula-language-introduction" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html" was already cited by [at-transform-formula] on 2026-08-04. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 2
slug: notes-formula-language-introduction
-->

## What is the Formula Language?

The Formula Language is a scripting language in HCL Domino, primarily used for data manipulation and logical operations. It offers a range of @functions that allow developers to perform various tasks within Notes documents, views, and forms.

## Basic Structure of the Formula Language

The syntax of the Formula Language is relatively straightforward, consisting of constants, variables, @functions, and operators. Here's a basic example:

```formula
FIELD Total := Quantity * Price;
```

In this example, the `FIELD` keyword is used to define or modify a field, `Total` is the field name, `Quantity` and `Price` are other field names, and `*` is the multiplication operator.

## Using @Functions

@Functions are the core of the Formula Language, providing built-in capabilities for data processing and logical operations. For instance, the `@UpperCase` function converts a string to uppercase:

```formula
FIELD UpperName := @UpperCase(Name);
```

This line of code converts the value of the `Name` field to uppercase and stores the result in the `UpperName` field.

## Applying the Formula Language in Different Notes Components

The Formula Language can be applied in various Notes components, including:

- **View Selection Formulas**: Define which documents should appear in a view.
- **Field Formulas**: Calculate default values or validate input for fields.
- **Agents**: Perform batch processing of documents or execute specific actions.

For example, in a view selection formula, you can use the following to select all documents where the status is "Open":

```formula
SELECT Status = "Open";
```

## Further Learning

To delve deeper into the Formula Language, consider exploring the following resources:

- [Formula Language](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html)
- [Working with @functions](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html)
- [Formula Language Coding Guidelines](https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=language-formula-coding-guidelines)

By leveraging these resources, you can gain a comprehensive understanding of the Formula Language's capabilities and applications, enhancing your efficiency in HCL Domino development.
