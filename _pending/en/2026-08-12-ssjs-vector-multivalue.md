---
title: "XPages/SSJS: Working with Multi-Value Fields Using java.util.Vector"
description: "LotusScript has no removeElementAt, so dropping one multi-value element means rebuilding an array. SSJS is the opposite — it runs on Java, a multi-value field reads in as a java.util.Vector, and addElement/removeElementAt/insertElementAt are right there, then you write it back with replaceItemValue. A field report on using Vector for multi-value work, why removeElementAt loops backwards, and the two traps you will hit (the empty field's [\"\"], and getValue's type)."
pubDate: 2026-08-12T07:30:00+08:00
lang: en
slug: ssjs-vector-multivalue
tags:
  - "SSJS"
sources:
  - title: "Document (NotesDocument - JavaScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document.html"
  - title: "java.util.Vector — Java Platform SE 8 API"
    url: "https://docs.oracle.com/javase/8/docs/api/java/util/Vector.html"
  - title: "Global functions (XPages SSJS) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html"
relatedJava: []
relatedSsjs: []
---

The previous piece was about [LotusScript having no removeElementAt](/domino-news/en/posts/lotusscript-remove-element) — dropping one multi-value element means rebuilding an array, because LS has no Vector. SSJS is the mirror image: **you have the whole Vector API right there.**

The reason is one sentence: SSJS runs on the XPages Java runtime, so it can `new` and use any Java class directly. And a multi-value field read in SSJS is already a `java.util.Vector` (no conversion, no wrapping), so `removeElementAt`, `addElement`, `insertElementAt` are immediately available, and you write the result back with `replaceItemValue`. Your screenshot (`@Explode` a string, loop backwards with `removeElementAt`) is exactly this pattern.

This piece walks through using Vector for multi-value work, and the two traps you will hit.

---

## TL;DR

