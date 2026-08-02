---
title: "LotusScript Has No removeElementAt: Removing One Element from an Array, List, or Multi-Value Field"
description: "Removing one multi-value element is easy in SSJS/XPages — java.util.Vector has removeElementAt, loop backwards and delete by index. In LotusScript you hit a wall: no Vector, no removeElementAt, and Erase clears a whole array rather than dropping one element. This is a field report on the real options — figure out what your collection actually is first, then reach for Split/Join, an array rebuild, a List's Erase(tag), or Evaluate + @Replace."
pubDate: 2026-08-11T07:30:00+08:00
lang: en
slug: lotusscript-remove-element
tags:
  - "LotusScript"
sources:
  - title: "Split function (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_SPLIT.html"
  - title: "Erase statement (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ERASE_STATEMENT.html"
  - title: "Working with lists (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html"
  - title: "Using the Evaluate statement — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html"
relatedJava: []
relatedSsjs: []
---

In SSJS / XPages, removing one multi-value element probably looks like this: `@Explode` the string into an array, loop backwards, and delete by index with `wordValue.removeElementAt(parseInt(idx))`. Clean, because SSJS runs on Java, `wordValue` is really a `java.util.Vector`, and `removeElementAt` is a method it already has.

Move the same logic to LotusScript and you stall: LS has **no Vector and no `removeElementAt`**, and the `Erase` you'd reach for clears a *whole* array rather than dropping one element. So "remove one element from a collection" has no one-step answer in LS; it depends on what your "collection" actually is.

This piece lays out the real options.

---

## TL;DR

- **LS has no `removeElementAt`.** That's a `java.util.Vector` method; SSJS can use it because it runs on Java. LS has no Vector.
- **Figure out what your collection is first:** a delimited string, a dynamic array, a `List`, or a multi-value field — each removes differently.
- **String ↔ array:** `Split` (= `@Explode`) and `Join` (= `@Implode`), both native to LS since R6.
- **Removing one array element: nothing built in.** The docs say `Erase` on a dynamic array "removes all elements from storage" — it clears the whole thing. To drop one index you **rebuild into a new array** (skipping that index). `ReDim Preserve` can only change the *last* dimension's upper bound; it can't cut out the middle.
- **`List` is the one with "remove one":** `Erase myList(tag)` drops a single element **by key**. It's the closest LS has to a collection with a remove — but keyed, not indexed.
- **Multi-value field:** rebuild from `item.Values` (a Variant array) and `ReplaceItemValue` back, or run `@Replace`/`@Trim` through `Evaluate` in one line.

---

## Figure out what the collection is first

The SSJS snippet is tidy because `wordValue` is *one* thing: an ordered `Vector` you can add to and remove from by index. LS has no single container like that — it has several different things, each with its own way to remove. Before touching anything, ask which one you're holding:

- A comma-delimited **string**? → `Split` it into an array first.
- A **dynamic array**? → there's no remove-one; you rebuild.
- A **`List`** (associative collection)? → `Erase myList(tag)` by key.
- A **multi-value field's** values? → rebuild from `item.Values`, or go through `Evaluate`.

## Split / Join: the native @Explode and @Implode

