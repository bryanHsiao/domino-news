---
title: "Guide to Parsing JSON Data with NotesJSONNavigator"
description: "This guide introduces how to use the NotesJSONNavigator class in LotusScript to parse and manipulate JSON data, with practical examples."
pubDate: "2026-05-02T07:22:58+08:00"
lang: "en"
slug: "notes-json-navigator"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_PROPERTIES.html"
  - title: "NotesJSONNavigator methods"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_METHODS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-query-results-processor] on 2026-04-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-json-navigator
-->

## Introduction

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides the `NotesJSONNavigator` class, enabling developers to parse and manipulate JSON data within LotusScript.

## Overview of NotesJSONNavigator Class

`NotesJSONNavigator` is a LotusScript class designed for traversing and manipulating JSON structures. It offers various methods and properties that facilitate access to different parts of a JSON object.

## Creating an Instance of NotesJSONNavigator

To begin using `NotesJSONNavigator`, you first need to create an instance from a JSON string. Here's an example of how to accomplish this in LotusScript:

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNavigator As NotesJSONNavigator

jsonString = "{\"name\": \"John Doe\", \"age\": 30, \"email\": \"john.doe@example.com\"}"
Set jsonNavigator = session.CreateJSONNavigator(jsonString)
```

In this example, we use the `CreateJSONNavigator` method to create a `NotesJSONNavigator` instance from a JSON string.

## Accessing JSON Data

Once you have a `NotesJSONNavigator` instance, you can use its methods to access JSON data. For example, the following code demonstrates how to retrieve properties from a JSON object:

```lotusscript
Dim name As String
Dim age As Integer
Dim email As String

name = jsonNavigator.GetElementValue("name")
age = CInt(jsonNavigator.GetElementValue("age"))
email = jsonNavigator.GetElementValue("email")

Print "Name: " & name
Print "Age: " & age
Print "Email: " & email
```

In this example, the `GetElementValue` method is used to retrieve the value associated with a specified key.

## Traversing JSON Arrays

If the JSON structure contains arrays, `NotesJSONNavigator` provides methods to traverse array elements. The following example demonstrates how to handle JSON arrays:

```lotusscript
Dim jsonArrayString As String
Dim jsonArrayNavigator As NotesJSONNavigator
Dim i As Integer

jsonArrayString = "[\"apple\", \"banana\", \"cherry\"]"
Set jsonArrayNavigator = session.CreateJSONNavigator(jsonArrayString)

For i = 0 To jsonArrayNavigator.GetCount - 1
    Print jsonArrayNavigator.GetElementValue(i)
Next
```

In this example, the `GetCount` method returns the number of elements in the array, and the `GetElementValue` method is used to access each element's value.

## Conclusion

The `NotesJSONNavigator` class provides LotusScript developers with a powerful tool for parsing and manipulating JSON data. By familiarizing yourself with its methods and properties, you can effectively handle JSON data within HCL Domino applications.

For more information on the `NotesJSONNavigator` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html).
