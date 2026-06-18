---
title: "Introduction to HCL Notes Formula Language"
description: "Explore the HCL Notes Formula Language, learning how to use @Functions and @Commands in forms and views to enhance application functionality."
pubDate: "2026-06-19T07:38:12+08:00"
lang: "en"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language Coding Guidelines"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html"
  - title: "Formula Language @Functions A-Z"
    url: "https://www.ibm.com/support/knowledgecenter/de/SSVRGU_9.0.0/com.ibm.designer.domino.main.doc/H_7_FORMULAS_FUNCTION_REFERENCE.html"
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTES_FORMULA_LANGUAGE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-formula-language-introduction
-->

## What is the Formula Language?

The Formula Language is a scripting language in HCL Notes, primarily used to perform calculations, data validation, and other logical operations within forms and views. It provides a set of functions known as @Functions and @Commands, enabling developers to manipulate and display data effectively.

## Difference Between @Functions and @Commands

- **@Functions**: These functions perform calculations and logical operations, returning a value. For example, `@UpperCase` converts a string to uppercase, and `@Now` returns the current date and time.

- **@Commands**: These commands execute user interface actions, such as opening documents or switching views. Notably, @Commands are mainly used in user-triggered events like button clicks.

## Using the Formula Language in Forms

In forms, the Formula Language is commonly used for:

- **Field Default Values**: Setting initial values for fields using formulas. For instance, to set a date field to the current date:

  ```
  @Now
  ```

- **Field Input Validation**: Ensuring user input meets specific criteria. For example, to ensure a numeric field's value is greater than zero:

  ```
  @If(NumberField > 0; @Success; @Failure("Please enter a number greater than zero"))
  ```

## Using the Formula Language in Views

In views, the Formula Language is primarily used for:

- **Selection Formulas**: Determining which documents appear in the view. For example, to display only documents with a status of "Approved":

  ```
  Status = "Approved"
  ```

- **Column Formulas**: Calculating and displaying values in columns. For example, to display a full name:

  ```
  LastName + " " + FirstName
  ```

## Commonly Used @Functions

Here are some commonly used @Functions:

- `@UpperCase(text)`: Converts a string to uppercase.
- `@LowerCase(text)`: Converts a string to lowercase.
- `@Length(text)`: Returns the length of a string.
- `@Now`: Returns the current date and time.
- `@Text(number)`: Converts a number to a string.

## Important Considerations

- **Context**: Some @Functions and @Commands are only applicable in specific contexts. For instance, @Commands typically require user-triggered events.

- **Error Handling**: Utilize functions like `@If` and `@Failure` to manage potential errors, ensuring application stability.

By mastering the Formula Language, developers can create more powerful and flexible applications in HCL Notes. For more detailed information, refer to the [Formula Language Coding Guidelines](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html) and [Formula Language @Functions A-Z](https://www.ibm.com/support/knowledgecenter/de/SSVRGU_9.0.0/com.ibm.designer.domino.main.doc/H_7_FORMULAS_FUNCTION_REFERENCE.html).
