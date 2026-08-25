---
title: "Why You Barely Write Loops to Process a List in Formula"
description: "Coming from LotusScript/Java, you'd loop over a list. But formula has almost no loops — because one formula already operates on a whole list at once. This piece treats formula as a functional list language: an operation on a multi-value field runs element-wise (implicit map), @Transform is the explicit map (with @Nothing for filter, a returned list for flatMap), @Explode/@Implode split and join, and @Sort sorts (with [CUSTOMSORT] using $A/$B). What's a ten-line loop elsewhere is often one line of formula. Part two of the Formula @function series."
pubDate: 2026-08-26T07:30:00+08:00
lang: en
slug: formula-list-processing
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Transform — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TRANSFORM.html"
  - title: "@Explode — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXPLODE.html"
  - title: "@Sort — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SORT.html"
---

Coming from LotusScript or Java, your first instinct on seeing a list of values (a multi-value field, a list) is to write a loop over it. In formula you'll find something counterintuitive — **there are almost no loops**. Not because it can't, but because it rarely needs to: **one formula already operates on a whole list at once.**

This part (the [last one](/domino-news/en/posts/formula-dblookup-dbcolumn) was about reading data in; this is about processing it once it's in) treats formula as a **functional list language**. With that mindset, a lot of what would be a ten-line loop collapses to one line.

---

## TL;DR

- **Implicit map:** an operation on a multi-value field runs **element-wise**. `Categories + "!"` appends `!` to every value, not to the list as one string.
- **[`@Transform`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TRANSFORM.html) is the explicit map:** `@Transform(list; "x"; formula)` — apply a formula to each element, collect a new list. The docs say it "applies a formula to each element of a list and returns the results in a list."
- **`@Transform` is also filter and flatMap:** return `@Nothing` for an element to **drop** it (filter); return a **list** to splice multiple values in (flatMap).
- **`@Explode` / `@Implode` split and join:** string → list, list → string.
- **`@Sort` sorts:** `[ASCENDING]` / `[DESCENDING]` and other keywords, or `[CUSTOMSORT]` comparing with `$A` / `$B`.

---

## The mindset: one formula acts on the whole list

Fix this instinct first. Say `Categories` is a multi-value field holding `"A":"B":"C"`. You write:

```
Categories + "!"
```

The result is **not** `"ABC!"` — it's `"A!":"B!":"C!"`. Formula applied the operation **element-wise** across the list. Two equal-length lists added together pair up too: `("A":"B") + ("1":"2")` gives `"A1":"B2"`.

That's why formula rarely needs a loop: most "do the same thing to each value" needs are written once against the whole list.

## @Transform: the explicit map (plus filter and flatMap)

When the per-element work is too complex for plain operators, use `@Transform`. It's formula's **map**:

```
@Transform(Categories; "x"; @UpperCase(x))
```

`"x"` is the variable naming the current element each iteration; the third argument is the formula applied to it. The docs' own example prefixes an asterisk to elements that lack one:

```
@Transform(original; "var"; @If(@Begins(var; "*"); var; "*" + var))
```

What makes `@Transform` fun is that **one function does three operations**:

- **map:** as above, each element becomes a new value.
- **filter:** return **`@Nothing`** on an iteration and that element **doesn't** enter the result. To keep values matching a condition, `@If(condition; x; @Nothing)`.
- **flatMap:** return a **list** on an iteration and those values are **spliced** into the result.

(One caveat: if an iteration returns an error, `@Transform` propagates it outward.)

## @Explode / @Implode: split and join

Data often moves between "a comma-separated string" and "a list." This pair does exactly that:

- **[`@Explode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXPLODE.html):** splits a string into a list. The default separators are space, comma, and semicolon (`" ,;"`); a newline is always a separator (unless `newlineAsSeparator` is False). `@Explode("a,b,c")` gives `"a":"b":"c"`.
- **`@Implode`:** the reverse, joining a list back into a string — the docs say it "Concatenates all members of a text list and returns a text string."

They're often used together to swap a separator:

```
@Implode(@Explode(entry; "&"); "+")
```

Split on `&`, join with `+` — one line changes the delimiter.

## @Sort: sorting, with custom comparison

[`@Sort`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SORT.html) sorts a list. The default is "ascending, case-sensitive, accent-sensitive, pitch-sensitive," adjustable with keywords:

```
@Sort(names; [DESCENDING])
```

Besides `[ASCENDING]` / `[DESCENDING]`, there are `[CASEINSENSITIVE]`, `[ACCENTINSENSITIVE]`, and others. For more flexible ordering, use `[CUSTOMSORT]` — the docs describe it as "a formula that uses the temporary variables $A and $B to compare the values of elements in the list two at a time": compare `$A` and `$B` pairwise, returning `@True` or a positive number when `$A > $B`.

## The rest of the list toolkit

Rounding out the set:

- **`@Unique`:** dedup, returning a list with no repeated values.
- **`@Elements`:** count how many elements are in the list.
- **`@Trim`:** trim leading, trailing, and redundant spaces from each element, and drop all-blank elements as a side effect.
- **`@Subset` / `@Member` / `@IsMember`:** take a subset, take the nth, test membership.

## A combined example

String together "take a comma-separated tag list, trim blanks, dedup, sort, prefix each" — with no loop at all:

```
tags := @Explode(RawTags; ",");
clean := @Unique(@Trim(tags));
@Sort(@Transform(clean; "t"; "#" + t))
```

Three lines do what a for-loop and a few temp variables would take elsewhere. That's the power of formula as a list language.

The next part turns to **text processing** — `@Left` / `@Right` / `@Middle` / `@Word` / `@ReplaceSubstring` / `@Text`, taking a knife to strings in formula.
