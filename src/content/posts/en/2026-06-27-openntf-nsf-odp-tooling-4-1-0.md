---
title: "NSF ODP Tooling: Build Domino NSFs from Source, No Designer Required"
description: "NSF ODP Tooling is an OpenNTF project that turns a binary NSF into a file-system On-Disk Project you can keep in Git, then compiles it back into a full NSF without Domino Designer — bringing real version control and CI/CD to Domino. Here's what it is, how the Maven plugin and container-based compilation work, and what the 4.1.0 release actually changed."
pubDate: "2026-06-27T11:45:02+08:00"
lang: "en"
slug: "openntf-nsf-odp-tooling-4-1-0"
tags:
  - "Domino Designer"
  - "Java"
  - "DevOps"
  - "Tutorial"
sources:
  - title: "NSF ODP Tooling — OpenNTF project page"
    url: "https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Fsummary"
  - title: "OpenNTF/org.openntf.nsfodp — GitHub repository"
    url: "https://github.com/OpenNTF/org.openntf.nsfodp"
  - title: "NSF ODP Tooling 4.1.0 — GitHub release notes"
    url: "https://github.com/OpenNTF/org.openntf.nsfodp/releases/tag/4.1.0"
  - title: "Setting Domino Designer Source Control user preferences — HCL Docs"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/user/wpd_designer_prefs_source_control.html"
cover: "/covers/openntf-nsf-odp-tooling-4-1-0.webp"
coverStyle: "low-poly-3d"
---
If you've ever tried to put a Domino application under version control, you've hit the wall: an NSF is a binary container, Domino Designer is a GUI-only IDE, and Git has nothing useful to diff. NSF ODP Tooling is the OpenNTF project that knocks that wall down. It's not widely known in the Taiwan Domino community, so this piece is a full introduction — what it is, how it works, and what the latest 4.1.0 release brought — rather than a release blurb.

## TL;DR

- **NSF ODP Tooling** converts a binary NSF into an *On-Disk Project* (ODP) — a folder of text/XML design files you can commit to Git — and compiles an ODP back into a complete NSF **without Domino Designer**.
- That unlocks the things Designer can't do: meaningful diffs, branch-and-merge, and **headless compilation in CI/CD** (Jenkins, GitHub Actions, GitLab CI).
- It runs as a **Maven plugin**, with three execution modes — a Domino server, a Docker container, or a local Notes/Domino install.
- The **4.1.0** release is a maintenance-and-polish update: better Docker-based compilation, configurable locale/time-zone for build timestamps, ACL entry-type configuration, and dependency cleanup.

## The problem, and what Designer already solves

A traditional Domino developer lives inside Domino Designer. Designs — forms, views, agents, XPages, script libraries — are stored inside the NSF in a binary format. Out of the box that makes the modern toolchain awkward: you can't `git diff` a binary NSF, two developers can't branch-and-merge design changes, and compilation has historically meant the Designer GUI.

