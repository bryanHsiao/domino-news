---
title: "Domino IQ RAG Is No Longer Local-Only: 14.5.1 FP1 Lets the Models Go Remote, Vector DB Stays Local"
description: "In Domino 14.5.1 GA, Domino IQ's RAG ran only in Local mode. 14.5.1 FP1 loosens that: RAG now works in both Local and Remote modes — the LLM and embedding models can be hosted on remote OpenAI-compatible endpoints, but the vector database is always hosted locally on the Domino IQ server. Here's what changed, what stays local vs. what can go remote, how the remote endpoint is configured (HTTPS, API Key, trusted roots into certstore.nsf), and when to reach for Remote mode."
pubDate: 2026-09-18T09:30:00+08:00
lang: en
slug: domino-iq-rag-remote-mode
tags:
  - "Domino IQ"
  - "AI"
  - "Release Notes"
sources:
  - title: "RAG for the Domino IQ server — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
  - title: "What's new in 14.5.1 Fixpack 1 — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html"
  - title: "Adding a Domino IQ Configuration for Remote mode — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-iq-rag-remote-mode.webp"
coverStyle: "risograph"
---

> 📚 This is an update to the [Domino IQ RAG deep-dive](/domino-news/en/posts/domino-iq-rag). For the full RAG setup on Domino IQ — the two-phase embedding/vector-DB config, the RAG fields on the Command document, `updall` vectorization, ACL/Readers security — read that piece first. This one is narrow: it covers the single change in **14.5.1 FP1 that loosened the local-only restriction**.

## TL;DR

- **In 14.5.1 GA, Domino IQ's RAG[^rag] ran *only* in Local mode** — the whole stack (LLM[^llm] inference, embedding[^embedding], vector DB) sat on the local server.
- **Starting 14.5.1 FP1, RAG works in both Local and Remote modes.** HCL's wording: the LLM and embedding models can be hosted on remote endpoints, **but the vector database is always hosted locally on the Domino IQ server**.
- **Remote endpoints must be OpenAI-API-compatible**, HTTPS-only, and API Key is the only supported auth.
- **The remote AI server's trusted roots go into `certstore.nsf`** — a *different* trust store from the JVM truststore that DRAPI relies on. Don't conflate the two.
- Why it matters: the GPU-hungry model inference can be offloaded remotely, while **the thing that governs data residency — the vector index and the ACL/Readers filtering on top of it — never leaves your box**.

## What changed: the local-only restriction is gone

[Domino 14.5.1 GA's RAG support](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html) originally stated in black and white that it was "available only when the Domino IQ server is configured in Local mode." That rule was loosened in **[14.5.1 Fixpack 1](https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html)**, per the official what's-new, verbatim:

> Starting with 14.5.1FP1, RAG support is available in both Local and Remote modes. While the LLM and embedding models can be hosted on remote endpoints, the vector database is always hosted locally on the Domino IQ server.

In one line: **the models can go remote, the vector DB can't.** Previously, to use RAG you had to stand up the entire Domino IQ server on GPU hardware capable of running GGUF models; after FP1, you can hand the heavy "take prompt + context and generate" step to a remote inference service.

## What stays local vs. what can go remote

| Component | Local mode | Remote mode (14.5.1 FP1+) |
|---|---|---|
| LLM inference | local `llama-server` | may live on a remote OpenAI-compatible endpoint |
| Embedding model | local `llama-server` | may live remotely |
| Vector database | local | **always local** |
| ACL/Readers filtering | local session's Notes DN | local (follows the vector DB) |

The last two rows are the point: because the vector DB stays local, both the **vector index** built from your NSF content and the **ACL/Readers filtering** — "which documents is this user allowed to see" at query time — still run on your own server. Only model inference moves out. Most of the local-execution advantages from the [deep-dive](/domino-news/en/posts/domino-iq-rag) — native permission enforcement above all — still hold in Remote mode.

## How the remote endpoint is configured

FP1 didn't invent a separate remote config for RAG; it lets RAG run on top of the **existing [Domino IQ Remote mode configuration](https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html)**. In the Remote-mode Configuration document in `dominoiq.nsf`, the key points (HCL's wording):

- **The endpoint is HTTPS only**: "The endpoint supported is HTTPS only," e.g. `https://endpoint-serv.example.com/v1/chat/completions`.
- **API Key is the only supported auth**: "This is the only form of authentication supported by HCL to the remote AI endpoint/server."
- **Trusted roots go into certstore**: "Add the Trusted roots for the remote AI server to Domino's Certstore database" — the endpoint is HTTPS, so Domino has to trust the remote CA first; skip this and the connection fails. This uses Domino's [`certstore.nsf`](/domino-news/en/posts/certstore-getting-started), **not** the JVM cacerts — that's the trust store the DRAPI/Java path consumes (see [the OIDC piece on DRAPI only trusting the JVM truststore](/domino-news/en/posts/drapi-keycloak-oidc)). Same idea, "Domino trusting an external server," but different subsystems use different trust stores — that's the easy trap.
- **Set Status to Enabled** so the Domino IQ task loads on the server.

> Implementation note: the official Remote-mode page frames this document around the LLM the remote AI inferencing engine uses; the fact that the embedding model can also be remote comes from the separate RAG support page. Exactly how each model type is pointed at its remote endpoint within the config is worth wiring up in a small environment and confirming against actual behavior before you rely on it — don't guess field names from naming conventions.

## When to use Remote vs. stay Local

- Don't want a local GPU and would rather hand inference to an existing remote service (self-hosted or a vendor, as long as it's OpenAI-API-compatible) → **Remote**.
- Even model inference must not leave the network (the strictest data-residency requirement) → **Local**, the whole stack on-box.
- **Either way**, the vector index and ACL/Readers filtering stay local — that's what FP1 left untouched, and it's the fundamental difference between Domino IQ RAG and "ETL your data out to an external SaaS."

[^rag]: RAG (Retrieval-Augmented Generation): before the LLM answers, it pulls semantically relevant documents from a designated source as context, so the response is grounded in your domain and current data.
[^llm]: LLM (Large Language Model) — neural networks trained on massive text corpora to generate natural-language responses from a prompt.
[^embedding]: An embedding model maps text into fixed-dimensional vectors so semantically related sentences land near each other — RAG uses it to index NSF documents for semantic search.
