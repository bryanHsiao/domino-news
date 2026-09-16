---
title: "Execution Security Alert: That \"Do You Want to Allow\" Warning Is the ECL Guarding You"
description: "Run an agent, open a mail with a button, click a hotspot — and Notes pops an Execution Security Alert asking whether to allow it. That's not a virus; it's the ECL (execution control list) guarding your workstation. The ECL decides whether a given signer's code may run on your machine and what it can do; a signer not on the list, or one attempting an un-granted action, triggers the alert. This piece covers what the ECL is, why the warning fires, the difference between the workstation ECL and the Administration ECL, its relationship to signing, and how to set it."
pubDate: 2026-09-20T07:30:00+08:00
lang: en
slug: domino-ecl-security-alert
tags:
  - "Notes Client"
  - "Security"
sources:
  - title: "The execution control list — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html"
  - title: "ECL security access options — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_eclsecurityaccessoptions_r.html"
  - title: "Administration ECLs — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_administrationecls_c.html"
relatedJava: []
relatedSsjs: []
---

You run an agent, open a mail with a button, or click a hotspot, and Notes suddenly pops an **Execution Security Alert**: "code signed by so-and-so wants to do X — allow it?" Plenty of people reflexively hit "allow" and move on; others find it maddening. The warning isn't a bad thing — it's the **ECL (Execution Control List)** guarding your workstation. Understand it and you'll know why it fires, whether to allow it, and how to stop it from firing constantly during development.

## TL;DR

- **The ECL decides "whose code may run on your machine, and what it can do"**: the [docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html) — "determines whether the signer of the code is allowed to run the code on a given workstation, and defines the access that the code has to various workstation functions."
- **It guards "active content"**: formulas, scripts, agents, design elements, buttons/hotspots… even viruses and Trojans.
- **Why the warning fires**: the signer isn't in your ECL, or is but attempts an action that isn't enabled → an Execution Security Alert naming the **action, the signer, and the setting that isn't enabled**.
- **Two ECLs**: the Administration ECL (in the Domino Directory, the template) and the workstation ECL (in the user's Contacts, the one that's actually in force).
- **It grants by signer**: sign your agent/database with a **trusted ID** and it stops nagging.

## What the ECL is

The ECL is a **workstation-level** security mechanism. The [docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html) define it in one line:

> "The ECL determines whether the signer of the code is allowed to run the code on a given workstation, and defines the access that the code has to various workstation functions."

Two things: **whether this code's signer may run on your machine**, and **which workstation functions it may touch** (access files, modify the environment, send mail, read other databases…). What it guards is "active content" — the [docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html) list it broadly:

> "Formulas; scripts; agents; design elements in databases and templates; documents with stored forms, actions, buttons, hot spots; as well as malicious code (such as viruses and so-called 'Trojan horses')."

In other words, anything that "runs on your machine" is governed by the ECL — which is the whole point: to stop code from untrusted sources doing as it pleases on your workstation.

## Why the warning fires: the Execution Security Alert

When a piece of active content tries to do something, Notes checks your ECL: **is this signer on the list? is it granted this action?** If either fails, the alert fires. The [docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html):

> an ESA occurs when "the signer is not listed in the ECL, or if the signer of the code is listed but attempts an action that is not enabled."

And it tells you **who, what, and which setting**:

> "The ESA specifies the attempted action, the signer's name, and the ECL setting that is not enabled."

So next time it fires, don't hit "allow" with your eyes closed — read **who signed it and what action it wants**. If it's an internal developer you recognize and trust and the action is reasonable, then consider allowing; if the source is unknown, deny. Among the user's response options is "**start trusting the signer to execute this action**," which adds that signature to your ECL so the same signer doing the same thing won't ask again.

## Two ECLs: template vs what's in force

The [docs](https://help.hcl-software.com/domino/12.0.0/admin/conf_theexecutioncontrollist_t.html) note there are two:

> "The Administration ECL, which resides in the Domino Directory (NAMES.NSF), and the workstation ECL, which is stored in the user's Contacts (NAMES.NSF)."

- **Administration ECL**: lives in the Domino Directory — the **organization's template**. Admins define here "which signers are trusted by default, and for what."
- **Workstation ECL**: lives in each user's Contacts (local names.nsf) — the one **actually in force**. A user's is seeded from the Administration ECL at setup, and every "trust" they click on an alert edits it too.

So to clear an internal signer **org-wide**, an admin edits the [Administration ECL](https://help.hcl-software.com/domino/11.0.1/admin/conf_administrationecls_c.html) and pushes it out — far more reliable than asking every user to click "allow."

## Its relationship to signing (developers feel this most)

The ECL grants **by signer** — so when your agent/database keeps triggering the alert, it's almost always because **the ID that signed it isn't in the user's ECL, or isn't granted that action**. Two routes:

- **Re-sign with a trusted ID**: before deployment, sign agents/design elements with an org-trusted signing ID (e.g. a dedicated app signer) that users' ECLs recognize, and it won't fire.
- **Clear that signer in the Administration ECL**: have an admin add the app signer with the matching access.

The full list of grantable actions (access files, modify the environment, send mail, work with other databases, etc.) is in [ECL security access options](https://help.hcl-software.com/domino/12.0.0/admin/conf_eclsecurityaccessoptions_r.html); note too the special entries `-Default-` (applied to signers not otherwise listed) and `-No Signature-` (unsigned content). To view your own workstation ECL: **File → Security → User Security → What Others Do** (wording varies by version).

## Wrap-up

That "do you want to allow" Execution Security Alert isn't a fault or a virus — it's the **ECL guarding your workstation by signer**: it fires when a signer isn't listed or attempts an un-granted action, and it tells you who and what. On the user side, read it before you trust; on the developer side, **sign with a trusted ID** or have an admin clear the signer in the Administration ECL, and you'll stop being asked.
