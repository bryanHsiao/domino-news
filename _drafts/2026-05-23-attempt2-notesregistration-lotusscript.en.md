---
title: "Automating User Registration with the NotesRegistration Class in LotusScript"
description: "A comprehensive guide on using the NotesRegistration class in LotusScript to automate user registration in HCL Domino, covering key properties, methods, and implementation examples."
pubDate: "2026-05-23T07:30:08+08:00"
lang: "en"
slug: "notesregistration-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesRegistration (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html"
  - title: "RegisterNewUser (NotesRegistration - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_REGISTERNEWUSER_METHOD.html"
  - title: "Is it possible to write an agent in Lotus Domino® to automate a user registration?"
    url: "https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/Is_it_possible_to_write_an_agent_in_Lotus_Domino%C2%AE_to_automate_a_user_registration"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesregistration-lotusscript
-->

## Introduction

Managing user accounts is a critical task in HCL Domino environments. LotusScript provides the `NotesRegistration` class, enabling developers to automate the user registration process programmatically. This article explores how to utilize the `NotesRegistration` class to create new users, including its key properties, methods, and implementation examples.

## Overview of the NotesRegistration Class

The `NotesRegistration` class represents the creation or administration of ID files. It encompasses various properties and methods that allow developers to set user information and perform registration operations. This class is contained within the `NotesSession`.

## Key Properties

- **CertifierIDFile**: Specifies the path to the certifier ID file used for registration.
- **CertifierName**: The name of the certifier.
- **CreateMailDb**: A Boolean indicating whether to create a mail database for the new user.
- **MailServer**: The name of the mail server.
- **MailTemplateName**: The name of the mail database template.
- **RegistrationServer**: The name of the server performing the registration.

## Key Methods

- **RegisterNewUser**: Creates a user ID and optionally adds it to the Domino Directory.
- **AddUserToAddressBook**: Adds a user to the address book.
- **GetIDFromServer**: Retrieves a user ID file from a server.

## Implementation Example

The following example demonstrates how to use the `NotesRegistration` class to register a new user:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim reg As New NotesRegistration
    
    ' Set certifier information
    reg.CertifierIDFile = "C:\Certifier\cert.id"
    reg.CertifierName = "CN=Certifier/O=Organization"
    reg.RegistrationServer = "DominoServer/Organization"
    reg.CreateMailDb = True
    reg.MailServer = "MailServer/Organization"
    reg.MailTemplateName = "StdR7Mail"
    
    ' Register new user
    Call reg.RegisterNewUser("Doe", "C:\NotesData\jdoe.id", "MailServer/Organization", "John", "", "certpassword", "", "", "mail\jdoe.nsf", "", "userpassword")
End Sub
```

In this example:

1. A new `NotesRegistration` object is created.
2. The certifier ID file, name, and registration server are set.
3. Mail database creation is enabled, specifying the mail server and template.
4. The `RegisterNewUser` method registers a new user, providing necessary parameters such as last name, ID file path, mail server, first name, certifier password, mail database path, and user password.

## Considerations

- Ensure that the `CertifierIDFile` and `CertifierName` are correct and have appropriate permissions.
- Before registering users, verify that the `RegistrationServer` is available and properly configured.
- When setting `CreateMailDb` to `True`, confirm that the mail server and template name are accurate.

By leveraging the `NotesRegistration` class, developers can effectively automate the user registration process, reducing manual operations and enhancing administrative efficiency.

For more information on the `NotesRegistration` class, refer to the [official documentation](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS.html).