- **SSJS can use Java classes directly.** `java.util.Vector` is "a growable array of objects," and its whole API is open to SSJS.
- **A multi-value field reads in as a Vector**: `getItemValue` returns a `java.util.Vector` — no conversion needed.
- **Operations**: `addElement` / `removeElement` (by value) / `removeElementAt` (by index) / `insertElementAt` / `setElementAt` / `contains` / `indexOf` / `size` / `isEmpty` — the [full API](https://docs.oracle.com/javase/8/docs/api/java/util/Vector.html) is there.
- **Writing back**: `replaceItemValue` accepts a `java.util.Vector` directly — the most reliable way to write multi-value data to a document.
- **`removeElementAt` loops backwards**: deleting shifts later indices left, so a forward loop skips items; loop backwards (`i = size()-1; i >= 0; i--`), or use a `java.util.Iterator`'s `remove()`.
- **Two traps**: (1) an empty multi-value field often isn't size 0 but size 1 holding a single empty string `[""]`; (2) [`getComponent().getValue()`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html)'s type depends on the control (an inputText is a String, a multi-select listBox is a Vector/Array), so check the type before you manipulate it.

---

## Why SSJS has it and LS doesn't

The root of the difference is exactly what [the previous piece](/domino-news/en/posts/lotusscript-remove-element) described, flipped: **SSJS runs on Java, LS doesn't.** LS has only its own List/array — no Vector, no `removeElementAt` — while SSJS can reach the entire Java standard library: `java.util.Vector`, `java.util.Iterator`, `java.util.List`, all of it. The same "remove one multi-value element" is a rebuild in LS and a single method in SSJS.

## It reads in as a Vector

A multi-value field read in SSJS comes back typed as a `java.util.Vector` — the smoothest starting point, no string-splitting or array conversion needed:

```javascript
var doc:NotesDocument = currentDocument.getDocument();
var roles = doc.getItemValue("UserRoles");   // returns a java.util.Vector
```

`getItemValue` lives on the SSJS [NotesDocument](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document.html); the Vector you get back is ready to work on.

## The full Vector API

`java.util.Vector` is defined as "a growable array of objects," and its [methods](https://docs.oracle.com/javase/8/docs/api/java/util/Vector.html) are the ones LS lacks:

| Method | What it does |
|---|---|
| `addElement(obj)` | append to the end |
| `insertElementAt(obj, i)` | insert at index i |
| `removeElement(obj)` | remove the first match **by value** |
| `removeElementAt(i)` | remove **by index** |
| `setElementAt(obj, i)` | replace element i |
| `elementAt(i)` / `indexOf(obj)` / `contains(obj)` | read / find / test membership |
| `size()` / `isEmpty()` | count / emptiness |

`removeElementAt` — the one LS doesn't have, the one in your screenshot — is right here.

## Why removeElementAt loops backwards

This is the crux of your screenshot. `removeElementAt(i)` shrinks the Vector, and **every later element shifts one position left**. So a forward loop `for (i=0; i<size(); i++)` that removes index 0 moves the old index 1 into index 0; on the next pass (`i=1`) you look at the old index 2, skipping the old index 1.

Loop backwards and the problem disappears: `for (i = vec.size()-1; i >= 0; i--)` — you remove from the tail, and the elements shifting left are ones you've already handled, so nothing is skipped and you avoid `ArrayIndexOutOfBounds`.

```javascript
for (var i = roles.size() - 1; i >= 0; i--) {
    if (roles.elementAt(i).startsWith("Legacy_")) {
        roles.removeElementAt(i);   // backwards = safe
    }
}
```

The alternatives are a `java.util.Iterator`'s `remove()` (safe removal mid-traversal) or, on a `java.util.List`, `removeAll(toRemove)` to drop a whole set at once.

## Writing back: replaceItemValue takes a Vector

Hand the modified Vector straight to [`replaceItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Document.html) — defined as "replaces all items of the specified name with one new item, which is assigned the specified value." It accepts a `java.util.Vector` directly, which is the most reliable way to write multi-value data:

```javascript
doc.replaceItemValue("UserRoles", roles);
doc.save(true, false);
```

## Two traps you will hit

- **An empty multi-value field isn't size 0.** A newly created or cleared multi-value field often reads back as **size 1 holding a single empty string `[""]`**, not an empty Vector. A naive loop then processes one blank entry or writes back a stray empty line. Check first: `if (v.size()==1 && v.elementAt(0).equals("")) v.removeElementAt(0);`
- **`getComponent().getValue()`'s type isn't fixed.** [`getComponent`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) returns the UI *component* itself; calling `.getValue()` on it gives the control's value, whose type **depends on the control** — an `<xp:inputText>` returns a String, a multi-select `<xp:listBox multiple="true">` / `checkBoxGroup` returns an Array or Vector. Check with `typeof` / `instanceof` first, or calling `removeElementAt` on a String blows up.

## Line by line through your screenshot

```javascript
var DeleteValue = getComponent("DeleteValue").getValue();   // get the control's value (check the type)
if (DeleteValue != "" && DeleteValue != null) {
    var DeleteValuearr = @Explode(DeleteValue, ",");        // split into the list of indices to remove
    for (var i = (DeleteValuearr.length - 1); i >= 0; i-- ) {  // loop backwards
        wordValue.removeElementAt(parseInt(DeleteValuearr[i]));  // remove by index; parseInt to an int
    }
}
```

It's sound: confirm the value is non-empty, `@Explode` the indices to remove, **loop backwards** to avoid index shift, `parseInt` the string to an integer index, then `removeElementAt`. The only things to watch are the two traps above — if `wordValue` could be an empty field or a non-Vector, a type/empty guard up front makes it sturdier.

## What about LotusScript and Java?

| Language | Removing one element from a multi-value |
|---|---|
| **SSJS / XPages** | use `java.util.Vector`'s `removeElementAt` / `removeElement` — a multi-value field reads in as a Vector, and `replaceItemValue` writes it back |
| **LotusScript** | no Vector; rebuild an array or use a `List`'s `Erase(tag)` — see [the LS "no removeElementAt" piece](/domino-news/en/posts/lotusscript-remove-element) |
| **Java (`lotus.domino`)** | the same `java.util.Vector` works; `Document.getItemValue()` also returns a Vector on the Java side |

One line of contrast: **SSJS borrows Java's ready-made container; LS uses its own toolbox.** The same `removeElementAt` is a single line in SSJS and a rebuild loop in LS. For how these classes connect, see the [class map](/domino-news/en/map).
