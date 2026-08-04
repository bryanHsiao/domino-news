---
title: "Field Notes from OpenNTF's Domino IQ RAG Webinar: the 30-Char Gotcha, Vectorization in 3 Steps, and the FP1 Readers Fix"
description: "OpenNTF hosted HCL's Brian Arnold for a deep session on Domino IQ RAG. We've already covered how the pipeline works under the hood; this is the field-report layer — the 30-character limit for RAG-enabling short fields and the concat-field way around it, vectorization in three steps, the three knobs to tune, the fact that Readers/Authors-field security only really started working in Domino 2026 FP1, and the citations, side panel, and MCP still under development."
pubDate: 2026-08-04T15:00:00+08:00
lang: en
slug: openntf-domino-iq-rag-webinar
tags:
  - "Domino IQ"
  - "AI"
  - "Community"
sources:
  - title: "OpenNTF Webinar: DominoIQ RAG (Brian Arnold, HCL) — YouTube"
    url: "https://www.youtube.com/watch?v=J26LvWtq8-Y"
  - title: "OpenNTF Blog"
    url: "https://www.openntf.org/blogs/openntf.nsf/"
  - title: "Domino IQ RAG support — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
---

[OpenNTF](https://www.openntf.org/blogs/openntf.nsf/) posted a webinar worth watching in early August: HCL's Brian Arnold — 32 years on Notes/Domino, with a direct line to the Domino IQ engineers — spent nearly 90 minutes taking Domino IQ's RAG from concept all the way to live applications.

The site's earlier [Domino IQ RAG technical write-up](/domino-news/en/posts/domino-iq-rag) covered *how the pipeline runs inside the server*; what this webinar adds is the other layer: **the gotchas you actually hit, how to get around them, and what's still under development**. Here are the points most useful to developers (what RAG is and why it runs locally is in that technical piece, not repeated here).

---

## TL;DR

- **The most practical gotcha:** a field you want to RAG-enable must hold **at least 30 characters**. Plenty of app fields are 10–15 chars and simply can't be vectorized as-is. The fix is one concat field that merges several fields together.
- **Vectorization is three steps:** full-text index the database → enable Domino IQ vectorization by right-clicking it in Domino Administrator → run `load updall -w` at the console to build the vector data.
- **Three knobs to tune:** `rag maximum responses` (how many documents to pull, ~20), `rag threshold` (similarity cutoff, Brian uses 0.4), and `temperature` (randomness; keep it 0.1–0.4 for accuracy).
- **Readers/Authors-field security only really started working in Domino 2026 FP1** — it shipped broken at 2026 GA and was fixed in FP1.
- **Under development / coming:** **citations** in responses (which document the answer came from, PDF content included), a **side panel** in the Notes client (ask RAG anywhere, no app redesign), and an **MCP server** (within ~12 months).

---

## That 30-character gotcha (and the way around it)

This was the most practical stretch of the session. Brian put it plainly: **a RAG-enabled field's value must be at least 30 characters**, or vectorization doesn't get enough context. The trouble is that a lot of Domino app fields are short by nature — he demoed a toy company's inventory/sales system where customer, quantity, and cost fields each hold only a dozen-odd characters, none of which clears the bar on its own.

The fix is very Domino: **add an "abstract" field that concatenates several fields into one labelled chunk of text**, then point Domino IQ at only that field for vectorization. Brian's field reads like a labelled record — "this is a sale," the cost, the quantity, the product name, the company, the contact, the location, all strung together. That single field now carries enough context; he asked "what's the top-selling product?" against thousands of sales documents and got a correct answer back fast.

Two follow-ons:
- **Existing documents need a refresh** to populate the new field — a bit of LotusScript, formula, or a simple compute-with-form agent that recomputes it.
- **The format of the concatenation matters:** plain text with field labels works, but in the Q&A both Brian and the host noted that **switching to JSON produced noticeably better results**; a step further, HTML-style "AI tags" (`<cost>…</cost>`) work well too, since AI systems latch onto that structure. It's worth experimenting to fit the questions you actually ask.

## Vectorization: three steps, three knobs

Brian broke vectorization into a clean three-step process (matching the prerequisites in the site's [technical piece](/domino-news/en/posts/domino-iq-rag)):

1. **Full-text index the database** — vectorization is built on top of the FT index.
2. **Right-click the database in Domino Administrator → Domino IQ → enable vectorization.**
3. **Run `load updall -w` at the console** — the `-w` tells the indexer to also build the vector data.

(He said this step is due to be automated; he's already scripted "full-text index + vectorize" end to end in LotusScript.)

Three settings people keep asking about, with Brian's own tested values:

| Setting | What it does | Brian's value |
|---|---|---|
| `rag maximum responses` | how many documents to pull to compose an answer; more = slower | ~20 |
| `rag threshold` | minimum similarity for a chunk (a quality filter); higher is more precise but can miss partial matches | 0.4 (40%) |
| `temperature` | randomness of the response; higher is more creative but more prone to hallucination | 0.1–0.4 (low for accuracy) |

## Readers/Authors-field security: only really fixed in FP1

This was one of the joint most-asked Q&A questions, and the most worth-recording *update* from the session: **RAG honors Domino's document-level security model (Readers fields)** — a user authorized to see 40,000 of 200,000 documents won't get matches from the ones they aren't allowed to read.

The site's [technical piece](/domino-news/en/posts/domino-iq-rag) cited the [official RAG docs](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html) that this is built-in behavior; what the webinar adds is the timing — **it wasn't actually working when Domino 2026 shipped at GA, and was fixed in 2026 FP1**. If you tried RAG on GA and worried whether Readers fields were being respected, the answer is: move to FP1.

## Under development / coming next

Brian flagged up front that some screens were dev builds and details will change, but the concepts land in near-future releases. A few worth watching:

- **Citations (sources on the response):** not just an answer but a pointer to the document it came from — the one he demoed was even a **PDF**, whose content Domino IQ had vectorized and could still cite. Handy for developer debugging and audit.
- **A Notes client side panel:** call Domino IQ to RAG-query, summarize, or translate from **anywhere** in the client, without sitting in that database or even redesigning the app.
- **An MCP server:** the model context protocol built into Domino IQ, so the AI doesn't just answer but performs actions (open a ticket, send mail, change a document's state). Brian put it at **within ~12 months**, not necessarily Domino 2027 but on the way. AI agents, meanwhile, **you can build today** — wire a Domino agent (JavaScript / Java / LotusScript) to Domino IQ's response and have it act.

On hardware: local LLMs still need an **Nvidia GPU** (non-Nvidia and ARM / Raspberry Pi are in progress); skip the GPU and you can use a third-party LLM (OpenAI / Gemini), but you pay token fees — GPU is one-time, tokens are monthly, and Brian spent a good while on that math. For running locally, the model Brian uses and likes most is **Llama 3.3 8B instruct (Q5) from Hugging Face** — though he notes that for translation-only needs, more specialized models do better.

---

For the full demos (how the concat field is set up, and what citations and the side panel look like), [the recording is on OpenNTF's YouTube](https://www.youtube.com/watch?v=J26LvWtq8-Y). For how this RAG pipeline works inside the server, see the site's [Domino IQ RAG write-up](/domino-news/en/posts/domino-iq-rag); for the broader Domino IQ background, there's [the Domino IQ piece](/domino-news/en/posts/domino-iq).
