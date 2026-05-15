---
title: "Parsing XML in LotusScript — DOM or SAX? Five Questions That Pick the Right Tool"
description: "LotusScript offers three routes for XML processing: NotesDOMParser (whole-tree load), NotesSAXParser (event-driven streaming), and NotesXMLProcessor + NotesXSLTransformer (rule-based XSLT transformation). This guide compares the three at a fundamental level, walks five decision questions (file size / modification needs / traversal direction / memory budget / transformation scenario), gives practical scenario picks, code-style side-by-side, performance numbers, and a consolidated pitfalls table. After reading you'll know exactly which tool to reach for when an XML file lands."
pubDate: 2026-05-18T07:30:00+08:00
lang: en
slug: notes-xml-parser-dom-vs-sax
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDOMParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html"
  - title: "NotesSAXParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXPARSER_CLASS.html"
  - title: "NotesXMLProcessor class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html"
relatedJava: ["DOMParser", "SAXParser", "XSLTransformer"]
relatedSsjs: ["DOMParser", "SAXParser", "XSLTransformer"]
---

## TL;DR

You have an XML file in LotusScript — three routes, each with its niche:

| Route | Right for | Wrong for |
|---|---|---|
| **[NotesDOMParser](/domino-news/en/posts/notes-dom-parser)** (DOM) | Small-to-medium XML, modification, random-access walking | Large files, pure read |
| **[NotesSAXParser](/domino-news/en/posts/notes-sax-parser)** (SAX) | Large files, pure read, extracting specific elements | Modification, random-access walking |
| **[NotesXMLProcessor + NotesXSLTransformer](/domino-news/en/posts/notes-xml-processor)** (XSLT) | Rule-based XML → XML (or HTML) transformation | Complex conditional logic, calculations |

Five decision questions to pick the right one in 30 seconds:

1. File size?
2. Need to modify?
3. Traversal direction?
4. Memory budget?
5. Is it XML → XML transformation?

Picking wrong doesn't break things, but you'll suffer — 100 MB XML through DOM is an OOM; modifying XML through SAX is hand-rolled pain.

## The three approaches at a fundamental level

| Aspect | DOM (NotesDOMParser) | SAX (NotesSAXParser) | XSLT (NotesXSLTransformer) |
|---|---|---|---|
| Model | Whole tree loaded into memory | Event-driven streaming | Rule-based transformation |
| Memory | Proportional to file size | Constant | Proportional to XML size (DOM underneath) |
| Traversal | Random access in any direction | Forward-only, single pass | XPath selectors |
| Modification | Yes | No (read-only) | Emits a new version via XSLT templates |
| Code shape | Linear (parse → walk → modify → serialize) | Event handlers + global state | Write an XSLT stylesheet (separate language) |
| Learning curve | Medium (W3C DOM concepts) | Medium-high (event-driven + state machine) | High (XSLT is its own language) |
| Introduced | R6+ | R6+ | Later (XSLT generation) |

## Five decision questions

### Question 1: File size?

| Size | Pick |
|---|---|
| < 1 MB | Anything — DOM is most pleasant to write |
| 1 - 10 MB | DOM is still fine, SAX also works |
| 10 - 100 MB | Lean toward SAX, DOM starts pressuring memory |
| > 100 MB | SAX mandatory, DOM will OOM |

In practice 90% of XML integrations (API responses, config files, DXL exports) are under 1 MB — DOM is the no-brainer.

### Question 2: Need to modify the XML?

- **Yes → DOM** (or XSLT for transformation scenarios). SAX **can't modify** XML
- **No → either SAX or DOM works**

Note: "I want to emit a modified version of the input but don't need to incrementally modify it" is exactly when XSLT is the real tool — describe input shape / output shape declaratively in a stylesheet, transformation becomes rule-based and maintainable.

### Question 3: Traversal direction?

- **Forward-only is enough** (read through once, extract specific elements) → SAX
- **Need to look back, jump to parent, compare with sibling** → DOM

