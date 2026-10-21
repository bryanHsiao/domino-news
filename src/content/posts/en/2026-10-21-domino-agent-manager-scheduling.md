---
title: "Why Your Scheduled Agent Doesn't Run (or Runs Late): Agent Manager's Day/Night Windows, Concurrency, Execution Limits, and Tell Amgr"
description: "You schedule an agent to run hourly, and it doesn't run, runs late, or gets killed mid-run — usually it's not the agent that's broken, it's the Agent Manager (AMgr) server task's settings governing it. This piece covers how AMgr schedules: the Server document's daytime/nighttime windows (default day 8AM–8PM, night 8PM–8AM) and the most common trap — if the two periods leave a gap, AMgr doesn't run scheduled agents during it; Max concurrent agents (1–10, default day 1 / night 2) and Max LotusScript/Java execution time (default day 10 min, night 15 min — over it, the agent is terminated and logged in the Agent Log); why document/mail triggers aren't instant (AMgr_DocUpdateEventDelay, AMgr_DocUpdateAgentMinInterval default 30 min, and other notes.ini throttles); what 'Agent scheduling is paused' means; and using Tell Amgr Schedule / Tell Amgr Status from the console to see whether it was even scheduled. Ends with a step-by-step checklist for a scheduled agent that won't run."
pubDate: 2026-10-21T07:30:00+08:00
lang: en
slug: domino-agent-manager-scheduling
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Server Tasks - Agent Manager tab (daytime/nighttime windows, Max concurrent agents, Max LS/Java execution time, Refresh agent cache defaults and the gap behavior) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/othr_servertasksagentmanagertab_r.html"
  - title: "Improving Agent Manager performance (concurrency = Agent Executive, AMgr_SchedulingInterval/DocUpdateEventDelay/DocUpdateAgentMinInterval notes.ini, Agent scheduling is paused) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/tune_improvingagentmanagerperformance_c.html"
  - title: "Agent Manager Tell commands (Tell Amgr Schedule / Tell Amgr Status and other console diagnostics) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_agentmanagertellcommands_r.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-agent-manager-scheduling.webp"
coverStyle: "minimalist-mono"
---

You schedule an agent to run hourly, and it **doesn't run**, **runs late**, or **gets killed mid-run**. The first instinct is "the agent is broken," but on the server, a scheduled agent's fate is really in the hands of another server task — the **Agent Manager (AMgr)**. It decides which window an agent can run in, how many can run at once, and how long each may run. Once you can read AMgr's settings, "why didn't it run" is usually a few minutes of checking.

---

## TL;DR

