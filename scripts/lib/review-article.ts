/**
 * Cross-vendor article review.
 *
 * Sends the EN markdown of a generated article to Claude (Anthropic) and asks
 * it to identify factual errors, missing alternatives, and misleading claims.
 *
 * Returns a list of issues with severity. The caller decides what to do
 * (typically fail on `critical`, log otherwise).
 *
 * Required env (only when called): ANTHROPIC_API_KEY
 * Optional env: ANTHROPIC_MODEL (default claude-sonnet-4-6)
 */

import Anthropic from '@anthropic-ai/sdk';

export type Severity = 'critical' | 'major' | 'minor';

export interface ReviewIssue {
  severity: Severity;
  location: string;
  problem: string;
  suggestion: string;
}

export interface ReviewResult {
  issues: ReviewIssue[];
  rawText: string;
}

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

function buildPrompt(title: string, markdown: string, sources: string[]): string {
  return `You are a senior editor for a HCL Domino news site. Review the article
below for technical accuracy. Be strict: this article is going to be published.

Look specifically for:
1. **Factual errors** — wrong API names, made-up version numbers, incorrect
   claims about how features work, mis-attributed quotes.
2. **Missing important alternatives** — when the article says "there are N
   ways to X", check whether the list is actually complete. Notes/Domino has
   well-known alternatives (e.g. for retrieving documents: View lookups,
   NotesDatabase.Search with @Formula, NotesDatabase.FTSearch, DQL).
3. **Misleading or oversimplified statements** — claims that are technically
   true only in narrow conditions, presented as universal.
4. **Broken-looking citations** — URLs whose path structure looks fabricated
   (we will check liveness separately, but flag suspicious ones).

Severity:
- "critical" = clearly wrong fact, fake API, fake version. Article must NOT publish.
- "major"    = important missing context or misleading framing that a reader
               would be misled by. Should be fixed but not blocking.
- "minor"    = clarity / phrasing / style.

Return STRICT JSON only — no markdown fences, no commentary. Schema:

{
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "location": "short quote or section header pointing to the problem",
      "problem": "specific, concrete description of what's wrong",
      "suggestion": "how to fix it"
    }
  ]
}

If you find no issues, return {"issues": []}.

---

Article title: ${title}

Cited sources (URLs):
${sources.map((s) => `  - ${s}`).join('\n')}

Article body (markdown):
---
${markdown}
---`;
}

export async function reviewArticle(
  title: string,
  markdown: string,
  sources: string[]
): Promise<ReviewResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY env var is required for AI review.');
  }
  const client = new Anthropic();
  const prompt = buildPrompt(title, markdown, sources);

  console.log(`[review] Calling ${MODEL} for fact-check...`);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = block && block.type === 'text' ? block.text : '';
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

  let parsed: { issues?: ReviewIssue[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[review] Failed to parse review JSON. Raw:\n', text);
    throw err;
  }

  return { issues: parsed.issues ?? [], rawText: text };
}
