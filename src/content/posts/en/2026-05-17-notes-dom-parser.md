---
title: "NotesDOMParser Deep Dive — Loading XML into a DOM Tree, 14 Node Classes, Walking / Modifying / Serializing"
description: "NotesDOMParser loads the entire XML into memory as a DOM tree — with NotesDOMDocumentNode as the root and 14 Node subclasses (Element / Text / Attribute / Comment / CDATA / ...) representing XML constructs. You can walk anywhere, modify anything, and Serialize back to XML output. This guide covers the DOM tree model, CreateDOMParser, the 14 Node class relationships, NotesDOMNode's tree-walking API (FirstChild / NextSibling / NodeType), a complete parse → walk → modify → serialize example, five pitfalls, and Java/SSJS counterparts."
pubDate: 2026-05-17T07:30:00+08:00
lang: en
slug: notes-dom-parser
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDOMParser class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html"
  - title: "Examples: NotesDOMParser class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOMPARSER_CLASS_EX.html"
  - title: "NotesDOMNode class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODE_CLASS.html"
  - title: "NotesXMLProcessor class (base) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html"
relatedJava: ["DOMParser"]
relatedSsjs: ["DOMParser"]
cover: "/covers/notes-dom-parser.webp"
coverStyle: "art-deco"
---

## TL;DR

[`NotesDOMParser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html) — HCL: "Processes input XML into a standard DOM (Document Object Model) tree structure." The whole XML becomes a tree in memory, with 14 Node subclasses representing the various XML constructs.

Four key points:

1. **Whole file in memory** — the opposite of [SAX](/domino-news/en/posts/notes-sax-parser). The right choice for **small-to-medium XML when you need random access or modification**
2. **`Document` property is the entry point** — gives you the root `NotesDOMDocumentNode`; walk via `FirstChild` / `NextSibling` / `ParentNode`
3. **14 Node subclasses** all inheriting from [`NotesDOMNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODE_CLASS.html) — Element / Text / Attribute / Comment / CDATA / ProcessingInstruction / and 8 others
4. **`Serialize` writes the tree back out as XML** — after you modify the tree, serialize emits it to the output stream

Compared to the [NotesSAXParser piece](/domino-news/en/posts/notes-sax-parser): SAX is forward-only streaming; DOM is random-access tree.

## What the DOM tree looks like

Take this XML:

```xml
<library>
    <book id="b1">
        <title>The Hobbit</title>
        <author>Tolkien</author>
    </book>
    <book id="b2">
        <title>Dune</title>
    </book>
</library>
```

The DOM tree looks like this:

```
Document (root, NotesDOMDocumentNode)
└─ library (Element)
   ├─ book (Element, attribute id="b1")
   │  ├─ title (Element)
   │  │  └─ "The Hobbit" (TextNode)
   │  └─ author (Element)
   │     └─ "Tolkien" (TextNode)
   └─ book (Element, attribute id="b2")
      └─ title (Element)
         └─ "Dune" (TextNode)
```

Every XML construct — element, text, attribute, comment — is a **Node object**, all subclasses of `NotesDOMNode`. Once loaded, you can walk anywhere, modify anything, serialize back out.

## Starting from NotesSession.CreateDOMParser

