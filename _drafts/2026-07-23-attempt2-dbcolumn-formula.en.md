---
title: "Retrieving Data from Views Using the @DbColumn Function"
description: "Explore the @DbColumn function in HCL Domino, learning how to retrieve data from views, understand its syntax, parameters, and practical applications."
pubDate: "2026-07-23T08:02:53+08:00"
lang: "en"
slug: "dbcolumn-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Server"
sources:
  - title: "@DbColumn (Domino data source) (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=functions-dbcolumn-domino-data-source-formula-language"
  - title: "Accessing data outside the current document and database"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html"
  - title: "Formula Language Coding Guidelines"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=functions-dbcolumn-domino-data-source-formula-language" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: dbcolumn-formula
-->

## Introduction

In HCL Domino's formula language, the `@DbColumn` function enables developers to retrieve an entire column of values from a specified view or folder within a database. This is particularly useful for applications that require dynamic loading of options or related data.

## Syntax

```plaintext
@DbColumn( class : cache ; server : database ; view ; columnNumber )
```

- `class`: Specifies the type of database. For Domino databases, use "Notes" or an empty string (`""`).
- `cache`: Controls caching behavior. Options are `""` (use cache) or "NoCache" (do not use cache).
- `server`: The server name. For local databases, use an empty string (`""`).
- `database`: The database name, including the path, e.g., "names.nsf".
- `view`: The name of the view or folder.
- `columnNumber`: The number of the column to retrieve, starting from 1.

## Usage Example

Suppose we have a database named "Inventory" containing a view called "Products," where the second column lists product names. The following formula retrieves all values from that column:

```plaintext
@DbColumn(""; "" : "Inventory.nsf"; "Products"; 2)
```

In this example:

- `""`: Indicates using a Domino database with caching enabled.
- `"" : "Inventory.nsf"`: Specifies the local database "Inventory.nsf".
- `"Products"`: The view name.
- `2`: Retrieves the second column of the view.

## Considerations

- **Caching Behavior**: Using caching (`""`) can improve performance, especially when data is stable. To refresh the cache and retrieve the latest data, use "ReCache".

- **Column Numbering**: When determining the column number, exclude columns that display constant values and those containing specific @functions like @DocChildren, @DocDescendants, etc.

- **Security**: Ensure that the current user has appropriate access rights to the target database and view when using `@DbColumn`.

## Limitations

- `@DbColumn` is not applicable in column formulas, selection formulas, or mail agents.

- If the returned data exceeds 64KB, `@DbColumn` may not function correctly.

## Conclusion

The `@DbColumn` function is a powerful tool in HCL Domino's formula language, allowing developers to retrieve entire columns of data from views. By understanding its syntax and parameters, you can effectively use it to dynamically load data, enhancing the flexibility and performance of your applications.

For more detailed information, refer to [@DbColumn (Domino data source) (Formula Language)](https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=functions-dbcolumn-domino-data-source-formula-language) and [Accessing data outside the current document and database](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html).
