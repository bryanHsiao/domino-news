---
title: "Wiring Domino IQ RAG to a Remote Model: certstore Trust, the API Key, and the HTTPS Endpoint"
description: "Domino 14.5.1 FP1 added a Remote mode to RAG — the site's FP1 roundup already covered what changed. This piece doesn't repeat that; it fills in the wiring: how the Remote-mode configuration document is filled out, the HTTPS-only endpoint and API Key, and the step that trips people up — the remote AI server's trusted roots go into certstore.nsf, not the JVM truststore that the DRAPI path consumes."
pubDate: 2026-09-23T07:30:00+08:00
lang: en
slug: domino-iq-rag-remote-mode
tags:
  - "Domino IQ"
  - "AI"
  - "Domino Server"
sources:
  - title: "Adding a Domino IQ Configuration for Remote mode — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html"
  - title: "RAG for the Domino IQ server — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
  - title: "What's new in 14.5.1 Fixpack 1 — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-iq-rag-remote-mode.webp"
coverStyle: "risograph"
---

> 📚 This piece builds on two others: the [14.5.1 FP1 roundup](/domino-news/en/posts/domino-1451-fp1) announced that RAG gained a Remote mode, and the [Domino IQ RAG deep-dive](/domino-news/en/posts/domino-iq-rag) covers how the pipeline runs inside the server. Here I only fill in what neither spelled out: **how you actually wire up the remote endpoint** — especially the certificate-trust step.

## One line of context (the rest is in the FP1 roundup)

[14.5.1 FP1](https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html) made RAG[^rag] work in both Local and Remote modes: the LLM and embedding models can live on remote OpenAI-compatible endpoints, while the [official RAG docs](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html) pin down that **the vector database always stays local** on the Domino IQ server. The background to that change, plus FP1's ~49 fixes and JVM bump, are all in the [site's FP1 roundup](/domino-news/en/posts/domino-1451-fp1) — not repeated here. This piece answers one practical question: **how do you configure the remote endpoint, and how does Domino trust its certificate?**

## Configuring the remote endpoint

Remote mode reuses the existing [Domino IQ Remote-mode configuration document](https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html). In the Remote-mode Configuration document in `dominoiq.nsf`, the key points (HCL's wording):

- **The endpoint is HTTPS only**: "The endpoint supported is HTTPS only," e.g. `https://endpoint-serv.example.com/v1/chat/completions`.
- **API Key is the only supported auth**: "This is the only form of authentication supported by HCL to the remote AI endpoint/server" — no other method; one key over TLS.
- **Set Status to Enabled** so the Domino IQ task loads on the server.

That much is intuitive. The step that actually stops people is the next one — certificate trust.

## The step that trips people up: trust lives in certstore, not the JVM truststore

The endpoint is HTTPS, so Domino has to **trust the remote AI server's certificate chain** first, or the connection just fails. HCL's wording:

> Add the Trusted roots for the remote AI server to Domino's Certstore database.

That means putting the remote trusted roots into Domino's [`certstore.nsf`](/domino-news/en/posts/certstore-getting-started). Miss this and the connection won't come up no matter how correct the endpoint and API Key are.

Here's the **easy thing to get wrong**: Domino has more than one trust store. The Domino IQ path (a server-side C++ task) trusts outbound TLS through **`certstore.nsf`**; the DRAPI/Java path, by contrast, consumes the **JVM's cacerts truststore** (we hit this in [the OIDC piece on DRAPI only trusting the JVM truststore](/domino-news/en/posts/drapi-keycloak-oidc)). The same sentence — "Domino needs to trust some external server" — lands in a completely different place depending on the subsystem. Put the remote AI's trusted roots into the JVM cacerts and Domino IQ won't see them. Before you configure Remote mode, be clear which subsystem you're dealing with.

## One implementation note

The official Remote-mode page is framed around the LLM the remote AI inferencing engine uses; the fact that the embedding model can also be remote comes from the separate RAG support page. Exactly how each model type is pointed at its remote endpoint within the config is worth wiring up in a small environment and confirming against actual behavior before you rely on it — don't guess field names from naming conventions.

For the full RAG setup on Domino IQ (the two-phase embedding/vector-DB config, the RAG fields on the Command document, `updall` vectorization, ACL/Readers security), see the [Domino IQ RAG deep-dive](/domino-news/en/posts/domino-iq-rag); for everything else FP1 fixed, see the [FP1 roundup](/domino-news/en/posts/domino-1451-fp1).

[^rag]: RAG (Retrieval-Augmented Generation): before the LLM answers, it pulls semantically relevant documents from a designated source as context, so the response is grounded in your domain and current data.
