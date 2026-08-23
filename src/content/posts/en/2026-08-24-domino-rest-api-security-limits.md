---
title: "The Domino REST API Before Go-Live: the Security Model, One-Way Rich Text, CORS, and Admin Ports"
description: "Series finale. You can authenticate, expose a scope, CRUD, and query; before handing it to real users, a Domino developer must be sure of two things: does it bypass my Readers-field security, and what will bite in production? The answers: DRAPI is layered security (JWT + scope + Domino's own ACL/Readers underneath), so it doesn't leak — but there are real limits (rich text is one-way out, unconfigured fields are unreachable, same-name forms/views are ambiguous), plus CORS and the admin ports to close before going live. Part six (final) of the DRAPI series."
pubDate: 2026-08-24T07:30:00+08:00
lang: en
slug: domino-rest-api-security-limits
tags:
  - "Domino REST API"
  - "Security"
  - "DevOps"
sources:
  - title: "Domino REST API — Security"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/index.html"
  - title: "Domino REST API — Limitations"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/limitation.html"
  - title: "Domino REST API — Troubleshooting"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/troubleshooting.html"
cover: "/covers/domino-rest-api-security-limits.webp"
coverStyle: "oil-chiaroscuro"
---

This is the last part of the DRAPI series. The first five are done: [overview](/domino-news/en/posts/domino-rest-api-getting-started), [authentication](/domino-news/en/posts/domino-rest-api-auth), [scope/schema](/domino-news/en/posts/domino-rest-api-scope-schema), [document CRUD](/domino-news/en/posts/domino-rest-api-document-crud), [DQL querying](/domino-news/en/posts/domino-rest-api-query-dql). It all works — but before handing it to real users, a Domino developer usually has two question marks:

1. **Will it bypass the Readers-field security I carefully set, and leak documents that shouldn't be seen?**
2. **What will bite in production?**

This part answers both.

---

## TL;DR

- **It doesn't leak:** DRAPI is layered security — [JWT](/domino-news/en/posts/domino-rest-api-auth) (the docs say "All Domino REST API access is authorized using a signed JWT claim" and "No anonymous access is granted for REST data"), scope (only admin-configured databases are exposed), and **Domino's own ACL and Readers/Authors fields still count underneath**.
- **secure-by-default:** the docs say plainly "Databases aren't automatically exposed on REST when you run Domino REST API. Only the ones configured by the administrators."
- **Rich text is one-way:** the docs say rich text is translated out to HTML/MIME, but it **doesn't** translate MIME back to rich text.
- **Unconfigured fields are unreachable, and a missing item isn't returned** — the "absent ≠ empty" rule holds on the REST side too.
- **Close before going live:** CORS configuration, and lock down the admin ports (console 8889, metrics 8890, health 8886) — don't leave them exposed alongside the data port 8880.

---

## 1. Will it leak Readers-protected documents?

This is the first question a Domino developer asks of anything that puts an NSF on the web, and the right one. The answer: **no — as long as you don't dismantle the security yourself.** DRAPI's security is **three stacked layers**:

1. **JWT:** the [docs](https://opensource.hcltechsw.com/Domino-rest-api/references/security/index.html) state "All Domino REST API access is authorized using a signed JWT claim," and "No anonymous access is granted for REST data" — no anonymous access, every request carries a signed token.
2. **scope:** the docs say plainly "Databases aren't automatically exposed on REST when you run Domino REST API. Only the ones configured by the administrators" — an unconfigured database is invisible over REST.
3. **Domino's own document-level security:** the key one. Your JWT's `sub` is a Domino name (part two), and DRAPI reads data **as that Domino user** — so that NSF's **ACL and Readers/Authors fields still count**. A user authorized to see only group A of documents gets only group A over REST too — whether via CRUD, `/lists`, or DQL; what a Readers field blocks stays blocked over REST.

In other words, DRAPI doesn't stand up a separate security scheme that bypasses Domino — it **layers on top of** Domino's existing model. That's why part three said "three layers at once": the scope decides whether the door opens, and Domino's ACL/Readers decide what you — this person — actually see behind it.

(The site's [earlier RAG webinar notes](/domino-news/en/posts/openntf-domino-iq-rag-webinar) mentioned a related lesson: Domino IQ's RAG also honors Readers fields — but that only really started working in 2026 FP1. Whether document-level security is being respected is worth verifying in your own environment, not just trusting the docs.)

## 2. The limits that actually bite

It works and it's secure, but a few limits are best known at design time, not discovered after go-live:

- **Rich text is one-way out.** The [docs](https://opensource.hcltechsw.com/Domino-rest-api/references/limitation.html) put it plainly: "The Domino REST API translates Rich Text to HTML/MIME. This is one way. The Domino REST API doesn't translate MIME back to Rich Text." Read a rich text field and you get HTML/MIME; but you **can't** write rich text back the same way. For two-way rich-text editing, this is a hard limit.
- **Only configured fields are reachable:** "Only configured fields can be created, read, or updated." A field not in the schema / KeepConfig is inaccessible over REST even if the document really has it.
- **A missing item isn't returned:** "If an item doesn't exist in a document, it doesn't get returned." So a key absent from the returned JSON may mean "this document has no such field," not "the value is empty" — the same "absent ≠ empty" rule as `getItemValue` on the Java side.
- **Same-name forms/views are ambiguous:** "When you have multiple views with the same name, the Admin UI selects the first one found." With duplicate-named design elements, don't assume it picks the one you meant.

## 3. Ports and CORS to close before going live

- **CORS:** your front end usually runs on another origin, and the browser blocks cross-origin requests. DRAPI's [troubleshooting](https://opensource.hcltechsw.com/Domino-rest-api/references/troubleshooting.html) lists CORS as a common error when reaching the Admin UI or calling the API — get the allowed origins right before launch.
- **Lock the admin ports:** data goes over 8880, but the console (8889), metrics (8890), and health-check (8886) admin/monitoring ports (from part two's functional accounts) shouldn't be exposed openly — firewall them off in production.
- **Other operational regulars:** `Address already in use` at startup (port clash), `OutOfMemoryError` (Java heap), and bad JSON in `keepconfig.d` — all listed on the troubleshooting page, worth knowing before you deploy.

## Series recap: see X, it's usually Y

Six parts in, here are the traps you're most likely to hit, in one table:

| Symptom | Usually |
|---|---|
| A call returns 401 | token expired, or the server restarted and rotated the signing key ([part two](/domino-news/en/posts/domino-rest-api-auth)) |
| You have a token but it's blocked | your scope isn't in the token, or Domino ACL/Readers blocked it ([part three](/domino-news/en/posts/domino-rest-api-scope-schema)) |
| Correct DQL returns nothing | that form is missing a `dql` mode ([part five](/domino-news/en/posts/domino-rest-api-query-dql)) |
| Rich text won't write back | it's a one-way conversion, unsupported by design (this part) |
| The browser front end can't connect | CORS isn't configured (this part) |

DRAPI turns an NSF into a modern, standard, language-agnostic REST API — but it doesn't throw away Domino's security and rules; it **layers on top of** them. Understand these six parts and you can expose an NSF cleanly and safely. End of series.
