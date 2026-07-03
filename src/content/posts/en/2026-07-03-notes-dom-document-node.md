---
title: "Walking a Parsed XML DOM in LotusScript: DocumentNode, ElementNode, NodeList, NamedNodeMap"
description: "Once NotesDOMParser has parsed your XML, you navigate the result with a family of node classes. This article covers getting the root from domParser.Document, reaching the root element via DocumentElement, querying with GetElementsByTagName (which returns a NotesDOMNodeList), reading attributes through an element's NamedNodeMap, and the LotusScript-specific quirks: 1-based GetItem, no ChildNodes property (walk FirstChild/NextSibling), and no GetItemByName."
pubDate: 2026-07-03T07:30:00+08:00
lang: en
slug: notes-dom-document-node
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMDocumentNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTNODE_CLASS.html"
  - title: "NotesDOMElementNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMELEMENTNODE_CLASS.html"
  - title: "NotesDOMNamedNodeMap class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNAMEDNODEMAP_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-dom-document-node.webp"
coverStyle: "art-deco"
---

You've fed an XML file through [`NotesDOMParser`](/domino-news/en/posts/notes-dom-parser) and called `Process`. Now you have a tree in memory and need to pull values out of it — the root element, every `<item>` under it, the `id` attribute on each. The navigation surface is a small family of node classes, and while it follows the W3C DOM shape, the LotusScript binding has a few sharp edges worth knowing before you write the loop.

This is the first of three pieces on the Domino DOM node classes: navigation here, the [content-carrying node types](/domino-news/en/posts/notes-dom-text-node) next, and the [DTD/declaration tier plus SAX error handling](/domino-news/en/posts/notes-dom-xmldecl-node) after that.

---

## TL;DR

- After `Set domParser = session.CreateDOMParser(inStream, outStream)` and `domParser.Process`, the root is `domParser.Document` — a `NotesDOMDocumentNode`. "There is only one document node in a DOM tree."
- The root *element* is `documentNode.DocumentElement`; the document node itself is above it.
- `GetElementsByTagName(name)` (on the document or any element) returns a `NotesDOMNodeList` of matching elements.
- **`GetItem` is 1-based** — iterate `For i = 1 To list.NumberOfEntries`. This is the single biggest trap coming from JavaScript/Java DOM.
- An element's attributes come from its `Attributes` property as a `NotesDOMNamedNodeMap` — also 1-based `GetItem`. To fetch one attribute by name, use the element's `GetAttribute(name)` / `GetAttributeNode(name)` — there is **no `GetItemByName`**.
- There is **no `ChildNodes` NodeList property** — walk children with `FirstChild` + `NextSibling` (+ `NumberOfChildNodes`).
- All these classes are **new with Release 6, not supported in COM**.

## The shape of the tree

Every node — document, element, text, attribute — derives from `NotesDOMNode`, which carries the navigation properties: `NodeName`, `NodeType`, `NodeValue`, `ParentNode`, `FirstChild`, `LastChild`, `NextSibling`, `PreviousSibling`, `Attributes`, `NumberOfChildNodes`, and the all-important `IsNull` guard. You discriminate node kinds by comparing `NodeType` to the `DOMNODETYPE_*` constants:

| Constant | Value |
|---|---|
| `DOMNODETYPE_ELEMENT_NODE` | 1 |
| `DOMNODETYPE_ATTRIBUTE_NODE` | 2 |
| `DOMNODETYPE_TEXT_NODE` | 3 |
| `DOMNODETYPE_COMMENT_NODE` | 8 |
| `DOMNODETYPE_DOCUMENT_NODE` | 9 |

(The full list runs 0–13; the others come up in the [later articles](/domino-news/en/posts/notes-dom-text-node).)

The [`NotesDOMDocumentNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTNODE_CLASS.html) sits at the top — "the root of the document tree" — and adds one key property over the base node: `DocumentElement`, which jumps you straight to the root element. The [`NotesDOMElementNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMELEMENTNODE_CLASS.html) adds `TagName` and the attribute accessors `GetAttribute` / `GetAttributeNode`.

## Querying and reading attributes

