---
title: "Handling JSON in LotusScript with NotesJSONNavigator"
description: "This tutorial demonstrates how to parse and generate JSON data in LotusScript using the NotesJSONNavigator class, including practical examples and considerations."
pubDate: "2026-07-14T07:56:03+08:00"
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
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html" was already cited by [hcl-domino-rest-api-update] on 2026-07-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## Introduction

In modern application development, JSON (JavaScript Object Notation) has become a standard format for data exchange. HCL Domino provides the `NotesJSONNavigator` class, enabling developers to parse and generate JSON data within LotusScript. This article will guide you through using `NotesJSONNavigator` to handle JSON, complete with practical examples.

## Parsing JSON

To parse a JSON string in LotusScript, you can utilize the `NotesJSONNavigator` class. Here are the steps:

1. **Create a `NotesJSONNavigator` instance**:

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNavigator As NotesJSONNavigator
   Set jsonNavigator = session.CreateJSONNavigator(jsonString)
   ```

2. **Access JSON elements**:

   ```lotusscript
   Dim jsonElement As NotesJSONElement
   Set jsonElement = jsonNavigator.GetElementByName("keyName")
   MsgBox jsonElement.Value
   ```

## Generating JSON

To generate JSON in LotusScript, follow these steps:

1. **Create a `NotesJSONNavigator` instance**:

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNavigator As NotesJSONNavigator
   Set jsonNavigator = session.CreateJSONNavigator()
   ```

2. **Add JSON elements**:

   ```lotusscript
   Call jsonNavigator.AppendElement("keyName", "value")
   ```

3. **Retrieve the JSON string**:

   ```lotusscript
   Dim jsonString As String
   jsonString = jsonNavigator.ToJSON()
   MsgBox jsonString
   ```

## Considerations

- **Error Handling**: Ensure you capture potential errors when parsing JSON, such as invalid JSON formats.
- **Character Encoding**: Verify that the JSON string uses the correct character encoding to avoid parsing errors.

## Conclusion

By leveraging the `NotesJSONNavigator` class, developers can efficiently parse and generate JSON data within LotusScript. This capability is particularly useful for applications that require data exchange with other systems. For more detailed information, refer to the [HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html).
