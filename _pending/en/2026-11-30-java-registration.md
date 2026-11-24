---
title: "Registration in Java: Set the Properties (CertifierIDFile and Friends) First, Then registerNewUser"
description: "To register users programmatically — onboarding automation, scripted provisioning of a batch of accounts — Domino's Registration class does it. But it works differently from most classes: the docs state plainly 'The properties are intended to be set before calling the methods.' You set CertifierIDFile (the certifier ID path), RegistrationServer, IDType, Expiration, and MinPasswordLength first, and only then does registerNewUser succeed. And registerNewUser returns false on failure rather than throwing — don't check the return and you'll think it worked. This covers that set-properties-then-call rhythm, registerNewUser's parameters, the CertifierIDFile + certifier password key, registerNewCertifier/crossCertify/getUserInfo, and that createRegistration can't run remotely (IIOP)."
pubDate: 2026-11-30T07:30:00+08:00
lang: en
slug: java-registration
tags:
  - "Java"
sources:
  - title: "Registration class (Java) (set properties then call; registerNewUser/Certifier/crossCertify/getUserInfo) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS_JAVA.html"
  - title: "registerNewUser (Registration - Java) (many parameters, returns boolean) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD_JAVA.html"
  - title: "CertifierIDFile (Registration - Java) (must be set before any register/certify) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CERTIFIERIDFILE_PROPERTY_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "Registration"
apiLang: "java"
---

To register users programmatically — onboarding automation, scripted provisioning of a whole batch of accounts — Domino's [`Registration`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS_JAVA.html) class does it. The definition is one line: "Represents the creation or administration of an ID file."

But it's shaped differently from the classes you usually use. You don't pass everything as method arguments — the docs state "The properties are intended to be set before calling the methods." You set `CertifierIDFile`, `RegistrationServer`, `IDType`, `Expiration`, and `MinPasswordLength` **first**, and only then does `registerNewUser` succeed. And it fails by **returning `false`, not throwing** — don't check the return value and you'll assume it worked.

This covers that "set properties, then call" rhythm, `registerNewUser`'s parameters, the `CertifierIDFile` + certifier password key, a few sibling methods, and the trap that `createRegistration` can't run remotely.

---

## The rhythm: set the properties, then call the method

Build a `Registration` from Session, then **set properties first**:

```java
Registration reg = session.createRegistration();
reg.setRegistrationServer("AceOne");                       // which server to register on
reg.setCertifierIDFile("d:\\NotesAdministrator\\cert.id"); // which certifier ID to use
reg.setIDType(Registration.ID_HIERARCHICAL);               // hierarchical ID
reg.setMinPasswordLength(5);                               // password strength
reg.setExpiration(expiry);                                 // expiration date (DateTime)
reg.setUpdateAddressBook(true);                            // also create a Person in the Directory
```

That's exactly the docs' Usage flow. A few of the common properties:

- `RegistrationServer` — which server to register on. **If unset**, the methods act on the `names.nsf` in the local data directory.
- `IDType` — which kind of ID to create (the example uses `Registration.ID_HIERARCHICAL`).
- `Expiration` — the ID's expiration. The default varies by operation: 2 years for registerNewUser, 100 years for a certifier org/OU, 10 years for crossCertify.
- `UpdateAddressBook` — whether to also create an ID document in the Directory when the ID is created.
- `MinPasswordLength` — password strength.

Only then call `register*`. That ordering is the whole trick to this class — call before the properties are set and it won't fill in the gaps, it just fails.

## registerNewUser: many parameters, and it returns a boolean

[`registerNewUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD_JAVA.html), per the docs, "Creates a user ID and optionally adds it to a Domino Directory." It has several overloads, from 3 parameters to a long list. The official example's call:

```java
boolean ok = reg.registerNewUser(
    "Yip",                               // lastn   last name
    "d:\\NotesAdministrator\\jyip.id",   // idfile  full path of the ID file to create
    "CN=Mail_AceOne/O=AceHardware",      // server  canonical name of the mail server
    "Jimmy",                             // firstn  first name
    "",                                  // middle  middle initial
    "AceHardware",                       // certpw  password of the CERTIFIER ID
    "", "",                              // location / comment (Directory fields)
    "mail\\jyip.nsf",                    // maildbpath  mail file (relative to mail dir)
    "",                                  // forward  forwarding domain
    "AceHardware");                      // userpw  password of the new USER ID
if (!ok) System.out.println("Registration failed");   // ← always check the return
```

**The return value is the point**: docs, "True if the operation is successful; false otherwise." — it **returns `false` on failure, it doesn't throw**. So you can't write `registerNewUser(...)` and assume success; follow it with `if (!ok)`. (`NotesException` is thrown only for lower-level errors.) Also note `certpw` is the **certifier ID's** password, while `userpw` is the new user ID's password — don't mix the two.

## CertifierIDFile + the certifier password: the key to every registration

[`CertifierIDFile`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CERTIFIERIDFILE_PROPERTY_JAVA.html), per the docs, is "The complete file specification of the certifier ID to use when creating IDs." and "Set this property before calling crossCertify, recertify, registerNewCertifier, registerNewServer, or registerNewUser." — nearly every ID-creating / certifying method **needs it set first** (crossCertify's page is blunter: "requires that CertifierIDFile be set").

That design means: **the environment running this code must be able to reach the certifier ID file and know its password.** This is powerful and sensitive (you're issuing identities), and the certifier ID + password is the key — treat where it lives and who can run it as sensitive material.

## Sibling methods

The same class also carries:

- `registerNewCertifier(org, idfile, certpw[, country])` — creates a certifier ID. The org Expiration defaults to 100 years and "cannot be changed for organizations."
- `registerNewServer(...)` — creates a server ID.
- `crossCertify(idfile[, certpw][, comment])` — cross-certifies an ID (cross-org trust). Also needs `CertifierIDFile` set.
- `getUserInfo(username, mailserver, mailfile, maildomain, mailsystem, profile)` — looks up a registered user. Mind its signature: "The parameters, except for the first, are return values." — **everything after `username` is an out-parameter** (`StringBuffer` / `Vector`, an unusual shape in Java); you pre-allocate the empties, pass them in, and it fills them.

## The trap: createRegistration can't run remotely (IIOP)

A limit that trips automation: `createRegistration` is flagged "This property is illegal for remote (IIOP) calls." — **it can't run from a remote (IIOP) Java client**. So this registration code has to run **locally / as a server agent**, not as a standalone Java program calling into a remote Domino server. The official example is itself an `AgentBase` agent.

## What about LotusScript and SSJS?

The same `Registration`:

- **LotusScript**: `NotesRegistration`, with `RegisterNewUser` / `RegisterNewCertifier` / `CrossCertify` / `GetUserInfo`, `CertifierIDFile` — same "set properties, then call", same Boolean return, no recycle.
- **SSJS / XPages**: it technically exists at `session.createRegistration()`, but registration / issuing IDs is almost never something you'd run from an XPages front end — the certifier ID + password has no business in the web layer.
- **The Java-specific part** isn't the API (the methods are shared) — it's the setting: a back-end / scheduled Java agent doing batch onboarding or scripted provisioning. `Registration` is the right tool; just remember "set the properties first", "check the boolean return", and "it can't run over IIOP" — and treat the certifier ID + password as sensitive.
