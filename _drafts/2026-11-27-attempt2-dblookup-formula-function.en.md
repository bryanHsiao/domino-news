---
title: "In-Depth Guide to @DbLookup Function: Retrieving Data from External Databases"
description: "This article provides a comprehensive guide on using the @DbLookup function to retrieve data from external databases, including syntax, parameters, and practical examples."
pubDate: "2026-11-27T12:51:30+08:00"
lang: "en"
slug: "dblookup-formula-function"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Server"
sources:
  - title: "@DbLookup (Formula Language)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_ODBC.html"
  - title: "Accessing data outside the current document and database"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html"
  - title: "Formulas that look for values in columns and views"
    url: "https://help.hcl-software.com/dom_designer/beta/12.0.1/basic/H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_ODBC.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: dblookup-formula-function
-->

## What is the @DbLookup Function?

`@DbLookup` is a formula language function in HCL Domino that allows developers to retrieve data from a specified database and view. This is particularly useful for applications that need to access information from other documents or databases.

## Syntax and Parameters

The basic syntax of `@DbLookup` is as follows:

```formula
@DbLookup( "Notes" : "NoCache" ; server : database ; view ; key ; fieldNameOrColumnNumber )
```

- **"Notes" : "NoCache"**: Specifies that the operation is on a Domino database and does not use caching.
- **server : database**: Specifies the server and database name. Use an empty string ("") to denote the current server or database.
- **view**: The name of the view to query.
- **key**: The key value to match against the first sorted column in the view.
- **fieldNameOrColumnNumber**: The field name or column number to return.

## Usage Example

Suppose we have a database named "Products" containing a view called "AllProducts," where the first column is the product name and the second column is the price. The following formula retrieves the price of the product named "Laptop":

```formula
@DbLookup( "Notes" : "NoCache" ; "" : "Products.nsf" ; "AllProducts" ; "Laptop" ; 2 )
```

In this example:

- **"Notes" : "NoCache"**: Specifies that the operation is on a Domino database and does not use caching.
- **"" : "Products.nsf"**: Denotes the "Products.nsf" database on the current server.
- **"AllProducts"**: The view name.
- **"Laptop"**: The key value to look up.
- **2**: Returns the second column of the view, which is the price.

## Important Considerations

- **Sorting Requirement**: `@DbLookup` relies on the first column of the view being sorted. An unsorted column may lead to unpredictable results.

- **Return Value Limit**: `@DbLookup` can return up to 64KB of data. Exceeding this limit may result in errors.

- **Error Handling**: If the lookup fails, `@DbLookup` returns an error. Use the `@IsError` function to detect and handle such errors.

## Conclusion

`@DbLookup` is a powerful function that enables developers to retrieve data from external databases and views. Understanding its syntax and parameters, along with mindful usage considerations, can significantly enhance the functionality and performance of applications.

For more information, refer to [@DbLookup (Formula Language)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_ODBC.html) and [Accessing data outside the current document and database](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html).
