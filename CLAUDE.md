# Domino News — Project Conventions for Claude

This file pins down the editorial voice, infrastructure patterns, and
open decisions for this site so we don't re-derive them each session.
Update it whenever a convention solidifies or a decision is made.

**Procedural workflows live in skills, not here.** When the user asks
to draft a technical deep-dive article, invoke the
**`domino-news-tech-article`** skill (under `.claude/skills/`) — it
owns the step-by-step author flow (topic selection → research →
write → ship) and references the facts below. This file is the
reference; the skill is the workflow.

---

## Git commit conventions (overrides global)

This repo openly credits its AI tooling, so the user's global
"no `Co-Authored-By`" preference is overridden here. **Every
commit made by Claude on this repo MUST end with the trailer:**

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

Format requirements (per git trailer convention):
- Blank line between the commit message body and the trailer
- Exact casing `Co-Authored-By` (one of the few git-recognised
  trailers; `Co-authored-by` also works but stay consistent)
- Email `noreply@anthropic.com` is the Anthropic-published
  no-reply address — don't substitute a fake one

The trailer is symbolic — it won't show Claude in the GitHub
Insights → Contributors graph (Claude has no GitHub user account),
but it puts the credit in the commit log where anyone reading
`git log` can see it. The README's `## Built with` section is the
broader place for tooling credit.

This rule applies ONLY to this repo. Other repos still follow the
user's global "no `Co-Authored-By`" preference.

---

## Research workflow (mandatory for any technical article)

Any technical article — LotusScript, Java, SSJS, Domino feature,
admin guide, release-note breakdown, news piece with technical
content — MUST go through this research chain. No exceptions for
"small" articles or "I already know this."

