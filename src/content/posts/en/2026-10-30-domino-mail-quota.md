---
title: "Domino Mail Quota: What Happens When a Mailbox Is Over Quota"
description: "You set a quota on each mailbox and assume mail stops when it's full? Not necessarily — Domino's default is 'Deliver anyway,' so a quota alone delivers regardless. What actually decides what happens to new mail for a full mailbox is the over-quota enforcement you choose separately. This piece covers the two limits (a hard quota and an optional warning threshold, which you can only set once a quota exists), when the Router compares size (on each delivery), the three enforcement options (Deliver anyway, Non delivery to originator which returns an NDR, and Hold mail and retry which holds mail in MAIL.BOX until space frees and returns it after a default one-day expiration), the Hold-and-retry sub-options (deliver what fits vs hold everything, maximum messages to hold per user), and an easily missed detail: the default size calculation counts white space, so deleting messages doesn't free quota right away — the used-space method is more immediate and recommended with transaction logging."
pubDate: 2026-10-30T07:30:00+08:00
lang: en
slug: domino-mail-quota
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Setting mail file quotas (the hard quota + the optional warning threshold, which needs a quota first) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_settingmailfilequotas_c.html"
  - title: "Setting quota controls for the Router (the three over-quota enforcement options Deliver anyway / Non delivery to originator / Hold mail and retry, sub-options, 1-day expiration, set on Delivery Controls → Quota Controls) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_settingquotacontrolsfortherouter_t.html"
  - title: "Notifying users who exceed a mail file quota or warning threshold (notifications None/per message/per interval, the two size-calculation methods) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_notifyinguserswhoexceedamailfilequotaorwarningt_c.html"
relatedJava: []
relatedSsjs: []
---

You set a quota on each mailbox and assume that once it's full, new mail gets blocked? **Not necessarily.** Domino's default behavior is **"Deliver anyway" — the quota is set, but mail is delivered regardless.** A quota is just a number; what actually decides what happens to new mail once a mailbox is full is the **over-quota enforcement** you choose separately. This piece lays out the quota, the warning threshold, the three enforcement options, and one easily missed detail about how size is calculated.

---

## TL;DR

- **Two limits**: a **quota** (hard limit) and a **warning threshold** (advance notice as the file nears the quota, so users can clean up). You must **set a quota before you can set a threshold**.
- **When it checks**: with enforcement on, the Router compares the destination mailbox's **current size** against the quota/threshold on **each delivery**.
- **Three enforcement options** (Configuration Settings document → Router/SMTP → Restrictions and Controls → **Delivery Controls → Quota Controls**):
  - **`Deliver anyway (don't obey quotas)`**: the **default** — delivers, ignoring the quota.
  - **`Non delivery to originator`**: doesn't deliver; **returns an NDR** to the sender saying the recipient's mailbox is full.
  - **`Hold mail and retry`**: doesn't deliver; **holds the mail in MAIL.BOX** until space frees, then retries; after expiration (default **one day**) it's **returned to the sender**.
- **Hold-and-retry sub-options**: `Attempt delivery of each message` (**on** = deliver what fits, hold the rest; **off** = hold everything until the file shrinks), `Maximum number of messages to hold per user` (beyond it, a failure report goes to the sender of each additional message, FIFO), `Maximum message size to hold`.
- **How size is calculated (easily missed)**: the default method counts **white space**, so **deleting messages doesn't free quota right away**; the "used space" method is more immediate and is recommended with transaction logging (no admin compaction needed).

## Two limits: quota and warning threshold

