---
title: "Java's NotesException: .id, .text, and try/catch/finally"
description: "LotusScript error handling is On Error Goto, Err.Number, Resume. In Java, nearly every lotus.domino method throws a checked NotesException — the compiler forces you to handle it — and it carries .id (the Notes error code) and .text (the message). This piece covers Java exception handling: NotesException's fields, using .id against NotesError constants for targeted handling, and the rule that ties this whole Java data-layer series together — recycle belongs in finally, so it still runs when something throws."
pubDate: 2026-08-17T07:30:00+08:00
lang: en
slug: java-notesexception
tags:
  - "Java"
sources:
  - title: "NotesException class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEXCEPTION_CLASS_JAVA.html"
  - title: "Base.recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
  - title: "Document.getItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html"
---

You probably know LotusScript error handling well: `On Error Goto handler`, jump to a label on error, read `Err` and `Error$`, maybe `Resume Next` to carry on. That model changes worlds in Java — nearly every `lotus.domino` method throws a [`NotesException`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEXCEPTION_CLASS_JAVA.html), and it's a **checked exception**: the compiler makes you either `catch` it or declare `throws` on the method. There's no ignoring it.

This piece covers how you handle that exception in Java, and one rule that ties the whole "Java data layer" series together: **the back-end objects you read about in the earlier parts, the ones that need recycling, get recycled in a `finally`** — otherwise a thrown exception skips right past the recycle line.

---

## TL;DR

- **`NotesException` is checked:** the docs say it "extends java.lang.Exception." The compiler forces you to handle it — a different mindset from LotusScript's `On Error`, which is optional and ignorable.
- **It carries two public fields:** `id` (`int`, the Notes error code) and `text` (`String`, the message). Verbatim: "NotesException.id, of type int, contains the error code."
- **Branch on `id`:** compare `e.id` against `NotesError` constants (e.g. `NOTES_ERR_SYS_FILE_NOT_FOUND`, value 4003) to tell "file not found" from other errors and handle them differently.
- **Put `recycle` in `finally`:** so the `Document`, `DateTime`, and iteration objects you created get collected whether the block finishes normally or throws. This is the series' closing rule.
- **There's also an `internal` field:** the internal exception that caused the Domino one — usually null.

---

## NotesException: checked, and carrying an error code

The docs define it in one line: "The NotesException class extends java.lang.Exception to include exception handling for Notes/Domino." The load-bearing part is "extends java.lang.Exception" — it's a checked exception, not a `RuntimeException`. That inverts the mindset from LotusScript: LS's `On Error` is something you *may* choose to catch; Java's `NotesException` is something the compiler *forces* you to. Call any `lotus.domino` method without handling its `NotesException` and the code simply won't compile.

It carries two fields you'll use constantly:

- **`id`** (`int`): the docs say it "contains the error code" — the Notes error number.
- **`text`** (`String`): the docs say it "contains the error text" — the human-readable message.

(There's also `internal`, of type `Exception`, wrapping the underlying exception that caused the Domino one; the docs note "Otherwise (and typically), this variable is null," so you rarely touch it.)

## Branching on id

`text` is for logging where a human reads it; to make the program **branch by kind of error**, you look at `id`. Notes error codes have named constants in `NotesError`, and comparing `e.id` against them identifies a specific error. The docs' own example demonstrates one — when a named file doesn't exist, "Notes/Domino throws the exception NOTES_ERR_SYS_FILE_NOT_FOUND (4003)." So you can write:

```java
try {
    Database db = session.getDatabase("Server", "missing.nsf");
    // ...
} catch (NotesException e) {
    if (e.id == NotesError.NOTES_ERR_SYS_FILE_NOT_FOUND) {
        // file not found — this one I can handle (swap, create, or skip)
    } else {
        throw e;  // an error I don't recognize — send it up
    }
}
```

That's the Java version of "tell the errors apart," taking the place of LotusScript's `Select Case Err`.

## The closing rule: recycle goes in finally

This is the rule that ties the whole Java data-layer series together. The earlier parts kept saying it: the [`Document`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html), `DateTime`, and iteration objects in Java are back-end objects you have to [`recycle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) by hand. The catch is — **if the recycle line sits inline with your processing, then the moment something throws a `NotesException`, execution jumps away and the recycle never runs.** You think you're collecting; on the error path you're leaking.

The fix is Java's `finally`: it runs whether the `try` block completes or throws. So the back-end object's `recycle` goes there:

```java
Document doc = null;
try {
    doc = view.getFirstDocument();
    String s = doc.getItemValueString("Subject");   // if this throws NotesException…
    // ... more processing ...
} catch (NotesException e) {
    System.out.println("Notes error " + e.id + ": " + e.text);
} finally {
    if (doc != null) doc.recycle();                 // …this line still runs
}
```

Declaring `doc` outside the `try` and null-checking it in `finally` before recycling is the standard skeleton for Java Domino code. The site's [recycle() piece](/domino-news/en/posts/java-recycle-memory) covers *why* you collect; this one adds *where* you collect once the code can actually throw.

## A complete example

Putting the three together — checked exception, branch on id, collect in finally:

```java
Document doc = null;
try {
    doc = db.getDocumentByUNID(unid);
    process(doc.getItemValue("Items"));
} catch (NotesException e) {
    // id for the program to branch on, text for a human — log both
    log.severe("Notes error " + e.id + ": " + e.text);
    throw e;                                         // an error I don't recognize — send it up
} finally {
    if (doc != null) doc.recycle();                 // collected either way
}
```

The `catch` logs both `id` and `text` (`id` to branch on, `text` to read), and the `finally` guarantees that `doc` is collected whether things went fine or threw.

## What about LotusScript and SSJS?

- **LotusScript:** `On Error Goto` + `Err` / `Error$` + `Resume`. No checked exceptions, no `finally`, and no manual recycle — memory collects itself, so LS has no "where to collect" problem. To imitate `finally` in LS, you usually put the cleanup at a label every path `Resume`s to. The site has a [LotusScript error-handling](/domino-news/en/posts/lotusscript-error-handling) piece.
- **SSJS / XPages:** the same `lotus.domino` underneath, so `NotesException` still has `id` and `text`; but you catch it with JavaScript's `try/catch/finally`, closer to the Java shape. Still recycle in `finally`, especially in XPages logic looping a big collection.
