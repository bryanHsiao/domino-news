---
title: "The XML Declaration, DTD Nodes, and SAX Errors in LotusScript"
description: "The rarely-seen tier of the Domino DOM — the XML declaration, DOCTYPE, processing instructions, notations, entities — plus NotesSAXException on the SAX side. This article covers what each node actually gives you (mostly: not much), the AddXMLDeclNode flag you must set to even see the declaration, and how NotesSAXException is the one place you get rich, line-and-column error data when parsing goes wrong."
pubDate: 2026-07-05T07:30:00+08:00
lang: en
slug: notes-dom-xmldecl-node
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMXMLDeclNode class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMXMLDECLNODE_CLASS.html"
  - title: "AddXMLDeclNode property (NotesDOMParser) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDXMLDECLNODE_PROPERTY_DOMPARSER.html"
  - title: "NotesSAXException class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXEXCEPTION_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-dom-xmldecl-node.webp"
coverStyle: "collage"
---

The [navigation](/domino-news/en/posts/notes-dom-document-node) and [content](/domino-news/en/posts/notes-dom-text-node) articles covered the DOM nodes you use every day. This one covers the tier you almost never touch — the XML declaration, the DOCTYPE, processing instructions, entities, notations — plus the SAX side's one genuinely useful class, `NotesSAXException`. The honest theme: in the Domino LotusScript binding, this DTD/declaration tier is mostly a *navigation* layer, not a *data* layer. Several of these classes give you nothing beyond the base node members.

---

## TL;DR

- The **XML declaration** (`<?xml version="1.0" encoding="UTF-8"?>`) only appears in the tree if you set `domParser.AddXMLDeclNode = True` **before** parsing — then it's the `FirstChild` of the document node, a `NotesDOMXMLDeclNode` with `Version` / `Encoding` / `Standalone`.
- **Processing instructions** (`NotesDOMProcessingInstructionNode`) give you `Target` and `Data`. **Notations** (`NotesDOMNotationNode`) give you `PublicID` / `SystemID`.
- **DocumentType, Entity, and EntityReference nodes expose no class-specific properties** in this binding — you can detect them by `NodeType` and navigate them, but the LS API doesn't surface their DTD internals (`Entities`, `Notations`, `Name`, `PublicID`…). That's a real gap vs. the W3C interface.
- **`NotesSAXException`** is the payoff on the SAX side: "Represents information about errors and warnings which occur during SAX parsing," with `Message`, `Row`, `Column`, `PublicID`, `SystemID`. You receive it in the `SAX_Error` / `SAX_FatalError` / `SAX_Warning` events.
- All **new with Release 6, not supported in COM**.

## Seeing the XML declaration

By default the parser drops the `<?xml … ?>` declaration. To get a [`NotesDOMXMLDeclNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMXMLDECLNODE_CLASS.html), flip the [`AddXMLDeclNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDXMLDECLNODE_PROPERTY_DOMPARSER.html) flag on the parser before you parse — the docs say it makes the declaration's "version, encoding, and standalone attributes... included in the resulting DOM tree in a NotesDOMXMLDeclNode object," appearing as the `FirstChild` of the document node:

```lotusscript
Dim domParser As NotesDOMParser
Set domParser = session.CreateDOMParser(inStream, outStream)
domParser.AddXMLDeclNode = True       ' must be set BEFORE parsing
domParser.Process

Dim n As NotesDOMNode
Set n = domParser.Document.FirstChild
Do Until n.IsNull
  Select Case n.NodeType
  Case DOMNODETYPE_XMLDECL_NODE        ' 13
    Dim decl As NotesDOMXMLDeclNode
    Set decl = n
    Print "version=" & decl.Version & " encoding=" & decl.Encoding & _
          " standalone=" & decl.Standalone
  Case DOMNODETYPE_PROCESSINGINSTRUCTION_NODE  ' 7
    Dim pi As NotesDOMProcessingInstructionNode
    Set pi = n
    Print "PI target=" & pi.Target & " data=" & pi.Data
  End Select
  Set n = n.NextSibling
Loop
```

