---
title: "Handling JSON Arrays with the NotesJSONArray Class"
description: "Learn how to use the NotesJSONArray class in LotusScript to create, parse, and manipulate JSON arrays."
pubDate: "2026-09-29T10:31:25+08:00"
lang: "en"
slug: "notes-jsonarray-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
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

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino Designer provides the NotesJSONArray class, enabling developers to handle JSON arrays seamlessly within LotusScript. This article explores how to utilize the NotesJSONArray class to create, parse, and manipulate JSON arrays.

## Overview of the NotesJSONArray Class

The NotesJSONArray class is part of HCL Domino Designer, specifically designed for handling JSON arrays. It offers various methods for adding, removing, and accessing elements within an array. For detailed class information, refer to the [NotesJSONArray class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html).

## Creating and Parsing JSON Arrays

The following example demonstrates how to create a JSON array and parse its contents in LotusScript:

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

' Add elements to the JSON array
Call jsonArray.AppendElement("Apple")
Call jsonArray.AppendElement("Banana")
Call jsonArray.AppendElement("Cherry")

' Parse the JSON array
Dim i As Integer
For i = 0 To jsonArray.Size - 1
    Dim element As NotesJSONElement
    Set element = jsonArray.GetElementByIndex(i)
    Print element.Value
Next
```

In this example, we first create a new NotesJSONArray object and add three string elements using the `AppendElement` method. We then iterate through the array using the `GetElementByIndex` method to access and print each element.

## Manipulating JSON Array Elements

The NotesJSONArray class provides several methods to manipulate elements within the array, such as:

- `RemoveElementByIndex(index As Integer)`: Removes the element at the specified index.
- `ReplaceElementByIndex(index As Integer, value As Variant)`: Replaces the element at the specified index with a new value.

The following example demonstrates how to use these methods:

```lotusscript
' Remove the second element (index starts at 0)
Call jsonArray.RemoveElementByIndex(1)

' Replace the first element
Call jsonArray.ReplaceElementByIndex(0, "Apricot")

' Output the updated array
For i = 0 To jsonArray.Size - 1
    Set element = jsonArray.GetElementByIndex(i)
    Print element.Value
Next
```

In this example, we first remove the element at index 1 ("Banana") and then replace the element at index 0 from "Apple" to "Apricot". Finally, we output the updated array contents.

## Integrating with NotesJSONNavigator and NotesJSONElement

When dealing with more complex JSON structures, the NotesJSONNavigator and NotesJSONElement classes are particularly useful. NotesJSONNavigator is used to traverse JSON structures, while NotesJSONElement represents individual elements within the JSON.

The following example demonstrates how to use these classes to parse a JSON string containing an array:

```lotusscript
Dim jsonString As String
jsonString = "{""fruits"": [""Apple"", ""Banana"", ""Cherry""]}"

Dim navigator As NotesJSONNavigator
Set navigator = session.CreateJSONNavigator(jsonString)

' Navigate to the "fruits" array
Dim element As NotesJSONElement
Set element = navigator.GetElementByName("fruits")

If element.IsArray Then
    Set jsonArray = element.Value
    For i = 0 To jsonArray.Size - 1
        Set element = jsonArray.GetElementByIndex(i)
        Print element.Value
    Next
End If
```

In this example, we first create a JSON string containing an array and then use NotesJSONNavigator to parse the string and access the "fruits" array. For detailed class information, refer to the [NotesJSONNavigator class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) and the [NotesJSONElement class documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html).

## Conclusion

By utilizing the NotesJSONArray, NotesJSONNavigator, and NotesJSONElement classes, developers can effectively handle JSON data within LotusScript. These classes provide a rich set of methods to create, parse, and manipulate JSON arrays, enhancing the integration capabilities of applications with modern data formats.
