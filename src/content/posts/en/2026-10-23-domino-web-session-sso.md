---
title: "How Domino Web Login Works: Basic vs Session Authentication, Single- vs Multi-Server SSO, the Shared Secret, and the Trap Where Enabling Internet Sites Disables SSO"
description: "A user logs into Domino in a browser and then clicks around without logging in again — that's session-based authentication: the server issues a token, puts it in a cookie, and the browser carries it on every request. Letting a user log into one server and reach several others (SSO) relies on a Web SSO Configuration document in the Domino Directory holding a shared secret key. This piece covers how basic and session authentication differ, single-server cookies vs multi-server SSO, that the Web SSO Configuration document must replicate to every participating server, the hard conditions that make SSO fail (the DNS domain must start with a period, URLs must use the FQDN, cookies can't cross TCP/IP domains, only Domino servers can be listed, and all SSO servers must use the same Internet-access method), an easy trap — enabling Internet Sites in the Server document automatically disables an existing SSO configuration — and the caveats for sharing LTPA with WebSphere (importing WebSphere keys removes the idle-timeout option, and the LTPA realm must match)."
pubDate: 2026-10-23T07:30:00+08:00
lang: en
slug: domino-web-session-sso
tags:
  - "Domino Server"
  - "Admin"
  - "Security"
sources:
  - title: "Multi-server session-based authentication (single sign-on) (SSO cookie carries the token, DNS domain requirements, Web SSO Configuration shared secret, imported WebSphere keys remove idle timeout, enabling Internet Sites disables SSO) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_multiserversessionbasedauthenticationsinglesignon_t.html"
  - title: "Setting up session authentication for Web Site documents (session authentication on a Web Site document: Disabled / Single Server / Multiple Servers) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_settingupsessionauthenticationforwebsitedocuments_t.html"
  - title: "Creating a Web SSO configuration document (creating the Web SSO Configuration, participating servers, DNS domain, LTPA realm) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/9.0.1/admin/conf_creatingawebssoconfigurationdocument_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-web-session-sso.webp"
coverStyle: "paper-craft"
---

A user logs into Domino in a browser and then clicks around — opening different databases — without logging in again. Why? Because Domino uses **session-based authentication**: on a successful login the server **issues a token and puts it in a cookie**, and the browser carries that cookie on every request, so the server recognizes "who you are and that you're still logged in." And when you have **several** Domino servers and want a user to **log into one and reach the others** (SSO), the token behind that needs a shared secret.

---

## TL;DR

- **Basic vs session**: **basic authentication** is the browser's built-in HTTP prompt, resending the credentials on every request; **session-based authentication** uses a **login form** + a **cookie** — after login the server puts a token in a cookie and recognizes you by it (so the **browser must accept cookies**).
- **Single vs multi-server**: a **Single Server** cookie is valid only for **that one server**; **Multiple Servers (SSO)** lets a user "log in once" and then reach other enabled servers in the **same DNS domain** **without logging in again**.
- **The Web SSO Configuration document**: a **domain-wide** Domino Directory document that **must replicate to every participating server**, holding a **shared secret key** the servers use to **verify user credentials** (the LTPA token).
- **What makes SSO fail**: participating servers must be in the **same DNS domain**, whose value **must start with a period** (e.g. `.example.com`); URLs must use the **full DNS name** (not a host name or IP), because the **cookie's DNS domain must match the server URL and cookies can't cross TCP/IP domains**; the participating list can hold **only Domino servers** (no groups/wildcards); and **all SSO servers must use the same Internet-access method** (all Internet Site documents, or all Server document).
- **One big trap**: **enabling Internet Sites in the Server document automatically disables an existing SSO configuration** — directly related to the previous piece on [Internet Site documents](/domino-news/en/posts/domino-internet-site-documents/).
- **Sharing LTPA with WebSphere**: once you **import WebSphere's LTPA key, you can't set an SSO idle timeout** (WebSphere ignores idle timeouts); the **LTPA realm must match on all participating servers**; SSO across Domino domains means importing the **same WebSphere LTPA token into each domain**.

## Basic vs session-based authentication

Domino web name-and-password authentication comes in two forms:

- **Basic authentication**: HCL describes it as a "challenge/response protocol" that asks the user for a name and password. In HTTP Basic's standard behavior that's the browser's built-in auth prompt, and once entered the browser **resends the credentials on every request**; there's no clean "log out" and no timeout.
- **Session-based authentication**: a **login form** instead. On a successful login, the **server generates a token and sends it to the browser in a cookie** (HCL: "the authentication token that is generated by the server is sent to the browser in a cookie"), and the browser keeps the session via that cookie. Because the auth state lives in the cookie, the **browser must accept cookies** — and you get timeouts and a real logout.

