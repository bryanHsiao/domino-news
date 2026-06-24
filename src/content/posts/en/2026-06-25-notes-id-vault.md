---
title: "NotesIDVault: Pulling IDs from the ID Vault, Syncing, and Resetting Passwords in Code"
description: "The ID Vault is Domino's policy-based facility for centrally storing user ID files. NotesIDVault lets you operate it from code — pull a user's ID file out of the vault, sync a local ID back, check whether someone's ID is in the vault, even reset a vault password. This article covers getting it, the GetUserIDFile / SyncUserIDFile / IsIDInVault / ResetUserPassword / PutUserIDFile methods, its relationship to NotesUserID, and the permission prerequisites for these operations."
pubDate: 2026-06-25T07:30:00+08:00
lang: en
slug: notes-id-vault
tags:
  - "LotusScript"
  - "Admin"
  - "Security"
sources:
  - title: "NotesIDVault class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESIDVAULT_CLASS.html"
  - title: "NotesUserID class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUSERID_CLASS.html"
  - title: "NotesSession class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
relatedJava: ["IDVault"]
relatedSsjs: []
cover: "/covers/notes-id-vault.webp"
coverStyle: "risograph"
---

The **ID Vault** is Domino's facility for centrally and securely storing user Notes ID files by policy — when a user forgets their password, switches machines, or corrupts their ID, an administrator (or an automated flow) can restore the ID from the vault. Operating the ID Vault from code is the job of [`NotesIDVault`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESIDVAULT_CLASS.html).

The official definition: "The NotesIDVault class is a representation of the secure storage facility for UserIDs that may be configured for Domino by policy." It lets you pull an ID from the vault, sync a local ID back, check whether someone is in the vault, and reset a vault password — turning what you'd otherwise click through in the Admin Client into automation.

---

## TL;DR

- Get it from [`NotesSession`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html): `Set vault = session.GetIDVault()`.
- **Pull an ID**: `GetUserIDFile(path, vaultServer, password, userName)` pulls a user's ID out of the vault to a file.
- **Sync**: `SyncUserIDFile(...)` updates the vault's copy with changes from a local ID.
- **Query**: `IsIDInVault(vaultServer, userName)` returns a `Boolean` for whether a user's ID is in the vault.
- **Reset password**: `ResetUserPassword(vaultServer, password, userName, downloadCount)`.
- **Put in**: `PutUserIDFile(path, vaultServer, password, userName)` stores an ID file into the vault.
- A pulled ID can be wrapped as a [`NotesUserID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUSERID_CLASS.html), used to get the names of the private encryption keys available to that ID.

## Getting it and the basic operations

Get the vault object straight from the session and call the operations on it. The official example (verbatim) demonstrates the main methods:

```lotusscript
Set id = session.getIDVault()
Call id.getUserIDFile("c:/1.id", "test vault1/IBM", "12345", "TEST/IBM")
Call id.syncUserIDFile("c:/2.id", "test vault1/IBM", "12345", "TEST/IBM")
bVault = id.isIDInVault("test vault1", "TEST/IBM")
Call id.resetUserPassword("test vault1/IBM", "67890", "TEST/IBM", 0)
Call id.putUserIDFile("c:/3.id", "test vault2/IBM", "12345", "TEST/IBM")
```

The argument pattern is consistent: **vault server name, password, target user name**, plus whatever each call needs (file path, download count, etc.).

## What each method does

| Method | What it does |
|---|---|
| `GetUserIDFile` | pulls a user's ID file out of the vault to a given path |
| `SyncUserIDFile` | syncs changes from a local ID file back into the vault |
| `IsIDInVault` | checks whether a user's ID is in the vault (returns `Boolean`) |
| `ResetUserPassword` | resets the password for that ID in the vault; the last argument is the allowed download count |
| `PutUserIDFile` | stores an ID file into the vault |

A typical automation: a user reports "Notes won't open, I forgot my password"; the flow automatically `ResetUserPassword` issues a temporary password and a download count, the user uses it to auto-retrieve the ID on a new machine — no admin hand-holding.

## Permission prerequisites (important)

These operations touch the **security core**, so not just anyone can run them:

- The code needs to be able to reach the vault, backed by the appropriate **vault trust / authority** (running as an authorized identity, or an agent whose signer has vault rights).
- `ResetUserPassword` and `PutUserIDFile` are admin-equivalent actions, governed by the vault's policy and ACL.
- That's also why `relatedSsjs` is empty here — ID Vault operations are an admin/server-side concern, not something an XPages front end touches.

In other words, whether it runs at all depends first on the environment's vault configuration and your identity's rights, not just on getting the API right.

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| Java (`lotus.domino.*`) | `IDVault` | `session.getIDVault()` |
| SSJS / XPages | None | the ID Vault is an admin/server-side capability, outside the front-end scope |

The Java `IDVault` method names map one-to-one with this article (`getUserIDFile` / `syncUserIDFile` / `resetUserPassword`…). For "user self-service ID recovery" automation, a Java agent plus a vault policy is the common combination.
