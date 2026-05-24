---
title: "NotesJSONArray / Element / Object: Parsing and Building JSON in LotusScript"
description: "The earlier lotusscript-http-json article walked through NotesHTTPRequest + NotesJSONNavigator — the pairing that brings the entire 'call REST API, get JSON' loop inside LS. This article picks up where that left off, going deep on the three building blocks under the navigator: NotesJSONElement (name/value pair), NotesJSONObject (object node), NotesJSONArray (array node). Full method/property tables, tree-walking patterns for parsing, the reverse path for building JSON via Append* + Stringify, the version-sensitive 64K story (including the 10.0.1 FP2 fixes via SPR# DCONB8VMAV / ASHEB95LFR and the element-value > 64K trap still live on 14.5), and a complete POST-and-parse round-trip example."
pubDate: 2026-05-24T07:30:00+08:00
lang: en
slug: notes-json-array-element-object
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesJSONElement class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
  - title: "NotesJSONObject class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONOBJECT_CLASS.html"
  - title: "NotesJSONArray class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJsonNavigator / Element / Array / Object example — eknori.de"
    url: "https://www.eknori.de/2019-01-01/notesjsonnavigator-notesjsonelement-notesjsonarray-notesjsonobject-example/"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-json-array-element-object.png"
coverStyle: "paper-craft"
---

## TL;DR

- Continues from the earlier [lotusscript-http-json](/en/posts/lotusscript-http-json/) article — going deep on the three building blocks under `NotesJSONNavigator`.
- **Three classes map to the three JSON node types**:
  - `NotesJSONElement` — leaf (name/value pair)
  - `NotesJSONObject` — object `{}` node
  - `NotesJSONArray` — array `[]` node
