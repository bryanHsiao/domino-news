---
title: "Who Does Your Agent Run As? Signer, Effective User, and the Error 201 / Readers-Field Traps"
description: "Your agent works perfectly when you run it — because you're the admin who signed it. Deploy it as a web agent, or schedule it signed by a service ID, and it fails with Error 201 or silently sees no documents. The cause is identity: a Domino agent runs as someone, and that someone isn't always you. A field report on the signer vs the effective user, how session.EffectiveUserName flips on 'run as web user', the runtime security level behind Error 201, and the Readers-field trap that makes documents vanish."
pubDate: 2026-08-03T07:30:00+08:00
lang: en
slug: agent-run-as-identity
tags:
  - "LotusScript"
  - "Security"
sources:
  - title: "EffectiveUserName (NotesSession, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html"
  - title: "NotesAgent (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html"
  - title: "Security for agents on servers and the Web — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/h_setup_agent_security_steps.html"
relatedJava: ["Session", "Agent"]
relatedSsjs: ["session"]
---

Your agent works flawlessly. You run it from your workstation, it walks the view, updates the documents, done. Then you deploy it — as a web agent, or a scheduled agent signed by a service account — and it breaks. `Error 201: Operation is disallowed in this session`, or worse: it runs without error but silently processes zero documents. Nothing in the code changed. What changed is *who the agent is running as*.

A Domino agent always runs under some identity, and it is not always the developer sitting at the keyboard. This is a field report on the two identities that matter — the signer and the effective user — how [`session.EffectiveUserName`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EFFECTIVEUSERNAME_PROPERTY.html) tells you which one is in force, and the two traps (Error 201 and Readers fields) that catch this most often.

---

## TL;DR

- Two identities. The **signer** is "the person who last modified and saved an agent" (`NotesAgent.CommonOwner` / `Owner`) — by default the agent runs with the signer's rights. The **effective user** is "the user under whose identity the agent runs" (`NotesAgent.OnBehalfOf`).
- `session.EffectiveUserName` returns whichever is in force. Verbatim: "For an agent, selecting 'run as web user' will make this property use the identity of the logged in web user. If 'run as web user' is not selected, this property will use the identity of the agent signer."
- **Error 201** is a *runtime security level* problem: at level 1 (the default) an agent can't run restricted operations. Fix it on the Security tab, and re-sign with an ID that's allowed to run restricted agents on that server.
- **The Readers-field trap**: with "run as web user" or "run on behalf of", the effective user must be in a document's Readers field or the agent can't see that document — your code, their access.
- `agent.RunOnServer` runs the agent on the server from code; its `Print` output goes to `log.nsf` (Events), not the client.

## Signer vs effective user

Every agent carries a signature — whoever last saved it in Designer becomes the signer, exposed as [`NotesAgent`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESAGENT_CLASS.html)`.CommonOwner` ("the name of the person who last modified and saved an agent"). By default the agent's code runs with *that person's* rights on the server. That's why it "works for you": you signed it, and you're an admin.

The effective user is who the agent is acting *on behalf of*, exposed as `NotesAgent.OnBehalfOf` and, at runtime, as `session.EffectiveUserName`. For a scheduled or client agent with no override, the effective user is the signer. But two settings change that, and they're the whole game.

## The Security-tab knobs

On the agent's [Security tab](https://help.hcl-software.com/dom_designer/11.0.1/basic/h_setup_agent_security_steps.html):

- **Run on behalf of** — the code runs on the authority of a specified user, not the signer. `EffectiveUserName` becomes that user.
- **Run as web user** (web agents) — the code runs as the authenticated web user. Per the docs, this makes `EffectiveUserName` "use the identity of the logged in web user."
- **Runtime security level** — 1 (default) allows no restricted operations; higher levels allow restricted (and full-admin) operations.

One rule ties them together and surprises everyone: **the signer's authority is checked first.** Even with "run as web user" on, the agent won't run on the server unless it's signed by an ID allowed to run restricted agents there, and "run on behalf of" requires the signer to have permission to run on behalf of others. So there are two gates: *can this run at all* (signer's server rights) and *whose access does the code see* (the effective user).

## Trap 1: Error 201

`Error 201: Operation is disallowed in this session` is the runtime-security-level gate. At level 1 — the default when nobody set it — restricted operations (reading the file system, running other programs, some admin calls) are blocked. Your desktop run didn't hit it because a client agent runs unrestricted for you; the server run does, because the level is 1 and/or the signer isn't cleared for restricted agents. The fix is two-part: raise the runtime security level on the Security tab to allow restricted operations, *and* make sure the agent is signed by an ID the server trusts to run restricted agents (the server's "Run restricted/unrestricted LotusScript/Java agents" fields in the server document). Raising the level without a trusted signature just moves the failure.

## Trap 2: Readers fields make documents vanish

This is the subtle one. Turn on "run as web user" (or "run on behalf of") and the agent now sees the database through the *effective user's* eyes — including [Readers fields](/domino-news/en/posts/readers-authors-fields). If a document has a Readers field that doesn't list the effective user, the agent cannot see that document at all: `db.Search`, view loops, `GetDocumentByKey` all skip it, no error. So an agent that processed 400 documents when you ran it (you're in every Readers field, or an admin) processes 3 when it runs as a web user who's only a reader of their own records. The agent isn't broken; it's correctly enforcing read access for the identity it's running as. The fix is a design decision, not a code one: include the roles or groups your agents run as in the Readers fields, or run the agent as a signer/identity that's meant to see everything.

## RunOnServer, and knowing your identity

`agent.RunOnServer` "runs the agent on the computer containing the database" — the way you kick a server-side agent from other code. A useful side effect for debugging: an agent run this way sends its `Print` output to `log.nsf`'s Events, not to the client, so that's where you look for its trail.

The habit that prevents all of the above: early in any agent that will run somewhere other than your desk, log `session.EffectiveUserName`. One line tells you whether the agent is running as you, as a service ID, or as a web user — and that single fact explains almost every "works here, breaks there" agent bug.

## What about Java and SSJS?

The model is shared, and the vocabulary is worth carrying across. Java agents run under the exact same signer/effective-user security, and `lotus.domino.Session.getEffectiveUserName()` is the same property. XPages / SSJS makes the choice explicit rather than a checkbox: `session` runs as the current user, while `sessionAsSigner` runs with the signer's rights and `sessionAsSignerWithFullAccess` runs with full administrative access — the same "whose rights does this code use" decision, surfaced as three different session objects instead of one agent setting. Wherever you are, the question to answer before you ship is the same: *whose access is this code seeing, and is that what I intended?*
