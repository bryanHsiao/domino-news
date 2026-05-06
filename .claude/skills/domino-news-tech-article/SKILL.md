---
name: domino-news-tech-article
description: |
  Use this skill for any technical-deep-dive article work on the Domino News site (the repo at bryanhsiao/domino-news) — both fresh authoring AND salvaging failed daily-article drafts. The skill owns the end-to-end workflow: coverage-driven topic selection (must run `npm run coverage` first to consult docs/coverage.md), NotebookLM cross-check via the curated HCL Domino LotusScript Reference notebook, bilingual zh-TW + en writing with the site's editorial conventions (footnotes for AI acronyms, jargon localisation, identifier preservation), the inline-link diversity rule, the frontmatter schema including relatedJava / relatedSsjs cross-language fields, the salvage flow for rejected drafts in `_drafts/`, and the commit + push + backfill-covers ship sequence. Trigger this skill when the user mentions writing, drafting, "I want to write about", scheduling, or planning a Domino IQ / LotusScript / DQL / Notes class article, when they ask "what should I write next", when they ask for a deep-dive on a specific class or method, AND ALSO trigger when the user pastes an "Article validation failed" error message, asks to salvage a draft from `_drafts/`, mentions a failed cron, or refers to attempt1 / attempt2 files — those are all entry points into this same workflow. Do NOT use this skill for news articles (release notes, OpenNTF tool intros, ecosystem updates) or site infrastructure changes — those follow different flows documented in CLAUDE.md.
---

# Domino News — Technical Deep-Dive Author Workflow

This skill captures the workflow for writing **technical deep-dive
articles** on the Domino News site. Project-level facts (editorial
voice details, frontmatter schema reference, validation thresholds,
scheduling pattern, recent fixes) live in `CLAUDE.md` at the repo
root and are auto-loaded; this skill owns the **procedural
sequence** — what order to do things, what scripts to run, where to
fall back when one research source comes up short.

## When to use this skill

**Use it for**:

- **New technical deep-dive** — a piece on a specific LotusScript /
  Java / SSJS class, a method or property within one, a feature
  like DQL or Domino IQ, or a multi-class architectural walk-through.
- **Salvaging a failed daily-article draft** — when the user pastes
  an "Article validation failed" message, mentions a failed cron, or
  asks to recover something from `_drafts/`. The salvage path is
  documented in step 0 below — it shares steps 2–6 with the new-
  article path.

The output in either case is a bilingual `Tutorial`-tagged post.

**Skip it for**:

- **News articles** (release notes, OpenNTF tool intros, ecosystem
  updates). They don't tie to a specific class in the catalogue, so
  the coverage tracker step doesn't apply. Write them with the
  standard editorial conventions in CLAUDE.md but skip the steps
  here.
- **Site infrastructure** (workflows, scripts, schemas, layout).
  Those don't go through this pipeline at all.

## The two entry points at a glance

```
NEW ARTICLE                            SALVAGE
1. select   → npm run coverage         0. assess  → which attempt is worth saving
2. research → NotebookLM + WebFetch    2. research → re-confirm facts via NotebookLM
3. write    → bilingual zh + en        3. rewrite → fix the validation reason
4. validate → npm run build            4. validate → npm run build
5. ship     → commit, push, backfill   5. ship     → commit, push, backfill
6. refresh  → npm run coverage         6. refresh  → npm run coverage + clean _drafts/
```

Steps 2–6 are shared. Step 0 (salvage assessment) and step 1 (topic
selection) are mutually exclusive — the salvage path already has a
topic, and the new path doesn't yet have a draft. Each section
below is read in order whichever path you're on.

---

## Step 0 — Salvage assessment (only if the user came in with a failed cron)

**Trigger signals** (this section applies):

- User pastes an `Article validation failed:` message.
- User says "the daily article failed", "救一下今天的", "the cron
  hit `<error>`", "看看 _drafts 裡有什麼", or names attempt1 /
  attempt2.
