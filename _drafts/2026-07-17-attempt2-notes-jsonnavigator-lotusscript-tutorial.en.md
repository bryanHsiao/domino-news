---
title: "Handling JSON in LotusScript: A Guide to NotesJSONNavigator"
description: "This tutorial guides you through using the NotesJSONNavigator class in LotusScript to parse and manipulate JSON data, complete with practical examples."
pubDate: "2026-07-17T08:01:41+08:00"
lang: "en"
slug: "notes-jsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino REST API"
sources:
  - title: "HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html"
  - title: "Using Postman and curl - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html"
  - title: "HCL Domino REST API Tutorials | Tutorial for HCL Domino REST API"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonnavigator-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html" was already cited by [hcl-domino-rest-api-update] on 2026-07-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## Introduction

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides the `NotesJSONNavigator` class, enabling developers to parse and manipulate JSON data within LotusScript. This tutorial will guide you through using `NotesJSONNavigator` to handle JSON, complete with practical examples.

## Prerequisites

Before you begin, ensure you have the following:

- HCL Domino server version 12.0.2 or later.
- Familiarity with LotusScript programming.

## Parsing JSON with NotesJSONNavigator

Here's how to use `NotesJSONNavigator` in LotusScript to parse a JSON string:

1. **Create NotesSession and NotesJSONNavigator Instances**

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNav As NotesJSONNavigator
   ```

2. **Load JSON String**

   Suppose we have the following JSON string:

   ```json
   {
     "name": "John Doe",
     "age": 30,
     "email": "johndoe@example.com"
   }
   ```

   We can parse this string using `NotesJSONNavigator`:

   ```lotusscript
   Set jsonNav = session.CreateJSONNavigator(jsonString)
   ```

3. **Access JSON Elements**

   Use the `GetElementByName` method to access specific JSON elements:

   ```lotusscript
   Dim nameElement As NotesJSONElement
   Set nameElement = jsonNav.GetElementByName("name")
   MsgBox "Name: " & nameElement.Value
   ```

   Similarly, you can access other elements:

   ```lotusscript
   Dim ageElement As NotesJSONElement
   Set ageElement = jsonNav.GetElementByName("age")
   MsgBox "Age: " & ageElement.Value

   Dim emailElement As NotesJSONElement
   Set emailElement = jsonNav.GetElementByName("email")
   MsgBox "Email: " & emailElement.Value
   ```

## Modifying JSON Data

You can also use `NotesJSONNavigator` to modify JSON data. For example, updating the `age` value:

```lotusscript
Dim ageElement As NotesJSONElement
Set ageElement = jsonNav.GetElementByName("age")
ageElement.Value = 31
MsgBox "Updated Age: " & ageElement.Value
```

## Converting JSON Back to String

The modified JSON can be converted back to a string:

```lotusscript
Dim updatedJsonString As String
updatedJsonString = jsonNav.Stringify
MsgBox "Updated JSON: " & updatedJsonString
```

## Conclusion

With `NotesJSONNavigator`, developers can easily parse, access, and modify JSON data within LotusScript. This is particularly useful for applications that need to integrate with modern web services. For more detailed information, refer to the [HCL Domino REST API Tutorials](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html).
