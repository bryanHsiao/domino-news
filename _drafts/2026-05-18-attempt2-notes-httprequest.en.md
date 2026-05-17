---
title: "Using NotesHTTPRequest in LotusScript for HTTP Requests"
description: "This tutorial introduces how to use the NotesHTTPRequest class in LotusScript to send HTTP requests, including implementations of GET and POST methods, and examples of handling JSON responses."
pubDate: "2026-05-18T07:24:04+08:00"
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
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html" was already cited by [lotusscript-http-json] on 2026-05-07. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-httprequest
-->

## Introduction

In HCL Domino version 12.0.2, LotusScript introduced the `NotesHTTPRequest` class, allowing developers to send HTTP requests directly within LotusScript without relying on external libraries or tools. This facilitates integration with external REST APIs.

## Initializing NotesHTTPRequest

To use `NotesHTTPRequest`, first create its instance:

```lotusscript
Dim http As NotesHTTPRequest
Set http = session.CreateHTTPRequest()
```

## Sending a GET Request

The following example demonstrates how to send a GET request and handle the response:

```lotusscript
Dim url As String
Dim response As String

url = "https://api.example.com/data"
response = http.Get(url)

If http.ResponseCode = 200 Then
    ' Process the response content
    MsgBox "Data retrieved successfully: " & response
Else
    MsgBox "Request failed, status code: " & CStr(http.ResponseCode)
End If
```

In this example, `http.Get(url)` sends a GET request to the specified URL and stores the response content in the `response` variable. `http.ResponseCode` checks the HTTP status code to ensure the request was successful.

## Sending a POST Request

The following example demonstrates how to send a POST request with a JSON payload:

```lotusscript
Dim url As String
Dim payload As String
Dim response As String

url = "https://api.example.com/submit"
payload = "{ ""name"": ""John Doe"", ""email"": ""john@example.com"" }"

http.SetHeader "Content-Type", "application/json"
response = http.Post(url, payload)

If http.ResponseCode = 201 Then
    MsgBox "Data submitted successfully."
Else
    MsgBox "Submission failed, status code: " & CStr(http.ResponseCode)
End If
```

In this example, `http.SetHeader` sets the request's `Content-Type` to `application/json`, and `http.Post(url, payload)` sends a POST request with the JSON-formatted data as the payload.

## Handling JSON Responses

Combining `NotesHTTPRequest` with `NotesJSONNavigator` allows for easy parsing of JSON responses. The following example demonstrates how to parse a JSON response:

```lotusscript
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator(response)

Dim name As String
Dim email As String

name = jsonNav.GetElementByName("name").Value
email = jsonNav.GetElementByName("email").Value

MsgBox "Name: " & name & ", Email: " & email
```

In this example, `session.CreateJSONNavigator(response)` parses the JSON response, and the `GetElementByName` method extracts the values of specific fields.

## Conclusion

The `NotesHTTPRequest` class provides powerful HTTP request capabilities within LotusScript, enabling developers to integrate directly with external REST APIs. By combining it with `NotesJSONNavigator`, handling JSON responses becomes straightforward, extending the functionality of Domino applications.

For more information on the `NotesHTTPRequest` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html).

> References:
> - [NotesHTTPRequest class](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html)
> - [NotesHTTPRequest class examples](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTES_HTTPREQUEST_CLASS_EX.html)
> - [NotesHTTPRequest class properties](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTES_HTTPREQUEST.html)
