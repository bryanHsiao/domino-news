---
title: "Reading and Writing Notes Items in Java: getItemValue Hands You a Vector, Not the Array You Know"
description: "In LotusScript, doc.GetItemValue returns a Variant array and you loop over it without a second thought. In Java, the same call returns a java.util.Vector — you have to know the element type, a missing item comes back empty instead of throwing, and if it holds DateTime objects it leaks memory. This piece covers reading and writing items on the Java Document: getItemValue and the typed getters and their missing-item behavior, what Java types replaceItemValue accepts and how it auto-creates an item, why appendItemValue quietly makes duplicate items, and three instincts LotusScript won't carry over."
pubDate: 2026-08-14T07:30:00+08:00
lang: en
slug: java-document-items
tags:
  - "Java"
sources:
  - title: "Document.getItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html"
  - title: "Document.replaceItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD_JAVA.html"
  - title: "Document.appendItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDITEMVALUE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-document-items.webp"
coverStyle: "paper-craft"
---

Reading a field in LotusScript is muscle memory: `values = doc.GetItemValue("Categories")` hands you a Variant array, you `ForAll` over it, done. The same task in the Java `lotus.domino` API looks almost identical on the surface — `doc.getItemValue("Categories")` — but what comes back, how a missing field behaves, and even who owns the memory are all different from LotusScript.

This piece covers reading and writing items on the Java `Document`: what you get back and its type, what a missing field does, what Java types you can write, and three instincts a LotusScript developer most easily carries over wrong.

---

## TL;DR

- **`getItemValue` returns a [`java.util.Vector`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html)**, not a LotusScript Variant array. Element types follow the item: `String` for text, `Double` for numbers, `DateTime` for dates.
- **A missing item doesn't throw — it returns an empty Vector.** The docs are explicit: `getItemValue` on a nonexistent item returns an empty Vector and raises no exception. So "empty" and "absent" look identical; use `hasItem` to tell them apart.
- **The typed getters each have their own return:** `getItemValueString` returns `String`, `getItemValueInteger` returns `int`, `getItemValueDouble` returns `double`. `getItemValueString` returns an empty string (not null) for a missing item on 6.55 and later.
- **Write with [`replaceItemValue(String, Object)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD_JAVA.html):** it takes `String` / `Integer` / `Double` / `DateTime` / `Vector` / `Item`; it auto-creates the item if absent, and you must `save` afterward.
- **Don't use `appendItemValue` to update an existing field:** it doesn't replace — it quietly creates a second item with the same name. The docs say `replaceItemValue` is generally favored.

---

## Reading: getItemValue returns a Vector

The Java signature reads:

```java
public java.util.Vector getItemValue(String name) throws NotesException
```

Each element's type in the returned `Vector` is set by the item's data type — a text item gives you `String`s, a number item gives you `Double`s, a date-time item gives you `DateTime` objects. A single-value item is just a Vector of one element. The concept matches LotusScript's Variant array; the difference is you now hold a **raw `Vector` with its generics erased** (elements typed `Object`), so pulling values out means knowing and casting the type yourself.

The one line worth memorizing is the missing-item behavior. Straight from the docs:

> If no item with the specified name exists, this method returns an empty vector. It does not throw an exception.

So `getItemValue("no such field")` won't blow up — it hands you an empty Vector. That matches LotusScript, but it introduces a gray area to watch on the Java side: **"this field is empty" and "this field doesn't exist" are indistinguishable from the return value** — both are empty Vectors. To tell them apart, ask `doc.hasItem("...")` first.

## Reading: the typed getters, and that empty-string trap

If you just want a scalar, Java offers typed shortcuts: `getItemValueString` returns `String`, `getItemValueInteger` returns `int`, `getItemValueDouble` returns `double`. For a multi-value item they give you the first value.

`getItemValueString` carries one historical wrinkle worth knowing. For a missing or non-text item, its return depends on the version — null on 6.5 and earlier, and **an empty string on 6.55 and later**. What you meet today is almost always the latter. That's convenient (no guarding against `NullPointerException`), but it's the same trap as `getItemValue` from the other side: **an empty string still can't distinguish "present but empty" from "absent."** For a precise answer, `hasItem` remains the only reliable question.

## Writing: what Java types replaceItemValue takes

The workhorse for writing back is `replaceItemValue`:

```java
public Item replaceItemValue(String name, Object value) throws NotesException
```

`value` is an `Object`, and in practice it recognizes these Java types, each mapping to one kind of item:

| The Java type you pass | The item created |
|---|---|
| `String` | Text |
| `Integer` | Number |
| `Double` | Number |
| `DateTime` | Date-time |
| `Vector` (of the above) | Multi-value |
| `Item` | Same type as the source Item |

Multi-value means wrapping the values in a `Vector`. When the item doesn't exist, the docs state it fills it in:

> If the document does not contain an item with the specified name, this method creates a new item and adds it to the document.

And the line LotusScript veterans forget just as often, still true in Java: save your changes. The docs say plainly, "you must call save after calling replaceItemValue" — `replaceItemValue` only changes the in-memory document; without `save` it never happened.

## Trap 1: appendItemValue isn't "just add one more"

Java's [`appendItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDITEMVALUE_METHOD_JAVA.html) sounds harmless, but it differs from `replaceItemValue` in a way that bites. The docs are blunt:

> If the document already has an item called _name,_ appendItemValue does not replace it. Instead, it creates another item of the same name and gives it the value you specify.

Two items with the same name in one document, and most of the API afterward reads only one of them — the other becomes a nearly inaccessible orphan. So the docs hand you the conclusion directly: **`replaceItemValue` is generally favored**, and `appendItemValue` is safe only when you're building a brand-new document where names can't collide. Developers coming from LotusScript should be especially wary — you rarely hand-append in LotusScript, yet this method's name makes it easy to reach for in Java code.

## Trap 2: DateTime objects in a Vector leak memory

`getItemValue` on a date field returns a Vector holding `DateTime` **objects**. And `DateTime` is a heavyweight back-end object — like `Document` and `Session`, it's backed by a handle the garbage collector can't see. Loop `getItemValue` over a date field across tens of thousands of documents and those `DateTime` objects pile up and exhaust the agent's memory.

This is exactly the trap the site's [recycle() piece](/domino-news/en/posts/java-recycle-memory) describes, entered through a different door: you think you're only reading a field, but you're quietly minting a pile of back-end objects that need manual cleanup. The safe habit is to `recycle` a `DateTime` you got from an item as soon as you're done with it.

## Trap 3: you own the types

LotusScript's Variant smooths the type question over; Java doesn't. `getItemValue` gives you a `Vector` of `Object`, and you either know the field's type and cast straight to `String` or `Double`, or you `instanceof` your way through it. Cast to the wrong type and the compiler won't stop you — you'll get a `ClassCastException` at runtime. So in Java, "is this field text or a number" stops being something you can leave vague — your code has to state it for every field.

## A complete example

Putting it together — read a few types, write a few back, save:

```java
// read
String subject = doc.getItemValueString("Subject");           // missing -> empty string
Vector cats = doc.getItemValue("Categories");                 // multi-value text -> Vector<String>
double amount = doc.getItemValueDouble("Amount");             // number -> double

// write
doc.replaceItemValue("Status", "Approved");                   // String -> text
doc.replaceItemValue("Count", Integer.valueOf(cats.size()));  // Integer -> number

Vector reviewers = new Vector();
reviewers.add("Alice");
reviewers.add("Bob");
doc.replaceItemValue("Reviewers", reviewers);                 // Vector -> multi-value

doc.save();                                                   // no save, no change
```

Without that `save` line, every `replaceItemValue` above touched only the in-memory document — nothing reached the NSF.

## What about LotusScript and SSJS?

- **LotusScript:** `doc.GetItemValue("x")` returns a Variant array, `doc.ReplaceItemValue "x", v` writes back. Same concept, but the Variant hides the type for you, and there's no `DateTime`-in-a-`Vector` recycle burden — LotusScript's memory is automatic.
- **SSJS / XPages:** nearly identical to Java, because it's the same `lotus.domino` classes underneath — `getItemValue` returns a `java.util.Vector` there too. For a deeper look at multi-value work with `Vector`, see the site's [working with java.util.Vector in XPages](/domino-news/en/posts/ssjs-vector-multivalue) piece.
