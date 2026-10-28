---
title: "Hiding a Database Design: Lock It Before You Ship a Template"
description: "You hand a template to a customer or install it on their server, and you don't want anyone seeing or changing the forms, formulas, and LotusScript inside — that's what hiding a database design does. Once set, in HCL's words it 'disables all design operations and hides all formulas and scripts': View > Design disappears, forms/views/agents can't be viewed or changed, formulas and code are invisible, and the design can't even be copied. This piece covers how it's done (via Replace Design with 'Hide formulas and LotusScript,' or inheriting from a template whose design is hidden), what it disables, why it isn't an encryption lock (it's not a permanent barrier to Designer/Manager users — pair it with the ACL), the point with no way back — there is no 'unhide,' so you must keep an unhidden copy of the template — and how hiding blocks agent changes, so use @Command[AgentEnableDisable]."
pubDate: 2026-10-19T07:30:00+08:00
lang: en
slug: domino-hide-database-design
tags:
  - "Domino Designer"
  - "Admin"
sources:
  - title: "Hiding the design of a database (what hiding disables, how to do it, remove Designer/Manager access, keep an unhidden template) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_HIDING_THE_DESIGN_OF_A_DATABASE.html"
  - title: "Replacing a design (Replace Design with 'Hide formulas and LotusScript' to hide the design) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html"
  - title: "Templates and master templates (the unhidden template is your only source for changing the design) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_TEMPLATES_AND_MASTER_TEMPLATES_.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-hide-database-design.webp"
coverStyle: "paper-craft"
---

You hand a template to a customer, or install it on their server, and you don't want anyone seeing — or changing — the forms, formulas, and LotusScript inside. That's what **hiding a database design** does. Once set, the whole database's design is sealed: the designer tools won't open it, and the formulas and code are invisible.

This is the natural sequel to the last piece, [template inheritance](/domino-news/en/posts/domino-template-inheritance-design-task/): a template **distributes** the design, and hiding the design **protects** the intellectual property inside it when you hand the finished thing over. But it has one point many people don't grasp until it's too late — **there is no "unhide."**

---

## TL;DR

- **What it does**: in HCL's words, hiding the design **"disables all design operations and hides all formulas and scripts."** View > Design disappears; forms, views, and agents can't be viewed or changed; formulas/LotusScript/simple-action formulas are invisible; the design can't even be copied or replicated.
- **How to do it**: from a template, build the database, then **File → Application → Replace Design**, check **"Inherit future design changes"** + **"Hide formulas and LotusScript"** → Replace. Or have the database **inherit a template whose design is already hidden**.
- **It isn't an encryption lock**: for users with **Designer / Manager** access, hiding is **not** a permanent barrier — they can still Replace Design to change it. To actually lock it down, **pair it with the ACL**: remove Designer/Manager access from users who shouldn't change the design.
- **No way back**: there's no "unhide" operation. Your only source for changing the design is **the unhidden copy of the template you kept** — so **keep it, and give it only to authorized designers**.
- **It blocks agents**: hiding blocks agent changes. For an agent that needs user input, set its schedule to **"Choose when agent is enabled"** and provide a button/action using `@Command[AgentEnableDisable]` to enable it.

## What it actually disables

Hiding the design isn't a display control like a hide-when formula on some elements — it **turns off the database's design operations entirely**. [HCL](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_HIDING_THE_DESIGN_OF_A_DATABASE.html) lists what users **cannot** do:

- View any design element's settings (**View > Design disappears**).
- Modify, add, or delete fields, forms, navigators, pages, or subforms.
- Modify or delete existing views; view, delete, or modify existing agents, or add shared agents.
- View or change formulas, LotusScript, or simple-action formulas.
- Change Database Open properties, display a design synopsis, or copy or replicate the design.

In a sentence: the database you shipped **runs, but can't be opened, changed, or copied**.

## How to do it: via Replace Design

Hiding happens **while you apply the design** — specifically, you use **Replace Design** (the operation that swaps a whole database to match a template; see [official: replacing a design](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_REPLACING_A_DESIGN.html)) and check the hide option in the dialog:

1. Build the target database from your template.
2. **File → Application → Replace Design**, and select that template.
3. Check **"Inherit future design changes"** + **"Hide formulas and LotusScript."**
4. Replace → Yes.

After that, you update the hidden database's design through the template it inherits: **you make the change on the unhidden template, then refresh the databases that inherit it** (how inheritance works is in [the template inheritance piece](/domino-news/en/posts/domino-template-inheritance-design-task/)).

## It isn't an encryption lock: pair it with the ACL

This is the most-misunderstood part. Hiding the design **blocks "viewing and changing design" operations**, but it is **not a permanent lock against everyone** — HCL is explicit that users with **Designer or Manager** access "can replace the database design, thereby changing it": they can still swap the whole design with Replace Design.

So to really protect a design, hiding is only the first layer; the second is the **ACL**: [remove Designer/Manager access from the users who shouldn't change the design](/domino-news/en/posts/notes-acl-entry) (HCL's wording: "To fully protect database design, remove Designer and Manager access from users who can change the database design"). Both layers together are what actually locks it.

## No way back: you must keep the unhidden template

Here's the one you regret after shipping: **the official docs provide no "unhide" operation** — there's no "reverse the hide" step anywhere on the page. The only route they give for changing a hidden database's design is through the **unhidden template** it inherits: redesign that, then refresh the linked databases.

Your only source for changing the design is **the unhidden copy of the [template](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ABOUT_TEMPLATES_AND_MASTER_TEMPLATES_.html) you kept** — you change it there, then refresh/replace out to the shipped database. So HCL's caution is very practical:

- **Keep the unhidden template**, and "**do not give the template to anyone except authorized designers**" — don't ship the unhidden template along with the product.
- Don't distribute the documentation for your formulas and LotusScript either.

In a sentence: **the copy you hide is disposable; the master is not** — lose the master, and even you can't change that design.

## Don't forget the agents

Hiding the design **blocks agent changes**, which bites agents that need user input to run. HCL's advice: **test the agents first**; for one that needs a user to trigger it, set the schedule to **"Choose when agent is enabled"** and provide a button or action using `@Command[AgentEnableDisable]` so the user can enable it — because once the design is hidden, you can't go back in to change the agent.

## Wrap-up

- **What it is**: turns off the whole database's design operations — HCL's "disables all design operations and hides all formulas and scripts"; View>Design gone, elements can't be viewed or changed, the design can't be copied.
- **How to do it**: Replace Design with "Inherit future design changes" + "Hide formulas and LotusScript," or inherit a template whose design is already hidden.
- **Not an encryption lock**: not a permanent barrier to Designer/Manager — **pair it with the ACL** by removing their access.
- **No way back**: there's no "unhide"; your only source for changing the design is **the unhidden template you kept** — keep it safe and don't let it out.
- **Blocks agents**: for an agent that needs a user trigger, use "Choose when agent is enabled" + `@Command[AgentEnableDisable]`.
