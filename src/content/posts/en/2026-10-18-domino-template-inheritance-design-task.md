---
title: "Template Inheritance and the Designer Task: Why Your Design Changes Get Overwritten Overnight, Refresh vs Replace Design, and How to Protect Elements You Don't Want Touched"
description: "You change a form in a production database, and the next morning the change is gone — because that database has 'Inherit design from template' set, and the server's Designer task overwrote it overnight from the master template. This piece explains how Domino template inheritance actually works: what a master template is (an NTF with 'Database is a template'), how a database links to one via the Design tab's 'Inherit design from template,' how the design flows down through the server's Designer task (load design, runs daily at 1 AM by default, needs a replica of the template on each server), the difference between Refresh Design and Replace Design, and how to protect elements with 'Prohibit design refresh or replace' plus 'Propagate' — plus the practical traps: private agents/folders can't live in a template, and the icon/About/Using documents don't inherit by default."
pubDate: 2026-10-18T07:30:00+08:00
lang: en
slug: domino-template-inheritance-design-task
tags:
  - "Domino Designer"
  - "Admin"
sources:
  - title: "Templates and master templates (what a master template is, 'Database is a template' auto-distributes design) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_TEMPLATES_AND_MASTER_TEMPLATES_.html"
  - title: "Synchronizing databases with master templates (the Designer task, load design, a template replica needed on each server) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_synchronizingdatabaseswithmastertemplates_t.html"
  - title: "Making and distributing design changes (Refresh Design, how inheriting databases get updated) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_ABOUT_MAKING_AND_DISTRIBUTING_DESIGN_CHANGES.html"
  - title: "Replacing a design (Replace Design manual whole-design swap, the only route without inheritance, Prohibit/Propagate to protect elements) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html"
relatedJava: []
relatedSsjs: []
---

You change a form in a production database, and the next morning it's gone — the design snapped back to how it was. Nine times out of ten nobody touched it: that database has **"Inherit design from template"** set, and the server's **Designer task** **refreshed** the master template's design overnight, taking your change down with it.

Template inheritance is one of Domino's most powerful and most bite-prone mechanisms: change a template once and hundreds of databases update; but the same mechanism will quietly eat an ad-hoc change you made on one database if you don't understand it. This piece lays it out — how it works, Refresh vs Replace, and how to protect what you don't want overwritten.

---

## TL;DR

- **Master template**: an NTF with the **"Database is a template"** property set and a template name. It's what **automatically distributes** design changes to the databases that inherit it.
- **How you link**: a database's **Database Properties → Design tab**, check **"Inherit design from template"** and enter the template name. Once linked, that database's design gets refreshed from the template.
- **Who refreshes it**: the server's **Designer task** (`load design` at the console), which runs **daily at 1 AM by default**, aligning every inheriting database to its master template. **Each** server holding inheriting databases needs its own **replica** of the template.
- **Refresh vs Replace**: **Refresh Design** is for databases that inherit; **Replace Design** (File → Application → Replace Design) manually makes a database identical to a template — and it's the **only way to apply a design if the database doesn't inherit**.
- **Protecting elements**: on the template's element, set **"Prohibit design refresh or replace to modify"** plus **"Propagate this prohibition of design change"**, and refresh/replace will skip it.
- **The bite**: if a database inherits, your manual changes on it **get overwritten by the nightly Designer task (or a manual refresh)** — to make changes that stick, **uncheck "Inherit design from template"** first.

## Master templates and the inheritance link

A **master template** is an NTF file with the **"Database is a template"** property checked and a **template name** set. That property is what lets it **automatically distribute** design changes to databases created from it or set to inherit it.

To make an **existing** database inherit a template: open **Database Properties → Design tab**, check **"Inherit design from template,"** and paste the template name into the Template Name field. (The label depends on which dialog you're in: the existing-database property here is "Inherit design from template"; creating a **new** database from a template instead uses the New Database dialog's "Inherit future design changes" option — different contexts, not the same checkbox.) Once linked, HCL is blunt about it — the database's design is **replaced when the server's Designer task runs, or when you manually refresh it**.

## Who refreshes it: the Designer task (load design)

The design doesn't travel on its own; the **Designer task** on the server distributes it. It [synchronizes inheriting databases with the master template](https://help.hcl-software.com/domino/10.0.1/admin/admn_synchronizingdatabaseswithmastertemplates_t.html):

- It runs **automatically at 1 AM daily by default** (which is why the design "changed by morning").
- You can trigger it manually at the console: **`load design`**.
- The key prerequisite: **every** server holding inheriting databases **needs a replica of that master template**; without the replica, that server's Designer task can't update them.

This is the same family as updall and dbmt — **scheduled server tasks** that do one thing to a batch of databases at a fixed hour. The Designer task's job just happens to be "align designs to the template."

## Refresh Design vs Replace Design

The two get conflated, but they have distinct jobs ([official: making and distributing design changes](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_ABOUT_MAKING_AND_DISTRIBUTING_DESIGN_CHANGES.html)):

- **Refresh Design**: for databases that **inherit** — it **pushes** the master template's design to the databases inheriting it (the same thing the Designer task does).
- **Replace Design**: **manually** makes a database **identical to a template** ([official: replacing a design](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html)). The point: **if a database doesn't inherit, Replace Design is the only way to get a design into it**. Steps: select the database → File → Application → Replace Design → pick the template → Replace, confirm.

A simple way to remember it: Refresh = "keep aligning to the template"; Replace = "make it this template right now."

## How to protect elements you don't want overwritten

Inheritance is convenient, but there are always a few elements you want to hand-maintain on individual databases and keep the template from clobbering. You set this on the **template** side:

- On that element's design properties in the template, check **"Prohibit design refresh or replace to modify."** HCL's caveat: for it to actually take effect, **also check "Propagate this prohibition of design change"** so the prohibition travels down. Then refresh/replace will **skip** that element.
- Separately, an element set at the **element level** to **"Inherit from the design template"** pointing at a template is **not** overwritten during Replace Design, even without the prohibition above.

## A few things that bite

- **Your manual changes get overwritten**: as long as a database inherits, design changes on that individual database can be overwritten by the **nightly Designer task or a single refresh**. To make a change that sticks on one database, go to its Design tab and **uncheck "Inherit design from template"** first.
- **Don't put private agents / private folders in a template**: their changes can't be distributed, and you'll get error messages when the design is refreshed/replaced.
- **The icon, About, and Using documents don't inherit by default**: a template usually doesn't control the database icon or the About/Using documents. To make those inherit too, go to Designer's **Other → Database Resources**, select the item, and set it to inherit from the template in its Properties.
- **Leave the original template's properties alone**: to customize, make a copy with **File → Application → New Copy** and link to the copy — don't modify the original template that a pile of databases is already inheriting.

## Wrap-up

- **Master template**: NTF + "Database is a template" + a template name, distributes design automatically.
- **Linking**: a database's Design tab, check "Inherit design from template" + the template name.
- **Who refreshes**: the Designer task (`load design`), **1 AM daily by default**; **every** server with inheriting databases needs a replica of the template.
- **Refresh vs Replace**: Refresh aligns inheriting databases; Replace manually swaps the whole design — **the only route when there's no inheritance**.
- **Protecting elements**: on the template, "Prohibit design refresh or replace" + "Propagate"; an element set to "Inherit from the design template" is skipped too.
- **The bite**: if it inherits, manual changes get overwritten by the nightly Designer task — uncheck inheritance first; keep private agents/folders out of templates; the icon/About/Using don't inherit by default.
