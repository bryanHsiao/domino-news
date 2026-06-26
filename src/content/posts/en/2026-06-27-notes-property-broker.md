---
title: "NotesPropertyBroker / NotesProperty: How Composite Applications Wire Components Together"
description: "Composite Applications were a Notes 8.x feature — assembling several components (Notes components, Java/Eclipse components) on one screen and letting them pass values to each other. NotesPropertyBroker is the mediating layer; NotesProperty is the single property being passed. This article is honest about where these classes sit (fairly legacy), covers getting the broker with GetPropertyBroker, the GetPropertyValue / SetPropertyValue / Publish / HasProperty methods, InputPropertyContext, and what it actually means today."
pubDate: 2026-06-27T07:30:00+08:00
lang: en
slug: notes-property-broker
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesPropertyBroker class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTYBROKER_CLASS.html"
  - title: "NotesProperty class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTY_CLASS.html"
  - title: "NotesSession class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
relatedJava: ["PropertyBroker", "Property"]
relatedSsjs: []
---

Let's be clear about where this sits first: **Composite Applications were a Notes 8.x feature.** They let you assemble several components — a few Notes forms / views, plus Java/Eclipse components — onto one Notes client screen and have them **pass values to each other** (pick a row in component A, component B updates to match). That's fairly legacy today and rare in new projects, but the two classes it maps to are still in the catalogue, so this article finishes them off and explains what they actually do.

The middle layer that passes the values is [`NotesPropertyBroker`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTYBROKER_CLASS.html). The official definition: "Mediates communication between components of a composite application, allowing communication between multiple Notes components, or between Notes and Java components." And the single piece of data being passed is a [`NotesProperty`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESPROPERTY_CLASS.html).

---

## TL;DR

- **Composite Applications** (Release 8 onward): a framework for assembling multiple components on one screen that pass data via "properties." Fairly legacy today.
- `NotesPropertyBroker` is the **mediating layer** between components; `NotesProperty` is the **single property** being passed (per the docs: "data transmitted to or from the Property Broker").
- Get the broker from [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html): `session.GetPropertyBroker()`.
- Read/write properties: `GetProperty` / `GetPropertyValue` / `SetPropertyValue` / `HasProperty`.
- `InputPropertyContext` — read-only, the array of input properties passed in this time.
- `Publish` — publishes modified property values out to other components; `ClearProperty` — clears the modifications staged before publishing.

## The mental model

Think of it as a "bulletin board" between components:

```text
component A  --(SetPropertyValue + Publish)-->  PropertyBroker  --(triggers)-->  component B receives input
```

- The user does something in component A → A changes a property with `SetPropertyValue`, then `Publish`es it.
- The broker routes that change to other components "wired" to that property.
- Component B is triggered, reads the incoming value from its `InputPropertyContext`, and reacts.

How components are "wired" together is configured in the composite application's design layer; the code side only reads input, writes output, and publishes.

## Getting it and reading/writing

```lotusscript
Dim session As New NotesSession
Dim broker As NotesPropertyBroker
Set broker = session.GetPropertyBroker()

' read an input property passed in this time
If broker.HasProperty("CustomerId") Then
    Dim v As Variant
    v = broker.GetPropertyValue("CustomerId")
    ' ...use v to look up data and update your own display
End If

' set an output property and publish it to other components
Call broker.SetPropertyValue("SelectedOrder", orderNo)
Call broker.Publish()
```

| Member | What it does |
|---|---|
| `GetProperty(name)` | get a property's `NotesProperty` object |
| `GetPropertyValue(name)` | read a property value directly |
| `SetPropertyValue(name, value)` | set a property value |
| `HasProperty(name)` | whether the property exists |
| `InputPropertyContext` | read-only, the input-property array for this invocation |
| `Publish()` | publish modified values to other components |
| `ClearProperty()` | discard staged, unpublished modifications |

`NotesProperty` itself describes "one property" (its name, namespace, type, value), returned by the broker's `GetProperty`.

## What it means today

Honestly: if you're building a new system, you almost certainly won't use Composite Applications — a modern front end goes through XPages, or the [DRAPI-to-external-framework](/domino-news/posts/openntf-home-drapi-jakarta/) path discussed earlier on the site. `NotesPropertyBroker` mostly shows up in **8.x-era composite apps still under maintenance**: you meet these classes when you inherit such a system and need to understand or tweak how its components pass values.

This is here for "understanding the old system" — not a recommendation to use it in new work.

## What about Java and SSJS?

| Language | Counterpart | Note |
|---|---|---|
| Java (`lotus.domino.*`) | `PropertyBroker` / `Property` | composite apps support Java components too; either end of the property broker can be Notes or Java |
| SSJS / XPages | None | Composite Applications is a Notes client framework, outside the XPages scope |

That echoes the conclusion from the earlier UI-classes piece: anything bound to the Notes client framework (the UI classes, composite apps) has no server-side / web counterpart — because its very premise is "the Notes client as a container."