`GetElementsByTagName` "Returns a NotesDOMNodeList of all descendant elements with a given tag name, in the order in which they are encountered." The list exposes `NumberOfEntries` and a **1-based** `GetItem`:

```lotusscript
Dim session As New NotesSession
Dim inStream As NotesStream, outStream As NotesStream
Set inStream = session.CreateStream
Call inStream.WriteText(|<order id="A1"><line sku="X9">Widget</line><line sku="Z2">Gadget</line></order>|)
inStream.Position = 0
Set outStream = session.CreateStream

Dim domParser As NotesDOMParser
Set domParser = session.CreateDOMParser(inStream, outStream)
domParser.Process

Dim docNode As NotesDOMDocumentNode
Set docNode = domParser.Document

Dim root As NotesDOMElementNode
Set root = docNode.DocumentElement
Print "Root element: " & root.TagName & ", id=" & root.GetAttribute("id")

Dim lines As NotesDOMNodeList
Set lines = root.GetElementsByTagName("line")
Dim i As Integer
For i = 1 To lines.NumberOfEntries          ' 1-based!
  Dim el As NotesDOMElementNode
  Set el = lines.GetItem(i)
  Print "line sku=" & el.GetAttribute("sku")
Next
```

*(Adapted — the parser requires a `NotesStream`, so the XML is written into one rather than passed as a string.)*

To enumerate *all* attributes of an element rather than fetch one by name, go through its `Attributes` property — a [`NotesDOMNamedNodeMap`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNAMEDNODEMAP_CLASS.html), "used by methods of the NotesDOMNode class for returning the list of an element node's attributes." Same 1-based `GetItem`:

```lotusscript
Dim attrs As NotesDOMNamedNodeMap
Set attrs = root.Attributes
For i = 1 To attrs.NumberOfEntries
  Print attrs.GetItem(i).NodeName & " = " & attrs.GetItem(i).NodeValue
Next
```

There's no `GetItemByName` on the map — when you know the attribute name, the element's `GetAttribute(name)` is the direct route.

## The full recursive walk

When you don't know the structure ahead of time, recurse with `FirstChild` / `NextSibling`, branching on `NodeType`. This is the official pattern:

```lotusscript
Sub walkTree(node As NotesDOMNode)
  If node.IsNull Then Exit Sub
  Select Case node.NodeType
  Case DOMNODETYPE_DOCUMENT_NODE
    Dim child As NotesDOMNode
    Set child = node.FirstChild
    Dim n As Integer
    n = node.NumberOfChildNodes
    While n > 0
      Call walkTree(child)
      Set child = child.NextSibling
      n = n - 1
    Wend
  Case DOMNODETYPE_ELEMENT_NODE
    Print "Element: " & node.NodeName
    Dim kid As NotesDOMNode
    Set kid = node.FirstChild
    Dim m As Integer
    m = node.NumberOfChildNodes
    While m > 0
      Call walkTree(kid)
      Set kid = kid.NextSibling
      m = m - 1
    Wend
  Case DOMNODETYPE_TEXT_NODE
    Print "Text: " & node.NodeValue
  End Select
End Sub
```

The shape — `IsNull` guard, `Select Case node.NodeType`, walk children by count via `FirstChild`/`NextSibling` — is exactly what the [official `NotesDOMParser` walk-tree example](/domino-news/en/posts/notes-dom-parser) uses. Note there's no `node.ChildNodes` to iterate; `NumberOfChildNodes` + sibling-stepping is how you traverse.

## What about Java and SSJS?

This is the unusual case where there's **no clean Domino-API counterpart**. The `NotesDOM*` node family is a LotusScript (and Java-agent) facility in the Domino API; the standard route for XML DOM work in Java and XPages is the platform's own `org.w3c.dom` / JAXP stack, not a `lotus.domino` class. So `relatedJava` and `relatedSsjs` are intentionally empty here — if you're doing this in Java, you'd reach for `javax.xml.parsers.DocumentBuilder` and the W3C interfaces rather than a Domino class, which (unlike the Domino binding) are 0-based and use `getData()` / `getChildNodes()` in the canonical W3C shape.