- `_drafts/` contains files dated within the last day or two that
  haven't been processed yet.

The daily-article workflow (`scripts/generate-article.ts`) writes
each rejected draft to `_drafts/<YYYY-MM-DD>-attempt{1,2}-<slug>.md`
in both languages. Each file has a leading HTML comment noting the
validation errors, e.g.:

```
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: ...
  - Saturated source URL: ...
attempt: 2
slug: notes-acl
-->
```

### Assessment criteria — which attempt to save (if any)

For each attempt, judge against these in order. **Stop at the first
NO**.

1. **Is the topic worth keeping?**
   - If the rejection was *only* validation-mechanical
     (inline-link diversity, frontmatter format) — YES, salvage.
   - If the rejection was *saturated source URL* AND the article's
     subject is the same one already covered (e.g. another piece
     on the same Nomad release) — NO, drop it. The site doesn't
     need duplicate coverage.
   - If the rejection was *saturated source URL* but the article's
     subject is genuinely different from the saturating post (just
     happens to cite an overlapping URL), it can sometimes be
     salvaged by switching the source URL — judgement call.
2. **Is the topic relevant to the site?**
   - LotusScript / Java / SSJS / Domino feature / OpenNTF project —
     yes.
   - Generic AI / web dev — drop it (the model wandered off).
3. **Is the content factually trustworthy?**
   - The model often invents method signatures / class behaviour.
     Don't trust the draft as written — assume every fact needs
     re-confirming.

If both attempts fail any criterion, drop both and tell the user
"both attempts aren't salvageable today" — that's a fine outcome.
Then clean the drafts (`rm _drafts/<YYYY-MM-DD>-*`) and move on.

### Once you've picked the salvage candidate

- Skip step 1 (topic selection) — the topic is already chosen.
- Go to step 2 (research) and **re-research from scratch** — do not
  trust the draft's "facts" without NotebookLM + WebFetch
  confirmation. The whole point of the salvage flow is to replace
  the model's first-pass output with a verified rewrite.
- The eventual rewrite reuses the draft's title and slug only as
  starting points; expect to revise the title, restructure the
  body, and fix every validation issue end-to-end.
