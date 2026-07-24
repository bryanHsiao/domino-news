---
title: "The NotesDOM Node Types You'll Never Instantiate: the Read-Only DTD Corner"
description: "NotesDOM implements the full W3C node model, which means four node types exist for the DTD corner most XML developers never touch: DocumentType, Entity, EntityReference, and Notation. A short map of what they are, which one you can actually create (EntityReference), which are read-only reflections of a parsed DTD, and why in 2026 you can usually walk past all of them — plus the one case where knowing they exist saves an afternoon."
pubDate: 2026-07-25T07:30:00+08:00
lang: en
slug: notes-dom-dtd-nodes
tags:
  - "LotusScript"
sources:
  - title: "NotesDOMDocumentTypeNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTTYPENODE_CLASS.html"
  - title: "NotesDOMEntityReferenceNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMENTITYREFERENCENODE_CLASS.html"
  - title: "NotesDOMNotationNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNOTATIONNODE_CLASS.html"
relatedJava: []
relatedSsjs: []
---

The [`NotesDOMParser`](/domino-news/en/posts/notes-dom-parser) family implements the full W3C node model, and "full" includes the corner almost nobody visits: the Document Type Definition. Four node types live there — `NotesDOMDocumentTypeNode`, `NotesDOMEntityNode`, `NotesDOMEntityReferenceNode`, and `NotesDOMNotationNode`. They're the last four uncovered classes in the DOM/XML family on this site, and this piece finishes the map. It's a short one on purpose: the honest summary is that in 2026 you can walk past all four most days, and the value here is knowing what they are the day you can't.

All four are the usual vintage — new in Release 6, none supported in COM.

---

## Why the DTD corner is quiet

A DTD is the old way to declare an XML document's structure — `<!DOCTYPE>` at the top, with `<!ENTITY>` and `<!NOTATION>` declarations inside. Schema languages (XSD, RELAX NG) replaced it for validation years ago, and most XML you'll parse in a Domino integration today — a REST payload, a config file, an export from another system — carries no DTD at all. When there's no DTD, none of these four node types ever show up in your tree. That's why a decade of `NotesDOMParser` code can run without a single reference to them.

They surface in exactly one situation: you parse a document that *does* carry a DTD — often a legacy interchange format, or a document that pulls in named entities like `&companyName;`. Then the parser builds these nodes to reflect what the DTD declared, and you may bump into them while walking the tree.

## The three read-only reflections

[`NotesDOMDocumentTypeNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTTYPENODE_CLASS.html) is the entry point. The HCL reference describes it as "the list of entities that are defined for the document" — you reach it from the document node when a `<!DOCTYPE>` is present, and it's a read-only reflection of that declaration. The LotusScript surface on it is deliberately thin; it's there to *represent* the doctype, not to let you rewrite it.

Hanging off that are the two declaration nodes:

- [`NotesDOMNotationNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNOTATIONNODE_CLASS.html) — "Represents a notation declared in the DTD." Its two meaningful properties, `PublicID` and `SystemID`, are both **read-only**. A notation names an external format (the classic example is associating `<!NOTATION jpeg SYSTEM "image/jpeg">` so an unparsed entity can point at it). You read it; you don't build it.
- `NotesDOMEntityNode` — "Represents an entity node in the XML," the declared entity itself. Like the notation node it's essentially a read-only reflection: most of its properties are read-only, with only the generic `NodeValue` and `Prefix` writable (inherited, not DTD-specific).

The pattern across all three: they mirror what the DTD said, and the API gives you no real way to author them. That's correct — you don't rewrite a document's DTD by poking DOM nodes.

## The one you can actually create

The exception is [`NotesDOMEntityReferenceNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMENTITYREFERENCENODE_CLASS.html). An *entity reference* is the use site — the `&companyName;` in the content, as opposed to the `<!ENTITY companyName "...">` that declared it — and this one you can build, with `CreateEntityReferenceNode` on the document node. So if you're constructing a document that should emit a named entity reference rather than the expanded text, that's the call.

In practice this is rare: most parsing setups expand entity references into their text during the parse, so you never see the reference node at all, and most documents you generate are better off with literal text than with a named reference that the next consumer might not resolve. But the create method exists, and it's the one seam in this corner where you're an author rather than a reader.

## The practical takeaway

Don't build handling for these four into a general parser walk on spec. If your `Select Case` over node types doesn't mention them, a DTD-free document — which is almost everything now — never exercises the gap. The day you *do* inherit a DTD-bearing format and your walk hits a node it doesn't recognise, this is the corner it came from: a read-only reflection of a `<!DOCTYPE>`, plus the entity-reference node you can create if you need one on the way out.

## What about Java and SSJS?

Same story as the rest of the NotesDOM family: there's no Domino-specific counterpart. Java uses the standard `org.w3c.dom` types — `DocumentType`, `Entity`, `EntityReference`, `Notation` — through a JAXP parser, and SSJS leans on the platform's native DOM. The DTD node model is identical across all three because it's the same W3C specification; only the LotusScript classes wear the `NotesDOM` prefix. If you're moving DTD-aware code between languages, the shapes line up one-to-one — which, given how rarely anyone writes DTD-aware code anymore, is mostly a reassurance you won't need.
