---
title: "Handling JSON Data in LotusScript with NotesJSONNavigator"
description: "This tutorial introduces how to use the NotesJSONNavigator class in LotusScript to parse and manipulate JSON data, including creating a JSON navigator, appending elements, and traversing JSON structures."
pubDate: "2026-07-09T08:13:33+08:00"
lang: "en"
slug: "notesjsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesJSONNavigator (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesStream (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESSTREAM_CLASS.html"
  - title: "NotesSession (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html" was already cited by [notes-property-broker] on 2026-06-27. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesjsonnavigator-lotusscript-tutorial
-->

## Introduction

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides the `NotesJSONNavigator` class, enabling developers to parse and manipulate JSON data within LotusScript. This article will guide you through using `NotesJSONNavigator` to handle JSON data.

## Creating a NotesJSONNavigator

To create a `NotesJSONNavigator` object, first instantiate a `NotesSession` object and then use the `CreateJSONNavigator` method. Here's an example of creating an empty JSON navigator:

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator("")
```

If you have an existing JSON string, you can pass it during creation:

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator("{"name":"John Doe","age":30}")
```

## Appending Elements to a JSON Object

You can use the `AppendElement` method to add new elements to a JSON object. The following example demonstrates how to create a JSON object with multiple properties:

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator("")

Call jsonNav.AppendElement("John Doe", "name")
Call jsonNav.AppendElement(30, "age")
Call jsonNav.AppendElement(True, "isMember")

MsgBox jsonNav.Stringify(), 0, "JSON Object"
```

The above code will create the following JSON object:

```json
{
  "name": "John Doe",
  "age": 30,
  "isMember": true
}
```

## Appending Arrays and Objects

`NotesJSONNavigator` also allows you to append arrays and nested objects. The following example demonstrates how to append an array and a nested object:

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Dim arr As NotesJSONArray
Dim obj As NotesJSONObject

Set jsonNav = session.CreateJSONNavigator("")

Set arr = jsonNav.AppendArray("hobbies")
Call arr.AppendElement("reading")
Call arr.AppendElement("traveling")

Set obj = jsonNav.AppendObject("address")
Call obj.AppendElement("123 Main St", "street")
Call obj.AppendElement("Anytown", "city")

MsgBox jsonNav.Stringify(), 0, "JSON Object"
```

The above code will create the following JSON object:

```json
{
  "hobbies": ["reading", "traveling"],
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}
```

## Traversing JSON Structures

You can use methods like `GetElementByName`, `GetNthElement`, and `GetElementByPointer` to traverse JSON structures. The following example demonstrates how to access specific JSON elements:

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Dim el As NotesJSONElement

Const testJSON$ = "{"name":"John Doe","age":30,"address":{"street":"123 Main St","city":"Anytown"}}"

Set jsonNav = session.CreateJSONNavigator(testJSON$)

Set el = jsonNav.GetElementByName("name")
MsgBox el.Value, 0, "Name"

Set el = jsonNav.GetElementByPointer("/address/city")
MsgBox el.Value, 0, "City"
```

The above code will display the following message boxes:

```
Name
John Doe
```

```
City
Anytown
```

## Conclusion

By utilizing the `NotesJSONNavigator` class, developers can efficiently parse and manipulate JSON data within LotusScript. This facilitates handling modern data exchange formats in HCL Domino applications. For more detailed information, refer to the [official NotesJSONNavigator documentation](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html).
