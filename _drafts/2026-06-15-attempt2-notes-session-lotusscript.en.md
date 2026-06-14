---
title: "NotesSession: The Core Environment Object in LotusScript"
description: "Explore the NotesSession class to learn how to access current user information, environment variables, and databases in LotusScript."
pubDate: "2026-06-15T07:32:44+08:00"
lang: "en"
slug: "notes-session-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesSession (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
  - title: "Initialize (NotesSession - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_INITIALIZE_METHOD_SESSION_COM.html"
  - title: "CreateDateTime (NotesSession - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATEDATETIME_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-session-lotusscript
-->

## Introduction

In LotusScript, the `NotesSession` class represents the environment of the current script, providing access to environment variables, address books, information about the current user, and details about the Notes platform and release number. Understanding and effectively utilizing `NotesSession` is crucial for developing efficient Domino applications.

## Creating a NotesSession Object

To access the current `NotesSession` in LotusScript, use the following syntax:

```lotusscript
Dim session As New NotesSession
```

Alternatively:

```lotusscript
Set session = New NotesSession
```

Since there can only be one session per script, the `New` method returns the same object each time it is called. Note that you should not delete session objects.

## Accessing Current User Information

`NotesSession` provides several properties to access information about the current user:

- `UserName`: Returns the full name of the current user.
- `CommonUserName`: Returns the common name of the current user.
- `EffectiveUserName`: Returns the effective name of the current user, considering factors like agent execution.

For example, the following code displays the current user's name:

```lotusscript
Dim session As New NotesSession
MsgBox "Current user: " & session.UserName
```

## Accessing the Current Database

The `CurrentDatabase` property of `NotesSession` allows you to access the database in which the script is running:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase
MsgBox "Current database: " & db.Title
```

## Creating DateTime Objects

Using the `CreateDateTime` method, you can create a new `NotesDateTime` object representing a specific date and time:

```lotusscript
Dim session As New NotesSession
Dim dt As NotesDateTime
Set dt = session.CreateDateTime("2026/06/14 11:32:32 PM")
MsgBox "Created date-time: " & dt.LSLocalTime
```

## Setting and Getting Environment Variables

`NotesSession` provides methods to set and get environment variables:

- `SetEnvironmentVar`: Sets the value of an environment variable.
- `GetEnvironmentString`: Retrieves the string value of an environment variable.
- `GetEnvironmentValue`: Retrieves the numeric value of an environment variable.

For example, to set and get an environment variable:

```lotusscript
Dim session As New NotesSession
Call session.SetEnvironmentVar("MyVar", "Hello World")
Dim value As String
value = session.GetEnvironmentString("MyVar")
MsgBox "Value of environment variable MyVar: " & value
```

## Conclusion

The `NotesSession` class is central to interacting with the Domino environment in LotusScript. By familiarizing yourself with its properties and methods, you can effectively access user information, environment variables, and databases, enabling the development of robust Domino applications. For more detailed information, refer to the [official NotesSession documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html).
