---
title: "Introduction to Notes Formula Language"
description: "This article introduces the Formula language in HCL Domino, covering its basic structure, usage of @Functions and @Commands, and how to implement dynamic behavior in applications."
pubDate: "2026-09-28T09:27:56+08:00"
lang: "en"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
  - title: "Formula Language Coding Guidelines"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=language-formula-coding-guidelines"
  - title: "Formula Language @Functions A-Z"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTES_FORMULA_LANGUAGE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-formula-language-introduction" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-formula-language-introduction
-->

## What is the Formula Language?

The Formula language is a scripting language in HCL Domino, primarily used to perform calculations, logical evaluations, and data manipulations within Notes applications. It consists of two main components: @Functions and @Commands.

- **@Functions**: Used for calculations and logical operations, returning a value. For example, the `@Length` function calculates the length of a string.

- **@Commands**: Used to perform user interface actions, such as opening databases or creating emails.

## Basic Structure of the Formula Language

The syntax of the Formula language is relatively simple, mainly comprising expressions and functions. Here's a basic example:

```formula
@If(@IsNewDoc; "New Document"; "Existing Document")
```

In this example, the `@If` function determines whether the document is new and returns "New Document" or "Existing Document" accordingly.

## Using @Functions

@Functions are the core of the Formula language, providing various built-in functions for specific calculations or logical operations. Some commonly used @Functions include:

- `@Length(text)`: Returns the length of a string.
- `@UpperCase(text)`: Converts a string to uppercase.
- `@Date(year; month; day)`: Creates a date value.

For instance, the following formula calculates the length of the "Subject" field:

```formula
@Length(Subject)
```

## Using @Commands

@Commands are used to perform user interface actions and are typically employed in buttons or menu options. Some commonly used @Commands include:

- `@Command([Compose]; "Memo")`: Creates a new email.
- `@Command([OpenView]; "All Documents")`: Opens the "All Documents" view.

For example, the following formula creates a button that, when clicked, opens the "All Documents" view:

```formula
@Command([OpenView]; "All Documents")
```

## Adding Formulas to Applications

In HCL Domino Designer, you can use the Formula language in various places to implement dynamic behavior:

- **Field Formulas**: Set default values or validate input for fields.
- **Button Formulas**: Define actions to execute when a button is clicked.
- **Agents**: Process documents in bulk or perform scheduled tasks.

For example, you can use the following formula in a field's "Default Value" property to set the current date:

```formula
@Today
```

## Conclusion

The Formula language is a powerful and flexible tool in HCL Domino, allowing developers to implement various dynamic behaviors within applications. By familiarizing yourself with its syntax and functions, you can effectively enhance the functionality and user experience of Notes applications.

For more detailed information, refer to the [Formula Language](https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html) and [Formula Language Coding Guidelines](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=language-formula-coding-guidelines).
