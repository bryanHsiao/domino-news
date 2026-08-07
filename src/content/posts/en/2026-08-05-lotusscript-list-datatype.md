---
title: "Stop Hand-Rolling Parallel Arrays: LotusScript's List Is the Built-In HashMap for Counting, Dedup, and Lookups"
description: "You need to count documents by category, dedup a set of names, or build a code-to-label lookup. The Domino reflex is two parallel arrays and a linear scan, or a throwaway view. But LotusScript has had a native keyed collection all along and almost nobody reaches for it: the List. A field report on the built-in associative array — its keyed access, ForAll + ListTag iteration, Erase, and the two gotchas (guarding reads with IsElement, and tag case sensitivity following Option Compare)."
pubDate: 2026-08-05T07:30:00+08:00
lang: en
slug: lotusscript-list-datatype
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Working with lists with LotusScript — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html"
  - title: "IsElement function (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ISELEMENT_FUNCTION.html"
  - title: "ForAll statement (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_FORALL_STATEMENT.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/lotusscript-list-datatype.webp"
coverStyle: "photoreal-3d"
---

You need to count documents by category. Or dedup a list of names. Or build a lookup from a code to its label so you can resolve one without hitting a view each time. The Domino reflex is a pair of parallel arrays and a linear scan — `For i = 0 To UBound(keys)`, compare, maybe `Redim Preserve` — or a temporary categorized view you read back. Both work, and both are reinventing something LotusScript has shipped since the beginning and that almost nobody uses: the **List**.

A [List](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_WORKING_WITH_LISTS.html) is LotusScript's native associative array — a keyed collection, a dictionary, a hashmap, whatever you call it in the language you came from. This is a short field report on the data type hiding in plain sight: how you use it, the two operations that make it worth reaching for, and the two gotchas that bite once you do.

---

## TL;DR

- Declare with `List`: `Dim total List As Long`. Assign by string key: `total("Sales") = 10` — assigning a new key creates it.
- Guard reads with [`IsElement`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_ISELEMENT_FUNCTION.html): a List has no default value, so reading a tag you never assigned raises an error, not an empty value. `If IsElement(total("Sales")) Then …`.
- Iterate with [`ForAll`](https://help.hcl-software.com/dom_designer/14.5.0/basic/LSAZ_FORALL_STATEMENT.html); inside the loop, `ListTag(v)` gives the current element's key while `v` is its value.
- Remove one element with `Erase total("Sales")`, or clear the whole List with `Erase total`.
- Gotcha: whether tags are case-sensitive follows the module's `Option Compare`, so `"AB"` and `"ab"` may or may not be the same key — normalise your keys and don't rely on it.

## The whole data type in one example

Counting by category is the canonical case, and it shows every operation at once:

```lotusscript
Dim total List As Long

Forall doc In col.Documents
    Dim cat As String
    cat = doc.Category(0)
    If IsElement(total(cat)) Then
        total(cat) = total(cat) + 1     ' key exists — bump it
    Else
        total(cat) = 1                  ' first time — assigning creates the key
    End If
End Forall

Forall n In total
    Print ListTag(n) & ": " & n         ' ListTag = the key, n = the value
End Forall
```

That's the List in full. Keyed write creates or updates; `IsElement` tests existence; `ForAll` walks it and `ListTag` recovers the key. There's no `count`, no `sort`, no `keys()` collection — a List is deliberately minimal — but for "accumulate something per key" it replaces a whole block of parallel-array bookkeeping with four lines, and the keyed access doesn't get slower as the number of keys grows the way a linear array scan does.

## Where it earns its place

Three shapes come up constantly and all collapse to a List:

- **A "seen" set** — dedup by assigning `seen(key) = True` and testing `IsElement(seen(key))`; the value is irrelevant, the key is the whole point.
- **A counter / grouper** — the example above, one running total per key.
- **A lookup table** — read a code list once into `label(code) = text`, then resolve in-loop from memory instead of a repeated view hit (the same instinct behind caching an `@DbLookup`, but under your control).

Any time you catch yourself writing "does this key already exist" against an array, that's a List.

## The two gotchas

**Reads have no default.** This trips people coming from JavaScript objects or Notes items, where a missing thing reads as empty. A List tag that was never assigned isn't empty — it's absent, and referencing it for a read is a runtime error. So the `IsElement` check isn't optional politeness; it's the guard that keeps a read from throwing. Write-then-read is safe; read-before-write needs `IsElement`.

**Tag case sensitivity is a module setting, not a fixed rule.** The docs are explicit: "List tags can be case sensitive or case insensitive, depending on the setting for case sensitivity in the module," and `Option Compare` is what decides. So `total("AB")` and `total("ab")` are two keys in one module and the same key in another — a portability landmine when you paste code between script libraries with different `Option Compare` settings. The safe habit is to normalise keys yourself (`LCase(cat)`) so the List's behaviour doesn't depend on a directive three screens up.

## What about Java and SSJS?

There's no Domino class here — the List is a language feature, so `relatedJava` and `relatedSsjs` are empty. But the *concept* is the most portable thing in this whole series: the List is exactly what Java calls a `HashMap` and what SSJS / JavaScript calls a plain object or a `Map`. If you're moving keyed-collection logic out of LotusScript, you're not looking for a Notes class — you're reaching for the target language's built-in map, which has the richer API (a size, a key set, ordering) that the List deliberately lacks. Going the other way, the lesson is the one this post is really about: before you build a hashmap out of parallel arrays in LotusScript, remember the language already has one.
