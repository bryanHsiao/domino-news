---
title: "LotusScript's Outbound HTTP / JSON Toolchain: NotesHTTPRequest + NotesJSONNavigator"
description: "Domino V12 added NotesHTTPRequest and NotesJSONNavigator to LotusScript, so calling an external REST API and parsing the JSON response is finally a self-contained LS workflow — no more ActiveX shims or shelling out to curl. This guide covers both classes' methods and properties, the PreferJSONNavigator property that wires them together as an official path, a complete example, and where Java / SSJS land in comparison."
pubDate: 2026-05-07T07:30:00+08:00
lang: en
slug: lotusscript-http-json
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesHTTPRequest class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html"
  - title: "NotesJSONNavigator class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesHTTPRequest.PreferJSONNavigator property — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_preferjsonnavigator_property_HTTPRequest.html"
cover: "/covers/lotusscript-http-json.png"
coverStyle: "risograph"
relatedJava: []
relatedSsjs: []
---

## Why these classes matter starting V12

Before V12, calling an external REST API from LotusScript meant one of:

- routing through COM/ActiveX, borrowing IE or WinHTTP objects,
- using `Shell` to call curl and reading the output file,
- writing a Java agent and using Java's HTTP stack.

Domino V12 baked in two LS classes — [`NotesHTTPRequest`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html) and `NotesJSONNavigator` — that keep the whole "fire HTTP → get JSON → walk fields" workflow inside LotusScript itself. No shims, no out-of-process tools.

## NotesHTTPRequest: making the call

### Construction

Off the `NotesSession`:

```lotusscript
Dim session As New NotesSession
Dim req As NotesHTTPRequest
Set req = session.CreateHTTPRequest()
```

### Methods

Five HTTP verbs plus header / proxy operations:

| Method | Purpose |
|---|---|
| `Get(url)` | GET request |
| `Post(url, body)` | POST request |
| `Put(url, body)` | PUT request |
| `Patch(url, body)` | PATCH request |
| `DeleteResource(url)` | DELETE request (avoids the LS reserved word `Delete`) |
| `SetHeaderField(name, value)` | Set one request header |
| `ResetHeaders` | Clear every header you've set |
| `Setproxy(url)` / `Setproxyuser(user, pwd)` / `Resetproxy` | Use an HTTP proxy |
| `GetResponseHeaders()` | Response headers (call after the request returns) |

### Properties

| Property | Purpose |
|---|---|
| `Maxredirects` | How many redirects to follow |
| `Timeoutsec` | Request timeout in seconds |
| `Responsecode` (read-only) | HTTP status code (200 / 404 / 500 …) |
| `Preferstrings` | International-character output format |
| `PreferUTF8` | UTF-8 handling (auto-set based on other flags) |
| `PreferJSONNavigator` | **The key one**: have the response come back as a `NotesJSONNavigator` object directly |

## NotesJSONNavigator: parsing the response

### Construction

```lotusscript
Dim nav As NotesJSONNavigator
' Three input shapes are accepted: nothing, a string, a NotesStream
Set nav = session.CreateJSONNavigator()                 ' empty — for building with Append* later
Set nav = session.CreateJSONNavigator(jsonString)       ' parse from a string
Set nav = session.CreateJSONNavigator(notesStream)      ' parse from a stream
```

### Methods for walking the JSON tree

| Method | Purpose |
|---|---|
| `GetElementByName(name)` | Fetch a `NotesJSONElement` by name |
| `GetElementByPointer(pointer)` | Fetch a deep element via [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) syntax (e.g. `/items/0/title`) |
| `GetFirstElement()` / `GetNextElement()` | Iterate elements |
| `GetNthElement(n)` | Element by index |
| `Stringify()` | Back to a JSON string |
| `AppendElement` / `AppendArray` / `AppendObject` | Build JSON programmatically |

### Companion classes

NotesJSONNavigator handles the tree as a whole, but individual nodes are typed:

- `NotesJSONElement` — a name/value pair
- `NotesJSONArray` — an array node
- `NotesJSONObject` — an object node

The `Get*Element` methods return these, and you read values off them.