Forgetting `AddXMLDeclNode = True` is the number-one reason "my XMLDeclNode is never there" — the node simply isn't generated otherwise.

## The thin tier

The remaining declaration-tier classes are thin by design:

| Class | NodeType | What it actually gives you |
|---|---|---|
| `NotesDOMProcessingInstructionNode` | 7 | `Target`, `Data` |
| `NotesDOMNotationNode` | 12 | `PublicID`, `SystemID` |
| `NotesDOMDocumentTypeNode` | 10 | **inherited node members only** |
| `NotesDOMEntityNode` | 6 | **inherited node members only** |
| `NotesDOMEntityReferenceNode` | 5 | **inherited node members only** |

The notable gap: `NotesDOMDocumentTypeNode`'s one-line description is "The list of entities that are defined for the document," yet the LotusScript binding exposes **no** `Entities`, `Notations`, `Name`, `PublicID`, or `SystemID` accessor on it — unlike the W3C `DocumentType` interface it nominally maps to. In practice you only *observe* these nodes while walking a tree; you can branch on their `NodeType` and read `NodeName`/`NodeValue`, but you can't introspect the DTD through them. Whether you even see entity-reference nodes (type 5) depends on the parser's `ExpandEntityReferences` setting.

So unless you're handling processing instructions (`Target`/`Data`) or reading the declaration (`Version`/`Encoding`), this tier is something you skip over in a `Select Case`, not something you mine for data.

## NotesSAXException — where the error data lives

The SAX parser is the streaming alternative to DOM, and its one class worth a deep look is the exception. [`NotesSAXException`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSAXEXCEPTION_CLASS.html) — "Represents information about errors and warnings which occur during SAX parsing" — is where you finally get rich diagnostics: not just a message but the `Row` and `Column` where parsing went wrong, plus `PublicID` / `SystemID`. You don't construct it; the SAX parser hands it to your event handlers:

```lotusscript
Dim saxParser As NotesSAXParser   ' module-level so events can bind

Sub RunSaxParse()
  Dim session As New NotesSession
  Dim inStream As NotesStream, outStream As NotesStream
  Set inStream = session.CreateStream  : Call inStream.Open("c:\xml\in.xml")
  Set outStream = session.CreateStream : Call outStream.Open("c:\xml\saxlog.txt")

  Set saxParser = session.CreateSAXParser(inStream, outStream)
  On Event SAX_Error      From saxParser Call SaxError
  On Event SAX_FatalError From saxParser Call SaxError
  On Event SAX_Warning    From saxParser Call SaxError
  Call saxParser.Process
End Sub

Sub SaxError(Source As NotesSAXParser, Exception As NotesSAXException)
  Call Source.Output("row " & Exception.Row & " col " & Exception.Column & _
                     ": " & Exception.Message & Chr(10))
End Sub
```

*(Adapted from the documented SAX event signatures — the official example writes each event to an output file.)*

That `Row`/`Column` pair is the reason to use SAX (or to catch this exception) when you need to tell a user *where* their XML is malformed — the DOM parser's failures are far less precise about location.

This is the third of three pieces on the Domino DOM node classes, after [navigation](/domino-news/en/posts/notes-dom-document-node) and the [content nodes](/domino-news/en/posts/notes-dom-text-node).

## What about Java and SSJS?

As with the rest of the Domino DOM family, there's no `lotus.domino` counterpart to map to — Java and XPages reach for the standard `org.w3c.dom` interfaces (`ProcessingInstruction`, `DocumentType`, `Notation`, `Entity`) and the JAXP SAX classes (`org.xml.sax.SAXParseException`, which carries the same line/column data as `NotesSAXException`). So `relatedJava` and `relatedSsjs` stay empty. If anything, the W3C `DocumentType` interface is *richer* than the Domino one here — the gap noted above is specific to the LotusScript binding.
