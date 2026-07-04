---
title: "The Content-Carrying DOM Nodes: TextNode, AttributeNode, Comment, CDATASection in LotusScript"
description: "Once you're walking a parsed DOM, the actual data lives in the content nodes — text, attributes, comments, CDATA. This article covers the inheritance (CharacterData is the base of Text/Comment/CDATA; CDATA derives from Text; AttributeNode stands apart), the CharacterData editing methods, and the single biggest gotcha: the LotusScript binding reads content through NodeValue — there is no W3C-style Data, Length, Name, or Value property."
pubDate: 2026-07-04T07:30:00+08:00
lang: en
slug: notes-dom-text-node
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMCharacterDataNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMCHARACTERDATANODE_CLASS.html"
  - title: "NotesDOMTextNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMTEXTNODE_CLASS.html"
  - title: "NotesDOMAttributeNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMATTRIBUTENODE_CLASS.html"
relatedJava: []
relatedSsjs: []
---

The [previous article](/domino-news/en/posts/notes-dom-document-node) covered getting around a parsed DOM — document, elements, node lists. But the elements are mostly scaffolding; the *data* is in the leaves: the text inside a tag, the value of an attribute, a comment, a CDATA block. These are the content-carrying nodes, and the LotusScript binding for them has one surprise big enough to break your first attempt.

If you come from JavaScript or Java, you'll reach for `.data`, `.length`, `.name`, `.value` — and none of them exist. The Domino LotusScript DOM exposes character content through the inherited **`NodeValue`**, and attribute name/value through **`AttributeName` / `AttributeValue`**. Use the W3C names and the code won't compile.

---

## TL;DR

- **Read text/comment/CDATA content through `NodeValue`** (inherited from `NotesDOMNode`). There is **no `Data` and no `Length` property** in this binding.
- **Attribute name/value are `AttributeName` (read-only) and `AttributeValue` (read-write)** — not `Name`/`Value`. Plus `IsSpecified` (was it explicitly set in the source?).
- Inheritance: [`NotesDOMCharacterDataNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMCHARACTERDATANODE_CLASS.html) is the abstract base of **TextNode**, **CommentNode**, **CDATASectionNode**; **CDATASection derives from Text**; **AttributeNode** sits directly on `NotesDOMNode`, not under CharacterData.
- CharacterData editing methods: `SubstringData`, `AppendData`, `InsertData`, `DeleteData`, `ReplaceData`.
- [`NotesDOMTextNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMTEXTNODE_CLASS.html) adds `SplitText` — "Breaks this node into two nodes at the specified offset, keeping both in the tree as siblings." CDATASection inherits it; Comment does not.
- All **new with Release 6, not supported in COM**.

## The inheritance, and why it matters

```
NotesDOMNode
├─ NotesDOMCharacterDataNode   (abstract — never instantiated directly)
│   ├─ NotesDOMTextNode
│   │   └─ NotesDOMCDATASectionNode
│   └─ NotesDOMCommentNode
└─ NotesDOMAttributeNode        (separate — NOT character data)
```

`NotesDOMCharacterDataNode` — "Represents character data in a DOM node" — is abstract: "you do not create NotesDOMCharacterDataNode objects. Instead, you create objects for a specific derived node class." Its value is that Text, Comment and CDATASection all inherit the same five editing methods from it. The two-level chain (CDATASection → Text → CharacterData) means a CDATA node *also* has `SplitText`, while a Comment does not. And `NotesDOMAttributeNode` is deliberately off to the side — an attribute is character-ish but it's not a CharacterDataNode, so it has its own `AttributeName` / `AttributeValue` accessors instead of the editing methods.

## Reading content — via NodeValue

When you land on a text, comment, or CDATA node while walking the tree, the content is in `NodeValue`:

```lotusscript
Select Case node.NodeType
Case DOMNODETYPE_TEXT_NODE          ' 3
  Print "Text: [" & node.NodeValue & "]"
Case DOMNODETYPE_COMMENT_NODE       ' 8
  Print "Comment: " & node.NodeValue
Case DOMNODETYPE_CDATASECTION_NODE  ' 4
  Print "CDATA: " & node.NodeValue
End Select
```

The official walk-tree example reads exactly this way — `node.NodeValue` for all three. There is no `.Data`; reaching for it is the number-one compile error people hit porting DOM code into LotusScript.

## Attributes — AttributeName / AttributeValue

An [attribute node](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMATTRIBUTENODE_CLASS.html) comes from an element's `Attributes` map. Read it with the typed accessors (the inherited `NodeName` / `NodeValue` also work, and the official example uses them):

```lotusscript
Dim attrs As NotesDOMNamedNodeMap
Set attrs = element.Attributes
Dim i As Integer
For i = 1 To attrs.NumberOfEntries
  Dim a As NotesDOMAttributeNode
  Set a = attrs.GetItem(i)
  Print a.AttributeName & " = " & a.AttributeValue
  If Not a.IsSpecified Then Print "  (defaulted, not in source)"
Next
```

`IsSpecified` "Indicates whether or not this attribute was explicitly given a value in the original document" — handy when a DTD supplies defaults and you want to know which attributes the author actually wrote. Note what's **absent**: no `Name`, no `Value`, no `Specified`, no `OwnerElement`. The binding is a renamed subset of W3C DOM, not a mirror of it.

## Editing character data

The five `CharacterData` methods let you manipulate content in place — useful when transforming a parsed tree before re-serialising:

```lotusscript
' textNode currently holds "Hello"
Call textNode.AppendData(" World")              ' -> "Hello World"
Call textNode.InsertData(5, ",")                ' -> "Hello, World"
Print textNode.SubstringData(0, 5)              ' -> "Hello"
Call textNode.DeleteData(5, 1)                  ' remove the comma
Call textNode.ReplaceData(0, 5, "Howdy")        ' -> "Howdy World"

' Text-only: split into two sibling text nodes at offset 5
Dim tail As NotesDOMTextNode
Set tail = textNode.SplitText(5)
```

`SplitText` is the one method unique to Text (and inherited by CDATASection) — Comment nodes don't have it, because splitting a comment in two has no meaningful tree semantics.

This is the second of three pieces on the Domino DOM node classes — the [first](/domino-news/en/posts/notes-dom-document-node) covered navigation, and the [third](/domino-news/en/posts/notes-dom-xmldecl-node) covers the DTD/declaration tier and SAX error handling.

## What about Java and SSJS?

As with the navigation classes, there's no clean Domino-API counterpart to point at — XML DOM work in Java and XPages goes through the standard `org.w3c.dom` interfaces (`Text`, `Attr`, `Comment`, `CDATASection`), not a `lotus.domino` class. Those W3C interfaces are worth knowing precisely because they're the names this LotusScript binding *renamed*: what W3C calls `Node.getNodeValue()` / `CharacterData.getData()` / `Attr.getValue()` collapses here to `NodeValue` and `AttributeValue`. So `relatedJava` and `relatedSsjs` are empty — the equivalent in those languages is the platform DOM, not a Domino object.