## Wiring the two together: PreferJSONNavigator

The naive flow is "`req.Get(url)` returns a string → feed that string to `CreateJSONNavigator` and parse." There's a trap: **the string return path has a 64K cap.** Any JSON response over 64K silently truncates.

[The `PreferJSONNavigator` property](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_preferjsonnavigator_property_HTTPRequest.html) fixes that — set it to `True` and `Get` / `Post` etc. **return a `NotesJSONNavigator` directly**, with no string intermediary:

```lotusscript
req.PreferJSONNavigator = True
Dim nav As NotesJSONNavigator
Set nav = req.Get("https://api.example.com/items")
' Walk the tree directly
Dim el As NotesJSONElement
Set el = nav.GetElementByPointer("/items/0/title")
```

`NotesJSONNavigator` has no internal 64K limit — that's what the docs mean by "JSONNavigator has no 64k limit unlike HTTPRequest strings." **Whenever the response is JSON, set `PreferJSONNavigator = True`** rather than going through the string path.

## End-to-end example: GET an external API and extract one field

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim req As NotesHTTPRequest
    Set req = session.CreateHTTPRequest()

    ' Headers (API key, Accept JSON)
    Call req.SetHeaderField("Authorization", "Bearer YOUR-TOKEN")
    Call req.SetHeaderField("Accept", "application/json")

    ' Timeout and redirect cap
    req.Timeoutsec = 30
    req.Maxredirects = 3

    ' The important line — get the response as a navigator, not a string
    req.PreferJSONNavigator = True

    Dim nav As NotesJSONNavigator
    Set nav = req.Get("https://api.example.com/v1/users/me")

    ' Check the status code
    If req.Responsecode <> 200 Then
        Print "API error, code = " & req.Responsecode
        Exit Sub
    End If

    ' Pull a deep field with JSON Pointer
    Dim emailEl As NotesJSONElement
    Set emailEl = nav.GetElementByPointer("/profile/email")
    If Not emailEl Is Nothing Then
        Print "User email: " & emailEl.Value
    End If
End Sub
```

Four things worth noticing:

1. **`SetHeaderField` must be called before sending** — order matters.
2. **`Responsecode` is readable after `Get()` returns** — use it to detect failures.
3. **`PreferJSONNavigator = True` must be set before sending** — otherwise you get a string back.
4. **`GetElementByPointer` returns Nothing on miss** — always `Is Nothing` check before using `.Value`.

## What about Java and SSJS?

Domino's **Java API and SSJS don't ship a built-in HTTP client + JSON parser pair** — phrased differently, in this specific area LotusScript is actually more convenient than Java/SSJS:

| Language | Outbound HTTP | JSON parsing |
|---|---|---|
| LotusScript V12+ | `NotesHTTPRequest` (built-in) | `NotesJSONNavigator` (built-in) |
| Java agent | `java.net.http.HttpClient` or Apache HttpClient | Gson / Jackson / `org.json` |
| SSJS (XPages) | Java HttpClient via Java imports | Same, or SSJS `JSON.parse` |

For an existing Domino LS codebase, this pair fills in "the thing you used to need a Java agent for."

## Caveats

1. **64K string ceiling** — the string return path truncates above 64K. Use `PreferJSONNavigator = True` always; for non-JSON large responses, route through a `NotesStream`.
2. **TLS** — defaults to the Domino server's TLS stack; trusting external CAs uses `certstore.nsf` (a server-level setting, separate from NotesHTTPRequest itself).
3. **Synchronous** — `Get` / `Post` block until the response arrives. Set `Timeoutsec` for slow endpoints.
4. **Proxy** — corporate networks: use `Setproxy` / `Setproxyuser`. Don't forget `Resetproxy` when leaving the proxied scope.

## Closing

`NotesHTTPRequest` + `NotesJSONNavigator` + `PreferJSONNavigator = True` is the V12-and-later official path for "LotusScript talks to a REST API." Where you used to need ActiveX or a Java agent, it's now a fully native LS workflow. For shops integrating an existing Domino app with an external SaaS (Slack / Teams / banking / government APIs), this pair drops the entry barrier through the floor.
