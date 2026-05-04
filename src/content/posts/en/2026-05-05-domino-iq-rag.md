---
title: "Domino IQ RAG: A Built-In Pipeline That Wires Your NSFs Straight Into a Local LLM"
description: "Domino 14.5.1 adds RAG (Retrieval-Augmented Generation) support to Domino IQ, running the LLM, embedding model, and vector database all on the Domino server itself — local execution, with NSF ACL and Readers fields enforced natively. This guide walks through prerequisites, the two-phase dominoiq.nsf configuration, updall vectorization, calling LLMReq from LotusScript, and why this is a different species from the OpenAI + Pinecone pipeline."
pubDate: 2026-05-05T07:30:00+08:00
lang: en
slug: domino-iq-rag
tags:
  - "Domino IQ"
  - "AI"
  - "Domino Server"
  - "Tutorial"
sources:
  - title: "RAG support in Domino 14.5.1 — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
  - title: "Configuring the Command document for RAG — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_command_doc_for_rag.html"
  - title: "Security considerations for Domino IQ — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_security_considerations_for_iq.html"
  - title: "Domino IQ — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/domino_iq_server.html"
cover: "/covers/domino-iq-rag.png"
---

## What RAG looks like inside Domino IQ

[Domino 14.5.1 ships RAG](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html) (Retrieval-Augmented Generation) support — before the LLM answers, it pulls semantically-relevant documents from an NSF you point it at, so the response is "grounded, current, and domain-specific." A typical RAG stack out in the wild involves OpenAI plus Pinecone plus LangChain glue. Domino IQ packs the whole stack into server tasks.

When you mark a Command document as RAG-enabled, the DominoIQ task in the Domino server process spins up locally:

- a `llama-server` instance with the LLM inference model,
- a `llama-server` instance with the embedding model,
- a vector database server,
- optionally, a `llama-server` instance with a guard model.

When a user sends a prompt, it gets semantically searched against the vector DB, the matching NSF documents are pulled and prepended to the prompt, and the whole package goes to the LLM — never leaving your Domino server.

## Three things that are different from generic RAG

**1. Local mode is mandatory.** RAG support is "available only when the Domino IQ server is configured in Local mode" — the LLM handling RAG content runs on your server, not a cloud API. That single rule eliminates the data-residency arguments common in financial / legal / healthcare deployments.

**2. ACL and Readers fields are honored natively.** When a database is enabled as a RAG source, "LLM command request handling honors both the ACL and any applicable Readers field in the documents of the RAG-enabled database by using the Notes DN in the authenticated session." User A's prompt only gets matches from documents A is allowed to read; documents protected by a Readers field for B never leak into A's context. This is brutal to do correctly in a generic RAG pipeline.

**3. The DominoIQ task owns the lifecycle.** Embedding model, vector DB, LLM inference, vectorization — all driven by two server tasks (`DominoIQ` and `updall`). No Pinecone account to manage, no separate ETL pipeline to maintain.

## Prerequisites

```
✓ dominoiq.nsf upgraded with the 14.5.1-shipped dominoiq.ntf
✓ Transaction logging enabled on the Domino IQ servers hosting RAG-enabled DBs
✓ Each RAG source DB replicated to the Domino IQ server
✓ Each RAG source DB full-text indexed with "Index attachments" enabled
✓ A GGUF-format embedding model picked (mxbai-embed-large, bge-me,
  nomic-embed-text, snowflake-arctic-embed, etc.)
```

Pick the embedding model based on your content's language and the vector dimensionality you want.

## Configuration walkthrough

### Step A: Embedding & Vector DB in dominoiq.nsf

Open `dominoiq.nsf` → Add Configuration / Edit Configuration:

- **Embedding Model tab**: pick your GGUF embedding model, set status to Enabled, change the port if you must, raise the context size above the default 1024 if your model supports it.
- **Vector Database tab**: change port or host if you're running multiple partitions.

### Step B: RAG fields on the Command document

On the Command document, the [RAG-specific fields](https://help.hcl-software.com/domino/14.5.1/admin/conf_command_doc_for_rag.html) are:

| Field | Purpose | Default |
|---|---|---|
| `RAG enabled database` | DB path (relative to the data directory) | — |
| `RAG enabled fields` | Which fields get embedded into the vector DB | — |
| `RAG threshold` | Minimum semantic-search score for a match to qualify | 0.7 |
| `RAG maximum responses` | Cap on matches included in the LLM context | 25 |
| `Maximum tokens` | LLM prompt token limit (RAG inflates the prompt — raise this) | — |

### Step C: Enable and vectorize

1. **Restart the Domino IQ server** — that's how the embedding and vector DB sub-processes come up.
2. Administrator client → Files panel → right-click the source DB → **Domino IQ** → **Enable**.
3. From the server console: `load updall -w <rag-dbname>` — this is the vectorization step that ingests the NSF's documents into the vector DB.

> **Vectorization can take several minutes** depending on document count and attachment size; the embedding model has to compute a vector for every relevant field and attachment.

## Calling it: LLMReq

Once configured, application code invokes the AI command via the `LLMReq` method in LotusScript or Java. From the caller's perspective it's an ordinary method call: pass a prompt, get back a string — under the covers, the request flows through vector search → top-N document retrieval → LLM inference.

> Heads-up: as of 14.5.1 the admin docs don't pin down the full LLMReq signature there (it lives in Designer help). Test it against a small dataset first to confirm the wiring matches your expectation.

## Security: ACL + Readers, automatic

The [security model](https://help.hcl-software.com/domino/14.5.1/admin/conf_security_considerations_for_iq.html) hinges on this single sentence: "LLM command request handling honors both the ACL and any applicable Readers field in the documents of the RAG-enabled database by using the Notes DN in the authenticated session." In a generic RAG pipeline this filtering has to happen somewhere in your application layer and is famously easy to get wrong; Domino IQ enforces it server-side, so leaking another user's restricted document into the context is structurally prevented.

Bonus: HCL recommends choosing a model with paraphrasing capability so retrieved RAG content isn't reproduced verbatim in the response — extra defense against accidental disclosure of source text.

## Capacity and performance tuning

Because RAG inflates the prompt, the default LLM context size won't cut it. Under the Advanced tab in dominoiq.nsf, the `Special parameters` field takes options like `-c 65000`; combined with the concurrent-request setting, the math works like "10 concurrent × `-c 65000` ≈ 6500 tokens of context per request." GPU offloading parameters live on the same tab.

Also worth pinning down explicitly: in the Command's system prompt document, tell the model exactly how to respond when no RAG matches are found. Skip this and the LLM will confidently invent something — exactly what RAG was supposed to prevent.

## The clean disable workflow

1. Clear the RAG source DB field on the Command document, save.
2. Restart the Domino IQ server.
3. From the server console: `load updall -w -d <RAG-dbname>` — wait for completion, this purges the NSF's entries from the vector DB.
4. Administrator client → Files panel → right-click the DB → **Domino IQ** → **Disable**.

Order matters — clear the Command document first, purge vector entries after. Don't reverse.

## Why this beats bolting on a generic SaaS LLM

Building a comparable RAG pipeline with OpenAI / Anthropic + a hosted vector DB is technically doable but you immediately run into:

- ETL'ing data out of Domino — often a contractual or compliance non-starter,
- re-implementing ACL / Readers-field filtering in your application layer,
- a separate vector DB account, traffic shaping, and rate-limit budgeting,
- LLM API billing and per-token usage monitoring.

Domino IQ RAG collapses those four concerns into one configured Command document. The cost is you do need a server that can run a GGUF model (GPU optional, but it helps). For most existing Domino shops that's a fair trade.
