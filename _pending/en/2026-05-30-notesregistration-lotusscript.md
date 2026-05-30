---
title: "NotesRegistration: Automating User Registration with LotusScript"
description: "Every Domino admin gets the same drumbeat — new hire onboarding, employee leave, departure notifications, all eventually landing as 'create / update / disable a Notes user' tickets. Clicking through Admin Client one user at a time scales badly. NotesRegistration is LotusScript's built-in answer: a single class that programmatically wraps user registration, certification, and ID-file management. This article walks through the practical HR-system-driven scenario, RegisterNewUser's 14 parameters, the required property setup, the server-context prerequisites, and a complete CSV batch example."
pubDate: 2026-05-30T07:30:00+08:00
lang: en
slug: notesregistration-lotusscript
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRegistration class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html"
  - title: "RegisterNewUser method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD.html"
  - title: "Is it possible to write an agent in Lotus Domino to automate a user registration? — HCL Domino Wiki"
    url: "https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/Is_it_possible_to_write_an_agent_in_Lotus_Domino%C2%AE_to_automate_a_user_registration"
relatedJava: ["Registration"]
relatedSsjs: []
---

Your HR system fires off a new-hire form, a leave-of-absence notice, or a resignation — and the tail of that workflow lands on the Domino admin's desk: create a Notes user, provision a mailbox, add to the right groups, then maybe later rename / move departments / lock the account / delete it. One at a time through Admin Client is fine for 10 employees; for 100, it's a time sink; for a 500-person acquisition, it's impossible.

`NotesRegistration` is the LotusScript class built for exactly this — user registration, certification, and ID-file management, all wrapped behind code you can call from an agent. Wire it to your HR / leave-management feed and admins get out of the click-tunnel and back to designing the rules and watching the logs.

This article focuses on the most-used method, `RegisterNewUser` — breaking down its 14 parameters, the property setup it depends on, the server-permission prerequisites, and a complete example that batch-registers users from a CSV.

---

## TL;DR

