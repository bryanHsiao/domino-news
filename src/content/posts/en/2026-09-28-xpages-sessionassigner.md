---
title: "sessionAsSigner: Running XPages Code as the Signer — Who the Signer Is, and Where It Bites"
description: "XPages gives you three global session objects: session is the current user, sessionAsSigner is the XPage's signer, and sessionAsSignerWithFullAccess is the signer plus full access. Using it to let a user do what their ACL forbids (write a restricted DB, bypass Readers) is handy — but 'who counts as the signer' is decided per design element, so a script library uses its own signer, not the XPage's, and mixed signatures give inconsistent elevation. This covers the three identities, how the signer is determined, and the setConvertMime / full-access traps."
pubDate: 2026-09-28T07:30:00+08:00
lang: en
slug: xpages-sessionassigner
tags:
  - "SSJS"
  - "XPages"
  - "Security"
sources:
  - title: "Global objects and functions (session / sessionAsSigner) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html"
  - title: "sessionAsSigner Oddities – Part 1 — XPages and Me"
    url: "https://xpagesandme.wordpress.com/2015/02/13/sessionassigner-oddities-part-1/"
  - title: "sessionAsSigner & sessionAsSignerWithFullAccess in Java — HCL XPages Forum"
    url: "https://ds_infolib.hcltechsw.com/ldd/xpagesforum.nsf/xpTopicThread.xsp?documentId=4F3973ED6E5B8B338525792E00731534"
relatedJava: []
relatedSsjs: []
---

A user with no write access to a config DB clicks a button on your XPage, and the document saves anyway — because that code ran as `sessionAsSigner`, not as them.

XPages hands you **three global session objects, three identities**. Used right, you let a user do what their ACL forbids; used wrong, it either fails silently or over-grants. And the piece that trips people up most is **who counts as "the signer"** — it's decided per design element, not once for the whole app.

This piece lays out the three identities, how the signer is determined, and the traps that bite.

---

## TL;DR

- **Three global sessions, three identities**: `session` (the current user), `sessionAsSigner` (the XPage's **signer**), `sessionAsSignerWithFullAccess` (the signer **plus full access**).
- **The "signer" is whoever last signed that design element, decided per element**: code running in a `script library` uses *that library's* signer, not the XPage that called it. Mixed signatures → inconsistent elevation. **Fix: sign the whole app with one (admin) ID.**
- **Use it** to let the current user do what their rights forbid — write a restricted DB, get past Readers fields. It's the XPages equivalent of "run as the signer."
- **Traps**: (1) reading MIME rich text via `sessionAsSigner` makes `getMIMEEntity()` return null → call `sessionAsSigner.setConvertMime(false)` first; (2) `sessionAsSignerWithFullAccess` only truly elevates if the server/DB permits full access; (3) don't blanket-elevate — use `session` where you should respect the user's rights.

## Three sessions, three identities

HCL's [Global objects](https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html) defines the three, verbatim:

- **`session`**: "A `lotus.domino.local.Session` object that represents the current Domino session with credentials based on the user." — the **current user's** identity.
- **`sessionAsSigner`**: "…with credentials based on the XPage signer." — the **XPage signer's** identity.
- **`sessionAsSignerWithFullAccess`**: "…with credentials based on the XPage signer with full access." — the signer, **plus full access** (can bypass ACL and Readers, when it's enabled).

All three are the same `Session` class with the same API; the only difference is *whose* rights they carry. So in one block of code you can use `session` to decide "who is the current user," then switch to `sessionAsSigner` for the step that needs more rights.

## Who counts as "the signer"

This is the sharp edge. **The signer isn't "the app owner" — it's "whoever last signed that design element in Designer,"** and it's decided **per element**.

The trap in practice: your XPage is signed by admin, but a `script library` it calls was signed by another developer the last time they saved it. Code in that library running under `sessionAsSigner` carries *that developer's* rights, not the XPage admin's. The result is "the same button elevates sometimes and fails other times" — painful to diagnose.

The fix is simple, and it's a pre-ship step: **re-sign every design element in the app with one (usually admin) ID** so `sessionAsSigner`'s identity is predictable.

## Using it: elevate for one restricted step

The typical shape — the current user lacks rights, but you trust this validated action, so you do it as the signer:

```javascript
// Open a config DB the current user can't write, as the signer
var signerDb = sessionAsSigner.getDatabase("", "config/settings.nsf");
var doc = signerDb.createDocument();
doc.replaceItemValue("Form", "Setting");
doc.replaceItemValue("Value", requestScope.newValue);
doc.save();

// Contrast: session carries the current user, so this step would fail under their rights
```

Decide *whether* to act with `session` (who the user is, what groups they're in); switch to `sessionAsSigner` only for the step that actually needs it — don't run the whole thing as the signer, which treats every user as admin.

## The traps

- **MIME rich text returns null**: reading a rich-text field set to "Store contents as HTML and MIME" via `sessionAsSigner` makes `getMIMEEntity()` **return null unexpectedly** (the same document read via the current-user `session` works). The fix is to turn off auto MIME conversion first:

  ```javascript
  sessionAsSigner.setConvertMime(false);   // before touching MIME via sessionAsSigner
  ```

- **Full access isn't automatic**: for `sessionAsSignerWithFullAccess` to actually bypass ACL/Readers, the server and database must permit full access administration; without it, it won't magically elevate.
- **Don't over-elevate**: `sessionAsSigner` is convenient, but running all your logic through it bypasses the Notes security model. The rule is "decide with `session`, execute the one step that needs it with `sessionAsSigner`."

## What about LotusScript and Java?

- **LotusScript**: there's no `sessionAsSigner` name, but the **concept maps** to an agent running "on behalf of the signer" — an agent runs with the signer's rights by default (unless set to "run as web user"), which is exactly the capability `sessionAsSigner` restores in XPages.
- **Java (inside XPages)**: the same three sessions are available — resolve the `sessionAsSigner` variable via `facesContext` or the Extension Library (see [this HCL XPages forum thread on using sessionAsSigner in Java](https://ds_infolib.hcltechsw.com/ldd/xpagesforum.nsf/xpTopicThread.xsp?documentId=4F3973ED6E5B8B338525792E00731534)); behavior matches SSJS.
