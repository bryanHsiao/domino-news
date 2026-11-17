---
title: "DQL Enhancements in Domino 14"
description: "Explore the enhancements to Domino Query Language (DQL) in HCL Domino 14, including integration of full-text search and support for Formula Language, enhancing data query flexibility and efficiency."
pubDate: "2026-11-17T12:58:45+08:00"
lang: "en"
slug: "dql-enhancements-domino-14"
tags:
  - "Domino Server"
  - "DQL"
  - "Tutorial"
sources:
  - title: "Domino Query Language Overview"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_overview.html"
  - title: "DQL Syntax"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_syntax.html"
  - title: "Full-Text Search in DQL"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_fulltextsearch.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_overview.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: dql-enhancements-domino-14
-->

## DQL Enhancements in Domino 14

HCL Domino 14 introduces several enhancements to the Domino Query Language (DQL), significantly improving data query flexibility and efficiency. The key improvements include:

### Integration of Full-Text Search

In Domino 14, DQL now supports embedding full-text search syntax directly within query statements. This allows developers to incorporate full-text search conditions into DQL queries, enabling more powerful search capabilities. For example, you can use `@FTSearch('query content')` or `@FTS('query content')` to perform full-text searches.

### Support for Formula Language

Starting with HCL Domino 12, DQL began supporting the use of Formula Language within query statements. This enables developers to embed complex formula syntax into DQL queries, allowing for more flexible data filtering and calculations. For instance, you can use `@formula('@doclength < 2500')` to filter documents with a length less than 2500.

### Improved Design Catalog Management

In Domino 11, the design catalog is now maintained within hidden views of individual databases, replacing the separate GQFdsgn.cat database. This change enhances query efficiency and simplifies management. New `updall` command flags `-e` and `-d` are used to add and update design catalogs.

### Using the `contains` Operator for Full-Text Search

In Domino 11, DQL introduced the `contains` operator, allowing queries against full-text indexes. This is typically the fastest method for executing DQL queries. When using the `contains` operator, the database must have a full-text index.

These enhancements make DQL in HCL Domino 14 a more powerful and flexible query tool, providing developers with more efficient data access and management capabilities.

For more information on DQL, refer to the [Domino Query Language Overview](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_overview.html) and [DQL Syntax](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_syntax.html).