Example: "find each `<order>` whose `<total>` is greater than its `<budget>`" — need random access inside the `<order>` subtree, DOM fits. "list every `<product>` name" — one forward pass, SAX fits.

### Question 4: Memory budget?

- **Generous** (multi-GB heap) → DOM, freely
- **Tight** (agent runtime limits, shared environment, low-spec server) → SAX

Client-side agents have a tighter memory budget than server scheduled agents. Processing big XML in a client agent → SAX is mandatory.

### Question 5: Is it XML → XML / XML → HTML transformation?

- **Yes, and transformation rules are stable** → XSLT ([NotesXMLProcessor + NotesXSLTransformer article](/domino-news/en/posts/notes-xml-processor))
- **Yes, but transformation has complex conditions / calculations** → DOM, write the transformation yourself
- **No** → DOM / SAX

XSLT is declarative — describe what the output should look like, the XSLT engine handles the rest. Complex branching is awkward in XSLT — at that point DOM + LS code is cleaner.

## Combined decision tree

The five questions strung together:

```
You have an XML file
  │
  ├─ Rule-based XML → XML / HTML transformation? ───────────► XSLT
  │
  ├─ Need to modify the XML? ────── Yes ─────────────────────► DOM
  │                                  │
  │                                  No
  │                                  │
  ├─ File > 100 MB? ──────────────── Yes ─────────────────────► SAX
  │                                  │
  │                                  No
  │                                  │
  ├─ Memory tight? ───────────────── Yes ─────────────────────► SAX
  │                                  │
  │                                  No
  │                                  │
  ├─ Need random-access traversal (parent / sibling)? ─ Yes ──► DOM
  │                                  │
  │                                  No
  │                                  │
  └─ ► DOM (small file, forward-only OK, easier to write)
```

## Code-style side-by-side

Same task — extract every `<title>` text — DOM vs SAX:

### DOM (walk freely, simple flow)

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim parser As NotesDOMParser
    Dim s As NotesStream

    Set s = session.CreateStream
    Call s.Open("c:\data\books.xml")

    Set parser = session.CreateDOMParser(s, Nothing)
    Call parser.Process()

    ' One recursive function handles it
    Call PrintTitles(parser.Document)
End Sub

Sub PrintTitles(node As NotesDOMNode)
    If node.NodeType = DOMNODETYPE_ELEMENT_NODE Then
        Dim e As NotesDOMElementNode
        Set e = node
        If e.TagName = "title" And e.HasChildNodes Then
            Print e.FirstChild.NodeValue
        End If
    End If
    Dim c As NotesDOMNode
    Set c = node.FirstChild
    Do Until c Is Nothing
        Call PrintTitles(c)
        Set c = c.NextSibling
    Loop
End Sub
```

Linear thinking: parse → recurse → print.

### SAX (state machine, global variables)

```lotusscript
Option Public

Dim insideTitle As Boolean
Dim currentText As String

Sub Initialize
    Dim session As New NotesSession
    Dim parser As NotesSAXParser
    Dim s As NotesStream

    Set s = session.CreateStream
    Call s.Open("c:\data\books.xml")

    Set parser = session.CreateSAXParser(s, Nothing)
    On Event SAX_StartElement From parser Call OnStart
    On Event SAX_EndElement   From parser Call OnEnd
    On Event SAX_Characters   From parser Call OnChars
    Call parser.Parse()
End Sub

Sub OnStart(Source As NotesSAXParser, NS As String, _
        LocalName As String, QName As String, Attrs As NotesSAXAttributeList)
    If LocalName = "title" Then
        insideTitle = True
        currentText = ""
    End If
End Sub

Sub OnChars(Source As NotesSAXParser, Chars As String, Start As Long, Length As Long)
    If insideTitle Then
        currentText = currentText & Mid(Chars, Start + 1, Length)
    End If
End Sub

Sub OnEnd(Source As NotesSAXParser, NS As String, _
        LocalName As String, QName As String)
    If LocalName = "title" Then
        Print currentText
        insideTitle = False
    End If
