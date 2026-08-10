---
title: "Handling JSON Arrays with the NotesJSONArray Class"
description: "A comprehensive guide on using the NotesJSONArray class in LotusScript to parse and manipulate JSON arrays, complete with practical examples."
pubDate: "2026-08-11T07:37:33+08:00"
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
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-jsonarray-class
-->

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides a robust set of LotusScript classes to handle JSON data, one of which is the `NotesJSONArray` class. This article explores how to use the `NotesJSONArray` class to parse and manipulate JSON arrays.

## What is NotesJSONArray?

`NotesJSONArray` is a class in LotusScript designed specifically for representing and manipulating JSON arrays. It offers various methods to access and modify elements within the array. To utilize this class, you need to create a `NotesSession` and then parse a JSON string using the `CreateJSONNavigator` method of the `NotesSession` object. Subsequently, you can obtain a `NotesJSONArray` object using the `GetArray` method.

## How to Use NotesJSONArray

Below is an example demonstrating how to use `NotesJSONArray` in LotusScript to parse and manipulate JSON arrays:

```lotusscript
Sub ProcessJSONArray
    Dim session As New NotesSession
    Dim jsonString As String
    Dim jsonNavigator As NotesJSONNavigator
    Dim jsonArray As NotesJSONArray
    Dim jsonElement As NotesJSONElement
    Dim i As Integer

    ' Define JSON string
    jsonString = "[\"Apple\", \"Banana\", \"Cherry\"]"

    ' Parse JSON string
    Set jsonNavigator = session.CreateJSONNavigator(jsonString)

    ' Get JSON array
    Set jsonArray = jsonNavigator.GetArray()

    ' Iterate through array elements
    For i = 0 To jsonArray.Size - 1
        Set jsonElement = jsonArray.GetElement(i)
        Print "Element " & i & ": " & jsonElement.Value
    Next

    ' Append element to array
    Call jsonArray.AppendElement("Date")

    ' Remove first element from array
    Call jsonArray.RemoveElement(0)

    ' Get updated JSON string
    jsonString = jsonNavigator.Stringify()
    Print "Updated JSON String: " & jsonString
End Sub
```

In this code:

1. A JSON string containing three fruit names is defined.
2. The `CreateJSONNavigator` method is used to parse the JSON string, resulting in a `NotesJSONNavigator` object.
3. The `GetArray` method retrieves the `NotesJSONArray` object.
4. The `Size` method determines the array's size, and a loop iterates through each element. The `GetElement` method retrieves each `NotesJSONElement` object, and their values are printed.
5. The `AppendElement` method adds a new element to the end of the array.
6. The `RemoveElement` method deletes the first element of the array.
7. Finally, the `Stringify` method converts the updated JSON object back to a string, and the result is printed.

## Related Classes

When working with JSON data, the `NotesJSONNavigator` and `NotesJSONElement` classes are also essential:

- **NotesJSONNavigator**: This is the primary class for navigating and manipulating JSON structures. It provides methods to access various parts of a JSON object, including arrays and objects.

- **NotesJSONElement**: Represents a single element within a JSON structure, whether it's an object, array, string, number, etc. This class allows access to and modification of individual elements within the JSON data.

By combining these classes, you can effectively parse and manipulate JSON data within LotusScript.

## Conclusion

The `NotesJSONArray` class offers a convenient way to handle JSON arrays in LotusScript. Through the example provided, you can learn how to parse JSON strings, access array elements, and modify array contents. These skills are crucial for developing modern applications within the HCL Domino environment.
