---
title: "Signing and Encrypting Documents in LotusScript: Sign, Encrypt, and the Save-Order Rule"
description: "Domino can sign a document to prove who wrote it and encrypt items so only key-holders can read them — both from LotusScript, and both with a gotcha. This article covers NotesDocument.Sign and the server-agent permission it needs, Encrypt with the mandatory flag-item / Encrypt / Save ordering, per-item opt-in encryption, and why EncryptOnSend is a completely separate thing from encrypting the stored copy."
pubDate: 2026-07-12T07:30:00+08:00
lang: en
slug: notes-document-sign-encrypt
tags:
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "Sign method (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SIGN_METHOD.html"
  - title: "Encrypt method (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPT_METHOD.html"
  - title: "EncryptionKeys property (NotesDocument) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPTIONKEYS_PROPERTY.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

Two of Domino's oldest security features are one method call each — and both fail quietly if you get the sequence wrong. [`Sign`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SIGN_METHOD.html) attaches a cryptographic signature proving who wrote the document; [`Encrypt`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPT_METHOD.html) scrambles chosen items so only key-holders can read them. The traps aren't in the crypto — they're in *when the change hits disk* and *whose identity does the work*.

---

## TL;DR

- **`doc.Sign`** signs with the current user's (or signer's) ID. "If you want the signature to be saved, you must call the Save method after signing" — Sign alone doesn't persist.
- **In a server agent, signing needs permission:** the signer must be listed in "Run unrestricted methods and operations" in the server document, or you get error 4165.
- **Encryption is per-item and opt-in:** set `item.IsEncrypted = True` on each item you want protected, then call `doc.Encrypt`, then `doc.Save`. Items you don't flag "remain visible to any user, even if the user does not have the proper encryption key."
- **Order is mandatory:** flag items → `Encrypt` → `Save`. "The encrypted document is not written to disk until you call the Save method."
- With no keys set, `Encrypt` uses the user's **public key** (only they can decrypt). Set `EncryptionKeys` to one or more **named secret keys** to share access.
- **Mailing is separate:** `EncryptOnSend` / `SignOnSend` act only when the document is *mailed* and have "no effect on whether a document is encrypted when saved to a database." When mailing, `EncryptionKeys` is ignored — recipient public keys are used instead.

## Signing

`Sign` takes no parameters — it signs with the identity running the code, and you must save to keep it:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Main Topic"
doc.Subject = "A signed document"
Call doc.Sign
Call doc.Save(False, True)
Print "Signed by: " & doc.Signer & ", verified by: " & doc.Verifier
```

That's the official example. After signing, `doc.IsSigned` is `True`, `doc.Signer` names who signed, and `doc.Verifier` names the certificate that vouches for them (both empty if unsigned or the signer isn't trusted).

The identity question matters most in agents. `Sign` uses "the current user's Notes ID" — and in a background agent, *who that is* depends on how the session was obtained (a plain `NotesSession` runs as the agent signer; `sessionAsSigner` is the mechanism for signing as the design element's signer). Either way the documented hard requirement is permission: a server-based agent that signs must have its signer in the server's "Run unrestricted methods and operations" list, or it fails with `lsERR_NOTES_SIGN_NOPERM` (4165).

## Encrypting

Encryption is opt-in per item and has a strict order. You flag the items to protect, call `Encrypt`, then `Save` — this is the official pattern for a named secret key:

```lotusscript
Dim doc As NotesDocument
Dim itemA As NotesItem
Dim itemB As NotesItem
'...set value of doc...
Set itemA = doc.GetFirstItem("Subject")
Set itemB = doc.GetFirstItem("Body")
itemA.IsEncrypted = True
itemB.IsEncrypted = True
doc.EncryptionKeys = "Top Secret"
Call doc.Encrypt
Call doc.Save(True, True)
```

Three rules are doing the work here. First, **only flagged items are encrypted** — anything without `IsEncrypted = True` stays readable by anyone, so encrypting "the document" really means encrypting the items you marked. Second, **setting the flag does nothing on its own**: "the item is not actually encrypted until you call the Encrypt method on the parent NotesDocument." Third, **`Encrypt` doesn't touch disk** — "the encrypted document is not written to disk until you call the Save method." Miss the `Save` and you've encrypted nothing.

The [`EncryptionKeys`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ENCRYPTIONKEYS_PROPERTY.html) property chooses *who* can decrypt. With no keys set, `Encrypt` uses the current user's public key — only they can ever read it back, which is rarely what you want for shared data. Set one or more named secret keys (which recipients must hold in their ID) to share access. For server agents encrypting on someone else's behalf, the `Encrypt(userid)` / `Encrypt(idfile, password)` overloads let you encrypt with a specific identity's keys, typically fetched via `NotesIDVault`.

## Mailing is a different mechanism

The most common confusion: `EncryptOnSend` and `SignOnSend` are *not* the same as `Encrypt`/`Sign`. They apply only when the document is **mailed**, and the docs are blunt that `EncryptOnSend` "has no effect on whether a document is encrypted when saved to a database." Two consequences worth internalising:

- When mailing, `EncryptionKeys` is ignored — Domino "looks for the public key of each recipient in the Domino Directory" instead. And if it can't find a recipient's public key, it "sends an unencrypted copy of the document to that recipient" — a silent downgrade to plaintext that's easy to miss.
- To protect the *stored* copy in a database, use `Encrypt`; to protect the *mailed* copy in transit, use `EncryptOnSend`. They solve different problems and you sometimes want both.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.Sign` / `doc.Encrypt` | `doc.sign()` / `doc.encrypt()` | `document.sign()` / `document.encrypt()` |
| `doc.EncryptionKeys` | `doc.getEncryptionKeys() / setEncryptionKeys()` | same, camelCase |
| `doc.IsSigned / IsEncrypted / Signer` | `doc.isSigned() / isEncrypted() / getSigner()` | same |

The `lotus.domino.Document` surface mirrors the LotusScript one across Java and SSJS, and every caveat carries over: flag-items-then-encrypt-then-save, the server permission for signing agents, and the strict separation between database-copy encryption (`encrypt`) and mail-time encryption (`encryptOnSend`).