But Designer is *not* a complete dead end, and it's worth being precise about that. Since the 9.0.x era it ships a built-in **Source Control** feature — File ▸ Preferences ▸ Domino Designer ▸ Source Control — that ties an NSF to an on-disk project and keeps the two in sync. Three preferences matter ([HCL's documentation](https://help.hcl-software.com/dom_designer/9.0.1/user/wpd_designer_prefs_source_control.html) covers them):

- **Enable automatic export of design elements (NSF → disk)** — edits inside the NSF are written out to the on-disk project automatically.
- **Enable automatic import of design elements (disk → NSF)** — changes on disk are pulled back into the NSF (with auto-build on).
- **Use binary DXL for source control operations** — on by default, and this is the one to know about. **Deselect it** and design elements export as *text* DXL: human-readable, and mergeable with ordinary Git tooling. Leave it on and you get binary DXL, which round-trips with perfect fidelity but can't be diffed or merged.

So the version-control half is achievable in Designer alone, and plenty of teams run exactly that — binary DXL off, design elements committed as text. The tradeoff, which both the HCL docs and long-time practitioners flag, is fidelity: a few element types don't round-trip cleanly as text (a JavaScript library inserted as a resource can export as an empty shell), so you accept some lossiness in exchange for mergeable source.

The limit that *remains* is the important one. Designer's on-disk project still needs **Designer itself** — a GUI IDE on a developer's machine — to compile the project back into an NSF. You can't point a headless build agent at it. That's the gap NSF ODP Tooling fills.

## What an "On-Disk Project" actually is

An **On-Disk Project (ODP)** is the file-system representation of an NSF's design. Instead of one opaque binary, you get a directory tree: forms and views as DXL/XML, LotusScript libraries as source files, Java and XPages as their normal source artifacts, plus the file resources, images, and the database's ACL and properties. The format is Designer-compatible — Designer itself can sync an NSF to and from an on-disk project — but NSF ODP Tooling lets you operate on that same structure *outside* Designer, which is the whole point.

Because every element is now text on disk, Git treats a Domino app like any other codebase: line-level diffs, blame, pull requests, the lot.

## The three things it does

The [NSF ODP Tooling project](https://github.com/OpenNTF/org.openntf.nsfodp) ships three cooperating pieces:

1. **ODP Compiler** — takes an on-disk project and produces a complete NSF. It resolves classic design elements, XPages, and OSGi[^osgi] plugin dependencies along the way.
2. **ODP Exporter** — the reverse direction: it exports an existing NSF into a Designer-compatible ODP, so you can bring a legacy application into source control for the first time.
3. **Maven and Eclipse integration** — a Maven plugin (`org.openntf.maven:nsfodp-maven-plugin`) that drives compilation and deployment in a build, plus Eclipse plugins that add XPages autocompletion and compile/deploy actions to the IDE. There's also an NSF deployment service for pushing compiled NSFs to a server without the Notes client, and an XSP transpiler that turns XPages and Custom Controls into plain Java source.

## How you actually use it

In practice you adopt the `domino-nsf` Maven packaging and configure the plugin in your `pom.xml`:

```xml
<plugin>
  <groupId>org.openntf.maven</groupId>
  <artifactId>nsfodp-maven-plugin</artifactId>
  <version>4.1.0</version>
  <extensions>true</extensions>
</plugin>
```

The useful Maven goals are `compile` (ODP → NSF), `export-odp` (NSF → ODP), `transpile-xsp` (XPages → Java), and `deploy` (push the built NSF to a server). Compilation itself needs a Domino runtime to resolve design elements, and the tooling gives you three ways to provide one:

- **Container-based** — the headline feature added in the 4.0 line. Compilation runs inside a Docker container holding the Domino runtime, so a build agent needs *no* local Notes or Designer install. This is the most CI-friendly path.
- **Remote** — point the build at a dedicated Domino server that has the tooling's update site installed.
- **Local** — use a local Notes/Domino installation, with the program and platform directories configured in the plugin.

The general requirements are Maven 3.x and a modern JDK; the server-side pieces target Domino 9.0.1 FP10 and above. Container-based execution is the route most teams will want, precisely because it removes the "you must have Notes installed on the build machine" constraint that made Domino CI painful for years.

## What 4.1.0 actually changed

This is worth stating carefully, because the headline version number suggests more drama than the changelog delivers — 4.1.0 is a focused maintenance release. Per the [4.1.0 release notes](https://github.com/OpenNTF/org.openntf.nsfodp/releases/tag/4.1.0), the substantive changes are:

- **Docker-based compilation improvements** and GitHub Actions build scaffolding, continuing the container-first direction set in 4.0.
- **Locale and time-zone configuration** — new `timeZone` and locale properties for containers and for the timestamps written into builds, plus a configurable title-timestamp format, all driven from the Maven side.
- **ACL configuration** — support for setting an `aclEntry` type in the ACL config.
- **Correct PNG image-resource handling** and a fix for local Maven repository location lookup.
- **Dependency cleanup** — removal of the `com.ibm.commons.xml` dependency and several dependency bumps.
- **Internal refactor** — ODP-manipulation routines consolidated into an `OnDiskProject` class, plus improved parent-template name logic.

Nothing here changes how you adopt the tool; it's the kind of release you take to smooth out container builds and tighten configuration. The thread-safety work some summaries attribute to 4.1.0 (switching `JavaSourceClassLoader` to `ConcurrentHashMap` to fix a `ConcurrentModificationException`) actually landed earlier, in the 4.0.x line — a good reminder to read the release tag rather than trust a generated summary.

## Who should care

If you maintain Domino applications and want them to behave like real software projects — code review on design changes, automated builds, reproducible deployments — NSF ODP Tooling is the bridge. It is Apache 2.0 licensed and actively maintained; the [project page on OpenNTF](https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Fsummary) links the downloads and documentation. For a Taiwan team still doing everything through Designer, container-based compilation alone is reason enough to take a look: it's the difference between "we deploy by replacing design in the client" and "our pipeline builds and ships the NSF on every merge."

[^osgi]: OSGi is the Java module/plugin framework that the Domino server and Designer are built on; NSF ODP Tooling has to resolve OSGi plugin dependencies when compiling XPages and Java design elements.
