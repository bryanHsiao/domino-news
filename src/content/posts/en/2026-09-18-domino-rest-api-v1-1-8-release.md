---
title: "Domino REST API 1.1.8 Released: Experimental CalDAV/CardDAV, New PIM Endpoints, and Cluster Failover"
description: "DRAPI 1.1.8 (2026-09-14) is out. This release brings experimental CalDAV/CardDAV/DXL Extension APIs (off by default), new PIM endpoints for mail attachment lists and calendar profiles, PIM reading mail from a cluster member when the primary is down, and fixes for Keycloak/OIDC key rotation. A few behavior changes are worth noting before you upgrade too — richTextAs defaulting to HTML, qrp/json requiring forms, the calendar-profile rename, and calendar entries needing date/timezone/duration — covered in the body."
pubDate: 2026-09-18T01:00:00+08:00
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
cover: "/covers/domino-rest-api-v1-1-8-release.webp"
coverStyle: "low-poly-3d"
---

[Domino REST API (DRAPI) 1.1.8](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html) shipped on 2026-09-14. There's plenty new here — the headline is the **experimental arrival of CalDAV/CardDAV**, alongside a couple of new PIM endpoints and a handy cluster failover. There are also a few **behavior changes** worth watching before you upgrade; this piece covers those in a section further down.

## TL;DR

- **Experimental arrivals**: **CalDAV, CardDAV, and DXL Extension APIs** (disabled by default).
- **New endpoints**: `GET pim-v1/attachmentnames/{unid}` (attachment lists from mail documents), `POST`/`PATCH pim-v1/calendarprofile` (create/update a calendar profile).
- **Resilience**: PIM APIs can read a user's mail from a **cluster member** when the primary is unavailable.
- **Fixes**: functional issues across all PIM calendar endpoints; **Keycloak/OIDC key rotation** resolved.
- **Upgrade notes (behavior changes)**: `richTextAs` now defaults to HTML, `POST v1/query/qrp/json` now requires a `forms` array, `GET pim-v1/calendar/profile` was renamed to `calendarprofile`, and calendar entry create/update now require date/timezone/duration — details in the [behavior-changes section](#behavior-changes-to-note-before-upgrading) below.

## Experimental arrivals: CalDAV/CardDAV/DXL Extension APIs

The most notable addition is the three APIs introduced as **experimental** features (disabled by default; enable to try them): **CalDAV/CardDAV** are the standards-based calendar/contacts protocols, and **DXL Extension** goes through Domino's DXL. Mind the "experimental" status before production use — HCL also notes CalDAV/CardDAV have so far been **tested only with Mozilla Thunderbird**, so don't assume every client works.

## Other new endpoints and features

- **`GET pim-v1/attachmentnames/{unid}`**: retrieves the attachment list from a mail document, with support for protocol URLs and embedded-file discovery.
- **`POST`/`PATCH pim-v1/calendarprofile`**: create/update the authenticated user's calendar profile; `PATCH` updates individual settings.
- **`GET v1/lists/{name}` gains `computeTotalCount`** (defaults to `true`): control whether the total count is computed; the `key` parameter and `scope=documents` for categorized views also improved.
- Also: `GET v1/info` now returns the server's canonical name; `nsfPath` is standardized to forward slashes cross-platform; form-field retrieval is faster; `GET setup-v1/dxl` is more reliable by skipping corrupted or inaccessible elements; `POST v1/query` handles soft-deleted documents in view indexes better.

## Resilience and Admin UI

- **PIM mail reads support cluster failover**: PIM APIs can fetch from a **cluster member** when the user's primary mail is unavailable — a practical high-availability improvement for mail integrations.
- **Admin UI**: a **Light/Dark/System theme switcher** on the login page and navigation; a **Diff View** in Schema Management (saved vs. in-progress edits); a **Consents Management** card on the Overview page; a confirmation dialog for unsaved form-schema changes; and better console visibility for ERROR/FATAL messages.

## Behavior changes to note before upgrading

Beyond the new features, this release also changes a few pieces of **existing behavior** — miss them before you upgrade and a call that used to work can come back different, or break outright. The four most worth checking your code against:

- **`richTextAs` now defaults to HTML**: this query parameter now **outputs HTML by default**. If you relied on the previous default format when the parameter was omitted, rich-text responses change after the upgrade — specify the format explicitly wherever you leaned on the default.
- **`POST v1/query/qrp/json` now requires `forms`**: the `forms` array is now a **mandatory** property. Old calls without `forms` will fail — this is the one most likely to break existing QRP (Query Results Processor) JSON queries.
- **`GET pim-v1/calendar/profile` renamed to `GET pim-v1/calendarprofile`**: the endpoint path changed; calls to the old path need updating.
- **Calendar entries now require date/timezone/duration**: creating or updating a calendar entry now **must** specify date, timezone, and duration. Leave them out and it's rejected — timezone handling in this release also moved to the Windows Time Zone Index.

None of these are new features — they're **changes to existing behavior**, so keep them on the upgrade checklist.

## Fixes

- **Functional issues across all PIM calendar endpoints** are resolved.
- **Key rotation for Keycloak and OIDC providers is fixed** — if you front DRAPI with Keycloak/OIDC for authentication, this one's worth noting (we hit related auth details in [the OIDC piece on DRAPI only trusting the JVM truststore](/domino-news/en/posts/drapi-keycloak-oidc)).

## Wrap-up

The story of DRAPI 1.1.8 is **what's new** — above all the **experimental CalDAV/CardDAV/DXL APIs** (standards-based protocols arriving, though off by default and still experimental), plus the PIM attachment-list and calendar-profile endpoints and cluster failover. When you upgrade, scan the four **behavior changes** too (`richTextAs` defaulting to HTML, `qrp/json` requiring `forms`, the calendar-profile rename, and calendar entries needing full time fields). For what the previous release brought, see [DRAPI 1.1.7](/domino-news/en/posts/domino-rest-api-v1-1-7-release).
