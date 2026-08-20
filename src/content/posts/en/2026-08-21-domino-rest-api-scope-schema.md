---
title: "Scopes and Schemas in the Domino REST API: How an NSF Becomes REST Endpoints (Exposing Nothing by Default)"
description: "Putting an NSF on REST isn't flipping a switch that exposes everything. DRAPI is secure-by-default: you write a schema (a whitelist of which forms, views, folders, agents, and fields go out), then create a scope (the REST mapping that activates it). A scope's name is the very name the JWT scopes claim recognizes from the last part — and underneath, Domino's ACL and Readers fields still apply. This piece separates schema from scope. Part three of the DRAPI series."
pubDate: 2026-08-21T07:30:00+08:00
lang: en
slug: domino-rest-api-scope-schema
tags:
  - "Domino REST API"
  - "Security"
sources:
  - title: "Domino REST API — Schema components"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/schemacomponents/index.html"
  - title: "Domino REST API — Using the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API — How-to guides"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/index.html"
cover: "/covers/domino-rest-api-scope-schema.webp"
coverStyle: "collage"
---

[Part one](/domino-news/en/posts/domino-rest-api-getting-started) said "an NSF isn't automatically exposed as REST," and [part two](/domino-news/en/posts/domino-rest-api-auth)'s JWT carried a `scopes` claim. This part joins the two: how an NSF that only the Notes client could see actually **becomes** a set of REST endpoints — the answer is two things, a **schema** and a **scope**.

The concept to fix first: DRAPI is **secure-by-default**. Install it, log in for a token, and you still **can't** reach the data in an NSF. Nothing is open until you explicitly put things on a **whitelist**.

---

## TL;DR

- **A schema is a whitelist:** a definition of which forms, views, folders, agents, and fields of an NSF are exposed, described in JSON (stored in the database's design resources), edited in the Admin UI (the Schema and Scope Management UI) and exportable as a JSON file.
- **A scope is the activation:** the docs say it in one line — "Activate the schema by creating a scope (Rest mapping)." A scope **activates** a schema into a callable REST mapping.
- **A scope has a name,** and that name is the one the last part's JWT `scopes` claim recognizes — [the two are two ends of the same thing](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html).
- **Domino's own security still applies underneath:** a scope's job is to "specify and limit the resources an API can access… based on the authenticated user's requirements and database access control" — the ACL and Readers fields still count.
- **The flow:** create a schema → tick which forms/views/folders/agents/fields to expose → create a scope to activate → test with curl/Postman.

---

## Schema: deciding "what goes out"

An NSF holds dozens of forms, hundreds of views, a pile of agents. You don't want them all exposed indiscriminately to the internet. A [schema](https://opensource.hcltechsw.com/Domino-rest-api/references/schemacomponents/index.html) is that **whitelist** — the docs frame schema components as "essential for developers to configure and customize the API exposure of Domino applications," i.e. "what of this app is exposed through the API."

A schema can selectively expose these components:

- **forms** — which forms' documents can be read/written through the API.
- **views / folders** — which views and folders can be queried and listed.
- **agents** — which agents the API can trigger.
- **document items (fields)** — within a document, which fields go out, and under what names.

A schema is itself JSON (stored in the database's design resources). You tick and edit it in the Admin UI (the Schema and Scope Management UI), and you can "Export database schema as JSON file" to carry it around and put it under version control. That's genuinely useful for DevOps — your API's exposure surface is itself a file you can review and diff.

## Scope: activating a schema into a REST mapping

A schema alone isn't callable — it's just the blueprint. To make it into reachable endpoints, you create a **scope**. The docs' sharpest line:

> Activate the schema by creating a scope (Rest mapping).

A scope is the layer that **attaches a REST mapping** to a schema and brings it to life. And a scope has a **name** — here's where the last part connects: your JWT's `scopes` claim (say `MAIL $DATA`, or a database alias) recognizes exactly these scope names. (`$DATA` is a wildcard meaning "any application the user can access," so a token needn't list every scope name individually.) **The schema decides "what shape is exposed," the scope decides "what this door is called and who it opens for," and the JWT scopes claim decides "which keys you're holding."**

And a scope doesn't reinvent security wholesale. The docs say a scope is meant to "specify and limit the resources an API can access to ensure secure and tailored permissions based on the authenticated user's requirements and **database access control**" — note that last clause: **Domino's ACL and Readers fields still count underneath.** DRAPI's scope is a layer **on top of** the existing Domino security model, not a replacement. What a user sees over REST is still bounded by their ACL / Readers rights in that NSF.

## Exposing an NSF: the flow

The official [how-to](https://opensource.hcltechsw.com/Domino-rest-api/howto/index.html) breaks "Enable a database" into steps that string together as:

1. **Create a schema:** make a schema configuration for the target NSF (in the Admin UI, or edit the schema JSON directly).
2. **Tick the components to expose:** choose which forms, views, folders, agents, and fields go out. What you don't tick, the outside can't touch.
3. **Create a scope to activate:** make a scope (REST mapping) for that schema and give it a name.
4. **Test:** with curl / Postman, carrying a token whose scopes include that name, try a call.

After those four steps the NSF has a controlled set of REST endpoints; how much it exposes, under what names, and who gets in are all written in those two artifacts — the schema and the scope.

## The three layers together

Stack the first three parts and whether a REST request gets data is decided by three layers at once:

- **Domino ACL / Readers** (the bottom, there all along) — what your identity could see in this NSF anyway.
- **schema** (DRAPI) — which components and fields of this NSF are "designed to go out."
- **scope + JWT scopes claim** (DRAPI) — which scope keys your token carries.

Any one layer that says no, and you get nothing. The next part reaches the real **document CRUD** — once all this is open, how you create, read, update, and delete a document in JSON.
