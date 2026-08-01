---
title: "The NotesDOM Node Types You Skipped — Until a Round-Trip Drops Your Comments"
description: "You built a NotesDOMParser pipeline for element and text nodes. Then you parsed XML with a comment, a CDATA block, and a processing instruction, changed one value, serialised it back — and the comment and PI were gone. A field report on the rest of the NotesDOM node family: NodeList's 1-based GetItem (not the W3C 0-based item()), DocumentFragment for batch inserts, and the CDATA / Comment / ProcessingInstruction nodes you have to create yourself to preserve on the way out."
pubDate: 2026-07-24T07:30:00+08:00
lang: en
slug: notes-dom-content-nodes
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDOMNodeList (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODELIST_CLASS.html"
  - title: "NotesDOMDocumentFragmentNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTFRAGMENTNODE_CLASS.html"
  - title: "NotesDOMProcessingInstructionNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPROCESSINGINSTRUCTIONNODE_CLASS.html"
  - title: "NotesDOMCDATASectionNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMCDATASECTIONNODE_CLASS.html"
  - title: "NotesDOMCommentNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMCOMMENTNODE_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-dom-content-nodes.webp"
coverStyle: "oil-chiaroscuro"
---

You've used [`NotesDOMParser`](/domino-news/en/posts/notes-dom-parser) before — walk the tree with `GetFirstChild` / `GetNextSibling`, read element and text nodes, done. Then a real document lands on your desk: an XML config with a leading `<!-- generated, do not edit -->` comment, a `<![CDATA[ ... ]]>` block holding a chunk of markup, and a `<?xml-stylesheet ... ?>` processing instruction at the top. You parse it, change one attribute, serialise it back — and the comment and the PI are gone, the CDATA came out as escaped text. Nothing errored. The output is just quietly wrong.

The DOM node types beyond element / text / attribute are the reason. Most of them you'll never instantiate by hand, but two of them (`NotesDOMNodeList`, `NotesDOMDocumentFragmentNode`) earn their place in everyday code, and three more (CDATA / comment / processing-instruction nodes) are the difference between a faithful round-trip and a lossy one. This is a field report on that long tail, tested against the LotusScript DOM parser. All of these classes are the same vintage — new in Release 6, and none are supported in COM.

---

## TL;DR

- `NotesDOMNodeList.GetItem(i)` is **1-based** — you loop `For i = 1 To list.NumberOfEntries`. That's the LotusScript convention, and it's the opposite of the W3C DOM's 0-based `item()`. Porting a JavaScript loop straight over is an off-by-one waiting to happen.
- `NotesDOMDocumentFragmentNode` is a scratch container: append nodes to it, insert *it*, and "the fragment's children are inserted, not the fragment itself." One insert instead of N.
- Comments, CDATA sections, and processing instructions are their own node types. A parse walk that only looks for element and text nodes skips them, and a serialise that never re-creates them drops them. Preserving them means handling those node types explicitly.
- You create the manual ones off the document node: `CreateCommentNode`, `CreateCDATASectionNode`, `CreateProcessingInstructionNode(target, data)`.

## NodeList: the 1-based GetItem

A `NotesDOMNodeList` is what tree queries hand back — `GetElementsByTagName` on a document or element node returns one, and so do the child-collection accessors. It has exactly one property and one method: [`NumberOfEntries`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNODELIST_CLASS.html) (read-only) and `GetItem`, which returns "the node at the position `index&` in the list, or null if that is not a valid index."

The trap is the index base. The list walks from **1**, not 0:

```lotusscript
Dim nl As NotesDOMNodeList
Set nl = docNode.GetElementsByTagName("item")
Dim i As Long
For i = 1 To nl.NumberOfEntries
    Dim n As NotesDOMNode
    Set n = nl.GetItem(i)
    Print n.NodeName
Next
```

If you've spent time in the browser DOM, your fingers will write `for (i = 0; i < list.length; i++)` and translate it to `For i = 0 To nl.NumberOfEntries - 1`. That silently skips the first node and reads one past the end (which returns null, then blows up on the next property access). The LotusScript collections are 1-based across the board; `NotesDOMNodeList` is no exception, even though it mirrors a W3C interface that is 0-based. When in doubt, anchor the loop to `NumberOfEntries` and start at 1.

## DocumentFragment: insert N nodes with one call

A [`NotesDOMDocumentFragmentNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTFRAGMENTNODE_CLASS.html) is a node that never appears in the finished tree. You make one with `CreateDocumentFragmentNode` on the document node, append however many nodes you want to it, then append the fragment to a real parent. The documented behaviour is the whole point: "the fragment's children are inserted, not the fragment itself."

```lotusscript
Dim frag As NotesDOMDocumentFragmentNode
Set frag = docNode.CreateDocumentFragmentNode()
Dim r As NotesDOMElementNode
Forall row In rows
    Set r = docNode.CreateElementNode("row")
    Call r.SetAttribute("id", row)
    Call frag.AppendChild(r)
End Forall
Call tableNode.AppendChild(frag)   ' the rows land under tableNode, the fragment doesn't
```

Without the fragment you'd `AppendChild` each row directly under `tableNode`, touching the live tree once per row. The fragment lets you assemble off to the side and splice the whole batch in with a single operation against the live tree. For a handful of nodes it's a readability win; for a few hundred built in a loop it's the difference that keeps the build from crawling.

## Comments, CDATA, and PIs: the round-trip you have to opt into

The three "content" node types are easy to forget because a naive walk never surfaces them. If your traversal only branches on element and text nodes, a comment node, a CDATA node, and a processing-instruction node all fall through — and if your serialiser only re-emits elements and text, they never come back. Preserving them is a matter of recognising the node types on the way in and re-creating them on the way out.

Creating them is uniform — each has a factory on the document node:

```lotusscript
Dim c As NotesDOMCommentNode
Set c = docNode.CreateCommentNode(" generated, do not edit ")

Dim cd As NotesDOMCDATASectionNode
Set cd = docNode.CreateCDATASectionNode("<b>literal markup</b>")

Dim pi As NotesDOMProcessingInstructionNode
Set pi = docNode.CreateProcessingInstructionNode("xml-stylesheet", "type=""text/xsl"" href=""view.xsl""")
```

Two details worth keeping straight. First, the inheritance: a CDATA node **is a** text node — `NotesDOMCDATASectionNode` extends `NotesDOMTextNode`, which extends `NotesDOMCharacterDataNode` — and a comment node extends `NotesDOMCharacterDataNode` directly. So the character-data editing methods (`AppendData`, `InsertData`, `SubstringData`, `ReplaceData`, `DeleteData`) work on all three, which is handy but also a trap: a CDATA node querying as character data means a walk that treats "has character data" as "is text" will misclassify it. Branch on the node type, not on whether `NodeValue` is set.

Second, the [processing-instruction node](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMPROCESSINGINSTRUCTIONNODE_CLASS.html) splits its content into two named parts — `Target` (the application the instruction is aimed at, `xml-stylesheet` above) and `Data` (everything after it). A PI is "a way to keep processor-specific information in the text of the document," so if you're transforming a stylesheet-linked XML and want the link to survive, you read `Target` and `Data` off the old node and re-create the pair, rather than trying to reconstruct the `<? ?>` text by hand.

## What about Java and SSJS?

There's no cross-language table to draw here, and that's the interesting part. The `NotesDOM*` classes are the LotusScript DOM parser's own object model. On the Java side you don't reach for a Domino class at all — you use the standard `org.w3c.dom` interfaces (`NodeList`, `DocumentFragment`, `Comment`, `CDATASection`, `ProcessingInstruction`) through a JAXP parser, where `NodeList.item()` is **0-based**. In SSJS / XPages you're typically in the browser or server-side JavaScript DOM, again 0-based. The node *concepts* are the same W3C model everywhere; only the LotusScript surface renumbers the list to 1. That renumbering is the one thing to carry in your head when you move a DOM loop between LotusScript and either of the others.