- **Each one supports both parsing and building** — `GetFirstElement` / `GetNextElement` / `GetNthElement` to walk; `AppendElement` / `AppendArray` / `AppendObject` to construct.
- **Starting point for building JSON**: `session.Createjsonnavigator("")` gives you an empty navigator; after appending, call `.Stringify()` to render JSON text.
- **The 64K limit story is version-sensitive** — both the parse-side 64K cap and the "navigator chokes on CR/LF line endings" problem **were fixed in 10.0.1 FP2** ([SPR# DCONB8VMAV](https://ds-infolib.hcltechsw.com/ldd/fixlist.nsf/(Progress)/10.0.1%20FP2?OpenDocument) / [ASHEB95LFR](https://ds-infolib.hcltechsw.com/ldd/fixlist.nsf/(Progress)/10.0.1%20FP2?OpenDocument)). On 14.5 the only live trap is "**a single element's value exceeding 64K still produces garbled results**" (a LotusScript String engine limit the JSON classes can't route around).

---

## How the three classes relate

Mapping JSON structure to classes:

```json
{                              ← whole thing is an Object
  "name": "Bryan",             ← Element: name="name", value="Bryan"
  "tags": ["Domino", "AI"]     ← Element: name="tags", value=Array
}
```

| Class | JSON shape | Access pattern | Children |
|---|---|---|---|
| `NotesJSONObject` | `{...}` | By name (`GetElementByName`) or position (`GetNthElement`) | Any mix of Elements / Objects / Arrays |
| `NotesJSONArray` | `[...]` | By index (`GetNthElement`) — no names | Any mix of Elements / Objects / Arrays |
| `NotesJSONElement` | `"name": value` | Read `.Name` / `.Value` / `.Type` directly | None — it's a leaf |

`NotesJSONNavigator` is the entry point to the whole tree — once you have the root from it (typically an Object or Array), you walk the tree using these three classes' methods.

---

## NotesJSONElement — the leaf

The simplest: three properties + one method.

| Member | Purpose |
|---|---|
| `.Name` | Element name (meaningful inside an Object; empty inside an Array) |
| `.Type` | Constant flagging what kind of value `.Value` holds (string / number / boolean / null / object / array) |
| `.Value` | The value itself |
| `.Copy(otherEl)` | Copy in the value of another element |

For the exact `.Type` constant values, see the [Designer help page for NotesJSONElement](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html). Production code usually checks `.Type` before reading `.Value`:

```lotusscript
Dim el As NotesJSONElement
Set el = obj.GetElementByName("age")
If el.Type = JSON_TYPE_NUMBER Then  ' actual constant name: check Designer help
    Print "Age is " & CStr(el.Value)
End If
```

---

## NotesJSONObject — the `{}` node

A named key/value collection. **Size + 4 navigation + 3 append + Copy**:

| Member | Purpose |
|---|---|
| `.Size` | Element count |
| `.GetElementByName(name)` | **Most-used** — direct lookup by name |
| `.GetFirstElement()` / `.GetNextElement()` | Walk the whole object (insertion order usually, not strictly guaranteed) |
| `.GetNthElement(n)` | By insertion-order index (1-based or 0-based — check the doc) |
| `.AppendElement(el)` | Add a leaf |
| `.AppendArray(arr)` | Add an array child |
| `.AppendObject(obj)` | Add an object child |
| `.Copy(otherObj)` | Whole-object copy |

Note that `AppendElement` / `AppendArray` / `AppendObject` are three separate methods, not overloads — pick the one matching the type you're appending.

---

## NotesJSONArray — the `[]` node

Nearly the same shape as Object, but **no `GetElementByName`** (arrays don't have names):

| Member | Purpose |
|---|---|
| `.Size` | Array length |
| `.GetFirstElement()` / `.GetNextElement()` | Walk the whole array |
| `.GetNthElement(n)` | By index |
| `.AppendElement(el)` / `.AppendArray(arr)` / `.AppendObject(obj)` | Add a leaf / nested array / nested object |
| `.Copy(otherArr)` | Whole-array copy |

JSON permits mixed-type arrays (`[1, "two", {"three": 3}]`) — the three separate Append methods exist precisely to support that.

---

## Parsing: walking from the navigator

The earlier [lotusscript-http-json](/en/posts/lotusscript-http-json/) piece showed the "HTTP `Get` + `PreferJSONNavigator = True` returns a navigator directly" pattern. Once you have the navigator, three common walks:

### 1. Jump straight to a known field (Object path)

```lotusscript
Dim root As NotesJSONObject
Set root = nav.GetElementByName("data").Value  ' assuming "data" is an object
Dim emailEl As NotesJSONElement
Set emailEl = root.GetElementByName("email")
Print emailEl.Value
```

### 2. Walk a whole object

```lotusscript
Dim el As NotesJSONElement
Set el = obj.GetFirstElement()
Do Until el Is Nothing
    Print el.Name & " = " & CStr(el.Value)
    Set el = obj.GetNextElement()
Loop
```

### 3. Walk an array, pulling fields from each item

```lotusscript
Dim arr As NotesJSONArray
Set arr = root.GetElementByName("users").Value  ' users: [...]
Dim i As Integer
For i = 1 To arr.Size
    Dim user As NotesJSONObject
    Set user = arr.GetNthElement(i).Value
    Print user.GetElementByName("name").Value
Next i
```

> **GetElementByPointer aside**: the navigator also exposes [`GetElementByPointer`](https://www.eknori.de/2019-01-02/notesjsonnavigator-getelementbypointer-example/) (RFC 6901 JSON Pointer syntax) for deep-path direct access — `nav.GetElementByPointer("/data/users/0/email")` is much cleaner than chains of `GetElementByName`.

---

## Building: reverse-direction JSON construction

What the earlier article didn't cover: **these three classes also work in reverse to build JSON**. Starting point:

```lotusscript
Dim session As New NotesSession
Dim nav As NotesJSONNavigator

' Empty object to start
Set nav = session.Createjsonnavigator("")
' Or an empty array:
' Set nav = session.Createjsonnavigator("[]")
```

Then use `Append*` to build structure:

```lotusscript
Dim root As NotesJSONObject
Set root = nav.GetFirstElement().Value  ' grab the root object

' Add a leaf
Dim nameEl As NotesJSONElement
Set nameEl = nav.AppendElement("Bryan")  ' a string
nameEl.Name = "name"
Call root.AppendElement(nameEl)

' Add an array
Dim tagsArr As NotesJSONArray
Set tagsArr = nav.AppendArray()  ' empty array
Call root.AppendArray(tagsArr)
' then call Append* on tagsArr to add items

' Serialize back to a JSON string
Dim jsonStr As String
jsonStr = nav.Stringify()
```

Detailed API quirks (does `AppendElement` take the value or a pre-built element object? are indexes 0-based or 1-based?) are best learned from [eknori's 2019 worked example](https://www.eknori.de/2019-01-01/notesjsonnavigator-notesjsonelement-notesjsonarray-notesjsonobject-example/) — the most complete build-side demo in the community.

---

## Full round-trip: POST and parse

Build a request JSON from user input, POST to an external API, parse the response:

```lotusscript
Sub PostAndParse
    Dim session As New NotesSession
    Dim http As NotesHTTPRequest
    Dim navOut As NotesJSONNavigator
    Dim navIn As NotesJSONNavigator
    Dim root As NotesJSONObject

    ' 1. Build request JSON
    Set navOut = session.Createjsonnavigator("")
    Set root = navOut.GetFirstElement().Value

    Dim el As NotesJSONElement
    Set el = navOut.AppendElement("hello world")
    el.Name = "message"
    Call root.AppendElement(el)

    ' 2. POST it
    Set http = session.CreateHTTPRequest()
    http.PreferJSONNavigator = True
    http.ContentType = "application/json"
    Set navIn = http.Post("https://api.example.com/echo", navOut.Stringify())

    ' 3. Parse response
    Dim respRoot As NotesJSONObject
    Set respRoot = navIn.GetFirstElement().Value
    Dim statusEl As NotesJSONElement
    Set statusEl = respRoot.GetElementByName("status")
    Print "API returned status: " & statusEl.Value
End Sub
```

Full HTTP examples (with error handling, headers, TLS trust store) are in [`lotusscript-http-json`](/en/posts/lotusscript-http-json/) and [`notes-httprequest-14-5-trust-store`](/en/posts/notes-httprequest-14-5-trust-store/).

---

## The 64K limit story — version-sensitive, three layers

This one has more version evolution than most people realize. Worth laying out:

| Version | Parse-side 64K behavior |
|---|---|
| **Before 10.0.1 GA** | `Createjsonnavigator(string)` had a 64K string-parameter cap; anything larger required the NotesStream overload |
| **10.0.1 FP2 onward** | Whole-document JSON > 64K is fine ([**SPR# DCONB8VMAV**](https://ds-infolib.hcltechsw.com/ldd/fixlist.nsf/(Progress)/10.0.1%20FP2?OpenDocument) fixed it); **a single element's value > 64K still produces garbled results** |
| **Any version** | The NotesStream overload — passing the **stream object directly** — is the safest path; **don't `.ReadText()` it into a string first** (you fall back into the string 64K trap) |

For 14.5 environments (which is most readers): the old "parse-side 64K cap" was fixed seven years ago, and "doesn't handle CRLF" was patched in the same release ([**SPR# ASHEB95LFR**](https://ds-infolib.hcltechsw.com/ldd/fixlist.nsf/(Progress)/10.0.1%20FP2?OpenDocument)). **The only live trap left** is ↓

### ⚠️ Single element value > 64K — still alive on 14.5

[eknori's 2019/05/30 follow-up test](https://www.eknori.de/2019-01-01/notesjsonnavigator-notesjsonelement-notesjsonarray-notesjsonobject-example/): after upgrading to 10.0.1 FP2, whole-document > 64K works fine, but **a single element with `.Value` > 64K** (e.g., JSON containing a base64-encoded PDF blob) makes `NotesJSONElement` return "strange results."

Root cause: LotusScript's String engine has its own size limits (same family as the NotesItem 32K text / 64K summary constraints) — **the JSON classes can't route around it**. If your payload is shaped like "meta + a large base64 attachment":

- Split the attachment out into its own HTTP call (multipart or binary stream)
- Or chunk it into an array of slices (< 60K each) and reassemble at the application layer

### NotesStream usage — pass the stream **object**, don't `ReadText` it

[The Designer help page for NotesJSONNavigator](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) lists three overloads: no input / string / NotesStream. The correct NotesStream form:

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Dim nav As NotesJSONNavigator

Set stream = session.CreateStream
Call stream.Open("c:\temp\big.json", "UTF-8")  ' UTF-8 enforced here
stream.Position = 0
Set nav = session.Createjsonnavigator(stream)  ' ← pass the stream object directly
Call stream.Close  ' fine to close once the navigator is built
```

**Common mistake** — `ReadText` the stream into a string first:

```lotusscript
Set nav = session.Createjsonnavigator(stream.ReadText)  ' ❌ falls right back into the string 64K cap
```

A commenter on eknori's article hit exactly this: their original code was `stream.Position = 0; Set jsnav = session.CreateJSONNavigator(stream.ReadText);` and it kept failing — only after switching to passing the stream object directly did it work.

Note also: `stream.Open` with `"UTF-8"` as the second parameter takes care of the "UTF-8 only" concern that used to be a separate caveat (anything coming through the stream is forced to UTF-8). The help page adds: "The NotesStream must be opened when creating the navigator and can be closed as soon as the navigator is created."

### Build / POST side big payloads — also fixed in FP2

`navigator.Stringify()` returns a String which has no real cap (LS String can hold up to 2GB) — the problem used to surface at the next step. `NotesHTTPRequest.Post(url, body)` had its own 64K cap before 10.0.1 ([**SPR# JCORBB2KWU**](https://ds-infolib.hcltechsw.com/ldd/fixlist.nsf/(Progress)/10.0.1%20FP2?OpenDocument), fixed in the same FP2 wave as the parse side). On 14.5 this isn't a concern either.

If you're stuck on an older release and need to POST a large payload, the classic workaround is to drop down to a Java agent or LS2J wrapping Apache HttpClient — pre-V12 `NotesHTTPRequest`'s HTTP stack was fairly bare-bones.

---

## Relationship to the earlier HTTP/JSON article

| Topic | Article |
|---|---|
| How to make the HTTP call, how to set `PreferJSONNavigator`, what the navigator is | [lotusscript-http-json](/en/posts/lotusscript-http-json/) |
| **This article: the three building blocks under the navigator + reverse-direction building** | You're reading it |
| HTTPS trust store details (V14.5+) | [notes-httprequest-14-5-trust-store](/en/posts/notes-httprequest-14-5-trust-store/) |

---

## What about Java and SSJS?

| Language | Equivalent |
|---|---|
| LotusScript | `NotesJSONElement` / `NotesJSONObject` / `NotesJSONArray` |
| Java | `JsonJavaArray` / `JsonJavaObject` / `JsonJavaFactory` (Domino Java API, conceptually parallel) |
| SSJS | Use the JS native `JSON.parse` / `JSON.stringify` — XPages SSJS has first-class JSON support and doesn't need Notes-specific classes |

The SSJS case is flipped: because JS treats JSON as first-class, nobody uses Domino-specific classes there — `JSON.parse(http.responseText)` is enough. LotusScript needs these three classes precisely because LS has no JSON literal syntax of its own, so you need objects to represent JSON structure.
