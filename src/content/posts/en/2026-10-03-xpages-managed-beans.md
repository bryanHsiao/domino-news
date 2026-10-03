---
title: "XPages Managed Beans: Giving SSJS a Real Java Object You Use Like database"
description: "SSJS in a script library is fine as glue, but logic gets unwieldy fast — no real types, hard to test, and serialization headaches when you stash it in scope. A managed bean lets you declare a Java class in faces-config.xml, and it becomes a top-level variable in SSJS and EL that you use just like database or session — bean.method(), #{bean.prop}. This covers how to declare one (the name/class/scope elements), the three class requirements (no-arg constructor, get/set, Serializable), the scope lifecycle, and when logic should move out of SSJS into a bean."
pubDate: 2026-10-03T07:30:00+08:00
lang: en
slug: xpages-managed-beans
tags:
  - "XPages"
  - "Java"
  - "SSJS"
sources:
  - title: "Creating your first managed bean for XPages — Per Henrik Lausten"
    url: "https://per.lausten.dk/blog/2012/02/creating-your-first-managed-bean-for-xpages.html"
  - title: "Binding controls to managed beans — NotesSensei (Stephan Wissel)"
    url: "https://www.wissel.net/blog/2011/01/binding-controls-to-managed-beans.html"
  - title: "JSF - Managed Beans (the underlying JSF facility) — TutorialsPoint"
    url: "https://www.tutorialspoint.com/jsf/jsf_managed_beans.htm"
relatedJava: []
relatedSsjs: []
cover: "/covers/xpages-managed-beans.webp"
coverStyle: "oil-chiaroscuro"
---

You put logic in an SSJS script library as glue, and at first it flows. Then it grows and gets awkward: no real types, hard to unit-test, and stashing things in `viewScope` / `sessionScope` means worrying about [serialization](/domino-news/en/posts/xpages-scope-variables).

That's when a managed bean earns its place: **declare a Java class in `faces-config.xml`, and it becomes a top-level variable in SSJS and EL** — used just like `database` or `session`.

This piece covers how to declare a managed bean, what the Java class must satisfy, how scope sets its lifetime, and when logic should move out of SSJS into a bean.

---

## TL;DR

- **A managed bean = a Java class declared in `faces-config.xml`**, with three elements: `<managed-bean-name>` (the name), `<managed-bean-class>` (fully-qualified class), `<managed-bean-scope>` (scope).
- **The name becomes a top-level variable**: once declared, that name works in **SSJS and EL** just like `database` / `session` / `context` — `bean.someMethod()`, `#{bean.prop}`.
- **Three class requirements**: (1) a no-arg constructor; (2) getters/setters for the properties you expose; (3) **`implements Serializable` for view/session/application scope** (the "Keep pages on disk" serialization — the same rule as scope variables).
- **Scope sets the lifetime**: `request` / `view` / `session` / `application` (plus `none`) — the bean lives in its scope and is discarded when the scope ends.
- **SSJS vs bean**: keep glue and a few lines of logic in SSJS; move stateful, typed, testable, multi-page logic into a managed bean.

## What a managed bean is: a faces-config declaration

A managed bean is XPages' use of JSF's built-in [managed bean facility](https://www.tutorialspoint.com/jsf/jsf_managed_beans.htm). Add a block to `WebContent/WEB-INF/faces-config.xml` ([Per Lausten's example](https://per.lausten.dk/blog/2012/02/creating-your-first-managed-bean-for-xpages.html)):

```xml
<managed-bean>
  <managed-bean-name>helloWorld</managed-bean-name>
  <managed-bean-class>com.company.HelloWorld</managed-bean-class>
  <managed-bean-scope>session</managed-bean-scope>
</managed-bean>
```

- **name**: the variable name you use in code.
- **class**: the fully-qualified Java class.
- **scope**: how long the bean lives.

## What the Java class looks like

Just a standard Java class with three requirements:

```java
public class HelloWorld implements Serializable {
    private static final long serialVersionUID = 1L;
    public HelloWorld() { }                 // no-arg constructor
    private String someVariable;
    public String getSomeVariable() { return someVariable; }
    public void setSomeVariable(String v) { this.someVariable = v; }
}
```

- **No-arg constructor**: JSF has to be able to `new` it itself.
- **get/set**: for each property you want to reach from the XPage / SSJS.
- **`implements Serializable`**: as soon as the scope is view/session/application, the bean is serialized to disk with the page ("Keep pages on disk") — skip `Serializable` and you hit the same trap as [putting a non-serializable object in scope](/domino-news/en/posts/xpages-scope-variables).

## Accessing it from SSJS / EL: like database

Once declared, the name is a top-level object. [Wissel puts it plainly](https://www.wissel.net/blog/2011/01/binding-controls-to-managed-beans.html): "a new top level object demo is available for use in EL or SSJS in the same way as you can use database, session, context etc."

```javascript
// SSJS: call the bean's methods by name
demo.playTune();
var v = helloWorld.getSomeVariable();
```

```
<!-- EL: bind to a control -->
#{helloWorld.someVariable}
```

You name the methods yourself and call them from SSJS; bind properties into a control's value with `#{bean.prop}`.

## Scope sets the lifetime (same set as scope variables)

A bean's `scope` is the lifecycle of [the four XPages scopes](/domino-news/en/posts/xpages-scope-variables):

- `request`: one request.
- `view`: one page instance.
- `session`: one browser session — in the example, "multiple XPages will see the same content"; when the scope ends, "the object is automatically discarded."
- `application`: the whole app, shared across all users (mind memory and thread-safety).
- (`none`: not stored in a scope — built fresh each time it's needed.)

So "which scope for this bean" is the same judgment as "which scope for this data": use the lowest that works.

## SSJS or a bean?

- **Keep it in SSJS**: page-event glue, a few lines of decision logic, a call to the back end — a script library is fine.
- **Move it to a managed bean**: state to hold (across pages, across requests), real Java types and collections, a wish to unit-test, one piece of logic shared by several XPages, or you're already wrestling with serialization and scope. A bean gives you a clean, typed, testable home — and from SSJS it's as smooth to use as a built-in object.

## What about LotusScript and Java?

A managed bean is an **XPages/JSF construct** spanning Java and SSJS:

- **Java**: the bean itself is Java — this is the proper route for moving logic out of SSJS into strongly-typed Java.
- **SSJS**: not replaced but the **consumer** — it uses the bean like it uses `database`. Glue in SSJS, heavy logic in the bean is the common split.
- **LotusScript**: no equivalent. An LS agent is a procedural "run a program" model — there's no "declare a scoped, framework-managed object that other code reaches by name."
