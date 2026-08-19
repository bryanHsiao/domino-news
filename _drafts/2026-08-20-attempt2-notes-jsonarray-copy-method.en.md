---
title: "Deep Copying with the New Copy Method in NotesJSONArray"
description: "HCL Domino Designer 14.5.1 introduces a new Copy method for NotesJSONArray in LotusScript, enabling deep copying. This article provides a detailed guide on its usage with practical examples."
pubDate: "2026-08-20T07:24:46+08:00"
lang: "en"
slug: "notes-jsonarray-copy-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "What's new in Domino Designer 14.5.1?"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html"
  - title: "NotesJSONArray class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-08-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-08-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-jsonarray-copy-method
-->

## Introduction

In HCL Domino Designer 14.5.1, the LotusScript `NotesJSONArray` class has been enhanced with a new `Copy` method, allowing developers to perform deep copies of JSON arrays. This feature is particularly useful for applications that need to manipulate JSON data without altering the original dataset.

## Overview of the `Copy` Method

The `Copy` method returns a new instance of `NotesJSONArray` containing the same elements as the original array but as independent objects. This ensures that modifications to the new array do not affect the original array.

## Usage Example

Here's an example of how to use the `Copy` method in LotusScript:

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Dim jsonNavigator As NotesJSONNavigator

' Create a new JSON array
Set jsonArray = session.CreateJSONArray
Call jsonArray.AppendElement("Element1")
Call jsonArray.AppendElement("Element2")

' Perform a deep copy using the Copy method
Dim jsonArrayCopy As NotesJSONArray
Set jsonArrayCopy = jsonArray.Copy

' Modify the copied array
Call jsonArrayCopy.SetElement(0, "NewElement1")

' Verify that the original array remains unchanged
Print jsonArray.GetElement(0).Value ' Outputs: Element1
Print jsonArrayCopy.GetElement(0).Value ' Outputs: NewElement1
```

In this example, `jsonArray` contains two elements. By using the `Copy` method, we create a new `jsonArrayCopy` and modify its first element. The output demonstrates that the original `jsonArray` remains unaffected, confirming the deep copy functionality of the `Copy` method.

## Important Considerations

- The `Copy` method is applicable to `NotesJSONArray`, `NotesJSONObject`, and `NotesJSONElement` classes.
- Deep copying ensures that the new instance is entirely independent of the original, making it suitable for scenarios where operations need to be performed without impacting the original data.

## Conclusion

The introduction of the `Copy` method provides greater flexibility in handling JSON data within LotusScript. Developers can now easily perform deep copies of JSON arrays, ensuring the integrity of the original data. For more detailed information, refer to the official documentation for the [NotesJSONArray class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) and the [NotesJSONNavigator class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html).
