---
title: "Domino REST API 1.1.8: A Few Behavior Changes That Bite, Plus CalDAV/CardDAV Arriving (Experimental)"
description: "DRAPI 1.1.8 (2026-09-14) is out. Beyond new endpoints and features, it slips in a few behavior changes worth knowing first — richTextAs now defaults to HTML output, POST v1/query/qrp/json now requires a forms array, GET pim-v1/calendar/profile was renamed to calendarprofile, and calendar entry create/update now require date/timezone/duration. New on the feature side: PIM endpoints for mail attachment lists and calendar profiles, experimental CalDAV/CardDAV/DXL Extension APIs (off by default), PIM reading mail from a cluster member when the primary is down, and fixes for Keycloak/OIDC key rotation. Here's what matters."
pubDate: 2026-09-23T07:30:00+08:00
lang: en
slug: domino-rest-api-v1-1-8-release
tags:
  - "Domino REST API"
  - "Release Notes"
sources:
  - title: "What's new in Domino REST API v1.1.8 — HCL (official)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html"
  - title: "Domino REST API docs home — HCL (official)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/"
  - title: "What's new in Domino REST API v1.1.7 (previous release) — HCL (official)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
relatedJava: []
relatedSsjs: []
---

[Domino REST API (DRAPI) 1.1.8](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html) shipped on 2026-09-14. There's plenty new, but the items to read first are the **behavior changes that affect existing integrations** — miss them before you upgrade and a call that used to work can come back different, or break outright. This piece pulls out the ones that bite first, then covers the new endpoints, the experimental features, and the fixes.

## TL;DR

- **Read the behavior changes first (they can break existing integrations)**: `richTextAs` now defaults to HTML output; `POST v1/query/qrp/json` now **requires** a `forms` array; `GET pim-v1/calendar/profile` was **renamed** to `calendarprofile`; calendar entry create/update now **require** date, timezone, and duration.
- **New endpoints**: `GET pim-v1/attachmentnames/{unid}` (attachment lists from mail documents), `POST`/`PATCH pim-v1/calendarprofile` (create/update a calendar profile).
- **Experimental arrivals**: **CalDAV, CardDAV, and DXL Extension APIs** (disabled by default).
- **Resilience**: PIM APIs can read a user's mail from a **cluster member** when the primary is unavailable.
- **Fixes**: functional issues across all PIM calendar endpoints; **Keycloak/OIDC key rotation** resolved.

## First: the behavior changes that bite

Before upgrading, check whether your code hits any of these four:

- **`richTextAs` now defaults to HTML**: this query parameter now **outputs HTML by default**. If you relied on the previous default format when the parameter was omitted, rich-text responses change after the upgrade — specify the format explicitly wherever you leaned on the default.
- **`POST v1/query/qrp/json` now requires `forms`**: the `forms` array is now a **mandatory** property. Old calls without `forms` will fail — this is the one most likely to break existing QRP (Query Results Processor) JSON queries.
- **`GET pim-v1/calendar/profile` renamed to `GET pim-v1/calendarprofile`**: the endpoint path changed; calls to the old path need updating.
- **Calendar entries now require date/timezone/duration**: creating or updating a calendar entry now **must** specify date, timezone, and duration. Leave them out and it's rejected — timezone handling in this release also moved to the Windows Time Zone Index.

None of these are new features — they're **changes to existing behavior**, and they belong at the top of the upgrade checklist.

## New endpoints and features

- **`GET pim-v1/attachmentnames/{unid}`**: retrieves the attachment list from a mail document, with support for protocol URLs, metadata, and embedded-file discovery.
- **`POST`/`PATCH pim-v1/calendarprofile`**: create/update the authenticated user's calendar profile; `PATCH` updates individual settings.
- **CalDAV/CardDAV/DXL Extension APIs (experimental, off by default)**: this release introduces the three as **experimental** — CalDAV/CardDAV are the standards-based calendar/contacts protocols, DXL Extension goes through Domino's DXL. Disabled by default; enable to try them, and mind the "experimental" status before production use.
- **`GET v1/lists/{name}` gains `computeTotalCount`** (defaults to `true`): control whether the total count is computed; the `key` parameter and `scope=documents` for categorized views also improved.
- Also: `GET v1/info` now returns the server's canonical name; `nsfPath` is standardized to forward slashes cross-platform; form-field retrieval is faster; `GET setup-v1/dxl` is more reliable by skipping corrupted/restricted elements; `POST v1/query` handles soft-deleted documents in view indexes better.

## Resilience and Admin UI

- **PIM mail reads support cluster failover**: PIM APIs can fetch from a **cluster member** when the user's primary mail is unavailable — a practical high-availability improvement for mail integrations.
- **Admin UI**: a **Light/Dark/System theme switcher** on the login page and navigation; a **Diff View** in Schema Management (saved vs. in-progress edits); a **Consents Management** card on the Overview page; a confirmation dialog for unsaved form-schema changes; and better console visibility for ERROR/FATAL messages.

## Fixes

- **Functional issues across all PIM calendar endpoints** are resolved.
- **Key rotation for Keycloak and OIDC providers is fixed** — if you front DRAPI with Keycloak/OIDC for authentication, this one's worth noting (we hit related auth details in [the OIDC piece on DRAPI only trusting the JVM truststore](/domino-news/en/posts/drapi-keycloak-oidc)).

## Wrap-up

The story of DRAPI 1.1.8 isn't "what's new" so much as **"what changed"**: `richTextAs` defaulting to HTML, `qrp/json` requiring `forms`, the calendar-profile endpoint rename, and calendar entries needing full time fields — those four are the must-scan-before-upgrading list. On the new side, the **experimental CalDAV/CardDAV/DXL APIs** are the headline (standards-based protocols arriving, though off by default and still experimental). For what the previous release brought, see [DRAPI 1.1.7](/domino-news/en/posts/domino-rest-api-v1-1-7-release).