- [`NotesRegistration`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html) has been in LotusScript since Release 4.6 — the core class for ID-file creation and management, the foundation for admin automation
- **Two-step pattern**: set properties first (certifier path, registration server, mail template, etc.), then call methods ([`RegisterNewUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD.html) / `RegisterNewServer` / `Recertify` and friends)
- **32 properties + 10+ methods** covering ID creation, directory entries, roaming users, mail quotas, certifier management
- **Requires a certifier ID file (`cert.id`)** + its password — without that, you can't sign out a new ID
- **Most methods need a Domino server context** — the agent has to run on the server with admin signing rights
- Works alongside ID Vault — newly created IDs auto-import into the vault if the org policy is configured
- Cross-language: Java has `lotus.domino.Registration`; SSJS has no counterpart (pure server-side admin operation, not appropriate for XPages)

---

## Why this class is still worth learning

Modern Domino 14.x environments have better options for some scenarios — ID Vault centralises user IDs, IdP integration handles SAML / OIDC sign-on, directory-sync tools synchronise Person documents. But for most orgs still on Domino:

- **Legacy NSFs and workflows remain in production** — rebuilding the auth stack is too expensive; layering LotusScript automation on top is the pragmatic path
- **HR systems don't speak Domino** — schemas don't match; you need an adapter agent translating HR records into Domino operations, and `NotesRegistration` is the core API that adapter calls
- **Batch scenarios make GUI work impossible** — an acquisition, an org restructure, a mass certificate refresh — without automation, you're sunk

So this class **isn't outdated** — it's a hard requirement for mid-sized Domino environments. The HCL Domino Wiki has an old Q&A — [Is it possible to write an agent in Lotus Domino to automate a user registration?](https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/Is_it_possible_to_write_an_agent_in_Lotus_Domino%C2%AE_to_automate_a_user_registration) — that demonstrates the minimal agent wrapping this class; it's been there for over a decade and is still the most-referenced starter example.

---

## The two-step pattern: set properties, then call methods

`NotesRegistration` doesn't behave like a typical class — its properties aren't for reading data, they're **settings that control how methods behave**. The docs are explicit: "The properties are intended to be set before calling the methods."

Think of it as a "worker that carries its setup":

```lotusscript
Dim reg As New NotesRegistration

' Step 1: equip the reg object
reg.CertifierIDFile = "C:\Domino\Data\cert.id"
reg.RegistrationServer = "MailServer/ACME"
reg.CreateMailDb = True
reg.MailTemplateName = "StdR14Mail"
' ... 28 other properties available

' Step 2: call methods that use those settings
Call reg.RegisterNewUser("Chen", _
        "C:\Domino\Data\ids\chen.id", _
        "MailServer/ACME", _
        "Ming", "", "certpwd", _
        "", "", "mail\chen.nsf", _
        "", "userpwd")
```

Properties get set once, methods can be called repeatedly to register multiple users — that's the key to batch registration: amortise the property setup, then the loop body only handles per-user variance.

---

## Required properties — the minimum you need

Most of the 32 properties are **optional** (sensible defaults or specific scenarios). For a basic user registration, the minimum set:

| Property | Type | Meaning |
|---|---|---|
| `CertifierIDFile` | String | Full path to the certifier ID file, usually `cert.id`; must be readable |
| `CertifierName` | String | Certifier name, e.g. `/ACME` |
| `RegistrationServer` | String | Server that runs the registration, usually the mail host |
| `CreateMailDb` | Boolean | Whether to also provision the user's mail database (usually `True`) |
| `MailServer` | String | Server hosting the user's mail database |
| `MailTemplateName` | String | Mail template name, e.g. `StdR14Mail` |
| `StoreIDInAddressBook` | Boolean | Whether to attach the ID file in the Person document (set `True` for ID Vault) |

Additional properties for richer scenarios:

- `IsRoamingUser` / `RoamingServer` / `RoamingSubdir`: roaming user setup
- `MailQuotaSizeLimit` / `MailQuotaWarningThreshold`: mailbox quotas
- `PolicyName`: apply an admin policy
- `MailInternetAddress`: external SMTP address (e.g. `chen@acme.com`)
- `Expiration`: ID file expiration date

---

## `RegisterNewUser` full signature

14 parameters, the first 3 required, the rest optional:

```lotusscript
variant = notesRegistration.RegisterNewUser( _
    lastname$, _              ' required: last name
    idfile$, _                ' required: local path to write the new ID to
    mailserver$, _            ' required: mail server
    [firstname$], _           ' optional: first name
    [middle$], _              ' optional: middle name / middle initial
    [certpw$], _              ' optional: certifier password
    [location$], _            ' optional: Person doc Location field
    [comment$], _             ' optional: Person doc Comment field
    [maildbpath$], _          ' optional: mailbox path (e.g. mail\chen.nsf)
    [fwddomain$], _           ' optional: forwarding domain
    [userpw$], _              ' optional: password for the new user ID
    [usertype%], _            ' optional: client type constant
    [altname], _              ' optional: alternate name (R5.0.2+)
    [altnamelang] _           ' optional: alternate name language (R5.0.2+)
)
```

A few traps:

- `idfile$` is where the new ID gets **written to** on the local filesystem — not a read path. The path has to be writable
- `maildbpath$` is **relative to the mail directory**, not absolute — `mail\chen.nsf`, not `C:\Domino\Data\mail\chen.nsf`
- `certpw$` is the **certifier's** password, not the new user's. The user password is `userpw$` — easy to mix up
- `usertype%` takes one of the built-in constants `NOTES_DESKTOP_CLIENT` / `NOTES_FULL_CLIENT` / `NOTES_LIMITED_CLIENT`

The return value is a `Variant` — usually ignored; errors throw exceptions directly.

---

## In practice: batch register from HR-system CSV

Read employee data from a CSV, loop calling `RegisterNewUser`, log errors without breaking the whole batch:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim reg As New NotesRegistration

    ' === shared properties, set once ===
    reg.CertifierIDFile = "C:\Domino\Data\cert.id"
    reg.CertifierName = "/ACME"
    reg.RegistrationServer = "MailServer/ACME"
    reg.CreateMailDb = True
    reg.MailServer = "MailServer/ACME"
    reg.MailTemplateName = "StdR14Mail"
    reg.StoreIDInAddressBook = True   ' required for ID Vault
    reg.UpdateAddressBook = True

    ' === open CSV ===
    Dim fnum As Integer
    fnum = FreeFile
    Open "C:\Onboarding\new-hires.csv" For Input As #fnum

    Dim line As String
    Dim parts() As String
    Dim okCount As Integer
    Dim errCount As Integer

    ' === skip header ===
    Line Input #fnum, line

    Do Until EOF(fnum)
        Line Input #fnum, line
        parts = Split(line, ",")
        ' parts(0)=lastname parts(1)=firstname parts(2)=employee_id parts(3)=department

        On Error Resume Next
        Call reg.RegisterNewUser( _
            parts(0), _
            "C:\Domino\Data\ids\" & parts(2) & ".id", _
            "MailServer/ACME", _
            parts(1), _
            "", _
            "certpwd-do-not-hardcode", _
            "", _                          ' Location
            "Employee ID " & parts(2), _   ' Comment
            "mail\" & parts(2) & ".nsf", _ ' mailbox path
            "", _
            "TempPass-" & parts(2), _      ' initial password, forced to change on first login
            NOTES_DESKTOP_CLIENT)

        If Err <> 0 Then
            Print "[ERR] " & parts(2) & " " & parts(0) & parts(1) & ": " & Error()
            errCount = errCount + 1
            Err = 0
        Else
            Print "[OK] " & parts(2) & " " & parts(0) & parts(1) & " registered"
            okCount = okCount + 1
        End If
        On Error Goto 0
    Loop

    Close #fnum
    Print "Done: " & okCount & " ok, " & errCount & " failed"
End Sub
```

Production considerations:

- **Don't hardcode `certpwd`** — read it from `NotesSession.GetEnvironmentString` or pull from an external vault
- **Initial password strategy** — use a predictable rule (e.g. based on employee ID) combined with a policy forcing change on first login
- **Error recovery** — `On Error Resume Next` ensures one failure doesn't kill the whole batch; collect errors in a log for admin review
- **Idempotency** — `RegisterNewUser` throws on duplicate names, so a re-run must filter out already-registered users first (use `GetUserInfo` to check)

---

## Common traps

### Certifier path and password

`CertifierIDFile` is the path the **agent** can reach at runtime — not the path the admin sees in their client. If the agent runs on a server, `cert.id` has to be on the server, and the agent's signer needs read access.

A safer pattern: use the CA (Certificate Authority) instead of a direct `cert.id` reference — set `UseCertificateAuthority = True` and point `CertifierName` to a CA-registered certifier.

### Interaction with ID Vault

After ID Vault is deployed, `StoreIDInAddressBook = True` causes new IDs to auto-import into the vault — provided the org has the matching ID Vault policy configured. From the admin's side: users no longer need to carry their `.id` file to change passwords, reset, or move between machines — this is standard in modern Domino environments.

But the vault doesn't replace `NotesRegistration` — you still have to create the ID first; the vault is what holds it afterward.

### Server context is non-negotiable

`RegisterNewUser` requires:

- The agent runs on a Domino server (not a client agent on the user's machine)
- The agent signer has "Run unrestricted methods" rights in the Server document's Programmability Restrictions
- The signer has read/write access to `cert.id` and the target server

Running this as a client agent typically fails on the `RegistrationServer` line. It must run under admin authority on a server that explicitly permits it.

### `RegisterNewUser` doesn't auto-add to groups

A newly registered user has **only a Person document** — no group memberships. You need separate [`NotesACL`](/domino-news/en/posts/notes-acl-entry) work or directory group-maintenance code to add them. The common pattern: after `RegisterNewUser` returns, immediately call a helper that adds the user to default groups (e.g. `AllEmployees` plus a department group).

---

## How other methods fit in

`NotesRegistration` ships with a full ID-lifecycle method surface, not just `RegisterNewUser`:

| Method | Purpose |
|---|---|
| `RegisterNewUser` | Create a new user ID + Person document + mail database |
| `RegisterNewServer` | Create a new server ID |
| `RegisterNewCertifier` | Create a new certifier ID (for building OU hierarchies) |
| `AddUserToAddressBook` | Attach an existing ID file to a new Person document |
| `Recertify` | Recertify an existing ID (certifier swap / OU change / expiration extension) |
| `CrossCertify` | Cross-organisation certification |
| `GetUserInfo` | Look up user info from the directory (use to check existence) |
| `GetIDFromServer` | Download an ID file attached to a Person document |
| `DeleteIDOnServer` | Remove the attached ID from a Person document (not user deletion) |

HR-driven automation typically uses at least four of these:

- New hire → `RegisterNewUser`
- Rename / dept change → `Recertify`
- Departure → flip Person document status + remove from groups (handled via [`NotesACL`](/domino-news/en/posts/notes-acl-entry) / `NotesDocument`, not this class)
- Leave of absence → set `Expiration` and `Recertify` to a short-validity ID

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesRegistration` |
| Java | `lotus.domino.Registration` (drop the `Notes` prefix; remember to `.recycle()`) |
| SSJS | None — `NotesRegistration` is pure server-side admin work, not appropriate for XPages or general SSJS contexts, and requires admin rights |

For XPages apps that need user management: wrap the registration logic in a scheduled agent running on the server, have the XPages UI write a request document, let the agent pick up requests and run `NotesRegistration`, then write a response document back for the UI to read. That's the standard way to separate UI concerns from privileged operations.
