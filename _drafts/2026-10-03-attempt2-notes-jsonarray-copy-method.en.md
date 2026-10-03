---
title: "Utilizing the Copy Method of NotesJSONArray: A LotusScript Tutorial"
description: "Explore the Copy method of the NotesJSONArray class, learning how to duplicate JSON arrays in LotusScript with practical code examples."
pubDate: "2026-10-03T09:47:52+08:00"
lang: "en"
slug: "notes-jsonarray-copy-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "HCL Domino Designer 14.5.1 Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/index.html"
  - title: "HCL Domino Designer User Guide and Reference"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/domino_designer_basic_user_guide_and_reference.html"
  - title: "HCL Notes/Domino 14.5.1 is Here – All New Features at a Glance"
    url: "https://www.madicon.de/blog/posts-blog/hcl-notesdomino-1451-is-here-all-new-features-at-a-glance/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonarray-copy-method" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonarray-copy-method
-->

## Introduction

In HCL Domino Designer 14.5.1, LotusScript introduced the `Copy` method for the `NotesJSONArray` class, enabling developers to easily duplicate JSON arrays. This feature is particularly useful for applications that require reusing the same data across different contexts.

## What is NotesJSONArray?

`NotesJSONArray` is a class in LotusScript designed for handling JSON arrays. It provides a suite of methods and properties that allow developers to create, modify, and access the contents of JSON arrays.

## Functionality of the Copy Method

The `Copy` method allows you to create a deep copy of an existing `NotesJSONArray`. This means that the new array has the same content as the original, but they are independent instances; modifications to the new array do not affect the original array.

## Usage Example

Below is an example demonstrating how to use the `Copy` method to duplicate a JSON array and modify its content:

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Dim copiedArray As NotesJSONArray

' Create the original JSON array
Set jsonArray = session.CreateJSONArray
Call jsonArray.AppendElement("Apple")
Call jsonArray.AppendElement("Banana")
Call jsonArray.AppendElement("Cherry")

' Use the Copy method to duplicate the array
Set copiedArray = jsonArray.Copy

' Modify the copied array
Call copiedArray.AppendElement("Date")

' Output the contents of the original and copied arrays
Print "Original array: " & jsonArray.ToString
Print "Copied array: " & copiedArray.ToString
```

In this example, `jsonArray` contains three elements: "Apple", "Banana", and "Cherry". By using the `Copy` method, we create a new `copiedArray` and add "Date" to it. As a result, the original array remains unchanged, while the copied array contains four elements.

## Considerations

- The `Copy` method performs a deep copy, ensuring that the new array is entirely independent of the original.
- Ensure that the original array is properly initialized before using the `Copy` method to avoid potential errors.

## Conclusion

The `Copy` method of the `NotesJSONArray` class provides LotusScript developers with a straightforward and efficient way to duplicate JSON arrays. This functionality allows for the reuse of data across different parts of a program without the risk of altering the original array's content. For more information, refer to the [HCL Domino Designer 14.5.1 Documentation](https://help.hcl-software.com/dom_designer/14.5.1/index.html).
