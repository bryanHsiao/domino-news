---
title: "Working with NotesForm in LotusScript"
description: "A comprehensive guide on using the NotesForm class in LotusScript to access and manipulate forms in HCL Domino databases, including retrieving form names, checking for subforms, and listing all forms."
pubDate: "2026-06-09T07:31:09+08:00"
lang: "en"
slug: "notesform-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesForm (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html"
  - title: "Name (NotesForm - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAME_PROPERTY_FORM.html"
  - title: "IsSubForm (NotesForm - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISSUBFORM_PROPERTY.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesform-lotusscript
-->

## Introduction

In HCL Domino development, forms are fundamental components of database design. The `NotesForm` class in LotusScript allows developers to programmatically access and manipulate forms within a database. This tutorial will demonstrate how to use the `NotesForm` class to retrieve form names, check if a form is a subform, and list all forms in a database.

## Accessing NotesForm

To access forms within a database, first obtain a `NotesDatabase` object and then use its `Forms` property to retrieve a collection of all forms.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm

Set db = session.CurrentDatabase
Forall form In db.Forms
    ' Perform operations on each form here
End Forall
```

In this code, `db.Forms` returns a collection of all forms, and the `Forall` loop iterates through each form.

## Retrieving Form Names

Each `NotesForm` object has a `Name` property that returns the form's name.

```lotusscript
Dim formName As String
formName = form.Name
Print "Form Name: " & formName
```

Note that the `Name` property returns the primary name of the form. If the form has aliases, you can retrieve them using the `Aliases` property.

## Checking for Subforms

The `IsSubForm` property of the `NotesForm` class indicates whether a form is a subform.

```lotusscript
Dim isSub As Boolean
isSub = form.IsSubForm
If isSub Then
    Print "This is a subform"
Else
    Print "This is not a subform"
End If
```

The `IsSubForm` property returns a Boolean value: `True` if the form is a subform, and `False` otherwise.

## Listing All Forms

The following example demonstrates how to list all form names in the current database.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm
Dim formCount As Integer
Dim msgString As String

Set db = session.CurrentDatabase
formCount = 0
msgString = ""
Forall form In db.Forms
    formCount = formCount + 1
    msgString = msgString & Chr(10) & "     " & form.Name
End Forall
Messagebox "This database has " & formCount & " forms:" & msgString
```

This code iterates through all forms in the database, counts them, and displays each form's name.

## Conclusion

By utilizing the `NotesForm` class in LotusScript, developers can effectively access and manipulate forms within HCL Domino databases. Understanding how to use its properties and methods enables efficient form management and enhances development productivity.

For more information on the `NotesForm` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html).