- **What AMgr is**: the server task that runs **scheduled** and **event-triggered** agents. Its **scheduler polls periodically** (`AMgr_SchedulingInterval`, default **1 minute**); agents run on the **interval you set**, not at an exact time of day, and HCL warns that scheduling very frequently (e.g. every 5 minutes) can hurt performance.
- **Day/night windows**: AMgr's settings come in **daytime / nighttime** pairs, default **day 8:00 AM–8:00 PM, night 8:00 PM–8:00 AM**. The **most common trap**: if the two periods don't meet and leave a **gap**, AMgr **doesn't run scheduled agents** during it (HCL's example: daytime starts 8AM, nighttime ends 5AM → **nothing runs 5AM–8AM**).
- **Concurrency**: **Max concurrent agents** 1–10, default **day 1, night 2**; each slot is run by an **Agent Executive**. Schedule faster than they run and the console shows **"AMgr: Agent scheduling is paused"** until the queue drains.
- **Execution limit**: **Max LotusScript/Java execution time** defaults to **day 10 min, night 15 min**; over it, the agent is **terminated** and recorded in the **Agent Log** — "it vanished mid-run" is often this.
- **Diagnose**: `Tell Amgr Schedule` (what's scheduled today), `Tell Amgr Status` (queue + settings snapshot).
- **Web agents are separate**: browser-triggered agents are controlled by Domino Web Engine's "Run Web agents concurrently?" (notes.ini `DominoAsynchronizeAgents`, off by default) — **unrelated** to scheduled-agent settings.

## What AMgr does

The **Agent Manager (AMgr)** is the server task that runs agents — specifically **scheduled** ones (hourly/daily/by interval) and **event-triggered** ones (new mail, document change). It works by **polling**: periodically it checks which agents are due, queues them, and hands them to executives to run.

Two ideas to establish first: AMgr's scheduler is **poll-based** (`AMgr_SchedulingInterval`, default **1 minute**), and agents run on the **interval you set**, not at an exact clock time; HCL also warns that **scheduling too frequently (e.g. every 5 minutes) can hurt server performance**, so don't treat a scheduled agent as a real-time tool. And a **document create/modify-triggered** agent is **not instant** either — depending on server load, it typically runs after a **5-to-30-minute** delay.

## The most common trap: the day/night gap

AMgr's settings live on the **Server document → Server Tasks → Agent Manager tab**, and they come in **daytime and nighttime** pairs ([official field reference](https://help.hcl-software.com/domino/12.0.0/admin/othr_servertasksagentmanagertab_r.html)):

- **Daytime / Nighttime periods**: default **day 8:00 AM–8:00 PM, night 8:00 PM–8:00 AM** — which by default **meet with no gap**.
- **But if you change the times and they don't meet**: HCL is blunt — in the gap between them, AMgr **does not run scheduled agents**. HCL's example: daytime starts at 8:00 AM and nighttime ends at 5:00 AM, so **no agents run between 5:00 AM and 8:00 AM**.

This is one of the most common reasons "my agent is scheduled but just won't run in a certain window": it isn't broken, it's falling into the gap between the two periods. When troubleshooting, **first check that the daytime and nighttime end/start times line up**.

## Concurrency and the execution limit

The same tab has two more key day/night pairs:

- **Max concurrent agents**: how many agents can run at once, **1–10**, default **day 1, night 2**. Each slot is run by an **Agent Executive**. This is why daytime agents tend to "queue up" — by default only 1 runs at a time. If agents are scheduled faster than they run, the console shows **"AMgr: Agent scheduling is paused"**, and no new ones are scheduled until the queue drains.
- **Max LotusScript/Java execution time**: how long a single LS/Java agent may run, default **day 10 min, night 15 min**. **Over it, the agent is terminated** — and that termination is **recorded in the Agent Log**. So when "an agent vanished mid-run with no error," the first thing to check is whether it timed out — the answer is usually in the Agent Log.

(The tab also has **Refresh agent cache**, default **12:00 AM**, controlling when AMgr rebuilds its daily agent cache; and **Max % busy before delay**, which only applies to R4.6 and earlier servers — ignore it now.)

## Why triggers aren't instant: notes.ini throttles

Event-triggered agents ("run when mail arrives / when a document changes") sound instant, but AMgr has a set of notes.ini settings that **deliberately throttle** them so a flurry of changes doesn't run an agent nonstop ([official: improving Agent Manager performance](https://help.hcl-software.com/domino/11.0.1/admin/tune_improvingagentmanagerperformance_c.html)):

- **`AMgr_SchedulingInterval`**: how often the scheduler runs, default **1 minute** (1–60).
- **`AMgr_DocUpdateEventDelay`**: the delay after a document-update event before the agent runs, default **5 minutes**.
- **`AMgr_DocUpdateAgentMinInterval`**: the **minimum interval between two runs** of the same document-update agent, default **30 minutes** — often the real answer to "I changed a document, why didn't the agent run right away": it's held down by this minimum.
- **`AMgr_NewMailEventDelay`** (default 1 min) and **`AMgr_NewMailAgentMinInterval`** (default 0) are the new-mail equivalents.

When an event-triggered agent "reacts slowly," check these values before touching the agent.

## How to check: Tell Amgr

Rather than guess, ask AMgr directly ([official: Agent Manager Tell commands](https://help.hcl-software.com/domino/11.0.1/admin/admn_agentmanagertellcommands_r.html)):

- **`Tell Amgr Schedule`**: lists **every agent scheduled to run today**. If yours isn't here, it wasn't scheduled at all — go back and check whether it's disabled or whether its database has background agents turned off.
- **`Tell Amgr Status`**: a snapshot of AMgr's queues plus the settings it read from the Server document.

## A "scheduled agent won't run" checklist

Putting it together, when an agent "won't run," check in order:

1. **Is it enabled?** Does its database have background agents disabled?
2. **Does `Tell Amgr Schedule` list it?** If not, it wasn't scheduled — back to step 1.
3. **Is the current time in a day/night gap?** If the periods don't meet, nothing runs in the gap.
4. **Is it queuing?** Daytime Max concurrent defaults to 1, so volume backs up; look for "scheduling is paused."
5. **Did it time out?** Check the **Agent Log** for a termination past the Max execution time.
6. **An event trigger reacting slowly?** Check `AMgr_DocUpdateAgentMinInterval` (default 30 min) and the other throttles.

## Wrap-up

- **AMgr** runs scheduled and event-triggered agents; its scheduler polls (default every 1 minute); scheduling too frequently (e.g. every 5 minutes) hurts performance per HCL; document triggers aren't instant — a 5-to-30-minute delay by load.
- **Day/night windows** default to day 8AM–8PM, night 8PM–8AM; **nothing runs in a gap** between periods — the most common "dead window" cause.
- **Concurrency**: Max concurrent 1–10 (day 1 / night 2); outrun it and you get "scheduling is paused."
- **Execution limit**: Max LS/Java execution time day 10 min / night 15 min; over it the agent is killed and logged in the Agent Log.
- **Throttles**: `AMgr_DocUpdateAgentMinInterval` (default 30 min) and friends decide how fast event triggers react.
- **Diagnose**: `Tell Amgr Schedule`/`Status`; Web agents are governed separately by Domino Web Engine and are unrelated to scheduled agents.
