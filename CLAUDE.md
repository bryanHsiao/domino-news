# Domino News — Project Conventions for Claude

This file pins down the editorial voice, infrastructure patterns, and
open decisions for this site so we don't re-derive them each session.
Update it whenever a convention solidifies or a decision is made.

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

## Coverage tracker (planned, not yet built)

- **Source data**: OpenNTF/ls-classmap's `ls_classes.json`. Located in
  the repo at `src/main/resources/WebContent/data/ls_classes.json`,
  develop branch. 97 classes, each with `docUrl` and full
  property/method/event lists. Apache 2.0 license.
- **Cache locally** to `data/ls_classes.json` in this repo, refresh
  manually when OpenNTF publishes a new version.
- **`scripts/coverage-report.ts`** (TODO): scans `posts/{en,zh-TW}/*.md`
  for inline links and frontmatter `sources` matching each class's
  `docUrl`; emits `docs/coverage.md` listing covered vs uncovered
  classes.
- **Cross-language matrix**: same script also reads `relatedJava` /
  `relatedSsjs` from frontmatter, builds a parallel coverage map for
  those languages so we can see at a glance which Java / SSJS class
  has been "linked from an LS post but not yet written about."

---

## Scheduling pattern

- `src/lib/posts.ts:34` filters out future-pubDate posts:
  `!data.draft && data.lang === lang && data.pubDate <= new Date()`.
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

**Manual salvage workflow** (this is what we keep doing):

1. After a failed run, inspect `_drafts/YYYY-MM-DD-attempt{1,2}-*.md`.
2. Decide if any attempt is worth saving:
   - Saturated source + topic overlap with a recent post → discard.
   - Inline-link diversity only → usually salvageable.
3. Salvage flow for saving:
   - WebFetch the cited HCL doc URLs to confirm content matches.
   - NotebookLM cross-check via the
     "HCL Domino LotusScript Reference (V14.0)" notebook — `ask_question`
     with a thorough prompt covering the class hierarchy, methods,
     properties, and gotchas. The notebook usually returns "Missing
     Information" for individual method syntax pages because the source
     is mostly class-level overviews; supplement with WebFetch on the
     specific method/property pages.
   - Rewrite for inline-link diversity (3 URLs × 2 langs).
   - Move to `src/content/posts/{lang}/`.
   - Run `npm run build` to validate.
   - `git push` then trigger `backfill-covers.yml` for the cover.
   - Clean unused `_drafts/` in the same commit.

**Patching the prompt** (open todo): both saturated-source and
inline-link-diversity failures could likely be reduced with stronger
prompt instructions, but we haven't done it yet.

---

## NotebookLM usage

- Skill location: `~/.claude/skills/notebooklm/`.
- The notebook used for fact-checking LS articles is **"HCL Domino
  LotusScript Reference (V14.0)"** — its URL:
  `https://notebooklm.google.com/notebook/bb543ae4-7f16-4048-aee2-93d31543543e`
- Other notebooks used:
  - Domino IQ general (`71d1e172-...`) for Domino IQ overview
  - Domino IQ RAG (`79906842-...`) for the RAG-specific deep dive
- Pattern: ask a single thorough question that covers (1) what it is,
  (2) how to instantiate, (3) full method/property list, (4) version
  notes, (5) caveats, (6) a code example. The bilingual reference notebook
  often returns "Missing Information" for specific methods because the
  source files are class-level overviews — fall back to WebFetch on
  the specific HCL doc page when this happens.
- Run with `PYTHONIOENCODING=utf-8` on Windows to avoid CP950
  unicode errors.

---

## Open todos

- [ ] `scripts/coverage-report.ts` implementation (read OpenNTF
  `ls_classes.json` + scan posts → emit `docs/coverage.md`).
- [ ] Retrofit `relatedJava` / `relatedSsjs` frontmatter into the
  existing 17 LS-related published posts.
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
