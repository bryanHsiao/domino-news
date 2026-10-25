---
title: "Policy Documents: Pushing Settings to Every Notes Client From One Place — Organizational vs Explicit, the Effective Policy, and How to Apply's Four Modes"
description: "To apply one setting — a password rule, a mail quota, a desktop feature toggle, an ECL — to every Notes user at once instead of machine by machine, you use a policy. This piece explains how Domino policies work: the two assignment types (organizational policies apply automatically based on the OU used at registration; explicit policies are assigned by hand to individuals or groups); the policy settings document types (registration / desktop / mail / security / archive, plus the deprecated setup that merged into desktop); what the effective policy is — the settings a user actually gets, dynamically computed at execution time from OU-level, explicit (including groups), and inherited parent-policy values; the crucial How to Apply modes (Don't set value / Set initial value / Set value whenever modified / Set value and prevent changes = locked), which decide whether users can change a value; and how an exception policy lets specific users override otherwise-mandatory settings."
pubDate: 2026-10-25T07:30:00+08:00
lang: en
slug: domino-policies
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Policies (a policy is a collection of policy settings, the settings document types registration/desktop/mail/security/archive, the effective policy is dynamically calculated, How to Apply) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_policies_c.html"
  - title: "Organizational and explicit policies (organizational applies automatically by OU, explicit is assigned manually to individuals/groups, assignment methods) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/conf_organizationalandexplicitpolicies_c.html"
  - title: "Understanding the desktop policy settings document (when desktop settings are enforced, the How to Apply modes: do not change / set initial value / set whenever modified / set and prevent changes) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_understandingthedesktoppolicysettingsdocument_c.html"
relatedJava: []
relatedSsjs: []
---

To apply one setting — a password rule, a mail quota, a desktop feature toggle, an administration ECL — to **every** Notes user at once, rather than setting each machine, you use a **policy**. But a policy is more than "set it once, it applies everywhere": it has two assignment types, several settings documents, a rule for which value a user actually gets, and one switch that decides whether users can change it back. This piece lays it out.

---

## TL;DR

- **What a policy is**: HCL calls it "a document that identifies a collection of individual policy settings" — a document that gathers several **policy settings documents** and assigns them to users or groups, applying automatically.
- **Two assignment types**: an **organizational policy** applies **automatically** to all users registered under an **OU** (via the certifier ID used at registration); an **explicit policy** is assigned **by hand** to individuals or groups (during registration, in the Person document, or with the Assign Policy tool).
- **Settings document types**: **registration** (new-user defaults), **desktop** (workspace/desktop features), **mail** (mail, calendar), **security** (Notes/Internet passwords, password policies, key rollover, administration ECLs, pushing trusted cross-certificates, ID vault), **archive**, and more; **setup is deprecated**, merged into **desktop**.
- **The effective policy**: the settings a user **actually gets** — "dynamically calculated at the time the policy is executed" from **OU-level values, explicit (including the user's groups), and values inherited from a parent policy**.
- **How to Apply (the key)**: each field on each settings document has this, deciding how it's applied and whether users can change it. Four modes: **Don't set value / Set initial value / Set value whenever modified / Set value and prevent changes (= locked)**.
- **Exception policy**: lists only the settings that are **not** enforced, letting specific users **override** otherwise-mandatory values.

## Organizational vs explicit: two ways to assign

Both are policies; the difference is how they reach a user ([official: organizational and explicit policies](https://help.hcl-software.com/domino/10.0.1/conf_organizationalandexplicitpolicies_c.html)):

- **Organizational policy**: applied **automatically by org structure**. A user registered under an OU (using that OU's certifier ID) **automatically** inherits the matching organizational policy — no per-user assignment. Good for "everyone under /Sales/ACME gets this set."
- **Explicit policy**: assigned **by hand** to individuals or groups. Several ways: during registration, in the **Person document**, with the **Assign Policy** tool, or on the policy's Policy Assignment tab. Good for "these few people / this group get a special set."

Both can apply at once — a person might have an OU's organizational policy *and* an assigned explicit policy. What they actually get is the **effective policy** below.

## Settings documents: where the actual settings live

A policy is just the "container"; the real values live in the various **policy settings documents** ([official policies overview](https://help.hcl-software.com/domino/11.0.1/admin/conf_policies_c.html)):

- **registration**: defaults for new-user registration (password, Internet address format, roaming, mail).
- **desktop**: the user's workspace and desktop features (Widgets, Live Text, calendar).
- **mail**: the client's mail, calendar, and scheduling settings.
- **security**: administration ECLs, Notes/Internet password management and synchronization, password policies, key rollover, pushing trusted cross-certificates, **ID vault** — nearly everything security-related is here.
- **archive**: where archiving runs and its criteria.
- plus connections, traveler, roaming.

A version note: **the setup policy is deprecated** — HCL explicitly says "Do not use the Setup Policy Settings document. Use a Desktop Policy Settings document." — its settings moved into the **desktop** document. Don't use setup.

## The effective policy: what the user actually gets

When a person has settings from an OU's automatic policy, an assigned explicit policy, and inheritance from a parent, which ones **actually take effect**? That's the **effective policy** — HCL defines it as "a set of derived policy settings that are **dynamically calculated at the time the policy is executed**."

The key phrase is **dynamically calculated**: the effective policy isn't a fixed document but the **resolved** result, at execution time, of those sources — OU-level values, explicit policy values (**including those from groups the user belongs to**), and values **inherited from a parent policy**. So change a parent policy, or add someone to a group that has an explicit policy, and their effective policy is **recomputed**.

## How to Apply: can the user change it back?

This is the most important — and most overlooked — part: setting a value doesn't mean users can't change it back. The **How to Apply** setting on each field decides the strength ([official: desktop policy settings document](https://help.hcl-software.com/domino/14.5.0/admin/conf_understandingthedesktoppolicysettingsdocument_c.html)). Four modes:

- **Don't set value**: the policy specifies **no value** and leaves it to the **user to set**. (Note: not "keep the user's current value" — it means the policy declines to set this field.)
- **Set initial value**: sets a default **once**, and the **user can change it** afterward.
- **Set value whenever modified**: pushes the value whenever the policy's value changes, overwriting the user's, but the user can still adjust it between pushes.
- **Set value and prevent changes**: **locked** — the user can't change it. This is true enforcement.

So "I set a quota / password rule but users can change it" usually isn't a missing setting — it's that How to Apply is "set initial value" rather than "set and prevent changes." To enforce, lock it.

## Exception policy: letting specific users opt out

Since you can lock things down, you need a way to make exceptions. An **exception policy** does that — it **lists only the settings that are NOT enforced** (it isn't a third policy type: the policy type is still explicit or organizational, and exception is an option enabled on the policy document's **Administration tab**). HCL's wording: when you create an exception policy, you specify only the settings that will not be enforced. Users it covers can then **override** those otherwise-mandatory values, with everything else unchanged. Good for "lock the whole company, but these few need one setting relaxed."

## Wrap-up

- **Policy** = a container of policy settings documents, assigned to users/groups, applied automatically.
- **Two assignments**: organizational (automatic by OU) vs explicit (assigned by hand to individuals/groups).
- **Settings documents**: registration / desktop / mail / security (passwords/ECL/ID vault) / archive…; setup merged into desktop.
- **Effective policy**: what a user actually gets, **dynamically computed** at execution time from OU + explicit (incl. groups) + parent inheritance.
- **How to Apply**: Don't set value / Set initial value / Set value whenever modified / **Set value and prevent changes (locked)** — decides whether users can change it.
- **Exception policy**: lists only the non-enforced settings, letting specific users override.