The session authentication field on the Web Site document (or Server document) is where you pick among these modes: **Disabled / Single Server / Multiple Servers (SSO)** ([official: setting up session authentication for Web Site documents](https://help.hcl-software.com/domino/10.0.1/admin/conf_settingupsessionauthenticationforwebsitedocuments_t.html)).

## Single-server cookies vs multi-server SSO

- **Single Server**: the cookie is valid **only on the server that issued it**. Move to another Domino server and the user logs in again.
- **Multiple Servers (SSO)**: this is single sign-on. HCL says it lets a web user "log in once to a Domino or WebSphere server" and then reach other enabled servers in the **same DNS domain** **without logging in again**.

SSO works because the token isn't something each server just makes up on its own — it's signed with a **secret key shared across the servers**, so server B can verify a token issued by server A and recognize the user.

## The Web SSO Configuration document: the shared secret

The core of multi-server SSO is a **Web SSO Configuration document** ([official: creating a Web SSO configuration document](https://help.hcl-software.com/domino/9.0.1/admin/conf_creatingawebssoconfigurationdocument_t.html)):

- It's a **domain-wide** document in the **Domino Directory**.
- It **must replicate to every participating server** — each needs the same copy to have the same key.
- It "contains a shared secret key used by servers for verifying user credentials" — that **shared secret key** (the LTPA token key) is the root of trust between the servers.
- A domain can technically hold more than one such document (each needs a unique name), but HCL notes this only works "under limited circumstances."

## What makes SSO fail

SSO that's configured but keeps re-prompting usually hits one of these ([official: multi-server SSO](https://help.hcl-software.com/domino/12.0.0/admin/conf_multiserversessionbasedauthenticationsinglesignon_t.html)):

- **The DNS domain must match and start with a period**: participating servers must be in the **same DNS domain**, and the value must look like `.example.com` — **starting with a period**.
- **URLs must use the full DNS name**: not a host name or IP — because the **cookie's DNS domain must match the server URL**, and a **cookie can't be used across TCP/IP domains**.
- **The participating list can hold only Domino servers**: no groups, wildcards, or WebSphere server names.
- **All SSO servers must use the same Internet-access method**: all on Internet Site documents, or all on the Server document — no mixing.

## One big trap: enabling Internet Sites disables SSO

This one is easy to hit and its symptom is confusing: **when you enable Internet Sites in the Server document, an existing SSO configuration is automatically disabled** (HCL: "any existing SSO configuration is automatically disabled").

So if you follow the [previous piece](/domino-news/en/posts/domino-internet-site-documents/) and switch a server to Internet Sites, the SSO that was hanging off the Server document no longer counts — you have to **reconfigure SSO on the Internet Sites side (the Web Site document's session authentication)**. When "everyone has to log in again" right after you switch to Internet Sites, this is almost always why.

## Sharing LTPA with WebSphere

To share one login across Domino and WebSphere (or across Domino domains), you use the **LTPA token** — but know the limits first:

- WebSphere **can't directly use a Domino-generated LTPA token**; the approach is to **export the token from WebSphere and import it into Domino**, sharing one LTPA group.
- **Once you import WebSphere's LTPA key, you can't set an SSO idle timeout** — WebSphere ignores idle timeouts, so the option disappears.
- The **LTPA realm must be identical on all participating servers**.
- For SSO across **multiple Domino domains**, have each domain use the **same key information** (concretely, import the same WebSphere LTPA token into each domain).

## Wrap-up

- **Basic vs session**: basic = HTTP prompt resending credentials each request; session = login form + cookie carrying a token (must accept cookies).
- **Single vs multi**: a Single Server cookie is only for that server; Multiple Servers (SSO) means log in once, reach the whole DNS domain.
- **Web SSO Configuration**: domain-wide, replicated to every participating server, holding the shared secret key (LTPA) that verifies credentials.
- **Hard conditions**: same DNS domain (starting with a period), URLs use the FQDN, cookies don't cross TCP/IP domains, only Domino servers listed, all SSO servers on the same Internet-access method.
- **Big trap**: enabling Internet Sites in the Server document disables existing SSO → reconfigure it on the Web Site side.
- **WebSphere/LTPA**: importing WebSphere keys removes the idle-timeout option; the LTPA realm must match; cross-domain means the same token imported into each domain.
