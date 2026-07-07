---
title: "Working with NotesForm in LotusScript: A Comprehensive Guide"
description: "This article provides a detailed guide on using LotusScript to work with NotesForm, including accessing forms, reading properties, modifying form content, and practical examples."
pubDate: "2026-07-07T08:10:15+08:00"
lang: "en"
slug: "notesform-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesForm (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESFORM_CLASS.html"
  - title: "Examples: Name property (NotesForm - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NAME_PROPERTY_FORM.html"
  - title: "Forms and Frames - HCL Domino C API Documentation"
    url: "https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Forms_and_Frames/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESFORM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesform-lotusscript-tutorial
-->

## Introduction

In HCL Domino development, forms are essential elements that define the structure and appearance of documents. The `NotesForm` class in LotusScript allows developers to programmatically access and manipulate forms within a database. This article delves into the usage of the `NotesForm` class, providing practical examples to aid understanding.

## Accessing NotesForm

To access a form within a database, you first need to obtain a `NotesDatabase` object and then retrieve the desired `NotesForm` object using the `Forms` property or the `GetForm` method.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm

Set db = session.CurrentDatabase
Set form = db.GetForm("FormName")
```

In this code, the `GetForm` method returns the `NotesForm` object corresponding to the specified form name.

## Reading Form Properties

The `NotesForm` class provides various properties that allow developers to read information about the form. For instance, the `Name` property returns the name of the form.

```lotusscript
Dim formName As String
formName = form.Name
Print "Form Name: " & formName
```

Additionally, the `Fields` property returns a collection of all field names within the form.

```lotusscript
Dim fieldNames As Variant
fieldNames = form.Fields
Forall fieldName In fieldNames
    Print "Field Name: " & fieldName
End Forall
```

## Modifying Form Content

While the `NotesForm` class offers properties and methods to read form information, directly modifying the content of an existing form should be approached with caution. It is generally recommended to use design tools for such modifications rather than programmatically altering the form structure.

## Locking and Unlocking Forms

In multi-user environments, it may be necessary to lock a form to prevent concurrent modifications. The `NotesForm` class provides `Lock` and `UnLock` methods to achieve this.

```lotusscript
Dim lockStatus As Boolean
lockStatus = form.Lock("UserName")
If lockStatus Then
    ' Perform operations requiring the lock
    form.UnLock
Else
    Print "Unable to lock the form"
End If
```

## Deleting a Form

If you need to delete a form from the database, you can use the `Remove` method.

```lotusscript
Call form.Remove
```

Be aware that deleting a form is irreversible and should be performed with caution.

## Conclusion

The `NotesForm` class enables developers to programmatically access and manipulate forms within an HCL Domino database. This article has covered the basics of accessing forms, reading their properties, locking and unlocking, and deleting forms. For more detailed information, refer to the [NotesForm (LotusScript)](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESFORM_CLASS.html) and [Forms and Frames - HCL Domino C API Documentation](https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Forms_and_Frames/).
