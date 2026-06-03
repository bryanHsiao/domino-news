---
title: "Executing Notes/Domino Formulas in LotusScript Using the Evaluate Function"
description: "This tutorial explains how to execute Notes/Domino formulas in LotusScript using the Evaluate function, with practical examples."
pubDate: "2026-06-04T07:37:15+08:00"
lang: "en"
slug: "notes-evaluate-function"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "Using the Evaluate statement"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_EVALUATE_STATEMENT.html"
  - title: "Formula Language Rules"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=language-formula-rules"
  - title: "Formula Language @Functions A-Z"
    url: "https://www.ibm.com/support/knowledgecenter/de/SSVRGU_9.0.0/com.ibm.designer.domino.main.doc/H_7_FORMULAS_FUNCTION_REFERENCE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-evaluate-function
-->

## Introduction

In HCL Domino development, LotusScript provides robust capabilities for executing Notes/Domino formulas. The `Evaluate` function allows developers to run formulas within their code and retrieve the results. This is particularly useful for applications that require dynamic calculations or conditional formula execution.

## Syntax of the `Evaluate` Function

```lotusscript
result = Evaluate(notesFormula [, notesObject])
```

- `notesFormula`: A string containing the Notes/Domino formula to be executed.
- `notesObject` (optional): Provides context for the formula; for example, if the formula accesses a field, `notesObject` should be the `NotesDocument` object that contains that field.

The `Evaluate` function returns an array where the type and number of elements reflect the formula result. For a single value, the result is stored in the first element of the array.

## Usage Examples

### Example 1: Executing a Simple Formula

The following example demonstrates how to execute a simple formula in LotusScript that returns the current date.

```lotusscript
Dim session As New NotesSession
Dim result As Variant

result = Evaluate("@Today")
MsgBox "Today's date is: " & result(0)
```

In this example, the `@Today` formula returns the current date, which is executed using the `Evaluate` function. The result is stored in the first element of the `result` array and displayed in a message box.

### Example 2: Executing a Formula in the Context of a Specific Document

If the formula needs to access fields from a specific document, provide that document as the context.

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim result As Variant

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("YOUR_DOCUMENT_UNID")

result = Evaluate("@UpperCase(FieldName)", doc)
MsgBox "Uppercase value: " & result(0)
```

In this example, the `@UpperCase` formula converts the value of the `FieldName` field in the specified document to uppercase. The `doc` object is provided as the context to the `Evaluate` function.

## Considerations

- Certain `@` functions that affect the user interface (such as `@Command`, `@Prompt`) do not work within the `Evaluate` function. For more details, refer to [Using the Evaluate statement](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_EVALUATE_STATEMENT.html).

- The `Evaluate` function returns an array, even if the formula returns a single value. Therefore, it's advisable to use a variant to receive the result and access the first element of the array to obtain the single value.

By utilizing the `Evaluate` function in LotusScript, developers can flexibly execute Notes/Domino formulas, enhancing the functionality and dynamism of their applications.