[`NotesDOMParser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPARSER_CLASS.html) is created via `session.CreateDOMParser`:

```lotusscript
Dim session As New NotesSession
Dim domParser As NotesDOMParser
Dim xml_in As NotesStream
Dim xml_out As NotesStream

Set xml_in = session.CreateStream
Call xml_in.Open("c:\data\library.xml")

Set xml_out = session.CreateStream
Call xml_out.Open("c:\data\library_modified.xml")
Call xml_out.Truncate

Set domParser = session.CreateDOMParser(xml_in, xml_out)
Call domParser.Process()   ' Start parsing — loads whole file into a tree
```

`Process()` triggers parsing (inherited from the [`NotesXMLProcessor`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXMLPROCESSOR_CLASS.html) base class). `Parse()` is also available.

## NotesDOMParser properties and methods

| Property | Purpose |
|---|---|
| `Document` | Read-only. After parsing, the root `NotesDOMDocumentNode` |
| `DoNamespaces` | Read-write. Whether to enable namespace validation |
| `ExpandEntityReferences` | Read-write. Whether entity references should be expanded to their text |
| `InputValidationOption` | Read-write. If the XML declares a DTD, validate against it |
| `ExitOnFirstFatalError` | Read-write. Stop on the first fatal error |
| `Log` / `LogComment` | XML log of warnings, errors, and fatal errors during parsing |

| Method | Purpose |
|---|---|
| `Process()` | Trigger parsing (inherited from NotesXMLProcessor) |
| `Parse(input, output)` | Same, with optional input/output override |
| `Serialize()` | Walk the tree and emit XML to the output stream |
| `Output(text)` | Write text directly to output |
| `SetInput(stream)` | Override the previously set input |
| `SetOutput(stream)` | Override the previously set output |

## The 14 Node classes

Per the official docs, a DOM tree is built from these 14 Node classes, all inheriting from `NotesDOMNode`:

| Class | What it represents |
|---|---|
| `NotesDOMDocumentNode` | "Represents the entire XML document. The root of the document tree" |
| `NotesDOMElementNode` | "Represents an element in an XML document" (a `<tag>`) |
| `NotesDOMAttributeNode` | "Represents an attribute in a NotesDOMElementNode object" |
| `NotesDOMTextNode` | "Represents the textual content of an element or attribute" |
| `NotesDOMCommentNode` | "Represents a comment in the XML" (`<!-- ... -->`) |
| `NotesDOMCDATASectionNode` | "Represents a CDATA section in the XML data source" |
| `NotesDOMProcessingInstructionNode` | "Represents a processing instruction" (`<?target data?>`) |
| `NotesDOMCharacterDataNode` | "Represents character data in a DOM node" |
| `NotesDOMDocumentFragmentNode` | "Represents a document fragment in the XML" |
| `NotesDOMDocumentTypeNode` | "The list of entities that are defined for the document" |
| `NotesDOMEntityNode` | "Represents an entity node in the XML" |
| `NotesDOMEntityReferenceNode` | "Represents an entity reference node in the XML" |
| `NotesDOMNotationNode` | "Represents a notation declared in the DTD" |
| `NotesDOMXMLDeclNode` | "The XML declaration which specifies the version of XML being used" |

In practice 90% of code touches only the first five (Document / Element / Attribute / Text / Comment); the other nine are for DTD / CDATA / processing instructions and similar XML advanced features that are rarer in real use.

## NotesDOMNode tree-walking API

The walking API shared by every Node (inherited from [`NotesDOMNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODE_CLASS.html)):

| Property | Purpose |
|---|---|
| `FirstChild` | "The first child of this node" |
| `LastChild` | "The last child of this node" |
| `NextSibling` | "The node immediately following this node" |
| `PreviousSibling` | "The node immediately before this node" |
| `ParentNode` | "The parent of this node" |
| `NodeType` | "An integer indicating which type of node this is" — compare against `DOMNODETYPE_*` constants |
| `NodeName` | "The name of this node, depending on its type" |
| `NodeValue` | Read-write. "The value of this node, depending on its type" |
| `Attributes` | "A NotesDOMNamedNodeMap containing the attributes" |
| `NumberOfChildNodes` | "The number of child nodes this node has" |
| `HasChildNodes` | "Indicates whether this node has any children" |
| `LocalName` / `NamespaceURI` / `Prefix` | For namespace-aware processing |

| Method | Purpose |
|---|---|
| `AppendChild(newChild)` | Add a new child at the end |
| `RemoveChild(child)` | Remove and return a child |
| `ReplaceChild(newChild, oldChild)` | Replace a child |
| `Clone()` | "Returns a duplicate of this node" |

`NodeType` is how you tell which kind of node you have. Common constants:

| Constant | Maps to |
|---|---|
| `DOMNODETYPE_ELEMENT_NODE` | NotesDOMElementNode |
| `DOMNODETYPE_TEXT_NODE` | NotesDOMTextNode |
| `DOMNODETYPE_ATTRIBUTE_NODE` | NotesDOMAttributeNode |
| `DOMNODETYPE_COMMENT_NODE` | NotesDOMCommentNode |
| `DOMNODETYPE_CDATA_SECTION_NODE` | NotesDOMCDATASectionNode |
| `DOMNODETYPE_DOCUMENT_NODE` | NotesDOMDocumentNode |
| `DOMNODETYPE_PROCESSING_INSTRUCTION_NODE` | NotesDOMProcessingInstructionNode |

## A complete example — parse → walk → modify → serialize

Read `library.xml`, uppercase every book title, add a `modified="true"` attribute to each `<book>`, and write the result to a new file ([adapted from HCL's official example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESDOMPARSER_CLASS_EX.html)):

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim domParser As NotesDOMParser
    Dim xml_in As NotesStream, xml_out As NotesStream

    Set xml_in = session.CreateStream
    If Not xml_in.Open("c:\data\library.xml") Then
        Print "Cannot open input" : Exit Sub
    End If

    Set xml_out = session.CreateStream
    Call xml_out.Open("c:\data\library_modified.xml")
    Call xml_out.Truncate

    Set domParser = session.CreateDOMParser(xml_in, xml_out)
    domParser.ExitOnFirstFatalError = True
    Call domParser.Process()

    ' Get the root
    Dim docNode As NotesDOMDocumentNode
    Set docNode = domParser.Document

    ' Walk and modify
    Call WalkAndModify(docNode)

    ' Serialize back to XML
    Call domParser.Serialize()
    Call xml_out.Close()

    Print "Done — output at c:\data\library_modified.xml"
End Sub

Sub WalkAndModify(node As NotesDOMNode)
    If node Is Nothing Then Exit Sub

    ' Element handling
    If node.NodeType = DOMNODETYPE_ELEMENT_NODE Then
        Dim elem As NotesDOMElementNode
        Set elem = node    ' downcast

        If elem.TagName = "title" Then
            ' Uppercase the title's text content
            If elem.HasChildNodes Then
                Dim textNode As NotesDOMNode
                Set textNode = elem.FirstChild
                If textNode.NodeType = DOMNODETYPE_TEXT_NODE Then
                    textNode.NodeValue = UCase(textNode.NodeValue)
                End If
            End If
        ElseIf elem.TagName = "book" Then
            ' Add an attribute
            Call elem.SetAttribute("modified", "true")
        End If
    End If

    ' Recurse children
    Dim child As NotesDOMNode
    Set child = node.FirstChild
    Do Until child Is Nothing
        Call WalkAndModify(child)
        Set child = child.NextSibling
    Loop
End Sub
```

Things to notice:

- **`node.NodeType = DOMNODETYPE_ELEMENT_NODE`** — the standard way to test "is this an Element"
- **`Set elem = node`** — `NotesDOMElementNode` is a subclass of `NotesDOMNode`, so direct assignment works (implicit downcast)
- **`elem.SetAttribute("name", "value")`** — Element-specific method
- **`textNode.NodeValue`** — TextNode content lives in NodeValue (not NodeName)

## Five pitfalls

### 1. Text is a separate TextNode — not a property of the Element

Intuition says `<title>Hobbit</title>`'s element has a "text content" property — **wrong**. The XML spec models text as a **child node** of the element, with type `NotesDOMTextNode`:

```lotusscript
' WRONG
Print elem.Text     ' No such property

' Correct — retrieve the child TextNode
Dim t As NotesDOMNode
Set t = elem.FirstChild
If t.NodeType = DOMNODETYPE_TEXT_NODE Then
    Print t.NodeValue
End If
```

If the element has indentation whitespace, that's a TextNode too — `FirstChild` may return a whitespace node instead of the real content. You need to skip whitespace nodes when walking.

### 2. Whitespace TextNodes need explicit skipping

Pretty-printed XML produces whitespace text nodes. While walking, you'll see plenty of "\n    "-style nodes:

```lotusscript
Set child = elem.FirstChild
Do Until child Is Nothing
    If child.NodeType = DOMNODETYPE_TEXT_NODE And Trim(child.NodeValue) = "" Then
        ' skip whitespace
    Else
        ' real handling
    End If
    Set child = child.NextSibling
Loop
```

Or configure the parser ahead of time. The simplest is to filter while walking.

### 3. No `GetElementsByTagName` etc. — recurse yourself

Unlike browser-side JavaScript DOM, LotusScript's NotesDOMNode **doesn't expose `GetElementsByTagName` / `GetElementById`** as convenience methods. Finding specific elements means **recursing the tree manually**:

```lotusscript
Function FindByTagName(node As NotesDOMNode, tagName As String) As NotesDOMElementNode
    If node.NodeType = DOMNODETYPE_ELEMENT_NODE Then
        Dim e As NotesDOMElementNode
        Set e = node
        If e.TagName = tagName Then
            Set FindByTagName = e
            Exit Function
        End If
    End If
    Dim child As NotesDOMNode
    Set child = node.FirstChild
    Do Until child Is Nothing
        Dim found As NotesDOMElementNode
        Set found = FindByTagName(child, tagName)
        If Not found Is Nothing Then
            Set FindByTagName = found
            Exit Function
        End If
        Set child = child.NextSibling
    Loop
End Function
```

After writing this a few times, most developers wrap it as a script library utility.

### 4. After modifying the tree, you MUST call `Serialize()` — or changes don't get written

`Serialize()` is what flushes the in-memory DOM back into XML output. Forgetting `Call domParser.Serialize()` produces an empty / unmodified output file. **Same shape of silent bug as forgetting `NotesDocument.Save`**.

### 5. Large files consume memory — be careful past tens of MB

DOM loads the whole thing — a 1 MB XML file consumes roughly 5-20 MB of memory (depending on structure). **A 100 MB XML file can OutOfMemory the agent.** Big file + read-only? Use SAX instead.

## NotesDOMNamedNodeMap + NotesDOMNodeList — two helpers

You'll run into these helpers when traversing attributes or NodeLists:

- **`NotesDOMNamedNodeMap`** — "Used by methods of the NotesDOMNode class for returning the list of an element node's attributes." `elem.Attributes` returns this. Use `GetNamedItem("id")` for name-based lookup or `Item(i)` for index-based
- **`NotesDOMNodeList`** — "Used by methods of the NotesDOMNode class for returning the list of an element node's child elements." `elem.ChildNodes` returns this (though `FirstChild` + `NextSibling` is more common in practice)

## What about Java and SSJS?

| Language | Equivalent |
|---|---|
| LotusScript | `NotesDOMParser` + the 14 NotesDOM*Node subclasses |
| Java | `lotus.domino.DOMParser` — same DOM model. Java can also drop to standard `javax.xml.parsers.DocumentBuilderFactory` for the richer W3C DOM API (with `getElementsByTagName` etc.) |
| SSJS (XPages) | Usually skips lotus.domino.DOMParser and uses javax.xml.parsers + W3C DOM directly — more powerful |

LotusScript's NotesDOMParser is essentially "a subset of W3C DOM Level 2" — it's missing some convenience methods. On the Java/SSJS side, prefer javax.xml.parsers when you have the choice.

## Closing

DOM is the standard tool in LotusScript for small-to-medium XML with random-access or modification needs. Three things to remember:

1. **Text is a separate TextNode** — not an element property; retrieve via `FirstChild`
2. **No `GetElementsByTagName`** — recurse yourself (then wrap as utility)
3. **Always `Serialize()` after modification** — same shape of bug as forgetting `NotesDocument.Save`

The [DOM vs SAX comparison piece](/domino-news/en/posts/notes-xml-parser-dom-vs-sax) consolidates the decision tree: **when SAX, when DOM, when NotesXMLProcessor (XSLT)** — three XML routes, side by side.
