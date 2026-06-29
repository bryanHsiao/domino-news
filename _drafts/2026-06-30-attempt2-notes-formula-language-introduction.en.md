---
title: "Introduction to Notes Formula Language"
description: "An overview of the Formula language in HCL Domino, covering its syntax, usage of @functions and @commands, and applications in forms and views."
pubDate: "2026-06-30T07:26:34+08:00"
lang: "en"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTES_FORMULA_LANGUAGE.html"
  - title: "General syntax rules"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GENERAL_SYNTAX_RULES.html"
  - title: "Formula language"
    url: "https://en.wikipedia.org/wiki/Formula_language"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-formula-language-introduction" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
attempt: 2
slug: notes-formula-language-introduction
-->

## What is the Formula Language?

The Formula language is a scripting language used in HCL Domino, primarily designed for string and list processing. Many language elements start with the @ character, hence it's also known as the @Formula language. It was initially created by Ray Ozzie during the early development of Lotus Notes and has been rewritten and enhanced in subsequent versions.

## Structure of the Formula Language

The Formula language consists of two main components:

- **@Functions**: Used for calculations and simple logic processing.
- **@Commands**: Used to perform actions within the user interface.

@Functions can be utilized in various contexts, such as:

- **Selecting documents**: To determine which documents to display in a view or to select documents for further processing.
- **Providing default values for fields**: To set initial values for fields, transform user-entered data, or validate data.
- **Retrieving values from Notes databases or relational databases**: To provide users with a list of selectable values.
- **Processing a set of documents**: Used in agents to perform actions on each selected document.

@Commands are similar to menu commands and perform actions in the Notes client, such as:

- Opening a Notes database
- Creating an email
- Placing the cursor in a specific data-entry field
- Closing a window
- Starting an agent

## Syntax Rules of the Formula Language

When writing in the Formula language, adhere to the following general syntax rules:

- **Statement separators**: Use semicolons (;) to separate multiple statements.
- **Spaces**: Any number of spaces, including none, can be placed between operators, punctuation, and values. However, keywords must be delineated by at least one space.
- **Case sensitivity**: Case is not significant except within text constants. By convention, keywords are uppercase, and @function and @command names are mixed case.
- **Operators and values**: Two values must be separated by at least one operator.

## Applications in Forms and Views

In form design, you can write the following types of formulas:

- **Default value formulas**: Provide initial values for fields, executed when a document is created.
- **Input translation formulas**: Transform user-entered data after input.
- **Input validation formulas**: Validate data before submission.

In view design, formulas can be used to:

- **Select documents**: Determine which documents appear in the view.
- **Compute column values**: Calculate the values of view columns based on document fields.

## Conclusion

The Formula language is a powerful tool within HCL Domino, allowing developers to implement various functionalities without resorting to more complex programming languages. By understanding its syntax and application scenarios, developers can design and manage Domino applications more effectively.

> References:
> - [Formula Language](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTES_FORMULA_LANGUAGE.html)
> - [General syntax rules](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GENERAL_SYNTAX_RULES.html)
> - [Formula language](https://en.wikipedia.org/wiki/Formula_language)
