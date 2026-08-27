---
title: "String Functions in Formula: @Left/@Right/@Middle, @Word, @ReplaceSubstring"
description: "Cutting strings in formula: many people only know @Left(s; 3), the count form — but @Left/@Right/@Middle also take a delimiter string: @Left(email; \"@\") is everything before the @. @Middle has four signatures, so 'grab what's between X and Y' is one line. This piece covers formula's string tools: @Middle's four forms, @Left/@Right's dual form, @Word to grab the nth piece by separator (-1 for the last, for surnames), and @ReplaceSubstring with parallel lists for multiple replacements. Part three of the Formula @function series."
pubDate: 2026-08-27T07:30:00+08:00
lang: en
slug: formula-text-functions
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Middle — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIDDLE.html"
  - title: "@Word — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORD.html"
  - title: "@ReplaceSubstring — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACESUBSTRING.html"
cover: "/covers/formula-text-functions.webp"
coverStyle: "low-poly-3d"
---

Cutting strings in formula — extract a piece, grab a word, find and replace — is a handful of @functions. But one thing many people don't know is worth leading with: **`@Left` / `@Right` / `@Middle` don't just take a character count, they take a delimiter string too.**

`@Left(subject; 10)` takes the first 10 characters; but `@Left(email; "@")` takes **everything before the `@`** — same function, and a number in the second argument means "how many," a string means "up to where." Learn this dual form and a lot of string work suddenly gets simpler.

(Following [the last part](/domino-news/en/posts/formula-list-processing) — like list processing, these functions run element-wise on a multi-value field.)

---

## TL;DR

- **`@Left` / `@Right` dual form:** `@Left(s; 3)` takes 3 characters; `@Left(s; "@")` takes everything before `@`. `@Right` mirrors it (from the right).
- **[`@Middle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MIDDLE.html) has four forms:** start (offset or startString) × length (numberchars or endstring). "Grab between X and Y" = `@Middle(s; "X"; "Y")`.
- **[`@Word`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WORD.html) grabs the nth piece by separator:** `@Word(s; " "; 2)` is the second word; **`-1` is the last** (handy for surnames).
- **[`@ReplaceSubstring`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACESUBSTRING.html) finds and replaces:** `@ReplaceSubstring(s; from; to)`, **case-sensitive**, and `from`/`to` can be parallel lists for several replacements at once.
- The rest: `@Text` (to text), `@UpperCase`/`@LowerCase`/`@ProperCase`, `@Length`, `@Contains`/`@Begins`/`@Ends`.

---

## @Middle: the most versatile extractor

`@Middle` is the flexible one; the docs give **four signatures** — the start and the end each have two forms:

| Start | Length / end | Syntax |
|---|---|---|
| offset (numeric position) | numberchars | `@Middle(string; offset; numberchars)` |
| offset | endstring (delimiter) | `@Middle(string; offset; endstring)` |
| startString (delimiter) | endstring | `@Middle(string; startString; endstring)` |
| startString | numberchars | `@Middle(string; startString; numberchars)` |

The docs' examples make it clear:

- `@Middle("North Carolina"; 4; 3)` → `"h C"` (3 characters after position 4).
- `@Middle("North Carolina"; " "; 3)` → `"Car"` (3 characters **after the space**).
- `@Middle("This is the text"; 4; "text")` → `" is the "` (everything between position 4 and `"text"`).

The third form (`startString` + `endstring`) is the handy one — **"grab what's between two markers" in one line**, like pulling `value` out of `<tag>value</tag>`. A negative `numberchars` counts **leftward** from the start.

## @Left / @Right: the same dual form

`@Left` / `@Right`, like `@Middle`, take a **character count** or a **delimiter** in the second argument:

- `@Left("2026-08-27"; 4)` → `"2026"` (first 4 characters).
- `@Left("user@example.com"; "@")` → `"user"` (everything before `@`).
- `@Right("user@example.com"; "@")` → `"example.com"` (everything after `@`).

There's also `@LeftBack` / `@RightBack` — searching for the delimiter from the **end** of the string. Handy for paths, extensions, and cutting from the right.

## @Word: the nth piece by separator

To take "the nth segment separated by a character," use `@Word`. The docs define a "word" as the part of a string delimited by the specified separator character.

```
@Word("Larson, Collins, and Jensen"; " "; 2)   → "Collins,"
```

A positive `number` counts from the start (`0` is the same as `1`); a **negative counts from the end**; out of range returns an empty string. The negative is especially useful — grab "the last segment" without caring how many come before:

```
@Word(@UserName; " "; -1)
```

Whatever middle names a user has, this grabs the **surname** (the last space-separated word).

## @ReplaceSubstring: find and replace

Find-and-replace is `@ReplaceSubstring(sourceList; fromList; toList)`. The docs in one line: "Replaces specific words or phrases in a string with new words or phrases that you specify. Case sensitive." — note **case-sensitive**.

The handy part is that `from` / `to` can be **parallel lists**, replacing several at once:

```
@ReplaceSubstring("I like apples"; "like" : "apples"; "hate" : "peaches")
→ "I hate peaches"
```

`"like"→"hate"` and `"apples"→"peaches"` both applied. Note the replacements are **sequential** — each pair scans the result of the previous one, so order can matter.

## The rest of the string toolkit

Rounding out the set:

- **`@Text`:** convert a number or date to text (with an optional format code).
- **`@UpperCase` / `@LowerCase` / `@ProperCase`:** case conversion.
- **`@Length`:** string length.
- **`@Contains` / `@Begins` / `@Ends`:** test containment / prefix / suffix (returns `@True` / `@False`).

One line to close: cut a piece with `@Left` / `@Right` / `@Middle` (remember they take delimiters), grab a piece with `@Word` (`-1` for the last), swap text with `@ReplaceSubstring` (case-sensitive, parallelizable).

The next part turns to a common concrete need: **handling Notes names in formula** — how `@Name`'s `[CN]` / `[Abbreviate]` / `[Canonicalize]` convert between the three name formats.
