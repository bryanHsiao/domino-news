---
title: "NotesJSONNavigator: Native JSON Parsing in LotusScript, Without the String Surgery"
description: "Before Domino 10.0.1, parsing JSON in LotusScript meant Evaluate tricks or hand-rolled string surgery. NotesJSONNavigator replaced that with a real parser: session.CreateJSONNavigator gives you a typed tree you navigate with GetElementByName, GetNthElement, and JSON Pointer paths. This article covers the navigator, the element/object/array classes, the type constants, and the naming surprises (GetFirstElement not GetFirstItem; AppendElement takes value-then-name)."
pubDate: 2026-07-18T07:30:00+08:00
lang: en
slug: notes-json-navigator
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesJSONNavigator class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONObject class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONOBJECT_CLASS.html"
  - title: "NotesJSONArray class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
relatedJava: []
relatedSsjs: []
---

If you've been doing Domino long enough, you remember parsing JSON in LotusScript the hard way: `Evaluate` with `@Explode`, or regex-flavoured string surgery that broke the moment a value contained a comma. Since Domino 10.0.1 there's a proper answer — [`NotesJSONNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html), "a LotusScript class used to parse JSON data." It hands you a typed tree of objects, arrays, and values that you navigate directly. The API is clean; the only friction is a couple of naming choices that don't match what you'd guess.

---

## TL;DR

- `Set nav = session.CreateJSONNavigator(jsonString$)` parses JSON into a navigable tree. The input can be an empty string (to build JSON), a JSON string, or a `NotesStream` (**UTF-8 only**). Introduced in **Domino 10.0.1**.
- Navigate with `GetElementByName(name)`, `GetNthElement(index)` (**1-based**), or `GetElementByPointer("/path/to/value")` (JSON Pointer). Each returns a `NotesJSONElement`.
- A `NotesJSONElement` has `Name`, `Type`, and `Value`. When `Type` is object or array, `.Value` **is** a [`NotesJSONObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONOBJECT_CLASS.html) or [`NotesJSONArray`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) you then iterate.
- **Naming surprise #1:** iteration is `GetFirstElement` / `GetNextElement` everywhere — not `GetFirstItem`/`GetItem`.
- **Naming surprise #2:** building JSON, `AppendElement(value, name)` takes the **value first, name second**; serialize the tree with `Stringify()`.

## Parsing and navigating

Create the navigator from a JSON string, then reach values by name, by JSON Pointer, or by iterating:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim nav As NotesJSONNavigator
    Dim el As NotesJSONElement
    Dim arr As NotesJSONArray
    Dim item As NotesJSONElement

    Dim testJSON As String
    testJSON = |{ "variable1":"value1", "variable2":"value2",| _
             & | "myarray":["An","array","of","strings"],| _
             & | "myobject":{"property1":"yourValue1"} }|

    Set nav = session.CreateJSONNavigator(testJSON)

    ' By name -> "value2"
    Set el = nav.GetElementByName("variable2")
    Print "variable2 = " & el.Value

    ' By JSON Pointer -> "yourValue1"
    Set el = nav.GetElementByPointer("/myobject/property1")
    Print "property1 = " & el.Value

    ' Descend into a nested array: the element's Value IS the NotesJSONArray
    Set el = nav.GetElementByName("myarray")
    Set arr = el.Value
    Set item = arr.GetFirstElement()
    While Not (item Is Nothing)
        Print "array item = " & item.Value
        Set item = arr.GetNextElement()
    Wend
End Sub
```

Two things this shows. First, `GetElementByPointer` uses JSON Pointer syntax (`/myobject/property1`) to jump straight to a nested value — far cleaner than descending node by node. Second, the way you go deeper is `element.Value`: when an element's `Type` is object or array, its `Value` isn't a scalar — it's the `NotesJSONObject` / `NotesJSONArray` you then walk.

## The element type system

Every `NotesJSONElement` reports a `Type` you compare against the `JSONELEM_TYPE_*` constants:

| Constant | Value | Meaning |
|---|---|---|
| `JSONELEM_TYPE_OBJECT` | 1 | a JSON object (`Value` is a `NotesJSONObject`) |
| `JSONELEM_TYPE_ARRAY` | 2 | a JSON array (`Value` is a `NotesJSONArray`) |
| `JSONELEM_TYPE_STRING` | 3 | a string |
| `JSONELEM_TYPE_NUMBER` | 4 | a number |
| `JSONELEM_TYPE_BOOLEAN` | 5 | a boolean |
| `JSONELEM_TYPE_UTF8_BYTEARRAY` | 6 | a UTF-8 byte array |
| `JSONELEM_TYPE_EMPTY` | 64 | empty / null |

Note there's no separate `null` type — JSON `null` maps to `JSONELEM_TYPE_EMPTY`. Branch on `Type` before reading `Value` so you know whether you're getting a scalar or a container:

```lotusscript
Select Case el.Type
Case JSONELEM_TYPE_STRING, JSONELEM_TYPE_NUMBER, JSONELEM_TYPE_BOOLEAN
    Print el.Name & " = " & el.Value
Case JSONELEM_TYPE_OBJECT
    Dim obj As NotesJSONObject
    Set obj = el.Value        ' descend
Case JSONELEM_TYPE_ARRAY
    Dim arr As NotesJSONArray
    Set arr = el.Value
End Select
```

`NotesJSONObject` and `NotesJSONArray` each expose `Size` (the element count) plus the same `GetFirstElement` / `GetNextElement` / `GetNthElement` iterators — consistent across the whole family.

## Building JSON — mind the argument order

The navigator produces JSON as well as consuming it. Start with an empty navigator, append, and `Stringify`:

```lotusscript
Dim nav As NotesJSONNavigator
Set nav = session.CreateJSONNavigator("")
Call nav.AppendElement("value1", "variable1")   ' AppendElement(value, name) — value FIRST
Call nav.AppendElement(123, "count")
Print nav.Stringify()                            ' => {"variable1":"value1","count":123}
```

The gotcha is the argument order: `AppendElement(value, name)` — value first, name second, which is the reverse of what most people type on the first try. `AppendArray(name)` and `AppendObject(name)` return a fresh `NotesJSONArray` / `NotesJSONObject` you fill the same way. When you're done, `Stringify()` serializes the whole tree back to a JSON string (there's no `ToJSONString`/`GetJSONString` — the method is `Stringify`).

## What about Java and SSJS?

There's **no direct counterpart** in the Domino APIs, which is worth stating plainly. `lotus.domino` has no `JSONNavigator` class — Java developers reach for a standard library (`com.google.gson`, `org.json`, or `com.ibm.commons.util.io.json`). SSJS/XPages has no `JSONNavigator` object either; it uses the global `fromJson()` / `toJson()` helpers. So `relatedJava` and `relatedSsjs` are empty here — `NotesJSONNavigator` is a LotusScript convenience with no 1:1 mapping, which is a nice reversal of the usual "LS is the poor cousin" framing: for JSON, LotusScript got a purpose-built native parser while the other two lean on general-purpose libraries. (This article is a companion to the [JSON element/array/object deep-dive](/domino-news/en/posts/notes-json-array-element-object).)