The `@Explode` you used in SSJS has a native LS counterpart: [`Split`](https://help.hcl-software.com/dom_designer/14.5.1/basic/LSAZ_SPLIT.html) — "Returns an Array of Strings that are the substrings of the specified String," built in since R6. Its reverse, `Join`, is `@Implode`. So "comma string → process → comma string" is `Split` in, `Join` out, with the work happening on the array in between.

```lotusscript
Dim arr As Variant
arr = Split("Apple,Banana,Cherry", ",")   ' = @Explode
' ...work on arr...
Dim s As String
s = Join(arr, ",")                          ' = @Implode
```

## Arrays: why there's no removeElementAt

This is the counterintuitive part. You might reach for `Erase` — but [`Erase`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ERASE_STATEMENT.html) on a dynamic array "removes all elements from storage and recovers the storage": it empties the whole array, it doesn't drop one. And `ReDim Preserve` can only change the **last dimension's upper bound** — you can make an array shorter, but you can't "cut out the 3rd element and shuffle the rest down."

So the standard LS way to remove an array element by index is to **rebuild**: walk it once, copying the keepers into a new array.

```lotusscript
Dim src As Variant, temp() As String
Dim i As Integer, n As Integer, removeIdx As Integer
src = Split("Apple,Banana,Cherry,Date", ",")
removeIdx = 1                               ' remove "Banana"
ReDim temp(0 To UBound(src))
n = 0
For i = 0 To UBound(src)
    If i <> removeIdx Then
        temp(n) = CStr(src(i))
        n = n + 1
    End If
Next
If n > 0 Then ReDim Preserve temp(0 To n - 1) Else Erase temp
' temp = ["Apple", "Cherry", "Date"]
```

Worth noting: the SSJS snippet loops *backwards* because `removeElementAt` mutates the indices as it deletes, so a forward loop skips items. The rebuild approach has **no such problem** — you copy into a new array, so the source indices never move. Removing several indices is just a "is this index in the delete set?" check, no backwards trick needed.

## List: the one built-in collection with "remove one"

If you don't strictly need integer indices, a [`List`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html) is the only built-in LS collection with a "remove a single element." The docs: "`Erase listName(listTag)` removes the individual element identified by listTag from the list" — a single element, **by key (tag)**, leaving the rest.

```lotusscript
Dim fruit List As String
fruit("a") = "Apple"
fruit("b") = "Banana"
fruit("c") = "Cherry"

If IsElement(fruit("b")) Then Erase fruit("b")   ' drops Banana only; guard with IsElement first
```

The key difference: a `List` removes by **key**, not by **index** — unlike SSJS's `removeElementAt(int)`. If your data has a natural key (a code, a UNID, a name), a `List` is far cleaner than rebuilding an array; if you genuinely need "the Nth one," go back to the array rebuild. (The full `List` treatment is in [the LotusScript List piece](/domino-news/en/posts/lotusscript-list-datatype).)

## Multi-value fields: rebuild Values, or one line of Evaluate

If the "collection" is really a document's **multi-value field**, there are two routes:

1. **Rebuild from the values**: `item.Values` returns a Variant array (note: even a single value comes back as an array), which you process with the rebuild above, then write back with `ReplaceItemValue`.
2. **One line of `Evaluate`**: pass `@Replace` / `@Trim` as a formula to [`Evaluate`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_USING_THE_EVALUATE_STATEMENT.html) and drop values from the multi-value list in a single call — the least code. Details in [the LotusScript Evaluate piece](/domino-news/en/posts/lotusscript-evaluate).

```lotusscript
' Remove every value equal to "Obsolete" from the multi-value field Categories
Dim s As New NotesSession
Dim result As Variant
result = Evaluate(|@Trim(@Replace(Categories; "Obsolete"; ""))|, doc)
Call doc.ReplaceItemValue("Categories", result)
```

## Translating that SSJS snippet to LS

Back to your case — a comma-delimited list of indices, removing those positions from a multi-value collection. SSJS loops backwards with `removeElementAt`; the LS equivalent rebuilds, skipping the indices to remove:

```lotusscript
Dim wordValue As Variant, deleteArr As Variant, kept() As String
Dim i As Integer, j As Integer, n As Integer, drop As Boolean
' wordValue: the original multi-value; deleteValue: indices to remove, comma-delimited
deleteArr = Split(deleteValue, ",")
ReDim kept(0 To UBound(wordValue))
n = 0
For i = 0 To UBound(wordValue)
    drop = False
    For j = 0 To UBound(deleteArr)
        If i = CInt(deleteArr(j)) Then drop = True : Exit For
    Next
    If Not drop Then kept(n) = CStr(wordValue(i)) : n = n + 1
Next
If n > 0 Then ReDim Preserve kept(0 To n - 1) Else Erase kept
```

Same task: SSJS leans on the Vector's ready-made `removeElementAt`, LS rebuilds — a few more lines, but the logic is more transparent (the source indices never move).

## What about SSJS and Java?

| Language | Removing one element from a collection |
|---|---|
| **SSJS / XPages** | use `java.util.Vector`'s `removeElementAt(index)` / `removeElement(value)` — it runs on Java, so an ordered container is right there |
| **LotusScript** | no Vector, no `removeElementAt`; depending on the case use a `List`'s `Erase(tag)` (by key), an array rebuild (by index), or `Evaluate` + `@Replace` (multi-value field) |

The SSJS side — "using `java.util.Vector` directly to work with multi-value fields" — gets its own companion piece (the full Vector API against a multi-value field in XPages). The core contrast is that table: **SSJS borrows Java's container; LS uses its own toolbox.** For how these classes connect, see the [class map](/domino-news/en/map).
