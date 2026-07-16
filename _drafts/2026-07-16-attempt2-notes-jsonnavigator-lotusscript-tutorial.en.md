---
title: "Working with NotesJSONNavigator in LotusScript: A Comprehensive Guide"
description: "This tutorial guides you through using the NotesJSONNavigator class in LotusScript to parse and manipulate JSON data, providing practical examples for better understanding."
pubDate: "2026-07-16T08:00:48+08:00"
lang: "en"
slug: "notes-jsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino REST API"
sources:
  - title: "HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-quickstart] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" was already cited by [domino-rest-api-quickstart] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## Introduction

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides the `NotesJSONNavigator` class, enabling developers to parse and manipulate JSON data within LotusScript. This article delves into how to utilize `NotesJSONNavigator`, offering practical examples to enhance understanding.

## What is NotesJSONNavigator?

`NotesJSONNavigator` is a class in LotusScript that allows developers to parse JSON strings and navigate through the JSON data structure in a tree-like manner. With this class, you can easily access properties and values within a JSON object.

## Steps to Use NotesJSONNavigator

1. **Initialize NotesJSONNavigator**

   First, create an instance of `NotesJSONNavigator` and load the JSON string.

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNav As NotesJSONNavigator
   Set jsonNav = session.CreateJSONNavigator(jsonString)
   ```

2. **Traverse the JSON Structure**

   Using `NotesJSONNavigator`, you can iterate through the JSON nodes and access their values.

   ```lotusscript
   Dim element As NotesJSONElement
   Set element = jsonNav.GetFirstElement
   Do Until element Is Nothing
       ' Process the element
       Set element = jsonNav.GetNextElement
   Loop
   ```

3. **Access Specific Properties**

   To access specific properties of a JSON object, use the `GetElementByName` method.

   ```lotusscript
   Dim nameElement As NotesJSONElement
   Set nameElement = jsonNav.GetElementByName("name")
   If Not nameElement Is Nothing Then
       Dim nameValue As String
       nameValue = nameElement.Value
   End If
   ```

4. **Modify JSON Values**

   You can also modify the values within a JSON object and convert it back to a string.

   ```lotusscript
   Call nameElement.SetValue("New Name")
   Dim updatedJsonString As String
   updatedJsonString = jsonNav.ToJSON
   ```

## Practical Example

Suppose we have the following JSON string:

```json
{
    "name": "John Doe",
    "age": 30,
    "email": "john.doe@example.com"
}
```

We want to parse this JSON in LotusScript and modify the `email` property's value.

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
jsonString = "{\"name\": \"John Doe\", \"age\": 30, \"email\": \"john.doe@example.com\"}"

Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator(jsonString)

Dim emailElement As NotesJSONElement
Set emailElement = jsonNav.GetElementByName("email")
If Not emailElement Is Nothing Then
    Call emailElement.SetValue("new.email@example.com")
End If

Dim updatedJsonString As String
updatedJsonString = jsonNav.ToJSON
Print updatedJsonString
```

After executing the above code, `updatedJsonString` will contain the updated JSON string with the modified `email` property value.

## Conclusion

By leveraging `NotesJSONNavigator`, developers can efficiently parse and manipulate JSON data within LotusScript. This capability is particularly beneficial for Domino applications that need to integrate with modern web services. For more information, refer to the [HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/index.html).