1. **NotebookLM first.** Invoke the `notebooklm` skill against the
   curated reference notebook for the domain (see "NotebookLM
   usage" below for the current notebook URLs). Ask one thorough
   question covering: what it is, how to instantiate / call /
   configure, key methods or steps, common pitfalls, sibling
   references. Capture verbatim quotes to back claims in the
   article.
2. **WebFetch where NotebookLM is thin.** When NotebookLM marks
   sections "Missing Information" (common for method-level
   syntax — the reference notebooks are class-level overviews),
   fall back to WebFetch on the specific HCL doc URL.
3. **Treat contradictions as red flags.** If NotebookLM and
   WebFetch disagree on a fact, investigate before writing — do
   not pick whichever sounds better.
4. **Don't fill gaps with guesses.** If both sources dry-hole on
   a key fact, flag it to the user rather than inventing. "Per
   general LotusScript knowledge" or "in my experience" without
   a citation is not acceptable in this site's articles.

Applies regardless of: language (LS / Java / SSJS), article type
(class deep-dive / feature walk-through / news piece with
technical content), or how the request arrived (manual / salvage
/ cron). Exception: site infrastructure work (workflows, scripts,
schemas, build config) doesn't need this — code-level changes
verify themselves via build + tests.

If the domain has no NotebookLM notebook yet (e.g. a topic from a
Domino subsystem we haven't curated sources for), flag this to the
user up front. Do not proceed by going straight to WebFetch — that
loses the source-grounded citation chain.

---

## Editorial voice

- **No "AI-generated" framing.** About / welcome / site description
  read as "by a longtime Domino developer." Don't reintroduce GPT /
  Claude / consultant / two-model-pipeline language.
- **Identifiers stay English.** Class names, file names, command
  names, HCL UI labels — never translate (`NotesLLMRequest`,
  `dominoiq.nsf`, `Command document`, `GGUF`, `NSF`, `ACL`,
  `Readers field`, `updall -w`, etc.).
- **Domain jargon localises in zh posts.** Examples already done:
  `inference engine` → 推論引擎, `process boundary` → 行程邊界,
  `application layer` → 應用層, `context size` → 上下文大小,
  `concurrent requests` → 並行請求.
- **AI-domain acronyms get footnotes.** GGUF / LLM / embedding model /
  guard model are explained via markdown footnote `[^x]: ...`. Astro
  renders these with a 「註」 heading in zh, "Footnotes" in en, via
  the custom `rehypeLocaliseFootnotes` plugin in `astro.config.mjs`.
- **Section heading: TL;DR / 重點摘要.** When opening with a quick-
  summary section, zh uses `## 重點摘要`, en uses `## TL;DR`. Don't
  leave English internet shorthand untranslated in zh posts — same
  rule that applies to other domain jargon.
- **Evergreen cross-references — no time-relative phrasing in series
  articles.** When a multi-part series cross-links, use neutral
  phrasing that still reads right a year later: 「續篇 [X](url)」/
  「對比文 [X](url)」/ "the follow-up [X](url)" / "the comparison
  piece [X](url)" — never 「昨天 / 明天 / 今天」/ "yesterday's /
  tomorrow's / today's" / "earlier this week" / "day after." A reader
  arriving via search has no "yesterday" context; the article needs
  to stand on its own.

---

## Frontmatter conventions

Required: `title`, `description`, `pubDate`, `lang`, `slug`, `tags`,
`sources`. Optional: `cover`, `coverStyle`, `updatedDate`,
`relatedJava`, `relatedSsjs`, `draft`.

- **pubDate**: `YYYY-MM-DDT07:30:00+08:00` (= UTC `23:30Z` the previous
  day, aligned with `nightly-rebuild.yml` cron at 23:30 UTC so the
  post reveals itself in the same build that crosses its pubDate).
- **coverStyle**: written automatically by `backfill-covers.ts` — one
  of 12 style ids defined in `scripts/lib/cover-prompt.ts`. Don't set
  manually unless intentionally locking a style.
- **relatedJava / relatedSsjs**: cross-language class names.
  See "Cross-language linking strategy" below.
- **welcome.md is special**: cover is hand-picked (the domino-tile
  image), `coverStyle` is intentionally absent so the auto-sampling
  doesn't treat that style as taken.

---

## Inline-link diversity (validation)

`scripts/generate-article.ts:600+` enforces:

- zh body must have ≥ 2 inline links
- en body must have ≥ 2 inline links
- across zh+en, no single URL appears in ≥ 40% of inline links

Internal anchors (`/domino-news/posts/...`) don't count — only
`https?://` URLs are tallied.

**Target for human-written posts**: 3 inline links per language across
3 distinct URLs → 6 total / 3 URLs × 2 each = 33%.

---

## Cross-language linking strategy (LS / Java / SSJS)

**Plan C** (decided 2026-05-07):

- LotusScript articles get the deep treatment.
- Java and SSJS get their own articles **later**, only when there's
  a unique angle worth a deep dive.
- When writing an LS article, **always check** for the Java / SSJS
  equivalent class while researching, and record the names in
  frontmatter:

  ```yaml
  relatedJava: ["Session", "Database"]
  relatedSsjs: ["session", "database"]
  ```

  If no equivalent exists (e.g. `NotesHTTPRequest` has no Java
  counterpart in the Domino API), use an empty array `[]`.
- LS articles end with a short "## 同類別在其他語言" / "## What about
  Java and SSJS?" section listing those names + 1-line difference.
  Don't go deep — that's reserved for the future single-language piece.
- When a Java / SSJS post eventually lands, retrofit internal links
  back from the LS posts to the new piece.

---

## Coverage tracker

Built 2026-05-07.

- **Source data**: `data/ls_classes.json` — cached from
  [OpenNTF/ls-classmap](https://github.com/OpenNTF/ls-classmap)'s
  `develop` branch (97 classes, each with `docUrl` plus full
  property/method/event lists, Apache 2.0). Refresh by re-running
  the curl in `data/README.md`.
- **`scripts/lib/coverage.ts`** — shared module that loads the class
  catalogue, scans `posts/en/*.md` (frontmatter `sources` URLs +
  body inline-link URLs), and matches against every class +
  prop + method + event docUrl. URL matching is by **filename
  basename only** (lowercased) so `dom_designer/14.0.0/...` posts
  match the catalogue's `14.5.1/...` paths.
- **`scripts/coverage-report.ts`** — CLI that wraps the module and
  emits `docs/coverage.md` (committed). Run with `npm run coverage`.
- **Cross-language matrix**: same module also reads `relatedJava` /
  `relatedSsjs` from frontmatter, builds parallel mention maps so
  the report shows which Java / SSJS class has been "linked from
  an LS post but not yet written about" — that's the natural pool
  of "topics worth a single-language deep-dive next."

**Topic-selection workflow** — moved to the
`domino-news-tech-article` skill. The skill is mandatory reading
before drafting a new technical deep-dive; it handles the
coverage-driven selection logic, NotebookLM cross-check pattern,
the bilingual writing flow, and the ship sequence. This file
keeps just the *facts* the skill references.

### Known limitations (not bugs)

URL-based detection misses posts that don't link the *class* doc
specifically:

- `dql-getting-started` / `dql-pitfalls` cite `dql_syntax.html` /
  `dql_view_column.html` (the DQL syntax docs, not
  `H_NOTESDOMINOQUERY_CLASS.html`) — the report shows them as
  "covers nothing" even though they're obviously DQL pieces.
- `domino-iq` / `domino-iq-rag` cite admin docs under
  `domino/14.5.1/admin/...`, not the designer class doc
  `H_NotesLLMRequest_Class.html` — same blind spot.

Two ways to fix when this becomes annoying:

1. Add the relevant designer-class doc as one of the inline links
   in those articles (works retroactively).
2. Add a declarative `covers: ["NotesDominoQuery", ...]` frontmatter
   field. Schema + script change. More accurate but more bookkeeping.

Doing #2 if/when more posts hit this pattern.

---

## Scheduling pattern

### Pending queue + daily promotion

Future-dated articles go into `_pending/{zh-TW,en}/` instead of
straight into `src/content/posts/`. A daily cron promotes them on
their release day. Two reasons:

1. **Activity stays distributed across the actual publish days.**
   Drafting bursts no longer collapse onto a single day with no
   commits landing on the days articles actually go live. Each
   article generates a "stage" commit on the day it was written
   plus a "promote" commit (plus a coverage-refresh commit) on
   the day it goes live.
2. **One canonical "is this published?" check** — Astro only sees
   files in `src/content/posts/`, so promotion = publishing. No need
   for the future-pubDate filter to do double duty as a hide-from-
   site mechanism for staged work.

**Author flow** for a future-dated article:

```
1. Write file to _pending/{zh-TW,en}/YYYY-MM-DD-slug.md
   (filename's YYYY-MM-DD is the intended release date)
2. git commit + git push       ← "stage" commit, draft day
3. Wait — `publish-pending.yml` cron fires at 23:30 UTC daily
   = 07:30 Taipei, picks up files whose filename date <= today,
   git-mv's them into src/content/posts/{zh-TW,en}/, commits,
   pushes, then refreshes docs/coverage.md as a second commit.
   ← "promote" + "coverage" commits, release day
4. The promote push triggers deploy.yml automatically.
```

**Manual trigger** (e.g. to publish today's piece without waiting):
`gh workflow run publish-pending.yml --ref main`.

**Past- or today-dated articles** (salvage scenarios, urgent
publishing) can still go straight to `src/content/posts/` + manual
`deploy.yml` trigger — the cron isn't required for those.

### Existing reveal infrastructure (still in place)

- `src/lib/posts.ts:34` filters out future-pubDate posts:
  `!data.draft && data.lang === lang && data.pubDate <= new Date()`.
  Still used as a defence-in-depth for any post in `src/content/posts/`
  with a future pubDate, though the pending-queue flow makes this
  rarely needed.
- `src/pages/[...page].astro` and `posts/[...page].astro` use Astro's
  `paginate()` helper. First page is `/` (homepage) and `/posts/`;
  subsequent pages live at `/2/`, `/posts/2/`, etc.
- **Homepage** has the hero (`/covers/welcome.png`) + tagline only on
  page 1. pageSize for homepage: 9. For `/posts/`: currently 6
  (temporary low value to surface the pagination UI; raise back to 12
  once article count makes that obvious).
- **deploy.yml** triggers on every push to main, plus
  `nightly-rebuild.yml` at 23:30 UTC daily as a safety net so a future-
  scheduled post reveals itself even if no other commit lands that day.

### One-time setup for cron attribution

`publish-pending.yml` checks out with a `PAT_FOR_PUBLISH` secret so
the commits are attributed to your account (not `github-actions[bot]`).
To rotate or set up:

1. Settings → Developer settings → Personal access tokens →
   fine-grained, scope = `Contents: read/write` on this repo only
2. Repo Settings → Secrets and variables → Actions → new secret
   `PAT_FOR_PUBLISH` = the token value

---

## Cover-image generation

- **12 visually-disjoint styles** in `scripts/lib/cover-prompt.ts`:
  photoreal-3d, oil-chiaroscuro, watercolor, pencil-sketch, bw-grain,
  paper-craft, low-poly-3d, risograph, minimalist-mono, collage,
  art-deco, ukiyo-e.
- **Sampling without replacement** against a sliding window of ±3
  pubDate neighbours (`RECENT_WINDOW_HALF=3` in `backfill-covers.ts`).
  Guarantees no repeated style within 6 consecutive posts.
- `backfill-covers.ts` handles both new-post fill and `FORCE_REGEN=1`
  full regeneration.
- `generate-article.ts` (the daily AI flow) calls
  `loadRecentCoverStyles(6)` to seed the same exclusion window.

---

## Daily AI generation flow — current status

`scripts/generate-article.ts` runs nightly via `daily-article.yml`.
**It has been failing every day since 2026-05-01** — the model keeps
proposing topics with saturated source URLs and producing inline-link
diversity violations.

**Salvage workflow** — moved to the `domino-news-tech-article` skill
(step 0 entry point). The skill triggers when the user pastes an
"Article validation failed" message or asks to look at `_drafts/`.

**Patching the prompt** (open todo): both saturated-source and
inline-link-diversity failures could likely be reduced with stronger
prompt instructions, but we haven't done it yet.

---

## NotebookLM usage

- Skill location: `~/.claude/skills/notebooklm/`.

### Notebooks by domain — pick the right one for the research topic

| Domain | Notebook URL | Source URL list |
|---|---|---|
| **LotusScript** (class / method / property reference) | `https://notebooklm.google.com/notebook/bb543ae4-7f16-4048-aee2-93d31543543e` | (built-in, V14.0 reference) |
| **Java back-end API** (`lotus.domino.*`) | `https://notebooklm.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b` | [`data/notebook-urls-java.txt`](data/notebook-urls-java.txt) |
| **SSJS / XPages** (JavaScript and XPages reference) | `https://notebooklm.google.com/notebook/0c88f101-7fb7-4ce2-b35e-37a87d3547ec` | [`data/notebook-urls-ssjs.txt`](data/notebook-urls-ssjs.txt) |
| **Domino REST API** (DRAPI on opensource.hcltechsw.com) | `https://notebooklm.google.com/notebook/ba6f849d-c040-4f59-ad51-7fb145065180` | [`data/notebook-urls-rest-api.txt`](data/notebook-urls-rest-api.txt) |
| **Domino Admin** (server config / NRPC / certstore / Security) | `https://notebooklm.google.com/notebook/2e2b3510-0581-443a-9b82-10796613108d` | [`data/notebook-urls-admin.txt`](data/notebook-urls-admin.txt) |
| **Domino IQ general** (overview) | `https://notebooklm.google.com/notebook/71d1e172-...` | (existing) |
| **Domino IQ RAG** (RAG-specific deep dive) | `https://notebooklm.google.com/notebook/79906842-...` | (existing) |

Source provenance for the 4 new notebooks: built 2026-05-19 from the
verified URL lists I researched 2026-05-10 (see commit history of
`data/notebook-sources.md` for the audit trail of how each URL was
discovered and sample-verified).

### Query pattern

- Ask a single thorough question that covers (1) what it is, (2) how
  to instantiate, (3) full method/property list, (4) version notes,
  (5) caveats, (6) a code example. Spend the per-question budget on
  one well-formed question rather than five small ones.
- The bilingual reference notebook (LS) often returns "Missing
  Information" for specific methods because the source files are
  class-level overviews — fall back to WebFetch on the specific HCL
  doc page when this happens. The 4 new notebooks have method-level
  pages, so Missing Information should be rarer.
- Run with `PYTHONIOENCODING=utf-8` on Windows to avoid CP950
  unicode errors.

---

## Open todos

- [x] `scripts/coverage-report.ts` implementation — built 2026-05-07.
- [x] Retrofit `relatedJava` / `relatedSsjs` frontmatter into the
  existing 18 LS-related published posts — done 2026-05-07.
- [ ] Add a declarative `covers:` frontmatter field once the URL-
  inferred coverage is missing too many obvious posts (currently
  4 false negatives — see Coverage tracker / Known limitations).
- [ ] Patch `generate-article.ts` prompt to reduce
  saturated-source / inline-link-diversity failures.
- [ ] Reconsider `/posts/` `pageSize` — currently 6 (set low to
  surface pagination UI for inspection). Bump back to 12 once 30+
  articles published.
- [ ] If Astro/remark adds a `footnoteLabel` per-page setting, replace
  the custom rehype plugin in `astro.config.mjs` with the built-in.

---

## Recent fixes worth remembering

- **Timezone in dateLabel** (`src/pages/{,en/}posts/[slug].astro:31`):
  `toLocaleDateString` needs `timeZone: 'Asia/Taipei'` or it renders
  the day in the build host's UTC, off-by-one for `+08:00` posts
  before 08:00 local.
- **footnote section heading**: GFM hardcodes "Footnotes" — overridden
  per-language by `rehypeLocaliseFootnotes` in `astro.config.mjs`.
- **Cover style clustering**: the original 8-style pool had near-
  neighbours (editorial-flat / isometric-vector / risograph / paper-
  craft all collapsed visually into "flat illustration"). Replaced
  with 12 disjoint styles + sampling without replacement.