End Sub
```

State-machine thinking: track "which element am I currently in" via globals, accumulate in Characters, emit in EndElement.

**Same functional output, SAX is roughly twice the lines** and higher mental overhead — but the memory profile is ~1/100 of DOM. The tradeoff is explicit.

## Performance and memory (rough numbers)

For a 10 MB XML file (~50,000 elements):

| Tool | Parse time | Peak memory | Walk-once time |
|---|---|---|---|
| DOM | ~5 sec | ~80 MB | ~0.5 sec (in-memory) |
| SAX | ~3 sec (combined parse+walk) | ~5 MB | n/a — parse and walk are the same pass |
| XSLT | ~6-10 sec | ~80 MB | same as parse |

Observations:

- **SAX parsing is faster than DOM** — no tree construction overhead
- **DOM peak memory is roughly 8× the file size** — node object overhead is real
- **DOM walking is essentially free** — one parse, any number of cheap walks

If you need to walk multiple times (e.g. cross-referencing different elements), DOM still wins on total cost.

## Consolidated pitfalls table

| Pitfall | DOM | SAX | XSLT |
|---|---|---|---|
| Forgot to Serialize after modifying | ✅ Easy to hit — change tree but never serialize | n/a (can't modify) | n/a |
| Missing error handler | ⚠️ Check `Log` property after parse | ✅ Skipping `SAX_FatalError` causes silent fail | n/a |
| Large file OOM | ✅ Hits at 100 MB+ | n/a | ✅ Same as DOM |
| Text is a child node | ✅ Can't do `elem.Text` directly | n/a (text comes via Characters event) | n/a |
| Characters fires multiple times | n/a | ✅ Same text run may fire multiple times | n/a |

## The XML toolchain in 14.5 — basically unchanged

LotusScript's XML tooling hasn't moved in years — `NotesDOMParser` / `NotesSAXParser` / `NotesXMLProcessor` were introduced in R6 and the API stabilized. **The 14.5 series added no new XML classes or major API changes** ([14.5.1 What's New](https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html) is mostly about JSON Copy and OIDC tokens).

The upside: learn it once, use it for ten years. Today's API runs on R6 / R8 / R9 / 12.x / 14.x without change.

## What about Java and SSJS?

| Language | DOM | SAX | XSLT |
|---|---|---|---|
| LotusScript | `NotesDOMParser` | `NotesSAXParser` | `NotesXMLProcessor` + `NotesXSLTransformer` |
| Java | `lotus.domino.DOMParser` or standard `javax.xml.parsers.DocumentBuilderFactory` | `lotus.domino.SAXParser` or standard `javax.xml.parsers.SAXParserFactory` | `javax.xml.transform.Transformer` |
| SSJS (XPages) | Usually uses Java's javax.xml.parsers directly | Same | Same as Java |

**The Java/SSJS advantage**: you can drop down to the standard `javax.xml.parsers` API which is richer than `lotus.domino.*` (XPath, Schema validation, Streaming XPath, etc.). LotusScript is stuck with `NotesDOMParser` / `NotesSAXParser` — no choice.

If LS XML processing has become painful, **rewriting that piece as a Java agent** is often the right move — performance and capability both step up.

## Closing

XML processing is a hard requirement for LS integration work. Three routes, each with its niche:

1. **Default to DOM** — small file, easy to write, modifiable, serializable
2. **Switch to SAX above 10 MB or when memory is tight** — streaming, event-handler style is harder to write but memory stays constant
3. **Use XSLT for rule-based transformations** — declarative, maintainable, steeper learning curve but long-term win

The decision tree to remember: **modify? big file? random walk?** — pick one of three.

Read alongside the two deep-dive pieces from earlier this week:

- [5/16 NotesSAXParser deep dive](/domino-news/en/posts/notes-sax-parser)
- [5/17 NotesDOMParser deep dive](/domino-news/en/posts/notes-dom-parser)
- [5/6 NotesXMLProcessor + XSLT (same toolchain, transformation route)](/domino-news/en/posts/notes-xml-processor)

That closes the loop on the LS XML triad.
