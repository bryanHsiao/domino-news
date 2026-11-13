---
title: "Implementing JSON Array Handling with NotesJSONArray Class"
description: "A comprehensive guide on utilizing the NotesJSONArray class in LotusScript to parse and manipulate JSON arrays, complete with practical examples for effective JSON data handling."
pubDate: "2026-11-13T11:14:15+08:00"
lang: "en"
slug: "notes-jsonarray-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesJSONArray class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONElement class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonarray-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
attempt: 2
slug: notes-jsonarray-class
-->

## Introduction

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides the NotesJSONArray class, enabling developers to parse and manipulate JSON arrays within LotusScript. This article explores how to utilize the NotesJSONArray class, offering practical examples to assist in effective JSON data handling.

## Overview of NotesJSONArray Class

The NotesJSONArray class in HCL Domino is specifically designed for handling JSON arrays. It offers a suite of methods that allow developers to read, modify, and iterate over elements within a JSON array. For more detailed information, refer to the official documentation on the [NotesJSONArray class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html).

## Creating and Parsing JSON Arrays

To use NotesJSONArray in LotusScript, start by creating a NotesJSONNavigator object and then retrieve the NotesJSONArray from it.

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNavigator As NotesJSONNavigator
Dim jsonArray As NotesJSONArray

jsonString = "[\"apple\", \"banana\", \"cherry\"]"
Set jsonNavigator = session.CreateJSONNavigator(jsonString)
Set jsonArray = jsonNavigator.GetJSONArray()
```

In this code snippet, we create a JSON array containing three string elements and parse it using NotesJSONNavigator. For more details on NotesJSONNavigator, consult the [NotesJSONNavigator class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) documentation.

## Iterating and Reading JSON Array Elements

Once you have a NotesJSONArray object, you can iterate over and read its elements using the following approach:

```lotusscript
Dim i As Integer
Dim element As NotesJSONElement

For i = 0 To jsonArray.Size - 1
    Set element = jsonArray.GetElement(i)
    Print element.Value
Next
```

This code iterates through all elements in the JSON array and prints their values. The NotesJSONElement class provides the Value property to access the element's value. More information can be found in the [NotesJSONElement class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html) documentation.

## Modifying JSON Array Elements

You can also modify elements within a JSON array:

```lotusscript
jsonArray.SetElement(1, "blueberry")
```

This line changes the element at index 1 from "banana" to "blueberry".

## Adding and Removing JSON Array Elements

The NotesJSONArray class provides methods to add and remove elements:

```lotusscript
jsonArray.AppendElement("date")
jsonArray.RemoveElement(0)
```

Here, we first append a new element "date" to the end of the array and then remove the element at index 0, which is "apple".

## Conclusion

By leveraging the NotesJSONArray class, developers can efficiently parse, iterate, modify, add, and remove elements within JSON arrays in LotusScript. This capability simplifies JSON data handling within the HCL Domino environment, making it more intuitive and effective. We hope this guide and its examples assist you in better understanding and utilizing the NotesJSONArray class.