Quota management has two numbers ([official: setting mail file quotas](https://help.hcl-software.com/domino/12.0.0/admin/conf_settingmailfilequotas_c.html)):

- **Quota**: the **hard limit** on mailbox size.
- **Warning threshold**: an **advance-notice** level that warns the user as the mailbox approaches the quota, so they can clean up before it's actually full and blocked. Note: you **can only set a threshold once a quota exists**.

But setting those two numbers alone does **nothing by default** — because enforcement defaults to "deliver anyway." To make the quota actually bite, you set the enforcement below.

## The three enforcement options

Enforcement is set under **Delivery Controls → Quota Controls** ([official: the Router's quota controls](https://help.hcl-software.com/domino/10.0.1/admin/conf_settingquotacontrolsfortherouter_t.html)). With it on, the Router compares the destination mailbox size on **each delivery** and, if over, acts as you chose:

- **`Deliver anyway (don't obey quotas)` (default)**: **delivers** regardless. So "I set a quota and it still keeps receiving mail" is usually this default, unchanged.
- **`Non delivery to originator`**: **doesn't deliver**, and **returns an NDR** to the sender saying the recipient's mailbox is full. The sender knows it didn't get through.
- **`Hold mail and retry`**: **doesn't deliver, but keeps it** — holds the message in **MAIL.BOX** waiting for the recipient to free space, then retries. This is another source of the held mail [the mail-routing piece](/domino-news/en/posts/domino-mail-routing-mailbox/) describes. When the message **expires** (default **one day**, consistent with the Router's message timeout `MailTimeout`) and still can't be delivered, it's **returned to the sender** as undeliverable.

## Hold-and-retry sub-options

If you pick Hold and retry, a few more settings control it:

- **`Attempt delivery of each message`**: **on** — messages that fit the remaining space are delivered, the rest are held; **off** — **everything** is held until the mailbox shrinks.
- **`Maximum number of messages to hold per user`**: how many may be held in MAIL.BOX per user; **beyond that**, each additional message gets a **failure report** to its sender (first-in, first-out).
- **`Maximum message size to hold`**: messages larger than this aren't held — they get a failure report instead.

## One easily missed detail: how size is calculated

The "mailbox size" used for the quota comparison can be calculated more than one way, and the difference bites ([official: over-quota notification and detection](https://help.hcl-software.com/domino/11.0.1/admin/conf_notifyinguserswhoexceedamailfilequotaorwarningt_c.html)). The two usually contrasted:

- **Check file size when extending the file (default)**: counts the **file size, including white space**. The catch — when a user **deletes mail, the white space doesn't vanish immediately**, so **quota isn't freed right away**; they can delete and delete and still be "over" until a compact reclaims the white space.
- **Check space used in file when adding a note**: counts only the **space actually used** (white space discounted), so deleting frees it more promptly. HCL recommends this one **when transaction logging is enabled** — because logging stops users from compacting on their own, so this method, which ignores white space, avoids needing an admin to compact (transaction logging itself is in [the transaction-logging piece](/domino-news/en/posts/domino-transaction-logging/)).

(Strictly, this setting — `NSF_QUOTA_METHOD`, on the Server document's Transactional Logging tab — has **three** options; the third, "Check file size when adding a note," is the strictest (white space counted, checked on every note). The two above are the ones quota management usually contrasts.)

So "the user says they've deleted everything and the system still says they're over" is often not a miscalculation — it's the white-space method, and the white space hasn't been reclaimed yet.

## Notifications and iNotes

- **Notification frequency**: whether and how often to notify on crossing the threshold or quota — **None / per message / per time interval**.
- **iNotes**: iNotes users are, by default, **blocked from sending and saving** once they hit quota; notes.ini `iNotes_wa_Ignore_Quota=1` lets them **send without saving**.

## Wrap-up

- **Two limits**: quota (hard limit) + warning threshold (advance notice, needs a quota first).
- **Default doesn't block**: enforcement defaults to **Deliver anyway**, so setting a quota doesn't block anything — you pick an enforcement.
- **Three options**: `Deliver anyway` (delivers) / `Non delivery to originator` (returns NDR) / `Hold mail and retry` (holds in MAIL.BOX, returns after a one-day expiration).
- **Hold sub-options**: deliver what fits vs hold everything, maximum messages to hold per user, maximum size to hold.
- **Size calc**: default counts white space (deleting doesn't free quota right away) vs used-space (more immediate, recommended with translog).
- **Other**: notifications None/per-message/per-interval; iNotes blocks sending at quota by default (`iNotes_wa_Ignore_Quota`).