- In step 6 (refresh), also delete the salvaged attempt's `_drafts/`
  files (and any stale attempts that won't be saved) so the dir
  doesn't accumulate cruft.

---

## Step 1 — Topic selection (new article only)

The site has a coverage tracker. `data/ls_classes.json` is OpenNTF's
catalogue of all 97 LotusScript classes; `docs/coverage.md` is the
rolling report of which classes the site has already written about,
matched by URL filename basename so 14.0.0 vs 14.5.1 path
differences don't matter.

**Sequence**:

```bash
npm run coverage          # refreshes docs/coverage.md
```

Then open `docs/coverage.md` and read the
**`## ⨯ Uncovered classes`** table. That's the canonical pool of
"classes we haven't written about yet." Currently 81 / 97 untouched.

**Selection priority** (in order of preference):

1. **0%-coverage categories first.** Going zero-to-one in a category
   that has nothing yet is more valuable than adding the fifth post
   in an already-covered category. Categories currently at 0% in
   the latest report: UI, Admin, Session, Calendar, GPS, DominoIQ,
   Composite Apps. Pick from these whenever feasible.
2. **Group thin classes into a trio.** Some catalogue entries are
   intentionally small — `NotesGPSCoordinates` is essentially
   `lat`/`long` and not enough for a 1500-word piece. Their
   sibling-class group can become one article (e.g. "the GPS trio:
   `NotesGPS` / `NotesGPSCoordinates` / `NotesGPSPosition`").
   Don't pad a thin class.
3. **Method or property deep-dive on a covered class.** Even though
   `NotesStream` is "covered" by an earlier post, its multi-byte
   `Position` semantics or the BOM-on-`WriteText` quirk could each
   stand on their own.

**Anti-patterns** to avoid:

- Picking a class because it's mentioned in a recent HCL blog or
  forum post — that's the daily-article workflow's job, not yours.
  Stay disciplined to the catalogue.
- Picking a class that's already been deeply covered when 81 are
  still untouched.

---

## Step 2 — Research

Two-pronged: **NotebookLM** for the structured summary, then
**WebFetch** for the syntax-level gaps.

### NotebookLM cross-check

The site has a curated NotebookLM notebook of HCL Domino 14.0
LotusScript Reference content:

```
https://notebooklm.google.com/notebook/bb543ae4-7f16-4048-aee2-93d31543543e
```

Use the `notebooklm` skill's `ask_question.py` script. On Windows
prefix with `PYTHONIOENCODING=utf-8` to avoid CP950 unicode errors
when the model returns emoji.

**Question pattern** — ask **one thorough question** covering all
of these dimensions in a single request (the notebook charges per
session, so spend the budget on one well-formed question rather
than five small ones):

1. What the class is and the problem it solves
2. How to instantiate it (typically a `NotesSession.CreateXxx`)
3. Full property list — names, read/write, types, one-line role
4. Full method list — names, parameters, returns, one-line role
5. Version notes — when introduced, COM support, deprecation
6. Caveats / gotchas / known bugs
7. A real LotusScript code example showing a complete workflow
8. Java and SSJS counterpart class names (for the cross-language
   pointer section + the `relatedJava` / `relatedSsjs` frontmatter)

### Fallback when NotebookLM is thin

The reference notebook holds class-level overviews but not the
individual method or property pages. When the answer comes back
with **"Missing Information"** for syntax-level details (parameter
types, return types, complete code samples), fall back to WebFetch
on the specific HCL doc URL.

**HCL doc URL patterns** (14.0 designer help):

```
Class page:    https://help.hcl-software.com/dom_designer/14.0.0/basic/H_<CLASS>_CLASS.html
Method page:   .../H_<METHOD>_METHOD_<CLASS>.html  or  H_<METHOD>_METHOD.html
Property page: .../H_<PROPERTY>_PROPERTY_<CLASS>.html
```

The class page lists hyperlinks to all its method and property
pages — fetch the class page first, ask WebFetch to extract the
hyperlink list, then drill into the specific pages you need.

**Variants worth knowing**:
- Some class names use double-underscore: `H_NOTES_HTTPREQUEST_CLASS.html`
  (note `NOTES_HTTPREQUEST`, not `NOTESHTTPREQUEST`). Verify by
  fetching first; 404s are common and the patterns vary.
- Admin-side features (Domino IQ, server config) live under
  `domino/14.5.1/admin/...` not `dom_designer/...`.

### What to record while researching

- **Verbatim quotes** from official docs — cite them as evidence in
  the article. Readers trust direct quotes over paraphrase.
- **Java + SSJS counterpart class names**, for `relatedJava` /
  `relatedSsjs` frontmatter. Even if no equivalent exists (e.g.
  `NotesHTTPRequest` has no Java Domino-API counterpart), record `[]`
  — that's a useful framing for the cross-language section.
- **Non-obvious version constraints** ("introduced in Release 6, not
  supported in COM").
- **Official code examples** worth lightly adapting.

---

## Step 3 — Writing

Bilingual: zh-TW + en. They're not literal translations — write
each one naturally in its target language. Same structure, same
facts, but the prose flows in the language being written.

The detailed editorial conventions live in `CLAUDE.md` under
"Editorial voice" and "Frontmatter conventions". Highlights to
keep in mind:

- **Identifiers stay English** — class names, file names, HCL UI
  labels (`NotesXxx`, `dominoiq.nsf`, `GGUF`, `NSF`, `ACL`,
  `Readers field`, `updall -w`, `Command document`, etc.). Readers
  searching the official docs need them in canonical form.
- **Domain jargon localises in zh** — examples already established:
  `inference engine` → 推論引擎,
  `process boundary` → 行程邊界,
  `application layer` → 應用層,
  `context size` → 上下文大小,
  `concurrent requests` → 並行請求.
- **AI-domain acronyms get markdown footnotes** (`[^x]: ...`). Astro
  renders the section heading as 「註」 in zh and "Footnotes" in en
  via the custom rehype plugin in `astro.config.mjs`. GGUF, LLM,
  embedding model, guard model are the canonical examples.

### Inline-link diversity

`scripts/generate-article.ts` validates posts on the AI flow:
- ≥ 2 inline links per language body
- No single URL appears in ≥ 40% of inline links across zh + en

For human-written posts, the **target** is:
**3 inline links per language across 3 distinct URLs**, giving 6
total links / 3 URLs × 2 each = 33%.

Pick three different official doc pages — typically the class page,
one method page, and a related sibling class page. Internal site
anchors (`/domino-news/posts/...`) don't count toward the diversity
math, so use them freely for cross-references between articles.

### Cross-language pointer section

End every technical deep-dive with this section:

- **zh**: `## 同類別在其他語言`
- **en**: `## What about Java and SSJS?`

Format: a small table or 1-line list giving the Java + SSJS class
counterparts. **Do not go deep** — that's reserved for a future
Java- or SSJS-only post (per the C plan in CLAUDE.md). Internal
links from this section to future single-language posts are added
later when those posts land.

If no Java/SSJS counterpart exists (e.g. `NotesHTTPRequest` ↔
`java.net.http.HttpClient`, no Domino-API equivalent), say so
explicitly — that's an interesting framing ("LS is more convenient
than Java/SSJS in this corner") rather than a missing piece.

---

## Step 4 — Frontmatter

Schema is in `src/content.config.ts`. The full shape:

```yaml
---
title: "..."                            # Concrete; LS-class-driven posts
                                        # often "<Class>: <one-line angle>"
description: "..."                      # 1-2 sentences. Used as og:description
                                        # and shown on the homepage card.
pubDate: 2026-MM-DDT07:30:00+08:00      # UTC 23:30Z previous day —
                                        # aligned with nightly-rebuild cron
lang: zh-TW                             # or `en`
slug: descriptive-kebab-case            # Same slug across both languages
tags:
  - "Tutorial"                          # Required for tech deep-dives
  - "LotusScript"                       # or "Java" / "SSJS" / "Domino IQ"
  - "..."
sources:                                # 2+ trusted official references
  - title: "..."
    url: "https://help.hcl-software.com/..."
  - title: "..."
    url: "..."
cover: "/covers/<slug>.png"             # Written by backfill-covers
coverStyle: "..."                       # Written by backfill-covers
relatedJava: ["Session", "Document"]    # Java counterpart class names — [] if
                                        # no Domino-API equivalent exists
relatedSsjs: ["Session", "Document"]    # Same for SSJS
---
```

**Filename**: `src/content/posts/{en,zh-TW}/<YYYY-MM-DD>-<slug>.md`,
where `<YYYY-MM-DD>` is the date portion of pubDate.

**Why pubDate at 07:30 +08:00**: that's UTC 23:30Z previous day,
aligned with `nightly-rebuild.yml` which fires at 23:30 UTC. The
post reveals itself at the first build crossing its pubDate.

**`relatedJava` / `relatedSsjs`** — fill these while researching,
even if no article exists for the Java / SSJS side. They feed the
coverage tracker's cross-language matrix and surface "topics worth
a single-language deep-dive next." Use `[]` if there's no
Domino-API counterpart in that language.

---

## Step 5 — Build & ship

```bash
# 1. Local build catches frontmatter / schema / footnote errors
npm run build

# 2. Commit & push
git add src/content/posts/en/<YYYY-MM-DD>-<slug>.md \
        src/content/posts/zh-TW/<YYYY-MM-DD>-<slug>.md
git commit -m "Schedule <YYYY-MM-DD> post: <topic title>

<2-3 line description of what the article covers, the key insight,
and any cross-references to companion posts. CLAUDE.md commit-style
is descriptive multi-line, not just a one-liner.>"
git push origin main

# 3. Trigger cover generation
gh workflow run backfill-covers.yml --ref main

# 4. Optional — watch the run
gh run list --workflow=backfill-covers.yml --limit=1
gh run watch <run-id> --exit-status

# 5. Pull the cover commit back locally
git pull --ff-only
```

The `backfill-covers.yml` workflow detects the new post (no `cover:`
yet), runs `scripts/backfill-covers.ts`, picks a `coverStyle` via
sampling-without-replacement against the recent ±3 posts (so the
new style won't clash with neighbours), generates the image,
writes `cover:` and `coverStyle:` back to both language files, and
commits a follow-up.

**For future-scheduled posts** (pubDate >= now): nothing further
needed. `nightly-rebuild.yml` reveals it on schedule.

**For "publish now" posts** (pubDate <= now): manually trigger
deploy:

```bash
gh workflow run deploy.yml --ref main
```

---

## Step 6 — Refresh the coverage tracker (and clean _drafts if salvaging)

After ship, **re-run `npm run coverage`** to update
`docs/coverage.md`, then commit the diff:

```bash
npm run coverage
git add docs/coverage.md
git commit -m "coverage: refresh after <slug>"
git push origin main
```

This keeps the next topic-selection round honest — `Uncovered`
shrinks as posts ship, and you see the cross-language matrix
update with whatever Java / SSJS classes you recorded in
`relatedJava` / `relatedSsjs`.

**If this was a salvage** — also remove the corresponding files from
`_drafts/`. Both the salvaged attempt and any sibling attempts that
didn't make it should be cleared in the same commit:

```bash
rm _drafts/<YYYY-MM-DD>-attempt1-*.md
rm _drafts/<YYYY-MM-DD>-attempt2-*.md
git add -A
git commit -m "Clean salvaged + dropped attempts from _drafts/"
git push origin main
```

Letting `_drafts/` accumulate makes future salvage assessments
harder (which attempt is from today vs three days ago?), so always
clean at the end.

---

## Common pitfalls

- **Missing `relatedJava` / `relatedSsjs`** — easy to skip when the
  class has no Java counterpart. Always set `[]` explicitly so the
  absence is intentional, not "we forgot."
- **Inline-link diversity miss** — using the same class doc URL
  4+ times in one body. Spread across class page + method page +
  sibling class page. Run `npm run build` to catch this early; the
  validation also runs in the AI generation path.
- **Citing only the class page in `sources`** — the class catalogue
  matches it, but readers wanting syntax detail still have to click
  through. For posts that focus on a specific method, cite that
  method page in `sources` too.
- **Skipping NotebookLM and going straight to WebFetch** — the
  notebook gives structured class summaries fast. Skipping costs
  both time and accuracy. Do it first.
- **Copying NotebookLM "Missing Information" verbatim** — that
  string appearing in a published post is a clear sign you stopped
  researching too early. Always WebFetch the syntax page when this
  shows up.
- **Wrong pubDate alignment** — picking 07:00 instead of 07:30 risks
  a same-day collision with another post (we've shipped two posts
  on the same day before, and 30-min separation matters for
  ordering on the homepage card grid).

---

## Reference paths

- `CLAUDE.md` — project memory: editorial voice, frontmatter schema,
  validation thresholds, scheduling, recent fixes.
- `data/ls_classes.json` — OpenNTF class catalogue (97 entries).
- `docs/coverage.md` — rolling coverage report.
- `scripts/lib/coverage.ts` — coverage extraction module.
- `scripts/coverage-report.ts` — `npm run coverage` entry point.
- `scripts/lib/cover-prompt.ts` — 12 visual styles for cover gen.
- `astro.config.mjs` — Astro config + custom rehype plugin for
  bilingual footnote labels.
- `.github/workflows/backfill-covers.yml` — cover generation workflow.
- `.github/workflows/nightly-rebuild.yml` — daily reveal trigger.
- `.github/workflows/deploy.yml` — main deploy.
