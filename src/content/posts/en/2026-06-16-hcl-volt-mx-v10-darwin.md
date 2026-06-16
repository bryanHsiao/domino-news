---
title: "Looking Back at HCL Volt MX v10 'Darwin': Figma-to-App, AIAD, CarPlay"
description: "HCL released v10 of its low-code platform Volt MX, codenamed 'Darwin', back in August 2025. This isn't breaking news — it's a catch-up explainer that lays out the release for Domino developers: turning Figma designs straight into apps with GenAI, AIAD (AI Assisted Dev) where a RAG-powered Volt IQ helps generate code and retrieve docs, CarPlay / Android Auto support, Passkeys, iOS Live Activities, and more. It also explains the Domino connection: Volt MX Go is the Domino-bundled edition, and Volt IQ's RAG approach shares DNA with Domino IQ."
pubDate: 2026-06-16T07:30:00+08:00
lang: en
slug: hcl-volt-mx-v10-darwin
tags:
  - "Volt MX"
  - "News"
sources:
  - title: "HCL Volt MX v10 'Darwin': From Figma to App, AIAD, CarPlay, and Beyond — HCL Blog"
    url: "https://www.hcl-software.com/blog/volt-mx/hcl-volt-mx-v10-darwin-from-figma-to-app-aiad-carplay-and-beyond"
  - title: "HCL Volt MX Release Notes — HCL Documentation"
    url: "https://help.hcl-software.com/voltmx/latest/VMX_release_notes.html"
  - title: "HCL Volt MX Release Part 1: The Future of App Development (video)"
    url: "https://www.youtube.com/watch?v=CrA-dKCZ8aI"
relatedJava: []
relatedSsjs: []
---

Up front: this isn't breaking news. HCL [released Volt MX v10 "Darwin"](https://www.hcl-software.com/blog/volt-mx/hcl-volt-mx-v10-darwin-from-figma-to-app-aiad-carplay-and-beyond) back in **August 2025**. This is a **catch-up explainer** — laying out what the release brought for Domino developers who haven't been tracking Volt MX, and spelling out exactly how it relates to Domino.

Volt MX is HCL's **low-code application development platform**, used to build cross-platform mobile and web apps quickly. The v10 "Darwin" release bets almost everything on **AI and the design-to-development pipeline**.

## The three headline features

**1. Figma designs straight into apps.** You can import Figma design files into Volt Iris (its design tool) and convert them to forms via GenAI. HCL claims this cuts development effort "by half or more." For the age-old "designer hands over a mockup, engineer rebuilds it from scratch" problem, this is a shortcut.

**2. AIAD (AI Assisted Dev).** This release enhances Volt IQ with **RAG**[^rag] for context-aware code generation and documentation retrieval — ask how to do something and it returns answers and code that fit the context, with documentation links. That's the same approach as the [Domino IQ RAG](/domino-news/posts/domino-iq-rag/) work covered earlier on this site: treat the product docs as a knowledge base and feed them to the model via RAG.

**3. CarPlay / Android Auto.** Developers can build car apps that "integrate seamlessly with Apple CarPlay and Google's Android Auto" — extending Volt MX's target devices from phones and tablets to the screen in the car.

## Other notable bits

- **Governance in Volt Foundry**: a review/approval flow before deployment.
- **iOS Live Activities**: real-time Lock Screen updates (think order progress, delivery status).
- **Passkeys**: passwordless login.
- **HCL DX portlet deployment integration**: tie-in with HCL Digital Experience.
- **A redesigned Volt Iris interface.**
- **AI Marketplace expanded to 40+ AI assets**: document intelligence, image analysis, NLP, voice interfaces, and other ready-made components.

For the full release contents, defer to the [official release notes](https://help.hcl-software.com/voltmx/latest/VMX_release_notes.html); HCL also published an [overview video](https://www.youtube.com/watch?v=CrA-dKCZ8aI).

## So what does this have to do with Domino developers?

Two points of contact:

1. **Volt MX Go** is the edition **bundled with Domino** — letting you use Volt MX's tooling to build a modern front end directly on existing Domino data and applications. In other words, Volt MX isn't "another world"; for Domino customers it's one of HCL's officially promoted modernisation paths.
2. **Volt IQ knows about Domino.** HCL states that Volt IQ can answer "questions about other HCL products like Leap, Volt MX Go, and Domino (based on entitlements)." Its AI assistant pulls Domino into its knowledge scope too.

So even if you only touch Domino day to day and never write Volt MX, the v10 release still signals HCL's direction: **GenAI for design-to-dev, RAG for the AI assistant, Volt MX Go for a modern front end onto Domino**. That lines up with where Domino itself has been heading these past couple of years (Domino IQ's RAG, DRAPI as a REST backend) — the whole HCL ecosystem is leaning toward "AI plus standardised integration."

[^rag]: RAG = Retrieval-Augmented Generation. Relevant content is first retrieved from a knowledge base (such as product docs), then fed to a large language model to generate the answer — grounding the response and reducing hallucination.
