---
title: "Why Your Domino View Header Is Forever Off by One Column: Passthrough-HTML Black Magic"
description: "Inherit an old classic-web Domino view and you'll often find the column headers sitting one cell to the right of the data — and nobody knows why. A field report on the passthrough-HTML tricks hiding in twenty-year-old view designs: square-bracket HTML in column values and titles, spacer columns, per-row checkboxes, and the real culprit — an intentionally unclosed <input tag that swallows the </td><td> boundary and merges two columns into one cell, shifting every header after it."
pubDate: 2026-07-22T07:30:00+08:00
lang: en
slug: notes-view-passthrough-html
tags:
  - "Formula"
  - "Domino Designer"
  - "Tutorial"
sources:
  - title: "URL commands for opening servers, databases, and views — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
  - title: "OpenView @Command (Formula Language) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENVIEW.html"
  - title: "The input element — MDN (void elements and tag parsing)"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"
relatedJava: []
relatedSsjs: []
---

You inherit a twenty-year-old Domino application. Open one of its views in the browser — the old [`?OpenView`](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) classic-web kind — and the column headers are subtly wrong: every heading sits one cell to the right of the data it labels. It's been that way for years; the last three people to touch it shrugged and moved on. Nobody knows why, and nobody wants to be the one who "fixes" it and breaks something.

The cause is a passthrough-HTML trick that isn't in any manual, and once you can see it, the off-by-one header is obvious. This is a field report on the black magic old classic-web views are doing — tested on Domino 12.x with Chrome/Edge, classic `?OpenView` rendering (none of this applies to XPages or the REST API, which render views completely differently). All examples use a de-identified `myview.nsf` / `VwDemo`.

---

## TL;DR

- Domino outputs `[...]` in a view **column value or column title formula** as raw HTML — that's passthrough HTML. It's how classic views inject checkboxes, colours, and layout with no template.
- Common uses: a **spacer column** whose entire value is `"[<td></td>]"`, a **per-row checkbox** built from `$$SelectDoc`, and a **select-all checkbox** in a column *title*.
- **The trick that breaks headers:** an old checkbox column is written with an **intentionally unclosed** `<input` tag — no closing `>`. The browser's parser then swallows everything up to the *next* `>`, including Domino's own `</td><td>` cell boundary and the start of the next column — merging two columns into one cell.
- **The side effect:** the header row still emits one `<td>` per column, so it now has one cell *more* than the merged data rows — and every header from the merge point on shifts one column right. That's your "header off by one."
- **Diagnosing it:** data-row cell count ≠ header cell count almost always means passthrough is at work; junk attributes in DevTools like `2"=""` or `face="新細明體"` are the swallowed remains of the next column.

## Passthrough HTML, the foundation

In a classic web view, Domino renders each column into an HTML table cell. If a column's *value formula* produces text wrapped in square brackets, Domino emits the bracket contents as literal HTML instead of escaping it. The same is true for a column's static *title*. That one behaviour is the engine behind every trick below.

Three you'll see constantly:

```
Spacer column (whole column value):   "[<td></td>]"
Per-row checkbox (column value):      "[<input type=\"checkbox\" name=\"$$SelectDoc\" value=\"" + @Text(@DocumentUniqueID) + "\">]"
Select-all checkbox (column TITLE):   [<input type="checkbox" name="AllCheck" onclick="SCheck()">]
```

The spacer column injects an empty `<td>` to nudge spacing. The per-row checkbox uses the special `$$SelectDoc` field name so classic Domino wires it into document selection. The select-all lives in the column *title* so it renders once in the header. All three are legitimate, documented passthrough. The trouble starts when passthrough is used to do something the parser wasn't meant to allow.

## The unclosed tag that eats a column boundary

Here is the same checkbox column, written the old way — look closely at the end:

```
Old "merged" version:   "[<input type=\"checkbox\" name=\"$$SelectDoc\" value=\"" + @Text(@DocumentUniqueID) + "\" ]"
Fixed "independent" version:   "[<input type=\"checkbox\" name=\"$$SelectDoc\" value=\"" + @Text(@DocumentUniqueID) + "\">]"
```

The old version has **no closing `>`** on the `<input`. That's not a typo — it's load-bearing. To see why, follow what the browser actually does. Domino emits this for two adjacent columns (checkbox, then a subject column):

```html
<td><input type="checkbox" name="$$SelectDoc" value="ABC123" </td><td><font size="2" face="新細明體">Subject text</font></td>
```

The `<input` tag was never closed, so [the HTML parser keeps reading attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) until it finds the next `>`. The next `>` is at the end of `<font size="2">`. So everything in between — `</td><td><font size="2"` — gets **consumed as attributes of the `<input>`**. The cell boundary Domino carefully emitted (`</td><td>`) is swallowed. The `2"` from `size="2"` becomes a stray boolean attribute; `face="新細明體"` becomes a real (nonsense) attribute on the input. Open DevTools on such a page and you'll see exactly that: an `<input>` carrying `2"=""` and `face="新細明體"`. Those junk attributes are the *fingerprint* of an unclosed tag upstream.

The visible result: the checkbox and the subject end up in the **same cell**, because the boundary between them no longer exists. Two columns rendered as one.

## Why the header ends up off by one

Now the off-by-one falls out for free. The **header row is generated separately** — Domino emits one `<td>` per column for the titles, and none of those title cells has an unclosed tag. So the header row has its full, correct number of cells, while every *data* row is short by one (two columns merged into one). From the merge point rightward, each heading now sits above the *next* column's data. The header isn't "misaligned" by some CSS bug — it has literally one more cell than the rows it's labelling.

That asymmetry is also the fix. Put the `>` back on the `<input>` (the "independent" version above), and the two columns separate again; the data rows regain their missing cell, and the headers line up on their own — no CSS change needed. The one caution: some old pages have JavaScript that *depends* on the merged structure (walking sibling cells by index), so check any selection or row-highlight script before you close the tag.

## A diagnosis checklist

When a classic view looks structurally wrong, run down this list:

- **Count the cells.** Data-row `<td>` count ≠ header-row `<td>` count → passthrough is merging or injecting cells somewhere. This single check catches most of it.
- **Look for junk attributes.** In DevTools, an element carrying attributes like `2"=""`, `face="..."`, or a stray `</td` fragment means an **unclosed tag upstream** ate the next column's markup.
- **Know what's structural vs stateful.** A category row's cell has a real `colspan`; that's structural. But classes like `TR0_Out` / `TR1_Out` are swapped in by mouse-event JavaScript for row state — they're not a fixed row type, so don't write CSS selectors that assume they are.

## Scope and caveats

This is classic-web ([`?OpenView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENVIEW.html)) territory. XPages and the Domino REST API build their markup entirely differently and none of this passthrough behaviour — or its failure mode — applies there. The parser behaviour itself is browser-standard (an unclosed tag swallowing to the next `>` is how HTML tokenisation works), so it reproduces in any modern browser; the tests here were on Chrome/Edge against Domino 12.x. If you're maintaining one of these old views, the off-by-one header is almost never worth living with once you know it's a missing `>` — but read the page's JavaScript before you add it back.
