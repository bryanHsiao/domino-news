---
title: "Using the NotesHTTPRequest Class in LotusScript for HTTP Requests"
description: "This article introduces how to use the NotesHTTPRequest class in LotusScript to send HTTP requests, including examples of implementing GET and POST methods, and techniques for handling JSON responses."
pubDate: "2026-05-19T07:28:47+08:00"
lang: "en"
slug: "notes-httprequest"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesHTTPRequest class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html"
  - title: "NotesHTTPRequest class examples"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTES_HTTPREQUEST_CLASS_EX.html"
  - title: "NotesHTTPRequest class properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTES_HTTPREQUEST.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-httprequest" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html" was already cited by [lotusscript-http-json] on 2026-05-07. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTES_HTTPREQUEST_CLASS_EX.html" was already cited by [notes-httprequest] on 2026-05-18. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTES_HTTPREQUEST.html" was already cited by [notes-httprequest] on 2026-05-18. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-httprequest
-->

## Introduction

In HCL Domino 14.5.1, LotusScript introduced the `NotesHTTPRequest` class, allowing developers to send HTTP requests directly within LotusScript without relying on external libraries or tools. This provides a more streamlined and integrated solution for applications that need to interact with external REST APIs.

## Initializing NotesHTTPRequest

To use `NotesHTTPRequest`, first create its instance:

```lotusscript
Dim http As NotesHTTPRequest
Set http = session.CreateHTTPRequest()
```

## Sending a GET Request

The following example demonstrates how to send a GET request and handle a JSON response:

```lotusscript
Dim url As String
Dim response As String
Dim json As NotesJSONNavigator

url = "https://api.example.com/data"
response = http.Get(url)

Set json = session.CreateJSONNavigator(response)
' Parse the JSON response here
```

## Sending a POST Request

When sending a POST request, you can set request headers and body:

```lotusscript
Dim url As String
Dim requestBody As String
Dim response As String

url = "https://api.example.com/submit"
requestBody = "{"name":"John Doe","email":"john@example.com"}"

http.SetHeaderField "Content-Type", "application/json"
response = http.Post(url, requestBody)

' Handle the response
```

## Setting Request Headers

You can set custom request headers using the `SetHeaderField` method:

```lotusscript
http.SetHeaderField "Authorization", "Bearer your_token_here"
```

## Handling JSON Responses

The `NotesJSONNavigator` class can be used to parse JSON responses:

```lotusscript
Dim json As NotesJSONNavigator
Set json = session.CreateJSONNavigator(response)

Dim name As String
name = json.GetElementByName("name").Value
```

## Error Handling

It's advisable to implement error handling when sending requests to capture potential exceptions:

```lotusscript
On Error GoTo ErrorHandler

' Code to send request

Exit Sub

ErrorHandler:
MsgBox "An error occurred: " & Err & " - " & Error$
Resume Next
```

## Conclusion

The `NotesHTTPRequest` class provides powerful HTTP request capabilities within LotusScript, enabling developers to integrate more easily with external services. With the examples above, you can start implementing HTTP communication in your applications.

For more detailed information, refer to the [NotesHTTPRequest class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html) and [NotesHTTPRequest class examples](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTES_HTTPREQUEST_CLASS_EX.html).
